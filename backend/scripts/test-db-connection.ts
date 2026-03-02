import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool();

(async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Conexión exitosa:', res.rows[0]);
  } catch (err) {
    console.error('Error de conexión:', err);
  } finally {
    await pool.end();
  }
})();
