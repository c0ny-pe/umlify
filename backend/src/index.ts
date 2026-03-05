import express, { NextFunction, Request, Response } from "express";
import userRoutes from "./routes/userRoutes";
import diagramRoutes from "./routes/diagramRoutes";
import generatorRoutes from "./routes/generatorRoutes";

const app = express();

app.use(express.json());
app.use(express.static("dist"));

const requestLogger = (
    request: Request,
    _response: Response,
    next: NextFunction
) => {
    console.log("Method:", request.method);
    console.log("Path: ", request.path);
    console.log("Body: ", request.body);
    console.log("---");
    next();
};

app.use(requestLogger);

app.use("/api/users", userRoutes);
app.use("/api/diagrams", diagramRoutes);
app.use("/api/generator", generatorRoutes);

const unknownEndpoint = (_request: Request, response: Response) => {
    response.status(404).send({ error: "unknown endpoint" });
};

app.use(unknownEndpoint);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});