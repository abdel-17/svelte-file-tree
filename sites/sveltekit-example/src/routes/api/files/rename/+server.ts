import { DatabaseFileSchema, db } from "$lib/server/database/index.js";
import { maybeThrowError } from "$lib/utils.js";
import { json } from "@sveltejs/kit";
import * as v from "valibot";
import type { RequestHandler } from "./$types.js";

const RenameFileBodySchema = v.pick(DatabaseFileSchema, ["id", "name"]);

export type RenameFileBody = v.InferInput<typeof RenameFileBodySchema>;

export const POST: RequestHandler = async ({ request }) => {
	const body = v.parse(RenameFileBodySchema, await request.json());

	maybeThrowError();
	db.updateFileName(body);

	return json({ success: true });
};
