import pino from "pino";

const log_level = process.env.LOG_LEVEL || "info";

const logger = pino({
    level: log_level,
    redact: {
        paths: ["password", "email_verification_token", "reset_token", "req.headers.authorization"],
        placeholder: "****",
    },
    transport:
        process.env.NODE_ENV !== "production"
            ? {
                  target: "pino-pretty",
                  options: {
                      colorize: true,
                      translateTime: "SYS:standard",
                      ignore: "pid,hostname",
                  },
              }
            : undefined,
});

export default logger;
