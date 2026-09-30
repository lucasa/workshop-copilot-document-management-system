import DownloadButton from './DownloadButton.jsx';

function formatFileSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data indisponível';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default function DocumentList({
  documents,
  userId,
  isLoading,
  error,
  onRetry,
}) {
  if (!userId) {
    return <p className="list-placeholder">Informe um ID de usuário para abrir a biblioteca.</p>;
  }

  if (isLoading) {
    return <p className="list-placeholder" role="status">Carregando documentos…</p>;
  }

  if (error) {
    return (
      <div className="list-error" role="alert">
        <p>{error}</p>
        <button type="button" className="button button-light" onClick={onRetry}>
          Tentar novamente
        </button>
      </div>
    );
  }

  if (documents.length === 0) {
    return <p className="list-placeholder">Nenhum documento enviado ainda.</p>;
  }

  return (
    <div className="table-scroll">
      <table className="document-table">
        <thead>
          <tr>
            <th scope="col">Nome</th>
            <th scope="col">Enviado em</th>
            <th scope="col">Tamanho</th>
            <th scope="col"><span className="visually-hidden">Ações</span></th>
          </tr>
        </thead>
        <tbody>
          {documents.map((document) => (
            <tr key={document.id}>
              <th scope="row" className="document-name">{document.originalName}</th>
              <td>{formatDate(document.uploadedAt)}</td>
              <td>{formatFileSize(document.size)}</td>
              <td className="table-action">
                <DownloadButton document={document} userId={userId} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}