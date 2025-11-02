#!/bin/bash

# Railway Environment Variables Setup Script
# This script helps you set all required environment variables for Railway deployment

echo "🚀 Setting up Railway environment variables..."
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null
then
    echo "❌ Railway CLI not found. Install it with: npm install -g @railway/cli"
    exit 1
fi

# Check if user is logged in
if ! railway whoami &> /dev/null
then
    echo "❌ Not logged in to Railway. Run: railway login"
    exit 1
fi

echo "✅ Railway CLI found and authenticated"
echo ""

# Set environment variables
echo "📝 Setting environment variables..."

# Discord Configuration
read -p "Enter DISCORD_TOKEN: " DISCORD_TOKEN
railway variables set DISCORD_TOKEN="$DISCORD_TOKEN"

read -p "Enter DISCORD_CLIENT_ID: " DISCORD_CLIENT_ID
railway variables set DISCORD_CLIENT_ID="$DISCORD_CLIENT_ID"

read -p "Enter DISCORD_GUILD_ID: " DISCORD_GUILD_ID
railway variables set DISCORD_GUILD_ID="$DISCORD_GUILD_ID"

# MongoDB
read -p "Enter MONGODB_URI: " MONGODB_URI
railway variables set MONGODB_URI="$MONGODB_URI"

# Gemini API Key
railway variables set GEMINI_API_KEY="AIzaSyCWvKk61YkDpk9Shqp1_kGUdh4O75HpBks"
echo "✅ GEMINI_API_KEY set"

# Channel IDs (optional prompts)
read -p "Enter VERIFICATION_CHANNEL_ID (or press Enter to skip): " VERIFICATION_CHANNEL_ID
if [ ! -z "$VERIFICATION_CHANNEL_ID" ]; then
    railway variables set VERIFICATION_CHANNEL_ID="$VERIFICATION_CHANNEL_ID"
fi

read -p "Enter WARMUP_CHANNEL_ID (or press Enter to skip): " WARMUP_CHANNEL_ID
if [ ! -z "$WARMUP_CHANNEL_ID" ]; then
    railway variables set WARMUP_CHANNEL_ID="$WARMUP_CHANNEL_ID"
fi

read -p "Enter ADMIN_CHANNEL_ID (or press Enter to skip): " ADMIN_CHANNEL_ID
if [ ! -z "$ADMIN_CHANNEL_ID" ]; then
    railway variables set ADMIN_CHANNEL_ID="$ADMIN_CHANNEL_ID"
fi

read -p "Enter LEADERBOARD_CHANNEL_ID (or press Enter to skip): " LEADERBOARD_CHANNEL_ID
if [ ! -z "$LEADERBOARD_CHANNEL_ID" ]; then
    railway variables set LEADERBOARD_CHANNEL_ID="$LEADERBOARD_CHANNEL_ID"
fi

read -p "Enter LOGS_CHANNEL_ID (or press Enter to skip): " LOGS_CHANNEL_ID
if [ ! -z "$LOGS_CHANNEL_ID" ]; then
    railway variables set LOGS_CHANNEL_ID="$LOGS_CHANNEL_ID"
fi

# Role IDs (optional prompts)
read -p "Enter NEW_MEMBER_ROLE_ID (or press Enter to skip): " NEW_MEMBER_ROLE_ID
if [ ! -z "$NEW_MEMBER_ROLE_ID" ]; then
    railway variables set NEW_MEMBER_ROLE_ID="$NEW_MEMBER_ROLE_ID"
fi

read -p "Enter WARMING_UP_ROLE_ID (or press Enter to skip): " WARMING_UP_ROLE_ID
if [ ! -z "$WARMING_UP_ROLE_ID" ]; then
    railway variables set WARMING_UP_ROLE_ID="$WARMING_UP_ROLE_ID"
fi

read -p "Enter CLIPPER_ROLE_ID (or press Enter to skip): " CLIPPER_ROLE_ID
if [ ! -z "$CLIPPER_ROLE_ID" ]; then
    railway variables set CLIPPER_ROLE_ID="$CLIPPER_ROLE_ID"
fi

read -p "Enter ADMIN_ROLE_ID (or press Enter to skip): " ADMIN_ROLE_ID
if [ ! -z "$ADMIN_ROLE_ID" ]; then
    railway variables set ADMIN_ROLE_ID="$ADMIN_ROLE_ID"
fi

read -p "Enter MODERATOR_ROLE_ID (or press Enter to skip): " MODERATOR_ROLE_ID
if [ ! -z "$MODERATOR_ROLE_ID" ]; then
    railway variables set MODERATOR_ROLE_ID="$MODERATOR_ROLE_ID"
fi

# Bot Settings
railway variables set NODE_ENV="production"

echo ""
echo "✅ All environment variables set successfully!"
echo ""
echo "📋 To verify, run: railway variables"
echo "🚀 To deploy, run: railway up"
echo ""

