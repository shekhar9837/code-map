import { AUTH } from '@/constants/messages';

type LogLevel = 'info' | 'warn' | 'error';

export class LoggerService {
  private static instance: LoggerService;
  private context: string;

  private constructor(context: string = 'App') {
    this.context = context;
  }

  public static getLogger(context: string): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService(context);
    }
    return LoggerService.instance;
  }

  private log(level: LogLevel, message: string, data?: unknown) {
    const timestamp = new Date().toISOString();
    const baseEntry = {
      timestamp,
      level,
      context: this.context,
      message,
    };
    
    const logEntry = data 
      ? { ...baseEntry, data }
      : baseEntry;

    if (level === 'error') {
      console.error(JSON.stringify(logEntry));
    } else if (level === 'warn') {
      console.warn(JSON.stringify(logEntry));
    } else {
      console.log(JSON.stringify(logEntry));
    }
  }

  public info(message: string, data?: unknown) {
    this.log('info', message, data);
  }

  public warn(message: string, data?: unknown) {
    this.log('warn', message, data);
  }

  public error(message: string, error?: Error | unknown) {
    const errorData = error instanceof Error 
      ? { message: error.message, stack: error.stack }
      : { error };
    this.log('error', message, errorData);
  }
}
