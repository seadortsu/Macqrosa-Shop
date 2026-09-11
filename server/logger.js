import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const logDir = path.join(__dirname, '..', 'logs');

const transports = [];

if (isServerless) {
  // In Vercel / serverless runtime, pipe logs to standard console output
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          const metaStr = Object.keys(meta).length > 1 ? ` ${JSON.stringify(meta)}` : '';
          return `${timestamp} [${level.toUpperCase()}]: ${message}${metaStr}`;
        })
      )
    })
  );
} else {
  // In standalone / local environment, ensure logs directory exists and write log files
  try {
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    transports.push(
      new winston.transports.File({ filename: path.join(logDir, 'error.log'), level: 'error', maxsize: 5242880, maxFiles: 5 }),
      new winston.transports.File({ filename: path.join(logDir, 'combined.log'), maxsize: 5242880, maxFiles: 5 })
    );
  } catch (err) {
    console.warn('Unable to initialize local file logger, falling back to console:', err.message);
  }

  // Always log to console in non-serverless dev
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          const metaStr = Object.keys(meta).length > 1 ? ` ${JSON.stringify(meta)}` : '';
          return `${timestamp} [${level}]: ${message}${metaStr}`;
        })
      )
    })
  );
}

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'macqrosa-api' },
  transports: transports
});

export default logger;
