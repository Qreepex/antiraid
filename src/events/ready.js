const { MessageEmbed, GuildMemberManager, GuildAuditLogs, MessageAttachment } = require("discord.js");
const BaseEvent = require("../classes/Event.js");
const Bot = require("../classes/Bot.js");

module.exports = class extends BaseEvent {
    constructor() {
        super('ready');
    };

    /**
     * 
     * @param {Bot} client 
     */

    async run(client) {
        client.Logger.info(`Logged in at ${new Date().toLocaleString().replace(",","")} as ${client.user.tag} [${client.user.id}]`, "CLIENT");

        client.logs.join     = client.channels.cache.get(client.config.logs.join)     || await client.channels.fetch(client.config.logs.join).catch(e => {});
        client.logs.raid     = client.channels.cache.get(client.config.logs.raid)     || await client.channels.fetch(client.config.logs.raid).catch(e => {});
        client.logs.autokick = client.channels.cache.get(client.config.logs.autokick) || await client.channels.fetch(client.config.logs.autokick).catch(e => {});

        client.commands.forEach(command => {
            command.initialize("699742385919229963")
        })
    };
};