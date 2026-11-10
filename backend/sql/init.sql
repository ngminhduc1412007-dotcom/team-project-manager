SET NAMES utf8mb4; -- để tiếng Việt không bị lỗi font

-- 1. Tạo database (chuẩn utf8mb4)
CREATE DATABASE IF NOT EXISTS team_project_manager
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE team_project_manager;

-- 2. Bảng users: email duy nhất, mật khẩu đã hash (bcrypt), vai trò
CREATE TABLE IF NOT EXISTS users (
    id INT NOT NULL AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('STUDENT', 'LECTURER', 'ADMIN') NOT NULL DEFAULT 'STUDENT',
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SHOW TABLES;
