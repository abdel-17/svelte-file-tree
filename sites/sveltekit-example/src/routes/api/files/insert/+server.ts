import { DatabaseFileSchema, db } from "$lib/server/database/index.js";
import { maybeThrowError } from "$lib/utils.js";
import { json } from "@sveltejs/kit";
import * as v from "valibot";
import type { RequestHandler } from "./$types.js";

const InsertFilesBodySchema = v.object({
	inserted: v.array(v.pick(DatabaseFileSchema, ["type", "name", "parent_id", "index_in_parent"])),
	new_positions: v.array(v.pick(DatabaseFileSchema, ["id", "parent_id", "index_in_parent"])),
});

export type InsertFilesBody = v.InferInput<typeof InsertFilesBodySchema>;

const insertFiles = db.transaction((body: InsertFilesBody): void => {
	body.new_positions.forEach(db.updateFilePosition);
	body.inserted.forEach(db.insertFile);
});

export const POST: RequestHandler = async ({ request }) => {
	const body = v.parse(InsertFilesBodySchema, await request.json());

	maybeThrowError();
	insertFiles(body);

	return json({ success: true });
};
