# 💻 UMLify: UML Diagrams as Simple as Possible!

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

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/c0ny-pe/umlify.git
    cd umlify
    ```

2.  **Levantar la Base de Datos (Docker):**
    ```bash
    docker-compose up -d
    ```

3.  **Configurar y Ejecutar el Backend:**
    ```bash
    cd backend
    npm install
    npm run migrate:up  # Aplicar tablas iniciales
    npm run dev         # Iniciar en http://localhost:3001
    ```

4.  **Configurar y Ejecutar el Frontend:**
    ```bash
    cd ../frontend
    npm install
    npm run dev         # Iniciar en http://localhost:5173 (Vite)
    ```

## 📊 Base de Datos

El esquema incluye:
*   **Usuarios**: Sistema de cuentas simple (username/password).
*   **Diagramas**: Relacionados con usuarios, con guardado automático de timestamp (`updated_at`) mediante triggers de PL/pgSQL.
*   **JSONB**: El contenido de los diagramas se guarda en formato JSON binario, permitiendo que la aplicación evolucione sin necesidad de cambiar el esquema de la base de datos constantemente.

## 🧪 Testing

Dentro de `backend/src/requests.rest` se encuentran ejemplos listos para ser ejecutados con la extensión **REST Client** de VS Code para probar la API (Registro de usuarios, carga y listado de diagramas).
