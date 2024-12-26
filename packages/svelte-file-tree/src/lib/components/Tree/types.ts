import type { HTMLDivAttributes } from "$lib/shared.js";
import type { FileTree, FileTreeNode, FolderNode } from "$lib/tree.svelte.js";
import type { Snippet } from "svelte";

export interface EmptyNameRenameError {
	type: "empty";
}

export interface DuplicateRenameError {
	type: "duplicate";
	name: string;
}

export type RenameError = EmptyNameRenameError | DuplicateRenameError;

export interface TreeCallbacks {
	onMoveItems: (nodes: FileTreeNode[], start: number, count: number) => void;
	onInsertItems: (nodes: FileTreeNode[], start: number, count: number) => void;
	onDeleteItems: (nodes: FileTreeNode[]) => void;
	onRenameItem: (node: FileTreeNode) => void;
	onRenameError: (node: FileTreeNode, error: RenameError) => void;
}

export type TreeItemDropPosition = "before" | "after" | "inside";

export interface TreeItemData<TNode extends FileTreeNode = FileTreeNode> {
	node: TNode;
	index: number;
	parent: TreeItemData<FolderNode> | undefined;
}

export interface TreeItemRenderProps {
	node: FileTreeNode;
	index: number;
	parent: TreeItemData<FolderNode> | undefined;
	depth: number;
	editing: boolean;
	dragged: boolean;
	dropPosition: TreeItemDropPosition | undefined;
}

export interface TreeProps extends Partial<TreeCallbacks>, Omit<HTMLDivAttributes, "children"> {
	tree: FileTree;
	item: Snippet<[props: TreeItemRenderProps]>;
	id?: string;
	element?: HTMLDivElement | null;
}
