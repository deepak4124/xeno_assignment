import request from 'supertest';

// Mock Prisma
const mockFindMany = jest.fn();
const mockCount = jest.fn();

const mockPrisma = {
  order: {
    findMany: mockFindMany,
    count: mockCount,
  },
  customer: {
    count: mockCount,
    findMany: mockFindMany,
  },
  systemLog: {
    findMany: mockFindMany,
  }
};

jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
  };
});

// Mock NATS producer
jest.mock('../nats/producer', () => ({
  publishSyncJob: jest.fn(),
  publishWebhookEvent: jest.fn(),
}));

// Mock Logger
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  }
}));

describe('Dashboard Endpoints', () => {
  let app: any;

  beforeAll(async () => {
    app = (await import('../app')).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/stats', () => {
    it('should return aggregated stats', async () => {
      mockPrisma.order.findMany.mockResolvedValue([
        { totalPrice: '100.00' },
        { totalPrice: '50.50' }
      ]);
      // Since customer.count and order.count share the same mock function, we chain return values
      // First call is customer.count(), second is order.count()
      mockCount.mockResolvedValueOnce(10).mockResolvedValueOnce(5);

      const res = await request(app).get('/api/stats');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        totalRevenue: 150.50,
        activeCustomers: 10,
        totalOrders: 5
      });
    });

    it('should handle empty data', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(0);

      const res = await request(app).get('/api/stats');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        totalRevenue: 0,
        activeCustomers: 0,
        totalOrders: 0
      });
    });
  });

  describe('GET /api/sync-status', () => {
    it('should return logs', async () => {
      const logs = [
        { id: '1', level: 'INFO', message: 'Test log', createdAt: new Date().toISOString() }
      ];
      mockPrisma.systemLog.findMany.mockResolvedValue(logs);

      const res = await request(app).get('/api/sync-status');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(JSON.parse(JSON.stringify(logs))); // JSON serialization check
    });
  });

  describe('GET /api/top-customers', () => {
    it('should return top customers', async () => {
      // Mock orders
      mockPrisma.order.findMany.mockResolvedValueOnce([
        { customerId: 'c1', totalPrice: '100' },
        { customerId: 'c1', totalPrice: '50' },
        { customerId: 'c2', totalPrice: '200' },
        { customerId: 'c3', totalPrice: '10' },
      ]);

      // Mock customers
      mockPrisma.customer.findMany.mockResolvedValueOnce([
        { shopifyId: 'c1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
        { shopifyId: 'c2', firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' },
      ]);

      const res = await request(app).get('/api/top-customers');

      expect(res.status).toBe(200);
      // c2: 200, c1: 150, c3: 10
      expect(res.body).toHaveLength(3);
      expect(res.body[0].id).toBe('c2');
      expect(res.body[0].totalSpent).toBe(200);
      expect(res.body[1].id).toBe('c1');
      expect(res.body[1].totalSpent).toBe(150);
    });
  });
});
