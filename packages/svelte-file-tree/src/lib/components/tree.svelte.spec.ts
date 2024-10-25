import { withEffectRoot } from "$lib/test/with-effect-root.svelte.js";
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
	test("Tree.all()", () => {
		const tree = new Tree({ items });
		const nodes = tree
			.all()
			.map((node) => ({
				id: node.id,
				value: node.value,
			}))
			.toArray();

		expect(nodes).toEqual([
			{
				id: "1",
				value: "Section 1",
			},
			{
				id: "1.1",
				value: "Section 1.1",
			},
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
			{
				id: "1.2",
				value: "Section 1.2",
			},
			{
				id: "1.2.1",
				value: "Section 1.2.1",
			},
			{
				id: "1.2.2",
				value: "Section 1.2.2",
			},
			{
				id: "2",
				value: "Section 2",
			},
			{
				id: "2.1",
				value: "Section 2.1",
			},
			{
				id: "2.2",
				value: "Section 2.2",
			},
			{
				id: "3",
				value: "Section 3",
			},
			{
				id: "3.1",
				value: "Section 3.1",
			},
			{
				id: "3.2",
				value: "Section 3.2",
			},
		]);
	});

	test("Tree.iter()", () => {
		const tree = new Tree({
			items,
			defaultExpanded: ["1", "1.2", "2"],
		});
		const nodes = tree
			.iter()
			.map((node) => node.id)
			.toArray();

		// 1
		// -- 1.1
		//   -- 1.1.1 (hidden)
		//   -- 1.1.2 (hidden)
		//   -- 1.1.3 (hidden)
		// -- 1.2
		//   -- 1.2.1
		//	 -- 1.2.2
		// 2
		// -- 2.1
		// -- 2.2
		// 3
		// -- 3.1 (hidden)
		// -- 3.2 (hidden)
		expect(nodes).toEqual([
			"1",
			"1.1",
			"1.2",
			"1.2.1",
			"1.2.2",
			"2",
			"2.1",
			"2.2",
			"3",
		]);
	});

	test("Tree.reversed()", () => {
		const tree = new Tree({
			items,
			defaultExpanded: ["1", "1.2", "2"],
		});
		const nodes = tree
			.reversed()
			.map((node) => node.id)
			.toArray();

		// 1
		// -- 1.1
		//   -- 1.1.1 (hidden)
		//   -- 1.1.2 (hidden)
		//   -- 1.1.3 (hidden)
		// -- 1.2
		//   -- 1.2.1
		//	 -- 1.2.2
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
			"1.2.2",
			"1.2.1",
			"1.2",
			"1.1",
			"1",
		]);
	});

	test("TreeNode.levelIndex", () => {
		const tree = new Tree({ items });
		const indices = Object.fromEntries(
			tree.all().map((node) => [node.id, node.levelIndex]),
		);

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

	test("Tree.size and TreeNode.size", () => {
		const tree = new Tree({ items });
		const sizes = Object.fromEntries(
			tree.all().map((node) => [node.id, node.size]),
		);

		expect(sizes).toEqual({
			"1": 8,
			"2": 3,
			"3": 3,
			"1.1": 4,
			"1.2": 3,
			"2.1": 1,
			"2.2": 1,
			"3.1": 1,
			"3.2": 1,
			"1.1.1": 1,
			"1.1.2": 1,
			"1.1.3": 1,
			"1.2.1": 1,
			"1.2.2": 1,
		});

		expect(tree.size).toBe(14);
	});

	test(
		"Tree selection methods",
		withEffectRoot(() => {
			const tree = new Tree({
				items,
				defaultSelected: ["1", "1.2", "2"],
			});
			const selected = $derived(
				new Set(
					tree
						.all()
						.filter((node) => node.selected)
						.map((node) => node.id),
				),
			);

			const expected = new Set(["1", "1.2", "2"]);
			expect(selected).toEqual(expected);

			tree.selectItem("1.1");
			expected.add("1.1");
			expect(tree.itemSelected("1.1")).toBe(true);
			expect(selected).toEqual(expected);

			tree.deselectItem("1");
			expected.delete("1");
			expect(tree.itemSelected("1")).toBe(false);
			expect(selected).toEqual(expected);

			tree.selectAll();
			for (const node of tree) {
				expected.add(node.id);
			}
			expect(selected).toEqual(expected);

			tree.deselectItem("1.2");
			expected.delete("1.2");
			expect(tree.itemSelected("1.2")).toBe(false);
			expect(selected).toEqual(expected);

			tree.deselectAll();
			expected.clear();
			expect(selected).toEqual(expected);
		}),
	);

	test(
		"Tree expansion methods",
		withEffectRoot(() => {
			const tree = new Tree({
				items,
				defaultExpanded: ["1", "1.2", "2"],
			});
			const expanded = $derived(
				new Set(
					tree
						.all()
						.filter((node) => node.expanded)
						.map((node) => node.id),
				),
			);

			const expected = new Set(["1", "1.2", "2"]);
			expect(expanded).toEqual(expected);

			tree.expandItem("1.1");
			expected.add("1.1");
			expect(tree.itemExpanded("1.1")).toBe(true);
			expect(expanded).toEqual(expected);

			tree.collapseItem("1");
			expected.delete("1");
			expect(tree.itemExpanded("1")).toBe(false);
			expect(expanded).toEqual(expected);

			tree.collapseAll();
			expanded.clear();
			expect(expanded).toBe(expected);
		}),
	);

	test("TreeNode.level()", () => {
		const tree = new Tree({ items });
		const levels = Object.fromEntries(
			tree
				.all()
				.map((node) => [node.id, node.level().map((sibling) => sibling.id)]),
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

	test("TreeNode.previousSibling() and TreeNode.nextSibling()", () => {
		const tree = new Tree({ items });
		const siblings = Object.fromEntries(
			tree.all().map((node) => [
				node.id,
				{
					previous: node.previousSibling()?.id,
					next: node.nextSibling()?.id,
				},
			]),
		);

		expect(siblings).toEqual({
			"1": {
				previous: undefined,
				next: "2",
			},
			"2": {
				previous: "1",
				next: "3",
			},
			"3": {
				previous: "2",
				next: undefined,
			},
			"1.1": {
				previous: undefined,
				next: "1.2",
			},
			"1.2": {
				previous: "1.1",
				next: undefined,
			},
			"2.1": {
				previous: undefined,
				next: "2.2",
			},
			"2.2": {
				previous: "2.1",
				next: undefined,
			},
			"3.1": {
				previous: undefined,
				next: "3.2",
			},
			"3.2": {
				previous: "3.1",
				next: undefined,
			},
			"1.1.1": {
				previous: undefined,
				next: "1.1.2",
			},
			"1.1.2": {
				previous: "1.1.1",
				next: "1.1.3",
			},
			"1.1.3": {
				previous: "1.1.2",
				next: undefined,
			},
			"1.2.1": {
				previous: undefined,
				next: "1.2.2",
			},
			"1.2.2": {
				previous: "1.2.1",
				next: undefined,
			},
		});
	});

	test("TreeNode.previous() and TreeNode.next()", () => {
		const tree = new Tree({
			items,
			defaultExpanded: ["1", "1.2", "2"],
		});
		const nodes = Object.fromEntries(
			tree.iter().map((node) => [
				node.id,
				{
					previous: node.previous()?.id,
					next: node.next()?.id,
				},
			]),
		);

		// 1
		// -- 1.1
		//   -- 1.1.1 (hidden)
		//   -- 1.1.2 (hidden)
		//   -- 1.1.3 (hidden)
		// -- 1.2
		//   -- 1.2.1
		//	 -- 1.2.2
		// 2
		// -- 2.1
		// -- 2.2
		// 3
		// -- 3.1 (hidden)
		// -- 3.2 (hidden)
		expect(nodes).toEqual({
			"1": {
				previous: undefined,
				next: "1.1",
			},
			"1.1": {
				previous: "1",
				next: "1.2",
			},
			"1.2": {
				previous: "1.1",
				next: "1.2.1",
			},
			"1.2.1": {
				previous: "1.2",
				next: "1.2.2",
			},
			"1.2.2": {
				previous: "1.2.1",
				next: "2",
			},
			"2": {
				previous: "1.2.2",
				next: "2.1",
			},
			"2.1": {
				previous: "2",
				next: "2.2",
			},
			"2.2": {
				previous: "2.1",
				next: "3",
			},
			"3": {
				previous: "2.2",
				next: undefined,
			},
		});
	});
});
