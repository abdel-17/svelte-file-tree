import { IntSchema } from "$lib/schema.js";
import { db } from "$lib/server/database/index.js";
import { json } from "@sveltejs/kit";
import * as v from "valibot";
import type { RequestHandler } from "./$types.js";

const DeleteFilesBodySchema = v.array(IntSchema);

export type DeleteFilesBody = v.InferInput<typeof DeleteFilesBodySchema>;

export const POST: RequestHandler = async ({ request }) => {
	const body = v.parse(DeleteFilesBodySchema, await request.json());
	db.deleteFiles(body);
	return json({ success: true });
};
