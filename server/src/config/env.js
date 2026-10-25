import 'dotenv/config';

const required = ['MONGO_URI', 'JWT_SECRET'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

export const env = {
  port: Number(process.env.PORT) || 4000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  isProd: process.env.NODE_ENV === 'production',
};
