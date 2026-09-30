import { useRef, useState } from 'react';
import { uploadDocument } from '../services/documentsApi.js';

export default function UploadComponent({ userId, onUploadComplete }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file || !userId || isUploading) return;

    setIsUploading(true);
    setMessage('');
    setError('');
    try {
      await uploadDocument(file, userId);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setMessage('Documento enviado.');
      onUploadComplete();
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <div className="upload-fields">
        <label className="file-field" htmlFor="document-file">
          <span className="file-field-label">Arquivo</span>
          <input
            ref={fileInputRef}
            id="document-file"
            type="file"
            onChange={(event) => {
              setFile(event.target.files?.[0] || null);
              setMessage('');
              setError('');
            }}
            disabled={!userId || isUploading}
          />
        </label>
        <button
          type="submit"
          className="button button-accent"
          disabled={!userId || !file || isUploading}
        >
          {isUploading ? 'Enviando…' : 'Enviar documento'}
        </button>
      </div>
      {!userId && <p className="field-note">Informe seu ID de usuário para enviar arquivos.</p>}
      {message && <p className="form-message" role="status">{message}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
    </form>
  );
}