const mongoose = require('mongoose');

const onboardingProgressSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
    ref: 'User'
  },
  channel_id: {
    type: String,
    required: true
  },
  current_day: {
    type: Number,
    default: 1,
    min: 1,
    max: 5
  },
  started_at: {
    type: Date,
    default: Date.now
  },
  completed_at: {
    type: Date,
    default: null
  },
  tasks: {
    day1: {
      completed: { type: Boolean, default: false },
      completed_at: { type: Date, default: null },
      tasks: [{
        id: String,
        title: String,
        description: String,
        completed: { type: Boolean, default: false },
        completed_at: { type: Date, default: null },
        user_response: String
      }]
    },
    day2: {
      completed: { type: Boolean, default: false },
      completed_at: { type: Date, default: null },
      tasks: [{
        id: String,
        title: String,
        description: String,
        completed: { type: Boolean, default: false },
        completed_at: { type: Date, default: null },
        user_response: String
      }]
    },
    day3: {
      completed: { type: Boolean, default: false },
      completed_at: { type: Date, default: null },
      tasks: [{
        id: String,
        title: String,
        description: String,
        completed: { type: Boolean, default: false },
        completed_at: { type: Date, default: null },
        user_response: String
      }]
    },
    day4: {
      completed: { type: Boolean, default: false },
      completed_at: { type: Date, default: null },
      tasks: [{
        id: String,
        title: String,
        description: String,
        completed: { type: Boolean, default: false },
        completed_at: { type: Date, default: null },
        user_response: String
      }]
    },
    day5: {
      completed: { type: Boolean, default: false },
      completed_at: { type: Date, default: null },
      tasks: [{
        id: String,
        title: String,
        description: String,
        completed: { type: Boolean, default: false },
        completed_at: { type: Date, default: null },
        user_response: String
      }]
    }
  },
  conversation_history: [{
    role: { type: String, enum: ['user', 'assistant', 'system'] },
    content: String,
    images: [{
      url: String,
      filename: String,
      mimeType: String,
      size: Number,
      description: String, // AI-generated description of the image
      timestamp: { type: Date, default: Date.now }
    }],
    timestamp: { type: Date, default: Date.now }
  }],
  stored_images: [{
    url: String,
    filename: String,
    mimeType: String,
    size: Number,
    description: String,
    related_task_id: String, // Link to specific task if applicable
    uploaded_at: { type: Date, default: Date.now }
  }],
  llm_enabled: {
    type: Boolean,
    default: true
  },
  bot_muted: {
    type: Boolean,
    default: false
  },
  muted_by: {
    type: String,
    default: null
  },
  muted_at: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Index for efficient queries
onboardingProgressSchema.index({ user_id: 1 });
onboardingProgressSchema.index({ channel_id: 1 });
onboardingProgressSchema.index({ current_day: 1 });
onboardingProgressSchema.index({ status: 1 });

// Instance methods
onboardingProgressSchema.methods.getCurrentDayTasks = function() {
  return this.tasks[`day${this.current_day}`];
};

onboardingProgressSchema.methods.completeTask = async function(day, taskId, userResponse = null) {
  const dayTasks = this.tasks[`day${day}`];
  if (!dayTasks) return false;

  const task = dayTasks.tasks.find(t => t.id === taskId);
  if (task) {
    task.completed = true;
    task.completed_at = new Date();
    if (userResponse) {
      task.user_response = userResponse;
    }
    await this.save();
    return true;
  }
  return false;
};

onboardingProgressSchema.methods.checkDayCompletion = async function(day) {
  const dayTasks = this.tasks[`day${day}`];
  if (!dayTasks) return false;

  const allCompleted = dayTasks.tasks.every(task => task.completed);
  if (allCompleted && !dayTasks.completed) {
    dayTasks.completed = true;
    dayTasks.completed_at = new Date();
    await this.save();
  }
  return allCompleted;
};

onboardingProgressSchema.methods.advanceToNextDay = async function(force = false) {
  if (this.current_day < 5) {
    // Check if current day is complete, unless forcing
    if (force || this.tasks[`day${this.current_day}`].completed) {
      this.current_day += 1;
      await this.save();
      return true;
    }
  }
  return false;
};

onboardingProgressSchema.methods.isOnboardingComplete = function() {
  return this.current_day === 5 && this.tasks.day5.completed;
};

onboardingProgressSchema.methods.addConversationMessage = async function(role, content, images = []) {
  this.conversation_history.push({
    role,
    content,
    images: images.map(img => ({
      url: img.url,
      filename: img.filename,
      mimeType: img.mimeType,
      size: img.size,
      description: img.description || null,
      timestamp: new Date()
    })),
    timestamp: new Date()
  });
  
  // Store images in the stored_images array for easy retrieval
  if (images && images.length > 0) {
    images.forEach(img => {
      this.stored_images.push({
        url: img.url,
        filename: img.filename,
        mimeType: img.mimeType,
        size: img.size,
        description: img.description || null,
        related_task_id: null,
        uploaded_at: new Date()
      });
    });
  }
  
  // Keep only last 50 messages to prevent document from growing too large
  if (this.conversation_history.length > 50) {
    this.conversation_history = this.conversation_history.slice(-50);
  }
  
  // Keep only last 100 images
  if (this.stored_images.length > 100) {
    this.stored_images = this.stored_images.slice(-100);
  }
  
  await this.save();
};

onboardingProgressSchema.methods.addImageToTask = async function(taskId, imageData) {
  this.stored_images.push({
    url: imageData.url,
    filename: imageData.filename,
    mimeType: imageData.mimeType,
    size: imageData.size,
    description: imageData.description || null,
    related_task_id: taskId,
    uploaded_at: new Date()
  });
  await this.save();
};

module.exports = mongoose.model('OnboardingProgress', onboardingProgressSchema);

