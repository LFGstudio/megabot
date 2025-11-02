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
      this.modelsToTry = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
      this.currentModelIndex = 0;
      
      // Initialize synchronously - find which model works when first called
    }
  }

  async ensureModelInitialized() {
    if (this.model && this.enabled) {
      return true;
    }
    
    try {
      // Try to list available models first
      const models = await this.genAI.listModels();
      const availableModelNames = models.models.map(m => m.name);
      console.log('📋 Available Gemini models:', availableModelNames);
      
      // Extract just the model name (e.g., "models/gemini-1.5-flash" -> "gemini-1.5-flash")
      const preferredModelNames = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro', 'gemini-1.5'];
      
      for (const modelName of preferredModelNames) {
        const fullModelName = availableModelNames.find(m => m.includes(modelName));
        if (fullModelName) {
          this.model = this.genAI.getGenerativeModel({ model: modelName });
          this.enabled = true;
          console.log(`✅ Using Gemini model: ${modelName}`);
          return true;
        }
      }
      
      // If no preferred model, use first available
      if (availableModelNames.length > 0) {
        const firstModel = availableModelNames[0];
        this.model = this.genAI.getGenerativeModel({ model: firstModel });
        this.enabled = true;
        console.log(`✅ Using first available model: ${firstModel}`);
        return true;
      }
    } catch (listError) {
      console.log('⚠️ Could not list models, trying direct initialization');
    }
    
    // Fallback: try common model names
    for (const modelName of this.modelsToTry) {
      try {
        this.model = this.genAI.getGenerativeModel({ model: modelName });
        this.enabled = true;
        console.log(`✅ Using Gemini model: ${modelName}`);
        return true;
      } catch (e) {
        continue;
      }
    }
    
    console.error('❌ No working Gemini models found. LLM features disabled.');
    this.model = null;
    this.enabled = false;
    return false;
  }

  /**
   * Generate response with text and optional images
   * @param {string} userMessage - The user's text message
   * @param {Array} conversationHistory - Previous conversation messages
   * @param {Object} context - Context including currentDay, tasks, userName, userRole
   * @param {Array} images - Array of image data (base64 strings or URLs)
   */
  async generateResponse(userMessage, conversationHistory, context = {}, images = []) {
    // Ensure model is initialized
    await this.ensureModelInitialized();
    
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
    
    let prompt = `You are a friendly and helpful onboarding assistant for MegaViral, a TikTok clipping community platform. Your role is to guide new members through their 5-day onboarding process with enthusiasm and support.

Context:
- User: ${userName || 'New Member'}
- Current Role: ${userRole || 'New Member'}
- Current Day: Day ${currentDay || 1} of 5

Your personality:
- Friendly, encouraging, and professional
- Use emojis appropriately to make conversations engaging
- Be concise but thorough in your explanations
- Celebrate milestones and task completions
- Offer help when users are stuck
- Keep conversations focused on onboarding tasks
- When users send images (like screenshots of their TikTok account, profile, videos, etc.), analyze them carefully and provide helpful feedback

Image Analysis Guidelines:
- If users share screenshots of their TikTok profile, verify it matches requirements (username format, bio, etc.)
- If they share videos, provide feedback on content quality, engagement, and alignment with MegaViral guidelines
- If they share account stats or analytics, help them understand what the numbers mean
- Always be encouraging and constructive when reviewing their content

Current Day Tasks:`;

    if (tasks && tasks.length > 0) {
      tasks.forEach((task, index) => {
        const status = task.completed ? '✅' : '⏳';
        prompt += `\n${status} Task ${index + 1}: ${task.title}`;
        if (task.description) {
          prompt += ` - ${task.description}`;
        }
      });
    }

    prompt += `

Guidelines:
- If the user asks about tasks, explain what they need to do clearly
- If they complete a task, celebrate and guide them to the next one
- If they're struggling, offer encouragement and tips
- Keep responses under 300 words unless explaining something complex
- Always be supportive and positive
- If they ask about something unrelated to onboarding, politely redirect to the current tasks
- When all tasks for the day are complete, congratulate them and prepare them for the next day
- When users send images, analyze them in the context of their current tasks and provide relevant feedback

Remember: You're here to make onboarding smooth and enjoyable!`;

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
    // Ensure model is initialized
    await this.ensureModelInitialized();
    
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
