<script lang="ts" context="module">
	const kbd = {
		ARROW_LEFT: "ArrowLeft",
		ARROW_RIGHT: "ArrowRight",
		ARROW_DOWN: "ArrowDown",
		ARROW_UP: "ArrowUp",
		ENTER: "Enter",
		SPACE: " ",
	};
</script>

<script lang="ts">
	import type { Tree } from "$lib/helpers/tree.js";
	import ChevronRight from "lucide-svelte/icons/chevron-right";

	export let expandedIds: Set<string>;
	export let selectedIds: Set<string>;
	export let focusableId: string | null;
	export let nodes: Tree<string>[];
	export let node: Tree<string>;
	export let index: number;

	$: expanded = expandedIds.has(node.id);
	$: selected = selectedIds.has(node.id);
	$: leaf = node.children.length === 0;
	$: focusable = focusableId !== null ? focusableId === node.id : index === 0;

	function expand() {
		expandedIds.add(node.id);
		expanded = expanded;
	}

	function collapse() {
		expandedIds.delete(node.id);
		expanded = expanded;
	}

	function toggleExpansion() {
		if (expanded) {
			collapse();
		} else {
			expand();
		}
	}

	function setSelected() {
		selectedIds.clear();
		selectedIds.add(node.id);
		selected = selected;
	}

	function toggleSelection() {
		if (selected) {
			selectedIds.delete(node.id);
		} else {
			selectedIds.add(node.id);
		}
		selected = selected;
	}

	function getTreeItemId(node: Tree<string>) {
		return `treeitem-${node.id}`;
	}

	function getTreeItem(node: Tree<string> | undefined) {
		if (node === undefined) {
			return null;
		}
		const id = getTreeItemId(node);
		return document.getElementById(id);
	}

	function handleKeyDown(e: KeyboardEvent & { currentTarget: HTMLDivElement }) {
		switch (e.key) {
			case kbd.ARROW_RIGHT: {
				if (!leaf && !expanded) {
					expand();
				} else {
					getTreeItem(node.children[0])?.focus();
				}
				break;
			}
			case kbd.ARROW_LEFT: {
				if (!leaf && expanded) {
					collapse();
				} else {
					getTreeItem(node.parent)?.focus();
				}
				break;
			}
			case kbd.ARROW_DOWN: {
				getTreeItem(nodes[index + 1])?.focus();
				break;
			}
			case kbd.ARROW_UP: {
				getTreeItem(nodes[index - 1])?.focus();
				break;
			}
			case kbd.ENTER: {
				toggleExpansion();
				break;
			}
			case kbd.SPACE: {
				toggleSelection();
				break;
			}
			default: {
				return;
			}
		}

		e.preventDefault();
		e.stopPropagation();
	}
</script>

<div
	id={getTreeItemId(node)}
	role="treeitem"
	aria-level={node.level}
	aria-setsize={node.parent?.children.length ?? 1}
	aria-posinset={node.index + 1}
	aria-expanded={leaf ? undefined : expanded}
	aria-selected={selected}
	tabindex={focusable ? 0 : -1}
	class="group transition-colors focus:outline focus:outline-2 focus:outline-blue-700 aria-selected:bg-blue-100"
	on:click={(e) => {
		if (e.metaKey) {
			toggleSelection();
		} else {
			setSelected();
		}
	}}
	on:keydown={handleKeyDown}
	on:focus={() => {
		// Only one tree item should be focusable at a time.
		focusableId = node.id;
	}}
>
	<button
		tabindex={-1}
		class:invisible={leaf}
		class="inline-flex h-8 w-8 items-center justify-center align-middle"
		on:click={(e) => {
			toggleExpansion();
			e.currentTarget.parentElement?.focus();
			e.stopPropagation();
		}}
		on:pointerdown={(e) => {
			// Prevent the tree item from losing focus.
			e.preventDefault();
		}}
	>
		<ChevronRight
			size={16}
			strokeWidth={2.5}
			class="transition-transform duration-300 group-focus:text-blue-700 group-aria-expanded:rotate-90"
		/>
	</button>
	<span class="align-middle">{node.value}</span>
</div>
