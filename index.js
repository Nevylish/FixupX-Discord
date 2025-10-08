require('dotenv').config();

const {Client, ActivityType} = require('discord.js');
const client = new Client({ intents: ['Guilds', 'GuildMessages', 'MessageContent'] });

const POST_REGEX = /https?:\/\/(x|twitter)\.com\/([A-Za-z0-9_]+)\/status\/(\d+)(\S*)/g;

const webhookCache = new Map();

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    if (!POST_REGEX.test(message.content)) return;

    POST_REGEX.lastIndex = 0;

    let newContent = message.content.replace(POST_REGEX, (match) => {
        const fixedUrl = match.replace(/(x|twitter)\.com/, 'fixupx.com');
        return fixedUrl.split('?')[0];
    });

    if (newContent === message.content) return;
    
    try {
        const permissions = ['ManageWebhooks', 'ManageMessages'];
        const missing = message.channel.permissionsFor(message.guild.members.me).missing(permissions);
        if (missing.length > 0) {
            return;
        }

        let webhook = webhookCache.get(message.channel.id);
        if (!webhook) {
            const webhooks = await message.channel.fetchWebhooks();
            let existingWebhook = webhooks.find(w => w.token /*w.owner.id === client.user.id*/);

            if (!existingWebhook) {
                existingWebhook = await message.channel.createWebhook({
                    name: 'FixupX',
                    avatar: client.user.displayAvatarURL(),
                });
            }
            webhook = existingWebhook;
            webhookCache.set(message.channel.id, webhook);
        }

        await webhook.send({
            content: newContent,
            username: message.member.displayName,
            avatarURL: message.member.displayAvatarURL(),
            files: message.attachments.map(a => a.url)
        });

        if (message.deletable) {
            message.delete();
        }

    } catch (err) {
        console.error(err);
        webhookCache.delete(message.channel.id);
    }
});

client.on('clientReady', () => {
    const setWatchingActivity = () => {
        client.user.setActivity('X posts', { type: ActivityType.Watching });
    };

    setWatchingActivity();

    setInterval(setWatchingActivity, 3600000);
});

client.login(process.env.TOKEN);