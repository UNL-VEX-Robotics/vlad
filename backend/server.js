import "dotenv/config";
import app from "./app.js";
import { sequelize } from "./db.js";
import logger from "./utils/logger.js";

const PORT = process.env.PORT || 3000;
let server;

async function startServer() {
    try {
        await sequelize.authenticate();
        logger.info("Database connected successfully");

        server = app.listen(PORT, () => {
            logger.info(`Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        logger.error(`Unable to connect to database:${error}`);
    }
}

const shutdown = async () => {
    logger.info("Starting shutdown process");

    // Force Quit timer for delevopment
    const forceQuit = setTimeout(() => {
        logger.error("Forced shutdown: Connections did not close in time.");
        process.exit(1);
    }, 5000);

    forceQuit.unref();

    try {
        if (sequelize) {
            await sequelize.close();
            logger.info("Database connection closed");
        }

        if (server) {
            server.closeIdleConnections();
            server.close(() => {
                logger.info("HTTP server closed");
                clearTimeout(forceQuit);
                process.exit(0);
            });
        }
    } catch (err) {
        logger.error(`Error shutting down: ${err}`);
        process.exit(1);
    }
};

startServer();
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
