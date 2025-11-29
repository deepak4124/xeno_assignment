import crypto from 'crypto';

export const verifyShopifyWebhook = (rawBody: Buffer, hmac: string, secret: string): boolean => {
  const generatedHash = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('base64');

  const hashBuffer = Buffer.from(generatedHash);
  const hmacBuffer = Buffer.from(hmac);

  if (hashBuffer.length !== hmacBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(hashBuffer, hmacBuffer);
};
