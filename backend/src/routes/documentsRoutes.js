const { randomUUID } = require('node:crypto');
const express = require('express');
const multer = require('multer');
const { storageDirectory, maxFileSize } = require('../config/storageConfig');
const documentsController = require('../controllers/documentsController');

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, storageDirectory),
    filename: (_req, _file, callback) => callback(null, randomUUID()),
  }),
  limits: {
    fileSize: maxFileSize,
    files: 1,
    fields: 0,
  },
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