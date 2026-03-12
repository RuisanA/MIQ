const { Client, Intents, MessageEmbed, MessageActionRow, MessageButton, MessageAttachment} = require("discord.js");
const https = require("https");
const http = require("http");
const express = require('express');
const app = express();
const fs = require('fs');
const axios = require('axios');
const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');
const cron = require('node-cron');
require('dotenv').config();
const client = new Client({
  partials: ["CHANNEL"],
  intents: new Intents(32767)
});
const newbutton = (buttondata) => {
  return {
    components: buttondata.map((data) => {
      return {
        custom_id: data.id,
        label: data.label,
        style: data.style || 1,
        url: data.url,
        emoji: data.emoji,
        disabled: data.disabled,
        type: 2,
      };
    }),
    type: 1,
  };
};
let c;
process.env.TZ = 'Asia/Tokyo'
"use strict";
let guildId
let pass = [3,5,0,9,1,2,4,11,8,7,6,10]

if (process.env.DISCORD_BOT_TOKEN == undefined) {
  console.error('tokenが設定されていません！')
  process.exit(0)
}

client.on('ready', async () => {
console.log(`${client.user.tag}`);
});

registerFont('./fonts/MPLUSRounded1c-Regular.ttf', { family: 'MPLUS' });

const BRAND = "R.BOT#0961";

function getColumnWidth(text) {
    let width = 0;
    for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i);
        if ((code >= 0x00 && code < 0x81) || (code === 0xf8f0) || (code >= 0xff61 && code <= 0xff9f)) {
            width += 1;
        } else {
            width += 2;
        }
    }
    return width;
}

function wrapText(text, maxWidth = 32) {
    const lines = [];
    let currentLine = "";
    const paragraphs = text.split('\n');
    for (const paragraph of paragraphs) {
        for (const char of paragraph) {
            if (getColumnWidth(currentLine + char) <= maxWidth) {
                currentLine += char;
            } else {
                lines.push(currentLine);
                currentLine = char;
            }
        }
        lines.push(currentLine);
        currentLine = "";
    }
    return lines.filter(l => l !== "");
}

async function createQuote(name, id, content, iconUrl, isColor = false) {
    const canvas = createCanvas(1280, 720);
    const ctx = canvas.getContext('2d');

    const [base, gd, iconResponse] = await Promise.all([
        loadImage('./images/base.png'),
        loadImage('./images/base-gd.png'),
        axios.get(iconUrl, { responseType: 'arraybuffer' })
    ]);
    const icon = await loadImage(Buffer.from(iconResponse.data));
  
    ctx.drawImage(icon, 0, 0, 720, 720);

    if (!isColor) {
        const imgData = ctx.getImageData(0, 0, 720, 720);
        for (let i = 0; i < imgData.data.length; i += 4) {
            const avg = (imgData.data[i] + imgData.data[i+1] + imgData.data[i+2]) / 3;
            imgData.data[i] = imgData.data[i+1] = imgData.data[i+2] = avg * 0.7;
        }
        ctx.putImageData(imgData, 0, 0);
    }

    ctx.drawImage(gd, 0, 0);
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    
    ctx.font = '55px "MPLUS"';
    const lines = wrapText(content, 28); 
    let currentY = 270 - ((lines.length - 1) * 30);

    for (const line of lines) {
        ctx.fillText(line, 890, currentY);
        currentY += 70;
    }

    ctx.font = '28px "MPLUS"';
    ctx.fillText(`@${name}`, 890, currentY + 40);
    ctx.fillStyle = '#B4B4B4';
    ctx.font = '18px "MPLUS"';
    ctx.fillText(id, 890, currentY + 75);
    ctx.fillStyle = '#787878';
    ctx.textAlign = 'right';
    ctx.fillText(BRAND, 1270, 710);

    return canvas.toBuffer();
}

client.on('messageCreate', async (message) => {
    if (message.type !== "REPLY" || !message.reference?.messageId) return;

    if (
      !message.content.startsWith(`<@!${client.user.id}>`) &&
      !message.content.startsWith(`<@${client.user.id}>`)
    ) {
      return;
    }

    let replyMessage;
    try {
      replyMessage = await message.fetchReference();
    } catch (error) {
      console.error("Failed to fetch the reference message:", error);
      return;
    }

    try {
        const ref = await message.channel.messages.fetch(message.reference.messageId);
        
        const generateAndSend = async (isColorMode, interaction = null) => {
            const buffer = await createQuote(
                ref.author.username,
                ref.author.id,
                ref.content || "(No Text)",
                ref.author.displayAvatarURL({ format: 'png', size: 1024 }),
                isColorMode
            );
            const attachment = new MessageAttachment(buffer, 'quote.png');

            const row = new MessageActionRow().addComponents(
                new MessageButton().setCustomId('toggle_color').setLabel(isColorMode ? '◪' : '🎨').setStyle('SECONDARY'),
                new MessageButton().setCustomId('delete_quote').setLabel('🗑削除する').setStyle('SECONDARY')
            );

            if (interaction) {
                await interaction.update({ files: [attachment], components: [row] });
            } else {
                return await message.reply({ files: [attachment], components: [row] });
            }
        };

        const reply = await generateAndSend(false);

        const collector = reply.createMessageComponentCollector({ time: 120000 });
        let currentColor = false;

        collector.on('collect', async (i) => {
            if (i.user.id !== message.author.id) return i.reply({ content: '実行者のみ操作可能です。', ephemeral: true });

            if (i.customId === 'delete_quote') {
                await reply.delete();
                const embed = new MessageEmbed().setColor('#ff0000').setTitle('🗑 Delete').setDescription(`${i.user} がメッセージを削除しました。メッセージはメッセージ製作者のみ削除できるようになっています。`);
                return message.channel.send({ embeds: [embed] });
            }

            if (i.customId === 'toggle_color') {
                currentColor = !currentColor;
                await generateAndSend(currentColor, i);
            }
        });

    } catch (e) {
        console.error(e);
        message.reply("エラーが発生しました。");
    }
});

client.login(process.env.DISCORD_BOT_TOKEN)
