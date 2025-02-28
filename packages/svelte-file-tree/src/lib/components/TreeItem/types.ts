import type { HTMLDivAttributes } from "$lib/internal/types.js";
import type { Snippet } from "svelte";
import type { ClassValue } from "svelte/elements";
import type { TreeItemContext } from "./state.svelte.js";

export type { TreeItemContext };

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
	children: Snippet<[context: TreeItemContext]>;
	editable?: boolean;
	editing?: boolean;
	disabled?: boolean;
	element?: HTMLElement | null;
	class?: ClassValue | undefined | ((context: TreeItemContext) => ClassValue | undefined);
	style?: string | undefined | ((context: TreeItemContext) => string | undefined);
}
