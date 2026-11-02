.PHONY: help install dev build test lint typecheck format docker-up docker-down db-generate db-migrate db-seed clean

help:
	@echo "RepoMentor Development Commands:"
	@echo "  make install       - Install all monorepo dependencies"
	@echo "  make dev           - Start full dev stack (API, Web, Worker)"
	@echo "  make build         - Build all applications and packages"
	@echo "  make test          - Run Vitest unit & integration test suites"
	@echo "  make lint          - Run ESLint checks"
	@echo "  make typecheck     - Run strict TypeScript typecheck"
	@echo "  make format        - Run Prettier to format codebase"
	@echo "  make docker-up     - Start Postgres (pgvector) and Redis containers"
	@echo "  make docker-down   - Stop dev containers"
	@echo "  make db-generate   - Generate Drizzle migrations from schema"
	@echo "  make db-migrate    - Apply pending database migrations"
	@echo "  make db-seed       - Seed baseline database data"
	@echo "  make clean         - Remove build artifacts and node_modules"

install:
	pnpm install

dev:
	pnpm dev

build:
	pnpm build

test:
	pnpm test

lint:
	pnpm lint

typecheck:
	pnpm typecheck

format:
	pnpm format

docker-up:
	docker-compose up -d postgres redis

docker-down:
	docker-compose down

db-generate:
	pnpm --filter @repomentor/db db:generate

db-migrate:
	pnpm --filter @repomentor/db db:migrate

db-seed:
	pnpm --filter @repomentor/db db:seed

clean:
	pnpm clean

