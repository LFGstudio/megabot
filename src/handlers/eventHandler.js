const fs = require('fs');
const path = require('path');

class EventHandler {
  constructor(client) {
    this.client = client;
    this.events = new Map();
    this.loadEvents();
  }

  loadEvents() {
    const eventPath = path.join(__dirname, '../events');
    
    if (!fs.existsSync(eventPath)) {
      fs.mkdirSync(eventPath, { recursive: true });
      return;
    }

    const eventFiles = fs.readdirSync(eventPath).filter(file => file.endsWith('.js'));
    
    for (const file of eventFiles) {
      const filePath = path.join(eventPath, file);
      const event = require(filePath);
      
      if (event.name && event.once) {
        this.client.once(event.name, (...args) => event.execute(...args, this.client));
      } else if (event.name) {
        this.client.on(event.name, (...args) => event.execute(...args, this.client));
      } else {
        console.log(`❌ Event at ${filePath} is missing a "name" property`);
      }
      
      console.log(`✅ Loaded event: ${event.name}`);
    }
  }

  reloadEvents() {
    this.events.clear();
    this.loadEvents();
    console.log('🔄 Events reloaded');
  }
}

module.exports = EventHandler;
