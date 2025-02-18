import { db } from "$lib/server/database/index.js";
import type { PageServerLoad } from "./$types.js";
import { FILES_DEPENDENCY } from "./shared.js";

export type FileMetadata = {
	id: number;
	type: "file" | "folder";
	name: string;
	parentId: number | null;
	index: number;
	createdAt: Date;
	updatedAt: Date;
	children: FileMetadata[];
};

export const load: PageServerLoad = async (event) => {
	event.depends(FILES_DEPENDENCY);
	const dbFiles = db.getFiles();

	const lookup = new Map<number, FileMetadata>();
	for (const dbFile of dbFiles) {
		lookup.set(dbFile.id, {
			id: dbFile.id,
			type: dbFile.type,
			name: dbFile.name,
			parentId: dbFile.parent_id,
			index: dbFile.index_in_parent,
			createdAt: dbFile.created_at,
			updatedAt: dbFile.updated_at,
			children: [],
		});
	}

	const files: FileMetadata[] = [];
	for (const file of lookup.values()) {
		if (file.parentId === null) {
			files.push(file);
			continue;
		}

		const parent = lookup.get(file.parentId);
		if (parent === undefined) {
			throw new Error(`Parent of ${file.id} not found`);
		}
		if (parent.type !== "folder") {
			throw new Error(`Parent of ${file.id} is not a folder`);
		}
		parent.children.push(file);
	}
	return { files };
};
