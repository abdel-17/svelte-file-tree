import type { HTMLDivAttributes, MaybePromise } from "$lib/internal/types.js";
import type { FileNode, FileTree, FileTreeNode, FolderNode } from "$lib/tree.svelte.js";
import type { Snippet } from "svelte";
import type { ClassValue, HTMLInputAttributes } from "svelte/elements";
import type { SvelteSet } from "svelte/reactivity";

export type ParentFileTreeNode<TNode extends FileNode | FolderNode<TNode> = FileTreeNode> = Extract<
	TNode,
	FolderNode<any>
>;

export type TreeItemState<TNode extends FileNode | FolderNode<TNode> = FileTreeNode> = {
	node: TNode;
	index: number;
	parent?: TreeItemState<ParentFileTreeNode<TNode>>;
	depth: number;
	selected: boolean;
	expanded: boolean;
	inClipboard: boolean;
	editable: boolean;
	disabled: boolean;
	visible: boolean;
	dragged: boolean;
};

export type DropPosition = "before" | "after" | "inside";

export type TreeItemSnippetArgs<TNode extends FileNode | FolderNode<TNode> = FileTreeNode> = {
	item: TreeItemState<TNode>;
};

export type PasteOperation = "copy" | "cut";

export type RenameItemArgs<TNode extends FileNode | FolderNode<TNode> = FileTreeNode> = {
	target: TNode;
	name: string;
};

export type MoveItemsArgs<TNode extends FileNode | FolderNode<TNode> = FileTreeNode> = {
	updates: Array<{
		target: ParentFileTreeNode<TNode> | FileTree<TNode>;
		children: Array<TNode>;
	}>;
	moved: Array<TNode>;
};

export type CopyPasteItemsArgs<TNode extends FileNode | FolderNode<TNode> = FileTreeNode> = {
	target: ParentFileTreeNode<TNode> | FileTree<TNode>;
	start: number;
	copies: Array<TNode>;
	originals: Array<TNode>;
};

export type RemoveItemsArgs<TNode extends FileNode | FolderNode<TNode> = FileTreeNode> = {
	updates: Array<{
		target: ParentFileTreeNode<TNode> | FileTree<TNode>;
		children: Array<TNode>;
	}>;
	removed: Array<TNode>;
};

export type ResolveNameConflictArgs = {
	operation: "move" | "copy-paste";
	name: string;
};

export type NameConflictResolution = "skip" | "cancel";

export type AlreadyExistsErrorArgs = {
	name: string;
};

export type CircularReferenceErrorArgs<TNode extends FileNode | FolderNode<TNode> = FileTreeNode> =
	{
		target: TNode;
		position: DropPosition;
	};

export interface TreeProps<TNode extends FileNode | FolderNode<TNode> = FileTreeNode>
	extends Omit<HTMLDivAttributes, "children" | "role" | "aria-multiselectable"> {
	tree: FileTree<TNode>;
	item: Snippet<[args: TreeItemSnippetArgs<TNode>]>;
	defaultSelectedIds?: Iterable<string>;
	selectedIds?: SvelteSet<string>;
	defaultExpandedIds?: Iterable<string>;
	expandedIds?: SvelteSet<string>;
	defaultClipboardIds?: Iterable<string>;
	clipboardIds?: SvelteSet<string>;
	pasteOperation?: PasteOperation;
	isItemEditable?: boolean | ((node: TNode) => boolean);
	isItemDisabled?: boolean | ((node: TNode) => boolean);
	id?: string;
	ref?: HTMLElement | null;
	copyNode?: (node: TNode) => TNode;
	onRenameItem?: (args: RenameItemArgs<TNode>) => MaybePromise<boolean>;
	onMoveItems?: (args: MoveItemsArgs<TNode>) => MaybePromise<boolean>;
	onCopyPasteItems?: (args: CopyPasteItemsArgs<TNode>) => MaybePromise<boolean>;
	onRemoveItems?: (args: RemoveItemsArgs<TNode>) => MaybePromise<boolean>;
	onResolveNameConflict?: (args: ResolveNameConflictArgs) => MaybePromise<NameConflictResolution>;
	onAlreadyExistsError?: (args: AlreadyExistsErrorArgs) => void;
	onCircularReferenceError?: (args: CircularReferenceErrorArgs<TNode>) => void;
}

export type TreeItemChildrenSnippetArgs = {
	editing: () => boolean;
	dropPosition: () => DropPosition | undefined;
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
	editing?: boolean;
	ref?: HTMLElement | null;
	class?: ClassValue | ((args: TreeItemChildrenSnippetArgs) => ClassValue | undefined);
	style?: string | ((args: TreeItemChildrenSnippetArgs) => string | undefined);
}

export interface TreeItemInputProps extends Omit<HTMLInputAttributes, "children" | "value"> {
	name?: string;
	ref?: HTMLInputElement | null;
}
