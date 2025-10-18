#!/bin/bash

echo "🚀 Deploying MegaBot to Railway..."

# Login to Railway (will open browser)
echo "📝 Please login to Railway in your browser..."
railway login

# Initialize Railway project
echo "🔧 Initializing Railway project..."
railway init

# Set environment variables
echo "⚙️ Setting environment variables..."
echo "Please set these variables in Railway dashboard or run these commands:"
echo ""
echo "railway variables set DISCORD_TOKEN=your_discord_bot_token"
echo "railway variables set DISCORD_CLIENT_ID=your_discord_client_id"
echo "railway variables set DISCORD_GUILD_ID=your_discord_server_id"
echo "railway variables set MONGODB_URI=your_mongodb_uri"
echo ""
echo "📋 Required Environment Variables:"
echo "- DISCORD_TOKEN (from Discord Developer Portal)"
echo "- DISCORD_CLIENT_ID (from Discord Developer Portal)"
echo "- DISCORD_GUILD_ID (your Discord server ID)"
echo "- MONGODB_URI (from MongoDB Atlas or Railway's MongoDB)"
echo ""
echo "📋 Optional Channel/Role IDs (get from Discord):"
echo "- VERIFICATION_CHANNEL_ID"
echo "- WARMUP_CHANNEL_ID"
echo "- ADMIN_CHANNEL_ID"
echo "- LEADERBOARD_CHANNEL_ID"
echo "- LOGS_CHANNEL_ID"
echo "- NEW_MEMBER_ROLE_ID"
echo "- WARMING_UP_ROLE_ID"
echo "- CLIPPER_ROLE_ID"
echo "- ADMIN_ROLE_ID"
echo ""

# Deploy
echo "🚀 Deploying to Railway..."
railway up

echo "✅ Deployment complete!"
echo "🔗 Your bot should be online now!"
echo "💡 Check Railway dashboard for logs and status."
