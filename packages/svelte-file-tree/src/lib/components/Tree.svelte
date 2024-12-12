<script lang="ts" module>
	import type { FileTree, FileTreeNode } from "$lib/tree.svelte.js";
	import type { HTMLDivAttributes } from "$lib/types.js";
	import type { Snippet } from "svelte";
	import TreeItemProvider from "./TreeItemProvider.svelte";

	export type EnumeratedTreeItem = {
		readonly node: FileTreeNode;
		readonly index: number;
	};

	export class TreeState {
		readonly #id: () => string;
		readonly #items = new Map<string, EnumeratedTreeItem>();
		#tabbableId?: string = $state.raw();
		#draggedId?: string = $state.raw();

		constructor(id: () => string) {
			this.#id = id;
		}

		get id(): string {
			return this.#id();
		}

		get tabbableId(): string | undefined {
			return this.#tabbableId;
		}

		get draggedId(): string | undefined {
			return this.#draggedId;
		}

		getItemElementId(node: FileTreeNode): string {
			return `${this.id}:${node.id}`;
		}

		getItemElement(node: FileTreeNode): HTMLElement | null {
			const elementId = this.getItemElementId(node);
			return document.getElementById(elementId);
		}

		getItem(id: string): EnumeratedTreeItem | undefined {
			return this.#items.get(id);
		}

		onSetItem(item: EnumeratedTreeItem): void {
			this.#items.set(item.node.id, item);
		}

		onDestroyItem(id: string): void {
			if (this.#tabbableId === id) {
				this.#tabbableId = undefined;
			}

			if (this.#draggedId === id) {
				this.#draggedId = undefined;
			}
		}

		onFocusInItem(node: FileTreeNode): void {
			this.#tabbableId = node.id;
		}

		onDragStartItem(node: FileTreeNode): void {
			this.#draggedId = node.id;
		}

		onDragEndItem(): void {
			this.#draggedId = undefined;
		}
	}
</script>

<script lang="ts">
	interface Props extends Omit<HTMLDivAttributes, "children"> {
		tree: FileTree;
		item: Snippet<[node: FileTreeNode, index: number]>;
		id?: string;
		element?: HTMLDivElement | null;
	}

	let {
		tree,
		item,
		id = crypto.randomUUID(),
		element = $bindable(null),
		...attributes
	}: Props = $props();

	const treeState = new TreeState(() => id);
</script>

{#snippet items(nodes: FileTreeNode[])}
	{#each nodes as node, index (node.id)}
		<TreeItemProvider {treeState} {node} {index}>
			{@render item(node, index)}
		</TreeItemProvider>

		{#if node.isFolder() && node.expanded}
			{@render items(node.children)}
		{/if}
	{/each}
{/snippet}

<div {...attributes} bind:this={element} {id} role="tree" aria-multiselectable="true">
	{@render items(tree.nodes)}
</div>
