import type { HTMLDivAttributes, MaybePromise } from "$lib/internal/types.js";
import type { FileTree, FileTreeNode, FolderNode } from "$lib/tree.svelte.js";
import type { Snippet } from "svelte";

export type TreeItemSnippetProps<TNode extends FileTreeNode = FileTreeNode> = {
	node: TNode;
	index: number;
	depth: number;
	parent: TreeItemSnippetProps<FolderNode> | undefined;
};

export type PasteOperation = "copy" | "cut";

export type RenameItemEvent = {
	target: FileTreeNode;
	name: string;
};

export type RenameErrorEvent = {
	error: "empty" | "already-exists";
	target: FileTreeNode;
	name: string;
};

export type Reorder = {
	target: FileTreeNode;
	parentNode: FolderNode | undefined;
	index: number;
};

export type ReorderItemsEvent = {
	reorders: ReadonlyArray<Reorder>;
};

export type CopyPasteItemsEvent = {
	copies: ReadonlyArray<FileTreeNode>;
	parentNode: FolderNode | undefined;
	start: number;
	reorders: ReadonlyArray<Reorder>;
};

export type NameConflictEvent = {
	target: FileTreeNode;
	operation: "reorder" | "copy-paste";
};

export type NameConflictResolution = "skip" | "cancel";

export type CircularReferenceErrorEvent = {
	target: FileTreeNode;
	operation: "reorder" | "copy-paste";
};

export type DeleteItemsEvent = {
	deleted: ReadonlyArray<FileTreeNode>;
	reorders: ReadonlyArray<Reorder>;
};

export interface TreeProps
	extends Omit<HTMLDivAttributes, "children" | "role" | "aria-multiselectable"> {
	tree: FileTree;
	item: Snippet<[props: TreeItemSnippetProps]>;
	pasteOperation?: PasteOperation;
	id?: string;
	element?: HTMLElement | null;
	generateCopyId?: () => string;
	onRenameItem?: (event: RenameItemEvent) => void;
	onRenameError?: (event: RenameErrorEvent) => void;
	onReorderItems?: (event: ReorderItemsEvent) => void;
	onCopyPasteItems?: (event: CopyPasteItemsEvent) => void;
	onCircularReferenceError?: (event: CircularReferenceErrorEvent) => void;
	onNameConflict?: (event: NameConflictEvent) => MaybePromise<NameConflictResolution | void>;
	onDeleteItems?: (event: DeleteItemsEvent) => void;
}
