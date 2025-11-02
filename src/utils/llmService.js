const { GoogleGenerativeAI } = require('@google/generative-ai');

class LLMService {
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️ Gemini API key not found. LLM features will be disabled.');
      this.genAI = null;
      this.model = null;
      this.enabled = false;
    } else {
      this.apiKey = apiKey;
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = null;
      this.enabled = false;
      // Try Gemini 2.5 models first (current as of Nov 2024), then fallback to older models
      this.modelsToTry = ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
      this.currentModelIndex = 0;
      
      // Initialize asynchronously
      this.initializeModel();
    }
  }

  async initializeModel() {
    try {
      // First try to get a working model
      for (const modelName of this.modelsToTry) {
        try {
          this.model = this.genAI.getGenerativeModel({ model: modelName });
          this.enabled = true;
          console.log(`✅ LLM Service initialized with Google Gemini using ${modelName} (Vision enabled)`);
          return;
        } catch (e) {
          continue;
        }
      }
      
      console.error('❌ No working Gemini models found. LLM features disabled.');
      this.model = null;
      this.enabled = false;
    } catch (error) {
      console.error('❌ Error initializing Gemini:', error);
      this.enabled = false;
    }
  }

  /**
   * Generate response with text and optional images
   * @param {string} userMessage - The user's text message
   * @param {Array} conversationHistory - Previous conversation messages
   * @param {Object} context - Context including currentDay, tasks, userName, userRole
   * @param {Array} images - Array of image data (base64 strings or URLs)
   */
  async generateResponse(userMessage, conversationHistory, context = {}, images = []) {
    if (!this.enabled || !this.model) {
      return {
        success: false,
        message: 'LLM service is not available. Please configure GEMINI_API_KEY in your environment variables.'
      };
    }

    try {
      // Build system prompt based on context
      const systemPrompt = this.buildSystemPrompt(context);
      
      // Build conversation history for Gemini (last 10 messages)
      const recentHistory = conversationHistory.slice(-10);
      const chatHistory = [];
      
      // Add system instruction as first message
      chatHistory.push({
        role: 'user',
        parts: [{ text: systemPrompt }]
      });
      chatHistory.push({
        role: 'model',
        parts: [{ text: 'I understand. I\'m ready to help with your onboarding journey!' }]
      });
      
      // Convert conversation history to Gemini format
      for (const msg of recentHistory) {
        if (msg.role === 'user') {
          const parts = [{ text: msg.content }];
          // Add images from history if they exist
          if (msg.images && msg.images.length > 0) {
            for (const img of msg.images) {
              // Note: We can't resend old images easily, so we just reference them
              parts.push({ text: `[User previously shared: ${img.filename || 'an image'}]` });
            }
          }
          chatHistory.push({
            role: 'user',
            parts: parts
          });
        } else if (msg.role === 'model' || msg.role === 'assistant') {
          chatHistory.push({
            role: 'model',
            parts: [{ text: msg.content }]
          });
        }
      }
      
      // Prepare current user message with images
      const currentUserParts = [{ text: userMessage }];
      
      // Add images if provided
      if (images && images.length > 0) {
        for (const imageData of images) {
          if (imageData.mimeType && imageData.data) {
            currentUserParts.push({
              inlineData: {
                mimeType: imageData.mimeType,
                data: imageData.data
              }
            });
          }
        }
      }
      
      chatHistory.push({
        role: 'user',
        parts: currentUserParts
      });

      // Start a chat session with history
      const chat = this.model.startChat({
        history: chatHistory.slice(0, -1), // All but the last message (current user message)
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        }
      });

      // Generate response with current message (which includes images)
      let result;
      try {
        result = await chat.sendMessage(currentUserParts);
      } catch (modelError) {
        // If model not found error, try next model
        if (modelError.message && modelError.message.includes('not found')) {
          return await this.retryWithNextModel(() => 
            this.generateResponse(userMessage, conversationHistory, context, images)
          );
        }
        throw modelError;
      }

      const response = await result.response;
      const assistantMessage = response.text();

      return {
        success: true,
        message: assistantMessage,
        usage: {
          promptTokens: response.usageMetadata?.promptTokenCount || 0,
          completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: response.usageMetadata?.totalTokenCount || 0
        }
      };
    } catch (error) {
      console.error('❌ Error generating LLM response:', error);
      return {
        success: false,
        message: 'I apologize, but I encountered an error. Please try again.',
        error: error.message
      };
    }
  }

  buildSystemPrompt(context) {
    const { currentDay, tasks, userName, userRole } = context;
    
    let prompt = `You are a professional, kind onboarding manager for a 5-day TikTok Poster training. Your job is to guide, clarify, and gently redirect users to complete today's tasks. Keep messages short, clear, and supportive. Avoid slang and emojis. If the user goes off topic, answer briefly then guide them back to the day's objectives.

Context:
- User: ${userName || 'New Member'}
- Current Role: ${userRole || 'New Member'}
- Current Day: Day ${currentDay || 1} of 5

Your personality:
- Professional, kind, clear, account-manager style
- No slang or hype - keep it businesslike
- Be concise but thorough in explanations
- Celebrate milestones and task completions professionally
- Offer help when users are stuck
- Keep conversations focused on onboarding tasks
- When users send images, analyze them carefully and provide helpful feedback

Image Analysis Guidelines:
- If users share screenshots of their TikTok profile, verify it matches requirements (username format, bio, etc.)
- If they share videos, provide feedback on content quality, engagement, and alignment with MegaViral guidelines
- If they share account stats or analytics, help them understand what the numbers mean
- Always be encouraging and constructive when reviewing their content

IMPORTANT KNOWLEDGE BASE - Use this information to answer questions accurately:

=== ABOUT MEGAVIRAL & THE POSTER PROGRAM ===
MegaViral is an AI app which helps creators grow on TikTok. The MegaViral poster program promotes the app on TikTok by posting relatable content in the TikTok growth niche.

Program Overview:
- Purpose: Post engaging slideshow content to build a TikTok following and drive MegaViral app installs
- Payment Model: $1 per 1,000 views
- Frequency: Weekly payments
- Requirement: Must post daily
- Expectation: Minimum $250/week; some have made $10k

Payment Model:
- $1 per 1,000 views
- Only paid when a video reaches 1,000+ views (mention only if asked)
- Weekly payout frequency
- Must post daily to maintain eligibility

Trust Reassurance:
- Payments processed via Whop campaign
- Funds held in escrow
- Payout after content approval
- Ensures transparency and secure payouts

=== US TARGETING LOGIC ===
Step 1 - Ask location:
- If user is in Tier-1 (USA, Canada, UK, Australia, New Zealand, Germany, France, Spain, Italy, Russia): normal setup in home country
- Else → ask device type

Android (non-Tier-1):
1. Open Telegram channel TikTok Mod Cloud and search "HOW TO DOWNLOAD? LOOK HERE!"
2. Watch tutorial
3. Download TikTok Mod + TikTok Plugin from TikTokModGlobalChat
4. Open TikTok Plugin → confirm US audience
5. Log in or create TikTok via TikTok Mod
   Proof: Screenshot from plugin showing US audience

iPhone (non-Tier-1):
- Use a US VPN, download TikTok, create a new account, set Language: English (US) and region to US. Engage only with US content. No screenshot required.

=== ENGAGEMENT STANDARDS ===
Per session:
- Likes: 30
- Comments: 5
- Follows: 15
- Niches only: tiktok growth tips, coach tips, girls support girls
- Engage BEFORE posting
- After posting: reply to comments using MegaViral comment guidelines (90% of replies include "MegaViral app")

=== PROFILE & CONTENT SOP ===
Handle: girl name + viraltips / viralgrowth / megaviral
Examples: sophia.viraltips, mia.viralgrowth, ava.megaviral

Account name: Girl name + viral coach (e.g., Sophia | Viral Coach)

Profile picture: Cute girl aesthetic photo from Pinterest

Bio (exact template):
Helping girls grow & stay motivated 💕
Follow for daily inspo ✨
App you are looking for 'MegaViral ✨'

Slideshow posts:
- 6 slides
- Images from Pinterest
- Text format provided (employee follows)
- Caption includes hashtags: #girlssupportgirls #tiktokgrowth #howtogoviral + relevant
- Reference example: https://www.tiktok.com/@claudia.viralgrowth/photo/7564899569629170966

=== MEGAVIRAL COMMENT GUIDELINES ===
After posting:
- Reply to as many comments as possible
- Include "MegaViral app" in ≥90% of replies to trigger blue search suggestion
- Vary phrasing; no copy-paste; delete "is this an ad/promo?" comments
- Prioritize: top comments → comments mentioning the app → most recent → others
- Like users' comments

=== PROOF & VERIFICATION FLOW ===
- Account creation, username, PFP, bio: profile screenshot
- US targeting: Android plugin screenshot (iOS/VPN: none)
- Engagement sessions (Days 1–5): no screenshots; supportive check-ins and questions
- First 3 posts: Send TikTok post link; human review required before/after posting per your workflow
- Posts after Day 3: Send TikTok link after posting; human support continues
- Payment understanding: no proof
- Completion: finish the full 5-day sequence

=== REMINDERS & NON-RESPONSE LOGIC ===
- Morning/evening reminders follow user's timezone
- If no reply in 2 hours to a time-sensitive message, send a gentle check-in
- If no response all day, retry next morning; do not spam outside 9:00–20:00 local time
- When "human" is typed, pause automation for 24h and ping manager role

Morning Window: 9:00 - 12:00 local time
Evening Window: 17:00 - 20:00 local time

=== COMMON QUESTIONS ===
Q: "How much can I earn?" A: $1 per 1,000 views. Minimum expectation is $250/week, some have made $10k
Q: "When do I get paid?" A: Weekly, via Whop campaign with funds in escrow
Q: "Do I need to post every day?" A: Yes, daily posting is required to maintain eligibility
Q: "What if I don't hit 1,000 views?" A: No payment for that video, but keep posting consistently
Q: "Is this secure?" A: Yes, payments are processed via Whop with escrow, ensuring transparency
Q: "What if I need help?" A: Type "human" anytime for immediate manager assistance

Current Day Tasks:`;

    if (tasks && tasks.length > 0) {
      tasks.forEach((task, index) => {
        const status = task.completed ? '[COMPLETE]' : '[PENDING]';
        prompt += `\n${status} Task ${index + 1}: ${task.title}`;
        if (task.description) {
          prompt += ` - ${task.description}`;
        }
      });
    }

    prompt += `

Guidelines:
- If the user asks about tasks, explain what they need to do clearly
- If they complete a task, celebrate and guide them to the next one professionally
- If they're struggling, offer encouragement and tips
- Keep responses under 300 words unless explaining something complex
- Always be supportive and positive
- If they ask about something unrelated to onboarding, politely redirect to the current tasks
- When all tasks for the day are complete, congratulate them and prepare them for the next day
- When users send images, analyze them in the context of their current tasks and provide relevant feedback
- Use the knowledge base above to answer questions accurately about MegaViral, TikTok Poster program, US targeting, engagement, profile setup, slideshow posting, and MegaViral comment guidelines
- If the user types "human", stop automation and notify a manager

Remember: You're here to make onboarding smooth and successful!`;

    return prompt;
  }

  async generateTaskInstructions(day, taskTitle, taskDescription) {
    if (!this.enabled || !this.model) {
      return {
        success: false,
        message: 'LLM service is not available.'
      };
    }

    try {
      const prompt = `Generate clear, step-by-step instructions for an onboarding task. Make it engaging and easy to follow.

Task Title: ${taskTitle}
Task Description: ${taskDescription}
Day: ${day}

Provide:
1. A brief explanation of why this task is important
2. Clear step-by-step instructions (3-5 steps)
3. What the user should submit or complete
4. Tips or common mistakes to avoid

Keep it concise (under 200 words) and friendly.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const instructions = response.text();

      return {
        success: true,
        instructions: instructions
      };
    } catch (error) {
      console.error('❌ Error generating task instructions:', error);
      return {
        success: false,
        instructions: taskDescription // Fallback to original description
      };
    }
  }

  /**
   * Analyze an image and provide feedback
   */
  async analyzeImage(imageData, context, userMessage = '') {
    if (!this.enabled || !this.model) {
      return {
        success: false,
        message: 'Image analysis is not available.'
      };
    }

    try {
      const prompt = `As an onboarding assistant for MegaViral, analyze this image. ${userMessage || 'What do you see? Provide helpful feedback related to the user\'s onboarding tasks.'}

Context:
- Current Day: ${context.currentDay || 1} of 5
- Current Tasks: ${context.tasks?.map(t => t.title).join(', ') || 'N/A'}

Provide specific, actionable feedback.`;

      const parts = [
        { text: prompt },
        {
          inlineData: {
            mimeType: imageData.mimeType,
            data: imageData.data
          }
        }
      ];

      let result;
      try {
        result = await this.model.generateContent(parts);
      } catch (modelError) {
        // If model not found error, try next model
        if (modelError.message && modelError.message.includes('not found')) {
          return await this.retryWithNextModel(() => 
            this.analyzeImage(imageData, context, userMessage)
          );
        }
        throw modelError;
      }

      const response = await result.response;
      return {
        success: true,
        analysis: response.text()
      };
    } catch (error) {
      console.error('❌ Error analyzing image:', error);
      return {
        success: false,
        analysis: 'I had trouble analyzing this image. Please try again or describe what you see.'
      };
    }
  }

  /**
   * Retry with next available model if current one fails
   */
  async retryWithNextModel(operation) {
    this.currentModelIndex++;
    
    if (this.currentModelIndex >= this.modelsToTry.length) {
      console.error('❌ All Gemini models failed');
      return {
        success: false,
        message: 'LLM service is currently unavailable. Please try again later.'
      };
    }
    
    const nextModel = this.modelsToTry[this.currentModelIndex];
    console.log(`⚠️ Switching to ${nextModel} model`);
    
    try {
      this.model = this.genAI.getGenerativeModel({ model: nextModel });
      return await operation();
    } catch (error) {
      // Try next model
      return await this.retryWithNextModel(operation);
    }
  }

  isEnabled() {
    return this.enabled;
  }
}

module.exports = new LLMService();
