import type { Snippet } from "svelte";
import type { HTMLAttributes, HTMLInputAttributes } from "svelte/elements";
import type { LinkedTree, LinkedTreeItem } from "./tree.svelte.js";

export type HTMLDivAttributes = HTMLAttributes<HTMLDivElement>;

export type OmitChildren<T> = Omit<T, "children">;

export interface TreeProps<TValue> extends OmitChildren<HTMLDivAttributes> {
	tree: LinkedTree<TValue>;
	item: Snippet<[LinkedTreeItem<TValue>, number]>;
	element?: HTMLDivElement | null;
}

export interface TreeItemProps<TValue> extends OmitChildren<HTMLDivAttributes> {
	item: LinkedTreeItem<TValue>;
	index: number;
	children: Snippet<[{ editing: boolean }]>;
	editable?: boolean;
	editing?: boolean;
	draggable?: boolean;
	element?: HTMLDivElement | null;
}

export interface TreeItemInputProps extends OmitChildren<HTMLInputAttributes> {
	value: string;
	element?: HTMLInputElement | null;
	onCommit?: (value: string) => void;
	onRollback?: (value: string) => void;
}
