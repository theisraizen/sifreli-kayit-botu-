const { 
    Client, GatewayIntentBits, EmbedBuilder, ButtonBuilder, ButtonStyle, 
    ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle 
} = require('discord.js');
require('dotenv').config();

const TOKEN = process.env.TOKEN;
const KAYITSIZ_ROL_ID = "";//bunlarıda biliyorsundur artık knk SKAJCAKJSCKJAS
const KAYITLI_ROL_ID = ""; //bunlarıda biliyorsundur artık knk SKAJCAKJSCKJAS
const LOG_KANALI_ID = ""; //bunlarıda biliyorsundur artık knk SKAJCAKJSCKJAS
const REGISTER_KANALI_ID = ""; //bunlarıda biliyorsundur artık knk SKAJCAKJSCKJAS
const KAYIT_SIFRESI = ""; // kayıt şifresi

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// ✅ Kullanıcıların yanlış şifre denemeleri için bir kayıt
let wrongAttempts = {};  // Kullanıcı id'lerine göre yanlış denemeleri tutan obje DOKUNMA

client.once('ready', async () => {
    console.log(`Bot ${client.user.tag} olarak giriş yaptı!`);
    client.user.setStatus('idle'); //botun status tarafı 01den. was here?
    client.user.setActivity("01den was here?", { type: 4 }); //type 4 yaparsan özel durum açılır senin için ardacım 

    const registerChannel = client.channels.cache.get(REGISTER_KANALI_ID);
    if (registerChannel) {
        // Kanalda daha önce kayıt mesajı var mı kontrol et
        const messages = await registerChannel.messages.fetch({ limit: 10 });
        if (!messages.some(msg => msg.author.id === client.user.id)) {
            const embed = new EmbedBuilder()
                .setTitle("01den was here?")
                .setDescription("Şifreyi gir ve kayıt ol! Eğer şifreyi bilmiyorsan siktir git sunucudan!") // kendine göre ayarlarsın artık
                .setColor(0xff0000);

            const button = new ButtonBuilder()
                .setCustomId('register')
                .setLabel('Kayıt Ol')
                .setStyle(ButtonStyle.Success);

            const row = new ActionRowBuilder().addComponents(button);

            await registerChannel.send({ embeds: [embed], components: [row] });
        }
    }
});

// ✅ SUNUCUYA YENİ ÜYE GELDİĞİNDE KAYITSIZ ROLÜ VER 01den. was here?
client.on('guildMemberAdd', async (member) => {
    const kayitsizRol = member.guild.roles.cache.get(KAYITSIZ_ROL_ID);
    if (kayitsizRol) {
        await member.roles.add(kayitsizRol);
        console.log(`${member.user.tag} adlı kullanıcıya kayıtsız rolü verildi.`);
    }
});

// ✅ KAYIT BUTONUNA BASILDIĞINDA MODAL AÇ 01den. was here?
client.on('interactionCreate', async interaction => {
    if (interaction.isButton() && interaction.customId === 'register') {
        const modal = new ModalBuilder()
            .setCustomId('register_modal')
            .setTitle('Kayıt Ol');

        const passwordInput = new TextInputBuilder()
            .setCustomId('password_input')
            .setLabel('Lütfen şifreyi girin')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Şifreyi buraya yaz...')
            .setRequired(true);

        const row = new ActionRowBuilder().addComponents(passwordInput);
        modal.addComponents(row);

        await interaction.showModal(modal);
    }
});

// ✅ MODAL GÖNDERİLDİĞİNDE KONTROL YAP 01den. was here?
client.on('interactionCreate', async interaction => {
    if (!interaction.isModalSubmit() || interaction.customId !== 'register_modal') return;

    const password = interaction.fields.getTextInputValue('password_input');
    const member = interaction.guild.members.cache.get(interaction.user.id);
    const kayitsizRol = interaction.guild.roles.cache.get(KAYITSIZ_ROL_ID);
    const kayitliRol = interaction.guild.roles.cache.get(KAYITLI_ROL_ID);

    // Eğer kullanıcı için daha önce yanlış denemeler varsa
    if (!wrongAttempts[member.id]) { // dokunma
        wrongAttempts[member.id] = 0;  // Başlangıçta 0 deneme
    }

    if (password === KAYIT_SIFRESI) {
        if (kayitsizRol && member.roles.cache.has(KAYITSIZ_ROL_ID)) {
            await member.roles.remove(kayitsizRol);
        }
        if (kayitliRol) {
            await member.roles.add(kayitliRol);
        }

        await interaction.reply({ content: "✅ Tebrikler, kayıt işlemin tamamlandı!", ephemeral: true });

        const logChannel = client.channels.cache.get(LOG_KANALI_ID);
        if (logChannel) {
            logChannel.send(`✅ ${member.user.tag} adlı kullanıcı başarıyla kayıt oldu!`);
        }

        // Başarılı kayıttan sonra yanlış deneme sayısını sıfırla
        wrongAttempts[member.id] = 0;
    } else {
        wrongAttempts[member.id]++;  // Yanlış şifre denemesi ekle

        // Eğer 3. yanlış denemeyi yaptıysa, kullanıcıyı sunucudan at
        if (wrongAttempts[member.id] >= 3) {
            await interaction.reply({ content: "❌ Yanlış şifreyi 3 kez girdiniz! Sunucudan atılıyorsunuz.", ephemeral: true });
            try {
                await member.kick("Yanlış şifreyi 3 kez girdi.");
            } catch (error) {
                console.error(`Kullanıcı atılamadı: ${error.message}`);
            }
            // Yanlış denemeleri sıfırla
            delete wrongAttempts[member.id];
        } else {
            await interaction.reply({ content: `❌ Yanlış şifre girdiniz! Kalan denemeniz: ${3 - wrongAttempts[member.id]}`, ephemeral: true });
        }
    }
});

client.login(TOKEN);
