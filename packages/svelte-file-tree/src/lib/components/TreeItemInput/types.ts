import type { HTMLInputAttributes } from "svelte/elements";

export interface TreeItemInputProps extends Omit<HTMLInputAttributes, "value" | "children"> {
	name?: string;
	element?: HTMLInputElement | null;
}
