import { describe, expect, test } from "vitest";
import { Tree, type TreeItem } from "./tree.js";

const data: TreeItem<string> = {
	value: "Sections",
	children: [
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
	],
};

describe("Tree", () => {
	test("It iterates in the correct order", () => {
		const tree = Tree.from(data);
		const values = Array.from(tree).map((node) => {
			return {
				value: node.value,
				id: node.id,
				level: node.level,
				index: node.index,
				parent: node.parent?.value,
				children: node.children.map((child) => child.value),
				previousSibling: node.previousSibling?.value,
				nextSibling: node.nextSibling?.value,
			};
		});

		expect(values).toEqual([
			{
				value: "Sections",
				id: "1",
				level: 1,
				index: 0,
				parent: undefined,
				children: ["Section 1", "Section 2", "Section 3"],
				previousSibling: undefined,
				nextSibling: undefined,
			},
			{
				value: "Section 1",
				id: "1.1",
				level: 2,
				index: 0,
				parent: "Sections",
				children: ["Section 1.1"],
				previousSibling: undefined,
				nextSibling: "Section 2",
			},
			{
				value: "Section 1.1",
				id: "1.1.1",
				level: 3,
				index: 0,
				parent: "Section 1",
				children: ["Section 1.1.1", "Section 1.1.2", "Section 1.1.3"],
				previousSibling: undefined,
				nextSibling: undefined,
			},
			{
				value: "Section 1.1.1",
				id: "1.1.1.1",
				level: 4,
				index: 0,
				parent: "Section 1.1",
				children: [],
				previousSibling: undefined,
				nextSibling: "Section 1.1.2",
			},
			{
				value: "Section 1.1.2",
				id: "1.1.1.2",
				level: 4,
				index: 1,
				parent: "Section 1.1",
				children: [],
				previousSibling: "Section 1.1.1",
				nextSibling: "Section 1.1.3",
			},
			{
				value: "Section 1.1.3",
				id: "1.1.1.3",
				level: 4,
				index: 2,
				parent: "Section 1.1",
				children: [],
				previousSibling: "Section 1.1.2",
				nextSibling: undefined,
			},
			{
				value: "Section 2",
				id: "1.2",
				level: 2,
				index: 1,
				parent: "Sections",
				children: ["Section 2.1", "Section 2.2"],
				previousSibling: "Section 1",
				nextSibling: "Section 3",
			},
			{
				value: "Section 2.1",
				id: "1.2.1",
				level: 3,
				index: 0,
				parent: "Section 2",
				children: [],
				previousSibling: undefined,
				nextSibling: "Section 2.2",
			},
			{
				value: "Section 2.2",
				id: "1.2.2",
				level: 3,
				index: 1,
				parent: "Section 2",
				children: [],
				previousSibling: "Section 2.1",
				nextSibling: undefined,
			},
			{
				value: "Section 3",
				id: "1.3",
				level: 2,
				index: 2,
				parent: "Sections",
				children: [],
				previousSibling: "Section 2",
				nextSibling: undefined,
			},
		]);
	});

	test("It filters nodes correctly", () => {
		const nodes = Tree.from(data).filter((node) => node.level <= 2);
		const values = Array.from(nodes).map((node) => node.value);
		expect(values).toEqual(["Sections", "Section 1", "Section 2", "Section 3"]);
	});
});
