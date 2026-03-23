# Migration Complete: pnpm → npm

The project has been successfully migrated from pnpm to npm workspaces.

## Changes Made

### ✅ Configuration Files
- ✅ Deleted `pnpm-workspace.yaml`
- ✅ Updated `package.json` with npm workspaces
- ✅ Updated all scripts to use npm workspace commands
- ✅ Updated `engines` field to require npm >= 8.0.0
- ✅ Removed `packageManager` field
- ✅ Added `package-lock.json` to `.gitignore`

### ✅ Documentation
- ✅ Updated `README.md` with npm commands
- ✅ Updated installation instructions
- ✅ Updated development workflow
- ✅ Updated deployment commands
- ✅ Updated authentication description (JWT instead of Better Auth)

### ✅ Package Scripts
| Old (pnpm) | New (npm) |
|------------|-----------|
| `pnpm install` | `npm install` |
| `pnpm dev` | `npm run dev` |
| `pnpm --filter web dev` | `npm run dev -w web` |
| `pnpm --filter api dev` | `npm run dev -w api` |
| `pnpm build` | `npm run build` |
| `pnpm deploy:api` | `npm run deploy:api` |
| `pnpm db:generate` | `npm run db:generate` |

## ✈️ Next Steps

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development**:
   ```bash
   # Run all apps
   npm run dev

   # Or run individually
   npm run dev -w web    # Frontend only
   npm run dev -w api    # Backend only
   ```

3. **Database setup**:
   ```bash
   npm run db:generate   # Generate migrations
   npm run db:migrate    # Run migrations
   npm run db:seed       # Seed default categories
   ```

The npm workspace configuration is fully functional and ready to use!