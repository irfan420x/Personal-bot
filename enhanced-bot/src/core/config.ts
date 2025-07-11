import { BotConfig, ConfigurationError } from '@/types';

/**
 * Configuration management for Enhanced Messenger Bot
 * Loads and validates configuration from environment variables
 */
class Config implements BotConfig {
  public readonly platforms = {
    telegram: {
      enabled: this.getBoolean('TELEGRAM_ENABLED', false),
      botToken: process.env.TELEGRAM_BOT_TOKEN,
      webhookUrl: process.env.TELEGRAM_WEBHOOK_URL,
      allowedUsers: this.getStringArray('TELEGRAM_ALLOWED_USERS'),
    },
    whatsapp: {
      enabled: this.getBoolean('WHATSAPP_ENABLED', false),
      apiToken: process.env.WHATSAPP_API_TOKEN,
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
      webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
    },
    discord: {
      enabled: this.getBoolean('DISCORD_ENABLED', false),
      botToken: process.env.DISCORD_BOT_TOKEN,
      clientId: process.env.DISCORD_CLIENT_ID,
      guildId: process.env.DISCORD_GUILD_ID,
    },
    facebook: {
      enabled: this.getBoolean('FACEBOOK_ENABLED', false),
      pageToken: process.env.FACEBOOK_PAGE_TOKEN,
      appSecret: process.env.FACEBOOK_APP_SECRET,
      verifyToken: process.env.FACEBOOK_VERIFY_TOKEN,
    },
  };

  public readonly ai = {
    openai: {
      enabled: this.getBoolean('OPENAI_ENABLED', true),
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      maxTokens: this.getNumber('OPENAI_MAX_TOKENS', 1000),
      temperature: this.getNumber('OPENAI_TEMPERATURE', 0.7),
    },
    claude: {
      enabled: this.getBoolean('CLAUDE_ENABLED', false),
      apiKey: process.env.CLAUDE_API_KEY,
      model: process.env.CLAUDE_MODEL || 'claude-3-sonnet-20240229',
      maxTokens: this.getNumber('CLAUDE_MAX_TOKENS', 1000),
    },
    ollama: {
      enabled: this.getBoolean('OLLAMA_ENABLED', false),
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      model: process.env.OLLAMA_MODEL || 'llama3',
    },
  };

  public readonly database = {
    type: (process.env.DATABASE_TYPE as 'mongodb' | 'postgresql' | 'sqlite') || 'mongodb',
    url: process.env.DATABASE_URL || 'mongodb://localhost:27017/enhanced-bot',
    options: this.getDatabaseOptions(),
  };

  public readonly redis = {
    enabled: this.getBoolean('REDIS_ENABLED', true),
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    options: this.getRedisOptions(),
  };

  public readonly server = {
    port: this.getNumber('PORT', 3000),
    host: process.env.HOST || '0.0.0.0',
    cors: {
      enabled: this.getBoolean('CORS_ENABLED', true),
      origins: this.getStringArray('CORS_ORIGINS', ['http://localhost:3000']),
    },
  };

  public readonly webDashboard = {
    enabled: this.getBoolean('WEB_DASHBOARD_ENABLED', true),
    username: process.env.DASHBOARD_USERNAME || 'admin',
    password: process.env.DASHBOARD_PASSWORD || 'admin123',
    sessionSecret: process.env.SESSION_SECRET || this.generateRandomSecret(),
  };

  public readonly security = {
    jwtSecret: process.env.JWT_SECRET || this.generateRandomSecret(),
    encryptionKey: process.env.ENCRYPTION_KEY || this.generateRandomSecret(),
    rateLimiting: {
      enabled: this.getBoolean('RATE_LIMITING_ENABLED', true),
      windowMs: this.getNumber('RATE_LIMIT_WINDOW', 60000), // 1 minute
      maxRequests: this.getNumber('RATE_LIMIT_MAX', 100),
    },
  };

  public readonly features = {
    imageGeneration: this.getBoolean('FEATURE_IMAGE_GENERATION', true),
    voiceRecognition: this.getBoolean('FEATURE_VOICE_RECOGNITION', true),
    textToSpeech: this.getBoolean('FEATURE_TEXT_TO_SPEECH', true),
    fileProcessing: this.getBoolean('FEATURE_FILE_PROCESSING', true),
    scheduling: this.getBoolean('FEATURE_SCHEDULING', true),
    analytics: this.getBoolean('FEATURE_ANALYTICS', true),
  };

  /**
   * Validate the configuration
   */
  public isValid(): boolean {
    try {
      this.validateConfiguration();
      return true;
    } catch (error) {
      console.error('Configuration validation failed:', error);
      return false;
    }
  }

  /**
   * Get environment variable as boolean
   */
  private getBoolean(key: string, defaultValue: boolean = false): boolean {
    const value = process.env[key];
    if (value === undefined) return defaultValue;
    return value.toLowerCase() === 'true' || value === '1';
  }

  /**
   * Get environment variable as number
   */
  private getNumber(key: string, defaultValue: number): number {
    const value = process.env[key];
    if (value === undefined) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * Get environment variable as string array
   */
  private getStringArray(key: string, defaultValue: string[] = []): string[] {
    const value = process.env[key];
    if (!value) return defaultValue;
    return value.split(',').map(item => item.trim()).filter(Boolean);
  }

  /**
   * Get database-specific options
   */
  private getDatabaseOptions(): Record<string, any> {
    const options: Record<string, any> = {};
    
    if (this.database.type === 'mongodb') {
      options.useNewUrlParser = true;
      options.useUnifiedTopology = true;
    } else if (this.database.type === 'postgresql') {
      options.ssl = this.getBoolean('DATABASE_SSL', false);
    }
    
    return options;
  }

  /**
   * Get Redis-specific options
   */
  private getRedisOptions(): Record<string, any> {
    return {
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: 3,
    };
  }

  /**
   * Generate a random secret for development
   */
  private generateRandomSecret(): string {
    if (process.env.NODE_ENV === 'production') {
      throw new ConfigurationError(
        'Secret keys must be explicitly set in production environment'
      );
    }
    
    // Generate a random string for development
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Validate the entire configuration
   */
  private validateConfiguration(): void {
    // Check if at least one platform is enabled
    const enabledPlatforms = Object.values(this.platforms).filter(p => p.enabled);
    if (enabledPlatforms.length === 0) {
      throw new ConfigurationError('At least one platform must be enabled');
    }

    // Validate enabled platforms have required tokens
    if (this.platforms.telegram.enabled && !this.platforms.telegram.botToken) {
      throw new ConfigurationError('Telegram bot token is required when Telegram is enabled');
    }

    if (this.platforms.whatsapp.enabled && !this.platforms.whatsapp.apiToken) {
      throw new ConfigurationError('WhatsApp API token is required when WhatsApp is enabled');
    }

    if (this.platforms.discord.enabled && !this.platforms.discord.botToken) {
      throw new ConfigurationError('Discord bot token is required when Discord is enabled');
    }

    if (this.platforms.facebook.enabled && !this.platforms.facebook.pageToken) {
      throw new ConfigurationError('Facebook page token is required when Facebook is enabled');
    }

    // Validate AI providers
    const enabledAI = Object.values(this.ai).filter(provider => provider.enabled);
    if (enabledAI.length === 0) {
      console.warn('Warning: No AI providers are enabled. Bot will work with limited functionality.');
    }

    if (this.ai.openai.enabled && !this.ai.openai.apiKey) {
      throw new ConfigurationError('OpenAI API key is required when OpenAI is enabled');
    }

    if (this.ai.claude.enabled && !this.ai.claude.apiKey) {
      throw new ConfigurationError('Claude API key is required when Claude is enabled');
    }

    // Validate database configuration
    if (!this.database.url) {
      throw new ConfigurationError('Database URL is required');
    }

    // Validate production security
    if (process.env.NODE_ENV === 'production') {
      if (this.webDashboard.enabled) {
        if (this.webDashboard.password === 'admin123') {
          throw new ConfigurationError('Default dashboard password must be changed in production');
        }
        if (!process.env.SESSION_SECRET) {
          throw new ConfigurationError('SESSION_SECRET must be set in production');
        }
      }

      if (!process.env.JWT_SECRET) {
        throw new ConfigurationError('JWT_SECRET must be set in production');
      }

      if (!process.env.ENCRYPTION_KEY) {
        throw new ConfigurationError('ENCRYPTION_KEY must be set in production');
      }
    }
  }

  /**
   * Get list of enabled platforms
   */
  public getEnabledPlatforms(): string[] {
    return Object.entries(this.platforms)
      .filter(([, config]) => config.enabled)
      .map(([name]) => name);
  }

  /**
   * Get list of enabled AI providers
   */
  public getEnabledAIProviders(): string[] {
    return Object.entries(this.ai)
      .filter(([, config]) => config.enabled)
      .map(([name]) => name);
  }

  /**
   * Check if development mode
   */
  public isDevelopment(): boolean {
    return process.env.NODE_ENV !== 'production';
  }

  /**
   * Check if production mode
   */
  public isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }
}

// Export singleton instance
export const config = new Config();