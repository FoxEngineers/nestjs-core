import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { getDatabaseConfig } from './src/config/database.config';

config(); // Load .env file

export const AppDataSource = new DataSource(
  getDatabaseConfig() as any
); 