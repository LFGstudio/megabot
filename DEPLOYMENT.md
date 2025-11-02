# MegaBot Deployment Guide

This guide will walk you through deploying the MegaViral Discord Bot to various platforms.

## 🚀 Quick Start

### Prerequisites
- Discord Bot Token
- MongoDB Database
- GitHub Repository (for deployment)
- Google Gemini API Key (for LLM-powered onboarding)

## 📋 Environment Variables

Create a `.env` file with the following variables:

```env
# Discord Configuration
DISCORD_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=your_discord_client_id_here
DISCORD_GUILD_ID=your_discord_server_id_here

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/megaviral_bot

# Channel IDs (Get these from Discord)
VERIFICATION_CHANNEL_ID=1234567890123456789
WARMUP_CHANNEL_ID=1234567890123456789
ADMIN_CHANNEL_ID=1234567890123456789
LEADERBOARD_CHANNEL_ID=1234567890123456789
LOGS_CHANNEL_ID=1234567890123456789

# Role IDs (Get these from Discord)
NEW_MEMBER_ROLE_ID=1234567890123456789
WARMING_UP_ROLE_ID=1234567890123456789
CLIPPER_ROLE_ID=1234567890123456789
ADMIN_ROLE_ID=1234567890123456789

# Optional: TikTok API Keys
TIKTOK_API_KEY=your_tiktok_api_key
RAPIDAPI_KEY=your_rapidapi_key

# Google Gemini API Key (Required for LLM-powered onboarding)
GEMINI_API_KEY=AIzaSyCWvKk61YkDpk9Shqp1_kGUdh4O75HpBks

# Bot Settings
NODE_ENV=production
```

## 🔧 Discord Bot Setup

### 1. Create Discord Application
1. Go to https://discord.com/developers/applications
2. Click "New Application"
3. Name it "MegaBot" or similar
4. Go to "Bot" section
5. Click "Add Bot"
6. Copy the bot token

### 2. Set Bot Permissions
Required permissions:
- Send Messages
- Use Slash Commands
- Manage Roles
- Read Message History
- Embed Links
- Attach Files
- Manage Channels

### 3. Invite Bot to Server
Use this URL (replace CLIENT_ID with your bot's client ID):
```
https://discord.com/api/oauth2/authorize?client_id=CLIENT_ID&permissions=8&scope=bot%20applications.commands
```

### 4. Get Channel and Role IDs
1. Enable Developer Mode in Discord
2. Right-click on channels/roles → Copy ID
3. Add IDs to your environment variables

## 🗄️ MongoDB Setup

### Option 1: MongoDB Atlas (Recommended)
1. Go to https://www.mongodb.com/atlas
2. Create a free cluster
3. Create a database user
4. Get connection string
5. Add to `MONGODB_URI`

### Option 2: Local MongoDB
```bash
# Install MongoDB
brew install mongodb/brew/mongodb-community

# Start MongoDB
brew services start mongodb/brew/mongodb-community

# Set URI
MONGODB_URI=mongodb://localhost:27017/megaviral_bot
```

## 🚀 Deployment Options

### Railway Deployment

Railway is the easiest platform for Discord bots.

#### 1. Install Railway CLI
```bash
npm install -g @railway/cli
```

#### 2. Login and Initialize
```bash
railway login
railway init
```

#### 3. Set Environment Variables
```bash
railway variables set DISCORD_TOKEN=your_token
railway variables set MONGODB_URI=your_mongodb_uri
railway variables set DISCORD_CLIENT_ID=your_client_id
railway variables set DISCORD_GUILD_ID=your_guild_id
railway variables set GEMINI_API_KEY=AIzaSyCWvKk61YkDpk9Shqp1_kGUdh4O75HpBks
# ... set all other variables (channel IDs, role IDs, etc.)
```

**Or via Railway Dashboard:**
1. Go to your Railway project
2. Click on your service
3. Go to "Variables" tab
4. Add `GEMINI_API_KEY` with value: `AIzaSyCWvKk61YkDpk9Shqp1_kGUdh4O75HpBks`
5. Add all other required environment variables

#### 4. Deploy
```bash
railway up
```

**Quick Setup Script:**
You can also use the provided script to set all environment variables at once:
```bash
./deploy-env-vars.sh
```

This interactive script will prompt you for all required variables including the Gemini API key.

#### 5. Configure Custom Domain (Optional)
```bash
railway domain add your-domain.com
```

### Render Deployment

#### 1. Connect GitHub
1. Go to https://render.com
2. Connect your GitHub account
3. Import your repository

#### 2. Create Web Service
- Name: megabot
- Environment: Node
- Build Command: `npm install`
- Start Command: `npm start`

#### 3. Set Environment Variables
Add all variables from your `.env` file in the Render dashboard.

#### 4. Deploy
Click "Create Web Service" and wait for deployment.

### Heroku Deployment

#### 1. Install Heroku CLI
```bash
npm install -g heroku
```

#### 2. Create Heroku App
```bash
heroku create your-bot-name
```

#### 3. Set Environment Variables
```bash
heroku config:set DISCORD_TOKEN=your_token
heroku config:set MONGODB_URI=your_mongodb_uri
# ... set all other variables
```

#### 4. Deploy
```bash
git push heroku main
```

## 🔍 Verification

### 1. Check Bot Status
- Bot should appear online in Discord
- Check logs for any errors

### 2. Test Commands
Try these commands in Discord:
- `/verify submit` - Test verification system
- `/stats` - Test stats system
- `/leaderboard` - Test leaderboard

### 3. Check Database
Verify that user data is being saved to MongoDB.

## 🛠️ Troubleshooting

### Common Issues

#### Bot Not Responding
- Check if bot token is correct
- Verify bot has proper permissions
- Check server logs for errors

#### Database Connection Failed
- Verify MongoDB URI is correct
- Check if MongoDB cluster is running
- Ensure database user has proper permissions

#### Commands Not Working
- Check if slash commands are registered
- Verify bot has "Use Slash Commands" permission
- Restart the bot to re-register commands

#### Role Assignment Failed
- Check if bot role is higher than target roles
- Verify role IDs are correct
- Ensure bot has "Manage Roles" permission

### Logs and Monitoring

#### Railway
```bash
railway logs
```

#### Render
Check logs in the Render dashboard.

#### Heroku
```bash
heroku logs --tail
```

## 📈 Scaling

### Performance Optimization
- Use connection pooling for MongoDB
- Implement rate limiting for API calls
- Cache frequently accessed data

### Monitoring
- Set up uptime monitoring
- Monitor memory usage
- Track error rates

### Backup Strategy
- Regular MongoDB backups
- Environment variable backups
- Code repository backups

## 🔒 Security

### Best Practices
- Never commit `.env` files
- Use strong MongoDB passwords
- Rotate bot tokens regularly
- Limit bot permissions to minimum required

### Environment Security
- Use production MongoDB clusters
- Enable MongoDB authentication
- Use HTTPS for all connections

## 📞 Support

If you encounter issues:
1. Check the logs for error messages
2. Verify all environment variables are set
3. Test with the provided test flow
4. Contact the development team

## 🎉 Success!

Once deployed successfully, your MegaBot should be:
- ✅ Online in Discord
- ✅ Responding to commands
- ✅ Saving data to MongoDB
- ✅ Running automated tasks
- ✅ Managing user roles

Your Discord bot is now ready to manage the MegaViral clipping community!
