import { Request, Response } from 'express';
import { publishWebhookEvent } from '../nats/producer';
import { logger } from '../utils/logger';

export const handleWebhook = async (req: Request, res: Response) => {
  const topic = req.get('X-Shopify-Topic'); // e.g., orders/create
  const shopDomain = req.get('X-Shopify-Shop-Domain');
  
  if (!topic || !shopDomain) {
    return res.status(400).send('Missing headers');
  }

  try {
    logger.info(`Received webhook: ${topic} for ${shopDomain}`, { shopDomain });
    // Fire and Forget: Publish to NATS immediately using shopDomain
    // We do NOT check the DB here to save time and avoid timeouts.
    await publishWebhookEvent(shopDomain, topic, req.body);

    res.status(200).send('Webhook received');
  } catch (error) {
    logger.error('Error handling webhook', error);
    // Even if NATS fails, we might want to return 500 so Shopify retries
    res.status(500).send('Internal Server Error');
  }
};
