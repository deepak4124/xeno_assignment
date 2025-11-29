import { StringCodec } from 'nats';
import { getJetStream } from './client';
import { logger } from '../utils/logger';

const sc = StringCodec();

export const publishSyncJob = async (tenantId: string, resource: 'orders' | 'customers' | 'products') => {
  const js = getJetStream();
  const subject = `ingest.${tenantId}.${resource}`;
  const payload = JSON.stringify({ status: 'start', cursor: null });
  
  await js.publish(subject, sc.encode(payload));
  logger.info('Published sync job', { resource, tenantId });
};

export const publishWebhookEvent = async (shopDomain: string, topic: string, payload: any) => {
  const js = getJetStream();
  // Topic format: orders/create -> orders.create
  const cleanTopic = topic.replace('/', '.');
  // Subject: webhook.{shopDomain}.{resource}.{event}
  const subject = `webhook.${shopDomain}.${cleanTopic}`;
  
  await js.publish(subject, sc.encode(JSON.stringify(payload)));
  logger.info('Published webhook event', { topic: cleanTopic, shopDomain });
};
