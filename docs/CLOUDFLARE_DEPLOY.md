# Tailscale SSH Deployment

Connects GitHub Actions to your private network via Tailscale, then SSH to dev server.

## Architecture

```
GitHub Actions                      Tailscale Network              Dev Server
    |                                     |                             |
    |  1. tailscale/github-action         |  Tailscale mesh network    |
    |  +------------------------------->  |  (GitHub Actions joins     |
    |  |                                 |   your tailnet)             |
    |  |                                 +--------------------------> |
    |  |  2. ssh deploy@[server-ip]       |                             |
    |  +-----------------------------------------------------------> |
    |                                     |                             |
    |                                     |                             |  docker-compose up -d
```

## Prerequisites

1. **Tailscale** account with admin access
2. **Dev server** running Tailscale (joined your tailnet)
3. **GitHub repository** with Actions enabled

## Step 1: Configure Tailscale

### 1.1 Create OAuth Client

1. Go to [Tailscale Admin Console](https://login.tailscale.com/admin/oauth)
2. Click **Generate OAuth client**
3. Configure:
   - **Description**: `GitHub Actions Deploy`
   - **Scopes**: `device:write`, `device:read`
4. Copy the **Client ID** and **Secret**
5. **Important**: Save the secret - it won't be shown again!

### 1.2 Tag Your Dev Server

On your dev server, tag it for CI access:

```bash
# Tag the device
sudo tailscale tag --delete tag:ci 2>/dev/null || true
sudo tailscale tag tag:ci

# Or via admin console:
# Go to Machines > Select dev server > Edit tags > Add tag:ci
```

### 1.3 ACL Configuration

Ensure the tag can access your network. Edit `ACLs` in admin console:

```json
{
  "tagOwners": {
    "tag:ci": ["your-email@domain.com"]
  },
  "acls": [
    {
      "action": "accept",
      "src": ["tag:ci"],
      "dst": ["100.64.0.0/10:*"]  // Allow access to all tailnet IPs
    }
  ]
}
```

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

### 2.3 Get Tailscale IP

Get your dev server's Tailscale IP:

```bash
tailscale ip
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
| `TS_OAUTH_CLIENT_ID` | OAuth Client ID | `abc123...` |
| `TS_OAUTH_SECRET` | OAuth Client Secret | `xyz789...` |
| `DEPLOY_NODE_USER` | SSH username | `deploy` |
| `DEPLOY_NODE_ADDR` | Server Tailscale IP | `100.x.x.x` |
| `DEPLOY_NODE_PATH` | Project directory | `/opt/multi-currency-accounting` |
| `DEPLOY_NODE_SSH_PRIVATE_KEY` | ED25519 private key | `-----BEGIN OPENSSH...` |
| `DEPLOY_NODE_SSH_KNOWN_HOSTS` | Server SSH host key | `100.x.x.x ssh-ed25519...` |

### Getting SSH Known Hosts

```bash
ssh-keyscan -t ed25519 100.x.x.x
```

## How It Works

1. **tailscale/github-action** authenticates with OAuth and connects to your tailnet
2. GitHub Actions is now "inside" your private network
3. **ssh deploy@[tailscale-ip]** SSH directly to server (now reachable)
4. **docker-compose** pulls images from GHCR and starts services

## Testing

### Local Test

```bash
# Install Tailscale
curl -fsSL https://tailscale.com/install.sh | sh

# Connect using OAuth
sudo tailscale up --oauth-client-id abc123 --oauth-secret xyz789

# SSH to dev server
ssh deploy@100.x.x.x

# Disconnect when done
sudo tailscale down
```

## Troubleshooting

### Connection Fails

```bash
# Check Tailscale status
tailscale status

# Verify IP
tailscale ip

# Check if server is online
tailscale ping 100.x.x.x

# Re-authenticate
sudo tailscale down
sudo tailscale up --oauth-client-id abc123 --oauth-secret xyz789
```

### Cannot Access Server

```bash
# Verify server is in tailnet
tailscale status | grep dev-server

# Check ACLs in admin console
# Go to Settings > ACLs

# Verify tag permissions
tailscale tagged-status
```

### SSH Connection Refused

```bash
# Verify server is reachable through Tailscale
ping 100.x.x.x

# Check SSH is running
ssh deploy@100.x.x.x -v

# Verify firewall
sudo ufw status
```

### OAuth Issues

```bash
# Verify OAuth client in admin console
# Go to Settings > OAuth clients

# Regenerate if needed
# Warning: This will invalidate the old secret
```
