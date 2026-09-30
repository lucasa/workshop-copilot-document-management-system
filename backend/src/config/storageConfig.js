const fs = require('node:fs');
const path = require('node:path');

const storageDirectory = path.resolve(
  process.env.DMS_STORAGE_DIR || path.join(__dirname, '../../storage'),
);
fs.mkdirSync(storageDirectory, { recursive: true });

const configuredMaxFileSize = Number.parseInt(
  process.env.DMS_MAX_FILE_SIZE_BYTES,
  10,
);
const maxFileSize = Number.isSafeInteger(configuredMaxFileSize)
  && configuredMaxFileSize > 0
  ? configuredMaxFileSize
  : 10 * 1024 * 1024;

module.exports = { storageDirectory, maxFileSize };