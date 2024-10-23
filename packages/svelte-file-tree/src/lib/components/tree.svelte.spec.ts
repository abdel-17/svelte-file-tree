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
	},
] as const;

describe("Tree", () => {
	test("Tree.iter()", () => {
		const tree = new Tree({ items });
		const nodes = tree
			.iter()
			.map((node) => ({
				id: node.id,
				value: node.value,
			}))
			.toArray();

		// 1
		// -- 1.1
		//   -- 1.1.1
		//   -- 1.1.2
		//   -- 1.1.3
		// -- 1.2
		//   -- 1.2.1
		//	 -- 1.2.2
		// 2
		// -- 2.1
		// -- 2.2
		// 3
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
		]);
	});

	test("TreeNode.parent", () => {
		const tree = new Tree({ items });
		const parents = Object.fromEntries(
			tree.iter().map((node) => [node.id, node.parent?.id]),
		);

		// 1
		// -- 1.1
		//   -- 1.1.1
		//   -- 1.1.2
		//   -- 1.1.3
		// -- 1.2
		//   -- 1.2.1
		//	 -- 1.2.2
		// 2
		// -- 2.1
		// -- 2.2
		// 3
		expect(parents).toEqual({
			"1": undefined,
			"2": undefined,
			"3": undefined,
			"1.1": "1",
			"1.2": "1",
			"2.1": "2",
			"2.2": "2",
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
				.iter()
				.map((node) => [node.id, node.children.map((child) => child.id)]),
		);

		// 1
		// -- 1.1
		//   -- 1.1.1
		//   -- 1.1.2
		//   -- 1.1.3
		// -- 1.2
		//   -- 1.2.1
		//	 -- 1.2.2
		// 2
		// -- 2.1
		// -- 2.2
		// 3
		expect(children).toEqual({
			"1": ["1.1", "1.2"],
			"2": ["2.1", "2.2"],
			"3": [],
			"1.1": ["1.1.1", "1.1.2", "1.1.3"],
			"1.2": ["1.2.1", "1.2.2"],
			"2.1": [],
			"2.2": [],
			"1.1.1": [],
			"1.1.2": [],
			"1.1.3": [],
			"1.2.1": [],
			"1.2.2": [],
		});
	});

	test("TreeNode.level", () => {
		const tree = new Tree({ items });
		const levels = Object.fromEntries(
			tree
				.iter()
				.map((node) => [node.id, node.level.map((sibling) => sibling.id)]),
		);

		// 1
		// -- 1.1
		//   -- 1.1.1
		//   -- 1.1.2
		//   -- 1.1.3
		// -- 1.2
		//   -- 1.2.1
		//	 -- 1.2.2
		// 2
		// -- 2.1
		// -- 2.2
		// 3
		expect(levels).toEqual({
			"1": ["1", "2", "3"],
			"2": ["1", "2", "3"],
			"3": ["1", "2", "3"],
			"1.1": ["1.1", "1.2"],
			"1.2": ["1.1", "1.2"],
			"2.1": ["2.1", "2.2"],
			"2.2": ["2.1", "2.2"],
			"1.1.1": ["1.1.1", "1.1.2", "1.1.3"],
			"1.1.2": ["1.1.1", "1.1.2", "1.1.3"],
			"1.1.3": ["1.1.1", "1.1.2", "1.1.3"],
			"1.2.1": ["1.2.1", "1.2.2"],
			"1.2.2": ["1.2.1", "1.2.2"],
		});
	});

	test("TreeNode.levelIndex", () => {
		const tree = new Tree({ items });
		const indices = Object.fromEntries(
			tree.iter().map((node) => [node.id, node.levelIndex]),
		);

		// 1
		// -- 1.1
		//   -- 1.1.1
		//   -- 1.1.2
		//   -- 1.1.3
		// -- 1.2
		//   -- 1.2.1
		//	 -- 1.2.2
		// 2
		// -- 2.1
		// -- 2.2
		// 3
		expect(indices).toEqual({
			"1": 0,
			"2": 1,
			"3": 2,
			"1.1": 0,
			"1.2": 1,
			"2.1": 0,
			"2.2": 1,
			"1.1.1": 0,
			"1.1.2": 1,
			"1.1.3": 2,
			"1.2.1": 0,
			"1.2.2": 1,
		});
	});

	test("TreeNode.depth", () => {
		const tree = new Tree({ items });
		const depths = Object.fromEntries(
			tree.iter().map((node) => [node.id, node.depth]),
		);

		// 1
		// -- 1.1
		//   -- 1.1.1
		//   -- 1.1.2
		//   -- 1.1.3
		// -- 1.2
		//   -- 1.2.1
		//	 -- 1.2.2
		// 2
		// -- 2.1
		// -- 2.2
		// 3
		expect(depths).toEqual({
			"1": 0,
			"2": 0,
			"3": 0,
			"1.1": 1,
			"1.2": 1,
			"2.1": 1,
			"2.2": 1,
			"1.1.1": 2,
			"1.1.2": 2,
			"1.1.3": 2,
			"1.2.1": 2,
			"1.2.2": 2,
		});
	});

	test("TreeNode.size", () => {
		const tree = new Tree({ items });
		const sizes = Object.fromEntries(
			tree.iter().map((node) => [node.id, node.size]),
		);

		// 1
		// -- 1.1
		//   -- 1.1.1
		//   -- 1.1.2
		//   -- 1.1.3
		// -- 1.2
		//   -- 1.2.1
		//	 -- 1.2.2
		// 2
		// -- 2.1
		// -- 2.2
		// 3
		expect(sizes).toEqual({
			"1": 8,
			"2": 3,
			"3": 1,
			"1.1": 4,
			"1.2": 3,
			"2.1": 1,
			"2.2": 1,
			"1.1.1": 1,
			"1.1.2": 1,
			"1.1.3": 1,
			"1.2.1": 1,
			"1.2.2": 1,
		});

		expect(tree.size).toBe(12);
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
						.iter()
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
						.iter()
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

	test("TreeNode.previous/next", () => {
		const tree = new Tree({
			items,
			defaultExpanded: ["1", "1.2", "2"],
		});
		const nodes = tree
			.iter()
			.map((node) => ({
				id: node.id,
				previous: node.previous?.id,
				next: node.next?.id,
			}))
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
		expect(nodes).toEqual([
			{
				id: "1",
				previous: undefined,
				next: "1.1",
			},
			{
				id: "1.1",
				previous: "1",
				next: "1.2",
			},
			// <hidden>
			{
				id: "1.1.1",
				previous: "1.1",
				next: "1.1.2",
			},
			{
				id: "1.1.2",
				previous: "1.1.1",
				next: "1.1.3",
			},
			{
				id: "1.1.3",
				previous: "1.1.2",
				next: "1.2",
			},
			// </hidden>
			{
				id: "1.2",
				previous: "1.1",
				next: "1.2.1",
			},
			{
				id: "1.2.1",
				previous: "1.2",
				next: "1.2.2",
			},
			{
				id: "1.2.2",
				previous: "1.2.1",
				next: "2",
			},
			{
				id: "2",
				previous: "1.2.2",
				next: "2.1",
			},
			{
				id: "2.1",
				previous: "2",
				next: "2.2",
			},
			{
				id: "2.2",
				previous: "2.1",
				next: "3",
			},
			{
				id: "3",
				previous: "2.2",
				next: undefined,
			},
		]);
	});
});
