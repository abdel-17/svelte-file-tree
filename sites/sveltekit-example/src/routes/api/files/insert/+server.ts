import { IntSchema } from "$lib/schema.js";
import { db, type FileInsert } from "$lib/server/database/index.js";
import { json } from "@sveltejs/kit";
import * as v from "valibot";
import type { RequestHandler } from "./$types.js";

const FileInsertSchema: v.GenericSchema<FileInsert> = v.union([
	v.object({
		type: v.literal("file"),
		name: v.string(),
	}),
	v.object({
		type: v.literal("folder"),
		name: v.string(),
		children: v.lazy(() => v.array(FileInsertSchema)),
	}),
]);

const InsertFilesBodySchema = v.object({
	parentId: v.nullable(IntSchema),
	start: IntSchema,
	inserted: v.array(FileInsertSchema),
});

export type InsertFilesBody = v.InferInput<typeof InsertFilesBodySchema>;

export const POST: RequestHandler = async ({ request }) => {
	const body = v.parse(InsertFilesBodySchema, await request.json());
	db.insertFiles(body);
	return json({ success: true });
};
