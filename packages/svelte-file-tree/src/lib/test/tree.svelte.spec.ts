import { Tree, type TreeNode } from "$lib/components/tree.svelte.js";
import { render, screen } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import { flushSync } from "svelte";
import { SvelteSet } from "svelte/reactivity";
import { describe, expect, test } from "vitest";
import TreeView from "./TreeView.svelte";
import { effectRootScope } from "./helpers.svelte.js";

const items = [
	{
		id: "1",
		value: "Section 1",
		children: [
			{
				id: "1.1",
				value: "Section 1.1",
				children: [
					{
						id: "1.1.1",
						value: "Section 1.1.1",
					},
					{
						id: "1.1.2",
						value: "Section 1.1.2",
					},
					{
						id: "1.1.3",
						value: "Section 1.1.3",
					},
				],
			},
			{
				id: "1.2",
				value: "Section 1.2",
				children: [
					{
						id: "1.2.1",
						value: "Section 1.2.1",
					},
					{
						id: "1.2.2",
						value: "Section 1.2.2",
					},
				],
			},
		],
	},
	{
		id: "2",
		value: "Section 2",
		children: [
			{
				id: "2.1",
				value: "Section 2.1",
			},
			{
				id: "2.2",
				value: "Section 2.2",
			},
		],
	},
	{
		id: "3",
		value: "Section 3",
		children: [
			{
				id: "3.1",
				value: "Section 3.1",
			},
			{
				id: "3.2",
				value: "Section 3.2",
			},
		],
	},
];

describe("Tree", () => {
	function map<In, Out>(
		nodes: Iterable<TreeNode<In>>,
		transform: (node: TreeNode<In>) => Out,
	): Record<string, Out> {
		const result: Record<string, Out> = {};
		for (const node of nodes) {
			result[node.id] = transform(node);
		}
		return result;
	}

	test("Tree.roots", () => {
		const tree = new Tree({ items: () => items });
		const ids = tree.roots.map((node) => node.id);
		expect(ids).toEqual(["1", "2", "3"]);
	});

	test("Tree.last where none of the nodes are expanded", () => {
		const tree = new Tree({ items: () => items });
		const { last } = tree;
		expect(last?.id).toBe("3");
	});

	test("Tree.last where the last root is expanded", () => {
		const tree = new Tree({
			items: () => items,
			defaultExpanded: ["3"],
		});
		const { last } = tree;
		expect(last?.id).toBe("3.2");
	});

	test("Tree.last is undefined when the tree is empty", () => {
		const tree = new Tree({ items: () => [] });
		const { last } = tree;
		expect(last).toBeUndefined();
	});

	test("Tree.selected defaults to being empty", () => {
		const tree = new Tree({ items: () => [] });
		expect(tree.selected).empty;
	});

	test("Tree.selected controlled", () => {
		const selected = new SvelteSet<string>();
		const tree = new Tree({
			items: () => [],
			selected,
		});
		expect(tree.selected).toBe(selected);
	});

	test("Tree.selected uncontrolled", () => {
		const defaultSelected = ["1.1.1"];
		const tree = new Tree({
			items: () => [],
			defaultSelected,
		});
		expect(tree.selected).toEqual(new SvelteSet(defaultSelected));
	});

	test("Tree.expanded defaults to being empty", () => {
		const tree = new Tree({ items: () => [] });
		expect(tree.expanded).empty;
	});

	test("Tree.expanded controlled", () => {
		const expanded = new SvelteSet<string>();
		const tree = new Tree({
			items: () => [],
			expanded,
		});
		expect(tree.expanded).toBe(expanded);
	});

	test("Tree.expanded uncontrolled", () => {
		const defaultExpanded = ["1.1.1"];
		const tree = new Tree({
			items: () => [],
			defaultExpanded,
		});
		expect(tree.expanded).toEqual(new SvelteSet(defaultExpanded));
	});

	test("Tree.tabbable is initialized to the first node", () => {
		const tree = new Tree({ items: () => items });
		expect(tree.tabbable).toBe("1");
		expect(tree.previousTabbable).toBeUndefined();
	});

	test("Tree.previousTabbable is updated when Tree.tabbable is updated", () => {
		effectRootScope(() => {
			const tree = new Tree({ items: () => items });

			tree.tabbable = "2";
			expect(tree.tabbable).toBe("2");
			expect(tree.previousTabbable).toBe("1");
		});
	});

	test("Tree.dragged is initialized to undefined", () => {
		const tree = new Tree({ items: () => items });
		expect(tree.dragged).toBeUndefined();
	});

	test("Tree.dragged setter", () => {
		effectRootScope(() => {
			const tree = new Tree({ items: () => items });

			tree.dragged = "1";
			expect(tree.dragged).toBe("1");

			tree.dragged = undefined;
			expect(tree.dragged).toBeUndefined();
		});
	});

	test("Tree.traverse() iterates over all nodes", () => {
		const tree = new Tree({ items: () => items });
		const ids = tree
			.traverse()
			.map((node) => node.id)
			.toArray();
		expect(ids).toEqual([
			"1",
			"1.1",
			"1.1.1",
			"1.1.2",
			"1.1.3",
			"1.2",
			"1.2.1",
			"1.2.2",
			"2",
			"2.1",
			"2.2",
			"3",
			"3.1",
			"3.2",
		]);
	});

	test("Tree.values() iterates over the visible nodes", () => {
		const tree = new Tree({
			items: () => items,
			defaultExpanded: ["1", "1.1", "2"],
		});
		const ids = tree
			.values()
			.map((node) => node.id)
			.toArray();
		expect(ids).toEqual([
			"1",
			"1.1",
			"1.1.1",
			"1.1.2",
			"1.1.3",
			"1.2",
			"2",
			"2.1",
			"2.2",
			"3",
		]);
	});

	test("Tree.reversed() iterates over the visible nodes in reverse", () => {
		const tree = new Tree({
			items: () => items,
			defaultExpanded: ["1", "1.1", "2"],
		});
		const ids = tree
			.reversed()
			.map((node) => node.id)
			.toArray();
		expect(ids).toEqual([
			"3",
			"2.2",
			"2.1",
			"2",
			"1.2",
			"1.1.3",
			"1.1.2",
			"1.1.1",
			"1.1",
			"1",
		]);
	});

	test("Tree is iterable", () => {
		const tree = new Tree({
			items: () => items,
			defaultExpanded: ["1", "1.1", "2"],
		});
		const ids = Array.from(tree).map((node) => node.id);
		expect(ids).toEqual([
			"1",
			"1.1",
			"1.1.1",
			"1.1.2",
			"1.1.3",
			"1.2",
			"2",
			"2.1",
			"2.2",
			"3",
		]);
	});

	test("Tree.get() returns the node with the given id", () => {
		const tree = new Tree({ items: () => items });
		for (const node of tree.traverse()) {
			const lookup = tree.get(node.id);
			expect(lookup).toBe(node);
		}
	});

	test("TreeNode.id setter updates references to the previous value", () => {
		effectRootScope(() => {
			const tree = new Tree({
				items: () => items,
				defaultSelected: ["1"],
				defaultExpanded: ["1"],
			});

			const first = tree.roots[0]!;
			first.id = "first";
			expect(tree.selected).toEqual(new SvelteSet(["first"]));
			expect(tree.expanded).toEqual(new SvelteSet(["first"]));
			expect(tree.tabbable).toBe("first");
			expect(tree.previousTabbable).toBeUndefined();
			expect(tree.dragged).toBeUndefined();

			const second = tree.roots[1]!;
			tree.tabbable = second.id;
			tree.dragged = second.id;
			second.id = "second";
			expect(tree.selected).toEqual(new SvelteSet(["first"]));
			expect(tree.expanded).toEqual(new SvelteSet(["first"]));
			expect(tree.tabbable).toBe("second");
			expect(tree.previousTabbable).toBe("first");
			expect(tree.dragged).toBe("second");

			first.id = "1";
			second.id = "2";
			expect(tree.selected).toEqual(new SvelteSet(["1"]));
			expect(tree.expanded).toEqual(new SvelteSet(["1"]));
			expect(tree.tabbable).toBe("2");
			expect(tree.previousTabbable).toBe("1");
			expect(tree.dragged).toBe("2");
		});
	});

	test("TreeNode.value", () => {
		const tree = new Tree({ items: () => items });
		const values = map(tree.traverse(), (node) => node.value);
		expect(values).toEqual({
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

	test("TreeNode.value setter updates the value", () => {
		const tree = new Tree({ items: () => items });
		const first = tree.roots[0]!;

		first.value = "First";
		expect(first.value).toBe("First");
	});

	test("TreeNode.index", () => {
		const tree = new Tree({ items: () => items });
		const indices = map(tree.traverse(), (node) => node.index);
		expect(indices).toEqual({
			"1": 0,
			"2": 1,
			"3": 2,
			"1.1": 0,
			"1.2": 1,
			"2.1": 0,
			"2.2": 1,
			"3.1": 0,
			"3.2": 1,
			"1.1.1": 0,
			"1.1.2": 1,
			"1.1.3": 2,
			"1.2.1": 0,
			"1.2.2": 1,
		});
	});

	test("TreeNode.parent", () => {
		const tree = new Tree({ items: () => items });
		const parents = map(tree.traverse(), (node) => node.parent?.id);
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

	test("TreeNode.children", () => {
		const tree = new Tree({ items: () => items });
		const children = map(tree.traverse(), (node) =>
			node.children.map((child) => child.id),
		);
		expect(children).toEqual({
			"1": ["1.1", "1.2"],
			"2": ["2.1", "2.2"],
			"3": ["3.1", "3.2"],
			"1.1": ["1.1.1", "1.1.2", "1.1.3"],
			"1.2": ["1.2.1", "1.2.2"],
			"2.1": [],
			"2.2": [],
			"3.1": [],
			"3.2": [],
			"1.1.1": [],
			"1.1.2": [],
			"1.1.3": [],
			"1.2.1": [],
			"1.2.2": [],
		});
	});

	test("TreeNode.selected setter updates the selection state", () => {
		effectRootScope(() => {
			const tree = new Tree({ items: () => items });
			const first = tree.roots[0]!;

			first.selected = true;
			expect(first.selected).true;
			expect(tree.selected).toEqual(new SvelteSet(["1"]));

			first.selected = false;
			expect(first.selected).false;
			expect(tree.selected).empty;
		});
	});

	test("TreeNode.select() and TreeNode.unselect() update the selection state", () => {
		effectRootScope(() => {
			const tree = new Tree({ items: () => items });
			const first = tree.roots[0]!;

			first.select();
			expect(first.selected).true;
			expect(tree.selected).toEqual(new SvelteSet(["1"]));

			first.unselect();
			expect(first.selected).false;
			expect(tree.selected).empty;
		});
	});

	test("TreeNode.expanded setter updates the expansion state", () => {
		effectRootScope(() => {
			const tree = new Tree({ items: () => items });
			const first = tree.roots[0]!;

			first.expanded = true;
			expect(first.expanded).true;
			expect(tree.expanded).toEqual(new SvelteSet(["1"]));

			first.expanded = false;
			expect(first.expanded).false;
			expect(tree.expanded).empty;
		});
	});

	test("TreeNode.expand() and TreeNode.collapse() update the expansion state", () => {
		effectRootScope(() => {
			const tree = new Tree({ items: () => items });
			const first = tree.roots[0]!;

			first.expand();
			expect(first.expanded).true;
			expect(tree.expanded).toEqual(new SvelteSet(["1"]));

			first.collapse();
			expect(first.expanded).false;
			expect(tree.expanded).empty;
		});
	});

	test("TreeNode.dragged", () => {
		effectRootScope(() => {
			const tree = new Tree({ items: () => items });
			const first = tree.roots[0]!;
			expect(first.dragged).false;

			tree.dragged = first.id;
			expect(first.dragged).true;

			tree.dragged = undefined;
			expect(first.dragged).false;
		});
	});

	test("TreeNode.dropTarget is false when there is no dragged node", () => {
		const tree = new Tree({ items: () => items });
		const dropTargets = new Set(
			tree
				.traverse()
				.filter((node) => node.dropTarget)
				.map((node) => node.id),
		);
		expect(dropTargets).empty;
	});

	test("TreeNode.dropTarget is true for nodes not contained in the dragged node", () => {
		effectRootScope(() => {
			const tree = new Tree({ items: () => items });
			const first = tree.roots[0]!;

			tree.dragged = first.id;
			const dropTargets = new Set(
				tree
					.traverse()
					.filter((node) => node.dropTarget)
					.map((node) => node.id),
			);
			expect(dropTargets).toEqual(
				new Set(["2", "2.1", "2.2", "3", "3.1", "3.2"]),
			);
		});
	});

	test("TreeNode.level", () => {
		const tree = new Tree({ items: () => items });
		const levels = map(tree.traverse(), (node) => node.level);
		expect(levels).toEqual({
			"1": 1,
			"2": 1,
			"3": 1,
			"1.1": 2,
			"1.2": 2,
			"2.1": 2,
			"2.2": 2,
			"3.1": 2,
			"3.2": 2,
			"1.1.1": 3,
			"1.1.2": 3,
			"1.1.3": 3,
			"1.2.1": 3,
			"1.2.2": 3,
		});
	});

	test("TreeNode.siblings", () => {
		const tree = new Tree({ items: () => items });
		const siblings = map(tree.traverse(), (node) =>
			node.siblings.map((sibling) => sibling.id),
		);
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

	test("TreeNode.previousSibling", () => {
		const tree = new Tree({ items: () => items });
		const previousSiblings = map(
			tree.traverse(),
			(node) => node.previousSibling?.id,
		);
		expect(previousSiblings).toEqual({
			"1": undefined,
			"2": "1",
			"3": "2",
			"1.1": undefined,
			"1.2": "1.1",
			"2.1": undefined,
			"2.2": "2.1",
			"3.1": undefined,
			"3.2": "3.1",
			"1.1.1": undefined,
			"1.1.2": "1.1.1",
			"1.1.3": "1.1.2",
			"1.2.1": undefined,
			"1.2.2": "1.2.1",
		});
	});

	test("TreeNode.nextSibling", () => {
		const tree = new Tree({ items: () => items });
		const nextSiblings = map(tree.traverse(), (node) => node.nextSibling?.id);
		expect(nextSiblings).toEqual({
			"1": "2",
			"2": "3",
			"3": undefined,
			"1.1": "1.2",
			"1.2": undefined,
			"2.1": "2.2",
			"2.2": undefined,
			"3.1": "3.2",
			"3.2": undefined,
			"1.1.1": "1.1.2",
			"1.1.2": "1.1.3",
			"1.1.3": undefined,
			"1.2.1": "1.2.2",
			"1.2.2": undefined,
		});
	});

	test("TreeNode.previous", () => {
		const tree = new Tree({
			items: () => items,
			defaultExpanded: ["1", "1.1", "2"],
		});
		const previous = map(tree, (node) => node.previous?.id);
		expect(previous).toEqual({
			"1": undefined,
			"1.1": "1",
			"1.1.1": "1.1",
			"1.1.2": "1.1.1",
			"1.1.3": "1.1.2",
			"1.2": "1.1.3",
			"2": "1.2",
			"2.1": "2",
			"2.2": "2.1",
			"3": "2.2",
		});
	});

	test("TreeNode.next", () => {
		const tree = new Tree({
			items: () => items,
			defaultExpanded: ["1", "1.1", "2"],
		});
		const next = map(tree, (node) => node.next?.id);
		expect(next).toEqual({
			"1": "1.1",
			"1.1": "1.1.1",
			"1.1.1": "1.1.2",
			"1.1.2": "1.1.3",
			"1.1.3": "1.2",
			"1.2": "2",
			"2": "2.1",
			"2.1": "2.2",
			"2.2": "3",
			"3": undefined,
		});
	});

	test("TreeNode.move() before a sibling node", () => {
		effectRootScope(() => {
			const tree = new Tree({ items: () => items });
			const node_11 = tree.roots[0]!.children[0]!;
			const node_111 = node_11.children[0]!;
			const node_112 = node_11.children[1]!;
			const node_113 = node_11.children[2]!;

			node_111.move("before", node_113);
			expect(node_11.children).toEqual([node_112, node_111, node_113]);
			expect(node_112.index).toBe(0);
			expect(node_111.index).toBe(1);
			expect(node_113.index).toBe(2);

			node_113.move("before", node_112);
			expect(node_11.children).toEqual([node_113, node_112, node_111]);
			expect(node_113.index).toBe(0);
			expect(node_112.index).toBe(1);
			expect(node_111.index).toBe(2);

			node_112.move("before", node_112);
			expect(node_11.children).toEqual([node_113, node_112, node_111]);
			expect(node_113.index).toBe(0);
			expect(node_112.index).toBe(1);
			expect(node_111.index).toBe(2);
		});
	});

	test("TreeNode.move() after a sibling node", () => {
		effectRootScope(() => {
			const tree = new Tree({ items: () => items });
			const node_11 = tree.roots[0]!.children[0]!;
			const node_111 = node_11.children[0]!;
			const node_112 = node_11.children[1]!;
			const node_113 = node_11.children[2]!;

			node_111.move("after", node_113);
			expect(node_11.children).toEqual([node_112, node_113, node_111]);
			expect(node_112.index).toBe(0);
			expect(node_113.index).toBe(1);
			expect(node_111.index).toBe(2);

			node_113.move("after", node_112);
			expect(node_11.children).toEqual([node_112, node_113, node_111]);
			expect(node_112.index).toBe(0);
			expect(node_113.index).toBe(1);
			expect(node_111.index).toBe(2);

			node_112.move("after", node_112);
			expect(node_11.children).toEqual([node_112, node_113, node_111]);
			expect(node_112.index).toBe(0);
			expect(node_113.index).toBe(1);
			expect(node_111.index).toBe(2);
		});
	});

	test("TreeNode.move() before a non-sibling node", () => {
		effectRootScope(() => {
			const tree = new Tree({ items: () => items });
			const node_1 = tree.roots[0]!;
			const node_11 = node_1.children[0]!;
			const node_12 = node_1.children[1]!;
			const node_111 = node_11.children[0]!;
			const node_112 = node_11.children[1]!;
			const node_113 = node_11.children[2]!;

			node_111.move("before", node_12);
			expect(node_1.children).toEqual([node_11, node_111, node_12]);
			expect(node_11.index).toBe(0);
			expect(node_111.index).toBe(1);
			expect(node_12.index).toBe(2);
			expect(node_11.children).toEqual([node_112, node_113]);
			expect(node_112.index).toBe(0);
			expect(node_113.index).toBe(1);

			node_112.move("before", node_11);
			expect(node_1.children).toEqual([node_112, node_11, node_111, node_12]);
			expect(node_112.index).toBe(0);
			expect(node_11.index).toBe(1);
			expect(node_111.index).toBe(2);
			expect(node_12.index).toBe(3);
			expect(node_11.children).toEqual([node_113]);
			expect(node_113.index).toBe(0);
		});
	});

	test("TreeNode.move() after a non-sibling node", () => {
		effectRootScope(() => {
			const tree = new Tree({ items: () => items });
			const node_1 = tree.roots[0]!;
			const node_11 = node_1.children[0]!;
			const node_12 = node_1.children[1]!;
			const node_111 = node_11.children[0]!;
			const node_112 = node_11.children[1]!;
			const node_113 = node_11.children[2]!;

			node_111.move("after", node_12);
			expect(node_1.children).toEqual([node_11, node_12, node_111]);
			expect(node_11.index).toBe(0);
			expect(node_12.index).toBe(1);
			expect(node_111.index).toBe(2);
			expect(node_11.children).toEqual([node_112, node_113]);
			expect(node_112.index).toBe(0);
			expect(node_113.index).toBe(1);

			node_112.move("after", node_11);
			expect(node_1.children).toEqual([node_11, node_112, node_12, node_111]);
			expect(node_11.index).toBe(0);
			expect(node_112.index).toBe(1);
			expect(node_12.index).toBe(2);
			expect(node_111.index).toBe(3);
			expect(node_11.children).toEqual([node_113]);
			expect(node_113.index).toBe(0);
		});
	});

	test("TreeNode.move() inside a node adds this node to the end of the node's children", () => {
		effectRootScope(() => {
			const tree = new Tree({ items: () => items });
			const node_1 = tree.roots[0]!;
			const node_2 = tree.roots[1]!;
			const node_3 = tree.roots[2]!;
			const node_11 = node_1.children[0]!;
			const node_12 = node_1.children[1]!;

			node_2.move("inside", node_1);
			expect(tree.roots).toEqual([node_1, node_3]);
			expect(node_1.index).toBe(0);
			expect(node_3.index).toBe(1);
			expect(node_1.children).toEqual([node_11, node_12, node_2]);
			expect(node_11.index).toBe(0);
			expect(node_12.index).toBe(1);
			expect(node_2.index).toBe(2);
		});
	});
});

describe("TreeView", () => {
	function getTreeItem(id: string): HTMLElement {
		return screen.getByTestId(`tree-item:${id}`);
	}

	test("TreeView has aria-mutliselectable set to true", () => {
		render(TreeView, {
			props: { items },
		});
		const tree = screen.getByRole("tree");
		expect(tree).toHaveAttribute("aria-multiselectable", "true");
	});

	test("TreeView renders the visible items in the correct order", () => {
		const expanded = new SvelteSet();
		render(TreeView, {
			props: { items, expanded },
		});
		let treeItems = screen.getAllByRole("treeitem");
		expect(treeItems).toHaveLength(3);
		expect(treeItems[0]).toHaveTextContent("Section 1");
		expect(treeItems[1]).toHaveTextContent("Section 2");
		expect(treeItems[2]).toHaveTextContent("Section 3");

		expanded.add("1");
		flushSync();
		treeItems = screen.getAllByRole("treeitem");
		expect(treeItems).toHaveLength(5);
		expect(treeItems[0]).toHaveTextContent("Section 1");
		expect(treeItems[1]).toHaveTextContent("Section 1.1");
		expect(treeItems[2]).toHaveTextContent("Section 1.2");
		expect(treeItems[3]).toHaveTextContent("Section 2");
		expect(treeItems[4]).toHaveTextContent("Section 3");
	});

	test("TreeItem has aria-selected set to true when the item is selected and false otherwise", () => {
		render(TreeView, {
			props: {
				items,
				defaultSelected: ["1"],
			},
		});
		expect(getTreeItem("1")).toHaveAttribute("aria-selected", "true");
		expect(getTreeItem("2")).toHaveAttribute("aria-selected", "false");
		expect(getTreeItem("3")).toHaveAttribute("aria-selected", "false");
	});

	test("TreeItem updates aria-selected when the item is selected", () => {
		const selected = new SvelteSet();
		render(TreeView, {
			props: { items, selected },
		});
		const first = getTreeItem("1");
		expect(first).toHaveAttribute("aria-selected", "false");

		selected.add("1");
		flushSync();
		expect(first).toHaveAttribute("aria-selected", "true");

		selected.delete("1");
		flushSync();
		expect(first).toHaveAttribute("aria-selected", "false");
	});

	test("TreeItem has aria-expanded set to true when the item is expanded and false otherwise for all non-leaf items", () => {
		render(TreeView, {
			props: {
				items,
				defaultExpanded: ["1", "1.1", "2"],
			},
		});
		expect(getTreeItem("1")).toHaveAttribute("aria-expanded", "true");
		expect(getTreeItem("2")).toHaveAttribute("aria-expanded", "true");
		expect(getTreeItem("3")).toHaveAttribute("aria-expanded", "false");
		expect(getTreeItem("1.1")).toHaveAttribute("aria-expanded", "true");
		expect(getTreeItem("1.2")).toHaveAttribute("aria-expanded", "false");
		expect(getTreeItem("2.1")).not.toHaveAttribute("aria-expanded");
		expect(getTreeItem("2.2")).not.toHaveAttribute("aria-expanded");
		expect(getTreeItem("1.1.1")).not.toHaveAttribute("aria-expanded");
		expect(getTreeItem("1.1.2")).not.toHaveAttribute("aria-expanded");
		expect(getTreeItem("1.1.3")).not.toHaveAttribute("aria-expanded");
	});

	test("TreeItem updates aria-expanded when the item is expanded", () => {
		const expanded = new SvelteSet();
		render(TreeView, {
			props: { items, expanded },
		});
		const first = getTreeItem("1");
		expect(first).toHaveAttribute("aria-expanded", "false");

		expanded.add("1");
		flushSync();
		expect(first).toHaveAttribute("aria-expanded", "true");

		expanded.delete("1");
		flushSync();
		expect(first).toHaveAttribute("aria-expanded", "false");
	});

	test("TreeItem has aria-level set correctly", () => {
		render(TreeView, {
			props: {
				items,
				defaultExpanded: ["1", "1.1", "2"],
			},
		});
		expect(getTreeItem("1")).toHaveAttribute("aria-level", "1");
		expect(getTreeItem("2")).toHaveAttribute("aria-level", "1");
		expect(getTreeItem("3")).toHaveAttribute("aria-level", "1");
		expect(getTreeItem("1.1")).toHaveAttribute("aria-level", "2");
		expect(getTreeItem("1.2")).toHaveAttribute("aria-level", "2");
		expect(getTreeItem("2.1")).toHaveAttribute("aria-level", "2");
		expect(getTreeItem("2.2")).toHaveAttribute("aria-level", "2");
		expect(getTreeItem("1.1.1")).toHaveAttribute("aria-level", "3");
		expect(getTreeItem("1.1.2")).toHaveAttribute("aria-level", "3");
		expect(getTreeItem("1.1.3")).toHaveAttribute("aria-level", "3");
	});

	test("TreeItem has aria-posinset set correctly", () => {
		render(TreeView, {
			props: {
				items,
				defaultExpanded: ["1", "1.1"],
			},
		});
		expect(getTreeItem("1")).toHaveAttribute("aria-posinset", "1");
		expect(getTreeItem("2")).toHaveAttribute("aria-posinset", "2");
		expect(getTreeItem("3")).toHaveAttribute("aria-posinset", "3");
		expect(getTreeItem("1.1")).toHaveAttribute("aria-posinset", "1");
		expect(getTreeItem("1.2")).toHaveAttribute("aria-posinset", "2");
		expect(getTreeItem("1.1.1")).toHaveAttribute("aria-posinset", "1");
		expect(getTreeItem("1.1.2")).toHaveAttribute("aria-posinset", "2");
		expect(getTreeItem("1.1.3")).toHaveAttribute("aria-posinset", "3");
	});

	test("TreeItem has aria-setsize set correctly", () => {
		render(TreeView, {
			props: {
				items,
				defaultExpanded: ["1", "1.1"],
			},
		});
		expect(getTreeItem("1")).toHaveAttribute("aria-setsize", "3");
		expect(getTreeItem("2")).toHaveAttribute("aria-setsize", "3");
		expect(getTreeItem("3")).toHaveAttribute("aria-setsize", "3");
		expect(getTreeItem("1.1")).toHaveAttribute("aria-setsize", "2");
		expect(getTreeItem("1.2")).toHaveAttribute("aria-setsize", "2");
		expect(getTreeItem("1.1.1")).toHaveAttribute("aria-setsize", "3");
		expect(getTreeItem("1.1.2")).toHaveAttribute("aria-setsize", "3");
		expect(getTreeItem("1.1.3")).toHaveAttribute("aria-setsize", "3");
	});

	test("TreeItem initially has tabindex set to 0 for the first item and -1 otherwise", () => {
		render(TreeView, {
			props: { items },
		});
		expect(getTreeItem("1")).toHaveAttribute("tabindex", "0");
		expect(getTreeItem("2")).toHaveAttribute("tabindex", "-1");
		expect(getTreeItem("3")).toHaveAttribute("tabindex", "-1");
	});

	test("TreeItem has tabindex set to 0 for the focused item and -1 otherwise", () => {
		render(TreeView, {
			props: { items },
		});

		getTreeItem("2").focus();
		flushSync();
		expect(getTreeItem("1")).toHaveAttribute("tabindex", "-1");
		expect(getTreeItem("2")).toHaveAttribute("tabindex", "0");
		expect(getTreeItem("3")).toHaveAttribute("tabindex", "-1");
	});

	test("TreeItem expands collapsed items when the ArrowRight key is pressed", async () => {
		const expanded = new SvelteSet();
		render(TreeView, {
			props: { items, expanded },
		});

		const item_1 = getTreeItem("1");
		item_1.focus();
		await userEvent.keyboard("{ArrowRight}");
		expect(item_1).toHaveFocus();
		expect(expanded).toEqual(new SvelteSet(["1"]));
	});

	test("TreeItem navigates to the first child when the ArrowRight key is pressed on an expanded item", async () => {
		const expanded = new SvelteSet(["1"]);
		render(TreeView, {
			props: { items, expanded },
		});

		getTreeItem("1").focus();
		await userEvent.keyboard("{ArrowRight}");
		expect(getTreeItem("1.1")).toHaveFocus();
		expect(expanded).toEqual(new SvelteSet(["1"]));
	});

	test("TreeItem does nothing when the ArrowRight key is pressed on a leaf item", async () => {
		const expanded = new SvelteSet(["1", "1.1"]);
		render(TreeView, {
			props: { items, expanded },
		});

		const item_111 = getTreeItem("1.1.1");
		item_111.focus();
		await userEvent.keyboard("{ArrowRight}");
		expect(item_111).toHaveFocus();
		expect(expanded).toEqual(new SvelteSet(["1", "1.1"]));
	});

	test("TreeItem collapses expanded items when the ArrowLeft key is pressed", async () => {
		const expanded = new SvelteSet(["1"]);
		render(TreeView, {
			props: { items, expanded },
		});

		const item_1 = getTreeItem("1");
		item_1.focus();
		await userEvent.keyboard("{ArrowLeft}");
		expect(item_1).toHaveFocus();
		expect(expanded).toEqual(new SvelteSet());
	});

	test("TreeItem navigates to the parent when the ArrowLeft key is pressed on a collapsed item", async () => {
		const expanded = new SvelteSet(["1"]);
		render(TreeView, {
			props: { items, expanded },
		});

		getTreeItem("1.2").focus();
		await userEvent.keyboard("{ArrowLeft}");
		expect(getTreeItem("1")).toHaveFocus();
		expect(expanded).toEqual(new SvelteSet(["1"]));
	});

	test("TreeItem does nothing when the ArrowLeft key is pressed on a collapsed root item", async () => {
		const expanded = new SvelteSet(["1"]);
		render(TreeView, {
			props: { items, expanded },
		});

		const item_2 = getTreeItem("2");
		item_2.focus();
		await userEvent.keyboard("{ArrowLeft}");
		expect(item_2).toHaveFocus();
		expect(expanded).toEqual(new SvelteSet(["1"]));
	});

	test("TreeItem navigates to the next item when the ArrowDown key is pressed", async () => {
		const selected = new SvelteSet();
		render(TreeView, {
			props: {
				items,
				selected,
				defaultExpanded: ["1", "1.1"],
			},
		});

		getTreeItem("1").focus();
		await userEvent.keyboard("{ArrowDown}");
		expect(getTreeItem("1.1")).toHaveFocus();
		expect(selected).toHaveLength(0);

		await userEvent.keyboard("{ArrowDown}");
		expect(getTreeItem("1.1.1")).toHaveFocus();
		expect(selected).toHaveLength(0);

		await userEvent.keyboard("{ArrowDown}");
		expect(getTreeItem("1.1.2")).toHaveFocus();
		expect(selected).toHaveLength(0);

		await userEvent.keyboard("{ArrowDown}");
		expect(getTreeItem("1.1.3")).toHaveFocus();
		expect(selected).toHaveLength(0);

		await userEvent.keyboard("{ArrowDown}");
		expect(getTreeItem("1.2")).toHaveFocus();
		expect(selected).toHaveLength(0);

		await userEvent.keyboard("{ArrowDown}");
		expect(getTreeItem("2")).toHaveFocus();
		expect(selected).toHaveLength(0);

		await userEvent.keyboard("{ArrowDown}");
		expect(getTreeItem("3")).toHaveFocus();
		expect(selected).toHaveLength(0);
	});

	test("TreeItem selects and navigates to the next item when the ArrowDown key is pressed while holding shift", async () => {
		const selected = new SvelteSet();
		render(TreeView, {
			props: {
				items,
				selected,
				defaultExpanded: ["1"],
			},
		});

		getTreeItem("1").focus();
		await userEvent.keyboard("{Shift>}{ArrowDown}");
		expect(getTreeItem("1.1")).toHaveFocus();
		expect(selected).toEqual(new SvelteSet(["1", "1.1"]));

		await userEvent.keyboard("{Shift>}{ArrowDown}");
		expect(getTreeItem("1.2")).toHaveFocus();
		expect(selected).toEqual(new SvelteSet(["1", "1.1", "1.2"]));
	});

	test("TreeItem does nothing when the ArrowDown key is pressed on the last item", async () => {
		const selected = new SvelteSet();
		render(TreeView, {
			props: { items, selected },
		});

		const item_3 = getTreeItem("3");
		item_3.focus();
		await userEvent.keyboard("{ArrowDown}");
		expect(item_3).toHaveFocus();
		expect(selected).toHaveLength(0);

		await userEvent.keyboard("{Shift>}{ArrowDown}");
		expect(item_3).toHaveFocus();
		expect(selected).toHaveLength(0);
	});

	test("TreeItem navigates to the previous item when the ArrowUp key is pressed", async () => {
		const selected = new SvelteSet();
		render(TreeView, {
			props: {
				items,
				selected,
				defaultExpanded: ["1", "1.1"],
			},
		});

		getTreeItem("3").focus();
		await userEvent.keyboard("{ArrowUp}");
		expect(getTreeItem("2")).toHaveFocus();
		expect(selected).toHaveLength(0);

		await userEvent.keyboard("{ArrowUp}");
		expect(getTreeItem("1.2")).toHaveFocus();
		expect(selected).toHaveLength(0);

		await userEvent.keyboard("{ArrowUp}");
		expect(getTreeItem("1.1.3")).toHaveFocus();
		expect(selected).toHaveLength(0);

		await userEvent.keyboard("{ArrowUp}");
		expect(getTreeItem("1.1.2")).toHaveFocus();
		expect(selected).toHaveLength(0);

		await userEvent.keyboard("{ArrowUp}");
		expect(getTreeItem("1.1.1")).toHaveFocus();
		expect(selected).toHaveLength(0);

		await userEvent.keyboard("{ArrowUp}");
		expect(getTreeItem("1.1")).toHaveFocus();
		expect(selected).toHaveLength(0);

		await userEvent.keyboard("{ArrowUp}");
		expect(getTreeItem("1")).toHaveFocus();
		expect(selected).toHaveLength(0);
	});

	test("TreeItem selects and navigates to the previous item when the ArrowUp key is pressed while holding shift", async () => {
		const selected = new SvelteSet();
		render(TreeView, {
			props: {
				items,
				selected,
				defaultExpanded: ["1"],
			},
		});

		getTreeItem("2").focus();
		await userEvent.keyboard("{Shift>}{ArrowUp}");
		expect(getTreeItem("1.2")).toHaveFocus();
		expect(selected).toEqual(new SvelteSet(["1.2", "2"]));

		await userEvent.keyboard("{Shift>}{ArrowUp}");
		expect(getTreeItem("1.1")).toHaveFocus();
		expect(selected).toEqual(new SvelteSet(["1.1", "1.2", "2"]));
	});

	test("TreeItem does nothing when the ArrowUp key is pressed on the first item", async () => {
		const selected = new SvelteSet();
		render(TreeView, {
			props: { items, selected },
		});

		const item_1 = getTreeItem("1");
		item_1.focus();
		await userEvent.keyboard("{ArrowUp}");
		expect(item_1).toHaveFocus();
		expect(selected).toHaveLength(0);

		await userEvent.keyboard("{Shift>}{ArrowUp}");
		expect(item_1).toHaveFocus();
		expect(selected).toHaveLength(0);
	});

	// TODO: figure out how to test PageUp and PageDown keys

	test("TreeItem navigates to the first item when the Home key is pressed", async () => {
		const selected = new SvelteSet();
		render(TreeView, {
			props: {
				items,
				selected,
				defaultExpanded: ["1"],
			},
		});

		getTreeItem("3").focus();
		await userEvent.keyboard("{Home}");
		expect(getTreeItem("1")).toHaveFocus();
		expect(selected).toHaveLength(0);
	});

	test("TreeItem selects and navigates to the first item when the Home key is pressed while holding shift and control together", async () => {
		const selected = new SvelteSet();
		render(TreeView, {
			props: {
				items,
				selected,
				defaultExpanded: ["1"],
			},
		});

		getTreeItem("3").focus();
		await userEvent.keyboard("{Shift>}{Control>}{Home}");
		expect(getTreeItem("1")).toHaveFocus();
		expect(selected).toEqual(new SvelteSet(["1", "1.1", "1.2", "2", "3"]));
	});

	test("TreeItem does nothing when the Home key is pressed on the first item", async () => {
		const selected = new SvelteSet();
		render(TreeView, {
			props: { items, selected },
		});

		getTreeItem("1").focus();
		await userEvent.keyboard("{Home}");
		expect(getTreeItem("1")).toHaveFocus();
		expect(selected).toHaveLength(0);

		await userEvent.keyboard("{Shift>}{Control>}{Home}");
		expect(getTreeItem("1")).toHaveFocus();
		expect(selected).toHaveLength(0);
	});

	test("TreeItem navigates to the last item when the End key is pressed", async () => {
		const selected = new SvelteSet();
		render(TreeView, {
			props: { items, selected },
		});

		getTreeItem("1").focus();
		await userEvent.keyboard("{End}");
		expect(getTreeItem("3")).toHaveFocus();
		expect(selected).toHaveLength(0);
	});

	test("TreeItem selects and navigates to the last item when the End key is pressed while holding shift and control together", async () => {
		const selected = new SvelteSet();
		render(TreeView, {
			props: {
				items,
				selected,
				defaultExpanded: ["1"],
			},
		});

		getTreeItem("1").focus();
		await userEvent.keyboard("{Shift>}{Control>}{End}");
		expect(getTreeItem("3")).toHaveFocus();
		expect(selected).toEqual(new SvelteSet(["1", "1.1", "1.2", "2", "3"]));
	});

	test("TreeItem does nothing when the End key is pressed on the last item", async () => {
		const selected = new SvelteSet();
		render(TreeView, {
			props: { items, selected },
		});

		getTreeItem("3").focus();
		await userEvent.keyboard("{End}");
		expect(getTreeItem("3")).toHaveFocus();
		expect(selected).toHaveLength(0);

		await userEvent.keyboard("{Shift>}{Control>}{End}");
		expect(getTreeItem("3")).toHaveFocus();
		expect(selected).toHaveLength(0);
	});

	test("TreeItem selection is toggled when the Space key is pressed", async () => {
		const selected = new SvelteSet();
		render(TreeView, {
			props: { items, selected },
		});

		const item_1 = getTreeItem("1");
		item_1.focus();
		await userEvent.keyboard(" ");
		expect(selected).toEqual(new SvelteSet(["1"]));

		await userEvent.keyboard(" ");
		expect(selected).toEqual(new SvelteSet());
	});

	test("TreeItem enters editing mode when the F2 key is pressed", async () => {
		render(TreeView, {
			props: {
				items,
				getTreeItemProps() {
					return { editable: true };
				},
			},
		});

		const item_1 = getTreeItem("1");
		item_1.focus();
		await userEvent.keyboard("{F2}");
		const input = screen.getByRole("textbox");
		expect(item_1).toContainElement(input);
		expect(input).toHaveFocus();
	});

	test("TreeItem does nothing when the F2 key is pressed on a non-editable item", async () => {
		render(TreeView, {
			props: { items },
		});

		const item_1 = getTreeItem("1");
		item_1.focus();
		await userEvent.keyboard("{F2}");
		const input = screen.queryByRole("textbox");
		expect(item_1).toHaveFocus();
		expect(input).toBeNull();
	});

	test("TreeItem selects all visible nodes when the a key is pressed while holding control", async () => {
		const selected = new SvelteSet();
		render(TreeView, {
			props: {
				items,
				selected,
				defaultExpanded: ["1"],
			},
		});

		getTreeItem("1").focus();
		await userEvent.keyboard("{Control>}a");
		expect(selected).toEqual(new SvelteSet(["1", "1.1", "1.2", "2", "3"]));
	});
});
