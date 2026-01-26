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

### 1.1 Create Service Token

1. Go to [Cloudflare Zero Trust](https://one.dash.cloudflare.com/)
2. Navigate to **Access** > **Service Auth**
3. Click **Create Service Token**
4. Configure:
   - **Name**: `github-actions-deploy`
   - **Service Token Duration**: As needed
5. Copy the `Client ID` and `Client Secret`
6. **Important**: Save the secret - it won't be shown again!

### 1.2 Get Organization Name

1. Go to **Settings** > **General**
2. Copy the **Organization name** (e.g., `mycompany`)

### 1.3 Create Enrollment Policy

1. Go to **Devices** > **Enrollment**
2. Click **Add a policy**
3. Configure:
   - **Name**: `Allow GitHub Actions`
   - **Action**: Service Auth
   - **Selector**: Service Token
   - **Value**: Select your service token `github-actions-deploy`

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
| `CLOUDFLARE_ORG` | Zero Trust organization name | `mycompany` |
| `CLOUDFLARE_AUTH_CLIENT_ID` | Service token Client ID | `abc123...` |
| `CLOUDFLARE_AUTH_CLIENT_SECRET` | Service token Client Secret | `xyz789...` |
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

1. **Boostport/setup-cloudflare-warp** installs and configures WARP client
2. **warp-cli connect** connects GitHub Actions to your private network via WARP
3. **ssh deploy@[server-ip]** SSH directly to server (now reachable)
4. **docker-compose** pulls images from GHCR and starts services

## Testing

### Local Test

```bash
# Install WARP client (Ubuntu/Debian)
curl https://pkg.cloudflareclient.com/pubkey.gpg | sudo gpg --yes --dearmor --output /usr/share/keyrings/cloudflare-warp-archive-keyring.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/cloudflare-warp-archive-keyring.gpg] https://pkg.cloudflareclient.com/ $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/cloudflare-client.list
sudo apt-get update && sudo apt-get install cloudflare-warp

# Connect using service token
warp-cli login --organization mycompany --auth-client-id abc123 --auth-client-secret xyz789
warp-cli connect

# SSH to dev server
ssh deploy@192.168.1.100

# Disconnect when done
warp-cli disconnect
```

## Troubleshooting

### Connection Fails

```bash
# Check WARP status
warp-cli status

# Verify service token
warp-cli login --organization mycompany --auth-client-id abc123 --auth-client-secret xyz789

# Check logs
journalctl -u warp-svc

# Re-register if needed
warp-cli registration delete
warp-cli registration new
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
warp-cli status | grep Connected

# Check if routing is working
ip route

# Verify DNS resolution
nslookup 192.168.1.100
```
