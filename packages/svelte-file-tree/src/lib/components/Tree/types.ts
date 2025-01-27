import type { HTMLDivAttributes } from "$lib/internal/types.js";
import type { FileTree, FolderNode } from "$lib/tree.svelte.js";
import type { Snippet } from "svelte";

export declare namespace TreeProps {
	type ItemSnippetProps = {
		node: FileTree.Node;
		index: number;
		depth: number;
	};

	type OnRenameItemArgs = {
		node: FileTree.Node;
		oldName: string;
		newName: string;
	};

	type OnRenameItemErrorArgs = {
		reason: "empty" | "conflict";
		node: FileTree.Node;
		name: string;
	};

	type Reorder = {
		node: FileTree.Node;
		oldParent: FolderNode | undefined;
		oldIndex: number;
		newParent: FolderNode | undefined;
		newIndex: number;
	};

	type OnReorderItemsArgs = {
		reorders: ReadonlyArray<Reorder>;
	};

	type OnReorderItemsErrorArgs = {
		reason: "circular-reference";
		node: FolderNode;
	};

	type InPlaceReorder = {
		node: FileTree.Node;
		oldIndex: number;
		newIndex: number;
	};

	type OnDeleteItemsArgs = {
		deleted: ReadonlyArray<FileTree.Node>;
		reorders: ReadonlyArray<InPlaceReorder>;
	};
}

export interface TreeProps
	extends Omit<HTMLDivAttributes, "children" | "role" | "aria-multiselectable"> {
	tree: FileTree;
	item: Snippet<[props: TreeProps.ItemSnippetProps]>;
	element?: HTMLElement | null;
	onRenameItem?: (args: TreeProps.OnRenameItemArgs) => void;
	onRenameItemError?: (args: TreeProps.OnRenameItemErrorArgs) => void;
	onReorderItems?: (args: TreeProps.OnReorderItemsArgs) => void;
	onReorderItemsError?: (args: TreeProps.OnReorderItemsErrorArgs) => void;
	onDeleteItems?: (args: TreeProps.OnDeleteItemsArgs) => void;
}
