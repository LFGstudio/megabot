# 🧪 MegaBot Testing Guide

## Prerequisites

Before testing, ensure:
- ✅ Bot is deployed and online in Discord
- ✅ Gemini API key is set in Railway
- ✅ All environment variables are configured
- ✅ Bot has necessary permissions (Manage Channels, Send Messages, Embed Links, etc.)

---

## 1. Basic Bot Status Check

### Verify Bot is Online
1. Check Discord - bot should show as "Online" (green dot)
2. Check Railway logs:
   ```bash
   railway logs --tail
   ```
   Look for:
   ```
   ✅ MegaBot is online!
   ✅ LLM Service initialized with Google Gemini (Vision enabled)
   ```

### Verify Commands Loaded
In Discord, type `/` and check if you see:
- `/onboarding`
- `/onboarding-progress`
- `/export-onboarding-data` (admin only)

---

## 2. Test LLM-Powered Onboarding System

### Step 1: Start Onboarding

1. **Create the "Start Here" channel** (if not exists):
   - Admin runs: `/onboarding start-here`
   - This creates a channel with a "Get Started" button

2. **User clicks "Get Started" button**:
   - Should create a private onboarding channel
   - Bot should send a welcome message with Day 1 tasks
   - Check for: "🎯 Day 1: Welcome & Account Setup"

### Step 2: Test LLM Conversation

In the onboarding channel, test natural conversation:

**Test 1: Basic Conversation**
```
User: "Hi, I'm new here. What should I do?"
Expected: Bot responds with helpful onboarding guidance
```

**Test 2: Information Extraction**
```
User: "I'm from the United States and my TikTok is @myusername"
Expected: 
- Bot responds naturally
- Data is extracted (check database or use export command)
- Country and TikTok username stored
```

**Test 3: Questions About Tasks**
```
User: "What do I need to do for day 1?"
Expected: Bot explains Day 1 tasks clearly
```

### Step 3: Test Image Analysis

**Test Image Upload:**
1. Upload a TikTok profile screenshot in the onboarding channel
2. Say: "Here's my TikTok profile"
3. Expected:
   - Bot analyzes the image
   - Bot responds with feedback about the profile
   - Image is stored in database
   - Image description is generated

**Test Multiple Images:**
1. Upload 2-3 images at once
2. Bot should analyze all images
3. All images should be stored

### Step 4: Test Task Completion

**Natural Language Completion:**
```
User: "I've completed the introduction task"
Expected:
- Bot confirms task completion
- Task marked as complete in database
- Remaining tasks shown
```

**Complete All Day 1 Tasks:**
- Complete all Day 1 tasks naturally
- Expected: Bot automatically advances to Day 2
- New welcome message for Day 2 appears

---

## 3. Test Data Collection

### Verify Data is Being Collected

**Check Progress:**
```
/onboarding-progress view
```
Should show:
- Current day
- Completed tasks
- Data completeness percentage

**Export User Data (Admin):**
```
/export-onboarding-data user @username
```
Should return:
- JSON file with all collected data
- Personal info, TikTok info, payment info
- Images uploaded
- Conversation history metadata

**View Statistics (Admin):**
```
/export-onboarding-data stats
```
Should show:
- Total users
- Verified accounts
- Countries breakdown
- Average data completeness

### Test Automatic Data Extraction

**Test Scenario:**
1. User says: "My name is John, I'm from Canada, and my TikTok is https://www.tiktok.com/@johndoe"
2. Check database or export data
3. Verify:
   - ✅ Name: John
   - ✅ Country: Canada
   - ✅ TikTok username: johndoe
   - ✅ TikTok profile link stored

---

## 4. Admin Testing Commands

### Test Progress Management

**Advance User to Next Day:**
```
/onboarding-progress advance-day user:@username
```
Expected: User moves to next day, new welcome message sent

**Manually Complete Task:**
```
/onboarding-progress complete-task user:@username day:1 task-id:welcome_intro
```
Expected: Task marked as complete

### Test Data Export

**Export All Data:**
```
/export-onboarding-data all
```
Expected: CSV file downloaded with all user data

---

## 5. Test Error Handling

### Test Without API Key
1. Temporarily remove GEMINI_API_KEY in Railway
2. Redeploy
3. Expected:
   - Bot still works (falls back gracefully)
   - Warning in logs: "⚠️ Gemini API key not found"
   - Onboarding continues without LLM

### Test Image Processing Errors
1. Upload a very large image (>10MB)
2. Upload a corrupted image file
3. Expected: Graceful error handling, user notified

---

## 6. Integration Testing

### Full Onboarding Flow

**Complete End-to-End Test:**
1. New user joins Discord
2. User finds "Start Here" channel
3. Clicks "Get Started" button
4. Private channel created
5. User chats with bot:
   - Introduces themselves
   - Shares TikTok profile (with image)
   - Answers questions
   - Completes tasks
6. Verify:
   - ✅ All tasks completed
   - ✅ Data collected and stored
   - ✅ Progress tracked correctly
   - ✅ Images analyzed and stored
   - ✅ Day progression works

---

## 7. Database Verification

### Check MongoDB

Connect to MongoDB and verify:

```javascript
// Check onboarding progress
db.onboardingprogresses.find({ user_id: "USER_ID" })

// Check collected data
db.onboardingdatas.find({ user_id: "USER_ID" })

// Check images stored
db.onboardingprogresses.find(
  { user_id: "USER_ID" },
  { "conversation_history.images": 1 }
)
```

Expected:
- Onboarding progress document exists
- Data collection document exists
- Images stored with metadata
- Conversation history maintained

---

## 8. Performance Testing

### Test Multiple Concurrent Users

1. Create 5-10 test users
2. All start onboarding simultaneously
3. Verify:
   - ✅ No errors in logs
   - ✅ All channels created successfully
   - ✅ LLM responses within reasonable time (<5 seconds)
   - ✅ No rate limiting issues

---

## 9. Quick Test Checklist

Use this checklist for quick verification:

- [ ] Bot appears online in Discord
- [ ] `/onboarding-progress view` works
- [ ] "Get Started" button creates channel
- [ ] Bot responds to messages in onboarding channel
- [ ] Images can be uploaded and analyzed
- [ ] Tasks can be completed via natural language
- [ ] Data is extracted from conversations
- [ ] Day progression works automatically
- [ ] Admin export commands work
- [ ] No errors in Railway logs

---

## 10. Troubleshooting

### Bot Not Responding
- Check Railway logs: `railway logs --tail`
- Verify bot has permission to send messages
- Check if channel is correctly configured

### LLM Not Working
- Verify GEMINI_API_KEY is set
- Check logs for API errors
- Verify API key is valid (check Google AI Studio)

### Images Not Analyzing
- Check image size (should be <20MB)
- Verify image format (JPG, PNG supported)
- Check logs for processing errors

### Data Not Stored
- Verify MongoDB connection
- Check Railway logs for database errors
- Verify OnboardingData model is working

---

## Expected Log Outputs

### Successful Startup:
```
✅ LLM Service initialized with Google Gemini (Vision enabled)
✅ MegaBot is online!
✅ Loaded command: onboarding-progress
✅ Loaded command: export-onboarding-data
```

### User Interaction:
```
📷 Processed image: screenshot.png (image/png)
✅ Onboarding progress initialized for user: 123456789
🔍 Extracting data from user message...
```

---

## Next Steps After Testing

1. ✅ Document any issues found
2. ✅ Test with real users
3. ✅ Monitor performance
4. ✅ Review collected data quality
5. ✅ Adjust prompts if needed

---

**Happy Testing! 🚀**

