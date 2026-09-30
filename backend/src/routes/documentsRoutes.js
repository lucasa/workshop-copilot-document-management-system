const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const express = require('express');
const multer = require('multer');
const documentsController = require('../controllers/documentsController');

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

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, storageDirectory),
    filename: (_req, _file, callback) => callback(null, randomUUID()),
  }),
  limits: { fileSize: maxFileSize, files: 1 },
});

const router = express.Router();

router.post(
  '/upload',
  documentsController.requireUserId,
  upload.single('file'),
  documentsController.uploadDocument,
);
router.get('/documents', documentsController.requireUserId, documentsController.listDocuments);
router.get(
  '/documents/:id/download',
  documentsController.requireUserId,
  documentsController.downloadDocument,
);

module.exports = router;