const TelegramBot = require('node-telegram-bot-api');
const InstagramScraper = require('instagram-scraper-api');


require('dotenv').config(); // Get it from .env
const token = process.env.TOKEN; 
//const token = '32fffref229sfe389615:AAHhJ';


const bot = new TelegramBot(token, { polling: true });

const channels = ['@channel1', '@channel2']; // کانال‌های مورد نظر را اینجا اضافه کنید

// تابع برای چک کردن عضویت کاربر در کانال‌ها
async function checkUserMembership(userId) {
  for (const channel of channels) {
    try {
      const chatMember = await bot.getChatMember(channel, userId);
      if (chatMember.status === 'left' || chatMember.status === 'kicked') {
        return false;
      }
    } catch (error) {
      return false;
    }
  }
  return true;
}

// تابع برای دانلود محتوای اینستاگرام
async function downloadInstagramContent(url) {
  const scraper = new InstagramScraper();
  const media = await scraper.getMediaByUrl(url);
  return media; // بازگشت محتوای دانلود شده
}

// هندلر برای دستور /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = `
    خوش آمدید!
    لطفاً لینک پست اینستاگرام را کپی کرده و اینجا ارسال کنید تا من ویدیو یا عکس را بدون واترمارک برای شما ارسال کنم.
  `;
  bot.sendMessage(chatId, welcomeMessage);
});

// هندلر برای پیام‌ها
bot.on('message', async (msg) => {
  const userId = msg.from.id;
  const text = msg.text;
  const chatId = msg.chat.id;

  // اگر پیام کاربر دستور /start بود، این قسمت را نادیده بگیر
  if (text.startsWith('/start')) {
    return;
  }

  const isMember = await checkUserMembership(userId);
  if (isMember) {
    if (text && text.includes('instagram.com')) {
      try {
        const content = await downloadInstagramContent(text);
        if (content.type === 'image') {
          await bot.sendPhoto(chatId, content.url);
        } else if (content.type === 'video') {
          await bot.sendVideo(chatId, content.url);
        } else {
          bot.sendMessage(chatId, 'محتوای دانلود شده نامعتبر است.');
        }
      } catch (error) {
        bot.sendMessage(chatId, 'خطا در دانلود محتوا. لطفاً دوباره تلاش کنید.');
      }
    } else {
      bot.sendMessage(chatId, 'لطفاً یک لینک معتبر اینستاگرام ارسال کنید.');
    }
  } else {
    bot.sendMessage(chatId, `لطفاً ابتدا در کانال‌های زیر عضو شوید: ${channels.join(', ')}`);
  }
});

console.log('ربات در حال اجراست...');
