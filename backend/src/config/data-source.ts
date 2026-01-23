import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { join } from 'path';

// Auto-load all entities for migrations
const entities = [
  join(__dirname, '**', '*.entity.{ts,js}'),
];

const options: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER || 'accounting',
  password: process.env.DATABASE_PASSWORD || 'secret',
  database: process.env.DATABASE_NAME || 'accounting',
  entities,
  migrations: [join(__dirname, 'migrations', '*')],
  synchronize: false,
  namingStrategy: new SnakeNamingStrategy(),
  logging: process.env.NODE_ENV === 'development',
};

export const AppDataSource = new DataSource(options);
