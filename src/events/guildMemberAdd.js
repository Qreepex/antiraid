const { MessageEmbed, GuildMemberManager, GuildAuditLogs, GuildMember, MessageActionRow, MessageButton } = require("discord.js");
const BaseEvent = require("../classes/Event.js");
const Bot = require("../classes/Bot.js");
const raidSchema = require("../schemas/raidData.js");
const joinSchema = require("../schemas/joinData.js");
const { writeFileSync } = require("fs");

class GuildMemberAddEvent extends BaseEvent {
    constructor() {
        super('guildMemberAdd');
    };

    /**
     * 
     * @param {Bot} client 
     * @param {GuildMember} member
     */

    async run(client, member) {
        if(member.partial) await member.fetch();
        let autokicked = false;
        let raidkicked = null;

        await client.joins.set(member.user.id, member);
        setTimeout(() => {
            client.joins.delete(member.user.id);
        }, 5 * 60 * 1000);

        console.log(1);

        let joinLog = client.logs.join;
        if(joinLog) {
            await Promise.all([
                joinLog.send("====="),
                joinLog.send(`ID: ${member.user.id}\nUser: ${member.user.tag}\nTime: ${new Date().toUTCString()} | ${new Date().getTime()} | <t:${Math.floor(new Date().getTime()/1000)}:f>`),
            ]);
        };

        if(client.autokick.do && client.autokick.reason && client.autokick.id) {
            let raidData = await raidSchema.findById(client.autokick.id);
            raidData.accounts.push(member.user.id);
            await raidData.save();
            
            let autokickContent = `:construction: **Raid Schutz:** Du wurst aus Sicherheitsgründen vom Server gekickt. Bitte joine in eigenen Minuten oder Stunden erneut.\n**Grund:** ${client.autokick.reason}`;
            
            let autokickRow = new MessageActionRow()
                .addComponents([
                    new MessageButton()
                        .setStyle("LINK")
                        .setURL("https://naaihr-community.de/raid-kick")
                        .setDisabled(false)
                        .setLabel("More Information")
                    ]);

            let sent = true;
            await member.send({ components: [ autokickRow ], content: autokickContent }).catch(e => { sent = false; console.log(e); });

            let kick = true;
            await member.kick(`Autokick | ${client.autokick.reason}`).catch(e => { kick = false });

            let autokickLog = client.logs.autokick;
            if(autokickLog) {
                await autokickLog.send({ content: `ID: ${member.user.id}\nDM: ${sent ? ":white_check_mark:" : ":x:"}\nKick: ${kick ? ":white_check_mark:" : ":x:"}` });
            };

            autokicked = true;
        };

        // raid detected
        if(client.joins.size >= client.config.antiraid.joins && !autokicked) {
            let raidData = new raidSchema({
                accounts: client.joins.map(m => m.user.id),
                start: client.joins.first().joinedTimestamp
            })

            raidData = await raidData.save();

            client.autokick.do = true;
            client.autokick.reason = `Raid Detected: \`${raidData?._id}\`\nStart: ${new Date(raidData.start).toUTCString()}`;
            client.autokick.id = raidData?._id;
            writeFileSync("./config/autokick.json", JSON.stringify(client.autokick));

            client.logs.raid.send({ content: `🚨 **Detected Raid**\nID: ${raidData?._id}\n\nStart: ${new Date(raidData.start).toUTCString()}\n\n<@&699743915628036189>`});

            await client.massKick("699742385919229963", raidData?._id, raidData.accounts);

            raidkicked = raidData?._id;
        };

        let joinData = new joinSchema({
            userid: member.user.id,
            usertag: member.user.tag,
            raidID: raidkicked,
            autokicked: autokicked,
            raidkicked: raidkicked ? true : false,
        })

        await joinData.save();
    };
};

module.exports = GuildMemberAddEvent;