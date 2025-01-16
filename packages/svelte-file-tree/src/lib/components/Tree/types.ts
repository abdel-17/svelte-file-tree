import type { HTMLDivAttributes } from "$lib/internal/types.js";
import type { FileOrFolder, FileTree, FolderNode } from "$lib/tree.svelte.js";
import type { Snippet } from "svelte";

export declare namespace TreeProps {
	type ItemParent = {
		node: FolderNode;
		index: number;
		parent: ItemParent | undefined;
	};

	type ItemSnippetProps = {
		node: FileOrFolder;
		index: number;
		depth: number;
		parent: ItemParent | undefined;
	};

	type OnTreeChangeArgs = {
		type: "rename";
		node: FileOrFolder;
		oldName: string;
		newName: string;
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
				conflicting: FileOrFolder;
		  };
}

export interface TreeProps
	extends Omit<HTMLDivAttributes, "children" | "role" | "aria-multiselectable"> {
	tree: FileTree;
	item: Snippet<[props: TreeProps.ItemSnippetProps]>;
	onTreeChange?: (args: TreeProps.OnTreeChangeArgs) => void;
	onTreeChangeError?: (args: TreeProps.OnTreeChangeErrorArgs) => void;
}
