<script lang="ts">
	import Tree from "$lib/components/Tree.svelte";
	import TreeContextMenu from "$lib/components/TreeContextMenu.svelte";
	import TreeContextMenuTrigger from "$lib/components/TreeContextMenuTrigger.svelte";
	import TreeItem from "$lib/components/TreeItem.svelte";
	import TreeItemToggle from "$lib/components/TreeItemToggle.svelte";
	import { FileIcon, FolderIcon, FolderOpenIcon } from "@lucide/svelte";
	import {
		FileNode,
		FileTree,
		FolderNode,
		TreeItemInput,
		type FileTreeNode,
	} from "svelte-file-tree";
	import files from "./files.json" with { type: "json" };

	type File = {
		name: string;
		size?: number;
		children?: Array<File>;
	};

	type NodeData = {
		name: string;
		size?: number;
	};

	const tree = new FileTree(
		files.map(function transform(file: File): FileTreeNode<NodeData> {
			const id = crypto.randomUUID();
			if (file.children === undefined) {
				return new FileNode({
					id,
					data: {
						name: file.name,
						size: file.size,
					},
				});
			}

			const children = file.children.map(transform);
			return new FolderNode({
				id,
				data: {
					name: file.name,
				},
				children,
			});
		}),
	);

	function getFileKind(name: string): string | undefined {
		const dotIndex = name.lastIndexOf(".");
		if (dotIndex === -1) {
			return;
		}

		const extension = name.slice(dotIndex + 1);
		switch (extension) {
			case "7z": {
				return "7-Zip Archive";
			}
			case "app": {
				return "Application";
			}
			case "avi": {
				return "AVI Video";
			}
			case "bat": {
				return "Batch File";
			}
			case "bmp": {
				return "Bitmap Image";
			}
			case "c": {
				return "C File";
			}
			case "cc":
			case "cpp": {
				return "C++ File";
			}
			case "cs": {
				return "C# File";
			}
			case "css": {
				return "CSS File";
			}
			case "csv": {
				return "CSV Document";
			}
			case "db": {
				return "Database File";
			}
			case "dll": {
				return "DLL File";
			}
			case "doc":
			case "docx": {
				return "Word Document";
			}
			case "exe": {
				return "Executable";
			}
			case "gif": {
				return "GIF Image";
			}
			case "go": {
				return "Go File";
			}
			case "gz": {
				return "GZip Archive";
			}
			case "html": {
				return "HTML File";
			}
			case "ico": {
				return "Icon File";
			}
			case "java": {
				return "Java File";
			}
			case "jpeg":
			case "jpg": {
				return "JPEG Image";
			}
			case "js":
			case "jsx": {
				return "JavaScript File";
			}
			case "json": {
				return "JSON File";
			}
			case "kt": {
				return "Kotlin File";
			}
			case "less": {
				return "Less File";
			}
			case "md": {
				return "Markdown Document";
			}
			case "mov": {
				return "QuickTime Video";
			}
			case "mp3": {
				return "MP3 Audio";
			}
			case "mp4": {
				return "MP4 Video";
			}
			case "odt": {
				return "OpenDocument Text";
			}
			case "ogg": {
				return "OGG Audio";
			}
			case "otf":
			case "ttf": {
				return "Font File";
			}
			case "pdf": {
				return "PDF Document";
			}
			case "php": {
				return "PHP File";
			}
			case "png": {
				return "PNG Image";
			}
			case "ppt":
			case "pptx": {
				return "PowerPoint Presentation";
			}
			case "py": {
				return "Python File";
			}
			case "rar": {
				return "RAR Archive";
			}
			case "rb": {
				return "Ruby File";
			}
			case "rtf": {
				return "Rich Text Document";
			}
			case "rs": {
				return "Rust File";
			}
			case "sass": {
				return "Sass File";
			}
			case "scss": {
				return "SCSS File";
			}
			case "sh": {
				return "Shell Script";
			}
			case "sql": {
				return "SQL File";
			}
			case "svg": {
				return "SVG Image";
			}
			case "svelte": {
				return "Svelte Component";
			}
			case "swift": {
				return "Swift File";
			}
			case "tar": {
				return "TAR Archive";
			}
			case "tiff": {
				return "TIFF Image";
			}
			case "ts":
			case "tsx": {
				return "TypeScript File";
			}
			case "txt": {
				return "Text Document";
			}
			case "wav": {
				return "WAV Audio";
			}
			case "webm": {
				return "WebM Video";
			}
			case "webp": {
				return "WebP Image";
			}
			case "xls":
			case "xlsx": {
				return "Excel Spreadsheet";
			}
			case "xml": {
				return "XML File";
			}
			case "yaml":
			case "yml": {
				return "YAML File";
			}
			case "zip": {
				return "ZIP Archive";
			}
		}
	}

	function getKind(node: FileTreeNode<NodeData>): string {
		switch (node.type) {
			case "file": {
				return getFileKind(node.data.name) ?? "File";
			}
			case "folder": {
				return "Folder";
			}
		}
	}

	const sizeFormatter = new Intl.NumberFormat(undefined, {
		style: "decimal",
		maximumFractionDigits: 2,
	});

	function formatSize(size: number | undefined): string {
		if (size === undefined) {
			return "-";
		}

		if (size < 1_000) {
			return sizeFormatter.format(size) + " B";
		}

		size /= 1_000;
		if (size < 1_000) {
			return sizeFormatter.format(size) + " KB";
		}

		size /= 1_000;
		if (size < 1_000) {
			return sizeFormatter.format(size) + " MB";
		}

		size /= 1000;
		if (size < 1_000) {
			return sizeFormatter.format(size) + " GB";
		}

		size /= 1000;
		return sizeFormatter.format(size) + " TB";
	}

	function onUploadFiles({
		target,
		files,
	}: {
		target: FolderNode<NodeData> | FileTree<NodeData>;
		files: FileList;
	}): void {
		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			const node = new FileNode({
				id: crypto.randomUUID(),
				data: {
					name: file.name,
					size: file.size,
				},
			});
			target.children.push(node);
		}
	}

	function onCreateNewFolder({
		target,
		name,
	}: {
		target: FolderNode<NodeData> | FileTree<NodeData>;
		name: string;
	}): void {
		const node = new FolderNode({
			id: crypto.randomUUID(),
			data: { name },
			children: [],
		});
		target.children.push(node);
	}
</script>

<main class="flex min-h-svh flex-col p-8">
	<TreeContextMenu {tree} {onUploadFiles} {onCreateNewFolder}>
		<TreeContextMenuTrigger class="grow rounded border border-gray-400 p-5">
			<div
				class="grid grid-cols-(--grid-cols) gap-x-(--grid-gap) px-(--grid-inline-padding) text-sm font-semibold"
			>
				<div>Name</div>
				<div>Size</div>
				<div>Kind</div>
			</div>

			<Tree {tree} isItemEditable class="mt-2">
				{#snippet item({ item, expand, collapse, copy, paste, remove })}
					<TreeItem
						{item}
						draggable
						onCopy={copy}
						onPaste={paste}
						onDelete={remove}
						class={({ dropPosition }) => [
							"relative grid grid-cols-(--grid-cols) gap-x-(--grid-gap) rounded-md p-(--grid-inline-padding) hover:bg-neutral-200 focus:outline-2 focus:-outline-offset-2 focus:outline-current active:bg-neutral-300 aria-selected:bg-blue-200 aria-selected:text-blue-900 aria-selected:active:bg-blue-300 aria-selected:has-[+[aria-selected='true']]:rounded-b-none aria-selected:[&+[aria-selected='true']]:rounded-t-none",
							item.dragged() && "opacity-50",
							dropPosition() !== undefined &&
								"before:pointer-events-none before:absolute before:-inset-0 before:rounded-[inherit] before:border-2",
							dropPosition() === "before" && "before:border-neutral-300 before:border-t-red-500",
							dropPosition() === "after" && "before:border-neutral-300 before:border-b-red-500",
							dropPosition() === "inside" && "before:border-red-500",
						]}
					>
						{#snippet children({ editing })}
							<div class="flex items-center" style="padding-inline-start: {item.depth * 24}px">
								<TreeItemToggle {item} onExpand={expand} onCollapse={collapse} />

								<div class="ms-1 me-2">
									{#if item.node.type === "file"}
										<FileIcon role="presentation" />
									{:else if item.expanded()}
										<FolderOpenIcon role="presentation" class="fill-blue-300" />
									{:else}
										<FolderIcon role="presentation" class="fill-blue-300" />
									{/if}
								</div>

								{#if editing()}
									<TreeItemInput class="border bg-white focus:outline-none" />
								{:else}
									<span>{item.node.data.name}</span>
								{/if}
							</div>
							<div>{formatSize(item.node.data.size)}</div>
							<div>{getKind(item.node)}</div>
						{/snippet}
					</TreeItem>
				{/snippet}
			</Tree>
		</TreeContextMenuTrigger>
	</TreeContextMenu>
</main>

<style>
	:root {
		--grid-cols: 5fr 1fr 2fr;
		--grid-gap: calc(var(--spacing) * 4);
		--grid-inline-padding: calc(var(--spacing) * 3);
	}
</style>
