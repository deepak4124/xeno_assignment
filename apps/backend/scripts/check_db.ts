import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.count();
  const customers = await prisma.customer.count();
  const orders = await prisma.order.count();
  const products = await prisma.product.count();

  console.log('--- Database Stats ---');
  console.log(`Tenants:   ${tenants}`);
  console.log(`Customers: ${customers}`);
  console.log(`Orders:    ${orders}`);
  console.log(`Products:  ${products}`);
  console.log('-------------------------');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
