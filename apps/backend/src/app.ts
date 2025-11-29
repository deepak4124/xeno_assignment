import express from 'express';
import { publishSyncJob } from './nats/producer';
import { PrismaClient } from '@prisma/client';
import { validateWebhook } from './middleware/webhookAuth';
import { handleWebhook } from './controllers/webhookController';
import { logger } from './utils/logger';

const app = express();

// Middleware to capture raw body for HMAC verification
app.use(express.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  }
}));

const prisma = new PrismaClient();

// Webhook Endpoint
app.post('/api/webhooks', validateWebhook, handleWebhook);

app.post('/api/sync', async (req, res) => {
  const { shopDomain } = req.body;
  
  if (!shopDomain) {
    return res.status(400).json({ error: 'shopDomain is required' });
  }

  try {
    const tenant = await prisma.tenant.findUnique({ where: { shopDomain } });
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    await publishSyncJob(tenant.id, 'customers');
    await publishSyncJob(tenant.id, 'orders');
    await publishSyncJob(tenant.id, 'products');

    res.json({ message: 'Sync started 🚀' });
  } catch (error) {
    logger.error('Error triggering sync', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Seed endpoint for testing
app.post('/api/tenants', async (req, res) => {
    const { shopDomain, accessToken } = req.body;
    try {
        const tenant = await prisma.tenant.create({
            data: { shopDomain, accessToken }
        });
        res.json(tenant);
    } catch (e) {
        res.status(500).json({ error: e });
    }
});

export default app;
