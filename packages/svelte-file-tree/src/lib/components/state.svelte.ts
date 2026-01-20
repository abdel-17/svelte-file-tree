import type { SvelteSet } from "svelte/reactivity";
import type {
	OnCircularReferenceArgs,
	OnCopyArgs,
	OnMoveArgs,
	OnRemoveArgs,
	PasteOperation,
	TreeItemState,
	TreeRemoveMethodOptions,
} from "./types.js";

export type TreeStateProps<T> = {
	uid: string;
	root: () => T[];
	get_id: (data: T) => string;
	get_children: (data: T) => T[] | undefined;
	has_children: (data: T) => boolean;
	selected_ids: () => SvelteSet<string>;
	expanded_ids: () => SvelteSet<string>;
	clipboard_ids: () => SvelteSet<string>;
	paste_operation: () => PasteOperation | undefined;
	set_paste_operation: (value: PasteOperation | undefined) => void;
	ref: () => HTMLDivElement | null;
	on_focus: (item: TreeItemState<T>) => void;
	on_circular_reference: (args: OnCircularReferenceArgs<T>) => void;
	on_copy: (args: OnCopyArgs<T>) => void;
	on_move: (args: OnMoveArgs<T>) => void;
	on_remove: (args: OnRemoveArgs<T>) => void;
};

export function create_tree_state<T>(props: TreeStateProps<T>) {
	let tabbable_id: string | undefined = $state.raw();

	const items = $derived.by(() => {
		const result: TreeItemState<T>[] = [];
		const expanded_ids = props.expanded_ids();

		function flatten(children: T[], parent?: TreeItemState<T>) {
			const depth = parent === undefined ? 0 : parent.depth + 1;
			for (let i = 0; i < children.length; i++) {
				const data = children[i];
				const id = props.get_id(data);
				const item: TreeItemState<T> = {
					id,
					elementId: `${props.uid}-${id}`,
					data,
					index: result.length,
					depth,
					parent,
					parentChildren: children,
					indexInChildren: i,
					expanded: expanded_ids.has(id),
				};
				result.push(item);

				if (item.expanded) {
					const children = props.get_children(data);
					if (children !== undefined) {
						flatten(children, item);
					}
				}
			}
		}
		flatten(props.root());

		return result;
	});

	const lookup = $derived.by(() => {
		const result = new Map<string, TreeItemState<T>>();
		for (const item of items) {
			result.set(item.id, item);
		}
		return result;
	});

	function get_item(id: string) {
		return lookup.get(id);
	}

	function find_selected_parent(item: TreeItemState<T>) {
		const selected_ids = props.selected_ids();
		for (let parent = item.parent; parent !== undefined; parent = parent.parent) {
			if (selected_ids.has(parent.id)) {
				return parent;
			}
		}
	}

	function find_parent_in_clipboard(item: TreeItemState<T>) {
		const clipboard_ids = props.clipboard_ids();
		for (let parent = item.parent; parent !== undefined; parent = parent.parent) {
			if (clipboard_ids.has(parent.id)) {
				return parent;
			}
		}
	}

	function select_until(index: number) {
		if (index < 0 || index >= items.length) {
			return;
		}

		let start_index = 0;
		const selected_ids = props.selected_ids();
		for (const id of Array.from(selected_ids).reverse()) {
			const item = get_item(id);
			if (item !== undefined) {
				start_index = item.index;
				break;
			}
		}

		if (start_index < index) {
			for (let i = start_index + 1; i <= index; i++) {
				selected_ids.add(items[i].id);
			}
		} else if (start_index > index) {
			for (let i = start_index - 1; i >= index; i--) {
				selected_ids.add(items[i].id);
			}
		}
	}

	function paste(destination?: TreeItemState<T>) {
		if (destination !== undefined && !props.has_children(destination.data)) {
			return;
		}

		const paste_operation = props.paste_operation();
		if (paste_operation === undefined) {
			return;
		}

		const clipboard_ids = props.clipboard_ids();
		if (paste_operation === "cut" && destination !== undefined) {
			if (clipboard_ids.has(destination.id)) {
				props.on_circular_reference({ source: destination, destination });
				return;
			}

			const cut_parent = find_parent_in_clipboard(destination);
			if (cut_parent !== undefined) {
				props.on_circular_reference({ source: cut_parent, destination });
				return;
			}
		}

		const sources: TreeItemState<T>[] = [];
		for (const id of clipboard_ids) {
			const item = get_item(id);
			if (item !== undefined && find_parent_in_clipboard(item) === undefined) {
				sources.push(item);
			}
		}

		if (sources.length === 0) {
			return;
		}

		switch (paste_operation) {
			case "copy": {
				props.on_copy({ sources, destination });
				break;
			}
			case "cut": {
				props.on_move({ sources, destination });
				break;
			}
		}
	}

	function remove(index: number, { includeSelected = false }: TreeRemoveMethodOptions = {}) {
		if (index < 0 || index >= items.length) {
			return;
		}

		const removed_item = items[index];
		const removed: TreeItemState<T>[] = [];
		const selected_ids = props.selected_ids();
		if (includeSelected) {
			for (const id of selected_ids) {
				const item = get_item(id);
				if (item !== undefined && find_selected_parent(item) === undefined) {
					removed.push(item);
				}
			}

			if (!selected_ids.has(removed_item.id) && find_selected_parent(removed_item) === undefined) {
				removed.push(removed_item);
			}
		} else {
			removed.push(removed_item);
		}

		function find_removed(item: TreeItemState<T> | undefined) {
			for (let current = item; current !== undefined; current = current.parent) {
				if (current === removed_item || (includeSelected && selected_ids.has(current.id))) {
					return current;
				}
			}
		}

		let nearest_remaining;
		if (index !== items.length - 1) {
			let i = index + 1;
			while (1) {
				const item = items[i];
				const first_removed = find_removed(item);
				if (first_removed === undefined) {
					nearest_remaining = item;
					break;
				}

				let next_non_child;
				for (
					let current: TreeItemState<T> | undefined = first_removed;
					current !== undefined;
					current = current.parent
				) {
					if (current.indexInChildren !== current.parentChildren.length - 1) {
						const next_sibling = current.parentChildren[current.indexInChildren + 1];
						next_non_child = get_item(props.get_id(next_sibling));
						break;
					}
				}

				if (next_non_child === undefined) {
					break;
				}
				i = next_non_child.index;
			}
		}

		if (nearest_remaining === undefined) {
			let i = index - 1;
			while (i >= 0) {
				const item = items[i];
				const first_removed = find_removed(item);
				if (first_removed === undefined) {
					nearest_remaining = item;
					break;
				}
				i = first_removed.index - 1;
			}
		}

		props.on_remove({ removed, nearestRemaining: nearest_remaining });
	}

	return {
		get_id: props.get_id,
		get_children: props.get_children,
		has_children: props.has_children,
		get_selected_ids: props.selected_ids,
		get_expanded_ids: props.expanded_ids,
		get_clipboard_ids: props.clipboard_ids,
		get_paste_operation: props.paste_operation,
		set_paste_operation: props.set_paste_operation,
		get_ref: props.ref,
		get_items: () => items,
		get_item,
		get_tabbable_id: () => tabbable_id,
		set_tabbable_id: (value: string | undefined) => {
			tabbable_id = value;
		},
		on_focus: props.on_focus,
		select_until,
		paste,
		remove,
	};
}

export type TreeState<T> = ReturnType<typeof create_tree_state<T>>;
