type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  msg: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

function write(entry: LogEntry) {
  const line = JSON.stringify(entry);
  if (entry.level === 'error') {
    console.error(line);
  } else if (entry.level === 'warn') {
    console.warn(line);
  } else if (entry.level === 'info') {
    console.log(line);
  } else {
    if (process.env.NODE_ENV !== 'production') console.log(line);
  }
}

function base(level: LogLevel, msg: string, context?: Record<string, unknown>) {
  write({ level, msg, context, timestamp: new Date().toISOString() });
}

export const logger = {
  debug: (msg: string, context?: Record<string, unknown>) => base('debug', msg, context),
  info: (msg: string, context?: Record<string, unknown>) => base('info', msg, context),
  warn: (msg: string, context?: Record<string, unknown>) => base('warn', msg, context),
  error: (msg: string, context?: Record<string, unknown>) => base('error', msg, context),
};

// Example: logger.info('Export started', { type, userId });
