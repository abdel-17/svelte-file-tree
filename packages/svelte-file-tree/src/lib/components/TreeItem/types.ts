import type { HTMLDivAttributes } from "$lib/internal/types.js";
import type { Snippet } from "svelte";

export declare namespace TreeItemProps {
	type DropPosition = "before" | "inside" | "after";

	type ChildrenSnippetProps = {
		editing: boolean;
		dragged: boolean;
		dropPosition: DropPosition | undefined;
	};
}

export interface TreeItemProps
	extends Omit<
		HTMLDivAttributes,
		| "children"
		| "role"
		| "aria-selected"
		| "aria-expanded"
		| "aria-level"
		| "aria-posinset"
		| "aria-setsize"
		| "tabindex"
	> {
	children: Snippet<[props: TreeItemProps.ChildrenSnippetProps]>;
	editable?: boolean;
	editing?: boolean;
}
