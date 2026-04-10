import "dotenv/config";
import app from "./app.js";
import { sequelize } from "./db.js";
import logger from "./utils/logger.js";

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await sequelize.authenticate();
        logger.info("Database connected successfully");

        app.listen(3000, () => {
            logger.info(`Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        logger.error(`Unable to connect to database:${error}`);
    }
}

startServer();
