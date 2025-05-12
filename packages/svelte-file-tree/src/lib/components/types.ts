import type { Input as DragInput } from "@atlaskit/pragmatic-drag-and-drop/types";
import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { SvelteSet } from "svelte/reactivity";
import type {
	DefaultTFolder,
	FileNode,
	FolderNode,
	TreeClipboard,
	TreeItemState,
} from "$lib/tree.svelte.js";

export type { DragInput };

export type MaybePromise<T> = T | Promise<T>;

export type TreeChildrenSnippetArgs<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile | TFolder> = DefaultTFolder<TFile>,
> = {
	items: Array<TreeItemState<TFile, TFolder>>;
};

export type OnClipboardChangeArgs = {
	clipboard: TreeClipboard | undefined;
};

export type OnChildrenChangeArgs<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile | TFolder> = DefaultTFolder<TFile>,
> = {
	operation: "insert" | "remove";
	target: TFolder;
	children: Array<TFile | TFolder>;
};

export type OnDropDestinationChangeArgs<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile | TFolder> = DefaultTFolder<TFile>,
> = {
	dropDestination: TFolder | undefined;
};

export type OnResolveNameConflictArgs<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile | TFolder> = DefaultTFolder<TFile>,
> = {
	operation: "copy" | "move";
	destination: TFolder;
	name: string;
};

export type NameConflictResolution = "skip" | "cancel";

export type OnCircularReferenceArgs<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile | TFolder> = DefaultTFolder<TFile>,
> = {
	source: TreeItemState<TFile, TFolder, TFolder>;
	destination: TFolder;
};

export type OnCopyArgs<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile | TFolder> = DefaultTFolder<TFile>,
> = {
	sources: Array<TreeItemState<TFile, TFolder>>;
	destination: TFolder;
};

export type OnMoveArgs<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile | TFolder> = DefaultTFolder<TFile>,
> = {
	sources: Array<TreeItemState<TFile, TFolder>>;
	destination: TFolder;
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
	root: TFolder;
	defaultSelectedIds?: Iterable<string>;
	selectedIds?: SvelteSet<string>;
	defaultExpandedIds?: Iterable<string>;
	expandedIds?: SvelteSet<string>;
	clipboard?: TreeClipboard;
	isItemDisabled?: boolean | ((node: TFile | TFolder) => boolean);
	ref?: HTMLElement | null;
	copyNode?: (node: TFile | TFolder) => TFile | TFolder;
	onClipboardChange?: (args: OnClipboardChangeArgs) => void;
	onChildrenChange?: (args: OnChildrenChangeArgs<TFile, TFolder>) => void;
	onDropDestinationChange?: (args: OnDropDestinationChangeArgs<TFile, TFolder>) => void;
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

export type DragSource = {
	id: string;
	element: HTMLElement;
};

export type DragEventArgs = {
	input: DragInput;
	source: DragSource;
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
		| "tabindex"
	> {
	children: Snippet;
	item: TreeItemState<TFile, TFolder>;
	ref?: HTMLElement | null;
	onDragStart?: (args: DragEventArgs) => void;
	onDragEnd?: (args: DragEventArgs) => void;
	onDragEnter?: (args: DragEventArgs) => void;
	onDragOver?: (args: DragEventArgs) => void;
	onDragLeave?: (args: DragEventArgs) => void;
	onDrop?: (args: DragEventArgs) => void;
}
