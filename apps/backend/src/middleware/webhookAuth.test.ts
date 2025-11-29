import { validateWebhook } from './webhookAuth';
import { Request, Response, NextFunction } from 'express';
import * as cryptoUtils from '../utils/crypto';
import { logger } from '../utils/logger';

jest.mock('../utils/crypto');
jest.mock('../utils/logger');

describe('validateWebhook Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      get: jest.fn(),
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    next = jest.fn();
    process.env.SHOPIFY_API_SECRET = 'test_secret';
  });

  it('should return 401 if headers are missing', () => {
    (req.get as jest.Mock).mockReturnValue(undefined);

    validateWebhook(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith('Missing webhook headers or configuration');
    expect(logger.error).toHaveBeenCalledWith('Missing headers or secret', expect.any(Object));
  });

  it('should return 500 if rawBody is missing', () => {
    (req.get as jest.Mock).mockImplementation((header: string) => {
      if (header === 'X-Shopify-Hmac-Sha256') return 'some_hmac';
      if (header === 'X-Shopify-Shop-Domain') return 'test.myshopify.com';
      return undefined;
    });
    // rawBody is missing on req

    validateWebhook(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith('Webhook body parsing failed');
    expect(logger.error).toHaveBeenCalledWith('Raw body missing on request object');
  });

  it('should return 401 if HMAC is invalid', () => {
    (req.get as jest.Mock).mockImplementation((header: string) => {
      if (header === 'X-Shopify-Hmac-Sha256') return 'invalid_hmac';
      if (header === 'X-Shopify-Shop-Domain') return 'test.myshopify.com';
      return undefined;
    });
    (req as any).rawBody = Buffer.from('test');
    (cryptoUtils.verifyShopifyWebhook as jest.Mock).mockReturnValue(false);

    validateWebhook(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith('Invalid HMAC');
    expect(logger.error).toHaveBeenCalledWith('Invalid HMAC for shop', { shopDomain: 'test.myshopify.com' });
  });

  it('should call next() if HMAC is valid', () => {
    (req.get as jest.Mock).mockImplementation((header: string) => {
      if (header === 'X-Shopify-Hmac-Sha256') return 'valid_hmac';
      if (header === 'X-Shopify-Shop-Domain') return 'test.myshopify.com';
      return undefined;
    });
    (req as any).rawBody = Buffer.from('test');
    (cryptoUtils.verifyShopifyWebhook as jest.Mock).mockReturnValue(true);

    validateWebhook(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
