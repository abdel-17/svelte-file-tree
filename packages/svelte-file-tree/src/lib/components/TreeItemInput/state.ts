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
	onfocus: EventHandler<FocusEvent, HTMLInputElement>;
	onkeydown: EventHandler<KeyboardEvent, HTMLInputElement>;
	onblur: EventHandler<FocusEvent, HTMLInputElement>;
};

export const createTreeItemInputState = ({
	treeState,
	node,
	index,
	parent,
	setEditing,
	name,
	onfocus,
	onkeydown,
	onblur,
}: TreeItemInputStateProps) => {
	const { renameItem, getItemElement } = treeState;

	const onInit = (input: HTMLInputElement): void => {
		input.focus();
		input.select();
	};

	const handleFocus: EventHandler<FocusEvent, HTMLInputElement> = (event) => {
		onfocus(event);
		setEditing(true);
	};

	const handleKeyDown: EventHandler<KeyboardEvent, HTMLInputElement> = (event) => {
		onkeydown(event);

		if (event.defaultPrevented) {
			return;
		}

		switch (event.key) {
			case "Enter": {
				if (name() === node().name) {
					getItemElement(node().id)?.focus();
					break;
				}

				void renameItem(name(), {
					node: node(),
					index: index(),
					parent: parent(),
				}).then((didRename) => {
					if (didRename) {
						getItemElement(node().id)?.focus();
					}
				});
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

	const handleBlur: EventHandler<FocusEvent, HTMLInputElement> = (event) => {
		onblur(event);
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
