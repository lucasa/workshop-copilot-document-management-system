# Especificação - Document Management System

## 1. Objetivo

Permitir que usuários enviem, listem e baixem seus documentos, armazenando os arquivos no filesystem local e mantendo seus metadados em memória.

## 2. Escopo

### Dentro do escopo

- Upload de um documento por requisição.
- Listagem dos documentos associados ao usuário solicitante.
- Download de um documento pelo identificador, limitado ao seu proprietário.
- Interface web para upload, listagem e download.
- Persistência dos arquivos em `backend/storage` e dos metadados em memória.

### Fora do escopo

- Autenticação, autorização robusta ou gestão de contas.
- Armazenamento externo ou em nuvem.
- Banco de dados, versionamento, edição ou exclusão de documentos.
- Compartilhamento de documentos entre usuários.
- Busca, paginação e organização por pastas.

### Premissas do MVP

- A identidade lógica do usuário será recebida pelo backend no cabeçalho `X-User-Id`.
- Esse cabeçalho não autentica o usuário: serve apenas para separar dados no MVP e não deve ser tratado como controle de segurança.
- A ausência ou o valor vazio de `X-User-Id` será rejeitado.
- O frontend usará o prefixo `/api`; o proxy do Vite o removerá antes de encaminhar a requisição ao backend.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O usuário pode enviar um arquivo usando `multipart/form-data`, no campo `file`. |
| RF-02 | O backend associa o documento ao `X-User-Id` da requisição. |
| RF-03 | O usuário pode listar somente os documentos associados ao seu identificador. |
| RF-04 | A listagem é ordenada do upload mais recente para o mais antigo. |
| RF-05 | O usuário pode baixar um documento próprio pelo identificador. |
| RF-06 | Um documento inexistente ou pertencente a outro usuário resulta em `404`, sem revelar sua existência. |
| RF-07 | O sistema rejeita upload sem arquivo, sem identificador de usuário ou acima do limite configurado. |
| RF-08 | A interface apresenta estados de carregamento, sucesso, lista vazia e erro para os fluxos de upload e listagem. |
| RF-09 | A interface permite baixar um documento listado. |
| RF-10 | O endpoint existente `GET /health` continua respondendo com `{ "status": "ok" }`. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Usar `multer` com `diskStorage`; arquivos permanecem no filesystem local. |
| RNF-02 | O diretório padrão de armazenamento é `backend/storage`, configurável por ambiente. |
| RNF-03 | Metadados ficam em memória e são perdidos ao reiniciar o processo. |
| RNF-04 | O limite de upload é configurável por ambiente; padrão: 10 MiB por arquivo. |
| RNF-05 | Usar variáveis de ambiente para configuração, incluindo `PORT`, diretório de armazenamento e limite de upload. |
| RNF-06 | Gerar nome interno único para o arquivo; nunca usar diretamente o nome enviado pelo cliente como caminho de armazenamento. |
| RNF-07 | Respostas de erro seguem formato consistente e não expõem caminhos locais, stack traces ou detalhes internos. |
| RNF-08 | Usar CommonJS no backend, JavaScript sem TypeScript e o runner nativo `node:test` para testes backend. |
| RNF-09 | O frontend consome a API por `fetch` usando `/api` e o proxy Vite existente. |
| RNF-10 | O MVP é destinado a execução em uma única instância; múltiplos processos não compartilham o repositório de metadados em memória. |

## 5. Modelo de dados

### Metadados do documento

| Campo | Tipo | Exposição | Descrição |
| --- | --- | --- | --- |
| `id` | string | Pública | Identificador único, gerado pelo servidor. |
| `originalName` | string | Pública | Nome original do arquivo, tratado como texto não confiável. |
| `size` | number | Pública | Tamanho do arquivo em bytes. |
| `uploadedAt` | string | Pública | Data/hora do upload em ISO 8601 UTC. |
| `owner` | string | Pública | Identificador lógico recebido em `X-User-Id`. |
| `contentType` | string ou null | Pública | Tipo informado/detectado para definir o tipo da resposta de download. |
| `storageName` | string | Interna | Nome único gerado para localizar o arquivo no diretório local. |

O DTO público não inclui `storageName`, caminho absoluto nem qualquer informação do filesystem.

## 6. Contratos de API

Todas as respostas de erro usam o formato:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Descrição em português."
  }
}
```

### `POST /api/upload`

Cabeçalhos: `X-User-Id: <identificador>`.

Entrada: `multipart/form-data`, com exatamente um arquivo no campo `file`.

Sucesso: `201 Created`.

```json
{
  "document": {
    "id": "uuid",
    "originalName": "relatorio.pdf",
    "size": 12345,
    "uploadedAt": "2026-09-30T12:00:00.000Z",
    "owner": "usuario-1",
    "contentType": "application/pdf"
  }
}
```

Erros: `400` (`USER_ID_REQUIRED`, `FILE_REQUIRED`), `413` (`FILE_TOO_LARGE`) e `500` (`INTERNAL_ERROR`).

### `GET /api/documents`

Cabeçalhos: `X-User-Id: <identificador>`.

Sucesso: `200 OK`.

```json
{
  "documents": [
    {
      "id": "uuid",
      "originalName": "relatorio.pdf",
      "size": 12345,
      "uploadedAt": "2026-09-30T12:00:00.000Z",
      "owner": "usuario-1",
      "contentType": "application/pdf"
    }
  ]
}
```

Retorna lista vazia quando o usuário ainda não enviou documentos. Erros: `400` (`USER_ID_REQUIRED`) e `500` (`INTERNAL_ERROR`).

### `GET /api/documents/:id/download`

Cabeçalhos: `X-User-Id: <identificador>`.

Sucesso: `200 OK`, corpo binário, `Content-Type` conforme o documento (ou `application/octet-stream`), `Content-Length` e `Content-Disposition: attachment` com nome seguro para download.

Erros: `400` (`USER_ID_REQUIRED`), `404` (`DOCUMENT_NOT_FOUND`) quando ausente ou não pertencente ao usuário, e `500` (`INTERNAL_ERROR`).

## 7. Decisões arquiteturais e riscos

- Backend: dependências seguem `routes -> controllers -> services -> repositories`.
- Rotas conectam endpoints aos controllers; controllers validam entrada HTTP e formatam respostas; services aplicam regras de negócio; repositories acessam filesystem e metadados em memória.
- O repositório de documentos coordena o registro em memória com o arquivo local. Se o registro falhar após gravar o arquivo, deve tentar remover o arquivo para evitar órfãos.
- Multer usa `diskStorage` e limite de tamanho configurável. Tipos de arquivo permitidos não são restringidos nesta fase.
- O download verifica propriedade antes de abrir o arquivo. O nome interno é gerado pelo servidor e resolvido dentro do diretório configurado.
- Frontend: componentes funcionais React, organização existente em `components/`, `pages/` e `services/`.
- Risco: `X-User-Id` é controlado pelo cliente e não fornece autenticação. Não usar este MVP para proteger documentos sensíveis.
- Risco: reinício apaga os metadados em memória, embora os arquivos permaneçam no disco; arquivos sem metadados poderão ficar órfãos.
- Risco: a solução depende de filesystem local e de uma única instância do backend.

## 8. Plano de execução

As etapas abaixo são futuras; para esta solicitação, o único artefato previsto é este documento.

1. **Definir configuração e persistência.** Prever `backend/src/repositories/documentRepository.js` e configuração do armazenamento. Critérios: diretório local configurável, nome interno único, metadados em memória e limite de tamanho aplicado.
2. **Implementar regras de negócio.** Prever `backend/src/services/documentService.js`. Critérios: upload, listagem ordenada, associação ao proprietário e consulta de download com verificação de propriedade.
3. **Expor API e tratar erros.** Prever arquivos em `backend/src/routes/`, `controllers/` e middleware de erro, além de ajustes em `backend/src/app.js`. Critérios: contratos desta especificação, códigos HTTP consistentes, preservação de `/health` e ausência de caminhos internos nas respostas.
4. **Construir a interface.** Prever arquivos em `frontend/src/pages/`, `components/` e `services/`. Critérios: upload, listagem, download e estados de carregamento, vazio, sucesso e erro; chamadas via `/api`.
5. **Verificar integração e limites.** Prever testes em `backend/test/` e ajustes pontuais nos testes existentes. Critérios: cobertura dos fluxos de sucesso, entrada inválida, limite de tamanho, isolamento por proprietário, documento ausente e execução do build frontend.

## 9. Critérios de aceite

- Os três endpoints cumprem os contratos definidos e usam o identificador de usuário fornecido no cabeçalho.
- Uploads são gravados somente no armazenamento local configurado com `multer`/`diskStorage`.
- A listagem não retorna documentos de outro proprietário; downloads alheios e inexistentes retornam o mesmo `404`.
- Erros de entrada e limite de tamanho são tratados sem expor detalhes internos.
- O comportamento de perda de metadados após reinício está documentado e não é apresentado como persistência durável.
- O endpoint `/health` existente permanece funcional.
- Testes backend e build frontend passam após a implementação futura.
