import express, { NextFunction, Request, Response } from "express";
import path from "path";
import fs from "fs";
import helmetConfig from "./config/helmet";
import corsMiddleware from "./config/cors";
import userRoutes from "./routes/userRoutes";
import diagramRoutes from "./routes/diagramRoutes";
import generatorRoutes from "./routes/generatorRoutes";

const app = express();

// Base path the app is served under behind the reverse proxy (e.g. "/umlify").
// The DCC proxy preserves the prefix, so requests arrive as "/umlify/api/...".
// Empty by default so local dev keeps serving at the root.
const BASE_PATH = (process.env.BASE_PATH || "").replace(/\/$/, "");

// Built frontend served by this same process in production. Defaults to
// ../frontend/dist relative to the compiled server (backend/dist/app.js).
const STATIC_DIR = process.env.STATIC_DIR
    ? path.resolve(process.env.STATIC_DIR)
    : path.resolve(__dirname, "../../frontend/dist");
const INDEX_HTML = path.join(STATIC_DIR, "index.html");
const hasBuild = fs.existsSync(INDEX_HTML);

app.use(helmetConfig);
app.use(corsMiddleware);
app.use(express.json());

const requestLogger = (
    request: Request,
    _response: Response,
    next: NextFunction
) => {
    // Only log API traffic; static asset requests would flood production logs.
    if (request.path.startsWith(`${BASE_PATH}/api`)) {
        console.log("Method:", request.method);
        console.log("Path: ", request.path);
        console.log("Body: ", request.body);
        console.log("---");
    }
    next();
};

app.use(requestLogger);

app.use(`${BASE_PATH}/api/users`, userRoutes);
app.use(`${BASE_PATH}/api/diagrams`, diagramRoutes);
app.use(`${BASE_PATH}/api/generator`, generatorRoutes);

// Serve the built SPA (production). Assets are referenced under BASE_PATH
// because the frontend is built with Vite `base` set to "<BASE_PATH>/".
if (hasBuild) {
    app.use(BASE_PATH || "/", express.static(STATIC_DIR));
}

// Final handler: SPA fallback for client-side routes, JSON 404 otherwise.
app.use((request: Request, response: Response) => {
    const underBase = !BASE_PATH || request.path.startsWith(BASE_PATH);
    const isApi = request.path.startsWith(`${BASE_PATH}/api`);

    if (hasBuild && request.method === "GET" && underBase && !isApi) {
        response.sendFile(INDEX_HTML);
        return;
    }

    response.status(404).send({ error: "unknown endpoint" });
});

export default app;
