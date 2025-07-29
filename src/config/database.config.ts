import { ConfigService } from '@nestjs/config';
import { DataSourceOptions } from 'typeorm';
import * as path from 'path';

export const getDatabaseConfig = (configService?: ConfigService): DataSourceOptions => {
  // For CLI usage (when configService is not available)
  const getEnvValue = (key: string, defaultValue?: any) => {
    if (configService) {
      return configService.get(key, defaultValue);
    }
    return process.env[key] || defaultValue;
  };

  // Get the root directory (where this config file is located)
  const rootDir = path.join(__dirname, '..');
  const appEnv = getEnvValue('NODE_ENV');
  const logging = (appEnv === 'development' || appEnv === 'local') ? true : false;

  return {
    type: 'mysql',
    host: getEnvValue('DB_HOST', 'localhost'),
    port: parseInt(getEnvValue('DB_PORT', '3306')),
    username: getEnvValue('DB_USERNAME', ''),
    password: getEnvValue('DB_PASSWORD', ''),
    database: getEnvValue('DB_DATABASE', 'autofillform'),
    entities: [
      path.join(rootDir, 'entities', '*.entity{.ts,.js}')
    ],
    migrations: [
      path.join(rootDir, 'migrations', '*{.ts,.js}')
    ],
    synchronize: false,
    migrationsRun: false,
    logging: logging,
  };
}; 