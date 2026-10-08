const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Настройка подключения к PostgreSQL через переменные окружения
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 5432,
});

// Инициализация таблицы в БД при старте
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS counter (
        id SERIAL PRIMARY KEY,
        views INT NOT NULL
      );
    `);
    const res = await pool.query('SELECT * FROM counter WHERE id = 1');
    if (res.rows.length === 0) {
      await pool.query('INSERT INTO counter (id, views) VALUES (1, 0)');
    }
    console.log('✅ База данных успешно инициализирована');
  } catch (err) {
    console.error('❌ Ошибка инициализации БД, повтор через 2 секунды...', err.message);
    setTimeout(initDB, 2000); // Рекурсивный повтор, если БД еще не поднялась
  }
}
initDB();

app.get('/', async (req, res) => {
  try {
    // Увеличиваем счетчик просмотров в БД
    const result = await pool.query('UPDATE counter SET views = views + 1 WHERE id = 1 RETURNING views');
    const currentViews = result.rows[0].views;
    res.send(`<h1>Привет! Это веб-приложение в Docker.</h1><p>Количество просмотров этой страницы: <b>${currentViews}</b></p>`);
  } catch (err) {
    res.status(500).send('Ошибка при работе с базой данных: ' + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Приложение запущено на порту ${PORT}`);
});
