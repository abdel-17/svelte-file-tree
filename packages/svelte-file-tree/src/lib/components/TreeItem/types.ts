import type { HTMLDivAttributes } from "$lib/internal/types.js";
import type { Snippet } from "svelte";
import type { ClassValue } from "svelte/elements";
import type { DropPosition } from "../Tree/state.svelte.js";

export type { DropPosition };

export type TreeItemChildrenSnippetArgs = {
	editing: () => boolean;
	dropPosition: () => DropPosition | undefined;
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
	children: Snippet<[args: TreeItemChildrenSnippetArgs]>;
	editing?: boolean;
	class?:
		| ClassValue
		| null
		| undefined
		| ((args: TreeItemChildrenSnippetArgs) => ClassValue | null | undefined);
	style?:
		| string
		| null
		| undefined
		| ((args: TreeItemChildrenSnippetArgs) => string | null | undefined);
	ref?: HTMLElement | null;
}
