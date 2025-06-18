import { Sequelize } from "sequelize"
import db from "../config/Database.js"
import Users from "./UserModel.js"

const { DataTypes } = Sequelize

const Users_Locations = db.define(
  "users_locations",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
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
    location_name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [0, 50]
      }
    },
    state: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [0, 50]
      }
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [0, 50]
      }
    },
    postal_code: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [0, 20]
      }
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
      validate: {
        min: -90,
        max: 90
      }
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
      validate: {
        min: -180,
        max: 180
      }
    },
    location_type: {
      type: DataTypes.ENUM('home', 'work', 'office', 'branch', 'warehouse', 'other'),
      defaultValue: 'other',
      allowNull: false
    },
    is_primary: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [0, 20]
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
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
        fields: ['location_type']
      },
      {
        fields: ['is_primary']
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['city']
      },
      {
        fields: ['country']
      }
    ]
  }
)

// Define associations
Users_Locations.belongsTo(Users, { 
  foreignKey: 'user_id',
  as: 'user'
})

Users.hasMany(Users_Locations, { 
  foreignKey: 'user_id',
  as: 'locations'
})

;(async () => {
  await db.sync()
})()

export default Users_Locations 