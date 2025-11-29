import { verifyShopifyWebhook } from './crypto';
import crypto from 'crypto';

describe('verifyShopifyWebhook', () => {
  const secret = 'test_secret';
  const payload = JSON.stringify({ test: 'data' });
  const rawBody = Buffer.from(payload);

  it('should return true for a valid HMAC', () => {
    const hmac = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('base64');

    const isValid = verifyShopifyWebhook(rawBody, hmac, secret);
    expect(isValid).toBe(true);
  });

  it('should return false for an invalid HMAC', () => {
    const hmac = 'invalid_hmac';
    const isValid = verifyShopifyWebhook(rawBody, hmac, secret);
    expect(isValid).toBe(false);
  });

  it('should return false if secret is incorrect', () => {
    const hmac = crypto
      .createHmac('sha256', 'wrong_secret')
      .update(rawBody)
      .digest('base64');

    const isValid = verifyShopifyWebhook(rawBody, hmac, secret);
    expect(isValid).toBe(false);
  });
});
