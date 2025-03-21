<script lang="ts" module>
	import { composeEventHandlers, isControlOrMeta } from "$lib/internal/helpers.js";
	import { DEV } from "esm-env";
	import { flushSync, getContext, hasContext, setContext } from "svelte";
	import type { EventHandler } from "svelte/elements";
	import { getTreeItemProviderContext } from "../Tree/TreeItemProvider.svelte";
	import type { TreeItemPosition } from "../Tree/state.svelte.js";
	import { createDragState } from "./state.svelte.js";
	import type { TreeItemChildrenSnippetArgs, TreeItemProps } from "./types.js";

	const CONTEXT_KEY = Symbol("TreeItem");

	export type TreeItemContext = {
		setEditing: (value: boolean) => void;
	};

	export function getTreeItemContext(): TreeItemContext {
		if (DEV && !hasContext(CONTEXT_KEY)) {
			throw new Error("No parent <TreeItem> found");
		}

		return getContext(CONTEXT_KEY);
	}
</script>

<script lang="ts">
	const { treeState, item } = getTreeItemProviderContext();

	let {
		children,
		editing = $bindable(false),
		ref = $bindable(null),
		class: className,
		style,
		onfocusin,
		onkeydown,
		onclick,
		ondragstart,
		ondragover,
		ondragleave,
		ondrop,
		ondragend,
		...rest
	}: TreeItemProps = $props();

	const { dropPosition, canDrop, getLatestDropPosition, updateDropPosition, clearDropPosition } =
		createDragState({
			draggedId: treeState.draggedId,
			item,
		});

	const context: TreeItemContext = {
		setEditing: (value) => {
			editing = value;
		},
	};
	setContext(CONTEXT_KEY, context);

	const handleFocusIn: EventHandler<FocusEvent, HTMLElement> = () => {
		treeState.setTabbableId(item().node.id);
	};

	const handleKeyDown: EventHandler<KeyboardEvent, HTMLElement> = (event) => {
		if (event.target !== event.currentTarget) {
			// Don't handle keydown events that bubble up from child elements.
			// This can cause unexpected behavior with child inputs.
			return;
		}

		if (item().disabled()) {
			return;
		}

		switch (event.key) {
			case "ArrowRight": {
				const { node } = item();
				if (node.type === "file") {
					break;
				}

				if (!item().expanded()) {
					treeState.expandedIds().add(node.id);
					break;
				}

				if (node.children.length !== 0) {
					treeState.getItemElement(node.children[0].id)?.focus();
				}
				break;
			}
			case "ArrowLeft": {
				if (item().node.type === "folder" && item().expanded()) {
					treeState.expandedIds().delete(item().node.id);
					break;
				}

				const { parent } = item();
				if (parent !== undefined) {
					treeState.getItemElement(parent.node.id)?.focus();
				}
				break;
			}
			case "ArrowDown":
			case "ArrowUp": {
				const down = event.key === "ArrowDown";
				const next = down ? treeState.getNextItem(item()) : treeState.getPreviousItem(item());
				if (next === undefined) {
					break;
				}

				const nextElement = treeState.getItemElement(next.node.id);
				if (nextElement === null) {
					break;
				}

				if (event.shiftKey) {
					treeState.selectedIds().add(item().node.id).add(next.node.id);
				} else if (!isControlOrMeta(event)) {
					treeState.selectedIds().clear();
					treeState.selectedIds().add(next.node.id);
				}

				nextElement.focus();
				break;
			}
			case "PageDown":
			case "PageUp": {
				const down = event.key === "PageDown";
				const navigate = down ? treeState.getNextItem : treeState.getPreviousItem;
				const shouldSelectMultiple = event.shiftKey && isControlOrMeta(event);
				const maxScrollDistance = Math.min(
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					document.getElementById(treeState.id())!.clientHeight,
					document.documentElement.clientHeight,
				);
				const itemRect = event.currentTarget.getBoundingClientRect();

				let current: TreeItemPosition = item();
				let currentElement: HTMLElement = event.currentTarget;
				while (true) {
					const next = navigate(current);
					if (next === undefined) {
						break;
					}

					const nextElement = treeState.getItemElement(next.node.id);
					if (nextElement === null) {
						break;
					}

					const nextRect = nextElement.getBoundingClientRect();
					const distance = Math.abs(nextRect.top - itemRect.top);
					if (distance > maxScrollDistance) {
						break;
					}

					if (shouldSelectMultiple) {
						treeState.selectedIds().add(current.node.id);
					}

					current = next;
					currentElement = nextElement;
				}

				if (current === item()) {
					break;
				}

				if (!shouldSelectMultiple) {
					treeState.selectedIds().clear();
				}

				treeState.selectedIds().add(current.node.id);
				currentElement.focus();
				break;
			}
			case "Home": {
				const first = treeState.tree().children[0];
				if (first === item().node) {
					break;
				}

				const firstElement = treeState.getItemElement(first.id);
				if (firstElement === null) {
					break;
				}

				const shouldSelectMultiple = event.shiftKey && isControlOrMeta(event);
				if (shouldSelectMultiple) {
					let current: TreeItemPosition | undefined = item();
					do {
						treeState.selectedIds().add(current.node.id);
						current = treeState.getPreviousItem(current);
					} while (current !== undefined);
				} else {
					treeState.selectedIds().clear();
					treeState.selectedIds().add(first.id);
				}

				firstElement.focus();
				break;
			}
			case "End": {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				let last = treeState.tree().children.at(-1)!;
				while (
					last.type === "folder" &&
					treeState.expandedIds().has(last.id) &&
					last.children.length !== 0
				) {
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					last = last.children.at(-1)!;
				}

				if (last === item().node) {
					break;
				}

				const lastElement = treeState.getItemElement(last.id);
				if (lastElement === null) {
					break;
				}

				if (event.shiftKey && isControlOrMeta(event)) {
					let current: TreeItemPosition | undefined = item();
					do {
						treeState.selectedIds().add(current.node.id);
						current = treeState.getNextItem(current);
					} while (current !== undefined);
				} else if (!event.shiftKey && !isControlOrMeta(event)) {
					treeState.selectedIds().clear();
					treeState.selectedIds().add(last.id);
				}

				lastElement.focus();
				break;
			}
			case " ": {
				if (event.shiftKey) {
					treeState.selectUntil(item(), event.currentTarget);
					break;
				}

				treeState.toggleSelection(item());
				break;
			}
			case "Escape": {
				treeState.selectedIds().clear();
				treeState.clearClipboard();
				break;
			}
			case "*": {
				const owner = item().parent?.node ?? treeState.tree();
				for (const child of owner.children) {
					if (child.type === "folder") {
						treeState.expandedIds().add(child.id);
					}
				}

				// After the items are expanded, the tree's height changes,
				// causing this item to move down. Scroll down to preserve
				// the scroll position relative to this item.
				const rectBefore = event.currentTarget.getBoundingClientRect();
				flushSync();
				const rectAfter = event.currentTarget.getBoundingClientRect();
				window.scrollBy(0, rectAfter.top - rectBefore.top);
				break;
			}
			case "F2": {
				if (item().editable()) {
					editing = true;
				}
				break;
			}
			case "Delete": {
				void treeState.remove(item());
				break;
			}
			case "a": {
				if (isControlOrMeta(event)) {
					treeState.selectAll();
				}
				break;
			}
			case "c": {
				if (isControlOrMeta(event)) {
					treeState.copySelectedToClipboard("copy");
				}
				break;
			}
			case "x": {
				if (isControlOrMeta(event)) {
					treeState.copySelectedToClipboard("cut");
				}
				break;
			}
			case "v": {
				if (isControlOrMeta(event)) {
					void treeState.paste(item());
				}
				break;
			}
			default: {
				return;
			}
		}

		event.preventDefault();
	};

	const handleClick: EventHandler<MouseEvent, HTMLElement> = (event) => {
		if (item().disabled()) {
			return;
		}

		if (isControlOrMeta(event)) {
			treeState.toggleSelection(item());
		} else if (event.shiftKey) {
			treeState.selectUntil(item(), event.currentTarget);
		} else {
			treeState.selectedIds().clear();
			treeState.selectedIds().add(item().node.id);
		}
	};

	const handleDragStart: EventHandler<DragEvent, HTMLElement> = (event) => {
		if (item().disabled()) {
			return;
		}

		if (event.dataTransfer !== null) {
			event.dataTransfer.effectAllowed = "move";
		}

		treeState.setDraggedId(item().node.id);

		if (event.shiftKey) {
			treeState.selectUntil(item(), event.currentTarget);
		} else {
			treeState.selectedIds().add(item().node.id);
		}
	};

	const handleDragOver: EventHandler<DragEvent, HTMLElement> = (event) => {
		if (!canDrop()) {
			clearDropPosition();
			return;
		}

		updateDropPosition(event.currentTarget, event.clientY);

		if (event.dataTransfer !== null) {
			event.dataTransfer.dropEffect = "move";
		}

		event.preventDefault();
	};

	const handleDragLeave: EventHandler<DragEvent, HTMLElement> = (event) => {
		if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) {
			// Skip if the pointer moves to a child element.
			return;
		}

		clearDropPosition();
	};

	const handleDrop: EventHandler<DragEvent, HTMLElement> = (event) => {
		clearDropPosition();

		const draggedId = treeState.draggedId();
		if (draggedId === undefined || !canDrop()) {
			return;
		}

		const position = getLatestDropPosition(
			event.currentTarget.getBoundingClientRect(),
			event.clientY,
		);

		treeState.selectedIds().add(draggedId);
		void treeState.drop(item(), position).then((didDrop) => {
			if (didDrop) {
				treeState.getItemElement(draggedId)?.focus();
			}
		});

		event.preventDefault();
	};

	const handleDragEnd: EventHandler<DragEvent, HTMLElement> = () => {
		treeState.setDraggedId(undefined);
	};

	const childrenArgs: TreeItemChildrenSnippetArgs = {
		editing: () => editing,
		dropPosition,
	};

	$effect(() => {
		return () => {
			treeState.onItemDestroyed(item().node.id);
		};
	});
</script>

<div
	{...rest}
	bind:this={ref}
	id={treeState.getItemElementId(item().node.id)}
	role="treeitem"
	aria-selected={item().selected()}
	aria-expanded={item().node.type === "folder" ? item().expanded() : undefined}
	aria-level={item().depth + 1}
	aria-posinset={item().index + 1}
	aria-setsize={item().parent?.node.children.length ?? treeState.tree().children.length}
	tabindex={treeState.isItemTabbable(item().node.id) ? 0 : -1}
	class={typeof className === "function" ? className(childrenArgs) : className}
	style={typeof style === "function" ? style(childrenArgs) : style}
	onfocusin={composeEventHandlers(onfocusin, handleFocusIn)}
	onkeydown={composeEventHandlers(onkeydown, handleKeyDown)}
	onclick={composeEventHandlers(onclick, handleClick)}
	ondragstart={composeEventHandlers(ondragstart, handleDragStart)}
	ondragover={composeEventHandlers(ondragover, handleDragOver)}
	ondragleave={composeEventHandlers(ondragleave, handleDragLeave)}
	ondrop={composeEventHandlers(ondrop, handleDrop)}
	ondragend={composeEventHandlers(ondragend, handleDragEnd)}
>
	{@render children(childrenArgs)}
</div>
