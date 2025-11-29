import dotenv from 'dotenv';
import { connectNats } from './nats/client';
import { startWorker } from './nats/worker';
import { ensureTenantExists } from './utils/seed';
import { logger } from './utils/logger';
import app from './app';

dotenv.config();

const PORT = process.env.PORT || 4000;

const start = async () => {
  try {
    await connectNats();
    
    // Ensure the tenant exists in the DB
    await ensureTenantExists();
    
    // Start the worker in the background
    startWorker().catch(err => logger.error('Worker failed', err));

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start application', error);
    process.exit(1);
  }
};

start();

