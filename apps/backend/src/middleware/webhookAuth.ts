import { Request, Response, NextFunction } from 'express';
import { verifyShopifyWebhook } from '../utils/crypto';
import { logger } from '../utils/logger';
import prisma from '../utils/prisma';

export const validateWebhook = async (req: Request, res: Response, next: NextFunction) => {
  const hmac = req.get('X-Shopify-Hmac-Sha256');
  const shopDomain = req.get('X-Shopify-Shop-Domain');
  let secret = process.env.SHOPIFY_API_SECRET;

  if (!hmac || !shopDomain) {
    logger.error('Missing headers', { hmac: !!hmac, shopDomain: !!shopDomain });
    return res.status(401).send('Missing webhook headers');
  }

  // Try to fetch tenant-specific secret
  try {
    const tenant = await prisma.tenant.findUnique({ where: { shopDomain } });
    if (tenant && tenant.webhookSecret) {
      secret = tenant.webhookSecret;
    }
  } catch (error) {
    logger.error('Failed to fetch tenant for webhook validation', error);
    // Fallback to default secret if DB fails, or fail? 
    // Better to fail safe or continue if we trust the default secret.
    // We'll continue with default secret.
  }

  if (!secret) {
    logger.error('No webhook secret found for shop', { shopDomain });
    return res.status(500).send('Server configuration error');
  }

  // Note: req.body must be the raw buffer. 
  // We will handle this in index.ts by using express.json({ verify: ... })
  const rawBody = (req as any).rawBody;

  if (!rawBody) {
    logger.error('Raw body missing on request object');
    return res.status(500).send('Webhook body parsing failed');
  }

  const isValid = verifyShopifyWebhook(rawBody, hmac, secret);

  if (!isValid) {
    logger.error('Invalid HMAC for shop', { shopDomain });
    return res.status(401).send('Invalid HMAC');
  }

  next();
};
