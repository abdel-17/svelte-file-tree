import { IntSchema } from "$lib/schema.js";
import {
	db,
	deleteFile,
	updateFilePosition,
	UpdateFilePositionSchema,
} from "$lib/server/database.js";
import { artificialDelay, maybeThrowError } from "$lib/utils.js";
import { json } from "@sveltejs/kit";
import * as v from "valibot";
import type { RequestHandler } from "./$types.js";

const DeleteFilesBodySchema = v.object({
	deleted: v.array(IntSchema),
	reorders: v.array(UpdateFilePositionSchema),
});

export type DeleteFilesBody = v.InferInput<typeof DeleteFilesBodySchema>;

const deleteFiles = db.transaction((body: DeleteFilesBody): void => {
	body.deleted.forEach(deleteFile);
	body.reorders.forEach(updateFilePosition);
});

export const POST: RequestHandler = async ({ request }) => {
	const body = v.parse(DeleteFilesBodySchema, await request.json());

	await artificialDelay();
	maybeThrowError();
	deleteFiles(body);

	return json({ success: true });
};
