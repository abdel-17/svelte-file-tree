import Database from "better-sqlite3";
import * as v from "valibot";
import { IntSchema, TimestampSchema } from "../schema.js";

export const db = new Database(":memory:");
db.exec(`
    CREATE TABLE IF NOT EXISTS files (
        id INTEGER NOT NULL PRIMARY KEY,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        parent_id INTEGER,
        index_in_parent INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
`);

export const FileSchema = v.object({
	id: IntSchema,
	type: v.picklist(["file", "folder"]),
	name: v.string(),
	parent_id: v.nullable(IntSchema),
	index_in_parent: IntSchema,
	created_at: TimestampSchema,
	updated_at: TimestampSchema,
});

export const FileArraySchema = v.array(FileSchema);

export type File = v.InferOutput<typeof FileSchema>;

const getFilesQuery = db.prepare("SELECT * FROM files");

export const getFiles = (): Array<File> => v.parse(FileArraySchema, getFilesQuery.all());

export const InsertFileSchema = v.pick(FileSchema, [
	"type",
	"name",
	"parent_id",
	"index_in_parent",
]);

export type InsertFile = v.InferInput<typeof InsertFileSchema>;

const insertFileQuery = db.prepare(`
    INSERT INTO files (type, name, parent_id, index_in_parent)
    VALUES (?, ?, ?, ?)
`);

export const insertFile = (file: InsertFile): void => {
	insertFileQuery.run(file.type, file.name, file.parent_id, file.index_in_parent);
};

export const UpdateFileNameSchema = v.pick(FileSchema, ["id", "name"]);

export type UpdateFileName = v.InferInput<typeof UpdateFileNameSchema>;

const updateFileNameQuery = db.prepare(`
    UPDATE files
    SET name = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
`);

export const updateFileName = (file: UpdateFileName): void => {
	updateFileNameQuery.run(file.name, file.id);
};

export const UpdateFilePositionSchema = v.pick(FileSchema, ["id", "parent_id", "index_in_parent"]);

export type UpdateFilePosition = v.InferInput<typeof UpdateFilePositionSchema>;

const updateFilePositionQuery = db.prepare(`
    UPDATE files
    SET parent_id = ?, index_in_parent = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
`);

export const updateFilePosition = (file: UpdateFilePosition): void => {
	updateFilePositionQuery.run(file.parent_id, file.index_in_parent, file.id);
};

const deleteFileQuery = db.prepare(`
    DELETE FROM files
    WHERE id = ?
`);

export const deleteFile = (id: File["id"]): void => {
	deleteFileQuery.run(id);
};
