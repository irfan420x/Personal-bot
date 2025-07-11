/**
 * Core types and interfaces for Enhanced Messenger Bot
 */

export interface BotConfig {
  // Platform configurations
  platforms: {
    telegram: TelegramConfig;
    whatsapp: WhatsAppConfig;
    discord: DiscordConfig;
    facebook: FacebookConfig;
  };
  
  // AI provider configurations
  ai: {
    openai: OpenAIConfig;
    claude: ClaudeConfig;
    ollama: OllamaConfig;
  };
  
  // Database configuration
  database: DatabaseConfig;
  
  // Redis configuration
  redis: RedisConfig;
  
  // Server configuration
  server: ServerConfig;
  
  // Web dashboard configuration
  webDashboard: WebDashboardConfig;
  
  // Security configuration
  security: SecurityConfig;
  
  // Features configuration
  features: FeaturesConfig;
}

export interface TelegramConfig {
  enabled: boolean;
  botToken?: string;
  webhookUrl?: string;
  allowedUsers?: string[];
}

export interface WhatsAppConfig {
  enabled: boolean;
  apiToken?: string;
  phoneNumberId?: string;
  webhookVerifyToken?: string;
}

export interface DiscordConfig {
  enabled: boolean;
  botToken?: string;
  clientId?: string;
  guildId?: string;
}

export interface FacebookConfig {
  enabled: boolean;
  pageToken?: string;
  appSecret?: string;
  verifyToken?: string;
}

export interface OpenAIConfig {
  enabled: boolean;
  apiKey?: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface ClaudeConfig {
  enabled: boolean;
  apiKey?: string;
  model: string;
  maxTokens: number;
}

export interface OllamaConfig {
  enabled: boolean;
  baseUrl: string;
  model: string;
}

export interface DatabaseConfig {
  type: 'mongodb' | 'postgresql' | 'sqlite';
  url: string;
  options?: Record<string, any>;
}

export interface RedisConfig {
  enabled: boolean;
  url: string;
  options?: Record<string, any>;
}

export interface ServerConfig {
  port: number;
  host: string;
  cors: {
    enabled: boolean;
    origins: string[];
  };
}

export interface WebDashboardConfig {
  enabled: boolean;
  username: string;
  password: string;
  sessionSecret: string;
}

export interface SecurityConfig {
  jwtSecret: string;
  encryptionKey: string;
  rateLimiting: {
    enabled: boolean;
    windowMs: number;
    maxRequests: number;
  };
}

export interface FeaturesConfig {
  imageGeneration: boolean;
  voiceRecognition: boolean;
  textToSpeech: boolean;
  fileProcessing: boolean;
  scheduling: boolean;
  analytics: boolean;
}

// Message types
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  DOCUMENT = 'document',
  STICKER = 'sticker',
  LOCATION = 'location',
  CONTACT = 'contact'
}

export enum Platform {
  TELEGRAM = 'telegram',
  WHATSAPP = 'whatsapp',
  DISCORD = 'discord',
  FACEBOOK = 'facebook',
  WEB = 'web'
}

export interface User {
  id: string;
  platformId: string;
  platform: Platform;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role: UserRole;
  isBlocked: boolean;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
  lastSeen: Date;
}

export enum UserRole {
  USER = 'user',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

export interface UserPreferences {
  language: string;
  timezone: string;
  notifications: boolean;
  aiEnabled: boolean;
  voiceEnabled: boolean;
}

export interface Message {
  id: string;
  userId: string;
  platform: Platform;
  type: MessageType;
  content: string;
  metadata?: Record<string, any>;
  attachments?: Attachment[];
  replyTo?: string;
  isFromBot: boolean;
  createdAt: Date;
  processed: boolean;
}

export interface Attachment {
  id: string;
  type: MessageType;
  url: string;
  filename?: string;
  mimeType?: string;
  size?: number;
}

export interface BotCommand {
  name: string;
  description: string;
  aliases?: string[];
  category: string;
  adminOnly: boolean;
  platforms: Platform[];
  handler: CommandHandler;
}

export type CommandHandler = (context: MessageContext) => Promise<void>;

export interface MessageContext {
  message: Message;
  user: User;
  platform: Platform;
  bot: any; // Will be properly typed later
  reply: (content: string, options?: ReplyOptions) => Promise<void>;
  sendMessage: (content: string, options?: SendOptions) => Promise<void>;
  sendImage: (url: string, caption?: string) => Promise<void>;
  sendAudio: (url: string) => Promise<void>;
  react: (emoji: string) => Promise<void>;
  typing: (duration?: number) => Promise<void>;
}

export interface ReplyOptions {
  parseMode?: 'Markdown' | 'HTML';
  disablePreview?: boolean;
  replyMarkup?: any;
}

export interface SendOptions extends ReplyOptions {
  chatId?: string;
  userId?: string;
}

export interface Plugin {
  name: string;
  version: string;
  description?: string;
  author?: string;
  dependencies?: string[];
  commands?: BotCommand[];
  initialize?: () => Promise<void>;
  cleanup?: () => Promise<void>;
}

export interface AIProvider {
  name: string;
  generateResponse: (prompt: string, options?: AIOptions) => Promise<string>;
  generateImage?: (prompt: string, options?: ImageOptions) => Promise<string>;
  transcribeAudio?: (audioUrl: string) => Promise<string>;
  generateSpeech?: (text: string, options?: SpeechOptions) => Promise<Buffer>;
}

export interface AIOptions {
  maxTokens?: number;
  temperature?: number;
  model?: string;
  systemPrompt?: string;
  conversationHistory?: ConversationMessage[];
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ImageOptions {
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
  model?: string;
}

export interface SpeechOptions {
  voice?: string;
  speed?: number;
  format?: 'mp3' | 'opus' | 'aac' | 'flac';
}

export interface AnalyticsData {
  userId: string;
  platform: Platform;
  command?: string;
  messageType: MessageType;
  processingTime: number;
  aiUsed: boolean;
  error?: string;
  timestamp: Date;
}

export interface ScheduledTask {
  id: string;
  name: string;
  description?: string;
  cronExpression: string;
  userId?: string;
  platform?: Platform;
  action: string;
  data: Record<string, any>;
  enabled: boolean;
  createdAt: Date;
  lastRun?: Date;
  nextRun: Date;
}

// Error types
export class BotError extends Error {
  constructor(
    message: string,
    public code: string,
    public platform?: Platform,
    public userId?: string
  ) {
    super(message);
    this.name = 'BotError';
  }
}

export class ConfigurationError extends BotError {
  constructor(message: string) {
    super(message, 'CONFIGURATION_ERROR');
    this.name = 'ConfigurationError';
  }
}

export class PlatformError extends BotError {
  constructor(message: string, platform: Platform) {
    super(message, 'PLATFORM_ERROR', platform);
    this.name = 'PlatformError';
  }
}

export class AIError extends BotError {
  constructor(message: string, public provider: string) {
    super(message, 'AI_ERROR');
    this.name = 'AIError';
  }
}

// Event types
export interface BotEvent {
  type: string;
  platform: Platform;
  data: any;
  timestamp: Date;
}

export interface MessageEvent extends BotEvent {
  type: 'message';
  data: {
    message: Message;
    user: User;
  };
}

export interface UserJoinEvent extends BotEvent {
  type: 'user_join';
  data: {
    user: User;
  };
}

export interface UserLeaveEvent extends BotEvent {
  type: 'user_leave';
  data: {
    user: User;
  };
}

export interface ErrorEvent extends BotEvent {
  type: 'error';
  data: {
    error: Error;
    context?: any;
  };
}

// Platform-specific types
export interface TelegramMessage {
  message_id: number;
  from?: any;
  chat: any;
  date: number;
  text?: string;
  photo?: any[];
  voice?: any;
  document?: any;
  sticker?: any;
  location?: any;
  contact?: any;
}

export interface DiscordMessage {
  id: string;
  channelId: string;
  guildId?: string;
  author: any;
  content: string;
  timestamp: string;
  attachments: any[];
  embeds: any[];
}

export interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  image?: { id: string; mime_type: string };
  audio?: { id: string; mime_type: string };
  document?: { id: string; filename: string; mime_type: string };
}