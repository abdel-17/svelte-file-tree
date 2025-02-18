import { DatabaseFileSchema, db } from "$lib/server/database/index.js";
import { maybeThrowError } from "$lib/utils.js";
import { json } from "@sveltejs/kit";
import * as v from "valibot";
import type { RequestHandler } from "./$types.js";

const MoveFilesBodySchema = v.object({
	new_positions: v.array(v.pick(DatabaseFileSchema, ["id", "parent_id", "index_in_parent"])),
});

export type MoveFilesBody = v.InferInput<typeof MoveFilesBodySchema>;

const moveFiles = db.transaction((body: MoveFilesBody): void => {
	body.new_positions.forEach(db.updateFilePosition);
});

export const POST: RequestHandler = async ({ request }) => {
	const body = v.parse(MoveFilesBodySchema, await request.json());

	maybeThrowError();
	moveFiles(body);

	return json({ success: true });
};
