CREATE TABLE IF NOT EXISTS `debts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`type` text NOT NULL,
	`total_amount` real NOT NULL,
	`paid_amount` real DEFAULT 0 NOT NULL,
	`due_date` text,
	`counterparty` text,
	`notes` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `debt_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`debt_id` text NOT NULL,
	`user_id` text NOT NULL,
	`amount` real NOT NULL,
	`date` text NOT NULL,
	`notes` text,
	FOREIGN KEY (`debt_id`) REFERENCES `debts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `vehicles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`fuel_type` text NOT NULL,
	`initial_km` real DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `vehicle_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`vehicle_id` text NOT NULL,
	`user_id` text NOT NULL,
	`log_type` text NOT NULL,
	`current_km` real NOT NULL,
	`fuel_liters` real,
	`fuel_amount` real,
	`other_amount` real,
	`notes` text,
	`date` text NOT NULL,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `debts_user_idx` ON `debts` (`user_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `debt_payments_debt_idx` ON `debt_payments` (`debt_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `vehicles_user_idx` ON `vehicles` (`user_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `vehicle_logs_vehicle_idx` ON `vehicle_logs` (`vehicle_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `vehicle_logs_date_idx` ON `vehicle_logs` (`date`);
