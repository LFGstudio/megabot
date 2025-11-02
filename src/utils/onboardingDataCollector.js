const OnboardingData = require('../models/OnboardingData');
const User = require('../models/User');
const llmService = require('./llmService');

class OnboardingDataCollector {
  /**
   * Extract and store information from user messages during onboarding
   */
  async extractAndStoreData(userId, messageContent, images = [], context = {}) {
    try {
      // Get or create onboarding data record
      let onboardingData = await OnboardingData.findOne({ user_id: userId });
      
      if (!onboardingData) {
        // Get user info
        const user = await User.findOne({ discord_id: userId });
        const discordUser = context.discordUser;
        
        onboardingData = new OnboardingData({
          user_id: userId,
          discord_username: discordUser?.username || user?.discord_id || 'Unknown',
          discord_tag: discordUser ? `${discordUser.username}#${discordUser.discriminator}` : 'Unknown#0000',
          collected_via: 'llm_conversation'
        });
      }

      // Use LLM to extract structured data from the message
      if (llmService.isEnabled()) {
        const extractedData = await this.extractDataWithLLM(messageContent, images, onboardingData, context);
        
        // Update onboarding data with extracted information
        if (extractedData.personal_info) {
          Object.assign(onboardingData.personal_info, extractedData.personal_info);
        }
        if (extractedData.tiktok_info) {
          Object.assign(onboardingData.tiktok_info, extractedData.tiktok_info);
        }
        if (extractedData.payment_info) {
          Object.assign(onboardingData.payment_info, extractedData.payment_info);
        }
        if (extractedData.onboarding_questions) {
          Object.assign(onboardingData.onboarding_questions, extractedData.onboarding_questions);
        }
      }

      // Store images if provided
      if (images && images.length > 0) {
        for (const img of images) {
          await onboardingData.addSubmittedImage({
            url: img.url,
            filename: img.filename,
            description: img.description,
            purpose: this.determineImagePurpose(messageContent, context)
          });
        }
      }

      // Update last updated timestamp
      onboardingData.last_updated = new Date();
      
      // Recalculate completeness
      await onboardingData.calculateCompleteness();
      
      return onboardingData;
    } catch (error) {
      console.error('Error extracting and storing onboarding data:', error);
      return null;
    }
  }

  /**
   * Use LLM to extract structured data from user messages
   */
  async extractDataWithLLM(messageContent, images, existingData, context) {
    if (!llmService.isEnabled()) {
      return {};
    }

    try {
      const prompt = `Extract structured information from this user message during an onboarding process. Return ONLY a JSON object with the following structure. Only include fields where you can clearly identify the information. If information is not mentioned, don't include that field.

Current existing data:
${JSON.stringify(existingData.toObject(), null, 2)}

User message: "${messageContent}"

Extract and return JSON with this structure (only include fields with actual data):
{
  "personal_info": {
    "full_name": "string or null",
    "country": "string or null (country name, e.g., 'United States', 'Canada')",
    "timezone": "string or null",
    "age": "number or null",
    "languages": ["array of strings"],
    "introduction": "string or null",
    "background": "string or null",
    "motivation": "string or null"
  },
  "tiktok_info": {
    "username": "string or null (without @)",
    "profile_link": "string or null (full URL)",
    "display_name": "string or null",
    "bio": "string or null",
    "follower_count": "number or null",
    "following_count": "number or null",
    "video_count": "number or null",
    "niche": "string or null",
    "previous_experience": "string or null"
  },
  "payment_info": {
    "payment_method": "PayPal|Wise|Bank Transfer|Other or null",
    "payment_email": "string or null",
    "currency_preference": "string or null"
  },
  "onboarding_questions": {
    "how_did_you_find_us": "string or null",
    "expectations": "string or null",
    "goals": "string or null",
    "content_experience": "string or null",
    "available_hours_per_week": "number or null",
    "preferred_content_types": ["array of strings"]
  }
}

Return ONLY the JSON object, no other text.`;

      // Prepare images for analysis if available
      const imageParts = [];
      if (images && images.length > 0) {
        for (const img of images) {
          if (img.mimeType && img.data) {
            imageParts.push({
              inlineData: {
                mimeType: img.mimeType,
                data: img.data
              }
            });
          }
        }
      }

      const parts = [{ text: prompt }];
      if (imageParts.length > 0) {
        parts.push(...imageParts);
      }

      const result = await llmService.model.generateContent(parts);
      const response = await result.response;
      const responseText = response.text();

      // Try to extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const extracted = JSON.parse(jsonMatch[0]);
        return extracted;
      }

      return {};
    } catch (error) {
      console.error('Error extracting data with LLM:', error);
      return {};
    }
  }

  /**
   * Determine the purpose of an uploaded image based on context
   */
  determineImagePurpose(messageContent, context) {
    const content = messageContent.toLowerCase();
    
    if (content.includes('profile') || content.includes('tiktok profile') || content.includes('account')) {
      return 'profile_verification';
    } else if (content.includes('warmup') || content.includes('warm up')) {
      return 'warmup_proof';
    } else if (content.includes('screenshot') || content.includes('proof')) {
      return 'account_screenshot';
    } else if (content.includes('analytics') || content.includes('stats') || content.includes('metrics')) {
      return 'analytics';
    } else {
      return 'general';
    }
  }

  /**
   * Manually update onboarding data (for admin use)
   */
  async updateData(userId, data) {
    try {
      let onboardingData = await OnboardingData.findOne({ user_id: userId });
      
      if (!onboardingData) {
        const user = await User.findOne({ discord_id: userId });
        onboardingData = new OnboardingData({
          user_id: userId,
          discord_username: user?.discord_id || 'Unknown',
          discord_tag: 'Unknown#0000',
          collected_via: 'manual'
        });
      }

      // Update fields
      if (data.personal_info) {
        Object.assign(onboardingData.personal_info, data.personal_info);
      }
      if (data.tiktok_info) {
        Object.assign(onboardingData.tiktok_info, data.tiktok_info);
      }
      if (data.payment_info) {
        Object.assign(onboardingData.payment_info, data.payment_info);
      }
      if (data.onboarding_questions) {
        Object.assign(onboardingData.onboarding_questions, data.onboarding_questions);
      }

      onboardingData.last_updated = new Date();
      await onboardingData.calculateCompleteness();
      
      return onboardingData;
    } catch (error) {
      console.error('Error updating onboarding data:', error);
      throw error;
    }
  }

  /**
   * Get onboarding data for a user
   */
  async getData(userId) {
    return await OnboardingData.findOne({ user_id: userId });
  }

  /**
   * Get statistics about collected data
   */
  async getStatistics() {
    return await OnboardingData.getStatistics();
  }

  /**
   * Export data for a user
   */
  async exportUserData(userId) {
    const data = await OnboardingData.findOne({ user_id: userId });
    if (!data) {
      return null;
    }
    
    return {
      user_id: data.user_id,
      discord_username: data.discord_username,
      discord_tag: data.discord_tag,
      personal_info: data.personal_info,
      tiktok_info: data.tiktok_info,
      payment_info: data.payment_info,
      onboarding_questions: data.onboarding_questions,
      verification: data.verification,
      data_completeness: data.data_completeness,
      collected_at: data.collected_at,
      last_updated: data.last_updated
    };
  }
}

module.exports = new OnboardingDataCollector();

