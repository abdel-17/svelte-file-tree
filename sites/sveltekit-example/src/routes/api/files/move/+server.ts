import { IntSchema } from "$lib/schema.js";
import { db } from "$lib/server/database/index.js";
import { json } from "@sveltejs/kit";
import * as v from "valibot";
import type { RequestHandler } from "./$types.js";

const MoveFilesBodySchema = v.array(
	v.object({
		id: IntSchema,
		parentId: v.nullable(IntSchema),
		index: IntSchema,
	}),
);

export type MoveFilesBody = v.InferInput<typeof MoveFilesBodySchema>;

export const POST: RequestHandler = async ({ request }) => {
	const body = v.parse(MoveFilesBodySchema, await request.json());
	db.moveFiles(body);
	return json({ success: true });
};
