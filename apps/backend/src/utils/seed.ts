import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const prisma = new PrismaClient();

export const ensureTenantExists = async () => {
  const shopDomain = process.env.SHOP_DOMAIN;
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

  if (!shopDomain || !accessToken) {
    logger.warn('SHOP_DOMAIN or SHOPIFY_ACCESS_TOKEN not set, skipping tenant seeding');
    return;
  }

  try {
    const tenant = await prisma.tenant.upsert({
      where: { shopDomain },
      update: { accessToken },
      create: {
        shopDomain,
        accessToken,
      },
    });
    logger.info('Ensured tenant exists', { tenantId: tenant.id, shopDomain });
  } catch (error) {
    logger.error('Failed to seed tenant', error);
  }
};
