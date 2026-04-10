import { Sequelize } from "sequelize";
import initModels from "../models/init-models.js";
import "dotenv/config";
import logger from "./utils/logger.js";

const sequelize = new Sequelize(process.env.DEV_DATABASE_URL, {
    dialect: "postgres",
    logging: (sql, timing) => logger.info(sql, timing),
});

const db = initModels(sequelize);
db.sequelize = sequelize;
db.Sequelize = Sequelize;

export { sequelize };
export default db;
