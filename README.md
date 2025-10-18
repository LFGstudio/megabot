# MegaViral Discord Bot

A comprehensive Discord bot for managing the MegaViral clipping community, featuring automated onboarding, TikTok stats tracking, and payout management.

## 🚀 Features

- **Account Verification**: Automated verification process with staff approval
- **Warm-up Phase Tracking**: Monitor user progress through the warm-up phase
- **TikTok Integration**: Connect TikTok accounts for automatic stats tracking
- **View Tracking**: Separate tracking for Tier 1 views (US, UK, CA, AU, NZ) and total views
- **Payout Calculation**: Automated payout calculations based on Tier 1 views
- **Leaderboard System**: Daily leaderboard updates with top performers
- **Role Management**: Automatic role assignment and access management
- **Admin Tools**: Comprehensive admin commands for user management

## 🛠️ Tech Stack

- **Node.js** - Runtime environment
- **Discord.js v14** - Discord API wrapper
- **MongoDB** - Database with Mongoose ODM
- **node-cron** - Scheduled tasks
- **TikTok API/RapidAPI** - TikTok data fetching

## 📋 Prerequisites

- Node.js 16.0.0 or higher
- MongoDB database
- Discord Bot Token
- Discord Application with proper permissions

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd discord-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   DISCORD_TOKEN=your_discord_bot_token
   DISCORD_CLIENT_ID=your_discord_client_id
   DISCORD_GUILD_ID=your_discord_server_id
   MONGODB_URI=mongodb://localhost:27017/megaviral_bot
   ```

4. **Set up Discord Bot**
   - Create a new application at https://discord.com/developers/applications
   - Create a bot and copy the token
   - Invite the bot to your server with these permissions:
     - Send Messages
     - Use Slash Commands
     - Manage Roles
     - Read Message History
     - Embed Links
     - Attach Files
     - Manage Channels

5. **Set up MongoDB**
   - Install MongoDB locally or use MongoDB Atlas
   - Update the `MONGODB_URI` in your `.env` file

## 🚀 Running the Bot

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## 📊 Commands

### User Commands
- `/verify submit` - Submit account for verification
- `/verify warmup` - Submit warm-up completion proof
- `/tiktok connect` - Connect TikTok account for stats tracking
- `/stats` - View your TikTok stats and payout information
- `/leaderboard` - View the top clippers leaderboard

### Admin Commands
- `/verify approve` - Approve user verification or warm-up
- `/payouts generate` - Generate monthly payout calculations

## 🏗️ Project Structure

```
src/
├── commands/           # Slash command implementations
│   ├── verify/        # Verification commands
│   ├── tiktok/        # TikTok integration commands
│   ├── stats/         # Stats viewing commands
│   ├── leaderboard/   # Leaderboard commands
│   └── payouts/       # Payout management commands
├── events/            # Discord event handlers
├── handlers/          # Command and event handler systems
├── models/            # MongoDB data models
├── utils/             # Utility functions and services
├── config/            # Configuration files
└── client/            # Bot client implementation
```

## 🔄 Automated Tasks

The bot includes several automated cron jobs:

- **Stats Update**: Every 12 hours (6 AM and 6 PM UTC)
- **Leaderboard Update**: Daily at 12 PM UTC
- **Health Check**: Every hour

## 🚀 Deployment

### Railway Deployment

1. **Connect to Railway**
   ```bash
   npm install -g @railway/cli
   railway login
   railway init
   ```

2. **Set Environment Variables**
   ```bash
   railway variables set DISCORD_TOKEN=your_token
   railway variables set MONGODB_URI=your_mongodb_uri
   # ... set other variables
   ```

3. **Deploy**
   ```bash
   railway up
   ```

### Render Deployment

1. Connect your GitHub repository to Render
2. Set environment variables in the Render dashboard
3. Deploy with the start command: `npm start`

## 🔧 Configuration

### Channel IDs
Update these in your `.env` file:
- `VERIFICATION_CHANNEL_ID` - Channel for verification requests
- `WARMUP_CHANNEL_ID` - Channel for warm-up submissions
- `ADMIN_CHANNEL_ID` - Channel for admin notifications
- `LEADERBOARD_CHANNEL_ID` - Channel for daily leaderboard
- `LOGS_CHANNEL_ID` - Channel for bot logs

### Role IDs
Update these in your `.env` file:
- `NEW_MEMBER_ROLE_ID` - Role for new members
- `WARMING_UP_ROLE_ID` - Role for users in warm-up phase
- `CLIPPER_ROLE_ID` - Role for verified clippers
- `ADMIN_ROLE_ID` - Role for administrators

## 📈 TikTok Integration

The bot includes placeholder implementations for TikTok API integration. To enable real TikTok data fetching:

1. **RapidAPI Integration**
   - Sign up for RapidAPI
   - Subscribe to a TikTok scraper service
   - Add your API key to the environment variables

2. **Custom Implementation**
   - Implement your own TikTok scraping solution
   - Update the `TikTokAPI` class in `src/utils/tiktokAPI.js`

## 🧪 Testing

Run the test flow to simulate the complete user verification process:

```bash
npm test
```

This will test:
- User verification submission
- Admin approval process
- Role assignment
- Stats tracking
- Payout calculations

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For support, please contact the development team or create an issue in the repository.
