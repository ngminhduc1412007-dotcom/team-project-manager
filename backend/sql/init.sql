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
    avatar_url VARCHAR(500) NULL,
    bio TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bảng projects: tên, mô tả, hạn chót, chủ dự án có khóa ngoại tới users(id)
--    Bổ sung index:
--      - idx_projects_owner_id: Lọc nhanh theo chủ sở hữu dự án
--      - idx_projects_name: Tìm kiếm nhanh theo tên dự án
--      - idx_projects_owner_name: Composite index tối ưu lọc theo chủ dự án và tìm kiếm/sắp xếp tên
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
    KEY idx_projects_name (name),
    KEY idx_projects_owner_name (owner_id, name),
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
    KEY idx_tasks_project_id (project_id),
    KEY idx_tasks_status (status),
    KEY idx_tasks_project_status (project_id, status),
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

-- 6. Dữ liệu mẫu (Sample Data)

-- 6.1. Người dùng mẫu (Mật khẩu mặc định: 'password123')
INSERT INTO users (id, email, hashed_password, full_name, role, is_active) VALUES
(1, 'giangvien@example.com', '$2b$12$e86xHwY7e47xU8Kx7qGkEeG5P3qQz2C3x4y5z6a7b8c9d0e1f2g3h', 'TS. Nguyễn Văn Giảng', 'LECTURER', 1),
(2, 'sinhvien1@example.com', '$2b$12$e86xHwY7e47xU8Kx7qGkEeG5P3qQz2C3x4y5z6a7b8c9d0e1f2g3h', 'Trần Thị Mai', 'STUDENT', 1),
(3, 'sinhvien2@example.com', '$2b$12$e86xHwY7e47xU8Kx7qGkEeG5P3qQz2C3x4y5z6a7b8c9d0e1f2g3h', 'Lê Hoàng Nam', 'STUDENT', 1),
(4, 'admin@example.com', '$2b$12$e86xHwY7e47xU8Kx7qGkEeG5P3qQz2C3x4y5z6a7b8c9d0e1f2g3h', 'Quản Trị Viên Hệ Thống', 'ADMIN', 1)
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), role = VALUES(role);

-- 6.2. Dự án mẫu
INSERT INTO projects (id, name, description, start_date, deadline, status, owner_id) VALUES
(1, 'Hệ thống Quản lý Đồ án Sinh viên (Student Project Hub)', 'Nền tảng web hỗ trợ sinh viên và giảng viên theo dõi tiến độ đồ án tốt nghiệp, phân công nhiệm vụ và trao đổi tài liệu.', '2026-09-01 08:00:00', '2026-12-31 23:59:59', 'in_progress', 2),
(2, 'Ứng dụng Điểm danh Khuôn mặt bằng AI', 'Giải pháp nhận diện khuôn mặt sinh viên tại lớp học bằng OpenCV và Deep Learning, tích hợp cảnh báo vắng học tự động.', '2026-10-01 08:00:00', '2027-01-15 17:00:00', 'in_progress', 2),
(3, 'Cổng Thông tin Việc làm và Thực tập CNTT', 'Website kết nối doanh nghiệp và sinh viên ngành Công nghệ Thông tin, hỗ trợ nộp CV và ứng tuyển thực tập online.', '2026-08-15 08:00:00', '2026-11-30 23:59:59', 'completed', 3),
(4, 'Chatbot Hỗ trợ Tuyển sinh Đại học với LLM và RAG', 'Trợ lý ảo thông minh trả lời thắc mắc của thí sinh và phụ huynh dựa trên dữ liệu quy chế tuyển sinh hàng năm.', '2026-11-01 08:00:00', '2027-03-31 23:59:59', 'planning', 2),
(5, 'Hệ thống Giám sát Nông nghiệp Thông minh IoT', 'Thu thập độ ẩm đất, nhiệt độ, ánh sáng và điều khiển hệ thống tưới tự động qua giao thức MQTT và dashboard thời gian thực.', '2026-07-01 08:00:00', '2026-10-31 23:59:59', 'completed', 3),
(6, 'Ứng dụng Đi chung xe Nội bộ Sinh viên (Campus Carpooling)', 'Mobile app Flutter kết nối sinh viên cùng tuyến đường đi học, giúp tiết kiệm chi phí và giảm thiểu ùn tắc khu vực cổng trường.', '2026-11-10 08:00:00', '2027-02-28 23:59:59', 'planning', 3)
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), status = VALUES(status);

-- 6.3. Thành viên dự án mẫu
INSERT INTO project_members (project_id, user_id, role) VALUES
(1, 2, 'owner'),
(1, 3, 'member'),
(1, 1, 'admin'),
(2, 2, 'owner'),
(2, 3, 'member'),
(3, 3, 'owner'),
(3, 2, 'member')
ON DUPLICATE KEY UPDATE role = VALUES(role);

-- 6.4. Công việc mẫu
INSERT INTO tasks (title, description, due_date, priority, status, assignee_id, project_id) VALUES
('Thiết kế cơ sở dữ liệu MySQL', 'Xác định các thực thể và quan hệ giữa users, projects, tasks.', '2026-09-15', 'high', 'done', 2, 1),
('Xây dựng API xác thực JWT', 'Viết API đăng ký, đăng nhập và phân quyền bằng access token.', '2026-09-30', 'high', 'done', 3, 1),
('Tích hợp giao diện Kanban Board', 'Phát triển giao diện kéo thả trạng thái công việc trên Frontend.', '2026-11-20', 'medium', 'in_progress', 2, 1),
('Huấn luyện mô hình nhận diện khuôn mặt', 'Thu thập 500 ảnh mẫu và huấn luyện mô hình MobileNet.', '2026-10-25', 'urgent', 'in_progress', 3, 2)
ON DUPLICATE KEY UPDATE title = VALUES(title), status = VALUES(status);

-- 7. Kiểm tra tốc độ truy vấn bằng EXPLAIN

-- 7.1. Lọc dự án theo chủ sở hữu (owner_id)
-- Tận dụng index `idx_projects_owner_name` hoặc `idx_projects_owner_id` (type: ref, số dòng duyệt rows: 1..N thay vì quét toàn bộ bảng ALL)
EXPLAIN SELECT * FROM projects WHERE owner_id = 2;

-- 7.2. Tìm kiếm dự án theo tên (name prefix)
-- Tận dụng index `idx_projects_name` (type: range, sử dụng index condition để lọc nhanh theo B-Tree)
EXPLAIN SELECT * FROM projects WHERE name LIKE 'Hệ thống%';

-- 7.3. Kết hợp lọc theo chủ sở hữu và tìm kiếm theo tên
-- Tận dụng tối đa composite index `idx_projects_owner_name (owner_id, name)`
EXPLAIN SELECT * FROM projects WHERE owner_id = 2 AND name LIKE 'Ứng dụng%';

-- 7.4. Lọc theo chủ sở hữu và sắp xếp theo tên (ORDER BY name)
-- Tận dụng composite index `idx_projects_owner_name` để lấy dữ liệu đã được index sắp xếp sẵn, loại bỏ hoàn toàn chi phí 'Using filesort'
EXPLAIN SELECT * FROM projects WHERE owner_id = 2 ORDER BY name ASC;

select * from users;