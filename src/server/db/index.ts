import 'dotenv/config';
import { createServerOnlyFn } from '@tanstack/react-start';
import { drizzle } from 'drizzle-orm/libsql';

if (!process.env.DATABASE_URL!) throw new Error('DATABASE_URL is not set');

const getDatabase = createServerOnlyFn(() => drizzle(process.env.DATABASE_URL!))

export const db = getDatabase()