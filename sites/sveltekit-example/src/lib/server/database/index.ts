import Database from "better-sqlite3";
import { createDatabase, DatabaseFileSchema, readSQL, type DatabaseFile } from "./utils.js";

const _db = new Database(":memory:");
_db.exec(readSQL("schema.sql"));
export const db = createDatabase(_db);

export { DatabaseFileSchema, type DatabaseFile };
