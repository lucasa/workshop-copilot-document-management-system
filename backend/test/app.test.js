const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const storageDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'dms-storage-'));
process.env.DMS_STORAGE_DIR = storageDirectory;
process.env.DMS_MAX_FILE_SIZE_BYTES = '32';

const app = require('../src/app');

// Confirma que o app Express está disponível para integração e testes.
test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('permite enviar, listar e baixar documentos somente pelo proprietário', async (t) => {
  const server = app.listen(0);
  t.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    fs.rmSync(storageDirectory, { recursive: true, force: true });
  });

  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  const missingUserResponse = await fetch(`${baseUrl}/documents`);
  assert.strictEqual(missingUserResponse.status, 400);
  assert.strictEqual((await missingUserResponse.json()).error.code, 'USER_ID_REQUIRED');

  const emptyFormResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'usuario-a' },
    body: new FormData(),
  });
  assert.strictEqual(emptyFormResponse.status, 400);
  assert.strictEqual((await emptyFormResponse.json()).error.code, 'FILE_REQUIRED');

  const multipartWithField = new FormData();
  multipartWithField.append('metadata', 'valor inesperado');
  multipartWithField.append('file', new Blob(['conteudo']), 'nota.txt');
  const invalidMultipartResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'usuario-a' },
    body: multipartWithField,
  });
  assert.strictEqual(invalidMultipartResponse.status, 400);
  assert.strictEqual(
    (await invalidMultipartResponse.json()).error.code,
    'INVALID_MULTIPART',
  );

  const formData = new FormData();
  formData.append('file', new Blob(['conteudo do arquivo'], { type: 'text/plain' }), 'nota.txt');
  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'usuario-a' },
    body: formData,
  });

  assert.strictEqual(uploadResponse.status, 201, await uploadResponse.clone().text());
  const { document } = await uploadResponse.json();
  assert.strictEqual(document.originalName, 'nota.txt');
  assert.strictEqual(document.owner, 'usuario-a');
  assert.strictEqual(document.size, Buffer.byteLength('conteudo do arquivo'));
  assert.strictEqual(Object.hasOwn(document, 'storageName'), false);

  const listResponse = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': 'usuario-a' },
  });
  assert.deepStrictEqual((await listResponse.json()).documents, [document]);

  const otherUserListResponse = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': 'usuario-b' },
  });
  assert.deepStrictEqual((await otherUserListResponse.json()).documents, []);

  const oversizedFormData = new FormData();
  oversizedFormData.append(
    'file',
    new Blob(['x'.repeat(64)], { type: 'text/plain' }),
    'grande.txt',
  );
  const oversizedResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'usuario-a' },
    body: oversizedFormData,
  });
  assert.strictEqual(oversizedResponse.status, 413);
  assert.strictEqual((await oversizedResponse.json()).error.code, 'FILE_TOO_LARGE');
  assert.strictEqual(fs.readdirSync(storageDirectory).length, 1);

  const downloadResponse = await fetch(`${baseUrl}/documents/${document.id}/download`, {
    headers: { 'X-User-Id': 'usuario-a' },
  });
  assert.strictEqual(downloadResponse.status, 200);
  assert.strictEqual(await downloadResponse.text(), 'conteudo do arquivo');
  assert.strictEqual(
    downloadResponse.headers.get('content-type'),
    'application/octet-stream',
  );
  assert.match(downloadResponse.headers.get('content-disposition'), /attachment/);

  const forbiddenDownloadResponse = await fetch(
    `${baseUrl}/documents/${document.id}/download`,
    { headers: { 'X-User-Id': 'usuario-b' } },
  );
  assert.strictEqual(forbiddenDownloadResponse.status, 404);
  assert.strictEqual(
    (await forbiddenDownloadResponse.json()).error.code,
    'DOCUMENT_NOT_FOUND',
  );
});
