import pg from 'pg';
const {Pool} = pg;
import dotenv from 'dotenv';
dotenv.config();

let localPoolConfig = {
    user: 'postgres',
    password: '1234',
    host: 'localhost',
    port: 5432,
    database: 'testdb1'
};

const poolConfig = process.env.DATABASE_URL 
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : localPoolConfig;

const pool = new Pool(poolConfig);

export default pool;