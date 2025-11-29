import { Request, Response, NextFunction } from 'express';
import { verifyShopifyWebhook } from '../utils/crypto';
import { logger } from '../utils/logger';

export const validateWebhook = (req: Request, res: Response, next: NextFunction) => {
  const hmac = req.get('X-Shopify-Hmac-Sha256');
  const shopDomain = req.get('X-Shopify-Shop-Domain');
  const secret = process.env.SHOPIFY_API_SECRET;

  if (!hmac || !shopDomain || !secret) {
    logger.error('Missing headers or secret', { hmac: !!hmac, shopDomain: !!shopDomain, secret: !!secret });
    return res.status(401).send('Missing webhook headers or configuration');
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
