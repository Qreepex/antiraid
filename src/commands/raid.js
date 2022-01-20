const { CommandInteraction, MessageEmbed } = require("discord.js");
const Command = require("../classes/Command.js");
const Bot = require("../classes/Bot.js");
const raidSchema = require("../schemas/raidData.js");
const { isValidObjectId } = require("mongoose");
const { writeFileSync } = require("fs");

module.exports = class extends Command {
    constructor(client) {
        super(client, {
            name:"raid",
            description:"[Mods] Anti Raid Commands",
            options: [
                {
                    name: "status",
                    description: "Zeigt den aktuellen Antiraid Status an.",
                    type: 1
                },{
                    name: "info",
                    description: "Zeigt Infos über einen Raid.",
                    type: 1,
                    options: [
                        {
                            name: "raid-id",
                            type: 3,
                            description: "Die ID des Raids",
                            required: true
                        }
                    ]
                },{
                    name: "stop",
                    description: "Beendet einen Raid.",
                    type: 1
                },{
                    name: "start",
                    description: "Aktiviert das Antiraid System.",
                    type: 1,
                    options: [
                        {
                            name: "reason",
                            type: 3,
                            description: "Der Grund, weshalb das Antiraid System aktiviert werden soll.",
                            required: true
                        }
                    ]
                }
            ],
        });
    };

    /**
     * 
     * @param {CommandInteraction} interaction
     * @param {Bot} client
     */   

    async run(interaction, client) {
        const options = interaction.options;
        const args = options.data[0].options;
        
        let command = options._subcommand;

        if(command === "info") {
            let id = args[0]?.value;
            if(!isValidObjectId(id))
                return await this.error(interaction, "Invalid Raid ID");

            let data = await raidSchema.findById(args[0]?.value)
            if(!data)
                return await this.error(interaction, "Invalid Raid ID");

            let infoEmbed = new MessageEmbed()
                .setTitle(`Raid: ${data._id}`)
                .setDescription(`\`\`\`${data.accounts.join(" ")}\`\`\``)
                .addField("Start", `${new Date(data.start).toUTCString()}`, true)
                .addField("Ende", `${new Date(data.end).toUTCString()}`, true);

            return await this.response(interaction, infoEmbed)
        } else if(command === "status") {
            if(client.autokick.do && client.autokick.id && client.autokick.reason) {
                let statusEmbed = new MessageEmbed()
                    .setTitle("Status: RAID")
                    .setColor("#ff0000")
                    .setDescription(`The antiraid system is currently handling the raid \`${client.autokick.id}\`.`);

                return await this.response(interaction, statusEmbed)
            } else {
                let statusEmbed = new MessageEmbed()
                    .setTitle("Status: PEACE")
                    .setColor("GREEN")
                    .setDescription(`The antiraid system is currently NOT handling a raid.`);

                return await this.response(interaction, statusEmbed);
            }
        } else if(command === "stop") {
            if(!client.autokick.do)
                return await this.error(interaction, ":x: Das Antiraid System ist bereits auf Standby.")

            client.autokick.do = false;
            client.autokick.id = null;
            client.autokick.reason = null;
            writeFileSync("./config/autokick.json", JSON.stringify(client.autokick));

            return this.response(interaction, ":white_check_mark: Der Antiraid System wurde wieder auf Stand by gestellt.")
        } else if(command === "start") {
            if(client.autokick.do)
                return await this.error(interaction, ":x: Das Antiraid System ist bereits aktiviert.")

            let reason = args[0]?.value;

            let raidData = new raidSchema({
                accounts: client.joins.map(m => m.user.id),
                start: client.joins.first().joinedTimestamp
            })

            raidData = await raidData.save();

            client.autokick.do = true;
            client.autokick.reason = `Raid Detected: \`${raidData?._id}\`\nStart: ${new Date(raidData.start).toUTCString()}\nDetails: ${reason}`;
            client.autokick.id = raidData?._id;
            writeFileSync("./config/autokick.json", JSON.stringify(client.autokick));

            client.logs.raid.send({ content: `🚨 **Detected Raid**\nID: ${raidData?._id}\n\nStart: ${new Date(raidData.start).toUTCString()}\n\nMod: ${interaction.member.user.tag} | ${interaction.member.user.id}\n\n<@&699743915628036189>`});

            this.response(interaction, ":white_check_mark: Das Antiraid System wurde aktiviert und nimmt jetzt die Arbeit auf.")

            return await client.massKick("699742385919229963", raidData?._id, raidData.accounts);
        };
    };
};