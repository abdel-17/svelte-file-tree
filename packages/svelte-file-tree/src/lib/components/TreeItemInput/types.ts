import type { HTMLInputAttributes } from "svelte/elements";

export interface TreeItemInputProps extends Omit<HTMLInputAttributes, "children" | "value"> {
	name?: string;
	element?: HTMLInputElement | null;
}
