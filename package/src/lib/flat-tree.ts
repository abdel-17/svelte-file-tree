export type FlatTreeItem<T> = {
	data: T,
	id: string,
	depth: number,
	parent_index: number,
	parent_children: T[],
	parent_children_index: number,
};

export type FlatTreeOptions<T> = {
	root: T[],
	expanded_ids: Set<string>,
	get_id: (data: T) => string,
	get_children: (data: T) => T[] | undefined,
};

export function create_flat_tree<T>(options: FlatTreeOptions<T>): FlatTreeItem<T>[] {
	const items: FlatTreeItem<T>[] = [];
	flatten(options.root, -1, 0, options, items);
	return items;
}

function flatten<T>(
	parent_children: T[],
	parent_index: number,
	depth: number,
	options: FlatTreeOptions<T>,
	items: FlatTreeItem<T>[],
): void {
	for (let i = 0; i < parent_children.length; i++) {
		const data = parent_children[i]!;
		const id = options.get_id(data);
		const item: FlatTreeItem<T> = {
			data,
			id,
			depth,
			parent_index,
			parent_children,
			parent_children_index: i,
		};
		const items_length = items.push(item);

		if (options.expanded_ids.has(id)) {
			const children = options.get_children(data);
			if (children != null) {
				flatten(children, items_length - 1, depth + 1, options, items);
			}
		}
	}
}
