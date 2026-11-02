# REST API Specification - RepoMentor

---

## 1. Overview & Base URL

All endpoints conform to RESTful design principles and output standard JSON payloads. All non-streaming requests and responses are validated via Zod schemas and documented interactively via OpenAPI 3.1 (`/docs`).

- **Base URL**: `http://localhost:4000/api/v1`
- **Global Error Format**: RFC 7807 Problem Details
- **Auth**: JWT via `Authorization: Bearer <token>` (validated with `jose`). Optional in dev mode.

---

## 2. Health & System Endpoints

### 2.1 Liveness Probe
- **Method**: `GET /health`
- **Response `200 OK`**:
  ```json
  { "status": "ok", "timestamp": "2026-11-02T12:00:00.000Z", "uptime": 142.5 }
  ```

### 2.2 Readiness Probe
- **Method**: `GET /ready`
- **Response `200 OK`**:
  ```json
  { "status": "ready", "services": { "database": "connected", "redis": "connected" }, "timestamp": "..." }
  ```

---

## 3. Repository Management

### 3.1 Submit Repository — `POST /api/v1/repos`
- **Body**: `{ "url": "https://github.com/owner/repo", "branch": "main" }`
- **Validation**: URL must be `https://github.com/...` (SSRF-safe via Zod + `parseGitHubUrl`).
- **Response `202`**: `{ "repoId": "<uuid>", "jobId": "<uuid>", "status": "queued", "message": "..." }`

### 3.2 List Repositories — `GET /api/v1/repos`
- **Response `200`**: Array of `RepoResponse` objects.

### 3.3 Get Repository — `GET /api/v1/repos/:id`
- **Response `200`**: Single `RepoResponse` with languages, status, commit SHA.

### 3.4 Get Onboarding Report — `GET /api/v1/repos/:id/overview`
- **Response `200`**: `{ "repoId", "version", "generatedAt", "sections": RepoOverviewSections }`
- Sections include: summary, purpose, techStack, architecture (with Mermaid), folderStructure, setupGuide, keyFiles, contributionWorkflow, codeConventions, commonPitfalls, goodFirstAreas.

### 3.5 Stream Indexing Status (SSE) — `GET /api/v1/repos/:id/status`
- **Response**: `text/event-stream` with `event: status` payloads containing `{ repoId, status, progress, currentStep }`.

### 3.6 Trigger Re-Index — `POST /api/v1/repos/:id/refresh`
- **Response `202`**: New job queued for incremental re-indexing via commit diff.

### 3.7 Delete Repository — `DELETE /api/v1/repos/:id`
- **Response `200`**: `{ "success": true, "message": "..." }` — cascades to files, chunks, memories.

### 3.8 List Files — `GET /api/v1/repos/:id/files`
- **Response `200`**: Array of `{ id, path, language, size }`.

### 3.9 View File Content — `GET /api/v1/repos/:id/files/:fileId`
- **Query**: `?startLine=10&endLine=50` (optional)
- **Response `200`**: `{ id, path, language, size, content, startLine, endLine }`

---

## 4. Indexing Jobs

### 4.1 Get Job Status — `GET /api/v1/jobs/:id`
- **Response `200`**: `{ id, repoId, status, progress, currentStep, error, startedAt, completedAt }`

---

## 5. RAG Chat

### 5.1 Send Chat Message (SSE) — `POST /api/v1/repos/:id/chat`
- **Body**: `{ "content": "Where is useState defined?", "questionType": "where_is_implemented" }`
- **Question Types**: `explain_code`, `how_to_run`, `where_is_implemented`, `add_feature`, `general`
- **Response**: `text/event-stream`
  ```
  event: intent
  data: {"intent":"where_is_implemented","standaloneQuery":"Where is useState defined?"}

  event: token
  data: {"token":"The "}

  event: citation
  data: {"filePath":"src/hooks.ts","startLine":25,"endLine":50,...}

  event: done
  data: {"conversationId":"<uuid>"}
  ```

### 5.2 Get Conversation Messages — `GET /api/v1/conversations/:id/messages`
- **Response `200`**: Array of `{ id, conversationId, role, content, citations[], createdAt }`.

---

## 6. Enhancement Assistant

### 6.1 Generate Enhancement Plan — `POST /api/v1/repos/:id/enhancement`
- **Body**: `{ "request": "Add support for telemetry in server actions" }`
- **Response `200`**: `EnhancementPlan` with `title`, `affectedFiles`, `stepByStepPlan`, `testStrategy`, `diffSuggestions`.

---

## 7. Memory Management

### 7.1 List Memory Records — `GET /api/v1/repos/:id/memory`
- **Response `200`**: Array of `{ id, userId, repoId, type, summary, metadata, createdAt, updatedAt }`.
- **Types**: `short_term`, `repo_state`, `long_term_summary`, `preference`, `decision`, `enhancement_idea`.

### 7.2 Update Memory — `PATCH /api/v1/repos/:id/memory/:memoryId`
- **Body**: `{ "summary": "Updated summary text" }`
- **Response `200`**: Updated memory record.

### 7.3 Delete Memory — `DELETE /api/v1/repos/:id/memory/:memoryId`
- **Response `200`**: `{ "success": true, "message": "..." }`
