-- Run after backend/sql/init.sql has created the MySQL schema and tables.
USE team_project_manager;

-- Count tasks in each status across all projects.
CREATE OR REPLACE VIEW vw_task_count_by_status AS
SELECT status, COUNT(*) AS task_count
FROM tasks
GROUP BY status;

-- Count assigned tasks per user, including users with no assigned tasks.
CREATE OR REPLACE VIEW vw_task_count_by_member AS
SELECT
    u.id AS member_id,
    u.full_name AS member_name,
    COUNT(t.id) AS task_count
FROM users AS u
LEFT JOIN tasks AS t
    ON t.assignee_id = u.id
GROUP BY u.id, u.full_name;

-- Include tasks due today through the next 7 days; omit completed/cancelled tasks.
CREATE OR REPLACE VIEW vw_tasks_due_soon AS
SELECT
    t.id AS task_id,
    t.title,
    t.due_date,
    t.status,
    t.priority,
    p.id AS project_id,
    p.name AS project_name,
    t.assignee_id,
    COALESCE(u.full_name, 'Chưa phân công') AS assignee_name
FROM tasks AS t
JOIN projects AS p
    ON p.id = t.project_id
LEFT JOIN users AS u
    ON u.id = t.assignee_id
WHERE t.due_date BETWEEN CURRENT_DATE AND DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY)
  AND t.status NOT IN ('done', 'cancelled');

-- Sample verification: run backend/sql/init.sql once before this script.
-- With the sample data and database date 2026-11-17:
-- status counts: done=2, in_progress=2.
SELECT status, task_count
FROM vw_task_count_by_status
ORDER BY status;

-- member counts: id=1 -> 0, id=2 -> 2, id=3 -> 2, id=4 -> 0.
SELECT member_id, member_name, task_count
FROM vw_task_count_by_member
ORDER BY member_id;

-- The sample has one upcoming task: id=3, due 2026-11-20.
SELECT task_id, title, due_date, status, project_name, assignee_name
FROM vw_tasks_due_soon
ORDER BY due_date, task_id;
