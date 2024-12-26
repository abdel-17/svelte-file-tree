import { describe, expect, test } from "vitest";
import { FileTree, type FileTreeNode, type FileTreeProps, type FolderNode } from "./tree.svelte.js";

function createTree(props?: FileTreeProps): FileTree {
	const tree = new FileTree(props);
	tree.nodes = [
		tree.createFolder({
			id: "1",
			name: "Section 1",
			children: [
				tree.createFolder({
					id: "1.1",
					name: "Section 1.1",
					children: [
						tree.createFile({
							id: "1.1.1",
							name: "Section 1.1.1",
						}),
						tree.createFile({
							id: "1.1.2",
							name: "Section 1.1.2",
						}),
						tree.createFile({
							id: "1.1.3",
							name: "Section 1.1.3",
						}),
					],
				}),
				tree.createFolder({
					id: "1.2",
					name: "Section 1.2",
					children: [
						tree.createFile({
							id: "1.2.1",
							name: "Section 1.2.1",
						}),
						tree.createFile({
							id: "1.2.2",
							name: "Section 1.2.2",
						}),
					],
				}),
			],
		}),
		tree.createFolder({
			id: "2",
			name: "Section 2",
			children: [
				tree.createFile({
					id: "2.1",
					name: "Section 2.1",
				}),
				tree.createFile({
					id: "2.2",
					name: "Section 2.2",
				}),
			],
		}),
		tree.createFolder({
			id: "3",
			name: "Section 3",
			children: [
				tree.createFile({
					id: "3.1",
					name: "Section 3.1",
				}),
				tree.createFile({
					id: "3.2",
					name: "Section 3.2",
				}),
			],
		}),
	];
	return tree;
}

describe("FileTree", () => {
	test("FileTree.nodes", () => {
		const tree = createTree();
		expect(tree.nodes.map((node) => node.id)).toEqual(["1", "2", "3"]);
	});
});

describe("FileTreeNode", () => {
	test("FileTreeNode.type", () => {
		const tree = createTree();
		const types = map(tree, (node) => node.type);
		expect(types).toEqual({
			"1": "folder",
			"1.1": "folder",
			"1.1.1": "file",
			"1.1.2": "file",
			"1.1.3": "file",
			"1.2": "folder",
			"1.2.1": "file",
			"1.2.2": "file",
			"2": "folder",
			"2.1": "file",
			"2.2": "file",
			"3": "folder",
			"3.1": "file",
			"3.2": "file",
		});
	});

	test("FileTreeNode.name", () => {
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

	test("FileTreeNode.selected", () => {
		const tree = createTree({
			defaultSelected: ["1", "1.1", "2"],
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

	test("Updating Tree.selected updates FileTreeNode.selected", () => {
		const tree = createTree();
		const node_1 = tree.nodes[0];

		tree.selected.add("1");
		expect(node_1.selected).true;

		tree.selected.delete("1");
		expect(node_1.selected).false;
	});

	test("FileTreeNode.copied", () => {
		const tree = createTree({
			defaultCopied: ["1", "1.1", "2"],
		});
		const copied = map(tree, (node) => node.copied);
		expect(copied).toEqual({
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

	test("Updating Tree.copied updates FileTreeNode.copied", () => {
		const tree = createTree();
		const node_1 = tree.nodes[0];

		tree.copied.add("1");
		expect(node_1.copied).true;

		tree.copied.delete("1");
		expect(node_1.copied).false;
	});
});

describe("FolderNode", () => {
	test("FolderNode.children", () => {
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

	test("FolderNode.expanded", () => {
		const tree = createTree({
			defaultExpanded: ["1", "1.1", "2"],
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

	test("Updating Tree.expanded updates FolderNode.expanded", () => {
		const tree = createTree();
		const node_1 = tree.nodes[0] as FolderNode;

		tree.expanded.add("1");
		expect(node_1.expanded).true;

		tree.expanded.delete("1");
		expect(node_1.expanded).false;
	});
});

function forEach(nodes: FileTreeNode[], callback: (node: FileTreeNode) => void): void {
	for (const node of nodes) {
		callback(node);

		if (node.type === "folder") {
			forEach(node.children, callback);
		}
	}
}

function map<TValue>(
	tree: FileTree,
	transform: (node: FileTreeNode) => TValue,
): Record<string, TValue> {
	const result: Record<string, TValue> = {};
	forEach(tree.nodes, (node) => {
		result[node.id] = transform(node);
	});
	return result;
}

function mapFolders<TValue>(
	tree: FileTree,
	transform: (node: FolderNode) => TValue,
): Record<string, TValue> {
	const result: Record<string, TValue> = {};
	forEach(tree.nodes, (node) => {
		if (node.type === "folder") {
			result[node.id] = transform(node);
		}
	});
	return result;
}
