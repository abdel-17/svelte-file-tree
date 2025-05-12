import type {
	ElementDropTargetGetFeedbackArgs,
	ElementEventBasePayload,
	ElementGetFeedbackArgs,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { DEV } from "esm-env";
import { getContext, hasContext, setContext } from "svelte";
import type { DefaultTFolder, FileNode, FolderNode, TreeItemState } from "$lib/tree.svelte.js";

export type TreeItemEvent<TEvent extends Event = Event> = TEvent & {
	currentTarget: HTMLDivElement;
};

export type TreeContext<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile | TFolder> = DefaultTFolder<TFile>,
> = {
	root: () => TFolder;
	tabbableId: () => string;
	getItemElementId: (itemId: string) => string;
	onFocusIn: (item: TreeItemState<TFile, TFolder>, event: TreeItemEvent<FocusEvent>) => void;
	onKeyDown: (item: TreeItemState<TFile, TFolder>, event: TreeItemEvent<KeyboardEvent>) => void;
	onClick: (item: TreeItemState<TFile, TFolder>, event: TreeItemEvent<MouseEvent>) => void;
	canDrag: (item: TreeItemState<TFile, TFolder>, args: ElementGetFeedbackArgs) => boolean;
	onDragStart: (item: TreeItemState<TFile, TFolder>, args: ElementEventBasePayload) => void;
	canDrop: (item: TreeItemState<TFile, TFolder>, args: ElementDropTargetGetFeedbackArgs) => boolean;
	onDestroyItem: (item: TreeItemState<TFile, TFolder>) => void;
};

const CONTEXT_KEY = Symbol("TreeContext");

export function getTreeContext<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile | TFolder> = DefaultTFolder<TFile>,
>(): TreeContext<TFile, TFolder> {
	if (DEV && !hasContext(CONTEXT_KEY)) {
		throw new Error("No parent <Tree> found");
	}
	return getContext(CONTEXT_KEY);
}

export function setTreeContext<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile | TFolder> = DefaultTFolder<TFile>,
>(context: TreeContext<TFile, TFolder>) {
	setContext(CONTEXT_KEY, context);
}
