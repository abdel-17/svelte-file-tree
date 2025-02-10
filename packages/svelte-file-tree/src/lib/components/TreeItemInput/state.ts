import type { FileTreeNode, FolderNode } from "$lib/tree.svelte.js";
import type { EventHandler } from "svelte/elements";
import type { TreeItemPosition, TreeState } from "../Tree/state.svelte.js";

export type TreeItemInputStateProps = {
	treeState: TreeState;
	node: () => FileTreeNode;
	index: () => number;
	parent: () => TreeItemPosition<FolderNode> | undefined;
	setEditing: (value: boolean) => void;
	name: () => string;
};

export const createTreeItemInputState = (props: TreeItemInputStateProps) => {
	const {
		treeState: { getItemElement, renameItem },
		node,
		index,
		parent,
		setEditing,
		name,
	} = props;

	const onInit = (input: HTMLInputElement): void => {
		input.focus();
		input.select();
	};

	const handleFocus: EventHandler<FocusEvent, HTMLInputElement> = () => {
		setEditing(true);
	};

	const handleKeyDown: EventHandler<KeyboardEvent, HTMLInputElement> = (event) => {
		switch (event.key) {
			case "Enter": {
				if (name() === node().name) {
					getItemElement(node().id)?.focus();
					break;
				}

				const didRename = renameItem(name(), {
					node: node(),
					index: index(),
					parent: parent(),
				});

				if (didRename) {
					getItemElement(node().id)?.focus();
				}
				break;
			}
			case "Escape": {
				getItemElement(node().id)?.focus();
				break;
			}
			default: {
				return;
			}
		}

		event.preventDefault();
	};

	const handleBlur: EventHandler<FocusEvent, HTMLInputElement> = () => {
		setEditing(false);
	};

	return {
		onInit,
		handleFocus,
		handleKeyDown,
		handleBlur,
	};
};

export type TreeItemInputState = ReturnType<typeof createTreeItemInputState>;
