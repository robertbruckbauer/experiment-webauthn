# Full-Stack Scaffold: Spring Boot + React

## Prerequisites
- Java 25
- Node.js 24
- pnpm (via `corepack enable`)
- Docker + Docker Compose (optional)

## Repository structure
```
.
├── backend/
├── frontend/
├── compose.yml
└── README.md
```

## Backend commands
From `/tmp/workspace/robertbruckbauer/experiment-webauthn/backend`:
- `./gradlew bootRun`
- `./gradlew test`
- `./gradlew build`

Health/hello endpoint:
- `GET http://localhost:8080/api/hello`

## Frontend commands
From `/tmp/workspace/robertbruckbauer/experiment-webauthn/frontend`:
- `pnpm install`
- `pnpm dev`
- `pnpm test`
- `pnpm lint`
- `pnpm build`

The Vite dev server proxies `/api` requests to `http://localhost:8080`.

## Docker Compose commands
From `/tmp/workspace/robertbruckbauer/experiment-webauthn`:
- `docker compose up`
- `docker compose down`

## Running tests
- Backend: `cd backend && ./gradlew test`
- Frontend unit tests: `cd frontend && pnpm test`
- Frontend browser tests: `cd frontend && pnpm test:e2e`

## Building production artifacts
- Backend: `cd backend && ./gradlew build`
- Frontend: `cd frontend && pnpm build`
