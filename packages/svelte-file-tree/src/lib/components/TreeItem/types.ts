import type { HTMLDivAttributes } from "$lib/internal/types.js";
import type { Snippet } from "svelte";

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
	children: Snippet;
	element?: HTMLElement | null;
}
