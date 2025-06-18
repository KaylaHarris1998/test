import { Sequelize } from "sequelize"
import db from "../config/Database.js"
import Organizations from "./OrganizationModel.js"
const { DataTypes } = Sequelize
const Users = db.define(
  "users",
  {
    username: {
      type: DataTypes.STRING,
    },
    email: {
      type: DataTypes.STRING,
    },
    password: {
      type: DataTypes.STRING,
    },
    salt: {
      type: DataTypes.STRING,
    },
    firstname: {
      type: DataTypes.STRING,
    },
    lastname: {
      type: DataTypes.STRING,
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: "admin",
    },
    manager: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    organization_id: {
      type: DataTypes.INTEGER,
    },
    user_type: {
      type: DataTypes.STRING,
    },
    avatar: {
      type: DataTypes.STRING,
    },
    recoverykeysalt: {
      type: DataTypes.STRING,
    },
    refresh_token: {
      type: DataTypes.TEXT,
    },
    resetPasswordToken: {
      type: DataTypes.STRING,
    },
    resetPasswordExpires: {
      type: DataTypes.DATE,
    },
  },
  {
    freezeTableName: true,
  }
)

Users.belongsTo(Organizations, { foreignKey: "organization_id" })
;(async () => {
  await db.sync()
})()
export default Users;