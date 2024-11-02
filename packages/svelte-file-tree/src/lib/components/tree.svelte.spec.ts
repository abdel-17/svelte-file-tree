import { effectRootScope } from "$lib/helpers/effect-root-scope.svelte.js";
import { SvelteSet } from "svelte/reactivity";
import { describe, expect, test, vi } from "vitest";
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
] as const;

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

describe("Tree", () => {
	test("Tree.roots", () => {
		const tree = new Tree({ items: () => items });
		const ids = tree.roots.map((node) => node.id);
		expect(ids).toEqual(["1", "2", "3"]);
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
			expect(node).toBe(lookup);
		}
	});

	test("Tree.last() where none of the nodes are expanded", () => {
		const tree = new Tree({ items: () => items });
		const last = tree.last();
		expect(last?.id).toBe("3");
	});

	test("Tree.last() where the last root is expanded", () => {
		const tree = new Tree({
			items: () => items,
			defaultExpanded: ["3"],
		});
		const last = tree.last();
		expect(last?.id).toBe("3.2");
	});

	test("Tree.last() returns undefined when the tree is empty", () => {
		const tree = new Tree({ items: () => [] });
		const last = tree.last();
		expect(last).toBeUndefined();
	});

	test("Tree.selected defaults to being empty", () => {
		const tree = new Tree({ items: () => [] });
		expect(tree.selected).empty;
	});

	test("Tree.expanded defaults to being empty", () => {
		const tree = new Tree({ items: () => [] });
		expect(tree.expanded).empty;
	});

	test("Tree.selected controlled", () => {
		const selected = new SvelteSet<string>();
		const tree = new Tree({
			items: () => [],
			selected,
		});
		expect(tree.selected).toBe(selected);
	});

	test("Tree.expanded controlled", () => {
		const expanded = new SvelteSet<string>();
		const tree = new Tree({
			items: () => [],
			expanded,
		});
		expect(tree.expanded).toBe(expanded);
	});

	test("Tree.selected uncontrolled", () => {
		const defaultSelected = ["1.1.1"];
		const tree = new Tree({
			items: () => [],
			defaultSelected,
		});
		expect(tree.selected).toEqual(new SvelteSet(defaultSelected));
	});

	test("Tree.expanded uncontrolled", () => {
		const defaultExpanded = ["1.1.1"];
		const tree = new Tree({
			items: () => [],
			defaultExpanded,
		});
		expect(tree.expanded).toEqual(new SvelteSet(defaultExpanded));
	});

	test("TreeNode.selected setter updates the selection state", () => {
		effectRootScope(() => {
			const tree = new Tree({ items: () => items });
			const first = tree.roots[0];

			first.selected = true;
			expect(first.selected).true;
			expect(tree.selected).toEqual(new SvelteSet(["1"]));

			first.selected = false;
			expect(first.selected).false;
			expect(tree.selected).empty;
		});
	});

	test("TreeNode.select() and TreeNode.unselect() correctly update the selection state", () => {
		effectRootScope(() => {
			const tree = new Tree({ items: () => items });
			const first = tree.roots[0];

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
			const first = tree.roots[0];

			first.expanded = true;
			expect(first.expanded).true;
			expect(tree.expanded).toEqual(new SvelteSet(["1"]));

			first.expanded = false;
			expect(first.expanded).false;
			expect(tree.expanded).empty;
		});
	});

	test("TreeNode.expand() and TreeNode.collapse() correctly update the expansion state", () => {
		effectRootScope(() => {
			const tree = new Tree({ items: () => items });
			const first = tree.roots[0];

			first.expand();
			expect(first.expanded).true;
			expect(tree.expanded).toEqual(new SvelteSet(["1"]));

			first.collapse();
			expect(first.expanded).false;
			expect(tree.expanded).empty;
		});
	});

	test("Tree.tabbable is initialized to the first node", () => {
		const tree = new Tree({ items: () => items });
		expect(tree.tabbable).toBe("1");
		expect(tree.previousTabbable).toBeUndefined();
	});

	test("Tree.tabbable and Tree.previousTabbable correctly update when a tree item is focused", () => {
		effectRootScope(() => {
			const tree = new Tree({ items: () => items });
			const second = tree.roots[1];

			tree.onFocusTreeItem(second);
			expect(tree.tabbable).toBe("2");
			expect(tree.previousTabbable).toBe("1");
		});
	});

	test("Tree.dragged correctly updates when a tree item is dragged", () => {
		effectRootScope(() => {
			const tree = new Tree({ items: () => items });
			const first = tree.roots[0];

			tree.onDragStartTreeItem(first);
			expect(tree.dragged).toBe("1");
			expect(first.dragged).true;

			tree.onDragEndTreeItem(first);
			expect(tree.dragged).toBeUndefined();
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
			const first = tree.roots[0];

			tree.onDragStartTreeItem(first);
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

	test("TreeNode.id setter updates references to the previous value", () => {
		effectRootScope(() => {
			const tree = new Tree({
				items: () => items,
				defaultSelected: ["1"],
				defaultExpanded: ["1"],
			});
			const [first, second] = tree.roots;

			first.id = "first";
			expect(tree.selected).toEqual(new SvelteSet(["first"]));
			expect(tree.expanded).toEqual(new SvelteSet(["first"]));
			expect(tree.tabbable).toBe("first");
			expect(tree.previousTabbable).toBeUndefined();
			expect(tree.dragged).toBeUndefined();

			tree.onFocusTreeItem(second);
			tree.onDragStartTreeItem(second);
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

	test("TreeNode.previous()", () => {
		const tree = new Tree({
			items: () => items,
			defaultExpanded: ["1", "1.1", "2"],
		});
		const previous = map(tree, (node) => node.previous()?.id);
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

	test("TreeNode.next()", () => {
		const tree = new Tree({
			items: () => items,
			defaultExpanded: ["1", "1.1", "2"],
		});
		const next = map(tree, (node) => node.next()?.id);
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
			const node_11 = tree.roots[0].children[0];
			const [node_111, node_112, node_113] = node_11.children;
			const nodes_11x = $derived(node_11.children.map((node) => node.id));
			const indices_11x = $derived(node_11.children.map((node) => node.index));

			node_111.move("before", node_113);
			expect(nodes_11x).toEqual(["1.1.2", "1.1.1", "1.1.3"]);
			expect(indices_11x).toEqual([0, 1, 2]);

			node_113.move("before", node_112);
			expect(nodes_11x).toEqual(["1.1.3", "1.1.2", "1.1.1"]);
			expect(indices_11x).toEqual([0, 1, 2]);

			node_112.move("before", node_112);
			expect(nodes_11x).toEqual(["1.1.3", "1.1.2", "1.1.1"]);
			expect(indices_11x).toEqual([0, 1, 2]);
		});
	});

	test("TreeNode.move() after a sibling node", () => {
		effectRootScope(() => {
			const tree = new Tree({ items: () => items });
			const node_11 = tree.roots[0].children[0];
			const [node_111, node_112, node_113] = node_11.children;
			const nodes_11x = $derived(node_11.children.map((node) => node.id));
			const indices_11x = $derived(node_11.children.map((node) => node.index));

			node_111.move("after", node_113);
			expect(nodes_11x).toEqual(["1.1.2", "1.1.3", "1.1.1"]);
			expect(indices_11x).toEqual([0, 1, 2]);

			node_113.move("after", node_112);
			expect(nodes_11x).toEqual(["1.1.2", "1.1.3", "1.1.1"]);
			expect(indices_11x).toEqual([0, 1, 2]);

			node_112.move("after", node_112);
			expect(nodes_11x).toEqual(["1.1.2", "1.1.3", "1.1.1"]);
			expect(indices_11x).toEqual([0, 1, 2]);
		});
	});

	test("TreeNode.move() before a non-sibling node", () => {
		effectRootScope(() => {
			const tree = new Tree({ items: () => items });
			const node_1 = tree.roots[0];
			const [node_11, node_12] = node_1.children;
			const nodes_1x = $derived(node_1.children.map((node) => node.id));
			const indices_1x = $derived(node_1.children.map((node) => node.index));
			const [node_111, node_112] = node_11.children;
			const nodes_11x = $derived(node_11.children.map((node) => node.id));
			const indices_11x = $derived(node_11.children.map((node) => node.index));

			node_111.move("before", node_12);
			expect(nodes_1x).toEqual(["1.1", "1.1.1", "1.2"]);
			expect(indices_1x).toEqual([0, 1, 2]);
			expect(nodes_11x).toEqual(["1.1.2", "1.1.3"]);
			expect(indices_11x).toEqual([0, 1]);

			node_112.move("before", node_11);
			expect(nodes_1x).toEqual(["1.1.2", "1.1", "1.1.1", "1.2"]);
			expect(indices_1x).toEqual([0, 1, 2, 3]);
			expect(nodes_11x).toEqual(["1.1.3"]);
			expect(indices_11x).toEqual([0]);
		});
	});

	test("TreeNode.move() after a non-sibling node", () => {
		effectRootScope(() => {
			const tree = new Tree({ items: () => items });
			const node_1 = tree.roots[0];
			const [node_11, node_12] = node_1.children;
			const nodes_1x = $derived(node_1.children.map((node) => node.id));
			const indices_1x = $derived(node_1.children.map((node) => node.index));
			const [node_111, node_112] = node_11.children;
			const nodes_11x = $derived(node_11.children.map((node) => node.id));
			const indices_11x = $derived(node_11.children.map((node) => node.index));

			node_111.move("after", node_12);
			expect(nodes_1x).toEqual(["1.1", "1.2", "1.1.1"]);
			expect(indices_1x).toEqual([0, 1, 2]);
			expect(nodes_11x).toEqual(["1.1.2", "1.1.3"]);
			expect(indices_11x).toEqual([0, 1]);

			node_112.move("after", node_11);
			expect(nodes_1x).toEqual(["1.1", "1.1.2", "1.2", "1.1.1"]);
			expect(indices_1x).toEqual([0, 1, 2, 3]);
			expect(nodes_11x).toEqual(["1.1.3"]);
			expect(indices_11x).toEqual([0]);
		});
	});

	test("TreeNode.move() is called when a tree item is dropped", () => {
		const tree = new Tree({ items: () => items });
		const [first, second] = tree.roots;
		first.move = vi.fn();

		tree.onDragStartTreeItem(first);
		tree.onDropTreeItem(second, "before");
		tree.onDragEndTreeItem(first);
		expect(first.move).toHaveBeenCalledWith("before", second);

		tree.onDragStartTreeItem(first);
		tree.onDropTreeItem(second, "after");
		tree.onDragEndTreeItem(first);
		expect(first.move).toHaveBeenCalledWith("after", second);
	});
});
