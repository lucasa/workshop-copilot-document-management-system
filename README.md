# Document Management System

Aplicação web para enviar, listar e baixar documentos. Os arquivos são gravados no filesystem local por `multer` com `diskStorage`; os metadados permanecem em memória.

## Requisitos

- Node.js 24 ou superior
- npm

## Executar localmente

Instale as dependências e inicie o backend:

```bash
cd backend
npm install
npm run dev
```

Em outro terminal, inicie o frontend:

```bash
cd frontend
npm install
npm run dev
```

Abra `http://localhost:5173`. O Vite encaminha chamadas `/api` para o backend em `http://localhost:3000` e remove o prefixo `/api`.

## Configuração

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `PORT` | `3000` | Porta HTTP do backend. |
| `DMS_STORAGE_DIR` | `backend/storage` | Diretório local dos arquivos; o caminho padrão resolve para `backend/storage`. |
| `DMS_MAX_FILE_SIZE_BYTES` | `10485760` (10 MiB) | Limite máximo por arquivo, em bytes. |

Configure as variáveis no ambiente antes de iniciar o backend. Os arquivos enviados nunca usam o nome fornecido pelo cliente como nome interno no disco.

## API

Todas as rotas de documentos exigem o cabeçalho `X-User-Id`. O frontend chama os caminhos sob `/api`; o proxy Vite remove esse prefixo ao encaminhar as requisições para Express.

| Método e rota Express | Uso |
| --- | --- |
| `GET /health` | Verifica se o backend está ativo. |
| `POST /upload` | Envia um arquivo multipart no campo `file`. |
| `GET /documents` | Lista documentos do identificador informado. |
| `GET /documents/:id/download` | Baixa um documento do proprietário informado. |

O frontend guarda o ID lógico informado no `localStorage` do navegador e envia esse valor em `X-User-Id`. Isso não é autenticação: qualquer cliente pode escolher esse identificador. Não use o MVP para proteger documentos sensíveis.

## Testes e build

```bash
cd backend && npm test
```

```bash
cd frontend && npm run build
```

## Limitações conhecidas

- Os metadados ficam em memória e são perdidos quando o backend reinicia; os arquivos locais permanecem e podem ficar órfãos.
- O projeto pressupõe uma única instância do backend, pois os processos não compartilham o mapa de metadados.
- Não há autenticação, versionamento, exclusão ou armazenamento em nuvem.

## Documentação

- [Índice da documentação](docs/README.md)
- [Especificação do DMS](docs/specs/dms-spec.md)
- [Modelo de especificação](docs/specs/spec-template.md)

## Workshop

Este repositório também é usado no [exercício do workshop](https://github.com/lucasa/workshop-copilot-document-management-system/issues/1).

