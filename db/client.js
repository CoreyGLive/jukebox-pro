import "dotenv/config";
import pg from "pg";
const db = new pg.Client(process.env.DATABASE_URL);
console.log("DATABASE_URL:", process.env.DATABASE_URL);
export default db;
