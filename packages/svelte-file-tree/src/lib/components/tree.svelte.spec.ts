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

	test("Tree.tabbable and Tree.previousTabbable", () => {
		effectRootScope(() => {
			const tree = new Tree({ items: () => items });
			expect(tree.tabbable).toBe("1");
			expect(tree.previousTabbable).toBeUndefined();

			tree.tabbable = "2";
			expect(tree.tabbable).toBe("2");
			expect(tree.previousTabbable).toBe("1");
		});
	});

	test("Tree.roots", () => {
		const tree = new Tree({ items: () => items });
		const roots = tree.roots.map((node) => node.id);
		expect(roots).toEqual(["1", "2", "3"]);
	});

	test("Tree.traverse()", () => {
		const tree = new Tree({ items: () => items });
		const nodes = tree
			.traverse()
			.map((node) => node.id)
			.toArray();
		expect(nodes).toEqual([
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

	test("Tree.values()", () => {
		const tree = new Tree({
			items: () => items,
			defaultExpanded: ["1", "1.1", "2"],
		});
		const nodes = tree
			.values()
			.map((node) => node.id)
			.toArray();
		expect(nodes).toEqual([
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

	test("Tree.reversed()", () => {
		const tree = new Tree({
			items: () => items,
			defaultExpanded: ["1", "1.1", "2"],
		});
		const nodes = tree
			.reversed()
			.map((node) => node.id)
			.toArray();
		expect(nodes).toEqual([
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
		const nodes = Array.from(tree).map((node) => node.id);
		expect(nodes).toEqual([
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

	test("Tree.last() throws when the tree is empty", () => {
		const tree = new Tree({ items: () => [] });
		expect(() => tree.last()).toThrowError();
	});

	test("TreeNode.id updates references to the previous id when updated", () => {
		effectRootScope(() => {
			const tree = new Tree({
				items: () => items,
				defaultSelected: ["1"],
				defaultExpanded: ["1"],
			});

			const first = tree.roots[0];
			first.id = "first";
			expect(tree.selected).toEqual(new SvelteSet(["first"]));
			expect(tree.expanded).toEqual(new SvelteSet(["first"]));
			expect(tree.tabbable).toBe("first");
			expect(tree.previousTabbable).toBeUndefined();

			const second = tree.roots[1];
			tree.tabbable = second.id;
			second.id = "second";
			expect(tree.tabbable).toBe("second");
			expect(tree.previousTabbable).toBe("first");

			first.id = "1";
			second.id = "2";
			expect(tree.selected).toEqual(new SvelteSet(["1"]));
			expect(tree.expanded).toEqual(new SvelteSet(["1"]));
			expect(tree.tabbable).toBe("2");
			expect(tree.previousTabbable).toBe("1");
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

	test("TreeNode.expanded", () => {
		effectRootScope(() => {
			const tree = new Tree({ items: () => items });
			const expanded = $derived(
				tree
					.traverse()
					.filter((node) => node.expanded)
					.map((node) => node.id)
					.toArray(),
			);
			expect(expanded).toHaveLength(0);

			const first = tree.roots[0];
			first.expand();
			expect(expanded).toEqual(["1"]);

			first.collapse();
			expect(expanded).toHaveLength(0);

			first.expanded = true;
			expect(expanded).toEqual(["1"]);

			first.expanded = false;
			expect(expanded).toHaveLength(0);
		});
	});

	test("TreeNode.selected", () => {
		effectRootScope(() => {
			const tree = new Tree({ items: () => items });
			const selected = $derived(
				tree
					.traverse()
					.filter((node) => node.selected)
					.map((node) => node.id)
					.toArray(),
			);
			expect(selected).toHaveLength(0);

			const first = tree.roots[0];
			first.select();
			expect(selected).toEqual(["1"]);

			first.unselect();
			expect(selected).toHaveLength(0);

			first.selected = true;
			expect(selected).toEqual(["1"]);

			first.selected = false;
			expect(selected).toHaveLength(0);
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

	test("TreeNode.move() before a node on the same level", () => {
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

	test("TreeNode.move() after a node on the same level", () => {
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

	test("TreeNode.move() before a node on a different level", () => {
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

	test("TreeNode.move() after a node on a different level", () => {
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
});
