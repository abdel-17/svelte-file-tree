import { db } from "$lib/server/database/index.js";
import type { PageServerLoad } from "./$types.js";
import { FILES_DEPENDENCY } from "./shared.js";

export const load: PageServerLoad = (event) => {
	event.depends(FILES_DEPENDENCY);
	const files = db.getFiles();
	return { files };
};
