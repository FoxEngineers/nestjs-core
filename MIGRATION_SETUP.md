# Database Migration Setup

This document explains how to set up and run the database migrations for the project.

## Prerequisites

1. MySQL 8+ database server
2. Node.js and npm installed
3. Environment variables configured

## Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=nestjs_db

# Application Configuration
NODE_ENV=development
PORT=3000
```

## Running Migrations

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Database
Create a MySQL database named `nestjs_db` (or your configured database name):

```sql
CREATE DATABASE nestjs_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Run Migrations
Execute all migrations in order:

```bash
npm run migration:run
```

### 4. Verify Setup
Check that all tables were created successfully:

```sql
USE nestjs_db;
SHOW TABLES;
```

## Migration Commands

- **Run migrations**: `npm run migration:run`
- **Revert last migration**: `npm run migration:revert`
- **Generate new migration**: `npm run migration:generate src/migrations/MigrationName`
- **Create empty migration**: `npm run migration:create src/migrations/MigrationName`

## Entity Features

All entities include:
- UUID primary keys
- Soft delete support (`deleted_at` column)
- Automatic timestamps (`created_at`, `updated_at`)
- Proper foreign key relationships
- Database indexes for performance

## Development Notes

- Synchronization is disabled (`synchronize: false`) to use migrations
- All foreign keys use CASCADE or SET NULL for referential integrity
- Enum values are defined both in entities and migrations
- Indexes are created for frequently queried columns

## Troubleshooting

### Common Issues

1. **Connection refused**: Check MySQL server is running and credentials are correct
2. **Database doesn't exist**: Create the database manually first
3. **Migration already exists**: Check if migrations have already been run
4. **Foreign key constraint fails**: Ensure migrations run in the correct order

### Reset Database
To start fresh:

```bash
npm run migration:revert  # Repeat until all migrations are reverted
npm run migration:run     # Run all migrations again
``` 