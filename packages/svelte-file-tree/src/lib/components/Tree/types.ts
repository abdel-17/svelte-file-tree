import type { HTMLDivAttributes } from "$lib/internal/types.js";
import type { FileOrFolder, FileTree, FolderNode } from "$lib/tree.svelte.js";
import type { Snippet } from "svelte";

export declare namespace TreeProps {
	type Item<TNode extends FileOrFolder = FileOrFolder> = {
		node: TNode;
		index: number;
		parent: Item<FolderNode> | undefined;
	};

	type ItemSnippetProps = {
		node: FileOrFolder;
		index: number;
		depth: number;
		parent: Item<FolderNode> | undefined;
	};

	type RenameChange = {
		id: string;
		oldName: string;
		newName: string;
	};

	type ReorderChange = {
		id: string;
		oldParentId: string | undefined;
		oldIndex: number;
		newParentId: string | undefined;
		newIndex: number;
	};

	type OnTreeChangeArgs =
		| {
				type: "rename";
				change: RenameChange;
				rollback: () => void;
		  }
		| {
				type: "reorder";
				changes: ReorderChange[];
				rollback: () => void;
		  };

	type OnTreeChangeErrorArgs =
		| {
				type: "rename:empty";
				node: FileOrFolder;
		  }
		| {
				type: "rename:conflict";
				node: FileOrFolder;
				name: string;
		  };
}

export interface TreeProps
	extends Omit<HTMLDivAttributes, "children" | "role" | "aria-multiselectable"> {
	tree: FileTree;
	item: Snippet<[props: TreeProps.ItemSnippetProps]>;
	onTreeChange?: (args: TreeProps.OnTreeChangeArgs) => void;
	onTreeChangeError?: (args: TreeProps.OnTreeChangeErrorArgs) => void;
}
