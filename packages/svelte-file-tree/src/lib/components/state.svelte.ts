import { is_control_or_meta } from "$lib/internal/helpers.js";
import { TreeItemData } from "$lib/tree.svelte.js";
import type { EventHandler } from "svelte/elements";
import type { SvelteSet } from "svelte/reactivity";
import type {
	OnCircularReferenceArgs,
	OnCopyArgs,
	OnMoveArgs,
	OnRemoveArgs,
	PasteOperation,
	TreeRemoveMethodOptions,
} from "./types.js";

export type TreeStateProps<T> = {
	uid: string;
	root: () => T[];
	get_item_id: (data: T) => string;
	get_item_children: (data: T) => T[] | undefined;
	has_children: (data: T) => boolean;
	is_item_disabled: (data: T) => boolean;
	selected_ids: () => SvelteSet<string>;
	expanded_ids: () => SvelteSet<string>;
	clipboard_ids: () => SvelteSet<string>;
	paste_operation: () => PasteOperation | undefined;
	set_paste_operation: (value: PasteOperation | undefined) => void;
	ref: () => HTMLDivElement | null;
	on_focus: (item: TreeItemData<T>) => void;
	on_circular_reference: (args: OnCircularReferenceArgs<T>) => void;
	on_copy: (args: OnCopyArgs<T>) => void;
	on_move: (args: OnMoveArgs<T>) => void;
	on_remove: (args: OnRemoveArgs<T>) => void;
};

export function create_tree_state<T>(props: TreeStateProps<T>) {
	const {
		uid,
		root,
		get_item_id,
		get_item_children,
		has_children,
		is_item_disabled,
		selected_ids,
		expanded_ids,
		clipboard_ids,
		paste_operation,
		set_paste_operation,
		ref,
		on_focus,
		on_circular_reference,
		on_copy,
		on_move,
		on_remove,
	} = props;

	let tabbable_id: string | undefined = $state.raw();

	function flatten(children: T[], parent: TreeItemData<T> | undefined, result: TreeItemData<T>[]) {
		for (let i = 0; i < children.length; i++) {
			const data = children[i];
			const id = get_item_id(data);
			const item = new TreeItemData({
				id,
				elementId: `${uid}-${id}`,
				index: result.length,
				data,
				parent,
				parentChildren: children,
				indexInChildren: i,
				expanded: expanded_ids().has(id),
				selected: () => selected_ids().has(id),
				inClipboard: () => clipboard_ids().has(id),
				disabled: () => is_item_disabled(data),
				hasChildren: () => has_children(data),
			});
			result.push(item);

			if (item.expanded) {
				const children = get_item_children(data);
				if (children !== undefined) {
					flatten(children, item, result);
				}
			}
		}
		return result;
	}

	const items = $derived(flatten(root(), undefined, []));

	const lookup = $derived.by(() => {
		const result = new Map<string, TreeItemData<T>>();
		for (const item of items) {
			result.set(item.id, item);
		}
		return result;
	});

	function get_item(id: string) {
		return lookup.get(id);
	}

	function toggle_selection(item: TreeItemData<T>) {
		if (item.selected) {
			selected_ids().delete(item.id);
		} else {
			selected_ids().add(item.id);
		}
	}

	function select_until(index: number) {
		if (index < 0 || index >= items.length) {
			return;
		}

		let start_index = 0;
		for (const id of Array.from(selected_ids()).reverse()) {
			const item = get_item(id);
			if (item !== undefined) {
				start_index = item.index;
				break;
			}
		}

		if (start_index < index) {
			for (let i = start_index + 1; i <= index; i++) {
				selected_ids().add(items[i].id);
			}
		} else if (start_index > index) {
			for (let i = start_index - 1; i >= index; i--) {
				selected_ids().add(items[i].id);
			}
		}
	}

	function paste(destination?: TreeItemData<T>) {
		if (destination !== undefined && !destination.hasChildren) {
			return;
		}

		if (paste_operation() === undefined) {
			return;
		}

		if (paste_operation() === "cut" && destination !== undefined) {
			const first_cut = destination.first((item) => item.inClipboard);
			if (first_cut !== undefined) {
				on_circular_reference({ source: first_cut, destination });
				return;
			}
		}

		const sources: TreeItemData<T>[] = [];
		for (const id of clipboard_ids()) {
			const item = get_item(id);
			if (item !== undefined && item.parent?.first((item) => item.inClipboard) === undefined) {
				sources.push(item);
			}
		}

		if (sources.length === 0) {
			return;
		}

		switch (paste_operation()) {
			case "copy": {
				on_copy({ sources, destination });
				break;
			}
			case "cut": {
				on_move({ sources, destination });
				break;
			}
		}
	}

	function remove(index: number, options: TreeRemoveMethodOptions = {}) {
		if (index < 0 || index >= items.length) {
			return;
		}

		const { includeSelected = false } = options;
		const removed_item = items[index];
		const removed: TreeItemData<T>[] = [];
		if (includeSelected) {
			for (const id of selected_ids()) {
				const item = get_item(id);
				if (
					item !== undefined &&
					item.parent?.first((ancestor) => ancestor.selected) === undefined
				) {
					removed.push(item);
				}
			}

			if (!removed_item.selected) {
				removed.push(removed_item);
			}
		} else {
			removed.push(removed_item);
		}

		function is_removed(item: TreeItemData<T>) {
			return item === removed_item || (includeSelected && item.selected);
		}

		let nearest_remaining;
		if (index !== items.length - 1) {
			let i = index + 1;
			while (1) {
				const item = items[i];
				const first_removed = item.first(is_removed);
				if (first_removed === undefined) {
					nearest_remaining = item;
					break;
				}

				// Go to the next non-child item.
				let next: TreeItemData<T> | undefined = first_removed;
				do {
					if (next.indexInChildren !== next.parentChildren.length - 1) {
						const next_sibling = next.parentChildren[next.indexInChildren + 1];
						const next_sibling_id = get_item_id(next_sibling);
						next = get_item(next_sibling_id)!;
						break;
					}
					next = next.parent;
				} while (next !== undefined);

				if (next === undefined) {
					break;
				}
				i = next.index;
			}
		}

		if (nearest_remaining === undefined) {
			let i = index - 1;
			while (i >= 0) {
				const item = items[i];
				const first_removed = item.first(is_removed);
				if (first_removed === undefined) {
					nearest_remaining = item;
					break;
				}
				i = first_removed.index - 1;
			}
		}

		on_remove({ removed, nearestRemaining: nearest_remaining });
	}

	function create_item_state(get_item: () => TreeItemData<T>) {
		$effect.pre(() => {
			if (tabbable_id === undefined) {
				tabbable_id = get_item().id;
			}
		});

		$effect(() => {
			return () => {
				if (tabbable_id === get_item().id) {
					tabbable_id = undefined;
				}
			};
		});

		const onfocusin: EventHandler<FocusEvent, HTMLDivElement> = () => {
			tabbable_id = get_item().id;
		};

		const onkeydown: EventHandler<KeyboardEvent, HTMLDivElement> = (event) => {
			const item = get_item();
			if (event.defaultPrevented || event.target !== event.currentTarget || item.disabled) {
				return;
			}

			const { direction } = getComputedStyle(event.currentTarget);
			const arrow_start = direction === "rtl" ? "ArrowRight" : "ArrowLeft";
			const arrow_end = direction === "rtl" ? "ArrowLeft" : "ArrowRight";

			switch (event.key) {
				case arrow_end: {
					if (!item.hasChildren) {
						break;
					}

					if (!item.expanded) {
						expanded_ids().add(item.id);
						event.preventDefault();
					} else if (item.index < items.length - 1) {
						const first_child = items[item.index + 1];
						on_focus(first_child);
						event.preventDefault();
					}
					break;
				}
				case arrow_start: {
					if (item.hasChildren && item.expanded) {
						expanded_ids().delete(item.id);
						event.preventDefault();
					} else if (item.parent !== undefined) {
						on_focus(item.parent);
						event.preventDefault();
					}
					break;
				}
				case "ArrowDown":
				case "ArrowUp": {
					const next_index = event.key === "ArrowDown" ? item.index + 1 : item.index - 1;
					if (next_index < 0 || next_index >= items.length) {
						break;
					}

					const next = items[next_index];
					if (event.shiftKey) {
						selected_ids().add(item.id).add(next.id);
					} else if (!is_control_or_meta(event)) {
						selected_ids().clear();
						selected_ids().add(next.id);
					}

					on_focus(next);
					event.preventDefault();
					break;
				}
				case "PageDown":
				case "PageUp": {
					const offset = event.key === "PageDown" ? 1 : -1;
					const max_scroll_distance = Math.min(
						ref()!.clientHeight,
						document.documentElement.clientHeight,
					);
					const item_rect = event.currentTarget.getBoundingClientRect();

					let next_index = -1;
					for (let i = item.index + offset; 0 <= i && i < items.length; i += offset) {
						const next = items[i]!;
						const next_element = document.getElementById(next.elementId);
						if (next_element === null) {
							break;
						}

						const next_rect = next_element.getBoundingClientRect();
						const distance = Math.abs(next_rect.top - item_rect.top);
						if (distance > max_scroll_distance) {
							break;
						}

						next_index = i;
					}

					if (next_index === -1) {
						break;
					}

					if (event.shiftKey && is_control_or_meta(event)) {
						for (let i = item.index; i !== next_index; i += offset) {
							selected_ids().add(items[i].id);
						}
					} else {
						selected_ids().clear();
						selected_ids().add(items[next_index].id);
					}

					on_focus(items[next_index]);
					event.preventDefault();
					break;
				}
				case "Home":
				case "End": {
					const last_index = event.key === "End" ? items.length - 1 : 0;
					const last = items[last_index];
					if (item === last) {
						break;
					}

					if (event.shiftKey && is_control_or_meta(event)) {
						const offset = event.key === "End" ? 1 : -1;
						for (let i = item.index; 0 <= i && i < items.length; i += offset) {
							selected_ids().add(items[i].id);
						}
					} else {
						selected_ids().clear();
						selected_ids().add(last.id);
					}

					on_focus(last);
					event.preventDefault();
					break;
				}
				case " ": {
					if (event.shiftKey) {
						select_until(item.index);
					} else {
						toggle_selection(item);
					}
					event.preventDefault();
					break;
				}
				case "Escape": {
					selected_ids().clear();
					clipboard_ids().clear();
					set_paste_operation(undefined);
					event.preventDefault();
					break;
				}
				case "*": {
					for (const sibling of item.parentChildren) {
						if (has_children(sibling)) {
							const sibling_id = get_item_id(sibling);
							expanded_ids().add(sibling_id);
						}
					}
					event.preventDefault();
					break;
				}
				case "Delete": {
					remove(item.index, { includeSelected: item.selected });
					event.preventDefault();
					break;
				}
				case "a": {
					if (!is_control_or_meta(event)) {
						break;
					}

					for (const item of items) {
						selected_ids().add(item.id);
					}
					event.preventDefault();
					break;
				}
				case "c":
				case "x": {
					if (!is_control_or_meta(event)) {
						break;
					}

					clipboard_ids().clear();
					if (item.selected) {
						for (const id of selected_ids()) {
							clipboard_ids().add(id);
						}
					} else {
						clipboard_ids().add(item.id);
					}
					set_paste_operation(event.key === "c" ? "copy" : "cut");
					event.preventDefault();
					break;
				}
				case "v": {
					if (!is_control_or_meta(event)) {
						break;
					}

					const destination = item.hasChildren ? item : item.parent;
					paste(destination);
					event.preventDefault();
					break;
				}
				default: {
					return;
				}
			}
		};

		const onclick: EventHandler<MouseEvent, HTMLDivElement> = (event) => {
			const item = get_item();
			if (event.defaultPrevented || item.disabled) {
				return;
			}

			if (event.shiftKey) {
				select_until(item.index);
			} else if (is_control_or_meta(event)) {
				toggle_selection(item);
			} else {
				selected_ids().clear();
				selected_ids().add(item.id);
			}
		};

		return { onfocusin, onkeydown, onclick };
	}

	return {
		tabbable_id: () => tabbable_id,
		items: () => items,
		get_item,
		paste,
		remove,
		create_item_state,
	};
}

export type TreeState<T> = ReturnType<typeof create_tree_state<T>>;
