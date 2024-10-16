<script lang="ts" module>
	import { findElementById } from "$lib/helpers.js";

	export class TreeViewContext {
		#elementId: () => string | null | undefined;
		tabbableId: string | undefined = $state();
		shouldSelectOnNextFocus = true;
		shouldClearSelectionOnNextFocusOut = true;

		constructor(elementId: () => string | null | undefined) {
			this.#elementId = elementId;
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

	const context = new TreeViewContext(() => id);
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
