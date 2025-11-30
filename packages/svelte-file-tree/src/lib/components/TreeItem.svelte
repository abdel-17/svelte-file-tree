<script
	lang="ts"
	generics="TFile extends FileNode = FileNode, TFolder extends FolderNode<TFile | TFolder> = DefaultTFolder<TFile>"
>
	import type { EventHandler } from "svelte/elements";
	import { isControlOrMeta } from "$lib/internal/helpers.js";
	import type { DefaultTFolder, FileNode, FolderNode, TreeItemState } from "$lib/tree.svelte.js";
	import { getTreeContext } from "./Tree.svelte";
	import type { TreeItemProps } from "./types.js";

	const treeContext = getTreeContext<TFile, TFolder>();

	let {
		children,
		item,
		order,
		ref = $bindable(null),
		onfocusin,
		onkeydown,
		onclick,
		...rest
	}: TreeItemProps<TFile, TFolder> = $props();

	const tabindex = $derived.by(() => {
		const tabbableId = treeContext.getTabbableId() ?? treeContext.getRoot().children[0]!.id;
		return tabbableId === item.node.id ? 0 : -1;
	});

	const handleFocusIn: EventHandler<FocusEvent, HTMLDivElement> = (event) => {
		onfocusin?.(event);
		treeContext.setTabbableId(item.node.id);
	};

	const handleKeyDown: EventHandler<KeyboardEvent, HTMLDivElement> = (event) => {
		onkeydown?.(event);

		if (event.defaultPrevented || event.target !== event.currentTarget || item.disabled) {
			return;
		}

		const isRtl = getComputedStyle(event.currentTarget).direction === "rtl";
		const arrowRight = isRtl ? "ArrowLeft" : "ArrowRight";
		const arrowLeft = isRtl ? "ArrowRight" : "ArrowLeft";

		switch (event.key) {
			case arrowRight: {
				if (item.node.type === "file") {
					break;
				}

				if (!item.expanded) {
					treeContext.getExpandedIds().add(item.node.id);
					break;
				}

				const nextOrder = order + 1;
				if (nextOrder < treeContext.getVisibleItems().length) {
					treeContext.focusItem(nextOrder);
				}
				break;
			}
			case arrowLeft: {
				if (item.node.type === "folder" && item.expanded) {
					treeContext.getExpandedIds().delete(item.node.id);
					break;
				}

				if (item.parent?.visible) {
					const parentOrder = treeContext.getVisibleItems().indexOf(item.parent);
					treeContext.focusItem(parentOrder);
				}
				break;
			}
			case "ArrowDown":
			case "ArrowUp": {
				const nextOrder = event.key === "ArrowDown" ? order + 1 : order - 1;
				const next = treeContext.getVisibleItems()[nextOrder];
				if (next === undefined) {
					break;
				}

				if (event.shiftKey) {
					treeContext.getSelectedIds().add(item.node.id).add(next.node.id);
				} else if (!isControlOrMeta(event)) {
					const selectedIds = treeContext.getSelectedIds();
					selectedIds.clear();
					selectedIds.add(next.node.id);
				}

				treeContext.focusItem(nextOrder);
				break;
			}
			case "PageDown":
			case "PageUp": {
				const visibleItems = treeContext.getVisibleItems();
				const selectedIds = treeContext.getSelectedIds();

				const offset = event.key === "PageDown" ? 1 : -1;
				const shouldSelectMultiple = event.shiftKey && isControlOrMeta(event);

				const maxScrollDistance = Math.min(
					treeContext.getRef()!.clientHeight,
					document.documentElement.clientHeight,
				);
				const itemRect = event.currentTarget.getBoundingClientRect();

				let current = item;
				let currentElement: HTMLElement = event.currentTarget;
				for (let i = order + offset; 0 <= i && i < visibleItems.length; i += offset) {
					const next = visibleItems[i]!;
					const nextElement = treeContext.getItemElement(next.node.id);
					if (nextElement === null) {
						break;
					}

					const nextRect = nextElement.getBoundingClientRect();
					const distance = Math.abs(nextRect.top - itemRect.top);
					if (distance > maxScrollDistance) {
						break;
					}

					if (shouldSelectMultiple) {
						selectedIds.add(current.node.id);
					}

					current = next;
					currentElement = nextElement;
				}

				if (current === item) {
					break;
				}

				if (shouldSelectMultiple) {
					selectedIds.add(current.node.id);
				} else {
					selectedIds.clear();
					selectedIds.add(current.node.id);
				}

				currentElement.focus();
				break;
			}
			case "Home":
			case "End": {
				const visibleItems = treeContext.getVisibleItems();
				const lastOrder = event.key === "End" ? visibleItems.length - 1 : 0;
				const last = visibleItems[lastOrder]!;
				if (item === last) {
					break;
				}

				if (event.shiftKey && isControlOrMeta(event)) {
					const selectedIds = treeContext.getSelectedIds();
					const offset = event.key === "End" ? 1 : -1;
					for (let i = order; 0 <= i && i < visibleItems.length; i += offset) {
						selectedIds.add(visibleItems[i]!.node.id);
					}
				} else {
					const selectedIds = treeContext.getSelectedIds();
					selectedIds.clear();
					selectedIds.add(last.node.id);
				}

				treeContext.focusItem(lastOrder);
				break;
			}
			case " ": {
				if (event.shiftKey) {
					treeContext.selectUntil(order);
				} else {
					treeContext.toggleSelection(item);
				}
				break;
			}
			case "Escape": {
				treeContext.getSelectedIds().clear();
				treeContext.getClipboardIds().clear();
				treeContext.setPasteOperation(undefined);
				break;
			}
			case "*": {
				const expandedIds = treeContext.getExpandedIds();
				const owner = item.parent?.node ?? treeContext.getRoot();
				for (const child of owner.children) {
					if (child.type === "folder") {
						expandedIds.add(child.id);
					}
				}
				break;
			}
			case "Delete": {
				treeContext.remove(order);
				break;
			}
			case "a": {
				if (!isControlOrMeta(event)) {
					break;
				}

				const selectedIds = treeContext.getSelectedIds();
				for (const item of treeContext.getVisibleItems()) {
					selectedIds.add(item.node.id);
				}
				break;
			}
			case "c":
			case "x": {
				if (!isControlOrMeta(event)) {
					break;
				}

				const clipboardIds = treeContext.getClipboardIds();
				clipboardIds.clear();
				for (const id of treeContext.getSelectedIds()) {
					clipboardIds.add(id);
				}
				clipboardIds.add(item.node.id);

				treeContext.setPasteOperation(event.key === "c" ? "copy" : "cut");
				break;
			}
			case "v":
			case "V": {
				if (!isControlOrMeta(event)) {
					break;
				}

				const pasteOperation = treeContext.getPasteOperation();
				if (pasteOperation === undefined) {
					break;
				}

				let destination;
				switch (item.node.type) {
					case "file": {
						destination = item.parent;
						break;
					}
					case "folder": {
						if (event.shiftKey) {
							destination = item.parent;
						} else {
							destination = item as TreeItemState<TFile, TFolder, TFolder>;
						}
						break;
					}
				}

				if (pasteOperation === "cut") {
					let nearestCopied;
					for (let item = destination; item !== undefined; item = item.parent) {
						if (item.inClipboard) {
							nearestCopied = item;
							break;
						}
					}

					if (destination !== undefined && nearestCopied !== undefined) {
						treeContext.onCircularReference({
							source: nearestCopied,
							destination: destination,
						});
						break;
					}
				}

				treeContext.paste(destination).then((didPaste) => {
					if (didPaste && item.visible) {
						treeContext.focusItem(order);
					}
				});
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

		if (event.defaultPrevented || item.disabled) {
			return;
		}

		if (event.shiftKey) {
			treeContext.selectUntil(order);
		} else if (isControlOrMeta(event)) {
			treeContext.toggleSelection(item);
		} else {
			const selectedIds = treeContext.getSelectedIds();
			selectedIds.clear();
			selectedIds.add(item.node.id);
		}
	};

	$effect(() => {
		return () => {
			if (treeContext.getTabbableId() === item.node.id) {
				treeContext.setTabbableId(undefined);
			}
		};
	});
</script>

<div
	{...rest}
	bind:this={ref}
	id={treeContext.getItemElementId(item.node.id)}
	role="treeitem"
	aria-selected={item.selected}
	aria-expanded={item.node.type === "folder" && item.node.children.length !== 0
		? item.expanded
		: undefined}
	aria-level={item.depth + 1}
	aria-posinset={item.nodeIndex + 1}
	aria-setsize={item.parent?.node.children.length ?? treeContext.getRoot().children.length}
	aria-disabled={item.disabled}
	{tabindex}
	onfocusin={handleFocusIn}
	onkeydown={handleKeyDown}
	onclick={handleClick}
>
	{@render children()}
</div>
