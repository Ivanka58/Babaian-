const TelegramBot = require('node-telegram-bot-api');

// Замените 'YOUR_BOT_TOKEN' на токен вашего бота, полученный от BotFather
const token = '8198170223:AAEpUoti6Ze1VElNLuWF48MqZVZa4qCZxxE';

// Создаем экземпляр бота
const bot = new TelegramBot(token, { polling: true });

// Переменная для хранения ID пользователя, сообщения которого нужно удалять
let userIdToDelete = null;

// Обработчик команды /deleteuser
bot.onText(/\/deleteuser (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const userId = match[1];

  // Проверяем, является ли отправитель администратором группы
  bot.getChatMember(chatId, msg.from.id)
    .then(chatMember => {
      if (chatMember.status === 'administrator' || chatMember.status === 'creator') {
        // Пытаемся преобразовать userId в число
        const parsedUserId = parseInt(userId, 10);

        if (isNaN(parsedUserId)) {
          bot.sendMessage(chatId, 'Неверный формат ID пользователя. Пожалуйста, укажите число.');
          return;
        }

        userIdToDelete = parsedUserId;
        bot.sendMessage(chatId, `Теперь я буду удалять сообщения пользователя с ID: ${userIdToDelete}`);
      } else {
        bot.sendMessage(chatId, 'У вас нет прав на выполнение этой команды.');
      }
    })
    .catch(error => {
      console.error('Ошибка при проверке прав администратора:', error);
      bot.sendMessage(chatId, 'Произошла ошибка при проверке прав. Пожалуйста, попробуйте позже.');
    });
});

// Обработчик команды /stopdelete
bot.onText(/\/stopdelete/, (msg) => {
  const chatId = msg.chat.id;

  // Проверяем, является ли отправитель администратором группы
  bot.getChatMember(chatId, msg.from.id)
    .then(chatMember => {
      if (chatMember.status === 'administrator' || chatMember.status === 'creator') {
        userIdToDelete = null;
        bot.sendMessage(chatId, 'Удаление сообщений остановлено.');
      } else {
        bot.sendMessage(chatId, 'У вас нет прав на выполнение этой команды.');
      }
    })
    .catch(error => {
      console.error('Ошибка при проверке прав администратора:', error);
      bot.sendMessage(chatId, 'Произошла ошибка при проверке прав. Пожалуйста, попробуйте позже.');
    });
});

// Обработчик всех сообщений
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  if (userIdToDelete !== null && msg.from.id === userIdToDelete) {
    bot.deleteMessage(chatId, msg.message_id)
      .then(() => {
        console.log(`Удалено сообщение от пользователя ${userIdToDelete}`);
      })
      .catch(error => {
        console.error('Ошибка при удалении сообщения:', error);
        // Обрабатываем возможные ошибки, например, недостаточно прав у бота
        if (error.code === 'ETELEGRAM') {
          if (error.message.includes('message to delete not found')) {
            // Сообщение уже удалено
            console.log('Сообщение уже удалено');
          } else if (error.message.includes('can\'t delete message that is not yours')) {
            // Бот не может удалять чужие сообщения (если это так настроено)
            console.log('Бот не может удалять чужие сообщения (только свои)');
          } else if (error.message.includes('BOT_MISSING_PERMISSIONS')) {
            bot.sendMessage(chatId, "У бота недостаточно прав для удаления сообщений.  Убедитесь, что бот является администратором с правом удаления сообщений.");
            // Останавливаем удаление, чтобы не спамить ошибками
            userIdToDelete = null;
          }
        }
      });
  }
});

// Обработчик ошибок polling
bot.on('polling_error', (error) => {
  console.error('Ошибка Polling:', error);
});

console.log('Бот запущен!');
