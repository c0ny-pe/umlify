# Dockerfile for backend (Node.js + TypeScript)
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3001

# Run migrations and start the server
CMD ["sh", "-c", "npx node-pg-migrate up && npm start"]
