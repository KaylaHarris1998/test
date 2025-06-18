import { Sequelize } from "sequelize"

const db = new Sequelize("nabl", "root", "", {
  host: "localhost",
  dialect: "mysql",
  logging: false,
  port: 3306,
  logging: console.log,
})

export default db