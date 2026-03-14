const { randomUUID } = require('crypto');

const baseLog = (level, message, meta = {}) => {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };

  const line = JSON.stringify(payload);
  if (level === 'error') {
    console.error(line);
    return;
  }

  console.log(line);
};

const getRequestId = (req) => req.headers['x-request-id'] || randomUUID();

module.exports = {
  info: (message, meta) => baseLog('info', message, meta),
  warn: (message, meta) => baseLog('warn', message, meta),
  error: (message, meta) => baseLog('error', message, meta),
  getRequestId,
};
