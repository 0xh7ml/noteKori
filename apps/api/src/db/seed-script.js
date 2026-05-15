import { DEFAULT_CATEGORIES } from './seed.js';

// This script seeds the database with default categories
// It can be run via: wrangler d1 execute notekori-db --local --file=./src/db/seed-default-categories.sql

const insertQueries = DEFAULT_CATEGORIES.map(category =>
  `INSERT OR IGNORE INTO categories (id, user_id, name, icon, color, type, is_default, created_at) VALUES ('${category.id}', '${category.userId}', '${category.name}', '${category.icon}', '${category.color}', '${category.type}', ${category.isDefault ? 1 : 0}, datetime('now'));`
).join('\n');

console.log(insertQueries);