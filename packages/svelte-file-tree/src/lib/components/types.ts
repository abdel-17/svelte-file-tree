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

export type PasteOperation = "copy" | "cut";

export type OnCircularReferenceArgs<T> = {
	source: TreeItemState<T>;
	destination: TreeItemState<T>;
};

export type OnCopyArgs<T> = {
	sources: TreeItemState<T>[];
	destination: TreeItemState<T> | undefined;
};

export type OnCutArgs<T> = {
	sources: TreeItemState<T>[];
	destination: TreeItemState<T> | undefined;
};

export type OnRemoveArgs<T> = {
	removed: TreeItemState<T>[];
	nearestRemaining: TreeItemState<T> | undefined;
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
	defaultClipboardIds?: Iterable<string>;
	clipboardIds?: SvelteSet<string>;
	pasteOperation?: PasteOperation;
	ref?: HTMLDivElement | null;
	onFocus?: (item: TreeItemState<T>) => void;
	onCircularReference?: (args: OnCircularReferenceArgs<T>) => void;
	onCopy?: (args: OnCopyArgs<T>) => void;
	onCut?: (args: OnCutArgs<T>) => void;
	onRemove?: (args: OnRemoveArgs<T>) => void;
	children?: Snippet<[args: TreeChildrenSnippetArgs<T>]>;
}

export type TreeRemoveMethodOptions = {
	includeSelected?: boolean;
};

export interface TreeItemProps<T> extends HTMLAttributes<HTMLDivElement> {
	item: TreeItemState<T>;
	disabled?: boolean;
	ref?: HTMLDivElement | null;
	children?: Snippet;
}
