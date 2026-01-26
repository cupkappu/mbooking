# Cloudflare WARP SSH Deployment

Connects GitHub Actions to your private network via Cloudflare WARP, then SSH to dev server.

## Architecture

```
GitHub Actions                      Cloudflare Zero Trust           Dev Server
    |                                     |                             |
    |  1. cloudflared connect             |  WARP tunnel established   |
    |  +------------------------------->  |  (GitHub Actions joins     |
    |  |                                 |   your private network)     |
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

### 1.1 Create WARP Token

1. Go to [Cloudflare Zero Trust](https://one.dash.cloudflare.com/)
2. Navigate to **Settings** > **WARP**
3. Scroll to **Client enumeration** section
4. Copy the **WARP service token** (or create a new one if needed)

### 1.2 Get Team ID (Optional)

1. Go to **Settings** > **General**
2. Copy the **Team ID** (e.g., `abcdef123456`)

## Step 2: Prepare Dev Server

### 2.1 SSH Configuration

```bash
# /etc/ssh/sshd_config
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AllowUsers deploy
```

### 2.2 Create Deployment User

```bash
sudo adduser deploy
sudo usermod -aG docker deploy
sudo chown -R deploy:deploy /opt/multi-currency-accounting
```

## Step 3: Generate SSH Keys

```bash
ssh-keygen -t ed25519 -C "github-actions@github.com" -f github-actions-key
cat github-actions-key.pub >> /home/deploy/.ssh/authorized_keys
```

## Step 4: Configure GitHub Secrets

Go to **Settings > Secrets and variables > Actions**:

| Secret | Description | Example |
|--------|-------------|---------|
| `CLOUDFLARE_WARP_TOKEN` | WARP service token | `eyJh...` |
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

1. **cloudflared** is installed on GitHub Actions runner
2. **cloudflared warp-svc login --token** authenticates with Cloudflare
3. **cloudflared connect** creates a tunnel - GitHub Actions is now "inside" your private network
4. **ssh deploy@[server-ip]** SSH directly to server (now reachable)
5. **docker-compose** pulls images from GHCR and starts services

## Testing

### Local Test

```bash
# Install cloudflared
curl -L -o /usr/local/bin/cloudflared \
  https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x /usr/local/bin/cloudflared

# Connect to WARP
cloudflared warp-svc login --token your-warp-token
cloudflared connect

# SSH to dev server
ssh deploy@192.168.1.100

# Disconnect when done
cloudflared disconnect
```

## Troubleshooting

### Connection Fails

```bash
# Check cloudflared status
cloudflared warp-svc status

# Verify token
cloudflared warp-svc login --token your-token

# Check logs
journalctl -u cloudflared

# or for the connect command
cloudflared connect --logfile /tmp/cloudflared.log --loglevel debug
```

### SSH Connection Refused

```bash
# Verify server is reachable through WARP
ping 192.168.1.100

# Check SSH is running
ssh deploy@192.168.1.100 -v

# Verify firewall
sudo ufw status
```

### Cannot Access Private IPs

```bash
# Ensure WARP is connected
cloudflared warp-svc status | grep Connected

# Check if routing is working
ip route

# Verify WARP tunnel
cloudflared tunnel list
```
