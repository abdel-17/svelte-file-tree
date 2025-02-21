import { IntSchema } from "$lib/schema.js";
import { db } from "$lib/server/database/index.js";
import { json } from "@sveltejs/kit";
import * as v from "valibot";
import type { RequestHandler } from "./$types.js";

const RenameFileBodySchema = v.object({
	id: IntSchema,
	name: v.string(),
});

export type RenameFileBody = v.InferInput<typeof RenameFileBodySchema>;

export const POST: RequestHandler = async ({ request }) => {
	const body = v.parse(RenameFileBodySchema, await request.json());
	db.renameFile(body);
	return json({ success: true });
};
