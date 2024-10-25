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
	test("Tree.roots", () => {
		const tree = new Tree({ items });
		const roots = tree.roots.map((node) => ({
			id: node.id,
			value: node.value,
		}));

		expect(roots).toEqual([
			{
				id: "1",
				value: "Section 1",
			},
			{
				id: "2",
				value: "Section 2",
			},
			{
				id: "3",
				value: "Section 3",
			},
		]);
	});

	test("Tree.all()", () => {
		const tree = new Tree({ items });
		const nodes = tree
			.all()
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

	test("Tree.iter()", () => {
		const tree = new Tree({
			items,
			defaultExpanded: ["1", "1.1", "2"],
		});
		const nodes = tree
			.iter()
			.map((node) => node.id)
			.toArray();

		// 1
		// -- 1.1
		//   -- 1.1.1
		//   -- 1.1.2
		//   -- 1.1.3
		// -- 1.2
		//   -- 1.2.1 (hidden)
		//   -- 1.2.2 (hidden)
		// 2
		// -- 2.1
		// -- 2.2
		// 3
		// -- 3.1 (hidden)
		// -- 3.2 (hidden)
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
			items,
			defaultExpanded: ["1", "1.1", "2"],
		});
		const nodes = tree
			.reversed()
			.map((node) => node.id)
			.toArray();

		// 1
		// -- 1.1
		//   -- 1.1.1
		//   -- 1.1.2
		//   -- 1.1.3
		// -- 1.2
		//   -- 1.2.1 (hidden)
		//   -- 1.2.2 (hidden)
		// 2
		// -- 2.1
		// -- 2.2
		// 3
		// -- 3.1 (hidden)
		// -- 3.2 (hidden)
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

	test("TreeNode.parent", () => {
		const tree = new Tree({ items });
		const parents = Object.fromEntries(
			tree.all().map((node) => [node.id, node.parent?.id]),
		);

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
		const children = Object.fromEntries(
			tree
				.all()
				.map((node) => [node.id, node.children.map((child) => child.id)]),
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

	test("TreeNode.depth", () => {
		const tree = new Tree({ items });
		const depths = Object.fromEntries(
			tree.all().map((node) => [node.id, node.depth]),
		);

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

	test("TreeNode.level", () => {
		const tree = new Tree({ items });
		const levels = Object.fromEntries(
			tree
				.all()
				.map((node) => [node.id, node.level.map((sibling) => sibling.id)]),
		);

		expect(levels).toEqual({
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

	test("TreeNode.contains()", () => {
		const tree = new Tree({ items });

		const first = tree.roots[0]!;
		expect(first.contains(first)).toBe(true);
		expect(first.contains(first.children[0]!)).toBe(true);

		const second = tree.roots[1]!;
		expect(first.contains(second)).toBe(false);
		expect(first.contains(second.children[0]!)).toBe(false);
	});
});
