/**
 * 5-Day Onboarding Task Definitions
 * Each day has specific tasks that users must complete
 */

const TASKS_BY_DAY = {
  1: {
    day_title: "Welcome & Account Setup",
    day_description: "Get started with your MegaViral journey! Today we'll set up your account and get familiar with the platform.",
    tasks: [
      {
        id: 'welcome_intro',
        title: 'Introduce Yourself',
        description: 'Tell us a bit about yourself - your name, where you\'re from, and what brought you to MegaViral.',
        type: 'text_response',
        required: true
      },
      {
        id: 'read_rules',
        title: 'Read Community Guidelines',
        description: 'Review the server rules and guidelines in the #rules channel. Confirm you\'ve read them.',
        type: 'confirmation',
        required: true
      },
      {
        id: 'setup_profile',
        title: 'Complete Your Profile',
        description: 'Set up your Discord profile with a clear username and profile picture. Make sure it\'s professional.',
        type: 'confirmation',
        required: true
      }
    ]
  },
  2: {
    day_title: "TikTok Account Connection",
    day_description: "Connect your TikTok account and start your content creation journey!",
    tasks: [
      {
        id: 'connect_tiktok',
        title: 'Connect Your TikTok Account',
        description: 'Use the /tiktok connect command to link your TikTok account to your MegaViral profile.',
        type: 'command',
        command: '/tiktok connect',
        required: true
      },
      {
        id: 'verify_account',
        title: 'Verify Account Creation',
        description: 'Submit your TikTok account for verification in the "create an account" channel. Upload proof of account creation.',
        type: 'upload',
        required: true
      },
      {
        id: 'understand_platform',
        title: 'Learn About MegaViral',
        description: 'Read about how MegaViral works, our clipping system, and how you can earn. Ask any questions you have!',
        type: 'text_response',
        required: true
      }
    ]
  },
  3: {
    day_title: "Account Warm-Up Phase",
    day_description: "Learn the importance of warming up your TikTok account before starting to clip.",
    tasks: [
      {
        id: 'learn_warmup',
        title: 'Understand Account Warm-Up',
        description: 'Learn why warming up your TikTok account is crucial for success. Review the warm-up guidelines.',
        type: 'text_response',
        required: true
      },
      {
        id: 'start_warmup',
        title: 'Begin Account Warm-Up',
        description: 'Start warming up your TikTok account by posting original content for at least 3 days.',
        type: 'confirmation',
        required: true
      },
      {
        id: 'track_progress',
        title: 'Track Your Progress',
        description: 'Keep track of your warm-up content and engagement metrics.',
        type: 'text_response',
        required: true
      }
    ]
  },
  4: {
    day_title: "Content Creation Basics",
    day_description: "Master the fundamentals of creating engaging clips for TikTok.",
    tasks: [
      {
        id: 'learn_clipping',
        title: 'Learn Clipping Basics',
        description: 'Study the clipping guidelines and best practices for creating viral content.',
        type: 'text_response',
        required: true
      },
      {
        id: 'create_sample',
        title: 'Create a Sample Clip',
        description: 'Create a practice clip following our guidelines (you can share it here for feedback).',
        type: 'upload',
        required: true
      },
      {
        id: 'understand_metrics',
        title: 'Understand Performance Metrics',
        description: 'Learn about views, tier-1 views, and how payouts work on MegaViral.',
        type: 'text_response',
        required: true
      }
    ]
  },
  5: {
    day_title: "Final Verification & Launch",
    day_description: "Complete your onboarding and become a verified Clipper!",
    tasks: [
      {
        id: 'submit_warmup',
        title: 'Submit Warm-Up Verification',
        description: 'Submit proof that you\'ve completed your account warm-up period in the warm-up verification channel.',
        type: 'upload',
        required: true
      },
      {
        id: 'final_check',
        title: 'Complete Final Checklist',
        description: 'Ensure all your account details are correct, TikTok is connected, and you\'re ready to start clipping!',
        type: 'confirmation',
        required: true
      },
      {
        id: 'get_started',
        title: 'Launch Your Clipping Journey',
        description: 'You\'re all set! Start creating and uploading clips. Remember to follow our guidelines and engage with the community.',
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

