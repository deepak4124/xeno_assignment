import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getStats = async (req: Request, res: Response) => {
  try {
    // In a real multi-tenant app, we should filter by tenantId from the authenticated user/request
    // For this assignment, we might just aggregate everything or pick the first tenant
    // Let's assume we want stats for all tenants or a specific one if provided
    // For simplicity, let's aggregate all for now, or just count.
    
    const totalRevenueResult = await prisma.order.findMany({
      select: { totalPrice: true }
    });
    
    const totalRevenue = totalRevenueResult.reduce((acc: number, order: { totalPrice: string | null }) => {
      return acc + (parseFloat(order.totalPrice || '0') || 0);
    }, 0);

    const activeCustomers = await prisma.customer.count();
    const totalOrders = await prisma.order.count();

    res.json({
      totalRevenue,
      activeCustomers,
      totalOrders
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

export const getSyncStatus = async (req: Request, res: Response) => {
  try {
    const logs = await prisma.systemLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json(logs);
  } catch (error) {
    console.error('Error fetching sync status:', error);
    res.status(500).json({ error: 'Failed to fetch sync status' });
  }
};

export const getTopCustomers = async (req: Request, res: Response) => {
  try {
    // Fetch all orders with customerId and totalPrice
    const orders = await prisma.order.findMany({
      where: {
        customerId: { not: null }
      },
      select: {
        customerId: true,
        totalPrice: true
      }
    });

    // Aggregate in memory (since totalPrice is string)
    const customerSpending: Record<string, number> = {};
    
    orders.forEach((order: { customerId: string | null, totalPrice: string | null }) => {
      if (order.customerId) {
        const price = parseFloat(order.totalPrice || '0') || 0;
        customerSpending[order.customerId] = (customerSpending[order.customerId] || 0) + price;
      }
    });

    // Sort and take top 5
    const sortedCustomers = Object.entries(customerSpending)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    const topCustomerIds = sortedCustomers.map(([id]) => id);

    // Fetch customer details
    const customers = await prisma.customer.findMany({
      where: {
        shopifyId: { in: topCustomerIds }
      },
      select: {
        shopifyId: true,
        firstName: true,
        lastName: true,
        email: true
      }
    });

    // Map details back to the result
    const result = sortedCustomers.map(([id, totalSpent]) => {
      const customer = customers.find((c: { shopifyId: string, firstName: string | null, lastName: string | null, email: string | null }) => c.shopifyId === id);
      return {
        id,
        name: customer ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.email || 'Unknown' : 'Unknown',
        totalSpent
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching top customers:', error);
    res.status(500).json({ error: 'Failed to fetch top customers' });
  }
};
