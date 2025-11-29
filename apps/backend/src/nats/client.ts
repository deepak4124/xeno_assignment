import { connect, NatsConnection, JetStreamClient, JetStreamManager } from 'nats';
import { logger } from '../utils/logger';

let nc: NatsConnection;
let js: JetStreamClient;
let jsm: JetStreamManager;

export const connectNats = async () => {
  const natsUrl = process.env.NATS_URL || 'nats://localhost:4222';
  nc = await connect({ servers: natsUrl });
  js = nc.jetstream();
  jsm = await nc.jetstreamManager();
  logger.info('Connected to NATS');
  
  await initJetStream();
};

export const getJetStream = () => {
  if (!js) throw new Error('NATS not connected');
  return js;
};

export const getNatsConnection = () => {
    if (!nc) throw new Error('NATS not connected');
    return nc;
}

const initJetStream = async () => {
  const streamName = 'DATA_INGESTION';
  const subjects = ['ingest.>', 'webhook.>'];

  try {
    const info = await jsm.streams.info(streamName);
    logger.info(`Stream ${streamName} already exists`);

    // Update stream configuration to ensure all subjects are covered
    // This fixes the 503 error if the stream was created before 'webhook.>' was added
    await jsm.streams.update(streamName, {
      ...info.config,
      subjects,
    });
    logger.info(`Updated stream ${streamName} subjects`);
  } catch (e: any) {
    if (e.message.includes('stream not found')) {
      await jsm.streams.add({
        name: streamName,
        subjects,
      });
      logger.info(`Created stream ${streamName}`);
    } else {
      logger.error('Error initializing JetStream', e);
      throw e;
    }
  }
};
