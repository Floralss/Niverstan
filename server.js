const express = require('express');
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Настройка заголовков, чтобы браузер понимал формат .7z и скачивал его
const staticOptions = {
    setHeaders: function (res, filePath) {
        if (filePath.endsWith('.7z')) {
            res.set('Content-Type', 'application/x-7z-compressed');
        }
    }
};

// Подключаем папку public со статическими файлами
app.use(express.static(path.join(__dirname, 'public'), staticOptions));

// Функция чтения ключей из файла key.txt
const getValidKeys = () => {
    try {
        const data = fs.readFileSync(path.join(__dirname, 'key.txt'), 'utf-8');
        return data.split('\n').map(key => key.trim()).filter(key => key.length > 0);
    } catch (err) {
        console.error("Ошибка чтения файла key.txt:", err);
        return [];
    }
};

// Проверка авторизации (Middleware)
const checkAuth = (req, res, next) => {
    const userKey = req.cookies.auth_key;
    const validKeys = getValidKeys();

    if (userKey && validKeys.includes(userKey)) {
        next();
    } else {
        res.redirect('/login');
    }
};

// Главная страница (доступна только после ввода ключа)
app.get('/', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Страница входа
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Обработка ввода ключа
app.post('/login', (req, res) => {
    const { key } = req.body;
    const validKeys = getValidKeys();

    if (validKeys.includes(key)) {
        // Сохраняем куку на 1 день
        res.cookie('auth_key', key, { maxAge: 24 * 60 * 60 * 1000, httpOnly: true });
        res.redirect('/');
    } else {
        res.send('<script>alert("Неверный ключ активации!"); window.location.href="/login";</script>');
    }
});

// Выход из системы
app.get('/logout', (req, res) => {
    res.clearCookie('auth_key');
    res.redirect('/login');
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер успешно запущен на http://localhost:${PORT}`);
});
