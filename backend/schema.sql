CREATE DATABASE IF NOT EXISTS journal_db;
USE journal_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS journals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 1. Buat/Izinkan user dari subnet VPC AWS 172.31.x.x
CREATE USER IF NOT EXISTS 'journal_user'@'172.31.%.%' IDENTIFIED BY 'PasswordSangatAman123!';

-- 2. Berikan hak akses penuh ke database journal_db
GRANT ALL PRIVILEGES ON journal_db.* TO 'journal_user'@'172.31.%.%';

-- 3. Reload privilese MySQL
FLUSH PRIVILEGES;
