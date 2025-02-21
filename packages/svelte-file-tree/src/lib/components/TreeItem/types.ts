import type { HTMLDivAttributes, ResolvableTo } from "$lib/internal/types.js";
import type { Snippet } from "svelte";
import type { ClassValue } from "svelte/elements";
import type { DropPosition } from "../Tree/state.svelte.js";

export type { DropPosition };

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
		| "class"
		| "style"
	> {
	children: Snippet<[props: TreeItemChildrenSnippetProps]>;
	editable?: boolean;
	editing?: boolean;
	disabled?: boolean;
	element?: HTMLElement | null;
	class?: ResolvableTo<ClassValue | undefined, [props: TreeItemChildrenSnippetProps]>;
	style?: ResolvableTo<string | undefined, [props: TreeItemChildrenSnippetProps]>;
}
