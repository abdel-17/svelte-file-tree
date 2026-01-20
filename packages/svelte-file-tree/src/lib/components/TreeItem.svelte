<script lang="ts" generics="T">
	import type { EventHandler } from "svelte/elements";
	import { get_tree_state } from "./Tree.svelte";
	import type { TreeItemProps } from "./types.js";
	import { is_control_or_meta } from "$lib/internal/helpers.js";

	let {
		item,
		disabled = false,
		ref = $bindable(null),
		children,
		onfocusin,
		onkeydown,
		onclick,
		...rest
	}: TreeItemProps<T> = $props();

	const tree_state = get_tree_state<T>();
	const selected = $derived(tree_state.get_selected_ids().has(item.id));

	function toggle_selection() {
		const selected_ids = tree_state.get_selected_ids();
		if (selected) {
			selected_ids.delete(item.id);
		} else {
			selected_ids.add(item.id);
		}
	}

	$effect.pre(() => {
		if (tree_state.get_tabbable_id() === undefined) {
			tree_state.set_tabbable_id(item.id);
		}
	});

	$effect(() => {
		return () => {
			if (tree_state.get_tabbable_id() === item.id) {
				tree_state.set_tabbable_id(undefined);
			}
		};
	});

	const handle_focusin: EventHandler<FocusEvent, HTMLDivElement> = (event) => {
		onfocusin?.(event);
		tree_state.set_tabbable_id(item.id);
	};

	const handle_keydown: EventHandler<KeyboardEvent, HTMLDivElement> = (event) => {
		onkeydown?.(event);
		if (event.defaultPrevented || event.target !== event.currentTarget || disabled) {
			return;
		}

		const { direction } = getComputedStyle(event.currentTarget);
		const arrow_start = direction === "rtl" ? "ArrowRight" : "ArrowLeft";
		const arrow_end = direction === "rtl" ? "ArrowLeft" : "ArrowRight";

		const selected_ids = tree_state.get_selected_ids();
		const expanded_ids = tree_state.get_expanded_ids();
		const clipboard_ids = tree_state.get_clipboard_ids();
		const items = tree_state.get_items();

		switch (event.key) {
			case arrow_end: {
				if (!tree_state.has_children(item.data)) {
					break;
				}

				if (!item.expanded) {
					expanded_ids.add(item.id);
					event.preventDefault();
				} else if (item.index < items.length - 1) {
					tree_state.on_focus(items[item.index + 1]);
					event.preventDefault();
				}
				break;
			}
			case arrow_start: {
				if (item.expanded) {
					expanded_ids.delete(item.id);
					event.preventDefault();
				} else if (item.parent !== undefined) {
					tree_state.on_focus(item.parent);
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
					selected_ids.add(item.id).add(next.id);
				} else if (!is_control_or_meta(event)) {
					selected_ids.clear();
					selected_ids.add(next.id);
				}

				tree_state.on_focus(next);
				event.preventDefault();
				break;
			}
			case "PageDown":
			case "PageUp": {
				const offset = event.key === "PageDown" ? 1 : -1;
				const max_scroll_distance = Math.min(
					tree_state.get_ref()!.clientHeight,
					document.documentElement.clientHeight,
				);
				const item_rect = event.currentTarget.getBoundingClientRect();

				let found;
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

					found = next;
				}

				if (found === undefined) {
					break;
				}

				if (event.shiftKey && is_control_or_meta(event)) {
					const stop_index = found.index + offset;
					for (let i = item.index; i !== stop_index; i += offset) {
						selected_ids.add(items[i].id);
					}
				} else {
					selected_ids.clear();
					selected_ids.add(found.id);
				}

				tree_state.on_focus(found);
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
						selected_ids.add(items[i].id);
					}
				} else {
					selected_ids.clear();
					selected_ids.add(last.id);
				}

				tree_state.on_focus(last);
				event.preventDefault();
				break;
			}
			case " ": {
				if (event.shiftKey) {
					tree_state.select_until(item.index);
				} else {
					toggle_selection();
				}
				event.preventDefault();
				break;
			}
			case "Escape": {
				selected_ids.clear();
				clipboard_ids.clear();
				tree_state.set_paste_operation(undefined);
				event.preventDefault();
				break;
			}
			case "*": {
				for (const sibling of item.parentChildren) {
					if (tree_state.has_children(sibling)) {
						expanded_ids.add(tree_state.get_id(sibling));
					}
				}
				event.preventDefault();
				break;
			}
			case "Delete": {
				tree_state.remove(item.index, { includeSelected: selected });
				event.preventDefault();
				break;
			}
			case "a": {
				if (!is_control_or_meta(event)) {
					break;
				}

				for (const item of items) {
					selected_ids.add(item.id);
				}
				event.preventDefault();
				break;
			}
			case "c":
			case "x": {
				if (!is_control_or_meta(event)) {
					break;
				}

				clipboard_ids.clear();
				if (selected) {
					for (const id of selected_ids) {
						clipboard_ids.add(id);
					}
				} else {
					clipboard_ids.add(item.id);
				}

				tree_state.set_paste_operation(event.key === "c" ? "copy" : "cut");
				event.preventDefault();
				break;
			}
			case "v": {
				if (!is_control_or_meta(event)) {
					break;
				}

				const destination = tree_state.has_children(item.data) ? item : item.parent;
				tree_state.paste(destination);
				event.preventDefault();
				break;
			}
			default: {
				return;
			}
		}
	};

	const handle_click: EventHandler<MouseEvent, HTMLDivElement> = (event) => {
		onclick?.(event);
		if (event.defaultPrevented || disabled) {
			return;
		}

		if (event.shiftKey) {
			tree_state.select_until(item.index);
		} else if (is_control_or_meta(event)) {
			toggle_selection();
		} else {
			const selected_ids = tree_state.get_selected_ids();
			selected_ids.clear();
			selected_ids.add(item.id);
		}
	};
</script>

<div
	{...rest}
	bind:this={ref}
	id={item.elementId}
	role="treeitem"
	tabindex={tree_state.get_tabbable_id() === item.id ? 0 : -1}
	aria-selected={selected}
	aria-expanded={tree_state.has_children(item.data) ? item.expanded : undefined}
	aria-disabled={disabled}
	aria-level={item.depth + 1}
	aria-posinset={item.indexInChildren + 1}
	aria-setsize={item.parentChildren.length}
	onfocusin={handle_focusin}
	onkeydown={handle_keydown}
	onclick={handle_click}
>
	{@render children?.()}
</div>
