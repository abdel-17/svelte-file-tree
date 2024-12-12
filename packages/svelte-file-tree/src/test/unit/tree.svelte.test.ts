import {
	FileTree,
	type FileTreeItem,
	type FileTreeNode,
	type FolderNode,
} from "$lib/tree.svelte.js";
import { describe, expect, test } from "vitest";

const items: FileTreeItem[] = [
	{
		type: "folder",
		id: "1",
		name: "Section 1",
		children: [
			{
				type: "folder",
				id: "1.1",
				name: "Section 1.1",
				children: [
					{
						type: "file",
						id: "1.1.1",
						name: "Section 1.1.1",
					},
					{
						type: "file",
						id: "1.1.2",
						name: "Section 1.1.2",
					},
					{
						type: "file",
						id: "1.1.3",
						name: "Section 1.1.3",
					},
				],
			},
			{
				type: "folder",
				id: "1.2",
				name: "Section 1.2",
				children: [
					{
						type: "file",
						id: "1.2.1",
						name: "Section 1.2.1",
					},
					{
						type: "file",
						id: "1.2.2",
						name: "Section 1.2.2",
					},
				],
			},
		],
	},
	{
		type: "folder",
		id: "2",
		name: "Section 2",
		children: [
			{
				type: "file",
				id: "2.1",
				name: "Section 2.1",
			},
			{
				type: "file",
				id: "2.2",
				name: "Section 2.2",
			},
		],
	},
	{
		type: "folder",
		id: "3",
		name: "Section 3",
		children: [
			{
				type: "file",
				id: "3.1",
				name: "Section 3.1",
			},
			{
				type: "file",
				id: "3.2",
				name: "Section 3.2",
			},
		],
	},
];

describe("FileTree", () => {
	test("FileTree.nodes", () => {
		const tree = new FileTree({ items });
		expect(tree.nodes.map((node) => node.id)).toEqual(["1", "2", "3"]);
	});

	test("FileTreeNode.name", () => {
		const tree = new FileTree({ items });
		const names = map(tree, (node) => node.name);
		expect(names).toEqual({
			"1": "Section 1",
			"2": "Section 2",
			"3": "Section 3",
			"1.1": "Section 1.1",
			"1.2": "Section 1.2",
			"2.1": "Section 2.1",
			"2.2": "Section 2.2",
			"3.1": "Section 3.1",
			"3.2": "Section 3.2",
			"1.1.1": "Section 1.1.1",
			"1.1.2": "Section 1.1.2",
			"1.1.3": "Section 1.1.3",
			"1.2.1": "Section 1.2.1",
			"1.2.2": "Section 1.2.2",
		});
	});

	test("FileTreeNode.tree", () => {
		const tree = new FileTree({ items });
		forEach(tree.nodes, (node) => {
			expect(node.tree).toBe(tree);
		});
	});

	test("FileTreeNode.parent", () => {
		const tree = new FileTree({ items });
		const parents = map(tree, (node) => node.parent?.id);
		expect(parents).toEqual({
			"1": undefined,
			"2": undefined,
			"3": undefined,
			"1.1": "1",
			"1.2": "1",
			"2.1": "2",
			"2.2": "2",
			"3.1": "3",
			"3.2": "3",
			"1.1.1": "1.1",
			"1.1.2": "1.1",
			"1.1.3": "1.1",
			"1.2.1": "1.2",
			"1.2.2": "1.2",
		});
	});

	test("FileTreeNode.depth", () => {
		const tree = new FileTree({ items });
		const depths = map(tree, (node) => node.depth);
		expect(depths).toEqual({
			"1": 0,
			"2": 0,
			"3": 0,
			"1.1": 1,
			"1.2": 1,
			"2.1": 1,
			"2.2": 1,
			"3.1": 1,
			"3.2": 1,
			"1.1.1": 2,
			"1.1.2": 2,
			"1.1.3": 2,
			"1.2.1": 2,
			"1.2.2": 2,
		});
	});

	test("FileTreeNode.siblings", () => {
		const tree = new FileTree({ items });
		const siblings = map(tree, (node) => node.siblings.map((sibling) => sibling.id));
		expect(siblings).toEqual({
			"1": ["1", "2", "3"],
			"2": ["1", "2", "3"],
			"3": ["1", "2", "3"],
			"1.1": ["1.1", "1.2"],
			"1.2": ["1.1", "1.2"],
			"2.1": ["2.1", "2.2"],
			"2.2": ["2.1", "2.2"],
			"3.1": ["3.1", "3.2"],
			"3.2": ["3.1", "3.2"],
			"1.1.1": ["1.1.1", "1.1.2", "1.1.3"],
			"1.1.2": ["1.1.1", "1.1.2", "1.1.3"],
			"1.1.3": ["1.1.1", "1.1.2", "1.1.3"],
			"1.2.1": ["1.2.1", "1.2.2"],
			"1.2.2": ["1.2.1", "1.2.2"],
		});
	});

	test("FileTreeNode.selected", () => {
		const tree = new FileTree({
			items,
			defaultSelected: ["1", "2", "1.1"],
		});
		const selected = map(tree, (node) => node.selected);
		expect(selected).toEqual({
			"1": true,
			"2": true,
			"3": false,
			"1.1": true,
			"1.2": false,
			"2.1": false,
			"2.2": false,
			"3.1": false,
			"3.2": false,
			"1.1.1": false,
			"1.1.2": false,
			"1.1.3": false,
			"1.2.1": false,
			"1.2.2": false,
		});
	});

	test("Updating Tree.selected updates FileTreeNode.selected", () => {
		const tree = new FileTree({ items });
		const node_1 = tree.nodes[0];

		tree.selected.add("1");
		expect(node_1.selected).true;

		tree.selected.delete("1");
		expect(node_1.selected).false;
	});

	test("FileTreeNode selection methods", () => {
		const tree = new FileTree({ items });
		const node_1 = tree.nodes[0];

		node_1.select();
		expect(node_1.selected).true;
		expect([...tree.selected]).toEqual(["1"]);

		node_1.unselect();
		expect(node_1.selected).false;
		expect(tree.selected).empty;

		node_1.toggleSelection();
		expect(node_1.selected).true;
		expect([...tree.selected]).toEqual(["1"]);

		node_1.toggleSelection();
		expect(node_1.selected).false;
		expect(tree.selected).empty;
	});

	test("FileTreeNode.isFolder()", () => {
		const tree = new FileTree({ items });
		const isFolder = map(tree, (node) => node.isFolder());
		expect(isFolder).toEqual({
			"1": true,
			"2": true,
			"3": true,
			"1.1": true,
			"1.2": true,
			"2.1": false,
			"2.2": false,
			"3.1": false,
			"3.2": false,
			"1.1.1": false,
			"1.1.2": false,
			"1.1.3": false,
			"1.2.1": false,
			"1.2.2": false,
		});
	});

	test("FolderNode.children", () => {
		const tree = new FileTree({ items });
		const children = map(tree, (node) => {
			if (node.isFolder()) {
				return node.children.map((child) => child.id);
			}
		});
		expect(children).toEqual({
			"1": ["1.1", "1.2"],
			"2": ["2.1", "2.2"],
			"3": ["3.1", "3.2"],
			"1.1": ["1.1.1", "1.1.2", "1.1.3"],
			"1.2": ["1.2.1", "1.2.2"],
			"2.1": undefined,
			"2.2": undefined,
			"3.1": undefined,
			"3.2": undefined,
			"1.1.1": undefined,
			"1.1.2": undefined,
			"1.1.3": undefined,
			"1.2.1": undefined,
			"1.2.2": undefined,
		});
	});

	test("FolderNode.expanded", () => {
		const tree = new FileTree({
			items,
			defaultExpanded: ["1", "2", "1.1"],
		});
		const expanded = map(tree, (node) => node.isFolder() && node.expanded);
		expect(expanded).toEqual({
			"1": true,
			"2": true,
			"3": false,
			"1.1": true,
			"1.2": false,
			"2.1": false,
			"2.2": false,
			"3.1": false,
			"3.2": false,
			"1.1.1": false,
			"1.1.2": false,
			"1.1.3": false,
			"1.2.1": false,
			"1.2.2": false,
		});
	});

	test("Updating Tree.expanded updates FolderNode.expanded", () => {
		const tree = new FileTree({ items });
		const node_1 = tree.nodes[0] as FolderNode;

		tree.expanded.add("1");
		expect(node_1.expanded).true;

		tree.expanded.delete("1");
		expect(node_1.expanded).false;
	});

	test("FolderNode expansion methods", () => {
		const tree = new FileTree({ items });
		const node_1 = tree.nodes[0] as FolderNode;

		node_1.expand();
		expect(node_1.expanded).true;
		expect([...tree.expanded]).toEqual(["1"]);

		node_1.collapse();
		expect(node_1.expanded).false;
		expect(tree.expanded).empty;

		node_1.toggleExpansion();
		expect(node_1.expanded).true;
		expect([...tree.expanded]).toEqual(["1"]);

		node_1.toggleExpansion();
		expect(node_1.expanded).false;
		expect(tree.expanded).empty;
	});

	test("FolderNode.contains() itself and its descendants", () => {
		const tree = new FileTree({ items });
		const node_1 = tree.nodes[0] as FolderNode;
		const [node_11, node_12] = node_1.children as FolderNode[];
		const [node_111, node_112, node_113] = node_11.children;
		const [node_121, node_122] = node_12.children;

		expect(node_1.contains(node_1)).true;
		expect(node_1.contains(node_11)).true;
		expect(node_1.contains(node_12)).true;
		expect(node_1.contains(node_111)).true;
		expect(node_1.contains(node_112)).true;
		expect(node_1.contains(node_113)).true;
		expect(node_1.contains(node_121)).true;
		expect(node_1.contains(node_122)).true;

		expect(node_11.contains(node_11)).true;
		expect(node_11.contains(node_111)).true;
		expect(node_11.contains(node_112)).true;
		expect(node_11.contains(node_113)).true;

		expect(node_12.contains(node_12)).true;
		expect(node_12.contains(node_121)).true;
		expect(node_12.contains(node_122)).true;
	});

	test("FolderNode.contains() not ancestors and adjacent subtrees", () => {
		const tree = new FileTree({ items });
		const [node_1, node_2, node_3] = tree.nodes as FolderNode[];
		const [node_11, node_12] = node_1.children as FolderNode[];
		const [node_21, node_22] = node_2.children;
		const [node_31, node_32] = node_3.children;
		const [node_111, node_112, node_113] = node_11.children;
		const [node_121, node_122] = node_12.children;

		expect(node_1.contains(node_2)).false;
		expect(node_1.contains(node_3)).false;
		expect(node_1.contains(node_21)).false;
		expect(node_1.contains(node_22)).false;
		expect(node_1.contains(node_31)).false;
		expect(node_1.contains(node_32)).false;

		expect(node_2.contains(node_1)).false;
		expect(node_2.contains(node_3)).false;
		expect(node_2.contains(node_11)).false;
		expect(node_2.contains(node_12)).false;
		expect(node_2.contains(node_31)).false;
		expect(node_2.contains(node_32)).false;
		expect(node_2.contains(node_111)).false;
		expect(node_2.contains(node_112)).false;
		expect(node_2.contains(node_113)).false;
		expect(node_2.contains(node_121)).false;
		expect(node_2.contains(node_122)).false;

		expect(node_3.contains(node_1)).false;
		expect(node_3.contains(node_2)).false;
		expect(node_3.contains(node_11)).false;
		expect(node_3.contains(node_12)).false;
		expect(node_3.contains(node_21)).false;
		expect(node_3.contains(node_22)).false;
		expect(node_3.contains(node_111)).false;
		expect(node_3.contains(node_112)).false;
		expect(node_3.contains(node_113)).false;
		expect(node_3.contains(node_121)).false;
		expect(node_3.contains(node_122)).false;

		expect(node_11.contains(node_1)).false;
		expect(node_11.contains(node_2)).false;
		expect(node_11.contains(node_3)).false;
		expect(node_11.contains(node_12)).false;
		expect(node_11.contains(node_21)).false;
		expect(node_11.contains(node_22)).false;
		expect(node_11.contains(node_31)).false;
		expect(node_11.contains(node_32)).false;
		expect(node_11.contains(node_121)).false;
		expect(node_11.contains(node_122)).false;

		expect(node_12.contains(node_1)).false;
		expect(node_12.contains(node_2)).false;
		expect(node_12.contains(node_3)).false;
		expect(node_12.contains(node_11)).false;
		expect(node_12.contains(node_21)).false;
		expect(node_12.contains(node_22)).false;
		expect(node_12.contains(node_31)).false;
		expect(node_12.contains(node_32)).false;
		expect(node_12.contains(node_111)).false;
		expect(node_12.contains(node_112)).false;
		expect(node_12.contains(node_113)).false;
	});
});

function forEach(nodes: FileTreeNode[], callback: (node: FileTreeNode) => void): void {
	for (const node of nodes) {
		callback(node);
		if (node.isFolder()) {
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
