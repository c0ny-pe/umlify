SHELL := /bin/bash

.PHONY: help setup start-db start-backend start-frontend start stop logs

help:
	@echo "Makefile targets:"
	@echo "  setup            Install frontend and backend dependencies"
	@echo "  start-db         Start postgres container via docker compose"
	@echo "  start-backend    Start backend (dev) connecting to Postgres on localhost:5434"
	@echo "  start-frontend   Start frontend (vite) with VITE_API_TARGET pointing to backend"
	@echo "  start            start-db + start-backend + start-frontend"
	@echo "  stop             stop backend/frontend dev processes and bring down docker compose"
	@echo "  logs             tail backend/frontend logs"

setup:
	@echo "Installing backend dependencies..."
	cd backend && npm install
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

start-db:
	@echo "Starting Postgres container (docker compose)..."
	docker compose up -d postgres
	@echo "Waiting for Postgres to accept connections on localhost:5434..."
	@sleep 2

# Start backend in background with environment variables pointing to postgres on localhost:5434
start-backend:
	@echo "Starting backend (dev) with PG on localhost:5434..."
	@if [ -f backend/.env ]; then set -a; . backend/.env; set +a; fi; \
	: "$${PGUSER:=umlifyuser}"; \
	: "$${PGDATABASE:=umlifydb}"; \
	: "$${PGPASSWORD:?PGPASSWORD is required; set it in backend/.env or your shell}"; \
	PGHOST=localhost PGPORT=5434 PORT=3001 \
	DATABASE_URL="postgres://$${PGUSER}:$${PGPASSWORD}@localhost:5434/$${PGDATABASE}" \
	npm --prefix backend run dev > backend.log 2>&1 & echo $$! > .backend.pid
	@echo "Backend PID: $$(cat .backend.pid)"

# Start frontend in background with VITE_API_TARGET pointing to backend
start-frontend:
	@echo "Starting frontend (vite) on http://localhost:5173, using backend API at http://localhost:3001..."
	VITE_API_TARGET=http://localhost:3001 npm --prefix frontend run dev > frontend.log 2>&1 & echo $$! > .frontend.pid
	@echo "Frontend PID: $$(cat .frontend.pid)"

start: start-db setup start-backend start-frontend

stop:
	@echo "Stopping local backend/frontend dev processes..."
	@if [ -f .backend.pid ]; then kill $$(cat .backend.pid) || true; rm .backend.pid; fi
	@if [ -f .frontend.pid ]; then kill $$(cat .frontend.pid) || true; rm .frontend.pid; fi
	@echo "Bringing down docker compose (containers)..."
	docker compose down

logs:
	@echo "Tailing backend.log and frontend.log (press ctrl-c to stop)"
	tail -n +1 -f backend.log frontend.log
