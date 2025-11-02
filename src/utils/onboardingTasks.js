/**
 * 5-Day TikTok Poster Onboarding Task Definitions
 * Each day has specific tasks that users must complete based on boardingspecsai
 */

const TASKS_BY_DAY = {
  1: {
    day_title: "Account Creation & Initial Engagement",
    day_description: "Create your TikTok account and complete your first engagement session.",
    tasks: [
      {
        id: 'create_account',
        title: 'Create TikTok Account',
        description: 'Create your TikTok account. Use format: girl name + viraltips/viralgrowth/megaviral. Examples: sophia.viraltips, mia.viralgrowth, ava.megaviral',
        type: 'upload',
        required: true
      },
      {
        id: 'initial_engagement',
        title: 'Complete Initial Engagement Session',
        description: 'Complete one engagement session: 30 likes, 5 comments, 15 follows in niches: tiktok growth tips, coach tips, girls support girls',
        type: 'confirmation',
        required: true
      },
      {
        id: 'language_timezone',
        title: 'Set Language & Timezone',
        description: 'Choose your preferred language (English or Spanish) and provide your timezone (e.g., America/New_York, Europe/Madrid)',
        type: 'text_response',
        required: true
      }
    ]
  },
  2: {
    day_title: "Profile Setup & Engagement",
    day_description: "Set up your profile picture and bio, then complete two 15-minute engagement sessions.",
    tasks: [
      {
        id: 'set_profile_picture',
        title: 'Set Profile Picture',
        description: 'Upload a cute, girly aesthetic photo from Pinterest as your profile picture',
        type: 'upload',
        required: true
      },
      {
        id: 'set_bio',
        title: 'Set Bio',
        description: 'Set your bio to: "Helping girls grow & stay motivated 💕\nFollow for daily inspo ✨\nApp you are looking for \'MegaViral ✨\'"',
        type: 'confirmation',
        required: true
      },
      {
        id: 'morning_engagement',
        title: 'Morning Engagement Session',
        description: 'Complete morning engagement session (15 minutes): 30 likes, 5 comments, 15 follows in niches',
        type: 'confirmation',
        required: true
      },
      {
        id: 'evening_engagement',
        title: 'Evening Engagement Session',
        description: 'Complete evening engagement session (15 minutes): 30 likes, 5 comments, 15 follows in niches',
        type: 'confirmation',
        required: true
      }
    ]
  },
  3: {
    day_title: "First Post & Engagement",
    day_description: "Publish your first slideshow post and continue engagement sessions.",
    tasks: [
      {
        id: 'morning_engagement_day3',
        title: 'Morning Engagement Session',
        description: 'Complete morning engagement session: 30 likes, 5 comments, 15 follows',
        type: 'confirmation',
        required: true
      },
      {
        id: 'create_first_post',
        title: 'Create First Slideshow Post',
        description: 'Publish your first slideshow post with 6 slides, Pinterest images, provided text format. Include hashtags: #girlssupportgirls #tiktokgrowth #howtogoviral',
        type: 'upload',
        required: true
      },
      {
        id: 'evening_engagement_day3',
        title: 'Evening Engagement Session',
        description: 'Complete evening engagement session: 30 likes, 5 comments, 15 follows',
        type: 'confirmation',
        required: true
      },
      {
        id: 'reply_to_comments',
        title: 'Reply to Comments',
        description: 'Reply to comments on your post following MegaViral guidelines. Include "MegaViral app" in ≥90% of replies',
        type: 'confirmation',
        required: true
      }
    ]
  },
  4: {
    day_title: "Daily Post & Engagement",
    day_description: "Continue posting and engaging daily.",
    tasks: [
      {
        id: 'morning_engagement_day4',
        title: 'Morning Engagement Session',
        description: 'Complete morning engagement session: 30 likes, 5 comments, 15 follows',
        type: 'confirmation',
        required: true
      },
      {
        id: 'create_post_day4',
        title: 'Create Daily Post',
        description: 'Publish another slideshow post (6 slides) with proper formatting and hashtags',
        type: 'upload',
        required: true
      },
      {
        id: 'evening_engagement_day4',
        title: 'Evening Engagement Session',
        description: 'Complete evening engagement session: 30 likes, 5 comments, 15 follows',
        type: 'confirmation',
        required: true
      }
    ]
  },
  5: {
    day_title: "Final Post & Onboarding Complete",
    day_description: "Complete your final post and finish onboarding to join the main channel.",
    tasks: [
      {
        id: 'morning_engagement_day5',
        title: 'Morning Engagement Session',
        description: 'Complete morning engagement session: 30 likes, 5 comments, 15 follows',
        type: 'confirmation',
        required: true
      },
      {
        id: 'create_post_day5',
        title: 'Create Final Post',
        description: 'Publish your final slideshow post (6 slides) with proper formatting and hashtags',
        type: 'upload',
        required: true
      },
      {
        id: 'evening_engagement_day5',
        title: 'Evening Engagement Session',
        description: 'Complete evening engagement session: 30 likes, 5 comments, 15 follows',
        type: 'confirmation',
        required: true
      },
      {
        id: 'complete_onboarding',
        title: 'Onboarding Complete',
        description: 'Congratulations! You\'ve completed the 5-day TikTok Poster onboarding. You can now join the main channel and start posting daily!',
        type: 'confirmation',
        required: true
      }
    ]
  }
};

/**
 * Get tasks for a specific day
 */
function getTasksForDay(day) {
  return TASKS_BY_DAY[day] || null;
}

/**
 * Get all tasks
 */
function getAllTasks() {
  return TASKS_BY_DAY;
}

/**
 * Initialize tasks for a new onboarding progress
 */
function initializeTasks() {
  const initializedTasks = {};
  
  for (let day = 1; day <= 5; day++) {
    const dayData = TASKS_BY_DAY[day];
    initializedTasks[`day${day}`] = {
      completed: false,
      completed_at: null,
      tasks: dayData.tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        type: task.type,
        command: task.command || null,
        required: task.required || false,
        completed: false,
        completed_at: null,
        user_response: null
      }))
    };
  }
  
  return initializedTasks;
}

module.exports = {
  TASKS_BY_DAY,
  getTasksForDay,
  getAllTasks,
  initializeTasks
};
