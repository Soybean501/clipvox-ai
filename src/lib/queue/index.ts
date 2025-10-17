export type QueueJobName = 'tts' | 'image' | 'render';

export interface QueueJobPayload {
  [key: string]: unknown;
}

export interface QueueClient {
  enqueue(name: QueueJobName, payload: QueueJobPayload): Promise<void>;
}

class NoopQueueClient implements QueueClient {
  async enqueue(name: QueueJobName, payload: QueueJobPayload) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[queue] noop enqueue', name, payload);
    }
  }
}

const client: QueueClient = new NoopQueueClient();

export function getQueueClient(): QueueClient {
  return client;
}
