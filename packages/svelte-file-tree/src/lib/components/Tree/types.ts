import type { HTMLDivAttributes, MaybePromise } from "$lib/internal/types.js";
import type { FileTree, FileTreeNode, FolderNode } from "$lib/tree.svelte.js";
import type { Snippet } from "svelte";
import type { TreeItemSnippetArgs } from "./state.svelte.js";

export type { TreeItemSnippetArgs };

export type PasteOperation = "copy" | "cut";

export type RenameItemArgs = {
	target: FileTreeNode;
	name: string;
};

export type RenameErrorArgs = {
	error: "empty" | "already-exists";
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

export type MoveErrorArgs = {
	error: "circular-reference";
	target: FileTreeNode;
};

export type InsertItemsArgs = {
	target: FolderNode | FileTree;
	start: number;
	inserted: Array<FileTreeNode>;
};

export type NameConflictArgs = {
	operation: "move" | "insert";
	target: FileTreeNode;
};

export type NameConflictResolution = "skip" | "cancel";

export type DeleteItemsArgs = {
	updates: Array<{
		target: FolderNode | FileTree;
		children: Array<FileTreeNode>;
	}>;
	deleted: Array<FileTreeNode>;
};

export interface TreeProps
	extends Omit<HTMLDivAttributes, "children" | "role" | "aria-multiselectable"> {
	tree: FileTree;
	item: Snippet<[args: TreeItemSnippetArgs]>;
	pasteOperation?: PasteOperation;
	id?: string;
	editable?: boolean | ((node: FileTreeNode) => boolean);
	disabled?: boolean | ((node: FileTreeNode) => boolean);
	element?: HTMLElement | null;
	generateCopyId?: () => string;
	onRenameItem?: (args: RenameItemArgs) => MaybePromise<boolean>;
	onRenameError?: (args: RenameErrorArgs) => void;
	onMoveItems?: (args: MoveItemsArgs) => MaybePromise<boolean>;
	onMoveError?: (args: MoveErrorArgs) => void;
	onInsertItems?: (args: InsertItemsArgs) => MaybePromise<boolean>;
	onNameConflict?: (args: NameConflictArgs) => MaybePromise<NameConflictResolution>;
	onDeleteItems?: (args: DeleteItemsArgs) => MaybePromise<boolean>;
}
