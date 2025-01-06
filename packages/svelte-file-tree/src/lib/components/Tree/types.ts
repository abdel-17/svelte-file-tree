import type { HTMLDivAttributes } from "$lib/internal/types.js";
import type { FileTree, FileTreeNode, FolderNode } from "$lib/tree.svelte.js";
import type { Snippet } from "svelte";

export type TreeItemDropPosition = "before" | "after" | "inside";

export type TreeItemRenderProps = {
	node: FileTreeNode;
	index: number;
	depth: number;
	editing: boolean;
	copied: boolean;
	cut: boolean;
	dragged: boolean;
	dropPosition: TreeItemDropPosition | undefined;
};

export type MoveItemsArgs = {
	moved: FileTreeNode[];
	start: number;
	level: FileTreeNode[];
	parent: FolderNode | undefined;
};

export type MoveCircularReferenceErrorArgs = {
	node: FolderNode;
	descendant: FileTreeNode;
};

export type MoveNameConflictErrorArgs = {
	node: FileTreeNode;
	conflicting: FileTreeNode;
};

export type MoveConflictResolution = "skip" | "stop";

export type InsertItemsArgs = {
	inserted: FileTreeNode[];
	start: number;
	level: FileTreeNode[];
	parent: FolderNode | undefined;
};

export type DeleteItemsArgs = {
	deleted: FileTreeNode[];
};

export type RenameItemArgs = {
	node: FileTreeNode;
};

export type RenameErrorArgs =
	| {
			reason: "empty";
			node: FileTreeNode;
	  }
	| {
			reason: "conflict";
			node: FileTreeNode;
			conflicting: FileTreeNode;
	  };

export interface TreeProps extends Omit<HTMLDivAttributes, "children"> {
	tree: FileTree;
	item: Snippet<[props: TreeItemRenderProps]>;
	id?: string;
	element?: HTMLDivElement | null;
	onMoveItems?: (args: MoveItemsArgs) => void;
	onMoveCircularReferenceError?: (args: MoveCircularReferenceErrorArgs) => void;
	onMoveNameConflictError?: (
		args: MoveNameConflictErrorArgs,
	) => MoveConflictResolution | void | Promise<MoveConflictResolution | void>;
	onInsertItems?: (args: InsertItemsArgs) => void;
	onDeleteItems?: (args: DeleteItemsArgs) => void;
	onRenameItem?: (args: RenameItemArgs) => void;
	onRenameError?: (args: RenameErrorArgs) => void;
}
