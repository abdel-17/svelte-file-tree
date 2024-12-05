import type { FileTreeItem } from "svelte-file-tree";
import type { PageServerLoad } from "./$types";
import data from "./data.json";

export const load: PageServerLoad = () => {
	return {
		items: toFileTreeItems(data),
	};
};

type Data = typeof data;

function toFileTreeItems(data: Data): FileTreeItem[] {
	return data.map((item) => {
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
			children: toFileTreeItems(item.children),
		};
	});
}
