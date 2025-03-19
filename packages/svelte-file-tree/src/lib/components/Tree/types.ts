import type { HTMLDivAttributes, MaybePromise } from "$lib/internal/types.js";
import type { FileTree, FileTreeNode, FolderNode } from "$lib/tree.svelte.js";
import type { Snippet } from "svelte";
import type { SvelteSet } from "svelte/reactivity";

export type TreeItemState<TNode extends FileTreeNode = FileTreeNode> = {
	node: TNode;
	index: number;
	parent?: TreeItemState<FolderNode>;
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

export type TreeItemSnippetArgs = {
	item: TreeItemState;
	rename: (name: string) => Promise<boolean>;
	paste: (position?: DropPosition) => Promise<boolean>;
	remove: () => Promise<boolean>;
};

export type PasteOperation = "copy" | "cut";

export type RenameItemArgs = {
	target: FileTreeNode;
	name: string;
};

export type MoveItemsArgs = {
	updates: Array<{
		target: FolderNode | FileTree;
		children: Array<FileTreeNode>;
	}>;
	moved: Array<FileTreeNode>;
};

export type InsertItemsArgs = {
	target: FolderNode | FileTree;
	start: number;
	inserted: Array<FileTreeNode>;
};

export type RemoveItemsArgs = {
	updates: Array<{
		target: FolderNode | FileTree;
		children: Array<FileTreeNode>;
	}>;
	removed: Array<FileTreeNode>;
};

export type ResolveNameConflictArgs = {
	operation: "move" | "insert";
	name: string;
};

export type NameConflictResolution = "skip" | "cancel";

export type AlreadyExistsErrorArgs = {
	name: string;
};

export type CircularReferenceErrorArgs = {
	target: FileTreeNode;
	position: DropPosition;
};

export interface TreeProps
	extends Omit<HTMLDivAttributes, "children" | "role" | "aria-multiselectable"> {
	tree: FileTree;
	item: Snippet<[args: TreeItemSnippetArgs]>;
	defaultSelectedIds?: Iterable<string>;
	selectedIds?: SvelteSet<string>;
	defaultExpandedIds?: Iterable<string>;
	expandedIds?: SvelteSet<string>;
	defaultClipboardIds?: Iterable<string>;
	clipboardIds?: SvelteSet<string>;
	pasteOperation?: PasteOperation;
	isItemEditable?: boolean | ((node: FileTreeNode) => boolean);
	isItemDisabled?: boolean | ((node: FileTreeNode) => boolean);
	id?: string;
	ref?: HTMLElement | null;
	generateCopyId?: () => string;
	onRenameItem?: (args: RenameItemArgs) => MaybePromise<boolean>;
	onMoveItems?: (args: MoveItemsArgs) => MaybePromise<boolean>;
	onInsertItems?: (args: InsertItemsArgs) => MaybePromise<boolean>;
	onRemoveItems?: (args: RemoveItemsArgs) => MaybePromise<boolean>;
	onResolveNameConflict?: (args: ResolveNameConflictArgs) => MaybePromise<NameConflictResolution>;
	onAlreadyExistsError?: (args: AlreadyExistsErrorArgs) => void;
	onCircularReferenceError?: (args: CircularReferenceErrorArgs) => void;
}
