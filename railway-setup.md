# Quick Railway Setup Guide

## Add Gemini API Key to Railway

### Option 1: Via Railway Dashboard (Easiest)

1. Go to https://railway.app and log in
2. Open your bot project
3. Click on your service
4. Go to the **Variables** tab
5. Click **+ New Variable**
6. Add:
   - **Variable Name:** `GEMINI_API_KEY`
   - **Value:** `AIzaSyCWvKk61YkDpk9Shqp1_kGUdh4O75HpBks`
7. Click **Add**
8. Your service will automatically redeploy with the new variable

### Option 2: Via Railway CLI

```bash
railway variables set GEMINI_API_KEY=AIzaSyCWvKk61YkDpk9Shqp1_kGUdh4O75HpBks
```

### Option 3: Use the Setup Script

Run the provided setup script:
```bash
./deploy-env-vars.sh
```

## Verify It's Working

After adding the variable and redeploying, check your Railway logs:

```bash
railway logs
```

You should see:
```
✅ LLM Service initialized with Google Gemini (Vision enabled)
```

If you see:
```
⚠️ Gemini API key not found. LLM features will be disabled.
```

Double-check that the variable is set correctly in the Railway dashboard.

## All Required Variables for Railway

Make sure you have these set:

**Required:**
- `DISCORD_TOKEN` - Your Discord bot token
- `DISCORD_CLIENT_ID` - Your Discord application client ID
- `DISCORD_GUILD_ID` - Your Discord server ID
- `MONGODB_URI` - Your MongoDB connection string
- `GEMINI_API_KEY` - Your Gemini API key (see above)

**Optional but Recommended:**
- Channel IDs (VERIFICATION_CHANNEL_ID, WARMUP_CHANNEL_ID, etc.)
- Role IDs (NEW_MEMBER_ROLE_ID, WARMING_UP_ROLE_ID, etc.)

## Next Steps

Once the API key is added:
1. ✅ LLM-powered onboarding will work
2. ✅ Image analysis will be enabled
3. ✅ Automatic data extraction will function
4. ✅ Users can chat with the bot during onboarding

Your bot is now ready for AI-powered onboarding! 🚀

