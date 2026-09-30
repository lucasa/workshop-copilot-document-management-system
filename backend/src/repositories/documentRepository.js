const fs = require('node:fs/promises');
const path = require('node:path');
const { storageDirectory } = require('../config/storageConfig');
const documents = new Map();

async function add(document) {
  documents.set(document.id, document);
}

function findById(id) {
  return documents.get(id) || null;
}

function findByOwner(owner) {
  return [...documents.values()]
    .filter((document) => document.owner === owner)
    .sort((first, second) => second.uploadedAt.localeCompare(first.uploadedAt));
}

function getFilePath(storageName) {
  const filePath = path.resolve(storageDirectory, storageName);
  if (path.dirname(filePath) !== storageDirectory) {
    throw new Error('Nome interno de armazenamento inválido.');
  }
  return filePath;
}

async function removeFile(storageName) {
  try {
    await fs.unlink(getFilePath(storageName));
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

module.exports = {
  add,
  findById,
  findByOwner,
  getFilePath,
  removeFile,
};