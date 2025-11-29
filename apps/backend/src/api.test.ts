import request from 'supertest';
// import app from './app';
// import { publishSyncJob } from './nats/producer';

// Mock Prisma
const mockFindUnique = jest.fn();
const mockCreate = jest.fn();

const mockPrisma = {
  tenant: {
    findUnique: mockFindUnique,
    create: mockCreate,
  },
};

jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
  };
});

// Mock NATS producer
jest.mock('./nats/producer', () => ({
  publishSyncJob: jest.fn(),
}));

describe('API Endpoints', () => {
  let app: any;
  let publishSyncJob: any;

  beforeAll(async () => {
    publishSyncJob = (await import('./nats/producer')).publishSyncJob;
    app = (await import('./app')).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });


  describe('POST /api/sync', () => {
    it('should return 400 if shopDomain is missing', async () => {
      const res = await request(app).post('/api/sync').send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('shopDomain is required');
    });

    it('should return 404 if tenant is not found', async () => {
      mockFindUnique.mockResolvedValue(null);
      const res = await request(app).post('/api/sync').send({ shopDomain: 'unknown.myshopify.com' });
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Tenant not found');
    });

    it('should trigger sync if tenant exists', async () => {
      mockFindUnique.mockResolvedValue({ id: 'tenant-123', shopDomain: 'test.myshopify.com' });
      (publishSyncJob as jest.Mock).mockResolvedValue(undefined);

      const res = await request(app).post('/api/sync').send({ shopDomain: 'test.myshopify.com' });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('Sync started');
      expect(publishSyncJob).toHaveBeenCalledTimes(3); // customers, orders, products
      expect(publishSyncJob).toHaveBeenCalledWith('tenant-123', 'customers');
    });
  });

  describe('POST /api/tenants', () => {
    it('should create a new tenant', async () => {
      const newTenant = { id: 'tenant-123', shopDomain: 'new.myshopify.com', accessToken: 'token' };
      mockCreate.mockResolvedValue(newTenant);

      const res = await request(app).post('/api/tenants').send({
        shopDomain: 'new.myshopify.com',
        accessToken: 'token',
      });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(newTenant);
      expect(mockCreate).toHaveBeenCalledWith({
        data: { shopDomain: 'new.myshopify.com', accessToken: 'token' },
      });
    });
  });
});
