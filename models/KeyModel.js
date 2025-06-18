import { Sequelize } from "sequelize"
import db from "../config/Database.js"
import Users from "./UserModel.js"

const { DataTypes } = Sequelize

const Keys = db.define(
  "keys",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255]
      }
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    key_type: {
      type: DataTypes.ENUM('agency', 'api', 'service', 'other'),
      defaultValue: 'agency',
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    last_used_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    usage_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    freezeTableName: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['key_type']
      },
      {
        fields: ['is_active']
      },
      {
        unique: true,
        fields: ['key', 'user_id']
      }
    ]
  }
)

Keys.belongsTo(Users, { 
  foreignKey: 'user_id',
  as: 'user'
})

Users.hasMany(Keys, { 
  foreignKey: 'user_id',
  as: 'keys'
})

// Sync the model with the database
;(async () => {
  await db.sync()
})()

export default Keys 