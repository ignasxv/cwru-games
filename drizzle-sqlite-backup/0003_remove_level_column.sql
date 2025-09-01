-- Remove level column from games table as levels are now dynamic based on creation order
ALTER TABLE `games` DROP COLUMN `level`;
