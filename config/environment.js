import dotenv from 'dotenv';

dotenv.config();

export const config = {

  database: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'nabl',
    port: process.env.DB_PORT || 3306,
  },


  jwt: {
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET || 'apple',
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'pear',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '30d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },


  email: {
    sendgridApiKey: process.env.SENDGRID_API_KEY,
    fromEmail: process.env.FROM_EMAIL || 'ryan@nabl.ai',
  },


  server: {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
  },


  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
  },


  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },


  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    cookieMaxAge: 30 * 24 * 60 * 60 * 1000,
  },
};


export const validateEnvironment = () => {
  const required = [
    'ACCESS_TOKEN_SECRET',
    'REFRESH_TOKEN_SECRET',
    'SENDGRID_API_KEY'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn('⚠️  Missing required environment variables:', missing);
    console.warn('Please check your .env file');
  }

  return missing.length === 0;
}; 