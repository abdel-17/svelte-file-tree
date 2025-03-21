import type { HTMLDivAttributes } from "$lib/internal/types.js";
import type { Snippet } from "svelte";
import type { ClassValue } from "svelte/elements";
import type { DropPosition } from "../Tree/types.js";

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
	ref?: HTMLElement | null;
	class?: ClassValue | undefined | ((args: TreeItemChildrenSnippetArgs) => ClassValue | undefined);
	style?: string | undefined | ((args: TreeItemChildrenSnippetArgs) => string | undefined);
}
