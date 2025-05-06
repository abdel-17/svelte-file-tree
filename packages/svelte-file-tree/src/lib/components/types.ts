import type { HTMLDivAttributes, MaybePromise } from "$lib/internal/types.js";
import type { DefaultTFolder, FileNode, FileTree, FolderNode } from "$lib/tree.svelte.js";
import type { Snippet } from "svelte";
import type { ClassValue } from "svelte/elements";
import type { SvelteSet } from "svelte/reactivity";

export type TreeItemState<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile, TFolder> = DefaultTFolder<TFile>,
	TNode extends TFile | TFolder = TFile | TFolder,
> = {
	node: TNode;
	index: number;
	parent?: TreeItemState<TFile, TFolder, TFolder>;
	depth: number;
	selected: boolean;
	expanded: boolean;
	inClipboard: boolean;
	disabled: boolean;
	visible: boolean;
	dragged: boolean;
};

export type DropPosition = "before" | "after" | "inside";

export type TreeItemSnippetArgs<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile, TFolder> = DefaultTFolder<TFile>,
> = {
	item: TreeItemState<TFile, TFolder>;
};

export type PasteOperation = "copy" | "cut";

export type MoveItemsArgs<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile, TFolder> = DefaultTFolder<TFile>,
	TTree extends FileTree<TFile, TFolder> = FileTree<TFile, TFolder>,
> = {
	updates: Array<{
		target: TFolder | TTree;
		children: Array<TFile | TFolder>;
	}>;
	moved: Array<TFile | TFolder>;
};

export type CopyPasteItemsArgs<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile, TFolder> = DefaultTFolder<TFile>,
	TTree extends FileTree<TFile, TFolder> = FileTree<TFile, TFolder>,
> = {
	target: TFolder | TTree;
	start: number;
	copies: Array<TFile | TFolder>;
	originals: Array<TFile | TFolder>;
};

export type RemoveItemsArgs<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile, TFolder> = DefaultTFolder<TFile>,
	TTree extends FileTree<TFile, TFolder> = FileTree<TFile, TFolder>,
> = {
	updates: Array<{
		target: TFolder | TTree;
		children: Array<TFile | TFolder>;
	}>;
	removed: Array<TFile | TFolder>;
};

export type ResolveNameConflictArgs = {
	operation: "move" | "copy-paste";
	name: string;
};

export type NameConflictResolution = "skip" | "cancel";

export type CircularReferenceErrorArgs<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile, TFolder> = DefaultTFolder<TFile>,
> = {
	target: TFile | TFolder;
	position: DropPosition;
};

export interface TreeProps<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile, TFolder> = DefaultTFolder<TFile>,
	TTree extends FileTree<TFile, TFolder> = FileTree<TFile, TFolder>,
> extends Omit<HTMLDivAttributes, "children" | "role" | "aria-multiselectable"> {
	tree: TTree;
	item: Snippet<[args: TreeItemSnippetArgs<TFile, TFolder>]>;
	defaultSelectedIds?: Iterable<string>;
	selectedIds?: SvelteSet<string>;
	defaultExpandedIds?: Iterable<string>;
	expandedIds?: SvelteSet<string>;
	defaultClipboardIds?: Iterable<string>;
	clipboardIds?: SvelteSet<string>;
	pasteOperation?: PasteOperation;
	isItemDisabled?: boolean | ((node: TFile | TFolder) => boolean);
	id?: string;
	ref?: HTMLElement | null;
	copyNode?: (node: TFile | TFolder) => TFile | TFolder;
	onMoveItems?: (args: MoveItemsArgs<TFile, TFolder, TTree>) => MaybePromise<boolean>;
	onCopyPasteItems?: (args: CopyPasteItemsArgs<TFile, TFolder, TTree>) => MaybePromise<boolean>;
	onRemoveItems?: (args: RemoveItemsArgs<TFile, TFolder, TTree>) => MaybePromise<boolean>;
	onResolveNameConflict?: (args: ResolveNameConflictArgs) => MaybePromise<NameConflictResolution>;
	onCircularReferenceError?: (args: CircularReferenceErrorArgs<TFile, TFolder>) => void;
}

export type TreeItemChildrenSnippetArgs = {
	dropPosition: DropPosition | undefined;
};

export interface TreeItemProps
	extends Omit<
		HTMLDivAttributes,
		| "children"
		| "id"
		| "role"
		| "aria-selected"
		| "aria-expanded"
		| "aria-level"
		| "aria-posinset"
		| "aria-setsize"
		| "tabindex"
		| "class"
		| "style"
	> {
	children: Snippet<[args: TreeItemChildrenSnippetArgs]>;
	ref?: HTMLElement | null;
	class?: ClassValue | ((args: TreeItemChildrenSnippetArgs) => ClassValue | undefined);
	style?: string | ((args: TreeItemChildrenSnippetArgs) => string | undefined);
}
