import { describe, expect, it } from "vitest";
import { type FileOrFolder, FileTree, FileTreeClipboard, type FolderNode } from "./tree.svelte.js";

function createTree(props?: FileTree.Props): FileTree {
	const tree = new FileTree(props);
	tree.children = [
		tree.folder({
			id: "1",
			name: "Section 1",
			children: [
				tree.folder({
					id: "1.1",
					name: "Section 1.1",
					children: [
						tree.file({
							id: "1.1.1",
							name: "Section 1.1.1",
						}),
						tree.file({
							id: "1.1.2",
							name: "Section 1.1.2",
						}),
						tree.file({
							id: "1.1.3",
							name: "Section 1.1.3",
						}),
					],
				}),
				tree.folder({
					id: "1.2",
					name: "Section 1.2",
					children: [
						tree.file({
							id: "1.2.1",
							name: "Section 1.2.1",
						}),
						tree.file({
							id: "1.2.2",
							name: "Section 1.2.2",
						}),
					],
				}),
			],
		}),
		tree.folder({
			id: "2",
			name: "Section 2",
			children: [
				tree.file({
					id: "2.1",
					name: "Section 2.1",
				}),
				tree.file({
					id: "2.2",
					name: "Section 2.2",
				}),
			],
		}),
		tree.folder({
			id: "3",
			name: "Section 3",
			children: [
				tree.file({
					id: "3.1",
					name: "Section 3.1",
				}),
				tree.file({
					id: "3.2",
					name: "Section 3.2",
				}),
			],
		}),
	];
	return tree;
}

describe("FileTree", () => {
	it("initializes children correctly", () => {
		const tree = createTree();
		const children = tree.children.map((node) => node.id);
		expect(children).toEqual(["1", "2", "3"]);
	});

	it("selects all visible nodes when selectAll() is called", () => {
		const tree = createTree();
		expect(tree.selectedIds).empty;

		tree.selectAll();
		expect([...tree.selectedIds]).toEqual(["1", "2", "3"]);

		tree.expandedIds.add("1");
		tree.selectedIds.clear();
		tree.selectAll();
		expect([...tree.selectedIds]).toEqual(["1", "1.1", "1.2", "2", "3"]);

		tree.expandedIds.add("1.1").add("1.2");
		tree.selectedIds.clear();
		tree.selectAll();
		expect([...tree.selectedIds]).toEqual([
			"1",
			"1.1",
			"1.1.1",
			"1.1.2",
			"1.1.3",
			"1.2",
			"1.2.1",
			"1.2.2",
			"2",
			"3",
		]);
	});
});

describe("FileTreeClipboard", () => {
	it("sets action and ids when set() is called", () => {
		const clipboard = new FileTreeClipboard();
		expect(clipboard.ids).empty;
		expect(clipboard.action).toBeUndefined();

		clipboard.set({
			action: "copy",
			ids: ["1", "2", "3"],
		});
		expect([...clipboard.ids]).toEqual(["1", "2", "3"]);
		expect(clipboard.action).toBe("copy");

		clipboard.set({
			action: "cut",
			ids: ["3", "4"],
		});
		expect([...clipboard.ids]).toEqual(["3", "4"]);
		expect(clipboard.action).toBe("cut");
	});

	it("sets action to undefined when set() is called with empty ids", () => {
		const clipboard = new FileTreeClipboard();
		expect(clipboard.ids).empty;
		expect(clipboard.action).toBeUndefined();

		clipboard.set({
			action: "copy",
			ids: [],
		});
		expect(clipboard.ids).empty;
		expect(clipboard.action).toBeUndefined();
	});

	it("removes the given id when delete() is called", () => {
		const clipboard = new FileTreeClipboard();
		clipboard.set({
			action: "copy",
			ids: ["1", "2", "3"],
		});
		expect([...clipboard.ids]).toEqual(["1", "2", "3"]);
		expect(clipboard.action).toBe("copy");

		clipboard.delete("2");
		expect([...clipboard.ids]).toEqual(["1", "3"]);
		expect(clipboard.action).toBe("copy");

		clipboard.delete("1");
		expect([...clipboard.ids]).toEqual(["3"]);
		expect(clipboard.action).toBe("copy");
	});

	it("sets action to undefined when delete() is called on the last id", () => {
		const clipboard = new FileTreeClipboard();
		clipboard.set({
			action: "copy",
			ids: ["1"],
		});
		expect([...clipboard.ids]).toEqual(["1"]);
		expect(clipboard.action).toBe("copy");

		clipboard.delete("1");
		expect(clipboard.ids).empty;
		expect(clipboard.action).toBeUndefined();
	});

	it("clears ids and sets action to undefined when clear() is called", () => {
		const clipboard = new FileTreeClipboard();
		clipboard.set({
			action: "copy",
			ids: ["1", "2", "3"],
		});
		expect([...clipboard.ids]).toEqual(["1", "2", "3"]);
		expect(clipboard.action).toBe("copy");

		clipboard.clear();
		expect(clipboard.ids).empty;
		expect(clipboard.action).toBeUndefined();
	});
});

describe("FileOrFolder", () => {
	it("initializes name correctly", () => {
		const tree = createTree();
		const names = map(tree, (node) => node.name);
		expect(names).toEqual({
			"1": "Section 1",
			"1.1": "Section 1.1",
			"1.1.1": "Section 1.1.1",
			"1.1.2": "Section 1.1.2",
			"1.1.3": "Section 1.1.3",
			"1.2": "Section 1.2",
			"1.2.1": "Section 1.2.1",
			"1.2.2": "Section 1.2.2",
			"2": "Section 2",
			"2.1": "Section 2.1",
			"2.2": "Section 2.2",
			"3": "Section 3",
			"3.1": "Section 3.1",
			"3.2": "Section 3.2",
		});
	});

	it("initializes selected correctly", () => {
		const tree = createTree({
			defaultSelectedIds: ["1", "1.1", "2"],
		});
		const selected = map(tree, (node) => node.selected);
		expect(selected).toEqual({
			"1": true,
			"1.1": true,
			"1.1.1": false,
			"1.1.2": false,
			"1.1.3": false,
			"1.2": false,
			"1.2.1": false,
			"1.2.2": false,
			"2": true,
			"2.1": false,
			"2.2": false,
			"3": false,
			"3.1": false,
			"3.2": false,
		});
	});

	it("updates selected when FileTree.selectedIds updates", () => {
		const tree = createTree();
		const node = tree.children[0];
		expect(node.selected).false;

		tree.selectedIds.add("1");
		expect(node.selected).true;

		tree.selectedIds.delete("1");
		expect(node.selected).false;
	});

	it("initializes inClipboard correctly", () => {
		const tree = createTree();
		tree.clipboard.set({
			action: "copy",
			ids: ["1", "1.1", "2"],
		});
		const inClipboard = map(tree, (node) => node.inClipboard);
		expect(inClipboard).toEqual({
			"1": true,
			"1.1": true,
			"1.1.1": false,
			"1.1.2": false,
			"1.1.3": false,
			"1.2": false,
			"1.2.1": false,
			"1.2.2": false,
			"2": true,
			"2.1": false,
			"2.2": false,
			"3": false,
			"3.1": false,
			"3.2": false,
		});
	});

	it("updates inClipboard when FileTree.clipboard updates", () => {
		const tree = createTree();
		const node = tree.children[0];
		expect(node.inClipboard).toBe(false);

		tree.clipboard.set({
			action: "copy",
			ids: ["1"],
		});
		expect(node.inClipboard).toBe(true);

		tree.clipboard.delete("1");
		expect(node.inClipboard).toBe(false);
	});

	it("sets selected to true when select() is called", () => {
		const tree = createTree();
		const node = tree.children[0];
		expect(node.selected).false;

		node.select();
		expect(node.selected).true;
	});

	it("sets selected to false when deselect() is called", () => {
		const tree = createTree({
			defaultSelectedIds: ["1"],
		});
		const node = tree.children[0];
		expect(node.selected).true;

		node.deselect();
		expect(node.selected).false;
	});

	it("flips the value of selected when toggleSelected() is called", () => {
		const tree = createTree();
		const node = tree.children[0];
		expect(node.selected).false;

		node.toggleSelected();
		expect(node.selected).true;

		node.toggleSelected();
		expect(node.selected).false;
	});
});

describe("FolderNode", () => {
	it("initializes children correctly", () => {
		const tree = createTree();
		const children = mapFolders(tree, (node) => node.children.map((child) => child.id));
		expect(children).toEqual({
			"1": ["1.1", "1.2"],
			"1.1": ["1.1.1", "1.1.2", "1.1.3"],
			"1.2": ["1.2.1", "1.2.2"],
			"2": ["2.1", "2.2"],
			"3": ["3.1", "3.2"],
		});
	});

	it("initializes expanded correctly", () => {
		const tree = createTree({
			defaultExpandedIds: ["1", "1.1", "2"],
		});
		const expanded = mapFolders(tree, (node) => node.expanded);
		expect(expanded).toEqual({
			"1": true,
			"1.1": true,
			"1.2": false,
			"2": true,
			"3": false,
		});
	});

	it("updates expanded when FileTree.expandedIds updates", () => {
		const tree = createTree();
		const node = tree.children[0] as FolderNode;
		expect(node.expanded).false;

		tree.expandedIds.add("1");
		expect(node.expanded).true;

		tree.expandedIds.delete("1");
		expect(node.expanded).false;
	});

	it("sets expanded to true when expand() is called", () => {
		const tree = createTree();
		const node = tree.children[0] as FolderNode;
		expect(node.expanded).false;

		node.expand();
		expect(node.expanded).true;
	});

	it("sets expanded to false when collapse() is called", () => {
		const tree = createTree({
			defaultExpandedIds: ["1"],
		});
		const node = tree.children[0] as FolderNode;
		expect(node.expanded).true;

		node.collapse();
		expect(node.expanded).false;
	});

	it("flips the value of expanded when toggleExpanded() is called", () => {
		const tree = createTree();
		const node = tree.children[0] as FolderNode;
		expect(node.expanded).false;

		node.toggleExpanded();
		expect(node.expanded).true;

		node.toggleExpanded();
		expect(node.expanded).false;
	});
});

function forEach(nodes: FileOrFolder[], callback: (node: FileOrFolder) => void): void {
	for (const node of nodes) {
		callback(node);

		if (node.type === "folder") {
			forEach(node.children, callback);
		}
	}
}

function map<TValue>(
	tree: FileTree,
	transform: (node: FileOrFolder) => TValue,
): Record<string, TValue> {
	const result: Record<string, TValue> = {};
	forEach(tree.children, (node) => {
		result[node.id] = transform(node);
	});
	return result;
}

function mapFolders<TValue>(
	tree: FileTree,
	transform: (node: FolderNode) => TValue,
): Record<string, TValue> {
	const result: Record<string, TValue> = {};
	forEach(tree.children, (node) => {
		if (node.type === "folder") {
			result[node.id] = transform(node);
		}
	});
	return result;
}
