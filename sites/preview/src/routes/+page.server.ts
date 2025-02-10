import type { FileTreeItem } from "svelte-file-tree";
import type { PageServerLoad } from "./$types";
import data from "./data.json";

export const load: PageServerLoad = () => {
	return {
		children: data.map(function transform(item): FileTreeItem {
			if (item.children === undefined) {
				return {
					type: "file",
					id: item.id,
					name: item.name,
				};
			}

			return {
				type: "folder",
				id: item.id,
				name: item.name,
				children: item.children.map(transform),
			};
		}),
	};
};
