const multer = require('multer');

function handleError(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof multer.MulterError) {
    const isFileTooLarge = error.code === 'LIMIT_FILE_SIZE';
    return res.status(isFileTooLarge ? 413 : 400).json({
      error: {
        code: isFileTooLarge ? 'FILE_TOO_LARGE' : 'INVALID_MULTIPART',
        message: isFileTooLarge
          ? 'O arquivo excede o limite permitido.'
          : 'Não foi possível processar o envio do arquivo.',
      },
    });
  }

  const statusCode = error.statusCode || 500;
  return res.status(statusCode).json({
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: statusCode === 500 ? 'Ocorreu um erro interno.' : error.message,
    },
  });
}

module.exports = { handleError };