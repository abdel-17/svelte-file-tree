import { db, updateFileName, UpdateFileNameSchema } from "$lib/server/database.js";
import { artificialDelay, maybeThrowError } from "$lib/utils.js";
import { json } from "@sveltejs/kit";
import * as v from "valibot";
import type { RequestHandler } from "./$types.js";

const UpdateFileNamesBodySchema = v.array(UpdateFileNameSchema);

export type UpdateFileNamesBody = v.InferInput<typeof UpdateFileNamesBodySchema>;

const updateFileNames = db.transaction((body: UpdateFileNamesBody): void => {
	body.forEach(updateFileName);
});

export const POST: RequestHandler = async ({ request }) => {
	const body = v.parse(UpdateFileNamesBodySchema, await request.json());

	await artificialDelay();
	maybeThrowError();
	updateFileNames(body);

	return json({ success: true });
};
