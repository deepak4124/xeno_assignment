import prisma from './prisma';

const logToDb = async (level: string, message: string, metadata?: any) => {
  try {
    await prisma.systemLog.create({
      data: {
        level,
        message,
        metadata: metadata ? JSON.stringify(metadata) : undefined
      }
    });
  } catch (err) {
    console.error('Failed to write log to DB', err);
  }
};

export const logger = {
  info: (msg: string, context?: object) => {
    console.log(`[${new Date().toISOString()}] [INFO] ${msg}`, context ? JSON.stringify(context) : '');
    logToDb('INFO', msg, context);
  },
  warn: (msg: string, context?: object) => {
    console.warn(`[${new Date().toISOString()}] [WARN] ${msg}`, context ? JSON.stringify(context) : '');
    logToDb('WARN', msg, context);
  },
  error: (msg: string, error?: any) => {
    const errorMsg = error instanceof Error ? error.message : (typeof error === 'object' ? JSON.stringify(error) : error);
    console.error(`[${new Date().toISOString()}] [ERROR] ${msg}`, errorMsg || '');
    logToDb('ERROR', msg, { error: errorMsg });
  }
};
