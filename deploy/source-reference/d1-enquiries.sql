-- SOURCE REFERENCE ONLY: SQLite/D1, not executable MySQL.
CREATE TABLE `enquiries` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text NOT NULL,
	`suburb` text NOT NULL,
	`service` text NOT NULL,
	`property` text,
	`size` text,
	`preferred_date` text,
	`preferred_time` text,
	`details` text
);
