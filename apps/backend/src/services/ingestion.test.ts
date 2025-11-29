// Mock Prisma Client
const mockUpsert = jest.fn();

const mockPrisma = {
  customer: { upsert: mockUpsert },
  order: { upsert: mockUpsert },
  product: { upsert: mockUpsert },
};

jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
  };
});

describe('IngestionService', () => {
  let IngestionService: any;
  const tenantId = 'test-tenant-id';

  beforeAll(async () => {
    const module = await import('./ingestion');
    IngestionService = module.IngestionService;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });


  describe('upsertCustomer', () => {
    it('should upsert a customer correctly', async () => {
      const customerData = {
        id: 123,
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
      };

      mockUpsert.mockResolvedValue({ 
        id: 'db-id', 
        shopifyId: customerData.id.toString(),
        email: customerData.email,
        firstName: customerData.first_name,
        lastName: customerData.last_name,
        tenantId
      });

      await IngestionService.upsertCustomer(tenantId, customerData);

      expect(mockPrisma.customer.upsert).toHaveBeenCalledWith({
        where: { tenantId_shopifyId: { tenantId, shopifyId: '123' } },
        update: {
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
        },
        create: {
          shopifyId: '123',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          tenantId,
        },
      });
    });
  });

  describe('upsertOrder', () => {
    it('should upsert an order correctly', async () => {
      const orderData = {
        id: 456,
        total_price: '100.00',
        currency: 'USD',
        order_number: 1001,
      };

      mockUpsert.mockResolvedValue({ 
        id: 'db-id', 
        shopifyId: orderData.id.toString(),
        totalPrice: orderData.total_price,
        currency: orderData.currency,
        orderNumber: orderData.order_number,
        tenantId
      });

      await IngestionService.upsertOrder(tenantId, orderData);

      expect(mockPrisma.order.upsert).toHaveBeenCalledWith({
        where: { tenantId_shopifyId: { tenantId, shopifyId: '456' } },
        update: {
          totalPrice: '100.00',
          currency: 'USD',
          orderNumber: 1001,
          customerId: null,
        },
        create: {
          shopifyId: '456',
          totalPrice: '100.00',
          currency: 'USD',
          orderNumber: 1001,
          tenantId,
          customerId: null,
        },
      });
    });
  });

  describe('upsertProduct', () => {
    it('should upsert a product correctly', async () => {
      const productData = {
        id: 789,
        title: 'Test Product',
        vendor: 'Test Vendor',
      };

      mockUpsert.mockResolvedValue({ 
        id: 'db-id', 
        shopifyId: productData.id.toString(),
        title: productData.title,
        vendor: productData.vendor,
        tenantId
      });

      await IngestionService.upsertProduct(tenantId, productData);

      expect(mockPrisma.product.upsert).toHaveBeenCalledWith({
        where: { tenantId_shopifyId: { tenantId, shopifyId: '789' } },
        update: {
          title: 'Test Product',
          vendor: 'Test Vendor',
        },
        create: {
          shopifyId: '789',
          title: 'Test Product',
          vendor: 'Test Vendor',
          tenantId,
        },
      });
    });
  });
});
