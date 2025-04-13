import { FileTree, type FolderNode } from "$lib/tree.svelte.js";
import type { NameConflictResolution } from "svelte-file-tree";
import type { EventHandler } from "svelte/elements";
import type { TreeItemState } from "./types.js";

export type NameConflictDialogShowArgs = {
	title: string;
	description: string;
	onClose: (result: NameConflictResolution) => void;
};

export function createNameConflictDialogState() {
	let open = $state.raw(false);
	let title = $state.raw("");
	let description = $state.raw("");
	let onClose: ((result: NameConflictResolution) => void) | undefined;

	return {
		open: () => open,
		title: () => title,
		description: () => description,
		show: (args: NameConflictDialogShowArgs) => {
			open = true;
			title = args.title;
			description = args.description;
			onClose = args.onClose;
		},
		close: (result: NameConflictResolution) => {
			onClose!(result);
			open = false;
			title = "";
			description = "";
			onClose = undefined;
		},
	};
}

export type NameFormDialogShowArgs = {
	title: string;
	onSubmit: (name: string) => void;
	name?: string;
};

export function createNameFormDialogState() {
	let name = $state.raw("");
	let open = $state.raw(false);
	let title = $state.raw("");
	let onSubmit: ((name: string) => void) | undefined;

	return {
		name: () => name,
		setName: (value: string) => {
			name = value;
		},
		open: () => open,
		title: () => title,
		show: (args: NameFormDialogShowArgs) => {
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

export type FileInputShowPickerArgs = {
	onPick: (files: FileList) => void;
};

export function createFileInputState({ ref }: { ref: () => HTMLInputElement | null }) {
	let onPick: ((files: FileList) => void) | undefined;

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
		showPicker: (args: FileInputShowPickerArgs) => {
			onPick = args.onPick;
			ref()!.click();
		},
		onchange,
		oncancel,
	};
}

export type ContextMenuTarget =
	| {
			type: "tree";
			tree: () => FileTree;
	  }
	| {
			type: "item";
			item: () => TreeItemState;
	  };

export type ContextMenuStateProps = {
	onRename: (target: TreeItemState) => void;
	onCopy: (target: TreeItemState) => void;
	onCut: (target: TreeItemState) => void;
	onPaste: (target: TreeItemState) => void;
	onRemove: (target: TreeItemState) => void;
	onCreateFolder: (target: FolderNode | FileTree) => void;
	onUploadFiles: (target: FolderNode | FileTree) => void;
};

export function createContextMenuState({
	onRename,
	onCopy,
	onCut,
	onPaste,
	onRemove,
	onUploadFiles,
	onCreateFolder,
}: ContextMenuStateProps) {
	let target: ContextMenuTarget | undefined = $state.raw();

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
		setTarget: (value: ContextMenuTarget) => {
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

export type FileDropToastTarget =
	| {
			type: "tree";
	  }
	| {
			type: "item";
			item: () => TreeItemState;
	  };

export type FileDropToastShowArgs = {
	target: FileDropToastTarget;
	toastId: string | number | undefined;
};

export type FileDropToastDismissArgs = {
	toastId: string | number;
};

export type FileDropToastStateProps = {
	onShow: (args: FileDropToastShowArgs) => string | number;
	onDismiss: (args: FileDropToastDismissArgs) => void;
};

export function createFileDropToastState({ onShow, onDismiss }: FileDropToastStateProps) {
	let target: FileDropToastTarget | undefined = $state.raw();
	let toastId: string | number | undefined;

	return {
		target: () => target,
		setTarget: (value: FileDropToastTarget) => {
			target = value;
			toastId = onShow({ target, toastId });
		},
		dismiss: () => {
			if (toastId === undefined) {
				return;
			}

			onDismiss({ toastId });
			target = undefined;
			toastId = undefined;
		},
	};
}
