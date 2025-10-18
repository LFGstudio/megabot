const fs = require('fs');
const path = require('path');

class CommandHandler {
  constructor(client) {
    this.client = client;
    this.commands = new Map();
    this.slashCommands = new Map();
    this.loadCommands();
  }

  loadCommands() {
    const commandPath = path.join(__dirname, '../commands');
    
    if (!fs.existsSync(commandPath)) {
      fs.mkdirSync(commandPath, { recursive: true });
      return;
    }

    const commandFolders = fs.readdirSync(commandPath);
    
    for (const folder of commandFolders) {
      const folderPath = path.join(commandPath, folder);
      const stat = fs.statSync(folderPath);
      
      if (stat.isDirectory()) {
        const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
        
        for (const file of commandFiles) {
          const filePath = path.join(folderPath, file);
          const command = require(filePath);
          
          if (command.name) {
            if (command.type === 'slash') {
              this.slashCommands.set(command.name, command);
            } else {
              this.commands.set(command.name, command);
            }
            console.log(`✅ Loaded command: ${command.name}`);
          } else {
            console.log(`❌ Command at ${filePath} is missing a "name" property`);
          }
        }
      }
    }
  }

  async handleSlashCommand(interaction) {
    const command = this.slashCommands.get(interaction.commandName);
    
    if (!command) {
      return interaction.reply({ 
        content: '❌ Command not found!', 
        ephemeral: true 
      });
    }

    try {
      await command.execute(interaction, this.client);
    } catch (error) {
      console.error(`Error executing slash command ${interaction.commandName}:`, error);
      
      const errorMessage = {
        content: '❌ There was an error while executing this command!',
        ephemeral: true
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    }
  }

  async handleMessageCommand(message) {
    const args = message.content.slice(this.client.config.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = this.commands.get(commandName);
    
    if (!command) return;

    try {
      await command.execute(message, args, this.client);
    } catch (error) {
      console.error(`Error executing message command ${commandName}:`, error);
      await message.reply('❌ There was an error while executing this command!');
    }
  }

  getSlashCommands() {
    return Array.from(this.slashCommands.values());
  }

  getCommands() {
    return Array.from(this.commands.values());
  }
}

module.exports = CommandHandler;
