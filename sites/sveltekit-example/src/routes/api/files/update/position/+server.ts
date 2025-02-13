import { db, updateFilePosition, UpdateFilePositionSchema } from "$lib/server/database.js";
import { artificialDelay, maybeThrowError } from "$lib/utils.js";
import { json } from "@sveltejs/kit";
import * as v from "valibot";
import type { RequestHandler } from "./$types.js";

const UpdateFilePositionsBodySchema = v.array(UpdateFilePositionSchema);

export type UpdateFilePositionsBody = v.InferInput<typeof UpdateFilePositionsBodySchema>;

const updateFilePositions = db.transaction((body: UpdateFilePositionsBody): void => {
	body.forEach(updateFilePosition);
});

export const POST: RequestHandler = async ({ request }) => {
	const body = v.parse(UpdateFilePositionsBodySchema, await request.json());

	await artificialDelay();
	maybeThrowError();
	updateFilePositions(body);

	return json({ success: true });
};
