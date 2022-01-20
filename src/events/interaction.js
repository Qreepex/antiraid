const { CommandInteraction } = require("discord.js");
const BaseEvent = require("../classes/Event.js");
const Bot = require("../classes/Bot.js");

module.exports = class extends BaseEvent {
    constructor() {
        super('interactionCreate');
    };

    /**
     * @param {Bot} client 
     * @param {CommandInteraction} interaction 
     */

    async run(client, interaction) {
        if(interaction.type === "APPLICATION_COMMAND") {
            let command = client.commands.get(interaction.commandName);
            if(!command) return;

            if(!interaction.member.roles.cache.get(client.config.roles.mod) || interaction.member.roles.cache.get(client.config.roles.jrmod))
                return await interaction.reply({ content: ":x: You don't have permissions to execute this command."});

            return command.run(interaction, client);
        };
    };
};