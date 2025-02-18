import { IntSchema, TimestampSchema } from "$lib/schema.js";
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import * as v from "valibot";

export const readSQL = (filename: string): string => {
	const filepath = path.join(import.meta.dirname, "sql", filename);
	return fs.readFileSync(filepath, "utf-8");
};

export const DatabaseFileSchema = v.object({
	id: IntSchema,
	type: v.picklist(["file", "folder"]),
	name: v.string(),
	parent_id: v.nullable(IntSchema),
	index_in_parent: IntSchema,
	created_at: TimestampSchema,
	updated_at: TimestampSchema,
});

export const DatabaseFileArraySchema = v.array(DatabaseFileSchema);

export type DatabaseFile = v.InferOutput<typeof DatabaseFileSchema>;

export const createDatabase = (db: Database.Database) => {
	const statements = {
		insertFile: db.prepare(readSQL("insert-file.sql")),
		getFiles: db.prepare(readSQL("get-files.sql")),
		updateFileName: db.prepare(readSQL("update-file-name.sql")),
		updateFilePosition: db.prepare(readSQL("update-file-position.sql")),
		deleteFile: db.prepare(readSQL("delete-file.sql")),
	} as const;

	const insertFile = ({
		type,
		name,
		parent_id,
		index_in_parent,
	}: Pick<DatabaseFile, "type" | "name" | "parent_id" | "index_in_parent">): Database.RunResult =>
		statements.insertFile.run(type, name, parent_id, index_in_parent);

	const getFiles = (): Array<DatabaseFile> =>
		v.parse(DatabaseFileArraySchema, statements.getFiles.all());

	const updateFileName = ({ id, name }: Pick<DatabaseFile, "id" | "name">): Database.RunResult =>
		statements.updateFileName.run(name, id);

	const updateFilePosition = ({
		id,
		parent_id,
		index_in_parent,
	}: Pick<DatabaseFile, "id" | "parent_id" | "index_in_parent">): Database.RunResult =>
		statements.updateFilePosition.run(parent_id, index_in_parent, id);

	const deleteFile = (id: number): Database.RunResult => statements.deleteFile.run(id);

	const transaction = db.transaction.bind(db);

	return {
		insertFile,
		getFiles,
		updateFileName,
		updateFilePosition,
		deleteFile,
		transaction,
	};
};
