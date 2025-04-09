import type { FileTreeNode } from "$lib/tree.svelte";
import type { NameConflictResolution, TreeItemState } from "svelte-file-tree";

export type NameConflictDialogState = {
	title: string;
	description: string;
	onClose: (resolution: NameConflictResolution) => void;
};

export type NameFormDialogState = {
	title: string;
	initialName: string;
	onSubmit: (name: string) => void;
};

export type TreeContextMenuState =
	| {
			type: "tree";
	  }
	| {
			type: "item";
			item: () => TreeItemState<FileTreeNode>;
	  };

export type FileDropTarget =
	| {
			type: "tree";
	  }
	| {
			type: "item";
			item: () => TreeItemState<FileTreeNode>;
	  };

export type RenameItemArgs = {
	target: TreeItemState<FileTreeNode>;
	name: string;
};
