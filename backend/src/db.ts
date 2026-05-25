import { Pool } from "pg";
import dotenv from "dotenv";
import pgTypes from "pg-types";

dotenv.config();

pgTypes.setTypeParser(1114, (value) => value);

const pool = new Pool({
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    port: Number(process.env.PGPORT),
});

export default pool;