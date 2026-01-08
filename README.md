# DoomBot - Deployment Guide

A Discord bot that monitors channels for X (Twitter) links and generates AI-powered daily summaries of news, events, and politics.

## Prerequisites

- Ubuntu 20.04+ (or similar Debian-based distro)
- Node.js 20.x
- PostgreSQL 14+
- A Discord Bot Token
- OpenAI API Key (or custom AI endpoint)

---

## Step 1: Install System Dependencies

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential build tools
sudo apt install -y curl git build-essential

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version
```

---

## Step 2: Install and Configure PostgreSQL

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql <<EOF
CREATE USER discordbot WITH PASSWORD 'your_secure_password_here';
CREATE DATABASE discordbot_db OWNER discordbot;
GRANT ALL PRIVILEGES ON DATABASE discordbot_db TO discordbot;
EOF
```

---

## Step 3: Clone and Setup the Application

```bash
# Create application directory
sudo mkdir -p /opt/discord-summarizer
sudo chown $USER:$USER /opt/discord-summarizer

# Clone or copy your application files
cd /opt/discord-summarizer
# If using git:
# git clone <your-repo-url> .
# Or copy files from your local machine

# Install Node.js dependencies
npm install

# Build the application
npm run build
```

---

## Step 4: Configure Environment Variables

Create the environment file:

```bash
sudo nano /opt/discord-summarizer/.env
```

Add the following content (replace with your actual values):

```env
# Database Configuration
DATABASE_URL=postgresql://discordbot:your_secure_password_here@localhost:5432/discordbot_db

# Discord Bot Token (from Discord Developer Portal)
DISCORD_TOKEN=your_discord_bot_token_here

# Session Secret (generate a random string)
SESSION_SECRET=your_random_session_secret_here

# OpenAI Configuration (Replit AI Integration or direct OpenAI)
AI_INTEGRATIONS_OPENAI_API_KEY=your_openai_api_key_here
AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1

# Optional: Custom AI Provider (for local LLM servers like Ollama)
# CUSTOM_AI_BASE_URL=http://localhost:11434/v1
# CUSTOM_AI_API_KEY=not-needed
```

Secure the environment file:

```bash
chmod 600 /opt/discord-summarizer/.env
```

---

## Step 5: Initialize the Database

```bash
cd /opt/discord-summarizer

# Push the database schema
npm run db:push
```

---

## Step 6: Create Systemd Service

Create the service file:

```bash
sudo nano /etc/systemd/system/discord-summarizer.service
```

Add the following content:

```ini
[Unit]
Description=Discord Summarizer Bot
Documentation=https://github.com/your-repo
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/opt/discord-summarizer
EnvironmentFile=/opt/discord-summarizer/.env
ExecStart=/usr/bin/node dist/index.cjs
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=discord-summarizer

# Security hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/discord-summarizer

# Resource limits
MemoryMax=512M
CPUQuota=50%

[Install]
WantedBy=multi-user.target
```

Set proper ownership:

```bash
sudo chown -R www-data:www-data /opt/discord-summarizer
```

---

## Step 7: Enable and Start the Service

```bash
# Reload systemd to recognize new service
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable discord-summarizer

# Start the service
sudo systemctl start discord-summarizer

# Check status
sudo systemctl status discord-summarizer
```

---

## Step 8: View Logs

```bash
# View live logs
sudo journalctl -u discord-summarizer -f

# View last 100 lines
sudo journalctl -u discord-summarizer -n 100

# View logs from today
sudo journalctl -u discord-summarizer --since today
```

---

## Service Management Commands

```bash
# Start the service
sudo systemctl start discord-summarizer

# Stop the service
sudo systemctl stop discord-summarizer

# Restart the service
sudo systemctl restart discord-summarizer

# Check status
sudo systemctl status discord-summarizer

# Disable auto-start on boot
sudo systemctl disable discord-summarizer

# Enable auto-start on boot
sudo systemctl enable discord-summarizer
```

---

## Updating the Application

```bash
# Stop the service
sudo systemctl stop discord-summarizer

# Navigate to app directory
cd /opt/discord-summarizer

# Pull latest changes (if using git)
# git pull

# Install any new dependencies
npm install

# Rebuild the application
npm run build

# Run database migrations if needed
npm run db:push

# Restart the service
sudo systemctl start discord-summarizer
```

---

## Firewall Configuration (Optional)

If you want to access the web dashboard remotely:

```bash
# Allow port 5000 (or your configured port)
sudo ufw allow 5000/tcp

# Check firewall status
sudo ufw status
```

---

## Reverse Proxy with Nginx (Optional)

For production deployments with SSL:

```bash
# Install Nginx
sudo apt install -y nginx

# Create site configuration
sudo nano /etc/nginx/sites-available/discord-summarizer
```

Add:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and restart:

```bash
sudo ln -s /etc/nginx/sites-available/discord-summarizer /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Troubleshooting

### Service won't start
```bash
# Check logs for errors
sudo journalctl -u discord-summarizer -n 50 --no-pager

# Verify environment file exists and is readable
sudo -u www-data cat /opt/discord-summarizer/.env
```

### Database connection issues
```bash
# Test PostgreSQL connection
psql -h localhost -U discordbot -d discordbot_db

# Check PostgreSQL is running
sudo systemctl status postgresql
```

### Discord bot not connecting
- Verify DISCORD_TOKEN is correct in .env
- Ensure bot has been invited to your server with proper permissions
- Check bot permissions in Discord Developer Portal

### Port already in use
```bash
# Find process using port 5000
sudo lsof -i :5000

# Kill the process if needed
sudo kill -9 <PID>
```

---

## Discord Bot Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to "Bot" section and click "Add Bot"
4. Copy the bot token and add it to your .env file
5. Enable these Privileged Gateway Intents:
   - Message Content Intent
   - Server Members Intent (optional)
6. Go to OAuth2 > URL Generator
7. Select scopes: `bot`, `applications.commands`
8. Select permissions: `Read Messages/View Channels`, `Send Messages`, `Read Message History`
9. Use the generated URL to invite the bot to your server

---

## Configuration via Web Dashboard

Once running, access the web dashboard at `http://your-server-ip:5000`

From the dashboard you can:
- Set the watch channel (where the bot reads X links)
- Set the summary channel (where summaries are posted)
- Configure summary times (multiple times per day)
- Choose AI provider (OpenAI or custom local server)
- Set the AI model to use
- Enable/disable the bot
- View logs and summary history
- Configure AutoPost targets (see below)

---

## AutoPost Feature

The AutoPost feature allows you to monitor X (Twitter) and Truth Social accounts and automatically share new posts to designated Discord channels.

### X (Twitter) API Configuration

For reliable Twitter/X post monitoring, you need to configure an API key. The app supports multiple options in priority order:

#### Option 1: TwitterAPI.io (Recommended)

1. Go to [twitterapi.io](https://twitterapi.io)
2. Sign up (free $0.10 trial available, no credit card required)
3. Copy your API key
4. In the dashboard, go to **Settings > X API** tab
5. Paste your API key in the "TwitterAPI.io API Key" field

**Benefits:**
- No Twitter developer account needed
- Works immediately (no approval process)
- Very affordable: $0.15 per 1,000 tweets (100x cheaper than official X API)
- High reliability with fast response times

#### Option 2: Official X API (Backup)

1. Go to [developer.x.com](https://developer.x.com/en/portal/dashboard)
2. Create a project and app (free tier available)
3. Generate a Bearer Token
4. In the dashboard, go to **Settings > X API** tab
5. Paste your Bearer Token in the "X API Bearer Token" field

**Note:** The official X API is only used as a fallback if TwitterAPI.io is not configured.

#### Option 3: Free Alternatives (Fallback)

If neither API is configured, the app attempts to use free services (Nitter, RSSHub). These are often unreliable and may not work for all accounts.

### How It Works

1. Navigate to the **AutoPost** page in the dashboard
2. Click **Add Account** to configure a new target
3. Configure:
   - **Platform**: X (Twitter) or Truth Social
   - **Handle**: The username to monitor (e.g., realDonaldTrump)
   - **Display Name**: Friendly name for announcements (e.g., "President Trump")
   - **Check Interval**: How often to check (5, 10, 15, 30, or 60 minutes)
   - **Discord Channel ID**: Where to post new content
   - **Announcement Message**: Custom message template (supports {handle}, {displayName}, {platform} placeholders)
   - **Include Embed**: Toggle thumbnail preview on/off

### Template Placeholders

Use these in your announcement message:
- `{handle}` - The account username
- `{displayName}` - The friendly display name you set
- `{platform}` - "twitter" or "truthsocial"

Example: `NEW {displayName} POST!` becomes `NEW President Trump POST!`

### Embed vs Plain Link

- **With Embed (default)**: Discord shows a preview with thumbnail
- **Without Embed**: Link is wrapped in angle brackets `<>` to suppress preview

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `DISCORD_TOKEN` | Yes | Discord bot authentication token |
| `SESSION_SECRET` | Yes | Random string for session encryption |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | Yes* | OpenAI API key |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | No | OpenAI base URL (default: https://api.openai.com/v1) |
| `CUSTOM_AI_BASE_URL` | No | Custom AI server URL (for Ollama, etc.) |
| `CUSTOM_AI_API_KEY` | No | API key for custom AI server |

*Required if using OpenAI provider
