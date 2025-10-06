require('dotenv').config();

const Discord = require('discord.js');
const client = new Discord.Client({ intents: ['Guilds', 'GuildMessages', 'MessageContent', 'GuildWebhooks'] });

const X_STATUS_REGEX = /https?:\/\/x\.com\/([A-Za-z0-9_]+)\/status\/(\d+)/g;

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    let content = message.content;

    if (X_STATUS_REGEX.test(content)) {
        let newContent = content.replace(X_STATUS_REGEX, (match) => {
            return match.replace('x.com', 'fixupx.com');
        });

        if (newContent !== content) {
            try {
                const webhooks = await message.channel.fetchWebhooks();
                let webhook = webhooks.find(w => w.token); 

                if (!webhook) {
                    webhook = await message.channel.createWebhook({
                       name: 'FixupX',
                       avatar: client.user.displayAvatarURL(),
                    });
                }

                await webhook.send({
                    content: newContent,
                    username: message.author.displayName,
                    avatarURL: message.author.displayAvatarURL(),
                    files: message.attachments.map(attachment => ({
                        attachment: attachment.url,
                        name: attachment.name
                    }))
                });

                if (message.deletable) {
                    message.delete();
                }
            } catch (err) {
                console.error(err);
            }
        }
    }
});

client.login(process.env.TOKEN);

/* https://discord.com/oauth2/authorize?client_id=1424834006494478591&permissions=537191424&integration_type=0&scope=bot */