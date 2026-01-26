#!/bin/bash
# deploy-dev.sh - Deploy to dev server via Cloudflare SSH tunnel
# Usage: ./scripts/deploy-dev.sh [sha]
#
# This script is executed from GitHub Actions via SSH over Cloudflare tunnel
# It requires these environment variables or arguments:
#   DEPLOY_NODE_USER - SSH username
#   DEPLOY_NODE_PATH - Project directory on server
#   IMAGE_TAG - Docker image tag to deploy (default: current SHA)
#   GITHUB_TOKEN - For pulling images from GHCR

set -e

echo "=== Multi-Currency Accounting Dev Deployment ==="
echo "Timestamp: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"

# Configuration
IMAGE_TAG="${IMAGE_TAG:-${GITHUB_SHA:-latest}}"
PROJECT_DIR="${DEPLOY_NODE_PATH:-/opt/multi-currency-accounting}"
REGISTRY="ghcr.io"
IMAGE="ghcr.io/${{ github.repository }}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Pre-flight checks
log_info "Running pre-flight checks..."

if [ ! -d "$PROJECT_DIR" ]; then
    log_error "Project directory does not exist: $PROJECT_DIR"
    exit 1
fi

cd "$PROJECT_DIR"
log_info "Working directory: $(pwd)"

# Login to container registry
log_info "Logging into GitHub Container Registry..."
echo "$GITHUB_TOKEN" | docker login "$REGISTRY" -u "$GITHUB_ACTOR" --password-stdin

# Pull latest images from GHCR
log_info "Pulling latest backend image: ${IMAGE}:${IMAGE_TAG}-backend"
docker pull "${IMAGE}:${IMAGE_TAG}-backend"

log_info "Pulling latest frontend image: ${IMAGE}:${IMAGE_TAG}-frontend"
docker pull "${IMAGE}:${IMAGE_TAG}-frontend"

# Tag images for local use
log_info "Tagging images for docker-compose..."
docker tag "${IMAGE}:${IMAGE_TAG}-backend" "${IMAGE}-backend:latest"
docker tag "${IMAGE}:${IMAGE_TAG}-frontend" "${IMAGE}-frontend:latest"

# Stop existing containers
log_info "Stopping existing containers..."
docker-compose -f docker-compose.test.yml down --remove-orphans || true

# Remove old images to free space
log_info "Cleaning up old images..."
docker images -f "reference=${IMAGE}" -f "before=${IMAGE}:${IMAGE_TAG}-backend" -q | xargs -r docker rmi || true
docker images -f "reference=${IMAGE}" -f "before=${IMAGE}:${IMAGE_TAG}-frontend" -q | xargs -r docker rmi || true

# Start services
log_info "Starting services..."
docker-compose -f docker-compose.test.yml up -d

# Wait for services to be healthy
log_info "Waiting for services to be healthy..."
TIMEOUT=120
ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
    if docker-compose -f docker-compose.test.yml ps | grep -q "healthy"; then
        log_info "All services are healthy!"
        break
    fi
    echo "Waiting for services... (${ELAPSED}s / ${TIMEOUT}s)"
    sleep 5
    ELAPSED=$((ELAPSED + 5))
done

if [ $ELAPSED -ge $TIMEOUT ]; then
    log_warn "Timeout waiting for services - checking status..."
    docker-compose -f docker-compose.test.yml ps
fi

# Final status
log_info "=== Deployment Complete ==="
echo ""
echo "Services:"
docker-compose -f docker-compose.test.yml ps
echo ""
log_info "Backend: http://localhost:8067"
log_info "Frontend: http://localhost:8068"
