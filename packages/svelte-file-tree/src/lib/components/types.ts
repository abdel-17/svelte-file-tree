import type { Snippet } from "svelte";
import type { HTMLAttributes, HTMLInputAttributes } from "svelte/elements";
import type { LinkedTree, LinkedTreeItem } from "./tree.svelte.js";

export type HTMLDivAttributes = HTMLAttributes<HTMLDivElement>;

export type OmitChildren<T> = Omit<T, "children">;

export interface TreeProps extends OmitChildren<HTMLDivAttributes> {
	tree: LinkedTree;
	item: Snippet<[LinkedTreeItem, number]>;
	element?: HTMLDivElement | null;
}

export interface TreeItemProps extends OmitChildren<HTMLDivAttributes> {
	item: LinkedTreeItem;
	index: number;
	children: Snippet<[{ editing: boolean }]>;
	editable?: boolean;
	editing?: boolean;
	draggable?: boolean;
	element?: HTMLDivElement | null;
}

export interface TreeItemNameInputProps
	extends OmitChildren<HTMLInputAttributes> {
	value?: string;
	element?: HTMLInputElement | null;
	onCommit?: (name: string) => void;
	onRollback?: (name: string) => void;
	onError?: (error: TreeItemNameInputError) => void;
}

export type TreeItemNameInputError =
	| {
			reason: "empty";
	  }
	| {
			reason: "duplicate";
			name: string;
	  };
