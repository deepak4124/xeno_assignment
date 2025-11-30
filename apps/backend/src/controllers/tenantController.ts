import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export const onboardTenant = async (req: Request, res: Response) => {
  const { shopDomain, accessToken, webhookSecret } = req.body;

  if (!shopDomain || !accessToken) {
    return res.status(400).json({ error: 'shopDomain and accessToken are required' });
  }

  try {
    const tenant = await prisma.tenant.upsert({
      where: { shopDomain },
      update: { accessToken, webhookSecret },
      create: { shopDomain, accessToken, webhookSecret },
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

export const deleteTenant = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.tenant.delete({ where: { id } });
    logger.info('Deleted tenant', { tenantId: id });
    res.status(200).json({ message: 'Tenant deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete tenant', error);
    res.status(500).json({ error: 'Failed to delete tenant' });
  }
};
