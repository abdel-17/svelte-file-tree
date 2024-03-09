import { describe, expect, test } from "vitest";
import { flattenTree, type TreeList } from "./tree.js";

const tree: TreeList<string> = [
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
	test("flattenTree()", () => {
		function getItemId(value: string) {
			return value;
		}

		const nodes = flattenTree(tree, getItemId).map((node) => {
			return {
				...node,
				parent: node.parent?.value,
				previousSibling: node.previousSibling?.value,
				nextSibling: node.nextSibling?.value,
				children: node.children.map((child) => child.value),
			};
		});

		expect(nodes).toEqual([
			{
				id: "Section 1",
				value: "Section 1",
				setSize: 3,
				positionInSet: 1,
				level: 1,
				parent: undefined,
				previousSibling: undefined,
				nextSibling: "Section 2",
				children: ["Section 1.1"],
			},
			{
				id: "Section 1.1",
				value: "Section 1.1",
				setSize: 1,
				positionInSet: 1,
				level: 2,
				parent: "Section 1",
				previousSibling: undefined,
				nextSibling: undefined,
				children: ["Section 1.1.1", "Section 1.1.2", "Section 1.1.3"],
			},
			{
				id: "Section 1.1.1",
				value: "Section 1.1.1",
				setSize: 3,
				positionInSet: 1,
				level: 3,
				parent: "Section 1.1",
				previousSibling: undefined,
				nextSibling: "Section 1.1.2",
				children: [],
			},
			{
				id: "Section 1.1.2",
				value: "Section 1.1.2",
				setSize: 3,
				positionInSet: 2,
				level: 3,
				parent: "Section 1.1",
				previousSibling: "Section 1.1.1",
				nextSibling: "Section 1.1.3",
				children: [],
			},
			{
				id: "Section 1.1.3",
				value: "Section 1.1.3",
				setSize: 3,
				positionInSet: 3,
				level: 3,
				parent: "Section 1.1",
				previousSibling: "Section 1.1.2",
				nextSibling: undefined,
				children: [],
			},
			{
				id: "Section 2",
				value: "Section 2",
				positionInSet: 2,
				setSize: 3,
				level: 1,
				parent: undefined,
				previousSibling: "Section 1",
				nextSibling: "Section 3",
				children: ["Section 2.1", "Section 2.2"],
			},
			{
				id: "Section 2.1",
				value: "Section 2.1",
				setSize: 2,
				positionInSet: 1,
				level: 2,
				parent: "Section 2",
				previousSibling: undefined,
				nextSibling: "Section 2.2",
				children: [],
			},
			{
				id: "Section 2.2",
				value: "Section 2.2",
				setSize: 2,
				positionInSet: 2,
				level: 2,
				parent: "Section 2",
				previousSibling: "Section 2.1",
				nextSibling: undefined,
				children: [],
			},
			{
				id: "Section 3",
				value: "Section 3",
				setSize: 3,
				positionInSet: 3,
				level: 1,
				parent: undefined,
				previousSibling: "Section 2",
				nextSibling: undefined,
				children: [],
			},
		]);
	});
});
