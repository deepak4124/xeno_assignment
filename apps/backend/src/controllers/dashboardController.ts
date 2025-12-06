import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getStats = async (req: Request, res: Response) => {
  try {
    const { shopDomain } = req.query;
    let tenantId: string | undefined;

    if (shopDomain) {
      const tenant = await prisma.tenant.findUnique({ where: { shopDomain: String(shopDomain) } });
      if (tenant) tenantId = tenant.id;
    }

    const whereClause = tenantId ? { tenantId } : {};

    const totalRevenueResult = await prisma.order.findMany({
      where: whereClause,
      select: { totalPrice: true }
    });

    const totalRevenue = totalRevenueResult.reduce((acc: number, order: { totalPrice: string | null }) => {
      return acc + (parseFloat(order.totalPrice || '0') || 0);
    }, 0);

    const activeCustomers = await prisma.customer.count({ where: whereClause });
    const totalOrders = await prisma.order.count({ where: whereClause });

    // Bonus: Checkouts
    const activeCheckouts = await prisma.checkout.count({ where: whereClause });

    const abandonedCheckouts = await prisma.checkout.findMany({
      where: { ...whereClause, completedAt: null },
      select: { totalPrice: true }
    });

    const abandonedRevenue = abandonedCheckouts.reduce((acc: number, c: { totalPrice: string | null }) => {
      return acc + (parseFloat(c.totalPrice || '0') || 0);
    }, 0);

    res.json({
      totalRevenue,
      activeCustomers,
      totalOrders,
      activeCheckouts,
      abandonedRevenue
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

export const getSyncStatus = async (req: Request, res: Response) => {
  try {
    const { shopDomain } = req.query;
    
    // Filter by shopDomain in metadata if provided
    const whereClause = shopDomain ? {
      metadata: {
        path: ['shopDomain'],
        equals: shopDomain
      }
    } : {};

    const logs = await prisma.systemLog.findMany({
      where: whereClause,
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
    const { shopDomain } = req.query;
    let tenantId: string | undefined;

    if (shopDomain) {
      const tenant = await prisma.tenant.findUnique({ where: { shopDomain: String(shopDomain) } });
      if (tenant) tenantId = tenant.id;
    }

    const whereClause = tenantId ? { tenantId } : {};

    // Fetch all orders with customerId and totalPrice
    const orders = await prisma.order.findMany({
      where: {
        ...whereClause,
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

export const getOrdersTrend = async (req: Request, res: Response) => {
  try {
    const { shopDomain, startDate, endDate } = req.query;
    let tenantId: string | undefined;

    if (shopDomain) {
      const tenant = await prisma.tenant.findUnique({ where: { shopDomain: String(shopDomain) } });
      if (tenant) tenantId = tenant.id;
    }

    const whereClause: any = tenantId ? { tenantId } : {};
    
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(String(startDate));
      if (endDate) whereClause.createdAt.lte = new Date(String(endDate));
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      select: {
        createdAt: true,
        totalPrice: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Group by date (YYYY-MM-DD)
    const grouped = orders.reduce((acc: Record<string, number>, order: any) => {
      const date = new Date(order.createdAt).toISOString().split('T')[0];
      const price = parseFloat(order.totalPrice || '0') || 0;
      acc[date] = (acc[date] || 0) + price;
      return acc;
    }, {});

    // Fill in missing dates with 0
    const result: { date: string; total: number }[] = [];
    
    console.log('Dashboard Debug:', { startDate, endDate, ordersCount: orders.length, groupedKeys: Object.keys(grouped) });

    if (startDate && endDate) {
      // If range is provided, fill all dates in range
      let current = new Date(String(startDate));
      const end = new Date(String(endDate));
      
      console.log('Date Range Debug:', { current: current.toISOString(), end: end.toISOString() });

      while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        result.push({
          date: dateStr,
          total: grouped[dateStr] || 0
        });
        current.setDate(current.getDate() + 1);
      }
    } else {
      // If "All Time", fill gaps between first and last order
      const sortedDates = Object.keys(grouped).sort();
      if (sortedDates.length > 0) {
        let current = new Date(sortedDates[0]);
        const end = new Date(sortedDates[sortedDates.length - 1]);
        
        while (current <= end) {
          const dateStr = current.toISOString().split('T')[0];
          result.push({
            date: dateStr,
            total: grouped[dateStr] || 0
          });
          current.setDate(current.getDate() + 1);
        }
      }
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching orders trend:', error);
    res.status(500).json({ error: 'Failed to fetch orders trend' });
  }
};
