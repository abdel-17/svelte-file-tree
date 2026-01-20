import type { TreeItemData } from "$lib/tree.svelte.js";
import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { SvelteSet } from "svelte/reactivity";

export type PasteOperation = "copy" | "cut";

export type OnCircularReferenceArgs<T> = {
	source: TreeItemData<T>;
	destination: TreeItemData<T>;
};

export type OnCopyArgs<T> = {
	sources: TreeItemData<T>[];
	destination: TreeItemData<T> | undefined;
};

export type OnMoveArgs<T> = {
	sources: TreeItemData<T>[];
	destination: TreeItemData<T> | undefined;
};

export type OnRemoveArgs<T> = {
	removed: TreeItemData<T>[];
	nearestRemaining: TreeItemData<T> | undefined;
};

export type TreeChildrenSnippetArgs<T> = {
	items: TreeItemData<T>[];
};

export interface TreeProps<T> extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	root: T[];
	getItemId?: (data: T) => string;
	getItemChildren?: (data: T) => T[] | undefined;
	hasChildren?: (data: T) => boolean;
	isItemDisabled?: (data: T) => boolean;
	defaultSelectedIds?: Iterable<string>;
	selectedIds?: SvelteSet<string>;
	defaultExpandedIds?: Iterable<string>;
	expandedIds?: SvelteSet<string>;
	defaultClipboardIds?: Iterable<string>;
	clipboardIds?: SvelteSet<string>;
	pasteOperation?: PasteOperation;
	ref?: HTMLDivElement | null;
	onFocus?: (item: TreeItemData<T>) => void;
	onCircularReference?: (args: OnCircularReferenceArgs<T>) => void;
	onCopy?: (args: OnCopyArgs<T>) => void;
	onMove?: (args: OnMoveArgs<T>) => void;
	onRemove?: (args: OnRemoveArgs<T>) => void;
	children?: Snippet<[args: TreeChildrenSnippetArgs<T>]>;
}

export type TreeRemoveMethodOptions = {
	includeSelected?: boolean;
};

export interface TreeItemProps<T> extends HTMLAttributes<HTMLDivElement> {
	item: TreeItemData<T>;
	ref?: HTMLDivElement | null;
	children?: Snippet;
}
