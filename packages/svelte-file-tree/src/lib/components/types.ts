import type { Range, ScrollToOptions } from "@tanstack/virtual-core";
import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { SvelteSet } from "svelte/reactivity";
import type {
	DefaultTFolder,
	FileNode,
	FileTree,
	FolderNode,
	TreeItemState,
} from "$lib/tree.svelte.js";

export type MaybePromise<T> = T | Promise<T>;

export type TreeChildrenSnippetArgs<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile | TFolder> = DefaultTFolder<TFile>,
> = {
	items: Array<TreeItemState<TFile, TFolder>>;
	visibleItems: Array<TreeItemState<TFile, TFolder>>;
};

export type PasteOperation = "copy" | "cut";

export type OnResolveNameConflictArgs<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile | TFolder> = DefaultTFolder<TFile>,
> = {
	operation: "copy" | "move";
	destination: TreeItemState<TFile, TFolder, TFolder> | undefined;
	name: string;
};

export type NameConflictResolution = "skip" | "cancel";

export type OnCircularReferenceArgs<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile | TFolder> = DefaultTFolder<TFile>,
> = {
	source: TreeItemState<TFile, TFolder, TFolder>;
	destination: TreeItemState<TFile, TFolder, TFolder>;
};

export type OnCopyArgs<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile | TFolder> = DefaultTFolder<TFile>,
> = {
	sources: Array<TreeItemState<TFile, TFolder>>;
	copies: Array<TFile | TFolder>;
	destination: TreeItemState<TFile, TFolder, TFolder> | undefined;
};

export type OnMoveArgs<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile | TFolder> = DefaultTFolder<TFile>,
> = {
	sources: Array<TreeItemState<TFile, TFolder>>;
	destination: TreeItemState<TFile, TFolder, TFolder> | undefined;
};

export type OnRemoveArgs<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile | TFolder> = DefaultTFolder<TFile>,
> = {
	removed: Array<TreeItemState<TFile, TFolder>>;
};

export interface TreeProps<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile | TFolder> = DefaultTFolder<TFile>,
> extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "role" | "aria-multiselectable"> {
	children: Snippet<[args: TreeChildrenSnippetArgs<TFile, TFolder>]>;
	root: FileTree<TFile | TFolder>;
	defaultSelectedIds?: Iterable<string>;
	selectedIds?: SvelteSet<string>;
	defaultExpandedIds?: Iterable<string>;
	expandedIds?: SvelteSet<string>;
	defaultClipboardIds?: Iterable<string>;
	clipboardIds?: SvelteSet<string>;
	pasteOperation?: PasteOperation;
	ref?: HTMLDivElement | null;
	isItemDisabled?: (node: TFile | TFolder) => boolean;
	isItemHidden?: (node: TFile | TFolder) => boolean;
	copyNode?: (node: TFile | TFolder) => TFile | TFolder;
	shouldClearClipboard?: (operation: PasteOperation) => boolean;
	onResolveNameConflict?: (
		args: OnResolveNameConflictArgs<TFile, TFolder>,
	) => MaybePromise<NameConflictResolution>;
	onCircularReference?: (args: OnCircularReferenceArgs<TFile, TFolder>) => void;
	canCopy?: (args: OnCopyArgs<TFile, TFolder>) => MaybePromise<boolean>;
	onCopy?: (args: OnCopyArgs<TFile, TFolder>) => void;
	canMove?: (args: OnMoveArgs<TFile, TFolder>) => MaybePromise<boolean>;
	onMove?: (args: OnMoveArgs<TFile, TFolder>) => void;
	canRemove?: (args: OnRemoveArgs<TFile, TFolder>) => MaybePromise<boolean>;
	onRemove?: (args: OnRemoveArgs<TFile, TFolder>) => void;
}

export type TreeRemoveMethodOptions = {
	batched?: boolean;
};

export interface TreeItemProps<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile | TFolder> = DefaultTFolder<TFile>,
> extends Omit<
		HTMLAttributes<HTMLDivElement>,
		| "id"
		| "role"
		| "aria-selected"
		| "aria-expanded"
		| "aria-level"
		| "aria-posinset"
		| "aria-setsize"
		| "aria-disabled"
		| "tabindex"
	> {
	children: Snippet;
	item: TreeItemState<TFile, TFolder>;
	order: number;
	ref?: HTMLDivElement | null;
}

export type VirtualListItem<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile | TFolder> = DefaultTFolder<TFile>,
> = {
	item: TreeItemState<TFile, TFolder>;
	order: number;
	key: string;
	size: number;
	start: number;
	end: number;
};

export type VirtualListRange = Range;

export type VirtualListChildrenSnippetArgs<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile | TFolder> = DefaultTFolder<TFile>,
> = {
	treeSize: number;
	virtualItems: Array<VirtualListItem<TFile, TFolder>>;
};

export interface VirtualListProps<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile | TFolder> = DefaultTFolder<TFile>,
> extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	children: Snippet<[args: VirtualListChildrenSnippetArgs<TFile, TFolder>]>;
	estimateSize: (item: TreeItemState<TFile, TFolder>, order: number) => number;
	rangeExtractor?: (range: VirtualListRange) => Array<number>;
	overscan?: number;
	paddingStart?: number;
	paddingEnd?: number;
	scrollPaddingStart?: number;
	scrollPaddingEnd?: number;
	scrollMargin?: number;
	gap?: number;
	ref?: HTMLDivElement | null;
}

export type VirtualListScrollToOptions = ScrollToOptions;
