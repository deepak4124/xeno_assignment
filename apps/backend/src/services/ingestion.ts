import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class IngestionService {
  static async upsertCustomer(tenantId: string, data: any) {
    return prisma.customer.upsert({
      where: { tenantId_shopifyId: { tenantId, shopifyId: data.id.toString() } },
      update: { 
        email: data.email, 
        firstName: data.first_name, 
        lastName: data.last_name 
      },
      create: { 
        shopifyId: data.id.toString(), 
        email: data.email, 
        firstName: data.first_name, 
        lastName: data.last_name, 
        tenantId 
      },
    });
  }

  static async upsertOrder(tenantId: string, data: any) {
    return prisma.order.upsert({
      where: { tenantId_shopifyId: { tenantId, shopifyId: data.id.toString() } },
      update: { 
        totalPrice: data.total_price, 
        currency: data.currency, 
        orderNumber: data.order_number 
      },
      create: {
        shopifyId: data.id.toString(),
        totalPrice: data.total_price,
        currency: data.currency,
        orderNumber: data.order_number,
        tenantId
      }
    });
  }

  static async upsertProduct(tenantId: string, data: any) {
    return prisma.product.upsert({
      where: { tenantId_shopifyId: { tenantId, shopifyId: data.id.toString() } },
      update: { 
        title: data.title, 
        vendor: data.vendor 
      },
      create: {
        shopifyId: data.id.toString(),
        title: data.title,
        vendor: data.vendor,
        tenantId
      }
    });
  }
}
