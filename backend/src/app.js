// Aplicação Express e registro das rotas do Document Management System.

const express = require('express');
const documentsRouter = require('./routes/documentsRoutes');
const { handleError } = require('./controllers/errorController');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Endpoint de verificação de saúde.
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/', documentsRouter);
app.use(handleError);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;
