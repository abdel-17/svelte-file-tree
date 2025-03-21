import type { HTMLDivAttributes, MaybePromise } from "$lib/internal/types.js";
import type { FileTree, FileTreeNode, FileTreeNodeData, FolderNode } from "$lib/tree.svelte.js";
import type { Snippet } from "svelte";
import type { SvelteSet } from "svelte/reactivity";

export type TreeItemState<
	TData extends FileTreeNodeData = FileTreeNodeData,
	TNode extends FileTreeNode<TData> = FileTreeNode<TData>,
> = {
	node: TNode;
	index: number;
	parent?: TreeItemState<TData, FolderNode<TData>>;
	depth: number;
	selected: () => boolean;
	expanded: () => boolean;
	inClipboard: () => boolean;
	editable: () => boolean;
	disabled: () => boolean;
	visible: () => boolean;
	dragged: () => boolean;
};

export type DropPosition = "before" | "after" | "inside";

export type TreeItemSnippetArgs<TData extends FileTreeNodeData = FileTreeNodeData> = {
	item: TreeItemState<TData>;
	rename: (name: string) => Promise<boolean>;
	paste: (position?: DropPosition) => Promise<boolean>;
	remove: () => Promise<boolean>;
};

export type PasteOperation = "copy" | "cut";

export type RenameItemArgs<TData extends FileTreeNodeData = FileTreeNodeData> = {
	target: FileTreeNode<TData>;
	name: string;
};

export type MoveItemsArgs<TData extends FileTreeNodeData = FileTreeNodeData> = {
	updates: Array<{
		target: FolderNode<TData> | FileTree<TData>;
		children: Array<FileTreeNode<TData>>;
	}>;
	moved: Array<FileTreeNode<TData>>;
};

export type CopyPasteItemsArgs<TData extends FileTreeNodeData = FileTreeNodeData> = {
	target: FolderNode<TData> | FileTree<TData>;
	start: number;
	copies: Array<FileTreeNode<TData>>;
	originals: Array<FileTreeNode<TData>>;
};

export type RemoveItemsArgs<TData extends FileTreeNodeData = FileTreeNodeData> = {
	updates: Array<{
		target: FolderNode<TData> | FileTree<TData>;
		children: Array<FileTreeNode<TData>>;
	}>;
	removed: Array<FileTreeNode<TData>>;
};

export type ResolveNameConflictArgs = {
	operation: "move" | "copy-paste";
	name: string;
};

export type NameConflictResolution = "skip" | "cancel";

export type AlreadyExistsErrorArgs = {
	name: string;
};

export type CircularReferenceErrorArgs<TData extends FileTreeNodeData = FileTreeNodeData> = {
	target: FileTreeNode<TData>;
	position: DropPosition;
};

export interface TreeProps<TData extends FileTreeNodeData = FileTreeNodeData>
	extends Omit<HTMLDivAttributes, "children" | "role" | "aria-multiselectable"> {
	tree: FileTree<TData>;
	item: Snippet<[args: TreeItemSnippetArgs<TData>]>;
	defaultSelectedIds?: Iterable<string>;
	selectedIds?: SvelteSet<string>;
	defaultExpandedIds?: Iterable<string>;
	expandedIds?: SvelteSet<string>;
	defaultClipboardIds?: Iterable<string>;
	clipboardIds?: SvelteSet<string>;
	pasteOperation?: PasteOperation;
	isItemEditable?: boolean | ((node: FileTreeNode<TData>) => boolean);
	isItemDisabled?: boolean | ((node: FileTreeNode<TData>) => boolean);
	id?: string;
	ref?: HTMLElement | null;
	generateCopyId?: () => string;
	onRenameItem?: (args: RenameItemArgs<TData>) => MaybePromise<boolean>;
	onMoveItems?: (args: MoveItemsArgs<TData>) => MaybePromise<boolean>;
	onCopyPasteItems?: (args: CopyPasteItemsArgs<TData>) => MaybePromise<boolean>;
	onRemoveItems?: (args: RemoveItemsArgs<TData>) => MaybePromise<boolean>;
	onResolveNameConflict?: (args: ResolveNameConflictArgs) => MaybePromise<NameConflictResolution>;
	onAlreadyExistsError?: (args: AlreadyExistsErrorArgs) => void;
	onCircularReferenceError?: (args: CircularReferenceErrorArgs<TData>) => void;
}
