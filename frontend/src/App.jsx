import { useEffect, useState } from 'react';
import { listDocuments } from './services/documentsApi.js';
import UploadComponent from './components/UploadComponent.jsx';
import DocumentList from './components/DocumentList.jsx';
import './App.css';

const savedUserId = window.localStorage.getItem('dms-user-id') || '';

export default function App() {
  const [userIdDraft, setUserIdDraft] = useState(savedUserId);
  const [activeUserId, setActiveUserId] = useState(savedUserId);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [listError, setListError] = useState('');
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    if (!activeUserId) {
      setDocuments([]);
      setIsLoading(false);
      setListError('');
      return undefined;
    }

    let isCurrentRequest = true;
    setIsLoading(true);
    setListError('');

    listDocuments(activeUserId)
      .then((result) => {
        if (isCurrentRequest) setDocuments(result);
      })
      .catch((error) => {
        if (isCurrentRequest) {
          setDocuments([]);
          setListError(error.message);
        }
      })
      .finally(() => {
        if (isCurrentRequest) setIsLoading(false);
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [activeUserId, refreshVersion]);

  function handleUserSubmit(event) {
    event.preventDefault();
    const userId = userIdDraft.trim();
    if (!userId) return;

    window.localStorage.setItem('dms-user-id', userId);
    setUserIdDraft(userId);
    setActiveUserId(userId);
  }

  function refreshDocuments() {
    setRefreshVersion((version) => version + 1);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="DMS, início">
          <span className="brand-mark" aria-hidden="true">D</span>
          <span>DMS<span className="brand-period">.</span></span>
        </a>
        <span className="storage-indicator">
          <span className="status-dot" /> Armazenamento local
        </span>
      </header>

      <main className="workspace">
        <section className="page-heading" aria-labelledby="page-title">
          <div>
            <p className="eyebrow">ARQUIVO PESSOAL</p>
            <h1 id="page-title">Seus documentos<span className="heading-period">.</span></h1>
            <p className="heading-description">
              Arquivos organizados em um só lugar.
            </p>
          </div>

          <form className="identity-form" onSubmit={handleUserSubmit}>
            <label htmlFor="user-id">ID do usuário</label>
            <div className="identity-controls">
              <input
                id="user-id"
                value={userIdDraft}
                onChange={(event) => setUserIdDraft(event.target.value)}
                placeholder="ex.: lucas"
                autoComplete="username"
                required
              />
              <button type="submit" className="button button-dark">
                {activeUserId ? 'Trocar' : 'Abrir espaço'}
              </button>
            </div>
          </form>
        </section>

        <section className="upload-section" aria-labelledby="upload-heading">
          <div className="section-heading">
            <div>
              <p className="eyebrow">ADICIONAR</p>
              <h2 id="upload-heading">Enviar um documento</h2>
            </div>
            <span className="section-index">01</span>
          </div>
          <UploadComponent
            userId={activeUserId}
            onUploadComplete={refreshDocuments}
          />
        </section>

        <section className="documents-section" aria-labelledby="documents-heading">
          <div className="section-heading documents-heading">
            <div>
              <p className="eyebrow">BIBLIOTECA</p>
              <h2 id="documents-heading">Documentos</h2>
            </div>
            <div className="document-actions">
              <span className="document-count">
                {documents.length} {documents.length === 1 ? 'arquivo' : 'arquivos'}
              </span>
              <button
                type="button"
                className="button button-light"
                onClick={refreshDocuments}
                disabled={!activeUserId || isLoading}
              >
                Atualizar
              </button>
            </div>
          </div>
          <DocumentList
            documents={documents}
            userId={activeUserId}
            isLoading={isLoading}
            error={listError}
            onRetry={refreshDocuments}
          />
        </section>
      </main>
      <footer className="page-footer">
        <span>DMS <span className="brand-period">/</span> Documentos</span>
        <span>Filesystem local</span>
      </footer>
    </div>
  );
}
