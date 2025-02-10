import type { HTMLDivAttributes } from "$lib/internal/types.js";
import type { Snippet } from "svelte";
import type { DropPosition } from "../Tree/state.svelte.js";

export type TreeItemChildrenSnippetProps = {
	editing: boolean;
	dragged: boolean;
	dropPosition: DropPosition | undefined;
};

export interface TreeItemProps
	extends Omit<
		HTMLDivAttributes,
		| "children"
		| "id"
		| "role"
		| "aria-selected"
		| "aria-expanded"
		| "aria-level"
		| "aria-posinset"
		| "aria-setsize"
		| "tabindex"
	> {
	children: Snippet<[props: TreeItemChildrenSnippetProps]>;
	editable?: boolean;
	editing?: boolean;
	element?: HTMLElement | null;
}
