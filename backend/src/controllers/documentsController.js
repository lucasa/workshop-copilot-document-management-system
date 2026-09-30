const documentService = require('../services/documentService');

function requireUserId(req, res, next) {
  const userId = req.get('X-User-Id')?.trim();
  if (!userId) {
    return res.status(400).json({
      error: {
        code: 'USER_ID_REQUIRED',
        message: 'O cabeçalho X-User-Id é obrigatório.',
      },
    });
  }

  req.userId = userId;
  return next();
}

async function uploadDocument(req, res, next) {
  if (!req.file) {
    return res.status(400).json({
      error: {
        code: 'FILE_REQUIRED',
        message: 'Envie um arquivo no campo "file".',
      },
    });
  }

  try {
    const document = await documentService.upload(req.file, req.userId);
    return res.status(201).json({ document });
  } catch (error) {
    return next(error);
  }
}

async function listDocuments(req, res, next) {
  try {
    const documents = await documentService.listByOwner(req.userId);
    return res.status(200).json({ documents });
  } catch (error) {
    return next(error);
  }
}

async function downloadDocument(req, res, next) {
  try {
    const { document, filePath } = await documentService.getDownload(
      req.params.id,
      req.userId,
    );
    const downloadName = document.originalName
      .replace(/\\/g, '/')
      .split('/')
      .pop()
      .replace(/[\r\n"]/g, '_');

    res.set('Content-Type', document.contentType || 'application/octet-stream');
    res.set('X-Content-Type-Options', 'nosniff');
    return res.download(filePath, downloadName || 'document', (error) => {
      if (error) {
        if (res.headersSent) {
          return next(error);
        }
        if (error.code === 'ENOENT') {
          error.statusCode = 404;
          error.code = 'DOCUMENT_NOT_FOUND';
          error.message = 'Documento não encontrado.';
        }
        return next(error);
      }
      return undefined;
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  requireUserId,
  uploadDocument,
  listDocuments,
  downloadDocument,
};