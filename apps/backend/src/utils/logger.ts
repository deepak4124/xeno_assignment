export const logger = {
  info: (msg: string, context?: object) => {
    console.log(`[${new Date().toISOString()}] [INFO] ${msg}`, context ? JSON.stringify(context) : '');
  },
  warn: (msg: string, context?: object) => {
    console.warn(`[${new Date().toISOString()}] [WARN] ${msg}`, context ? JSON.stringify(context) : '');
  },
  error: (msg: string, error?: any) => {
    const errorMsg = error instanceof Error ? error.message : (typeof error === 'object' ? JSON.stringify(error) : error);
    console.error(`[${new Date().toISOString()}] [ERROR] ${msg}`, errorMsg || '');
  }
};
