import { Sequelize } from "sequelize"
import dotenv from "dotenv"

dotenv.config()


const dbConfig = {
  database: process.env.DB_NAME || "nabl",
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  dialect: "mysql",
  

  pool: {
    max: 10, 
    min: 0,  
    acquire: 30000,
    idle: 10000 
  },
  

  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  

  timezone: '+00:00',
  

  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  },
  
  query: {
    raw: true
  },
  
  dialectOptions: {
    charset: 'utf8mb4',
    supportBigNumbers: true,
    bigNumberStrings: true,
    dateStrings: true,
    typeCast: true,
    ...(process.env.NODE_ENV === 'production' && {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    })
  }
}


const db = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    pool: dbConfig.pool,
    logging: dbConfig.logging,
    timezone: dbConfig.timezone,
    define: dbConfig.define,
    query: dbConfig.query,
    dialectOptions: dbConfig.dialectOptions
  }
)


export const testConnection = async () => {
  try {
    await db.authenticate()
    console.log('✅ Database connection has been established successfully.')
    return true
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message)
    return false
  }
}


export const initializeDatabase = async (force = false) => {
  try {
    await db.sync({ force })
    console.log('✅ Database synchronized successfully.')
    return true
  } catch (error) {
    console.error('❌ Database synchronization failed:', error.message)
    return false
  }
}


export const closeConnection = async () => {
  try {
    await db.close()
    console.log('✅ Database connection closed successfully.')
    return true
  } catch (error) {
    console.error('❌ Error closing database connection:', error.message)
    return false
  }
}


export const getDatabase = () => db


export default db 