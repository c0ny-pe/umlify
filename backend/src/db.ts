import { Pool } from "pg";
import dotenv from "dotenv";
import pgTypes from "pg-types";

dotenv.config();

pgTypes.setTypeParser(1114, (value) => value);

// Production sets a single DATABASE_URL (same convention as node-pg-migrate and
// the other apps on the host). Dev keeps the discrete PG* variables.
const pool = process.env.DATABASE_URL
    ? new Pool({ connectionString: process.env.DATABASE_URL })
    : new Pool({
          host: process.env.PGHOST,
          user: process.env.PGUSER,
          password: process.env.PGPASSWORD,
          database: process.env.PGDATABASE,
          port: Number(process.env.PGPORT),
      });

export default pool;