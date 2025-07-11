import 'dotenv/config';
import { EnhancedBot } from '@core/bot';
import { logger } from '@utils/logger';
import { config } from '@core/config';
import { Database } from '@core/database';
import { WebServer } from '@core/server';

/**
 * Enhanced Multi-Platform Messenger Bot
 * Main entry point for the application
 */
async function bootstrap(): Promise<void> {
  try {
    logger.info('🚀 Starting Enhanced Messenger Bot...');
    
    // Validate configuration
    if (!config.isValid()) {
      throw new Error('Invalid configuration. Please check your environment variables.');
    }

    // Initialize database connection
    logger.info('📊 Connecting to database...');
    await Database.connect();
    logger.info('✅ Database connected successfully');

    // Initialize the bot core
    logger.info('🤖 Initializing bot core...');
    const bot = new EnhancedBot(config);
    await bot.initialize();
    logger.info('✅ Bot core initialized');

    // Start web server and dashboard
    if (config.webDashboard.enabled) {
      logger.info('🌐 Starting web server and dashboard...');
      const webServer = new WebServer(bot);
      await webServer.start();
      logger.info(`✅ Web server running on port ${config.server.port}`);
    }

    // Register process handlers
    registerProcessHandlers(bot);

    // Start all platform connections
    logger.info('🔌 Starting platform connections...');
    await bot.start();
    
    logger.info('🎉 Enhanced Bot started successfully!');
    logger.info(`📱 Active platforms: ${bot.getActivePlatforms().join(', ')}`);
    
    if (config.webDashboard.enabled) {
      logger.info(`🔗 Dashboard: http://localhost:${config.server.port}/dashboard`);
    }

  } catch (error) {
    logger.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
}

/**
 * Register process event handlers for graceful shutdown
 */
function registerProcessHandlers(bot: EnhancedBot): void {
  const gracefulShutdown = async (signal: string) => {
    logger.info(`📴 Received ${signal}. Starting graceful shutdown...`);
    
    try {
      await bot.stop();
      await Database.disconnect();
      logger.info('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  };

  // Handle various termination signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // Nodemon restart

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('🚨 Uncaught Exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });
}

// Start the application
bootstrap().catch((error) => {
  logger.error('💥 Bootstrap failed:', error);
  process.exit(1);
});