import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { SvelteSet } from "svelte/reactivity";

export type TreeItemState<T> = {
	id: string;
	elementId: string;
	node: T;
	index: number;
	depth: number;
	parent: TreeItemState<T> | undefined;
	parentChildren: T[];
	indexInChildren: number;
	expanded: boolean;
};

export type TreeChildrenSnippetArgs<T> = {
	items: TreeItemState<T>[];
};

export interface TreeProps<T> extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	root: T[];
	getId?: (node: T) => string;
	getChildren?: (node: T) => T[] | undefined;
	hasChildren?: (node: T) => boolean;
	defaultSelectedIds?: Iterable<string>;
	selectedIds?: SvelteSet<string>;
	defaultExpandedIds?: Iterable<string>;
	expandedIds?: SvelteSet<string>;
	ref?: HTMLDivElement | null;
	onFocus?: (item: TreeItemState<T>) => void;
	children?: Snippet<[args: TreeChildrenSnippetArgs<T>]>;
}

export interface TreeItemProps<T> extends HTMLAttributes<HTMLDivElement> {
	item: TreeItemState<T>;
	disabled?: boolean;
	ref?: HTMLDivElement | null;
	children?: Snippet;
}
