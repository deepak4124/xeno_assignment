import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export const onboardTenant = async (req: Request, res: Response) => {
  const { shopDomain, accessToken } = req.body;

  if (!shopDomain || !accessToken) {
    return res.status(400).json({ error: 'shopDomain and accessToken are required' });
  }

  try {
    const tenant = await prisma.tenant.upsert({
      where: { shopDomain },
      update: { accessToken },
      create: { shopDomain, accessToken },
    });

    logger.info('Onboarded tenant', { shopDomain, tenantId: tenant.id });
    res.status(201).json({ message: 'Tenant onboarded successfully', tenant });
  } catch (error) {
    logger.error('Failed to onboard tenant', error);
    res.status(500).json({ error: 'Failed to onboard tenant' });
  }
};

export const listTenants = async (req: Request, res: Response) => {
  try {
    const tenants = await prisma.tenant.findMany({
      select: { id: true, shopDomain: true, createdAt: true }
    });
    res.json(tenants);
  } catch (error) {
    logger.error('Failed to list tenants', error);
    res.status(500).json({ error: 'Failed to list tenants' });
  }
};
