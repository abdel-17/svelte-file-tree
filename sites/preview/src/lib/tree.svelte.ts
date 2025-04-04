import * as tree from "svelte-file-tree";

function getTotalSize(nodes: Array<FileTreeNode>): number {
	let size = 0;
	for (const node of nodes) {
		size += node.size;
	}
	return size;
}

export class FileTree extends tree.FileTree<FileNode | FolderNode> {
	readonly size = $derived(getTotalSize(this.children));
}

export interface FileNodeProps extends tree.FileNodeProps {
	size: number;
}

export class FileNode extends tree.FileNode {
	readonly size: number;

	constructor(props: FileNodeProps) {
		super(props);
		this.size = props.size;
	}

	readonly kind: string = $derived.by(() => {
		const { name } = this;
		const dotIndex = name.lastIndexOf(".");
		if (dotIndex === -1) {
			return "File";
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
			default: {
				return "File";
			}
		}
	});

	copy(): FileNode {
		return new FileNode({
			id: crypto.randomUUID(),
			name: this.name,
			size: this.size,
		});
	}
}

export type FolderNodeProps = tree.FolderNodeProps;

export class FolderNode extends tree.FolderNode<FileNode | FolderNode> {
	readonly size = $derived(getTotalSize(this.children));

	readonly kind = "Folder";

	copy(): FolderNode {
		return new FolderNode({
			id: crypto.randomUUID(),
			name: this.name,
			children: this.children.map((child) => child.copy()),
		});
	}
}

export type FileTreeNode = FileNode | FolderNode;
