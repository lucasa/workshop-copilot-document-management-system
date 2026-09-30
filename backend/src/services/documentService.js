const { randomUUID } = require('node:crypto');
const documentRepository = require('../repositories/documentRepository');

async function upload(file, owner) {
  const document = {
    id: randomUUID(),
    originalName: file.originalname,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
    contentType: file.mimetype || null,
    storageName: file.filename,
  };

  try {
    await documentRepository.add(document);
  } catch (error) {
    await documentRepository.removeFile(file.filename);
    throw error;
  }

  return toPublicDocument(document);
}

async function listByOwner(owner) {
  return documentRepository.findByOwner(owner).map(toPublicDocument);
}

async function getDownload(id, owner) {
  const document = documentRepository.findById(id);
  if (!document || document.owner !== owner) {
    const error = new Error('Documento não encontrado.');
    error.statusCode = 404;
    error.code = 'DOCUMENT_NOT_FOUND';
    throw error;
  }

  return {
    document: toPublicDocument(document),
    filePath: documentRepository.getFilePath(document.storageName),
  };
}

function toPublicDocument(document) {
  const { storageName, ...publicDocument } = document;
  return publicDocument;
}

module.exports = { upload, listByOwner, getDownload };