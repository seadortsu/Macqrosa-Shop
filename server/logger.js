import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve log directory relative to the project root (one level up from server/)
const logDir = path.join(__dirname, '..', 'logs');

// Ensure the logs directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'macqrosa-api' },
  transports: [
    // Write errors to a dedicated file
    new winston.transports.File({ filename: path.join(logDir, 'error.log'), level: 'error', maxsize: 5242880, maxFiles: 5 }),
    // Write all logs to combined
    new winston.transports.File({ filename: path.join(logDir, 'combined.log'), maxsize: 5242880, maxFiles: 5 }),
  ],
});

// In development, also log to console with color
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ level, message, timestamp, ...meta }) => {
        const metaStr = Object.keys(meta).length > 1 ? ` ${JSON.stringify(meta)}` : '';
        return `${timestamp} [${level}]: ${message}${metaStr}`;
      })
    )
  }));
}

export default logger;
