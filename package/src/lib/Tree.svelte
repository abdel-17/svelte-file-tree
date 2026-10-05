<script lang="ts" module>
	import { getContext, setContext } from "svelte";
	import type { EventHandler, HTMLAttributes } from "svelte/elements";
	import type { SvelteSet } from "svelte/reactivity";
	import type { FlatTreeItem } from "./flat-tree.js";
	import { get_nearest_treeitem, is_control_or_meta, is_treeitem, set_toggle } from "./helpers.js";

	export type TreeOnFocusItemArgs<T> = {
		item: FlatTreeItem<T>,
		index: number,
		element_id: string,
	};

	export interface TreeProps<T> extends HTMLAttributes<HTMLDivElement> {
		items: FlatTreeItem<T>[],
		selected_ids: SvelteSet<string>,
		expanded_ids: SvelteSet<string>,
		get_id: (data: T) => string,
		has_children: (data: T) => boolean,
		tabbable_id?: string | undefined,
		item_element_id_prefix?: string,
		ref?: HTMLDivElement | null,
		on_focus_item?: (args: TreeOnFocusItemArgs<T>) => void,
	}

	export type TreeContext<T> = {
		has_children: (data: T) => boolean,
		get_tabbable_id: () => string | undefined,
		set_tabbable_id: (value: string | undefined) => void,
		get_item_element_id_prefix: () => string,
	};

	const CONTEXT_KEY = Symbol("TreeContext");

	export function get_tree_context<T>(): TreeContext<T> {
		const context: TreeContext<T> | undefined = getContext(CONTEXT_KEY);
		if (context === undefined) {
			throw new Error("No parent <Tree> found");
		}
		return context;
	}
</script>

<script lang="ts" generics="T">
	const uid = $props.id();
	let {
		items,
		selected_ids,
		expanded_ids,
		get_id,
		has_children,
		tabbable_id = $bindable(),
		item_element_id_prefix = uid + "-",
		ref = $bindable(null),
		on_focus_item = (args) => {
			document.getElementById(args.element_id)?.focus();
		},
		children,
		onclick,
		onfocusin,
		onkeydown,
		...rest
	}: TreeProps<T> = $props();

	const context: TreeContext<T> = {
		has_children: (data) => has_children(data),
		get_tabbable_id: () => tabbable_id,
		set_tabbable_id: (value) => {
			tabbable_id = value;
		},
		get_item_element_id_prefix: () => item_element_id_prefix,
	};
	setContext(CONTEXT_KEY, context);

	/** Note: `index` is assumed not to be out of bounds */
	function focus_item(index: number): void {
		const item = items[index]!;
		const element_id = item_element_id_prefix + item.id;
		on_focus_item({ item, index, element_id });
	}

	/** Note: `from` and `to` are assumed not to be out of bounds */
	function batch_select_range(from: number, to: number): void {
		if (from <= to) {
			for (let i = from; i <= to; i++) {
				selected_ids.add(items[i]!.id);
			}
		} else {
			for (let i = from; i >= to; i--) {
				selected_ids.add(items[i]!.id);
			}
		}
	}

	/** Note: `index` is assumed not to be out of bounds */
	function batch_select_until(index: number): void {
		let last_selected_id: string | undefined;
		for (const id of selected_ids) {
			last_selected_id = id;
		}

		let start_index = 0;
		if (last_selected_id !== undefined) {
			const last_selected_index = items.findIndex((item) => item.id === last_selected_id);
			if (last_selected_index !== -1) {
				start_index = last_selected_index;
			}
		}
		batch_select_range(start_index, index);
	}

	const handle_click: EventHandler<MouseEvent, HTMLDivElement> = (event) => {
		onclick?.(event);
		if (event.defaultPrevented) {
			return;
		}
		const treeitem = get_nearest_treeitem(event.target);
		if (treeitem === null || treeitem.ariaDisabled === "true") {
			return;
		}
		const index = Number(treeitem.dataset.index);
		const item = items[index];
		if (item === undefined) {
			return;
		}

		if (event.shiftKey) {
			batch_select_until(index);
		} else if (is_control_or_meta(event)) {
			set_toggle(selected_ids, item.id);
		} else {
			selected_ids.clear();
			selected_ids.add(item.id);
		}
	};

	const handle_focusin: EventHandler<FocusEvent, HTMLDivElement> = (event) => {
		onfocusin?.(event);
		const treeitem = get_nearest_treeitem(event.target);
		if (treeitem === null) {
			return;
		}
		const index = Number(treeitem.dataset.index);
		const item = items[index];
		if (item === undefined) {
			return;
		}
		tabbable_id = item.id;
	};

	const handle_keydown: EventHandler<KeyboardEvent, HTMLDivElement> = (event) => {
		onkeydown?.(event);
		if (event.defaultPrevented) {
			return;
		}
		const treeitem = event.target;
		if (!is_treeitem(treeitem) || treeitem.ariaDisabled === "true") {
			return;
		}
		const index = Number(treeitem.dataset.index);
		const item = items[index];
		if (item === undefined) {
			return;
		}

		const key = event.key;
		const { direction } = getComputedStyle(treeitem);
		if (key === "ArrowRight" && direction === "ltr" || key === "ArrowLeft" && direction === "rtl") {
			if (treeitem.ariaExpanded === "false") {
				expanded_ids.add(item.id);
				event.preventDefault();
			} else if (treeitem.ariaExpanded === "true" && index < items.length - 1) {
				focus_item(index + 1);
				event.preventDefault();
			}
		} else if (key === "ArrowLeft" && direction === "ltr" || key === "ArrowRight" && direction === "rtl") {
			if (treeitem.ariaExpanded === "true") {
				expanded_ids.delete(item.id);
				event.preventDefault();
			} else if (item.parent_index !== -1) {
				focus_item(item.parent_index);
				event.preventDefault();
			}
		} else if (key === "ArrowUp" || key === "ArrowDown") {
			const offset = key === "ArrowUp" ? -1 : 1;
			const target_index = index + offset;
			if (target_index < 0 || target_index >= items.length) {
				return;
			}

			if (event.shiftKey) {
				selected_ids.add(item.id).add(items[target_index]!.id);
			} else if (!is_control_or_meta(event)) {
				selected_ids.clear();
				selected_ids.add(items[target_index]!.id);
			}
			focus_item(target_index);
			event.preventDefault();
		} else if (key === "PageUp" || key === "PageDown") {
			const offset = key === "PageUp" ? -1 : 1;
			let target_index = index + offset;
			if (target_index < 0 || target_index >= items.length) {
				return;
			}

			const page_height = Math.min(event.currentTarget.clientHeight, document.documentElement.clientHeight);
			const treeitem_rect = treeitem.getBoundingClientRect();
			while (true) {
				const next_index = target_index + offset;
				if (next_index < 0 || next_index >= items.length) {
					break;
				}
				const next_item = items[next_index]!;
				const next_treeitem = document.getElementById(item_element_id_prefix + next_item.id);
				if (next_treeitem === null) {
					break;
				}
				const next_treeitem_rect = next_treeitem.getBoundingClientRect();
				const distance = Math.abs(next_treeitem_rect.top - treeitem_rect.top);
				if (distance > page_height) {
					break;
				}
				target_index = next_index;
			}

			if (event.shiftKey && is_control_or_meta(event)) {
				batch_select_range(index, target_index);
			} else {
				selected_ids.clear();
				selected_ids.add(items[target_index]!.id);
			}
			focus_item(target_index);
			event.preventDefault();
		} else if (key === "Home" || key === "End") {
			const target_index = key === "Home" ? 0 : items.length - 1;
			if (index === target_index) {
				return;
			}

			if (event.shiftKey && is_control_or_meta(event)) {
				batch_select_range(index, target_index);
			} else {
				selected_ids.clear();
				selected_ids.add(items[target_index]!.id);
			}
			focus_item(target_index);
			event.preventDefault();
		} else if (key === " ") {
			if (event.shiftKey) {
				batch_select_until(index);
			} else {
				set_toggle(selected_ids, item.id);
			}
			event.preventDefault();
		} else if (key === "Escape") {
			selected_ids.clear();
			event.preventDefault();
		} else if (key === "a") {
			if (is_control_or_meta(event)) {
				for (const item of items) {
					selected_ids.add(item.id);
				}
				event.preventDefault();
			}
		} else if (key === "*") {
			for (const child of item.parent_children) {
				if (has_children(child)) {
					expanded_ids.add(get_id(child));
				}
			}
			event.preventDefault();
		}
	};
</script>

<div
	{...rest}
	bind:this={ref}
	role="tree"
	aria-multiselectable="true"
	onclick={handle_click}
	onfocusin={handle_focusin}
	onkeydown={handle_keydown}
>
	{@render children?.()}
</div>
