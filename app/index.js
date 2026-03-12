process.on('unhandledRejection', (reason) => {
  console.error('error:', reason);
});

const { ShardingManager } = require("discord.js");
require("dotenv").config();

const manager = new ShardingManager("./bot.js", {
  token: process.env.DISCORD_BOT_TOKEN,
  totalShards: "auto",
});

manager.on("shardCreate", shard => {
  console.log(`Shard ${shard.id} 起動中...`);
});

manager.spawn().then(async () => {
  try {
    const results = await manager.fetchClientValues("guilds.cache.size");
    const total = results.reduce((a, b) => a + b, 0);
    console.log(`Botは ${total} サーバーに参加中`);
  } catch (err) {
    console.error("fetchClientValues 失敗:", err);
  }
});
