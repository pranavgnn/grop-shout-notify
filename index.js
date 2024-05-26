const { Client, Events, GatewayIntentBits } = require('discord.js');
const crypto = require("crypto");

require("dotenv").config();

const client = new Client({ intents: [GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages] });

const groupUrl = `https://groups.roblox.com/v1/groups/${process.env.GROUP_ID}`;

const stringifyShout = (shout) => {
    return `${shout.body}_${shout.poster.userId}_${shout.created}`;
}

const hash = (string) => {
    return crypto.createHash('md5').update(string).digest('hex');
}

client.once(Events.ClientReady, async readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);

    const announceChannel = await readyClient.channels.fetch(process.env.ANNOUNCE_CHANNEL_ID);
    let prevShoutChannel = await readyClient.channels.fetch(process.env.PREV_SHOUT_CHANNEL_ID);

    const allMessages = await prevShoutChannel.messages.fetch({ limit: 1 });
    let prevMessage = allMessages?.first();

    const scrape = async () => {
        const response = await fetch(groupUrl);
        if (!response || response.status !== 200) return;

        const json = await response.json();
        if (!json) return;

        const shout = json.shout;
        if (!shout) return;

        const stringified = stringifyShout(shout);
        const shoutHash = hash(stringified);

        if (prevMessage && prevMessage.content.startsWith(shoutHash)) return;

        announceChannel.send(shout.body);

        prevMessage = await prevShoutChannel.send(`${shoutHash}\n${stringified}`);
    }

    setInterval(scrape, process.env.SCRAPE_INTERVAL * 1000);
    scrape();
});

client.login(process.env.TOKEN);