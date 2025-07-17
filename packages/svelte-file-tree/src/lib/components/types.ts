import type { Input as DragInput } from "@atlaskit/pragmatic-drag-and-drop/types";
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

export type { DragInput };

export type MaybePromise<T> = T | Promise<T>;

export type TreeChildrenSnippetArgs<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile | TFolder> = DefaultTFolder<TFile>,
> = {
	items: Array<TreeItemState<TFile, TFolder>>;
};

export type PasteOperation = "copy" | "cut";

export type OnClipboardChangeArgs = {
	clipboardIds: SvelteSet<string>;
	pasteOperation: PasteOperation | undefined;
};

export type OnChildrenChangeArgs<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile | TFolder> = DefaultTFolder<TFile>,
	TTree extends FileTree<TFile | TFolder> = FileTree<TFile | TFolder>,
> = {
	operation: "insert" | "remove";
	target: TFolder | TTree;
	children: Array<TFile | TFolder>;
};

export type OnResolveNameConflictArgs<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile | TFolder> = DefaultTFolder<TFile>,
	TTree extends FileTree<TFile | TFolder> = FileTree<TFile | TFolder>,
> = {
	operation: "copy" | "move";
	destination: TFolder | TTree;
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
	TTree extends FileTree<TFile | TFolder> = FileTree<TFile | TFolder>,
> = {
	sources: Array<TreeItemState<TFile, TFolder>>;
	copies: Array<TFile | TFolder>;
	destination: TFolder | TTree;
};

export type OnMoveArgs<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile | TFolder> = DefaultTFolder<TFile>,
	TTree extends FileTree<TFile | TFolder> = FileTree<TFile | TFolder>,
> = {
	sources: Array<TreeItemState<TFile, TFolder>>;
	destination: TFolder | TTree;
};

export type OnRemoveArgs<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile | TFolder> = DefaultTFolder<TFile>,
> = {
	removed: Array<TreeItemState<TFile, TFolder>>;
};

export type CanDragArgs<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile | TFolder> = DefaultTFolder<TFile>,
> = {
	input: DragInput;
	source: TreeItemState<TFile, TFolder>;
};

export type ItemDragEventArgs<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile | TFolder> = DefaultTFolder<TFile>,
	TTree extends FileTree<TFile | TFolder> = FileTree<TFile | TFolder>,
> = {
	type: "item";
	input: DragInput;
	source: TreeItemState<TFile, TFolder>;
	items?: never;
	destination: TFolder | TTree;
};

export type ExternalDragEventArgs<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile | TFolder> = DefaultTFolder<TFile>,
	TTree extends FileTree<TFile | TFolder> = FileTree<TFile | TFolder>,
> = {
	type: "external";
	input: DragInput;
	source?: never;
	items: Array<DataTransferItem>;
	destination: TFolder | TTree;
};

export type DragEventArgs<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile | TFolder> = DefaultTFolder<TFile>,
	TTree extends FileTree<TFile | TFolder> = FileTree<TFile | TFolder>,
> = ItemDragEventArgs<TFile, TFolder, TTree> | ExternalDragEventArgs<TFile, TFolder, TTree>;

export interface TreeProps<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile | TFolder> = DefaultTFolder<TFile>,
	TTree extends FileTree<TFile | TFolder> = FileTree<TFile | TFolder>,
> extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "role" | "aria-multiselectable"> {
	children: Snippet<[args: TreeChildrenSnippetArgs<TFile, TFolder>]>;
	root: TTree;
	defaultSelectedIds?: Iterable<string>;
	selectedIds?: SvelteSet<string>;
	defaultExpandedIds?: Iterable<string>;
	expandedIds?: SvelteSet<string>;
	defaultClipboardIds?: Iterable<string>;
	clipboardIds?: SvelteSet<string>;
	pasteOperation?: PasteOperation;
	isItemDisabled?: boolean | ((node: TFile | TFolder) => boolean);
	ref?: HTMLElement | null;
	copyNode?: (node: TFile | TFolder) => TFile | TFolder;
	onClipboardChange?: (args: OnClipboardChangeArgs) => void;
	onChildrenChange?: (args: OnChildrenChangeArgs<TFile, TFolder, TTree>) => void;
	onResolveNameConflict?: (
		args: OnResolveNameConflictArgs<TFile, TFolder, TTree>,
	) => MaybePromise<NameConflictResolution>;
	onCircularReference?: (args: OnCircularReferenceArgs<TFile, TFolder>) => void;
	canCopy?: (args: OnCopyArgs<TFile, TFolder, TTree>) => MaybePromise<boolean>;
	onCopy?: (args: OnCopyArgs<TFile, TFolder, TTree>) => void;
	canMove?: (args: OnMoveArgs<TFile, TFolder, TTree>) => MaybePromise<boolean>;
	onMove?: (args: OnMoveArgs<TFile, TFolder, TTree>) => void;
	canRemove?: (args: OnRemoveArgs<TFile, TFolder>) => MaybePromise<boolean>;
	onRemove?: (args: OnRemoveArgs<TFile, TFolder>) => void;
	onDragEnter?: (args: DragEventArgs<TFile, TFolder, TTree>) => void;
	onDragLeave?: (args: DragEventArgs<TFile, TFolder, TTree>) => void;
	canDrag?: (args: CanDragArgs<TFile, TFolder>) => boolean;
	onDrag?: (args: DragEventArgs<TFile, TFolder, TTree>) => void;
	canDrop?: (args: DragEventArgs<TFile, TFolder, TTree>) => boolean;
	onDrop?: (args: DragEventArgs<TFile, TFolder, TTree>) => void;
}

export type TreeCopyToClipboardMethodOptions = {
	pasteOperation?: PasteOperation;
	batched?: boolean;
};

export type TreeRemoveMethodOptions = {
	batched?: boolean;
};

export interface TreeItemProps<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile | TFolder> = DefaultTFolder<TFile>,
	TTree extends FileTree<TFile | TFolder> = FileTree<TFile | TFolder>,
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
	onDragEnter?: (args: DragEventArgs<TFile, TFolder, TTree>) => void;
	onDragLeave?: (args: DragEventArgs<TFile, TFolder, TTree>) => void;
	onDrag?: (args: DragEventArgs<TFile, TFolder, TTree>) => void;
	onDrop?: (args: DragEventArgs<TFile, TFolder, TTree>) => void;
}
