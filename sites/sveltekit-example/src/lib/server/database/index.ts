import { createDatabase } from "./utils.js";

export const db = createDatabase(":memory:");

export type { FileSelect, FileInsert } from "./utils.js";
