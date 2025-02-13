import { getFiles } from "$lib/server/database.js";
import { artificialDelay } from "$lib/utils.js";
import type { PageServerLoad } from "./$types.js";
import { FILES_DEPENDENCY } from "./shared.js";

export type FileMetadata = {
	id: string;
	type: "file" | "folder";
	name: string;
	parentId: string | undefined;
	indexInParent: number;
	createdAt: Date;
	updatedAt: Date;
	children: Array<FileMetadata>;
};

const sortByIndex = (files: Array<FileMetadata>): void => {
	files.sort((a, b) => a.indexInParent - b.indexInParent);

	for (const file of files) {
		sortByIndex(file.children);
	}
};

export const load: PageServerLoad = async (event) => {
	await artificialDelay();
	const dbFiles = getFiles();
	event.depends(FILES_DEPENDENCY);

	const files: Array<FileMetadata> = [];
	const lookup = new Map<string, FileMetadata>();
	for (const dbFile of dbFiles) {
		const file: FileMetadata = {
			id: dbFile.id.toString(),
			type: dbFile.type,
			name: dbFile.name,
			parentId: dbFile.parent_id?.toString(),
			indexInParent: dbFile.index_in_parent,
			createdAt: dbFile.created_at,
			updatedAt: dbFile.updated_at,
			children: [],
		};

		if (file.parentId !== undefined) {
			const parent = lookup.get(file.parentId);
			parent?.children.push(file);
		} else {
			files.push(file);
		}

		lookup.set(file.id, file);
	}
	sortByIndex(files);

	return { files, lookup };
};
