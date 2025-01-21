import type { HTMLDivAttributes } from "$lib/internal/types.js";
import type { Snippet } from "svelte";

export declare namespace TreeItemProps {
	type DropPosition = "before" | "inside" | "after";
}

export interface TreeItemProps
	extends Omit<
		HTMLDivAttributes,
		| "children"
		| "aria-selected"
		| "aria-expanded"
		| "aria-level"
		| "aria-posinset"
		| "aria-setsize"
		| "tabindex"
	> {
	children: Snippet<
		[editing: boolean, dragged: boolean, dropPosition: TreeItemProps.DropPosition | undefined]
	>;
	editable?: boolean;
	editing?: boolean;
}
