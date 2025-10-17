import pino from 'pino';

export const logger = pino({
  name: 'clipvox',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
});

export default logger;
