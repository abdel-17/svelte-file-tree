import { effectRootScope } from "$lib/helpers/effect-root-scope.svelte.js";
import { describe, expect, test } from "vitest";
import { Tree } from "./tree.svelte.js";

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

describe("Tree", () => {
	test("Tree.first", () => {
		const tree = new Tree({ items });
		expect(tree.first?.id).toBe("1");
	});

	test("Tree.last where none of the nodes are expanded", () => {
		const tree = new Tree({ items });
		expect(tree.last?.id).toBe("3");
	});

	test("Tree.last where the last root is expanded", () => {
		const tree = new Tree({
			items,
			defaultExpanded: ["3"],
		});
		expect(tree.last?.id).toBe("3.2");
	});

	test("Tree.all()", () => {
		const tree = new Tree({ items });
		expect(
			tree
				.all()
				.map((node) => node.id)
				.toArray(),
		).toEqual([
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

	test("Tree.iter()", () => {
		const tree = new Tree({
			items,
			defaultExpanded: ["1", "1.1", "2"],
		});
		expect(
			tree
				.iter()
				.map((node) => node.id)
				.toArray(),
		).toEqual([
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
			items,
			defaultExpanded: ["1", "1.1", "2"],
		});
		expect(
			tree
				.reversed()
				.map((node) => node.id)
				.toArray(),
		).toEqual([
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

	test("TreeNode.previous", () => {
		const tree = new Tree({
			items,
			defaultExpanded: ["1", "1.1", "2"],
		});
		expect(
			Object.fromEntries(
				tree.iter().map((node) => [node.id, node.previous?.id]),
			),
		).toEqual({
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
			items,
			defaultExpanded: ["1", "1.1", "2"],
		});
		expect(
			Object.fromEntries(tree.iter().map((node) => [node.id, node.next?.id])),
		).toEqual({
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

	test("TreeNode.levelIndex", () => {
		const tree = new Tree({ items });
		expect(
			Object.fromEntries(tree.all().map((node) => [node.id, node.levelIndex])),
		).toEqual({
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
		expect(
			Object.fromEntries(tree.all().map((node) => [node.id, node.parent?.id])),
		).toEqual({
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
		expect(
			Object.fromEntries(
				tree
					.all()
					.map((node) => [node.id, node.children.map((child) => child.id)]),
			),
		).toEqual({
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

	test("TreeNode.depth", () => {
		const tree = new Tree({ items });
		expect(
			Object.fromEntries(tree.all().map((node) => [node.id, node.depth])),
		).toEqual({
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

	test("TreeNode.level", () => {
		const tree = new Tree({ items });
		expect(
			Object.fromEntries(
				tree
					.all()
					.map((node) => [node.id, node.level.map((sibling) => sibling.id)]),
			),
		).toEqual({
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

	test("TreeNode.contains() itself", () => {
		const tree = new Tree({ items });
		const root = tree.roots[0];
		expect(root.contains(root)).toBe(true);
	});

	test("TreeNode.contains() a child", () => {
		const tree = new Tree({ items });
		const parent = tree.roots[0];
		const child = parent.children[0];
		expect(parent.contains(child)).toBe(true);
	});

	test("TreeNode.contains() a grandchild", () => {
		const tree = new Tree({ items });
		const parent = tree.roots[0];
		const child = parent.children[0];
		const grandchild = child.children[0];
		expect(parent.contains(grandchild)).toBe(true);
	});

	test("TreeNode.contains() not a sibling", () => {
		const tree = new Tree({ items });
		const root = tree.roots[0];
		const sibling = tree.roots[1];
		expect(root.contains(sibling)).toBe(false);
	});

	test("TreeNode.contains() not a parent", () => {
		const tree = new Tree({ items });
		const parent = tree.roots[0];
		const child = parent.children[0];
		expect(child.contains(parent)).toBe(false);
	});

	test("TreeNode.move() before a node on the same level", () => {
		effectRootScope(() => {
			const tree = new Tree({ items });
			const n1 = tree.roots[0];
			const n11 = n1.children[0];
			const [n111, n112, n113] = n11.children;

			const thirdLevel = $derived(n11.children.map((node) => node.id));
			const thirdLevelIndices = $derived(
				n11.children.map((node) => node.levelIndex),
			);

			n111.move("before", n113);
			expect(thirdLevel).toEqual(["1.1.2", "1.1.1", "1.1.3"]);
			expect(thirdLevelIndices).toEqual([0, 1, 2]);

			n113.move("before", n112);
			expect(thirdLevel).toEqual(["1.1.3", "1.1.2", "1.1.1"]);
			expect(thirdLevelIndices).toEqual([0, 1, 2]);

			n112.move("before", n112);
			expect(thirdLevel).toEqual(["1.1.3", "1.1.2", "1.1.1"]);
			expect(thirdLevelIndices).toEqual([0, 1, 2]);
		});
	});

	test("TreeNode.move() after a node on the same level", () => {
		effectRootScope(() => {
			const tree = new Tree({ items });
			const n1 = tree.roots[0];
			const n11 = n1.children[0];
			const [n111, n112, n113] = n11.children;

			const thirdLevel = $derived(n11.children.map((node) => node.id));
			const thirdLevelIndices = $derived(
				n11.children.map((node) => node.levelIndex),
			);

			n111.move("after", n113);
			expect(thirdLevel).toEqual(["1.1.2", "1.1.3", "1.1.1"]);
			expect(thirdLevelIndices).toEqual([0, 1, 2]);

			n113.move("after", n112);
			expect(thirdLevel).toEqual(["1.1.2", "1.1.3", "1.1.1"]);
			expect(thirdLevelIndices).toEqual([0, 1, 2]);

			n112.move("after", n112);
			expect(thirdLevel).toEqual(["1.1.2", "1.1.3", "1.1.1"]);
			expect(thirdLevelIndices).toEqual([0, 1, 2]);
		});
	});

	test("TreeNode.move() before a node on a different level", () => {
		effectRootScope(() => {
			const tree = new Tree({ items });
			const n1 = tree.roots[0];
			const [n11, n12] = n1.children;
			const [n111, n112] = n11.children;

			const secondLevel = $derived(n1.children.map((node) => node.id));
			const secondLevelIndices = $derived(
				n1.children.map((node) => node.levelIndex),
			);

			const thirdLevel = $derived(n11.children.map((node) => node.id));
			const thirdLevelIndices = $derived(
				n11.children.map((node) => node.levelIndex),
			);

			n111.move("before", n12);
			expect(secondLevel).toEqual(["1.1", "1.1.1", "1.2"]);
			expect(secondLevelIndices).toEqual([0, 1, 2]);
			expect(thirdLevel).toEqual(["1.1.2", "1.1.3"]);
			expect(thirdLevelIndices).toEqual([0, 1]);

			n112.move("before", n11);
			expect(secondLevel).toEqual(["1.1.2", "1.1", "1.1.1", "1.2"]);
			expect(thirdLevel).toEqual(["1.1.3"]);
			expect(secondLevelIndices).toEqual([0, 1, 2, 3]);
			expect(thirdLevelIndices).toEqual([0]);
		});
	});

	test("TreeNode.move() after a node on a different level", () => {
		effectRootScope(() => {
			const tree = new Tree({ items });
			const n1 = tree.roots[0];
			const [n11, n12] = n1.children;
			const [n111, n112] = n11.children;

			const secondLevel = $derived(n1.children.map((node) => node.id));
			const secondLevelIndices = $derived(
				n1.children.map((node) => node.levelIndex),
			);

			const thirdLevel = $derived(n11.children.map((node) => node.id));
			const thirdLevelIndices = $derived(
				n11.children.map((node) => node.levelIndex),
			);

			n111.move("after", n12);
			expect(secondLevel).toEqual(["1.1", "1.2", "1.1.1"]);
			expect(secondLevelIndices).toEqual([0, 1, 2]);
			expect(thirdLevel).toEqual(["1.1.2", "1.1.3"]);
			expect(thirdLevelIndices).toEqual([0, 1]);

			n112.move("after", n11);
			expect(secondLevel).toEqual(["1.1", "1.1.2", "1.2", "1.1.1"]);
			expect(secondLevelIndices).toEqual([0, 1, 2, 3]);
			expect(thirdLevel).toEqual(["1.1.3"]);
			expect(thirdLevelIndices).toEqual([0]);
		});
	});
});
