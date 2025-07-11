import TelegramBot from 'node-telegram-bot-api';
import { Telegraf, Context } from 'telegraf';
import { Platform, Message, MessageType, User, UserRole, TelegramConfig, PlatformError } from '@/types';
import { logger } from '@utils/logger';
import { EventEmitter } from 'events';

/**
 * Telegram Platform Adapter
 * Handles all Telegram-specific functionality and message processing
 */
export class TelegramPlatform extends EventEmitter {
  private bot: Telegraf | null = null;
  private config: TelegramConfig;
  private isRunning = false;

  constructor(config: TelegramConfig) {
    super();
    this.config = config;
  }

  /**
   * Initialize the Telegram bot
   */
  async initialize(): Promise<void> {
    if (!this.config.enabled || !this.config.botToken) {
      throw new PlatformError('Telegram bot token is required', Platform.TELEGRAM);
    }

    try {
      this.bot = new Telegraf(this.config.botToken);
      this.setupEventHandlers();
      logger.platform('telegram', 'Platform initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Telegram platform', error);
      throw new PlatformError('Failed to initialize Telegram platform', Platform.TELEGRAM);
    }
  }

  /**
   * Start the Telegram bot
   */
  async start(): Promise<void> {
    if (!this.bot) {
      throw new PlatformError('Bot not initialized', Platform.TELEGRAM);
    }

    try {
      if (this.config.webhookUrl) {
        // Use webhook for production
        await this.bot.launch({
          webhook: {
            domain: this.config.webhookUrl,
            port: process.env.WEBHOOK_PORT ? parseInt(process.env.WEBHOOK_PORT) : 3000,
          },
        });
        logger.platform('telegram', `Bot started with webhook: ${this.config.webhookUrl}`);
      } else {
        // Use long polling for development
        await this.bot.launch();
        logger.platform('telegram', 'Bot started with long polling');
      }

      this.isRunning = true;
      
      // Set bot commands
      await this.setBotCommands();
      
      logger.platform('telegram', 'Bot is running and ready to receive messages');
    } catch (error) {
      logger.error('Failed to start Telegram bot', error);
      throw new PlatformError('Failed to start Telegram bot', Platform.TELEGRAM);
    }
  }

  /**
   * Stop the Telegram bot
   */
  async stop(): Promise<void> {
    if (this.bot && this.isRunning) {
      try {
        this.bot.stop();
        this.isRunning = false;
        logger.platform('telegram', 'Bot stopped successfully');
      } catch (error) {
        logger.error('Error stopping Telegram bot', error);
      }
    }
  }

  /**
   * Setup event handlers for the Telegram bot
   */
  private setupEventHandlers(): void {
    if (!this.bot) return;

    // Handle text messages
    this.bot.on('text', (ctx) => this.handleMessage(ctx));
    
    // Handle photos
    this.bot.on('photo', (ctx) => this.handleMessage(ctx));
    
    // Handle voice messages
    this.bot.on('voice', (ctx) => this.handleMessage(ctx));
    
    // Handle documents
    this.bot.on('document', (ctx) => this.handleMessage(ctx));
    
    // Handle stickers
    this.bot.on('sticker', (ctx) => this.handleMessage(ctx));
    
    // Handle locations
    this.bot.on('location', (ctx) => this.handleMessage(ctx));
    
    // Handle contacts
    this.bot.on('contact', (ctx) => this.handleMessage(ctx));

    // Handle new chat members
    this.bot.on('new_chat_members', (ctx) => this.handleUserJoin(ctx));
    
    // Handle left chat members
    this.bot.on('left_chat_member', (ctx) => this.handleUserLeave(ctx));

    // Handle errors
    this.bot.catch((err, ctx) => {
      logger.error('Telegram bot error', err, { 
        userId: ctx.from?.id,
        chatId: ctx.chat?.id,
        updateType: ctx.updateType 
      });
      this.emit('error', { error: err, context: ctx });
    });
  }

  /**
   * Handle incoming messages
   */
  private async handleMessage(ctx: Context): Promise<void> {
    try {
      const message = await this.parseMessage(ctx);
      const user = await this.parseUser(ctx);

      // Check if user is allowed (if restrictions are configured)
      if (this.config.allowedUsers && this.config.allowedUsers.length > 0) {
        if (!this.config.allowedUsers.includes(user.platformId) && 
            !this.config.allowedUsers.includes(user.username || '')) {
          logger.security('Unauthorized access attempt', { 
            userId: user.platformId, 
            username: user.username 
          });
          await ctx.reply('❌ You are not authorized to use this bot.');
          return;
        }
      }

      // Emit message event for processing
      this.emit('message', { message, user, platform: Platform.TELEGRAM });

    } catch (error) {
      logger.error('Error handling Telegram message', error, { 
        userId: ctx.from?.id,
        chatId: ctx.chat?.id 
      });
    }
  }

  /**
   * Handle user join events
   */
  private async handleUserJoin(ctx: Context): Promise<void> {
    if (!ctx.message || !('new_chat_members' in ctx.message)) return;

    for (const member of ctx.message.new_chat_members) {
      const user = await this.parseUserFromMember(member);
      this.emit('user_join', { user });
      logger.platform('telegram', `User joined: ${user.username || user.platformId}`);
    }
  }

  /**
   * Handle user leave events
   */
  private async handleUserLeave(ctx: Context): Promise<void> {
    if (!ctx.message || !('left_chat_member' in ctx.message)) return;

    const user = await this.parseUserFromMember(ctx.message.left_chat_member);
    this.emit('user_leave', { user });
    logger.platform('telegram', `User left: ${user.username || user.platformId}`);
  }

  /**
   * Parse Telegram message to our standard format
   */
  private async parseMessage(ctx: Context): Promise<Message> {
    const baseMessage = {
      id: `tg_${ctx.message?.message_id || Date.now()}`,
      userId: ctx.from?.id.toString() || '',
      platform: Platform.TELEGRAM,
      content: '',
      metadata: {
        chatId: ctx.chat?.id,
        chatType: ctx.chat?.type,
        messageId: ctx.message?.message_id,
      },
      attachments: [],
      isFromBot: false,
      createdAt: new Date(),
      processed: false,
    };

    // Handle different message types
    if (ctx.message && 'text' in ctx.message) {
      return {
        ...baseMessage,
        type: MessageType.TEXT,
        content: ctx.message.text,
      };
    }

    if (ctx.message && 'photo' in ctx.message) {
      const photo = ctx.message.photo[ctx.message.photo.length - 1]; // Get highest resolution
      const fileUrl = await this.getFileUrl(photo.file_id);
      
      return {
        ...baseMessage,
        type: MessageType.IMAGE,
        content: ctx.message.caption || '',
        attachments: [{
          id: photo.file_id,
          type: MessageType.IMAGE,
          url: fileUrl,
          size: photo.file_size,
        }],
      };
    }

    if (ctx.message && 'voice' in ctx.message) {
      const voice = ctx.message.voice;
      const fileUrl = await this.getFileUrl(voice.file_id);
      
      return {
        ...baseMessage,
        type: MessageType.AUDIO,
        content: '',
        attachments: [{
          id: voice.file_id,
          type: MessageType.AUDIO,
          url: fileUrl,
          mimeType: voice.mime_type,
          size: voice.file_size,
        }],
      };
    }

    if (ctx.message && 'document' in ctx.message) {
      const doc = ctx.message.document;
      const fileUrl = await this.getFileUrl(doc.file_id);
      
      return {
        ...baseMessage,
        type: MessageType.DOCUMENT,
        content: ctx.message.caption || '',
        attachments: [{
          id: doc.file_id,
          type: MessageType.DOCUMENT,
          url: fileUrl,
          filename: doc.file_name,
          mimeType: doc.mime_type,
          size: doc.file_size,
        }],
      };
    }

    if (ctx.message && 'sticker' in ctx.message) {
      const sticker = ctx.message.sticker;
      const fileUrl = await this.getFileUrl(sticker.file_id);
      
      return {
        ...baseMessage,
        type: MessageType.STICKER,
        content: sticker.emoji || '',
        attachments: [{
          id: sticker.file_id,
          type: MessageType.STICKER,
          url: fileUrl,
        }],
      };
    }

    if (ctx.message && 'location' in ctx.message) {
      const location = ctx.message.location;
      
      return {
        ...baseMessage,
        type: MessageType.LOCATION,
        content: `Location: ${location.latitude}, ${location.longitude}`,
        metadata: {
          ...baseMessage.metadata,
          latitude: location.latitude,
          longitude: location.longitude,
        },
      };
    }

    if (ctx.message && 'contact' in ctx.message) {
      const contact = ctx.message.contact;
      
      return {
        ...baseMessage,
        type: MessageType.CONTACT,
        content: `Contact: ${contact.first_name} ${contact.last_name || ''}`,
        metadata: {
          ...baseMessage.metadata,
          phoneNumber: contact.phone_number,
          firstName: contact.first_name,
          lastName: contact.last_name,
          userId: contact.user_id,
        },
      };
    }

    // Default case
    return {
      ...baseMessage,
      type: MessageType.TEXT,
      content: 'Unsupported message type',
    };
  }

  /**
   * Parse Telegram user to our standard format
   */
  private async parseUser(ctx: Context): Promise<User> {
    const telegramUser = ctx.from;
    if (!telegramUser) {
      throw new Error('No user information available');
    }

    return {
      id: `tg_${telegramUser.id}`,
      platformId: telegramUser.id.toString(),
      platform: Platform.TELEGRAM,
      username: telegramUser.username,
      firstName: telegramUser.first_name,
      lastName: telegramUser.last_name,
      role: UserRole.USER,
      isBlocked: false,
      preferences: {
        language: telegramUser.language_code || 'en',
        timezone: 'UTC',
        notifications: true,
        aiEnabled: true,
        voiceEnabled: true,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSeen: new Date(),
    };
  }

  /**
   * Parse user from Telegram member object
   */
  private async parseUserFromMember(member: any): Promise<User> {
    return {
      id: `tg_${member.id}`,
      platformId: member.id.toString(),
      platform: Platform.TELEGRAM,
      username: member.username,
      firstName: member.first_name,
      lastName: member.last_name,
      role: UserRole.USER,
      isBlocked: false,
      preferences: {
        language: member.language_code || 'en',
        timezone: 'UTC',
        notifications: true,
        aiEnabled: true,
        voiceEnabled: true,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSeen: new Date(),
    };
  }

  /**
   * Get file URL from Telegram file ID
   */
  private async getFileUrl(fileId: string): Promise<string> {
    try {
      if (!this.bot) throw new Error('Bot not initialized');
      
      const fileInfo = await this.bot.telegram.getFile(fileId);
      return `https://api.telegram.org/file/bot${this.config.botToken}/${fileInfo.file_path}`;
    } catch (error) {
      logger.error('Failed to get file URL', error, { fileId });
      return '';
    }
  }

  /**
   * Set bot commands in Telegram
   */
  private async setBotCommands(): Promise<void> {
    if (!this.bot) return;

    try {
      await this.bot.telegram.setMyCommands([
        { command: 'start', description: 'Start the bot' },
        { command: 'help', description: 'Show help message' },
        { command: 'ai', description: 'Chat with AI' },
        { command: 'image', description: 'Generate an image' },
        { command: 'weather', description: 'Get weather information' },
        { command: 'translate', description: 'Translate text' },
        { command: 'remind', description: 'Set a reminder' },
        { command: 'settings', description: 'Bot settings' },
      ]);
      
      logger.platform('telegram', 'Bot commands set successfully');
    } catch (error) {
      logger.error('Failed to set bot commands', error);
    }
  }

  /**
   * Send a message to Telegram
   */
  async sendMessage(chatId: string, content: string, options?: any): Promise<void> {
    if (!this.bot) {
      throw new PlatformError('Bot not initialized', Platform.TELEGRAM);
    }

    try {
      await this.bot.telegram.sendMessage(chatId, content, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        ...options,
      });
    } catch (error) {
      logger.error('Failed to send Telegram message', error, { chatId, content });
      throw error;
    }
  }

  /**
   * Send a photo to Telegram
   */
  async sendPhoto(chatId: string, photo: string, caption?: string): Promise<void> {
    if (!this.bot) {
      throw new PlatformError('Bot not initialized', Platform.TELEGRAM);
    }

    try {
      await this.bot.telegram.sendPhoto(chatId, photo, {
        caption,
        parse_mode: 'Markdown',
      });
    } catch (error) {
      logger.error('Failed to send Telegram photo', error, { chatId, photo });
      throw error;
    }
  }

  /**
   * Send typing action
   */
  async sendTyping(chatId: string): Promise<void> {
    if (!this.bot) return;

    try {
      await this.bot.telegram.sendChatAction(chatId, 'typing');
    } catch (error) {
      logger.error('Failed to send typing action', error, { chatId });
    }
  }

  /**
   * Check if bot is running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Get platform name
   */
  getPlatformName(): string {
    return Platform.TELEGRAM;
  }
}