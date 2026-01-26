# Cloudflare SSH Deployment Configuration

This document describes how to configure Cloudflare Zero Trust for SSH access to your dev server and set up the required GitHub secrets.

## Prerequisites

1. **Cloudflare Zero Trust** account with admin access
2. **Dev server** with Docker and docker-compose installed
3. **GitHub repository** with Actions enabled

## Step 1: Set Up Cloudflare Zero Trust

### 1.1 Create a Cloudflare Tunnel

1. Go to [Cloudflare Zero Trust](https://one.dash.cloudflare.com/)
2. Navigate to **Access** > **Tunnels**
3. Click **Add a tunnel** > **Create a new tunnel**
4. Name it `ssh-tunnel` or similar
5. Copy the `cloudflared` install command for your server
6. Run it on your dev server to install and configure the tunnel

### 1.2 Configure SSH Access Through Tunnel

On your dev server, configure cloudflared to expose SSH:

```bash
# Create cloudflared config
sudo mkdir -p /etc/cloudflared
sudo cat > /etc/cloudflared/config.yml <<EOF
tunnel: YOUR_TUNNEL_ID
credentials-file: /etc/cloudflared/YOUR_TUNNEL_ID.json

ingress:
  - hostname: ssh.dev.yourdomain.com
    service: ssh://localhost:22
  - service: http_status:404
EOF

# Install cloudflared as a service
sudo cloudflared service install --file /etc/cloudflared/config.yml
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

### 1.3 Set Up Application in Zero Trust

1. Go to **Access** > **Applications**
2. Click **Add an application**
3. Select **Self-hosted**
4. Configure:
   - Application domain: `ssh.dev.yourdomain.com`
   - Session duration: As needed
5. Add a **Policy**:
   - Name: `Allow GitHub Actions`
   - Action: `Allow`
   - Configure rules (e.g., GitHub organization, IP ranges)

## Step 2: Prepare Dev Server

### 2.1 Install Docker Dependencies

```bash
# Ensure docker
docker-compose is installed compose version

# Or: sudo apt-get install docker-compose
```

### 2.2 Create Deployment User (Optional)

```bash
# Create a dedicated user for deployments
sudo adduser deploy
sudo usermod -aG docker deploy

# Set permissions on project directory
sudo chown -R deploy:deploy /opt/multi-currency-accounting
```

### 2.3 SSH Configuration

On the dev server, ensure SSH allows connections:

```bash
# /etc/ssh/sshd_config
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AllowUsers deploy
```

## Step 3: Generate SSH Keys for GitHub Actions

Generate an ED25519 key pair for GitHub Actions to use:

```bash
# Generate key (no passphrase for CI automation)
ssh-keygen -t ed25519 -C "github-actions-deploy@github.com" -f github-actions-key

# Display public key to add to server
cat github-actions-key.pub

# Add to deploy user's authorized_keys
echo "ssh-ed25519 AAAA... github-actions-deploy@github.com" >> /home/deploy/.ssh/authorized_keys
```

## Step 4: Configure GitHub Secrets

Go to your repository **Settings** > **Secrets and variables** > **Actions** and add:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `DEPLOY_NODE_USER` | SSH username on dev server | `deploy` |
| `DEPLOY_NODE_ADDR` | Server hostname | `ssh.dev.yourdomain.com` |
| `DEPLOY_NODE_PATH` | Project directory | `/opt/multi-currency-accounting` |
| `DEPLOY_NODE_SSH_PRIVATE_KEY` | ED25519 private key | `-----BEGIN OPENSSH PRIVATE KEY-----\n...` |
| `DEPLOY_NODE_SSH_KNOWN_HOSTS` | Server's SSH host key | See below |
| `DEPLOY_NODE_CF_TUNNEL_HOST` | Cloudflare tunnel hostname | `ssh.dev.yourdomain.com` |

### Getting SSH Known Hosts

```bash
# Get the server's host key fingerprint
ssh-keyscan -t ed25519 ssh.dev.yourdomain.com

# Or for the direct server IP if not using Cloudflare DNS
ssh-keyscan -t ed25519 192.168.1.100
```

Add the output to `DEPLOY_NODE_SSH_KNOWN_HOSTS` secret.

## Step 5: Test the Deployment

### Manual Test (Local)

```bash
# Test the deploy script locally
./scripts/deploy-dev.sh
```

### GitHub Actions

1. Go to **Actions** tab
2. Select **Deploy to Dev Server** workflow
3. Click **Run workflow**
4. Select environment (dev/staging)
5. Click **Run workflow**

## Troubleshooting

### SSH Connection Issues

```bash
# Test SSH through cloudflared tunnel manually
cloudflared access tcp \
  --hostname ssh.dev.yourdomain.com \
  --url ssh://localhost:2222

# In another terminal:
ssh -p 2222 deploy@localhost
```

### Docker Permission Errors

```bash
# Ensure user is in docker group
sudo usermod -aG docker $DEPLOY_NODE_USER

# New session required after group addition
su - $DEPLOY_NODE_USER
```

### Image Pull Failures

```bash
# Verify GHCR login
docker login ghcr.io -u $GITHUB_ACTOR -p $GITHUB_TOKEN

# Check image exists
docker pull ghcr.io/org/repo:sha-backend
```

## Architecture

```
GitHub Actions                 Cloudflare Zero Trust           Dev Server
    |                                  |                           |
    |  1. Build images                 |                           |
    |  2. Push to GHCR                |                           |
    |  3. cloudflared access tcp      |  Tunnel                   |
    |  +----------------------------->|-------------------------> |
    |  | SSH over tunnel               |                           |
    |  | 4. Execute deploy script      |                           |
    |  +----------------------------->|-------------------------> |
    |                                  |                           |
    |                                  |                           |  docker-compose up -d
```

## Security Considerations

1. **Use ED25519 keys** - More secure than RSA
2. **No passphrase on CI keys** - Required for automation, but restrict access
3. **Limit GitHub IP ranges** - Configure in Cloudflare Access policy
4. **Rotate keys periodically** - Best practice for security
5. **Use separate user** - deploy user instead of root
