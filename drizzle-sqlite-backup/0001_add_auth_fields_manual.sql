-- Add password and phone_number columns to existing users table
ALTER TABLE users ADD COLUMN password text;
ALTER TABLE users ADD COLUMN phone_number text;

-- Create the game_stats table
CREATE TABLE `game_stats` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`games_played` integer DEFAULT 0,
	`games_won` integer DEFAULT 0,
	`current_streak` integer DEFAULT 0,
	`max_streak` integer DEFAULT 0,
	`guess_distribution` text DEFAULT '{}',
	`last_played_at` text DEFAULT 'CURRENT_TIMESTAMP',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);

-- Make email unique if it isn't already
CREATE UNIQUE INDEX IF NOT EXISTS `users_email_unique` ON `users` (`email`);
