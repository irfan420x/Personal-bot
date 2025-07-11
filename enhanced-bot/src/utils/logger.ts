import winston from 'winston';
import path from 'path';

/**
 * Enhanced logging utility with structured logging support
 */
class Logger {
  private static instance: winston.Logger;

  public static getInstance(): winston.Logger {
    if (!Logger.instance) {
      Logger.instance = Logger.createLogger();
    }
    return Logger.instance;
  }

  private static createLogger(): winston.Logger {
    // Custom format for console output
    const consoleFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        let log = `${timestamp} [${level}]: ${message}`;
        
        // Add stack trace for errors
        if (stack) {
          log += `\n${stack}`;
        }
        
        // Add metadata if present
        const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta, null, 2) : '';
        if (metaStr) {
          log += `\n${metaStr}`;
        }
        
        return log;
      })
    );

    // JSON format for file output
    const fileFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    );

    const transports: winston.transport[] = [
      // Console output
      new winston.transports.Console({
        level: process.env.LOG_LEVEL || 'info',
        format: consoleFormat,
      }),
    ];

    // Add file transports in production
    if (process.env.NODE_ENV === 'production') {
      const logDir = process.env.LOG_DIR || './logs';
      
      transports.push(
        // Error log file
        new winston.transports.File({
          filename: path.join(logDir, 'error.log'),
          level: 'error',
          format: fileFormat,
          maxsize: 10 * 1024 * 1024, // 10MB
          maxFiles: 5,
        }),
        
        // Combined log file
        new winston.transports.File({
          filename: path.join(logDir, 'combined.log'),
          format: fileFormat,
          maxsize: 10 * 1024 * 1024, // 10MB
          maxFiles: 10,
        })
      );
    }

    return winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.errors({ stack: true }),
      transports,
      exceptionHandlers: [
        new winston.transports.Console({
          format: consoleFormat,
        }),
      ],
      rejectionHandlers: [
        new winston.transports.Console({
          format: consoleFormat,
        }),
      ],
    });
  }
}

// Create logger instance
export const logger = Logger.getInstance();

// Convenience methods for different log levels with metadata support
export const log = {
  error: (message: string, error?: Error | any, meta?: any) => {
    if (error instanceof Error) {
      logger.error(message, { error: error.message, stack: error.stack, ...meta });
    } else if (error) {
      logger.error(message, { error, ...meta });
    } else {
      logger.error(message, meta);
    }
  },

  warn: (message: string, meta?: any) => {
    logger.warn(message, meta);
  },

  info: (message: string, meta?: any) => {
    logger.info(message, meta);
  },

  debug: (message: string, meta?: any) => {
    logger.debug(message, meta);
  },

  verbose: (message: string, meta?: any) => {
    logger.verbose(message, meta);
  },

  // Specialized logging methods
  platform: (platform: string, message: string, meta?: any) => {
    logger.info(`[${platform.toUpperCase()}] ${message}`, meta);
  },

  command: (command: string, user: string, platform: string, meta?: any) => {
    logger.info(`Command executed: /${command}`, {
      command,
      user,
      platform,
      ...meta,
    });
  },

  ai: (provider: string, prompt: string, response: string, meta?: any) => {
    logger.debug(`[AI:${provider}] Generated response`, {
      provider,
      promptLength: prompt.length,
      responseLength: response.length,
      ...meta,
    });
  },

  performance: (operation: string, duration: number, meta?: any) => {
    logger.debug(`Performance: ${operation} took ${duration}ms`, {
      operation,
      duration,
      ...meta,
    });
  },

  security: (event: string, details: any) => {
    logger.warn(`[SECURITY] ${event}`, details);
  },

  analytics: (event: string, data: any) => {
    logger.info(`[ANALYTICS] ${event}`, data);
  },
};

// Export default logger
export default logger;