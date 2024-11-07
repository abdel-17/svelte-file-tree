import { effectRootScope } from "$lib/helpers/effect-root-scope.svelte.js";
import { SvelteSet } from "svelte/reactivity";
import { describe, expect, test } from "vitest";
import { Tree, type TreeNode } from "./tree.svelte.js";

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

function traverse<Value>(
	roots: Iterable<TreeNode<Value>>,
	callback: (node: TreeNode<Value>) => void,
): void {
	for (const root of roots) {
		callback(root);
		traverse(root.children, callback);
	}
}

function createLookup<In, Out>(
	tree: Tree<In>,
	transform: (node: TreeNode<In>) => Out,
): Record<string, Out> {
	const lookup: Record<string, Out> = {};
	traverse(tree.roots, (node) => {
		lookup[node.id] = transform(node);
	});
	return lookup;
}

describe("Tree", () => {
	test("Tree.roots", () => {
		const tree = new Tree({ items });
		const ids = tree.roots.map((node) => node.id);
		expect(ids).toEqual(["1", "2", "3"]);
	});

	test("Tree.last where none of the nodes are expanded", () => {
		const tree = new Tree({ items });
		const { last } = tree;
		expect(last?.id).toBe("3");
	});

	test("Tree.last where the last root is expanded", () => {
		const tree = new Tree({
			items,
			defaultExpanded: ["3"],
		});
		const { last } = tree;
		expect(last?.id).toBe("3.2");
	});

	test("Tree.last is undefined when the tree is empty", () => {
		const tree = new Tree({ items: [] });
		const { last } = tree;
		expect(last).toBeUndefined();
	});

	test("Tree.selected defaults to being empty", () => {
		const tree = new Tree({ items: [] });
		expect(tree.selected).empty;
	});

	test("Tree.selected controlled", () => {
		const selected = new SvelteSet<string>();
		const tree = new Tree({
			items: [],
			selected,
		});
		expect(tree.selected).toBe(selected);
	});

	test("Tree.selected uncontrolled", () => {
		const defaultSelected = ["1.1.1"];
		const tree = new Tree({
			items: [],
			defaultSelected,
		});
		expect(tree.selected).toEqual(new SvelteSet(defaultSelected));
	});

	test("Tree.expanded defaults to being empty", () => {
		const tree = new Tree({ items: [] });
		expect(tree.expanded).empty;
	});

	test("Tree.expanded controlled", () => {
		const expanded = new SvelteSet<string>();
		const tree = new Tree({
			items: [],
			expanded,
		});
		expect(tree.expanded).toBe(expanded);
	});

	test("Tree.expanded uncontrolled", () => {
		const defaultExpanded = ["1.1.1"];
		const tree = new Tree({
			items: [],
			defaultExpanded,
		});
		expect(tree.expanded).toEqual(new SvelteSet(defaultExpanded));
	});

	test("Tree.tabbable is initialized to the first node", () => {
		const tree = new Tree({ items });
		const node_1 = tree.roots[0]!;
		expect(tree.tabbable).toBe(node_1);
		expect(tree.previousTabbable).toBeUndefined();
	});

	test("Tree.tabbable setter updates itself and Tree.previousTabbable", () => {
		effectRootScope(() => {
			const tree = new Tree({ items });
			const node_1 = tree.roots[0]!;
			const node_2 = tree.roots[1]!;

			tree.tabbable = node_2;
			expect(tree.tabbable).toBe(node_2);
			expect(tree.previousTabbable).toBe(node_1);
		});
	});

	test("Tree.dragged is initialized to undefined", () => {
		const tree = new Tree({ items });
		expect(tree.dragged).toBeUndefined();
	});

	test("Tree.dragged setter updates itself", () => {
		effectRootScope(() => {
			const tree = new Tree({ items });
			const node_1 = tree.roots[0]!;

			tree.dragged = node_1;
			expect(tree.dragged).toBe(node_1);

			tree.dragged = undefined;
			expect(tree.dragged).toBeUndefined();
		});
	});

	test("TreeNode.id setter updates itself and all references to the previous value", () => {
		effectRootScope(() => {
			const tree = new Tree({
				items,
				defaultSelected: ["1", "2"],
				defaultExpanded: ["1", "2"],
			});
			const node_1 = tree.roots[0]!;
			const node_2 = tree.roots[1]!;

			node_1.id = "first";
			node_2.id = "second";
			expect(node_1.id).toBe("first");
			expect(node_2.id).toBe("second");
			expect(tree.selected).toEqual(new SvelteSet(["first", "second"]));
			expect(tree.expanded).toEqual(new SvelteSet(["first", "second"]));
		});
	});

	test("TreeNode.value", () => {
		const tree = new Tree({ items });
		const values = createLookup(tree, (node) => node.value);
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

	test("TreeNode.value setter updates itself", () => {
		const tree = new Tree({ items });
		const node_1 = tree.roots[0]!;

		node_1.value = "First";
		expect(node_1.value).toBe("First");
	});

	test("TreeNode.index", () => {
		const tree = new Tree({ items });
		const indices = createLookup(tree, (node) => node.index);
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
		const tree = new Tree({ items });
		const parents = createLookup(tree, (node) => node.parent?.id);
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
		const tree = new Tree({ items });
		const children = createLookup(tree, (node) =>
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
			const tree = new Tree({ items });
			const node_1 = tree.roots[0]!;

			node_1.selected = true;
			expect(node_1.selected).true;
			expect(tree.selected).toEqual(new SvelteSet(["1"]));

			node_1.selected = false;
			expect(node_1.selected).false;
			expect(tree.selected).empty;
		});
	});

	test("TreeNode.select() and TreeNode.unselect() update the selection state", () => {
		effectRootScope(() => {
			const tree = new Tree({ items });
			const node_1 = tree.roots[0]!;

			node_1.select();
			expect(node_1.selected).true;
			expect(tree.selected).toEqual(new SvelteSet(["1"]));

			node_1.unselect();
			expect(node_1.selected).false;
			expect(tree.selected).empty;
		});
	});

	test("Tree.selectAll() selects all visible nodes", () => {
		effectRootScope(() => {
			const tree = new Tree({
				items,
				defaultExpanded: ["1", "1.1", "3"],
			});

			tree.selectAll();
			expect(tree.selected).toEqual(
				new SvelteSet([
					"1",
					"1.1",
					"1.1.1",
					"1.1.2",
					"1.1.3",
					"1.2",
					"2",
					"3",
					"3.1",
					"3.2",
				]),
			);
		});
	});

	test("Tree.selectUntil() selects all nodes between the first node and the given node", () => {
		effectRootScope(() => {
			const tree = new Tree({
				items,
				defaultExpanded: ["1", "1.1", "3"],
			});
			const node_3 = tree.roots[2]!;

			tree.selectUntil(node_3);
			expect(tree.selected).toEqual(
				new SvelteSet(["1", "1.1", "1.1.1", "1.1.2", "1.1.3", "1.2", "2", "3"]),
			);
		});
	});

	test("Tree.selectFrom() selects all nodes between the given node and the last node", () => {
		effectRootScope(() => {
			const tree = new Tree({
				items,
				defaultExpanded: ["1", "1.1", "3"],
			});
			const node_11 = tree.roots[0]!.children[0]!;

			tree.selectFrom(node_11);
			expect(tree.selected).toEqual(
				new SvelteSet([
					"1.1",
					"1.1.1",
					"1.1.2",
					"1.1.3",
					"1.2",
					"2",
					"3",
					"3.1",
					"3.2",
				]),
			);
		});
	});

	test("TreeNode.expanded setter updates the expansion state", () => {
		effectRootScope(() => {
			const tree = new Tree({ items });
			const node_1 = tree.roots[0]!;

			node_1.expanded = true;
			expect(node_1.expanded).true;
			expect(tree.expanded).toEqual(new SvelteSet(["1"]));

			node_1.expanded = false;
			expect(node_1.expanded).false;
			expect(tree.expanded).empty;
		});
	});

	test("TreeNode.expand() and TreeNode.collapse() update the expansion state", () => {
		effectRootScope(() => {
			const tree = new Tree({ items });
			const node_1 = tree.roots[0]!;

			node_1.expand();
			expect(node_1.expanded).true;
			expect(tree.expanded).toEqual(new SvelteSet(["1"]));

			node_1.collapse();
			expect(node_1.expanded).false;
			expect(tree.expanded).empty;
		});
	});

	test("TreeNode.level", () => {
		const tree = new Tree({ items });
		const levels = createLookup(tree, (node) => node.level);
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
		const tree = new Tree({ items });
		const siblings = createLookup(tree, (node) =>
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
		const tree = new Tree({ items });
		const previousSiblings = createLookup(
			tree,
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
		const tree = new Tree({ items });
		const nextSiblings = createLookup(tree, (node) => node.nextSibling?.id);
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
			items,
			defaultExpanded: ["1", "1.1", "2"],
		});
		const previous = createLookup(tree, (node) => node.previous?.id);
		expect(previous).toEqual({
			"1": undefined,
			"1.1": "1",
			"1.1.1": "1.1",
			"1.1.2": "1.1.1",
			"1.1.3": "1.1.2",
			"1.2": "1.1.3",
			"1.2.1": "1.2", // hidden
			"1.2.2": "1.2.1", // hidden
			"2": "1.2",
			"2.1": "2",
			"2.2": "2.1",
			"3": "2.2",
			"3.1": "3", // hidden
			"3.2": "3.1", // hidden
		});
	});

	test("TreeNode.next", () => {
		const tree = new Tree({
			items,
			defaultExpanded: ["1", "1.1", "2"],
		});
		const next = createLookup(tree, (node) => node.next?.id);
		expect(next).toEqual({
			"1": "1.1",
			"1.1": "1.1.1",
			"1.1.1": "1.1.2",
			"1.1.2": "1.1.3",
			"1.1.3": "1.2",
			"1.2": "2",
			"1.2.1": "1.2.2", // hidden
			"1.2.2": "2", // hidden
			"2": "2.1",
			"2.1": "2.2",
			"2.2": "3",
			"3": undefined,
			"3.1": "3.2", // hidden
			"3.2": undefined, // hidden
		});
	});

	test("TreeNode.contains() returns true if the given node is a descendant", () => {
		const tree = new Tree({ items });
		const node_1 = tree.roots[0]!;
		const node_11 = node_1.children[0]!;
		const node_12 = node_1.children[1]!;
		const node_111 = node_11.children[0]!;
		const node_112 = node_11.children[1]!;
		const node_113 = node_11.children[2]!;

		expect(node_1.contains(node_1)).true;
		expect(node_1.contains(node_11)).true;
		expect(node_1.contains(node_12)).true;
		expect(node_1.contains(node_111)).true;
		expect(node_1.contains(node_112)).true;
		expect(node_1.contains(node_113)).true;

		expect(node_11.contains(node_111)).true;
		expect(node_11.contains(node_112)).true;
		expect(node_11.contains(node_113)).true;
	});

	test("TreeNode.contains() returns false if the given node is in another subtree", () => {
		const tree = new Tree({ items });
		const node_1 = tree.roots[0]!;
		const node_2 = tree.roots[1]!;
		const node_11 = node_1.children[0]!;
		const node_12 = node_1.children[1]!;
		const node_21 = node_2.children[0]!;
		const node_22 = node_2.children[1]!;

		expect(node_1.contains(node_2)).false;
		expect(node_1.contains(node_21)).false;
		expect(node_1.contains(node_22)).false;

		expect(node_11.contains(node_2)).false;
		expect(node_11.contains(node_21)).false;
		expect(node_11.contains(node_22)).false;

		expect(node_12.contains(node_2)).false;
		expect(node_12.contains(node_21)).false;
		expect(node_12.contains(node_22)).false;
	});

	test("TreeNode.contains() returns false if the given node is a parent", () => {
		const tree = new Tree({ items });
		const node_1 = tree.roots[0]!;
		const node_11 = node_1.children[0]!;
		const node_12 = node_1.children[1]!;
		const node_111 = node_11.children[0]!;
		const node_112 = node_11.children[1]!;
		const node_113 = node_11.children[2]!;

		expect(node_11.contains(node_1)).false;
		expect(node_12.contains(node_1)).false;
		expect(node_111.contains(node_1)).false;
		expect(node_112.contains(node_1)).false;
		expect(node_113.contains(node_1)).false;

		expect(node_111.contains(node_11)).false;
		expect(node_112.contains(node_11)).false;
		expect(node_113.contains(node_11)).false;

		expect(node_111.contains(node_12)).false;
		expect(node_112.contains(node_12)).false;
		expect(node_113.contains(node_12)).false;
	});

	test("TreeNode.move() before a sibling node", () => {
		effectRootScope(() => {
			const tree = new Tree({ items });
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
			const tree = new Tree({ items });
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
			const tree = new Tree({ items });
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
			const tree = new Tree({ items });
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
			const tree = new Tree({ items });
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

	test("TreeNode.delete() deletes the node from the tree", () => {
		effectRootScope(() => {
			const tree = new Tree({ items });
			const node_11 = tree.roots[0]!.children[0]!;
			const node_111 = node_11.children[0]!;
			const node_112 = node_11.children[1]!;
			const node_113 = node_11.children[2]!;

			node_111.delete();
			expect(node_11.children).toEqual([node_112, node_113]);
			expect(node_112.index).toBe(0);
			expect(node_113.index).toBe(1);
			expect(node_111.parent).toBeUndefined();
			expect(node_111.index).toBe(-1);
		});
	});

	test("TreeNode.delete() removes all references to the node", () => {
		effectRootScope(() => {
			const tree = new Tree({ items });
			const node_1 = tree.roots[0]!;
			const node_2 = tree.roots[1]!;
			tree.selected.add(node_2.id);
			tree.expanded.add(node_2.id);
			tree.tabbable = node_2;
			tree.dragged = node_2;

			node_2.delete();
			expect(tree.selected).not.toContain(node_2.id);
			expect(tree.expanded).not.toContain(node_2.id);
			expect(tree.tabbable).toBe(node_1);
			expect(tree.previousTabbable).toBeUndefined();
			expect(tree.dragged).toBeUndefined();
		});
	});
});
