import 'dotenv/config';

import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';

import { Pool } from 'pg';
import { dbSchema } from './schema/schema.js';


export const seedPool = new Pool({
  //host: config.getOrThrow('POSTGRES_HOST'),
  host: process.env.POSTGRES_HOST ?? "",

  //port: parseInt(config.getOrThrow('POSTGRES_PORT'), 10),
  port: parseInt(process.env.POSTGRES_PORT ?? "0"),

  //database: config.getOrThrow('POSTGRES_DB'),
  database: process.env.POSTGRES_DB ?? "",

  //user: config.getOrThrow('POSTGRES_USER'),
  user: process.env.POSTGRES_USER ?? "",

  //password: config.getOrThrow('POSTGRES_PASSWORD'),
  password: process.env.POSTGRES_PASSWORD ?? "",

  ssl: false
});


export const db:NodePgDatabase<typeof dbSchema.dbRelations> = drizzle({
  client: seedPool,
});