import { StringCodec, AckPolicy, JsMsg, JetStreamClient } from 'nats';
import { getJetStream, getNatsConnection } from './client';
import { PrismaClient } from '@prisma/client';
import { ShopifyService, RateLimitError } from '../services/shopify';
import { IngestionService } from '../services/ingestion';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();
const sc = StringCodec();

export const processMessage = async (msg: JsMsg, js: JetStreamClient) => {
  try {
    const subjectParts = msg.subject.split('.');
    // ingest.{tenantId}.{resource} OR webhook.{shopDomain}.{resource}.{action}
    const type = subjectParts[0];

    if (type === 'webhook') {
      const messageBody = JSON.parse(sc.decode(msg.data));
      const { shopDomain, topic, data } = messageBody;
      const resource = topic.split('/')[0]; // orders/create -> orders

      logger.info('Processing webhook', { resource, shopDomain });

      // Resolve Tenant ID from Shop Domain
      const tenant = await prisma.tenant.findUnique({ where: { shopDomain } });
      if (!tenant) {
        logger.error('Tenant not found for shop, ignoring webhook', { shopDomain });
        msg.term();
        return;
      }

      switch (resource) {
        case 'customers':
          await IngestionService.upsertCustomer(tenant.id, data);
          break;
        case 'orders':
          await IngestionService.upsertOrder(tenant.id, data);
          break;
        case 'products':
          await IngestionService.upsertProduct(tenant.id, data);
          break;
        case 'checkouts':
          await IngestionService.upsertCheckout(tenant.id, data);
          break;
      }
      msg.ack();
      return;
    }

    // Handle 'ingest' (Sync Jobs)
    // ingest.{tenantId}.{resource}
    const tenantId = subjectParts[1];
    const resource = subjectParts[2] as 'orders' | 'customers' | 'products';

    const data = JSON.parse(sc.decode(msg.data));
    const cursor = data.cursor;

    logger.info('Processing sync job', { resource, tenantId, cursor: cursor || 'Start' });

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      logger.error('Tenant not found', { tenantId });
      msg.term();
      return;
    }

    const shopify = new ShopifyService(tenant.shopDomain, tenant.accessToken);
    let result;

    switch (resource) {
      case 'customers':
        result = await shopify.getCustomers(10, cursor);
        for (const c of result.customers) await IngestionService.upsertCustomer(tenantId, c);
        break;
      case 'orders':
        result = await shopify.getOrders(10, cursor);
        for (const o of result.orders) await IngestionService.upsertOrder(tenantId, o);
        break;
      case 'products':
        result = await shopify.getProducts(10, cursor);
        for (const p of result.products) await IngestionService.upsertProduct(tenantId, p);
        break;
    }

    // Pagination
    if (result && result.nextCursor) {
      const nextPayload = JSON.stringify({ status: 'processing', cursor: result.nextCursor });
      await js.publish(msg.subject, sc.encode(nextPayload));
      logger.info('Triggered next page', { resource });
    } else {
      logger.info('Finished syncing', { resource, tenantId });
    }

    msg.ack();

  } catch (error: any) {
    if (error instanceof RateLimitError) {
      logger.warn('Rate limit hit', { retryAfter: error.retryAfter });
      msg.nak(error.retryAfter * 1000);
    } else {
      logger.error('Error processing message', error);
      msg.term(); // Terminate if it's a bad error
    }
  }
};

export const startWorker = async () => {
  const js = getJetStream();
  const nc = getNatsConnection();
  const jsm = await nc.jetstreamManager();

  // Ensure the stream exists (already done in client.ts, but good to be safe)
  // Create/Update the consumer
  // We use 'update' instead of 'add' to avoid "consumer already exists" error if configuration changes
  // Or we can catch the error. But 'add' should be idempotent if config is same.
  // If config is different, we might need to delete and recreate or use update.

  try {
    await jsm.consumers.add('DATA_INGESTION', {
      durable_name: 'ingestion_worker',
      ack_policy: AckPolicy.Explicit,
      filter_subjects: ['ingest.>', 'webhook.>'],
    });
  } catch (err: any) {
    // If it already exists, we might want to update it to ensure filter_subjects are correct
    if (err.message.includes('consumer already exists')) {
      logger.info('Consumer already exists, updating configuration...');
      // Note: NATS.js might not have a direct 'update' method on consumers depending on version,
      // but 'add' usually updates if durable name matches. 
      // The error 10148 usually means we are trying to create a durable that exists with DIFFERENT config.
      // So we should delete and recreate it to apply new filters.
      await jsm.consumers.delete('DATA_INGESTION', 'ingestion_worker');
      await jsm.consumers.add('DATA_INGESTION', {
        durable_name: 'ingestion_worker',
        ack_policy: AckPolicy.Explicit,
        filter_subjects: ['ingest.>', 'webhook.>'],
      });
    } else {
      throw err;
    }
  }

  // Get the consumer interface
  const consumer = await js.consumers.get('DATA_INGESTION', 'ingestion_worker');
  const messages = await consumer.consume();

  logger.info('Worker listening for messages...');

  for await (const msg of messages) {
    await processMessage(msg, js);
  }
};
