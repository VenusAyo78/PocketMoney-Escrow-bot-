
const { Telegraf } = require('telegraf');
const express = require('express');
const mongoose = require('mongoose');
const app = express();
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);
app.use(bot.webhookCallback('/telegram-bot'));

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const Deal = mongoose.model('Deal', new mongoose.Schema({
  userId: String,
  title: String,
  amount: String,
  deadline: String,
  status: { type: String, default: 'pending' }
}));

bot.start((ctx) => {
  ctx.reply('Welcome to Escrow Mini App! Use /create_deal to begin.');
});

bot.command('create_deal', (ctx) => {
  ctx.reply('Please send deal details in the format:\nTitle | Amount (TON) | Deadline');
});

bot.on('text', async (ctx) => {
  const [title, amount, deadline] = ctx.message.text.split('|').map(x => x.trim());
  if (!title || !amount || !deadline) return;
  const newDeal = new Deal({
    userId: ctx.from.id,
    title,
    amount,
    deadline
  });
  await newDeal.save();
  ctx.reply(`Deal created:\nTitle: ${title}\nAmount: ${amount} TON\nDeadline: ${deadline}`);
});

app.get('/', (req, res) => res.send('Escrow Bot Server Running'));

bot.telegram.setWebhook(process.env.SERVER_URL + '/telegram-bot');

app.listen(3000, () => console.log('Server running on port 3000'));
