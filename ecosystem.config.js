// pm2 process definition for the cc3002 deploy.
// The Express backend serves both the API and the built React SPA under /umlify.
// Secrets (DATABASE_URL, JWT_SECRET) live in backend/.env, not here.
module.exports = {
  apps: [
    {
      name: "umlify",
      cwd: "./backend",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 8009,
        BASE_PATH: "/umlify",
      },
      env_development: {
        NODE_ENV: "development",
        PORT: 3001,
        BASE_PATH: "",
      },
    },
  ],
};
