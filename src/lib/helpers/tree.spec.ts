import { describe, expect, test } from "vitest";
import { flattenTree, type Tree } from "./tree.js";

const data: Tree<string>[] = [
	{
		value: "Section 1",
		children: [
			{
				value: "Section 1.1",
				children: [
					{
						value: "Section 1.1.1",
					},
					{
						value: "Section 1.1.2",
					},
					{
						value: "Section 1.1.3",
					},
				],
			},
		],
	},
	{
		value: "Section 2",
		children: [
			{
				value: "Section 2.1",
			},
			{
				value: "Section 2.2",
			},
		],
	},
	{
		value: "Section 3",
	},
];

describe("Tree", () => {
	test("Flattens the tree in the correct order", () => {
		const values = flattenTree(...data).map((node) => {
			const { parent, value, setSize, positionInSet, level, children } = node;
			return {
				parent: parent?.value,
				value,
				setSize,
				positionInSet,
				level,
				children: children.map((node) => node.value),
			};
		});

		expect(values).toEqual([
			{
				parent: undefined,
				value: "Section 1",
				setSize: 3,
				positionInSet: 1,
				level: 1,
				children: ["Section 1.1"],
			},
			{
				parent: "Section 1",
				value: "Section 1.1",
				setSize: 1,
				positionInSet: 1,
				level: 2,
				children: ["Section 1.1.1", "Section 1.1.2", "Section 1.1.3"],
			},
			{
				parent: "Section 1.1",
				value: "Section 1.1.1",
				setSize: 3,
				positionInSet: 1,
				level: 3,
				children: [],
			},
			{
				parent: "Section 1.1",
				value: "Section 1.1.2",
				setSize: 3,
				positionInSet: 2,
				level: 3,
				children: [],
			},
			{
				parent: "Section 1.1",
				value: "Section 1.1.3",
				setSize: 3,
				positionInSet: 3,
				level: 3,
				children: [],
			},
			{
				parent: undefined,
				value: "Section 2",
				positionInSet: 2,
				setSize: 3,
				level: 1,
				children: ["Section 2.1", "Section 2.2"],
			},
			{
				parent: "Section 2",
				value: "Section 2.1",
				setSize: 2,
				positionInSet: 1,
				level: 2,
				children: [],
			},
			{
				parent: "Section 2",
				value: "Section 2.2",
				setSize: 2,
				positionInSet: 2,
				level: 2,
				children: [],
			},
			{
				parent: undefined,
				value: "Section 3",
				setSize: 3,
				positionInSet: 3,
				level: 1,
				children: [],
			},
		]);
	});
});
