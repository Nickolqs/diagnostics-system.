const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./users.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Database connected successfully.');
    }
});

// Створення таблиці користувачів, якщо вона не існує
db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL
    )
`);

module.exports = db;
