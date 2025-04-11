import { FileTree, type FolderNode } from "$lib/tree.svelte";
import type { NameConflictResolution } from "svelte-file-tree";
import type { TreeItemState } from "./types.js";
import type { EventHandler } from "svelte/elements";

export function createNameConflictDialogState() {
	let open = $state.raw(false);
	let title = $state.raw("");
	let description = $state.raw("");
	let onClose: ((result: NameConflictResolution) => void) | undefined;

	type ShowArgs = {
		title: string;
		description: string;
		onClose: (result: NameConflictResolution) => void;
	};

	return {
		open: () => open,
		title: () => title,
		description: () => description,
		show: (args: ShowArgs) => {
			open = true;
			title = args.title;
			description = args.description;
			onClose = args.onClose;
		},
		close: (result: NameConflictResolution) => {
			open = false;
			title = "";
			description = "";
			onClose!(result);
			onClose = undefined;
		},
	};
}

export function createNameFormDialogState() {
	let name = $state.raw("");
	let open = $state.raw(false);
	let title = $state.raw("");
	let onSubmit: ((name: string) => void) | undefined;

	type ShowArgs = {
		title: string;
		onSubmit: (name: string) => void;
		name?: string;
	};

	return {
		name: () => name,
		setName: (value: string) => {
			name = value;
		},
		open: () => open,
		title: () => title,
		show: (args: ShowArgs) => {
			name = args.name ?? "";
			open = true;
			title = args.title;
			onSubmit = args.onSubmit;
		},
		submit: () => onSubmit!(name),
		close: () => {
			name = "";
			open = false;
			title = "";
			onSubmit = undefined;
		},
	};
}

export type TreeContextMenuTarget =
	| {
			type: "tree";
			tree: () => FileTree;
	  }
	| {
			type: "item";
			item: () => TreeItemState;
	  };

export function createContextMenuState({
	onRename,
	onCopy,
	onCut,
	onPaste,
	onRemove,
	onUploadFiles,
	onCreateFolder,
}: {
	onRename: (target: TreeItemState) => void;
	onCopy: (target: TreeItemState) => void;
	onCut: (target: TreeItemState) => void;
	onPaste: (target: TreeItemState) => void;
	onRemove: (target: TreeItemState) => void;
	onCreateFolder: (target: FolderNode | FileTree) => void;
	onUploadFiles: (target: FolderNode | FileTree) => void;
}) {
	let target: TreeContextMenuTarget | undefined = $state.raw();

	function item() {
		switch (target!.type) {
			case "tree": {
				throw new Error("Expected an item");
			}
			case "item": {
				return target!.item();
			}
		}
	}

	function folderOrTree() {
		switch (target!.type) {
			case "tree": {
				return target!.tree();
			}
			case "item": {
				const { node } = target!.item();
				if (node.type === "file") {
					throw new Error("Expected a folder");
				}
				return node;
			}
		}
	}

	return {
		target: () => target,
		setTarget: (value: TreeContextMenuTarget) => {
			target = value;
		},
		rename: () => onRename(item()),
		copy: () => onCopy(item()),
		cut: () => onCut(item()),
		paste: () => onPaste(item()),
		remove: () => onRemove(item()),
		createFolder: () => onCreateFolder(folderOrTree()),
		uploadFiles: () => onUploadFiles(folderOrTree()),
		close: () => {
			target = undefined;
		},
	};
}

export function createFileInputState({ ref }: { ref: () => HTMLInputElement | null }) {
	let onPick: ((files: FileList) => void) | undefined;

	type ShowPickerArgs = {
		onPick: (files: FileList) => void;
	};

	const onchange: EventHandler<Event, HTMLInputElement> = (event) => {
		const { files } = event.currentTarget;
		if (files !== null && files.length !== 0) {
			onPick!(files);
		}

		onPick = undefined;
		event.currentTarget.value = "";
	};

	const oncancel: EventHandler<Event, HTMLInputElement> = () => {
		onPick = undefined;
	};

	return {
		showPicker: (args: ShowPickerArgs) => {
			onPick = args.onPick;
			ref()!.click();
		},
		onchange,
		oncancel,
	};
}
