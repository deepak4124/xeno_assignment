import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars from the backend .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
    const shopDomain = process.env.SHOP_DOMAIN;
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

    if (!shopDomain || !accessToken) {
        console.error('Error: SHOP_DOMAIN and SHOPIFY_ACCESS_TOKEN must be defined in .env');
        process.exit(1);
    }

    console.log(`Seeding tenant: ${shopDomain}...`);

    try {
        const tenant = await prisma.tenant.upsert({
            where: { shopDomain },
            update: { accessToken },
            create: { shopDomain, accessToken },
        });
        console.log('Tenant seeded successfully:', tenant);
    } catch (error) {
        console.error('Error seeding tenant:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
