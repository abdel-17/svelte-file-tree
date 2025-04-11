import { FileTree, type FolderNode } from "$lib/tree.svelte";
import type { NameConflictResolution } from "svelte-file-tree";
import type { TreeItemState } from "./types.js";
import type { EventHandler } from "svelte/elements";

export function createNameConflictDialogState() {
	let open = $state.raw(false);
	let title = $state.raw("");
	let description = $state.raw("");
	let onClose: ((result: NameConflictResolution) => void) | undefined;

	function show(args: {
		title: string;
		description: string;
		onClose: (result: NameConflictResolution) => void;
	}): void {
		open = true;
		title = args.title;
		description = args.description;
		onClose = args.onClose;
	}

	function close(result: NameConflictResolution): void {
		open = false;
		title = "";
		description = "";
		onClose!(result);
		onClose = undefined;
	}

	return {
		open: () => open,
		title: () => title,
		description: () => description,
		show,
		close,
	};
}

export function createNameFormDialogState() {
	let name = $state.raw("");
	let open = $state.raw(false);
	let title = $state.raw("");
	let onSubmit: ((name: string) => void) | undefined;

	function setName(value: string): void {
		name = value;
	}

	function show(args: { title: string; onSubmit: (name: string) => void; name?: string }): void {
		name = args.name ?? "";
		open = true;
		title = args.title;
		onSubmit = args.onSubmit;
	}

	function submit(): void {
		onSubmit!(name);
	}

	function close(): void {
		name = "";
		open = false;
		title = "";
		onSubmit = undefined;
	}

	return {
		name: () => name,
		setName,
		open: () => open,
		title: () => title,
		show,
		submit,
		close,
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

	function setTarget(value: TreeContextMenuTarget): void {
		target = value;
	}

	function item(): TreeItemState {
		switch (target!.type) {
			case "tree": {
				throw new Error("Expected an item");
			}
			case "item": {
				return target!.item();
			}
		}
	}

	function folderOrTree(): FolderNode | FileTree {
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

	function rename(): void {
		onRename(item());
	}

	function copy(): void {
		onCopy(item());
	}

	function cut(): void {
		onCut(item());
	}

	function paste(): void {
		onPaste(item());
	}

	function remove(): void {
		onRemove(item());
	}

	function createFolder(): void {
		onCreateFolder(folderOrTree());
	}

	function uploadFiles(): void {
		onUploadFiles(folderOrTree());
	}

	function close(): void {
		target = undefined;
	}

	return {
		target: () => target,
		setTarget,
		rename,
		copy,
		cut,
		paste,
		remove,
		createFolder,
		uploadFiles,
		close,
	};
}

export function createFileInputState({ ref }: { ref: () => HTMLInputElement | null }) {
	let onPick: ((files: FileList) => void) | undefined;

	function showPicker(args: { onPick: (files: FileList) => void }): void {
		onPick = args.onPick;
		ref()!.click();
	}

	const onChange: EventHandler<Event, HTMLInputElement> = (event) => {
		const { files } = event.currentTarget;
		if (files !== null && files.length !== 0) {
			onPick!(files);
		}

		onPick = undefined;
		event.currentTarget.value = "";
	};

	const onCancel: EventHandler<Event, HTMLInputElement> = () => {
		onPick = undefined;
	};

	return {
		showPicker,
		onChange,
		onCancel,
	};
}
