import dotenv from 'dotenv';

// Load the variables of .env file
dotenv.config();

export const GLOBAL_CONFIG = {
  PORT: process.env.PORT || 5000,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_secret_key',
};
