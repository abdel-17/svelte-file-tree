<script lang="ts">
	import { isControlOrMeta } from "$lib/internal/helpers.js";
	import { flushSync } from "svelte";
	import type { EventHandler } from "svelte/elements";
	import {
		type TreeContext,
		getTreeContext,
		getTreeItemProviderContext,
	} from "../Tree/context.svelte.js";
	import { setTreeItemContext } from "./context.svelte.js";
	import { DropPositionState } from "./state.svelte.js";
	import type { TreeItemProps } from "./types.js";

	const {
		tree,
		lookup,
		tabbable,
		dragged,
		getChildren,
		getNextItem,
		getPreviousItem,
		selectUntil,
	} = getTreeContext();
	const { node, index, depth, parent } = getTreeItemProviderContext();

	let {
		children,
		editable = false,
		editing = $bindable(false),
		onfocusin,
		onkeydown,
		onclick,
		ondragstart,
		ondragenter,
		ondragover,
		ondragleave,
		ondrop,
		ondragend,
		...attributes
	}: TreeItemProps = $props();

	const dropPosition = new DropPositionState({ node });

	setTreeItemContext({
		onEditingChange(value) {
			editing = value;
		},
	});

	const handleFocusIn: EventHandler<FocusEvent, HTMLDivElement> = (event) => {
		onfocusin?.(event);

		tabbable.set(node.current);
	};

	const handleKeyDown: EventHandler<KeyboardEvent, HTMLDivElement> = (event) => {
		onkeydown?.(event);

		if (event.target !== event.currentTarget) {
			// Don't handle keydown events that bubble up from elements inside
			// like inputs and buttons to avoid conflicting with their behavior.
			return;
		}

		switch (event.key) {
			case "ArrowRight": {
				if (node.current.type === "file") {
					break;
				}

				if (!node.current.expanded) {
					node.current.expand();
				} else if (node.current.children.length !== 0) {
					node.current.children[0].element?.focus();
				}
				break;
			}
			case "ArrowLeft": {
				if (node.current.type === "folder" && node.current.expanded) {
					node.current.collapse();
				} else {
					parent.current?.node.element?.focus();
				}
				break;
			}
			case "ArrowDown":
			case "ArrowUp": {
				const current = {
					node: node.current,
					index: index.current,
					parent: parent.current,
				};
				const next = event.key === "ArrowDown" ? getNextItem(current) : getPreviousItem(current);
				if (next === undefined || next.node.element === null) {
					break;
				}

				if (event.shiftKey) {
					node.current.select();
					next.node.select();
				}

				next.node.element.focus();
				break;
			}
			case "PageDown":
			case "PageUp": {
				if (tree.current.element === null) {
					break;
				}

				const navigate = event.key === "PageDown" ? getNextItem : getPreviousItem;
				const maxScrollDistance = Math.min(
					tree.current.element.clientHeight,
					document.documentElement.clientHeight,
				);
				const itemRect = event.currentTarget.getBoundingClientRect();

				let current = {
					node: node.current,
					index: index.current,
					parent: parent.current,
				};
				let currentElement: HTMLElement = event.currentTarget;
				while (true) {
					const next = navigate(current);
					if (next === undefined || next.node.element === null) {
						break;
					}

					const nextRect = next.node.element.getBoundingClientRect();
					const distance = Math.abs(nextRect.top - itemRect.top);
					if (distance > maxScrollDistance) {
						break;
					}

					if (event.shiftKey) {
						current.node.select();
					}

					current = next;
					currentElement = next.node.element;
				}

				if (current.node === node.current) {
					break;
				}

				if (event.shiftKey) {
					current.node.select();
				}

				currentElement.focus();
				break;
			}
			case "Home": {
				const first = tree.current.children[0];
				if (first === node.current || first.element === null) {
					break;
				}

				if (event.shiftKey && isControlOrMeta(event)) {
					let current: TreeContext.Item | undefined = {
						node: node.current,
						index: index.current,
						parent: parent.current,
					};
					do {
						current.node.select();
						current = getPreviousItem(current);
					} while (current !== undefined);
				}

				first.element.focus();
				break;
			}
			case "End": {
				let last = tree.current.children.at(-1)!;
				while (last.type === "folder" && last.expanded && last.children.length !== 0) {
					last = last.children.at(-1)!;
				}

				if (last === node.current || last.element === null) {
					break;
				}

				if (event.shiftKey && isControlOrMeta(event)) {
					let current: TreeContext.Item | undefined = {
						node: node.current,
						index: index.current,
						parent: parent.current,
					};
					do {
						current.node.select();
						current = getNextItem(current);
					} while (current !== undefined);
				}

				last.element.focus();
				break;
			}
			case " ": {
				if (event.shiftKey) {
					selectUntil({
						node: node.current,
						element: event.currentTarget,
					});
				} else {
					node.current.toggleSelected();
				}
				break;
			}
			case "Escape": {
				tree.current.selectedIds.clear();
				tree.current.clipboard.clear();
				break;
			}
			case "*": {
				const siblings = getChildren(parent.current);
				for (const sibling of siblings) {
					if (sibling.type === "folder") {
						sibling.expand();
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
				if (!editable) {
					break;
				}

				editing = true;
				break;
			}
			case "Delete": {
				// TODO:
				break;
			}
			case "a": {
				if (!isControlOrMeta(event)) {
					break;
				}

				tree.current.selectAll();
				break;
			}
			case "c": {
				if (!isControlOrMeta(event)) {
					break;
				}

				tree.current.clipboard.set({
					action: "copy",
					ids: tree.current.selectedIds,
				});
				break;
			}
			case "x": {
				if (!isControlOrMeta(event)) {
					break;
				}

				tree.current.clipboard.set({
					action: "cut",
					ids: tree.current.selectedIds,
				});
				break;
			}
			case "v": {
				if (!isControlOrMeta(event)) {
					break;
				}

				// TODO:
				break;
			}
			default: {
				return;
			}
		}

		event.preventDefault();
	};

	const handleClick: EventHandler<MouseEvent, HTMLDivElement> = (event) => {
		onclick?.(event);

		if (isControlOrMeta(event)) {
			node.current.toggleSelected();
		} else if (event.shiftKey) {
			selectUntil({
				node: node.current,
				element: event.currentTarget,
			});
		} else {
			tree.current.selectedIds.clear();
			node.current.select();
		}
	};

	const handleDragStart: EventHandler<DragEvent, HTMLDivElement> = (event) => {
		ondragstart?.(event);

		dragged.set(node.current);

		if (event.dataTransfer !== null) {
			event.dataTransfer.effectAllowed = "move";
		}
	};

	const handleDragEnter: EventHandler<DragEvent, HTMLDivElement> = (event) => {
		ondragenter?.(event);

		// Avoid a circular reference.
		if (dragged.id === undefined || dragged.id === node.current.id) {
			return;
		}

		for (let ancestor = parent.current; ancestor !== undefined; ancestor = ancestor.parent) {
			// Avoid a circular reference.
			if (dragged.id === ancestor.node.id || ancestor.node.selected) {
				return;
			}
		}

		dropPosition.update({
			rect: event.currentTarget.getBoundingClientRect(),
			clientY: event.clientY,
		});

		if (event.dataTransfer !== null) {
			event.dataTransfer.dropEffect = "move";
		}

		event.preventDefault();
	};

	// The dragover event fires at a high rate, so computing
	// the drop position needs to be throttled to avoid jank.
	let dragOverThrottled = false;

	const handleDragOver: EventHandler<DragEvent, HTMLDivElement> = (event) => {
		ondragover?.(event);

		if (dropPosition.current === undefined) {
			return;
		}

		if (event.dataTransfer !== null) {
			event.dataTransfer.dropEffect = "move";
		}

		event.preventDefault();

		if (dragOverThrottled) {
			return;
		}

		// Destructure the event early because `event.currentTarget`
		// is set to `null` after the event is handled.
		const { currentTarget, clientY } = event;

		dragOverThrottled = true;
		window.requestAnimationFrame(() => {
			if (dropPosition.current !== undefined) {
				dropPosition.update({
					rect: currentTarget.getBoundingClientRect(),
					clientY,
				});
			}

			dragOverThrottled = false;
		});
	};

	const handleDragLeave: EventHandler<DragEvent, HTMLDivElement> = (event) => {
		ondragleave?.(event);

		const { currentTarget, relatedTarget } = event;
		if (relatedTarget instanceof Node && currentTarget.contains(relatedTarget)) {
			return;
		}

		dropPosition.clear();
	};

	const handleDrop: EventHandler<DragEvent, HTMLDivElement> = (event) => {
		ondrop?.(event);

		// TODO:
		dropPosition.clear();
	};

	const handleDragEnd: EventHandler<DragEvent, HTMLDivElement> = (event) => {
		ondragend?.(event);

		dragged.clear();
	};
</script>

<div
	{...attributes}
	bind:this={node.current._element}
	role="treeitem"
	aria-selected={node.current.selected}
	aria-expanded={node.current.type === "folder" ? node.current.expanded : undefined}
	aria-level={depth.current + 1}
	aria-posinset={index.current + 1}
	aria-setsize={getChildren(parent.current).length}
	tabindex={tabbable.id === node.current.id ? 0 : -1}
	onfocusin={handleFocusIn}
	onkeydown={handleKeyDown}
	onclick={handleClick}
	ondragstart={handleDragStart}
	ondragenter={handleDragEnter}
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
	ondragend={handleDragEnd}
>
	{@render children({
		editing,
		dragged: dragged.id === node.current.id,
		dropPosition: dropPosition.current,
	})}
</div>
