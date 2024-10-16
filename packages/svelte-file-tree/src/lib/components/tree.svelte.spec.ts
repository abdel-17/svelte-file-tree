import { describe, expect, onTestFinished, test } from "vitest";
import { Tree } from "./tree.svelte.js";

describe("Tree", () => {
	const tree = new Tree({
		items: [
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
		],
	});

	test("Tree traversal order is correct", () => {
		const nodes = Array.from(tree).map((node) => {
			return {
				id: node.id,
				value: node.value,
			};
		});

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

	test("Tree.parent is correct", () => {
		const parents = Object.fromEntries(
			Array.from(tree).map((node) => [node.id, node.parent?.id]),
		);

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

	test("Tree.children is correct", () => {
		const children = Object.fromEntries(
			Array.from(tree).map((item) => [
				item.id,
				item.children.map((child) => child.id),
			]),
		);

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

	test("Tree.level is correct", () => {
		const levels = Object.fromEntries(
			Array.from(tree).map((item) => [
				item.id,
				item.level.map((node) => node.id),
			]),
		);

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

	test("Tree.index is correct", () => {
		const indices = Object.fromEntries(
			Array.from(tree).map((item) => [item.id, item.index]),
		);

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

	test("Tree.depth is correct", () => {
		const depths = Object.fromEntries(
			Array.from(tree).map((item) => [item.id, item.depth]),
		);

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

	test("Tree navigation is correct", () => {
		tree.expandedIds.add("1");
		tree.expandedIds.add("1.2");
		tree.expandedIds.add("2");
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

		onTestFinished(() => {
			tree.expandedIds.clear();
		});

		const nodes = Array.from(tree)
			.filter((item) => item.visible)
			.map((item) => {
				return {
					id: item.id,
					previous: item.previous?.id,
					next: item.next?.id,
				};
			});

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
