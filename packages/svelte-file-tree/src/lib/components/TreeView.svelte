<script lang="ts" module>
	import { findElementById } from "$lib/helpers.js";

	export class TreeViewContext<Value = unknown> {
		#tree: () => Tree<Value>;
		#elementId: () => string | null | undefined;
		tabbableId: string | undefined = $state();
		shouldSelectOnNextFocus = true;
		shouldClearSelectionOnNextBlur = true;

		constructor(
			tree: () => Tree<Value>,
			elementId: () => string | null | undefined,
		) {
			this.#tree = tree;
			this.#elementId = elementId;
		}

		get tree(): Tree<Value> {
			return this.#tree();
		}

		readonly elementId: string = $derived.by(() => {
			const elementId = this.#elementId();
			if (elementId == null) {
				return crypto.randomUUID();
			}
			return elementId;
		});

		findElement(): HTMLElement {
			return findElementById(this.elementId);
		}

		getItemElementId(nodeId: string): string {
			return `${this.elementId}:${nodeId}`;
		}

		findItemElement(nodeId: string): HTMLElement {
			return findElementById(this.getItemElementId(nodeId));
		}

		onFocus(nodeId: string) {
			if (this.shouldSelectOnNextFocus) {
				this.tree.selectedIds.add(nodeId);
			} else {
				// Reset back to the default behavior.
				this.shouldSelectOnNextFocus = true;
			}
		}

		onBlur() {
			if (this.shouldClearSelectionOnNextBlur) {
				this.tree.selectedIds.clear();
			} else {
				// Reset back to the default behavior.
				this.shouldClearSelectionOnNextBlur = true;
			}
		}

		static key = Symbol("TreeViewContext");
	}
</script>

<script lang="ts" generics="Value">
	import { setContext, type Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import type { Tree, TreeNode } from "./tree.svelte.js";

	type BaseProps = Omit<
		HTMLAttributes<HTMLDivElement>,
		"role" | "aria-multiselectable" | "children"
	>;

	interface Props extends BaseProps {
		tree: Tree<Value>;
		item: Snippet<[TreeNode<Value>]>;
		ref?: HTMLDivElement;
	}

	let { tree, item, ref = $bindable(), id, ...props }: Props = $props();

	const context = new TreeViewContext(
		() => tree,
		() => id,
	);
	setContext(TreeViewContext.key, context);
</script>

<div
	{...props}
	bind:this={ref}
	id={context.elementId}
	role="tree"
	aria-multiselectable="true"
	data-tree-view=""
>
	{#each tree as node (node.id)}
		{@render item(node)}
	{/each}
</div>
