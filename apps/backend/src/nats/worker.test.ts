import { StringCodec } from 'nats';
// import { IngestionService } from '../services/ingestion';
// import { ShopifyService } from '../services/shopify';

// Mock Prisma
const mockFindUnique = jest.fn();
const mockPrisma = {
  tenant: { findUnique: mockFindUnique },
};
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
}));

// Mock Services
jest.mock('../services/ingestion');
jest.mock('../services/shopify');
jest.mock('../utils/logger');

const sc = StringCodec();

describe('Worker Message Processing', () => {
  let processMessage: any;
  let IngestionService: any;
  let ShopifyService: any;
  let mockJsMsg: any;
  let mockJsClient: any;

  beforeAll(async () => {
    IngestionService = (await import('../services/ingestion')).IngestionService;
    ShopifyService = (await import('../services/shopify')).ShopifyService;
    const module = await import('./worker');
    processMessage = module.processMessage;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockJsMsg = {
      subject: '',
      data: new Uint8Array(),
      ack: jest.fn(),
      nak: jest.fn(),
      term: jest.fn(),
    };
    mockJsClient = {
      publish: jest.fn(),
    };
  });



  describe('Webhook Processing', () => {
    it('should process a customer webhook successfully', async () => {
      mockJsMsg.subject = 'webhook.test-shop.customers.create';
      const payload = { id: 123, email: 'test@example.com' };
      mockJsMsg.data = sc.encode(JSON.stringify(payload));

      mockFindUnique.mockResolvedValue({ id: 'tenant-1', shopDomain: 'test-shop' });

      await processMessage(mockJsMsg, mockJsClient);

      expect(mockFindUnique).toHaveBeenCalledWith({ where: { shopDomain: 'test-shop' } });
      expect(IngestionService.upsertCustomer).toHaveBeenCalledWith('tenant-1', payload);
      expect(mockJsMsg.ack).toHaveBeenCalled();
    });

    it('should term message if tenant not found for webhook', async () => {
      mockJsMsg.subject = 'webhook.unknown-shop.customers.create';
      mockJsMsg.data = sc.encode(JSON.stringify({}));

      mockFindUnique.mockResolvedValue(null);

      await processMessage(mockJsMsg, mockJsClient);

      expect(mockJsMsg.term).toHaveBeenCalled();
      expect(mockJsMsg.ack).not.toHaveBeenCalled();
    });
  });

  describe('Sync Job Processing', () => {
    it('should process a sync job and trigger next page', async () => {
      mockJsMsg.subject = 'ingest.tenant-1.orders';
      mockJsMsg.data = sc.encode(JSON.stringify({ cursor: null }));

      mockFindUnique.mockResolvedValue({ 
        id: 'tenant-1', 
        shopDomain: 'test-shop', 
        accessToken: 'token' 
      });

      const mockGetOrders = jest.fn().mockResolvedValue({
        orders: [{ id: 1 }],
        nextCursor: 'next-page-cursor'
      });
      (ShopifyService as any).mockImplementation(() => ({
        getOrders: mockGetOrders
      }));

      await processMessage(mockJsMsg, mockJsClient);

      expect(mockGetOrders).toHaveBeenCalledWith(10, null);
      expect(IngestionService.upsertOrder).toHaveBeenCalledWith('tenant-1', { id: 1 });
      expect(mockJsClient.publish).toHaveBeenCalledWith(
        'ingest.tenant-1.orders',
        expect.any(Uint8Array)
      );
      expect(mockJsMsg.ack).toHaveBeenCalled();
    });

    it('should finish syncing if no next cursor', async () => {
      mockJsMsg.subject = 'ingest.tenant-1.products';
      mockJsMsg.data = sc.encode(JSON.stringify({ cursor: 'some-cursor' }));

      mockFindUnique.mockResolvedValue({ 
        id: 'tenant-1', 
        shopDomain: 'test-shop', 
        accessToken: 'token' 
      });

      const mockGetProducts = jest.fn().mockResolvedValue({
        products: [{ id: 1 }],
        nextCursor: null
      });
      (ShopifyService as any).mockImplementation(() => ({
        getProducts: mockGetProducts
      }));

      await processMessage(mockJsMsg, mockJsClient);

      expect(mockGetProducts).toHaveBeenCalledWith(10, 'some-cursor');
      expect(IngestionService.upsertProduct).toHaveBeenCalled();
      expect(mockJsClient.publish).not.toHaveBeenCalled();
      expect(mockJsMsg.ack).toHaveBeenCalled();
    });
  });
});
