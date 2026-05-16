import dotenv from 'dotenv';

// Load the variables of .env file
dotenv.config();

export const GLOBAL_CONFIG = {
  PORT: process.env.PORT || 5000,
  SERVER_IP: process.env.SERVER_IP || '172.20.10.2',
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_secret_key',
};
