import {
	db,
	insertFile,
	InsertFileSchema,
	updateFilePosition,
	UpdateFilePositionSchema,
} from "$lib/server/database.js";
import { artificialDelay, maybeThrowError } from "$lib/utils.js";
import { json } from "@sveltejs/kit";
import * as v from "valibot";
import type { RequestHandler } from "./$types.js";

const InsertFilesBodySchema = v.object({
	inserted: v.array(InsertFileSchema),
	reorders: v.array(UpdateFilePositionSchema),
});

export type InsertFilesBody = v.InferInput<typeof InsertFilesBodySchema>;

const insertFiles = db.transaction((body: InsertFilesBody): void => {
	body.inserted.forEach(insertFile);
	body.reorders.forEach(updateFilePosition);
});

export const POST: RequestHandler = async ({ request }) => {
	const body = v.parse(InsertFilesBodySchema, await request.json());

	await artificialDelay();
	maybeThrowError();
	insertFiles(body);

	return json({ success: true });
};
