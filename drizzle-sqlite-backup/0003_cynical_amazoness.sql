PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`full_name` text,
	`email` text,
	`password` text,
	`phone_number` text,
	`created_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "username", "full_name", "email", "password", "phone_number", "created_at") SELECT "id", "username", "full_name", "email", "password", "phone_number", "created_at" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
ALTER TABLE `games` DROP COLUMN `level`;