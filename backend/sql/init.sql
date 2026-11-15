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

-- 3. Bảng projects: tên, mô tả, hạn chót, chủ dự án có khóa ngoại tới users(id)
CREATE TABLE IF NOT EXISTS projects (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL COMMENT 'Tên dự án',
    description TEXT NULL COMMENT 'Mô tả dự án',
    start_date DATETIME NULL COMMENT 'Ngày bắt đầu dự án',
    deadline DATETIME NULL COMMENT 'Hạn chót dự án',
    status ENUM('planning', 'in_progress', 'completed') NOT NULL DEFAULT 'planning' COMMENT 'Trạng thái dự án: lập kế hoạch, đang thực hiện, đã hoàn thành',
    owner_id INT NOT NULL COMMENT 'Chủ dự án (khóa ngoại users.id)',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_projects_owner_id (owner_id),
    CONSTRAINT fk_projects_owner FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Bảng tasks: công việc thuộc dự án, người được giao, độ ưu tiên, trạng thái
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    due_date DATE NULL,
    priority ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
    status ENUM('todo', 'in_progress', 'done', 'cancelled') NOT NULL DEFAULT 'todo',
    assignee_id INT NULL,
    project_id INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_tasks_assignee
        FOREIGN KEY (assignee_id) REFERENCES users (id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_tasks_project
        FOREIGN KEY (project_id) REFERENCES projects (id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Bảng thành viên dự án: liên kết projects <-> users + vai trò
CREATE TABLE IF NOT EXISTS project_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('owner', 'admin', 'member', 'viewer') NOT NULL DEFAULT 'member',
    joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pm_project
        FOREIGN KEY (project_id) REFERENCES projects (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_pm_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    -- Mỗi user chỉ có 1 vai trò trong 1 project
    CONSTRAINT uq_pm_project_user
        UNIQUE (project_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SHOW TABLES;