import type { HTMLDivAttributes } from "$lib/internal/types.js";
import type { Snippet } from "svelte";

export interface TreeItemProps extends Omit<HTMLDivAttributes, "children"> {
	children: Snippet;
	editable?: boolean;
	element?: HTMLDivElement | null;
}
