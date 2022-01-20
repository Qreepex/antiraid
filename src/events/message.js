const BaseEvent = require("../classes/Event");
const { MessageEmbed, Message, MessageActionRow, MessageButton } = require("discord.js")
const Bot = require("../classes/Bot.js");

class MessageEvent extends BaseEvent {
    constructor() {
        super('messageCreate');
    };

    /**
     * @param {Bot} client 
     * @param {Message} msg 
     */

    async run(client, msg) {

    };
};

module.exports = MessageEvent;