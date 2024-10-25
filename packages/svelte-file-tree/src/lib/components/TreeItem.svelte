<script lang="ts" generics="Value">
	import { composeEventHandlers } from "$lib/helpers/events.js";
	import { isModifierKey } from "$lib/helpers/platform.js";
	import {
		flushSync,
		getContext,
		hasContext,
		setContext,
		type Snippet,
	} from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { TreeItemContext, TreeViewContext } from "./context.svelte.js";
	import type { TreeNode } from "./tree.svelte.js";

	type BaseProps = Omit<
		HTMLAttributes<HTMLDivElement>,
		| "id"
		| "role"
		| "aria-level"
		| "aria-posinset"
		| "aria-setsize"
		| "aria-expanded"
		| "aria-selected"
		| "hidden"
		| "tabindex"
		| "children"
	>;

	interface Props extends BaseProps {
		node: TreeNode<Value>;
		children: Snippet<[{ editing: boolean }]>;
		editable?: boolean;
		editing?: boolean;
		ref?: HTMLDivElement | null;
	}

	let {
		node,
		children,
		editable = false,
		editing = $bindable(false),
		ref = $bindable(null),
		onkeydown,
		onpointerdown,
		onclick,
		onfocusin,
		...props
	}: Props = $props();

	if (!hasContext(TreeViewContext.key)) {
		throw new Error("<TreeItem> must be used within a <TreeView> component.");
	}
	const treeContext: TreeViewContext = getContext(TreeViewContext.key);

	const itemContext = new TreeItemContext({
		node: () => node,
		editing: () => editing,
		onEditingChange(value) {
			editing = value;
		},
	});
	setContext(TreeItemContext.key, itemContext);

	// The first node in the tree should be initially tabbable with the keyboard.
	treeContext.tabbableId ??= node.id;

	$effect.pre(() => {
		if (!editable) {
			editing = false;
		}
	});

	type WithCurrentTarget<Event> = Event & { currentTarget: HTMLDivElement };

	function handleKeyDown(event: WithCurrentTarget<KeyboardEvent>) {
		if (event.target !== event.currentTarget) {
			// Don't handle keydown events that bubble up from child elements
			// to avoid conflict with the input during editing mode.
			return;
		}

		switch (event.key) {
			case "ArrowRight": {
				if (node.children.length === 0) {
					break;
				}

				if (!node.expanded) {
					node.expand();
				} else {
					node.children[0]!.findElement().focus();
				}
				break;
			}
			case "ArrowLeft": {
				if (node.expanded && node.children.length !== 0) {
					node.collapse();
				} else {
					node.parent?.findElement().focus();
				}
				break;
			}
			case "ArrowDown":
			case "ArrowUp": {
				const down = event.key === "ArrowDown";
				const next = down ? node.next() : node.previous();
				if (next === null) {
					break;
				}

				if (event.shiftKey) {
					node.select();
					next.select();
				}

				next.findElement().focus();
				break;
			}
			case "PageDown":
			case "PageUp": {
				const down = event.key === "PageDown";
				const next = down ? node.next() : node.previous();
				if (next === null) {
					break;
				}

				const treeElement = treeContext.tree.findElement();
				const maxScrollDistance = Math.min(
					treeElement.clientHeight,
					window.innerHeight,
				);
				const itemRect = event.currentTarget.getBoundingClientRect();

				let current = next;
				let currentElement = current.findElement();
				while (true) {
					const next = down ? current.next() : current.previous();
					if (next === null) {
						break;
					}

					current = next;
					currentElement = current.findElement();

					const currentRect = currentElement.getBoundingClientRect();
					const distance = Math.abs(currentRect.top - itemRect.top);
					if (distance >= maxScrollDistance) {
						break;
					}
				}
				currentElement.focus();
				break;
			}
			case "Home": {
				if (!event.shiftKey || !isModifierKey(event)) {
					node.tree.first()!.findElement().focus();
					break;
				}

				let first = true;
				for (const current of node.tree) {
					if (first) {
						current.findElement().focus();
						first = false;
					}

					current.select();

					if (current === node) {
						break;
					}
				}
				break;
			}
			case "End": {
				if (!event.shiftKey || !isModifierKey(event)) {
					node.tree.last()!.findElement().focus();
					return;
				}

				let last = true;
				for (const current of node.tree.reversed()) {
					if (last) {
						current.findElement().focus();
						last = false;
					}

					current.select();

					if (current === node) {
						break;
					}
				}
				break;
			}
			case " ": {
				node.toggleSelection();
				break;
			}
			case "F2": {
				if (editable) {
					editing = true;
				}
				break;
			}
			case "a": {
				if (!isModifierKey(event)) {
					break;
				}

				if (node.tree.allSelected()) {
					node.tree.unselectAll();
				} else {
					node.tree.selectAll();
				}
				break;
			}
			case "*": {
				const element = node.findElement();
				const rectBefore = element.getBoundingClientRect();

				flushSync(() => {
					for (const sibling of node.level()) {
						sibling.expand();
					}
				});

				// When the sibling nodes are all expanded, the tree's height changes,
				// causing a lot of layout shift. Preserve the position of the focused
				// node relative to the viewport to avoid disorienting the user.
				const rectAfter = element.getBoundingClientRect();
				window.scrollBy(0, rectAfter.top - rectBefore.top);
				break;
			}
			default: {
				return;
			}
		}

		event.preventDefault();
	}

	let multiSelectTargetId: string | undefined;

	function handlePointerDown(event: WithCurrentTarget<PointerEvent>) {
		if (event.button === 0 && event.shiftKey) {
			// We can't use `tabbableId` directly in the click handler
			// because the focus event gets triggered first, causing
			// this to be the tabbable element.
			multiSelectTargetId = treeContext.tabbableId;
		}
	}

	function handleClick(event: WithCurrentTarget<MouseEvent>) {
		if (event.button !== 0) {
			return;
		}

		if (isModifierKey(event)) {
			node.toggleSelection();
			return;
		}

		if (!event.shiftKey) {
			node.tree.unselectAll();
			node.select();
			return;
		}

		const multiSelectElementId = treeContext.tree.treeItemElementId(
			multiSelectTargetId!,
		);
		const multiSelectElement = document.getElementById(multiSelectElementId);

		if (multiSelectElement === null) {
			return;
		}

		const multiSelectElementRect = multiSelectElement.getBoundingClientRect();
		const down = multiSelectElementRect.top > event.y;

		let current = node;
		while (true) {
			current.select();

			if (current.id === multiSelectTargetId) {
				break;
			}

			const next = down ? current.next() : current.previous();
			if (next === null) {
				break;
			}
			current = next;
		}
	}

	function handleFocusIn() {
		treeContext.tabbableId = node.id;
	}
</script>

<div
	{...props}
	bind:this={ref}
	id={node.elementId()}
	role="treeitem"
	aria-level={node.depth + 1}
	aria-posinset={node.levelIndex + 1}
	aria-setsize={node.level.length}
	aria-expanded={node.children.length !== 0 ? node.expanded : undefined}
	aria-selected={node.selected}
	tabindex={node.id === treeContext.tabbableId ? 0 : -1}
	data-tree-item=""
	onkeydown={composeEventHandlers(handleKeyDown, onkeydown)}
	onpointerdown={composeEventHandlers(handlePointerDown, onpointerdown)}
	onclick={composeEventHandlers(handleClick, onclick)}
	onfocusin={composeEventHandlers(handleFocusIn, onfocusin)}
>
	{@render children({ editing })}
</div>
