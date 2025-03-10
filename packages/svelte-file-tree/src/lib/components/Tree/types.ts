import type { HTMLDivAttributes, MaybePromise } from "$lib/internal/types.js";
import type { FileTree } from "$lib/tree.svelte.js";
import type { Snippet } from "svelte";
import type {
	DeleteItemsArgs,
	InsertItemsArgs,
	MoveErrorArgs,
	MoveItemsArgs,
	NameConflictArgs,
	NameConflictResolution,
	PasteOperation,
	RenameErrorArgs,
	RenameItemArgs,
	TreeItemSnippetArgs,
} from "./state.svelte.js";

export interface TreeProps
	extends Omit<HTMLDivAttributes, "children" | "role" | "aria-multiselectable"> {
	tree: FileTree;
	item: Snippet<[args: TreeItemSnippetArgs]>;
	pasteOperation?: PasteOperation;
	editable?: boolean | ((node: FileTree.Node) => boolean);
	disabled?: boolean | ((node: FileTree.Node) => boolean);
	id?: string;
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

export type {
	DeleteItemsArgs,
	InsertItemsArgs,
	MoveErrorArgs,
	MoveItemsArgs,
	NameConflictArgs,
	NameConflictResolution,
	PasteOperation,
	RenameErrorArgs,
	RenameItemArgs,
	TreeItemSnippetArgs,
};
