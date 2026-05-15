-- Seed default categories for NoteKori
-- Expense categories
INSERT OR IGNORE INTO categories (id, user_id, name, icon, color, type, is_default, created_at) VALUES
('sys_food', 'system', 'Food & Dining', 'utensils', '#ef4444', 'expense', 1, datetime('now')),
('sys_transport', 'system', 'Transport', 'car', '#3b82f6', 'expense', 1, datetime('now')),
('sys_shopping', 'system', 'Shopping', 'shopping-bag', '#f59e0b', 'expense', 1, datetime('now')),
('sys_bills', 'system', 'Bills', 'receipt', '#8b5cf6', 'expense', 1, datetime('now')),
('sys_health', 'system', 'Health', 'heart-pulse', '#ec4899', 'expense', 1, datetime('now')),
('sys_rent', 'system', 'Rent', 'home', '#06b6d4', 'expense', 1, datetime('now')),
('sys_entertain', 'system', 'Entertainment', 'clapperboard', '#f97316', 'expense', 1, datetime('now')),
('sys_education', 'system', 'Education', 'graduation-cap', '#10b981', 'expense', 1, datetime('now'));

-- Income categories
INSERT OR IGNORE INTO categories (id, user_id, name, icon, color, type, is_default, created_at) VALUES
('sys_salary', 'system', 'Salary', 'briefcase', '#22c55e', 'income', 1, datetime('now')),
('sys_freelance', 'system', 'Freelance', 'laptop', '#6366f1', 'income', 1, datetime('now')),
('sys_business', 'system', 'Business', 'store', '#eab308', 'income', 1, datetime('now')),
('sys_invest', 'system', 'Investment', 'trending-up', '#14b8a6', 'income', 1, datetime('now')),
('sys_gift', 'system', 'Gift', 'gift', '#f43f5e', 'income', 1, datetime('now'));