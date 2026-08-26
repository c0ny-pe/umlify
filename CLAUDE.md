# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

UMLify is a web tool for creating UML class diagrams and generating Scala source code from them. Monorepo with two independent npm packages: `backend/` (Express + TypeScript + PostgreSQL) and `frontend/` (React + Vite + TypeScript). The UI is documented in Spanish; match the existing language of comments and user-facing strings in the file you are editing.

## Commands

From the repo root, the `Makefile` orchestrates everything:

- `make setup` — install backend and frontend deps
- `make start` — start Postgres (docker), backend, and frontend together; logs go to `backend.log` / `frontend.log`, PIDs to `.backend.pid` / `.frontend.pid`
- `make stop` — kill dev processes and `docker compose down`
- `make logs` — tail both log files

The Makefile expects Postgres on `localhost:5434` and reads `backend/.env` (`PGUSER`, `PGPASSWORD`, `PGDATABASE`); `PGPASSWORD` is required.

Backend (`cd backend`):
- `npm run dev` — ts-node-dev on port 3001
- `npm run build` / `npm start` — compile to `dist/` then run node
- `npm test` — Jest (ts-jest). Run one file: `npm test -- generator.test.ts`. Run by name: `npm test -- -t "trait"`
- `npm run migrate:up` / `npm run migrate:down` — node-pg-migrate against `DATABASE_URL`
- `npm run build:ui` — build the frontend and copy its `dist/` into the backend (the backend serves `dist/` as static files in production)

Frontend (`cd frontend`):
- `npm run dev` — Vite dev server on 5173; proxies `/api` to `VITE_API_TARGET` (default `http://localhost:3001`)
- `npm test` — Vitest (jsdom). One file: `npm test -- scalaFieldType.test.ts`
- `npm run lint` — ESLint
- `npm run build` — production build

## Architecture

### The diagram is the single source of truth

A diagram serializes to one JSON object: `{ nodes, edges, viewport }`. This shape is the contract between frontend, backend, database, and the code generator. It is validated by a Zod schema (`diagramPayloadSchema`) that is **duplicated** in both `backend/src/schemas/diagramSchemas.ts` and `frontend/src/schemas/diagramSchemas.ts` — keep the two in sync when changing the diagram shape. The schema is the authority for the node/edge type unions (`classType`: `concreteClass` | `abstractClass` | `trait`; relation `type`: `aggregation` | `association` | `composition` | `dependency` | `implementation` | `inheritance`). The editor exposes four handles per node side, one per drawable relation (association, inheritance/implementation, aggregation, composition); `dependency` stays in the contract but has no dedicated handle.

Diagram content is stored in Postgres as a `JSONB` column, so the DB schema rarely changes when the diagram shape evolves.

### Backend request flow

`app.ts` wires middleware (helmet, cors, json, cookie-parser, static `dist/`, request logger) then mounts three routers under `/api/users`, `/api/diagrams`, `/api/generator`. Every route is `requireAuth` except register/login/logout. The consistent pattern per route is:

`route → requireAuth → validateBody(zodSchema) → controller → model`

- `middlewares/validate.ts` — `validateBody` / `validateParams` run a Zod schema and **replace** `req.body` / `req.params` with the parsed (coerced, trimmed) data; on failure returns 400 with formatted issues.
- `schemas/requestSchemas.ts` — composes request schemas, importing `diagramPayloadSchema` for upload/update/generate bodies.
- `models/*.ts` — thin functions running parameterized `pool.query` against Postgres; no ORM. `models/diagram.ts` generates UUIDs in app code (`randomUUID()`).
- `utils/auth.ts` — `signAccessToken` / `verifyAccessToken`; `JWT_SECRET` is set in `.env` (falls back to `dev_secret` if unset). `middlewares/auth.ts` reads the JWT from an `HttpOnly` cookie (not a bearer header), checks the `csrf` claim against the `X-CSRF-Token` request header, and attaches the decoded `id` as `req.userId` (typed via a `declare global` augmentation in that same file).

### Scala code generator (backend)

The generator is a two-stage pipeline, kept separate from HTTP concerns. `POST /api/generator` → `controllers/generatorController.ts`:

1. `generator/parser.ts` — `parseDiagram` strips layout fields (`x`, `y`, handles) to produce the intermediate `DiagramModel` (`{ classes, relations }`).
2. `generator/generator.ts` — `generateScalaCode` builds a `relationsMap` (`createRelationsMap`) that interprets each edge into Scala semantics, then emits a `trait` / `class` / `abstract class` per node.

Key generator rules to preserve when editing:
- `inheritance` → `extends`; `implementation` on a trait target → `with`, on a class target → `extends`.
- `association`/`dependency`/`aggregation`/`composition` → a `val x: X = ???` field. These synthesized fields are **suppressed if the user already declared a matching field manually** (`hasManualAssociationField` / `hasManualAggregationField` / `hasManualCompositionField`).
- Concrete methods get ` = ???`; `abstract` methods emit signature only. Method params come from `domType` (positional `param1, param2, …`), return type from `codType` (defaults to `Unit`).
- A method whose name equals its class name is a **constructor** (`splitConstructors`): the first one defines the class header instead of the fields, which then move into the body as `val x: T = ???`; the rest emit as `def this(…) = this(???, …)`. Without a constructor operation the old convention holds (fields become the constructor params).

Types in `types/generator.ts` are **derived from the Zod schema** via `z.infer` + `Omit`, so the generator's `Class`/`Relation` stay tied to the validated payload.

### Scala importer (backend)

The inverse of the generator, also HTTP-agnostic. `POST /api/importer` with `{ code }` → `controllers/importerController.ts`:

1. `importer/scalaParser.ts` — `parseScalaSource` is a hand-written declaration-level parser (no Scala grammar dependency exists in npm that is worth its weight here). It masks comments and literals, then walks statements skipping method bodies by brace balancing. It returns `ScalaTypeDecl[]` (kind, name, fields, methods, parents).
2. `importer/diagramBuilder.ts` — `buildDiagramFromScala` turns those declarations into the same `{ nodes, edges }` payload the editor consumes, and the controller re-validates it with `diagramPayloadSchema` before responding.

Rules the importer preserves:
- `trait` / `abstract class` / `class` map to the three `classType` values; a `def` without `=` or `{` is `abstract: true`.
- Only constructor params carrying `val`/`var` (or any param of a `case class`) are state and become fields; a plain param signs the constructor and nothing else. `val`/`var` members of the body are fields too, with type inference when the annotation is missing — the primary constructor params stay in scope for that inference (`constructorScope`).
- Every constructor, primary and each `def this(…)`, becomes an operation named after the class (`CuentaAhorro(String, Int)`). `NodeMethods` renders a method whose name equals its class without a return type.
- Parents resolve to `implementation` when the target is a trait and `inheritance` otherwise, mirroring the frontend double dispatch. Only the first class parent becomes an inheritance edge. Parents not present in the pasted code are ignored.
- A field typed as a known class emits an `association` edge; `List[X]` and friends emit `aggregation`.
- Edge handle ids encode the relation: `-1` association, `-2` inheritance/implementation, `-3` aggregation.
- A method with no declared return type inherits it from the method it overrides; unknown types are emitted as `""` (the editor and the generator both render that as `Unit`). Scala 3 indentation-based bodies are not supported: declarations need braces.

Frontend side: `components/ImportScalaButton.tsx` posts the pasted code and `App.tsx` hydrates the response with `parseAndHydrateDiagram`, then runs Dagre.

### Frontend model layer (OOP + double dispatch)

`frontend/src/model/` is a class hierarchy, not plain data. `UMLAbstractClass` is the base; `Trait`, `AbstractClass`, `ConcreteClass` are concrete subclasses. Edge type between two nodes is resolved by **double dispatch**: `source.getEdgeType(target)` calls `target.<sourceKind>EdgeType(source)`. To change which relations are legal between two node kinds, edit the `traitEdgeType` / `abstractClassEdgeType` / `concreteClassEdgeType` methods on each model class — not a central table.

### Frontend app structure

- `App.tsx` is large and holds the editor: `AppContent` owns global state and React Router routes; `EditorScreen` renders the `@xyflow/react` (React Flow) canvas. Routes: `/` (Library), `/editor` and `/editor/:diagramId`, `/login`, `/signup`, `/settings`. All editor/library routes redirect to `/login` when unauthenticated.
- `services/api.ts` — axios instance for the `/api` backend.
- State is shared via React context providers: `hooks/useGlobalContext`, `hooks/useAuth`, `hooks/useTheme`, and `components/editorCanvasContext` (canvas-specific: node edit mode, unique-name helpers).
- `components/editorTypes.tsx` — registers the React Flow `nodeTypes` (all three class kinds render through one `StyledNode`) and `edgeTypes` (one component per relation under `components/edges/`).
- `utils/diagramHydration.ts` — `hydrateDiagramData` validates a saved payload and rebuilds the model class instances + React Flow edges (the inverse of `buildDiagramPayload` in `App.tsx`). `utils/autoLayout.ts` runs Dagre auto-layout.
- Export: `ExportScalaButton` posts the diagram to `/api/generator`; `ExportPNGButton` / `ExportSVGButton` use `html-to-image`; Scala syntax highlighting via `shiki`.

## Database

Postgres 16, managed with `node-pg-migrate` (migrations in `backend/migrations/`). Tables: `users` (id, username, password as bcrypt hash) and `diagrams` (UUID id, user_id FK, name, `content` JSONB, timestamps). `updated_at` is maintained by a PL/pgSQL trigger. `db.ts` overrides the pg type parser for OID 1114 (timestamp) to return raw strings.
