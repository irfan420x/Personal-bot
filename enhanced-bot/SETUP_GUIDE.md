# 🚀 Enhanced Messenger Bot - Setup Guide

This guide will walk you through setting up the Enhanced Multi-Platform Messenger Bot from scratch.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+** - [Download](https://nodejs.org/)
- **Git** - [Download](https://git-scm.com/)
- **Docker & Docker Compose** (optional, for containerized deployment)
- **MongoDB** (local installation or cloud service like MongoDB Atlas)
- **Redis** (optional, for caching and sessions)

## 🔧 Installation

### Step 1: Clone and Setup Project

```bash
# Create project directory
mkdir enhanced-messenger-bot
cd enhanced-messenger-bot

# Copy the enhanced-bot files to this directory
# (All the files we created in the enhanced-bot directory)

# Install dependencies
npm install

# Install TypeScript globally (if not already installed)
npm install -g typescript tsx

# Create necessary directories
mkdir -p logs uploads data temp
```

### Step 2: Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit the configuration file
nano .env  # or use your preferred editor
```

#### Essential Environment Variables

Update the `.env` file with your API keys and configuration:

```env
# Basic Settings
NODE_ENV=development
PORT=3000
LOG_LEVEL=info

# At least one platform must be enabled
TELEGRAM_ENABLED=true
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# AI Provider (at least one recommended)
OPENAI_ENABLED=true
OPENAI_API_KEY=your_openai_api_key

# Database
DATABASE_URL=mongodb://localhost:27017/enhanced-bot

# Security (change these!)
DASHBOARD_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_encryption_key_here
```

### Step 3: Platform Setup

#### Telegram Bot Setup

1. **Create a Bot:**
   - Open Telegram and search for `@BotFather`
   - Send `/newbot` command
   - Follow instructions to create your bot
   - Copy the bot token to your `.env` file

2. **Configure Bot:**
   ```env
   TELEGRAM_ENABLED=true
   TELEGRAM_BOT_TOKEN=1234567890:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
   ```

#### OpenAI Setup (Recommended)

1. **Get API Key:**
   - Go to [OpenAI API](https://platform.openai.com/api-keys)
   - Create a new API key
   - Add it to your `.env` file:

   ```env
   OPENAI_ENABLED=true
   OPENAI_API_KEY=sk-...your-key-here
   OPENAI_MODEL=gpt-3.5-turbo
   ```

## 🗄️ Database Setup

### Option 1: Local MongoDB

```bash
# Install MongoDB (Ubuntu/Debian)
sudo apt update
sudo apt install -y mongodb

# Start MongoDB service
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Verify installation
mongo --eval 'db.runCommand({ connectionStatus: 1 })'
```

### Option 2: MongoDB Atlas (Cloud)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Get connection string and update `.env`:
   ```env
   DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/enhanced-bot
   ```

### Option 3: Docker MongoDB

```bash
# Start MongoDB with Docker
docker run -d \
  --name enhanced-bot-mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  mongo:7
```

## 🚀 Running the Bot

### Development Mode

```bash
# Build the TypeScript code
npm run build

# Start in development mode with auto-reload
npm run dev

# Or start production mode
npm start
```

### Using Docker

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f bot

# Stop services
docker-compose down
```

### Docker Development Environment

```bash
# Start with development profile (includes database UIs)
docker-compose --profile development up -d

# This starts:
# - Enhanced Bot
# - MongoDB
# - Redis  
# - Mongo Express (Database UI on port 8081)
# - Redis Commander (Redis UI on port 8082)
```

## 🎯 Testing the Bot

### Telegram Testing

1. **Find Your Bot:**
   - Open Telegram
   - Search for your bot username
   - Start a conversation

2. **Test Basic Commands:**
   ```
   /start
   /help
   /ai Hello, how are you?
   ```

3. **Test Features:**
   - Send text messages
   - Send images (if AI image analysis is enabled)
   - Try voice messages (if voice features are enabled)

## 🔧 Advanced Configuration

### Additional Platforms

#### WhatsApp Business API

```env
WHATSAPP_ENABLED=true
WHATSAPP_API_TOKEN=your_whatsapp_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
```

#### Discord Bot

```env
DISCORD_ENABLED=true
DISCORD_BOT_TOKEN=your_discord_token
DISCORD_CLIENT_ID=your_client_id
```

### AI Providers

#### Claude AI

```env
CLAUDE_ENABLED=true
CLAUDE_API_KEY=your_claude_api_key
```

#### Ollama (Local LLM)

```bash
# Install Ollama
curl https://ollama.ai/install.sh | sh

# Pull a model
ollama pull llama3

# Update .env
OLLAMA_ENABLED=true
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3
```

### Optional Services

#### Redis (for better performance)

```bash
# Install Redis (Ubuntu/Debian)
sudo apt install redis-server

# Start Redis
sudo systemctl start redis-server

# Update .env
REDIS_ENABLED=true
REDIS_URL=redis://localhost:6379
```

## 📊 Web Dashboard

The bot includes a web dashboard for monitoring and management.

### Access Dashboard

1. **Enable Dashboard:**
   ```env
   WEB_DASHBOARD_ENABLED=true
   DASHBOARD_USERNAME=admin
   DASHBOARD_PASSWORD=your_secure_password
   ```

2. **Access URL:**
   - Open browser to `http://localhost:3000/dashboard`
   - Login with your configured credentials

### Dashboard Features

- Real-time message monitoring
- User management
- Bot analytics and statistics
- Configuration management
- System logs and health monitoring

## 🔒 Security Best Practices

### Production Setup

1. **Change Default Credentials:**
   ```env
   DASHBOARD_PASSWORD=strong_password_here
   JWT_SECRET=long_random_string_here
   ENCRYPTION_KEY=another_long_random_string
   ```

2. **Use Environment-Specific Configs:**
   ```env
   NODE_ENV=production
   ```

3. **Enable HTTPS:**
   - Use a reverse proxy (Nginx)
   - Install SSL certificates
   - Update webhook URLs to use HTTPS

### Rate Limiting

```env
RATE_LIMITING_ENABLED=true
RATE_LIMIT_WINDOW=60000  # 1 minute
RATE_LIMIT_MAX=100       # 100 requests per minute
```

## 🚨 Troubleshooting

### Common Issues

#### 1. "Cannot find module" errors
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### 2. TypeScript compilation errors
```bash
# Check TypeScript configuration
npm run type-check

# Rebuild
npm run build
```

#### 3. Database connection issues
```bash
# Check MongoDB is running
sudo systemctl status mongodb

# Test connection
mongo --eval 'db.runCommand({ connectionStatus: 1 })'
```

#### 4. Bot not responding to messages
- Check bot token is correct
- Verify bot privacy settings in BotFather
- Check logs: `npm run dev` or `docker-compose logs bot`

### Logs and Debugging

```bash
# View application logs
tail -f logs/combined.log

# Debug mode
LOG_LEVEL=debug npm run dev

# Docker logs
docker-compose logs -f bot
```

## 📈 Monitoring (Optional)

### Enable Monitoring Stack

```bash
# Start with monitoring profile
docker-compose --profile monitoring up -d

# Access monitoring tools:
# - Prometheus: http://localhost:9090
# - Grafana: http://localhost:3001 (admin/admin)
```

## 🔄 Updates and Maintenance

### Updating Dependencies

```bash
# Check for updates
npm outdated

# Update packages
npm update

# Rebuild
npm run build
```

### Backup Data

```bash
# MongoDB backup
mongodump --db enhanced-bot --out backup/

# Docker backup
docker exec enhanced-bot-mongodb mongodump --db enhanced-bot --out /backup
```

## 📚 Next Steps

1. **Customize Commands:** Add your own bot commands in `src/commands/`
2. **Add Plugins:** Create custom plugins in `src/plugins/`
3. **Extend Platforms:** Add support for more messaging platforms
4. **Scale Up:** Deploy to cloud platforms (AWS, GCP, Azure)
5. **Monitor:** Set up proper monitoring and alerting

## 🆘 Getting Help

- **Documentation:** Check the full project documentation
- **Issues:** Report bugs on GitHub Issues
- **Community:** Join our Discord community
- **Email:** Contact support@your-domain.com

---

**Congratulations! 🎉**

Your Enhanced Messenger Bot is now ready to use. Start chatting with your bot to see it in action!

## Quick Start Commands

```bash
# Complete setup in one go (after configuring .env)
npm install && npm run build && npm start

# Or with Docker
docker-compose up -d
```

Remember to:
- ✅ Configure at least one messaging platform
- ✅ Set up at least one AI provider  
- ✅ Change default passwords
- ✅ Test basic functionality
- ✅ Check logs for any errors