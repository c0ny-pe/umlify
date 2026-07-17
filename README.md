# 💻 UMLify: UML Diagrams as Simple as Possible!
.
**UMLify** es una herramienta web diseñada para la creación, gestión y exportación de diagramas UML de manera intuitiva y eficiente. Este proyecto forma parte del desarrollo de memoria para la Universidad.

## 🚀 Tecnologías

El proyecto utiliza un stack moderno y escalable:

*   **Frontend**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/) (Migrado desde CRA para mejor rendimiento).
*   **Backend**: [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/) con **TypeScript**.
*   **Base de Datos**: [PostgreSQL](https://www.postgresql.org/) con almacenamiento **JSONB** para diagramas flexibles.
*   **Infraestructura**: [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/).
*   **Migraciones**: [node-pg-migrate](https://salsita.github.io/node-pg-migrate/).

## 🛠️ Estructura del Proyecto

El repositorio está organizado como un monorepo simplificado:

```text
.
├── backend/            # Servidor Express, API y modelos de datos
├── frontend/           # Aplicación React con Vite
├── docker-compose.yml  # Orquestación de servicios (Postgres)
└── README.md
```

## 🏁 Inicio Rápido

### Requisitos Previos

*   [Node.js](https://nodejs.org/) (v18+)
*   [Docker](https://www.docker.com/get-started) y Docker Compose

### Pasos para Ejecutar

El `Makefile` de la raíz orquesta todo (dependencias, Postgres en Docker, backend y frontend).

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/c0ny-pe/umlify.git
    cd umlify
    ```

2.  **Configurar credenciales del backend:**
    ```bash
    cp backend/.env.example backend/.env
    $EDITOR backend/.env   # PGPASSWORD (y JWT_SECRET) con valores reales
    ```

3.  **Instalar dependencias:**
    ```bash
    make setup   # npm install en backend/ y frontend/
    ```

4.  **Levantar todo (Postgres + backend + frontend):**
    ```bash
    make start   # docker compose (Postgres en :5434) + backend (:3001) + frontend (:5173)
    make logs    # tail de backend.log / frontend.log
    make stop    # apaga los procesos y docker compose
    ```

    También se puede levantar cada servicio por separado con `make start-db`, `make start-backend` y `make start-frontend`. Para aplicar migraciones manualmente: `cd backend && npm run migrate:up`.

## 📊 Base de Datos

El esquema incluye:
*   **Usuarios**: Sistema de cuentas simple (username/password).
*   **Diagramas**: Relacionados con usuarios, con guardado automático de timestamp (`updated_at`) mediante triggers de PL/pgSQL.
*   **JSONB**: El contenido de los diagramas se guarda en formato JSON binario, permitiendo que la aplicación evolucione sin necesidad de cambiar el esquema de la base de datos constantemente.

## 🧪 Testing

Dentro de `backend/src/requests.rest` se encuentran ejemplos listos para ser ejecutados con la extensión **REST Client** de VS Code para probar la API (Registro de usuarios, carga y listado de diagramas).
