import db from './Database.js'
import { Sequelize } from 'sequelize'




export const tableExists = async (tableName) => {
  try {
    const [results] = await db.query(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = ?",
      {
        replacements: [db.config.database, tableName],
        type: Sequelize.QueryTypes.SELECT
      }
    )
    return results.count > 0
  } catch (error) {
    console.error('Error checking table existence:', error)
    return false
  }
}


export const getAllTables = async () => {
  try {
    const [results] = await db.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = ?",
      {
        replacements: [db.config.database],
        type: Sequelize.QueryTypes.SELECT
      }
    )
    return results.map(result => result.table_name)
  } catch (error) {
    console.error('Error getting tables:', error)
    return []
  }
}


export const getTableStructure = async (tableName) => {
  try {
    const [results] = await db.query(
      "DESCRIBE ??",
      {
        replacements: [tableName],
        type: Sequelize.QueryTypes.SELECT
      }
    )
    return results
  } catch (error) {
    console.error('Error getting table structure:', error)
    return []
  }
}


export const executeQuery = async (query, options = {}) => {
  try {
    const results = await db.query(query, {
      type: Sequelize.QueryTypes.SELECT,
      ...options
    })
    return results
  } catch (error) {
    console.error('Error executing query:', error)
    throw error
  }
}


export const backupTables = async (tableNames = []) => {
  try {
    const backup = {}
    
    for (const tableName of tableNames) {
      const exists = await tableExists(tableName)
      if (exists) {
        const data = await db.query(`SELECT * FROM ??`, {
          replacements: [tableName],
          type: Sequelize.QueryTypes.SELECT
        })
        backup[tableName] = data
      }
    }
    
    return backup
  } catch (error) {
    console.error('Error backing up tables:', error)
    throw error
  }
}


export const getDatabaseStats = async () => {
  try {
    const tables = await getAllTables()
    const stats = {
      totalTables: tables.length,
      tables: {}
    }
    
    for (const tableName of tables) {
      const [countResult] = await db.query(
        `SELECT COUNT(*) as count FROM ??`,
        {
          replacements: [tableName],
          type: Sequelize.QueryTypes.SELECT
        }
      )
      stats.tables[tableName] = {
        rowCount: countResult.count
      }
    }
    
    return stats
  } catch (error) {
    console.error('Error getting database stats:', error)
    return {}
  }
}


export const checkDatabaseHealth = async () => {
  try {
    const startTime = Date.now()
    await db.authenticate()
    const responseTime = Date.now() - startTime
    
    return {
      status: 'healthy',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    }
  }
}

export const optimizeTables = async (tableNames = []) => {
  try {
    const results = {}
    
    for (const tableName of tableNames) {
      const exists = await tableExists(tableName)
      if (exists) {
        await db.query(`OPTIMIZE TABLE ??`, {
          replacements: [tableName]
        })
        results[tableName] = 'optimized'
      } else {
        results[tableName] = 'not_found'
      }
    }
    
    return results
  } catch (error) {
    console.error('Error optimizing tables:', error)
    throw error
  }
}

/**
 * Get database size information
 * @returns {Promise<Object>} - Database size information
 */
export const getDatabaseSize = async () => {
  try {
    const [results] = await db.query(`
      SELECT 
        table_schema AS 'Database',
        ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
      FROM information_schema.tables 
      WHERE table_schema = ?
      GROUP BY table_schema
    `, {
      replacements: [db.config.database],
      type: Sequelize.QueryTypes.SELECT
    })
    
    return results[0] || { Database: db.config.database, 'Size (MB)': 0 }
  } catch (error) {
    console.error('Error getting database size:', error)
    return { Database: db.config.database, 'Size (MB)': 'unknown' }
  }
}

/**
 * Clean up old records (example: delete records older than X days)
 * @param {string} tableName - Table name
 * @param {string} dateColumn - Date column name
 * @param {number} daysOld - Number of days old to delete
 * @returns {Promise<number>} - Number of deleted records
 */
export const cleanupOldRecords = async (tableName, dateColumn, daysOld) => {
  try {
    const [result] = await db.query(
      `DELETE FROM ?? WHERE ?? < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      {
        replacements: [tableName, dateColumn, daysOld],
        type: Sequelize.QueryTypes.DELETE
      }
    )
    
    return result.affectedRows || 0
  } catch (error) {
    console.error('Error cleaning up old records:', error)
    throw error
  }
}

export default {
  tableExists,
  getAllTables,
  getTableStructure,
  executeQuery,
  backupTables,
  getDatabaseStats,
  checkDatabaseHealth,
  optimizeTables,
  getDatabaseSize,
  cleanupOldRecords
} 