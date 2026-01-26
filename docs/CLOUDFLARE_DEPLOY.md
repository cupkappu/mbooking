# Cloudflare WARP SSH Deployment

Connects GitHub Actions to your private network via Cloudflare Zero Trust WARP, then SSH to dev server.

## Architecture

```
GitHub Actions                      Cloudflare Zero Trust           Dev Server
    |                                     |                             |
    |  1. warp-cli connect                |                             |
    |  +------------------------------->  |  WARP tunnel established   |
    |  |                                 +--------------------------> |
    |  |  2. ssh deploy@[server-ip]       |                             |
    |  +-----------------------------------------------------------> |
    |                                     |                             |
    |                                     |                             |  docker-compose up -d
```

## Prerequisites

1. **Cloudflare Zero Trust** with WARP enabled
2. **Dev server** on your private network (SSH port accessible)
3. **GitHub repository** with Actions enabled

## Step 1: Configure Cloudflare Zero Trust

### 1.1 Create API Token

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **My Profile** > **API Tokens**
3. Create a new token with:
   - **Permissions**: `Account` > `WARP` > `Edit`
   - **Account**: Your Cloudflare account
4. Copy the token

### 1.2 Configure WARP Settings

1. Go to **Zero Trust** > **Settings** > **WARP**
2. Enable **Browser Access** or **WARP client**
3. Configure device settings as needed

### 1.3 Create Enrollment Policy (Optional)

1. Go to **Devices** > **Enrollment**
2. Create a policy to allow GitHub Actions IPs:
   - Action: Allow
   - Selector: IP range
   - Value: GitHub Actions IP ranges

## Step 2: Prepare Dev Server

### 2.1 SSH Configuration

Ensure your dev server accepts SSH connections:

```bash
# /etc/ssh/sshd_config
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AllowUsers deploy
```

### 2.2 Create Deployment User

```bash
# Create a dedicated user
sudo adduser deploy
sudo usermod -aG docker deploy

# Set permissions
sudo chown -R deploy:deploy /opt/multi-currency-accounting
```

## Step 3: Generate SSH Keys

```bash
# Generate ED25519 key (no passphrase for CI)
ssh-keygen -t ed25519 -C "github-actions@github.com" -f github-actions-key

# Add public key to server
cat github-actions-key.pub >> /home/deploy/.ssh/authorized_keys
```

## Step 4: Configure GitHub Secrets

Go to **Settings > Secrets and variables > Actions**:

| Secret | Description | Example |
|--------|-------------|---------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token | `abc123...` |
| `DEPLOY_NODE_USER` | SSH username | `deploy` |
| `DEPLOY_NODE_ADDR` | Server IP (private network) | `192.168.1.100` |
| `DEPLOY_NODE_PATH` | Project directory | `/opt/multi-currency-accounting` |
| `DEPLOY_NODE_SSH_PRIVATE_KEY` | ED25519 private key | `-----BEGIN OPENSSH...` |
| `DEPLOY_NODE_SSH_KNOWN_HOSTS` | Server SSH host key | `192.168.1.100 ssh-ed25519...` |

### Getting SSH Known Hosts

```bash
ssh-keyscan -t ed25519 192.168.1.100
```

## How It Works

1. **setup-cloudflare-warp** installs WARP client
2. **warp-cli connect** connects GitHub Actions to your private network via WARP
3. **ssh deploy@[server-ip]** SSH directly to server (now reachable)
4. **docker-compose** pulls images from GHCR and starts services

## Testing

### Manual Test

```bash
# Run workflow manually
gh workflow run deploy-dev.yml -f environment=dev
```

### Local Test

```bash
# Install warp-cli
curl -L -o /tmp/cloudflared.deb \
  https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i /tmp/cloudflared.deb

# Connect to WARP
export CLOUDFLARE_API_TOKEN=your-token
warp-cli connect

# SSH to dev server
ssh deploy@192.168.1.100
```

## Troubleshooting

### WARP Connection Fails

```bash
# Check warp-cli status
warp-cli status

# Verify API token
warp-cli account

# Check logs
journalctl -u cloudflared
```

### SSH Connection Refused

```bash
# Verify server is reachable through WARP
ping 192.168.1.100

# Check SSH is running
ssh deploy@192.168.1.100 -v

# Verify firewall rules
sudo ufw status
```

### Cannot Access Private IPs

```bash
# Ensure WARP is connected
warp-cli status | grep Connected

# Check network routes
ip route

# Verify Zero Trust settings
# Go to Zero Trust > Settings > WARP
```
