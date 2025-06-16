// 7573253327:AAGK3qD_q2ZEx2bZ599xm8UsxpBrJdjprmo
// 1002188856350

require('dotenv').config();
const axios = require('axios');
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Настройка middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static('static'));

// Функция для чтения всех данных из папки `data`
function loadAllItems() {
  const dataPath = path.join(__dirname, 'data');
  const files = fs.readdirSync(dataPath);
  return files.map((file) => JSON.parse(fs.readFileSync(path.join(dataPath, file), 'utf-8')));
}

// Функция для загрузки данных конкретного пункта
function loadItemByRoute(route) {
  const items = loadAllItems();
  return items.find((item) => item.route === route) || null;
}

// Главная страница
app.get('/', (req, res) => {
  const items = loadAllItems();

  const gridHtml = items.map(
    (item) => `<li><a href='/item/${item.route}'>${item.name}</a></li>`
  ).join('');

  const itemsInfo = items.map((item) => `<a href='/item/${item.route}' class="service-info">
    <img src='${item.icon}' alt='${item.name}'>
    <h2>${item.name}</h2>
  </a>`).join('');

  const html = renderHtml('views/layout.html', {
    gridHtml, // Передаем здесь, чтобы оно было доступно в layout
    content: renderHtml('views/main.html', {itemsInfo})
  });
  res.send(html);
});

// Страницы пунктов
app.get('/item/:route', (req, res) => {
  const items = loadAllItems();
  const item = loadItemByRoute(req.params.route);

  const gridHtml = items.map(
      (item) => `<li><a href='/item/${item.route}'>${item.name}</a></li>`
  ).join('');

  if (!item) {
    return res.status(404).send('<h1>Страница не найдена</h1>');
  }

  const itemServices = item.services ? item.services.map((service) => `<li>
    <h3>${service.name}</h3>
    <p>${service.description}</p>
</li>`).join('') : `<div>Услуги не найдены</div>`;

  const html = renderHtml('views/layout.html', {
    gridHtml,
    content: renderHtml('views/item.html', {
      itemName: item.name,
      itemDescription: item.description,
      itemIcon: item.icon,
      itemImage: item.image,
      itemServices,
    })
  });
  res.send(html);
});

// // Функция для чтения HTML-файлов
// function renderHtml(filePath, replacements = {}) {
//   let html = fs.readFileSync(path.join(__dirname, filePath), 'utf-8');
//   for (const [key, value] of Object.entries(replacements)) {
//     html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
//   }
//   return html;
// }

function renderHtml(filePath, replacements = {}) {
  let html = fs.readFileSync(filePath, 'utf-8'); // Читаем основной файл

  // Загружаем header и footer
  let headerHtml = fs.readFileSync(path.join(__dirname, 'views/header.html'), 'utf-8');
  let footerHtml = fs.readFileSync(path.join(__dirname, 'views/footer.html'), 'utf-8');

  // Заменяем gridHtml в header, если оно передано
  if (replacements.gridHtml) {
    headerHtml = headerHtml.replace('{{gridHtml}}', replacements.gridHtml);
  }

  // Подставляем header и footer в основной HTML
  replacements.header = headerHtml;
  replacements.footer = footerHtml;

  // Выполняем подстановку всех {{ключей}} в основной HTML
  for (const [key, value] of Object.entries(replacements)) {
    html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }

  return html;
}

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;


// Обработчик формы
app.post('/submit-form', async (req, res) => {
  const { name, phone, email, problem, consultationType } = req.body;

  // Сообщение для Telegram
  const message = `
  📝 Новая заявка на консультацию:
  - Имя: ${name}
  - Телефон: ${phone}
  - Проблема: ${problem}
  - Формат консультации: ${consultationType}
  `;

  try {
    // Отправляем сообщение в Telegram
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: TELEGRAM_CHANNEL_ID,
      text: message,
    });

    res.send(onSuccess());
  } catch (error) {
    console.error('Ошибка отправки в Telegram:', error);
    res.status(500).send('<h1>Ошибка отправки данных. Пожалуйста, попробуйте позже.</h1>');
  }
});

function onSuccess() {
  let result = fs.readFileSync(path.join(__dirname, 'views/success.html'), 'utf-8');
  let head = fs.readFileSync(path.join(__dirname, 'views/header.html'), 'utf-8');
  result = result.replace(`{{header}}`, head);
  return result;
}


// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
