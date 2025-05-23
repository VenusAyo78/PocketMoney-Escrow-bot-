require('dotenv').config();
const { Telegraf } = require('telegraf');
const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const bot = new Telegraf(process.env.BOT_TOKEN);

// MongoDB schema
const dealSchema = new mongoose.Schema({
  task: String,
  budget: String,
  deadline: String,
  createdBy: String,
  createdAt: { type: Date, default: Date.now }
});
const Deal = mongoose.model('Deal', dealSchema);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Bot logic
bot.start((ctx) => {
  ctx.reply('Welcome to *Escrow Bot*! To create a deal, send a message like:\n\n`Web Design | 100 TON | 7 days`', {
    parse_mode: 'Markdown'
  });
});

bot.on('text', async (ctx) => {
  try {
    const input = ctx.message.text;
    const [task, budget, deadline] = input.split('|').map(x => x.trim());

    if (!task || !budget || !deadline) {
      return ctx.reply('⚠️ Please send details in this format:\n\n`task | budget | deadline`', {
        parse_mode: 'Markdown'
      });
    }

    const deal = new Deal({
      task,
      budget,
      deadline,
      createdBy: ctx.from.username || ctx.from.first_name
    });

    await deal.save();

    ctx.reply(`✅ *Deal Created!*\n\n*Task:* ${task}\n*Budget:* ${budget} TON\n*Deadline:* ${deadline}`, {
      parse_mode: 'Markdown'
    });

  } catch (err) {
    console.error('Error saving deal:', err);
    ctx.reply('❌ Something went wrong while creating the deal. Please try again.');
  }
});

// Webhook setup
app.use(bot.webhookCallback('/telegram-bot'));
bot.telegram.setWebhook(`${process.env.SERVER_URL}/telegram-bot`);

app.get('/', (req, res) => {
  res.send('Escrow bot server is running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});