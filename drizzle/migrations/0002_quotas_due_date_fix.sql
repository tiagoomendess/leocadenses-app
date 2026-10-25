-- `due_date` was the first TIMESTAMP column of `quotas`, so the server gave it
-- ON UPDATE CURRENT_TIMESTAMP: editing a quota's name reset its due date to "now".
-- Keeps the column, its values and its default; only drops the automatic update.
ALTER TABLE `quotas` MODIFY COLUMN `due_date` timestamp NOT NULL DEFAULT (now());