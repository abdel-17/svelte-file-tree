import { describe, expect, test } from "vitest";
import {
	LinkedTree,
	type LinkedTreeItem,
	type LinkedTreeItemList,
} from "./tree.svelte.js";

const items = [
	{
		id: "1",
		name: "Section 1",
		children: [
			{
				id: "1.1",
				name: "Section 1.1",
				children: [
					{
						id: "1.1.1",
						name: "Section 1.1.1",
					},
					{
						id: "1.1.2",
						name: "Section 1.1.2",
					},
					{
						id: "1.1.3",
						name: "Section 1.1.3",
					},
				],
			},
			{
				id: "1.2",
				name: "Section 1.2",
				children: [
					{
						id: "1.2.1",
						name: "Section 1.2.1",
					},
					{
						id: "1.2.2",
						name: "Section 1.2.2",
					},
				],
			},
		],
	},
	{
		id: "2",
		name: "Section 2",
		children: [
			{
				id: "2.1",
				name: "Section 2.1",
			},
			{
				id: "2.2",
				name: "Section 2.2",
			},
		],
	},
	{
		id: "3",
		name: "Section 3",
		children: [
			{
				id: "3.1",
				name: "Section 3.1",
			},
			{
				id: "3.2",
				name: "Section 3.2",
			},
		],
	},
];

describe("Tree", () => {
	test("LinkedTree.items", () => {
		const tree = new LinkedTree({ items });
		const [item_1, item_2, item_3] = tree.items;

		expect(item_1.id).toBe("1");
		expect(item_2.id).toBe("2");
		expect(item_3.id).toBe("3");

		expect(tree.items.head).toBe(item_1);
		expect(tree.items.tail).toBe(item_3);
		expect(tree.items.length).toBe(3);

		expect(item_1.previousSibling).toBeUndefined();
		expect(item_1.nextSibling).toBe(item_2);

		expect(item_2.previousSibling).toBe(item_1);
		expect(item_2.nextSibling).toBe(item_3);

		expect(item_3.previousSibling).toBe(item_2);
		expect(item_3.nextSibling).toBeUndefined();
	});

	test("LinkedTree.selectAll() selects all visible items", () => {
		effectRootScope(() => {
			const tree = new LinkedTree({ items });
			tree.selectAll();
			expect([...tree.selected]).toEqual(["1", "2", "3"]);

			tree.expanded.add("1");
			tree.selected.clear();
			tree.selectAll();
			expect([...tree.selected]).toEqual(["1", "1.1", "1.2", "2", "3"]);
		});
	});

	test("LinkedTreeItem.name", () => {
		const tree = new LinkedTree({ items });
		const values = createMapping(tree, (item) => item.name);
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

	test("LinkedTreeItem.depth", () => {
		const tree = new LinkedTree({ items });
		const depths = createMapping(tree, (item) => item.depth);
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

	test("LinkedTreeItem.parent", () => {
		const tree = new LinkedTree({ items });
		const parents = createMapping(tree, (item) => item.parent?.id);
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

	test("LinkedTreeItem.siblings", () => {
		const tree = new LinkedTree({ items });
		const siblings = createMapping(tree, (item) =>
			item.siblings.toArray().map((sibling) => sibling.id),
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

	test("LinkedTree.previousSibling", () => {
		const tree = new LinkedTree({ items });
		const previousSiblings = createMapping(
			tree,
			(item) => item.previousSibling?.id,
		);
		expect(previousSiblings).toEqual({
			"1": undefined,
			"2": "1",
			"3": "2",
			"1.1": undefined,
			"1.2": "1.1",
			"2.1": undefined,
			"2.2": "2.1",
			"3.1": undefined,
			"3.2": "3.1",
			"1.1.1": undefined,
			"1.1.2": "1.1.1",
			"1.1.3": "1.1.2",
			"1.2.1": undefined,
			"1.2.2": "1.2.1",
		});
	});

	test("LinkedTreeItem.nextSibling", () => {
		const tree = new LinkedTree({ items });
		const nextSiblings = createMapping(tree, (item) => item.nextSibling?.id);
		expect(nextSiblings).toEqual({
			"1": "2",
			"2": "3",
			"3": undefined,
			"1.1": "1.2",
			"1.2": undefined,
			"2.1": "2.2",
			"2.2": undefined,
			"3.1": "3.2",
			"3.2": undefined,
			"1.1.1": "1.1.2",
			"1.1.2": "1.1.3",
			"1.1.3": undefined,
			"1.2.1": "1.2.2",
			"1.2.2": undefined,
		});
	});

	test("LinkedTreeItem.children", () => {
		const tree = new LinkedTree({ items });
		const children = createMapping(tree, (item) =>
			item.children.toArray().map((child) => child.id),
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

	test("Updating the tree's expansion state updates the tree item", () => {
		effectRootScope(() => {
			const tree = new LinkedTree({ items });
			const item = tree.items.head!;
			expect(item.expanded).false;

			tree.expanded.add("1");
			expect(item.expanded).true;

			tree.expanded.delete("1");
			expect(item.expanded).false;
		});
	});

	test("TreeItem expansion methods update the expansion state", () => {
		effectRootScope(() => {
			const tree = new LinkedTree({ items });
			const item = tree.items.head!;
			expect(item.expanded).false;

			item.expand();
			expect(item.expanded).true;
			expect([...tree.expanded]).toEqual(["1"]);

			item.collapse();
			expect(item.expanded).false;
			expect(tree.expanded).empty;

			item.expanded = true;
			expect(item.expanded).true;
			expect([...tree.expanded]).toEqual(["1"]);

			item.expanded = false;
			expect(item.expanded).false;
			expect(tree.expanded).empty;
		});
	});

	test("Updating the tree's selection state updates the tree item", () => {
		effectRootScope(() => {
			const tree = new LinkedTree({ items });
			const item = tree.items.head!;
			expect(item.selected).false;

			tree.selected.add("1");
			expect(item.selected).true;

			tree.selected.delete("1");
			expect(item.selected).false;
		});
	});

	test("TreeItem selection methods update the selection state", () => {
		effectRootScope(() => {
			const tree = new LinkedTree({ items });
			const item = tree.items.head!;
			expect(item.selected).false;

			item.select();
			expect(item.selected).true;
			expect([...tree.selected]).toEqual(["1"]);

			item.unselect();
			expect(item.selected).false;
			expect(tree.selected).empty;

			item.selected = true;
			expect(item.selected).true;
			expect([...tree.selected]).toEqual(["1"]);

			item.selected = false;
			expect(item.selected).false;
			expect(tree.selected).empty;
		});
	});

	test("LinkedTreeItem.contains() returns true for descendants", () => {
		const tree = new LinkedTree({ items });
		const item_1 = tree.items.head!;
		const [item_11, item_12] = item_1.children;
		const [item_111, item_112, item_113] = item_11.children;
		const [item_121, item_122] = item_12.children;

		expect(item_1.contains(item_1)).true;
		expect(item_1.contains(item_11)).true;
		expect(item_1.contains(item_12)).true;
		expect(item_1.contains(item_111)).true;
		expect(item_1.contains(item_112)).true;
		expect(item_1.contains(item_113)).true;

		expect(item_11.contains(item_11)).true;
		expect(item_11.contains(item_111)).true;
		expect(item_11.contains(item_112)).true;
		expect(item_11.contains(item_113)).true;

		expect(item_12.contains(item_12)).true;
		expect(item_12.contains(item_121)).true;
		expect(item_12.contains(item_122)).true;
	});

	test("LinkedTreeItem.contains() returns false for ancestors", () => {
		const tree = new LinkedTree({ items });
		const item_1 = tree.items.head!;
		const [item_11, item_12] = item_1.children;
		const [item_111, item_112, item_113] = item_11.children;
		const [item_121, item_122] = item_12.children;

		expect(item_11.contains(item_1)).false;
		expect(item_12.contains(item_1)).false;
		expect(item_111.contains(item_1)).false;
		expect(item_112.contains(item_1)).false;
		expect(item_113.contains(item_1)).false;

		expect(item_111.contains(item_11)).false;
		expect(item_112.contains(item_11)).false;
		expect(item_113.contains(item_11)).false;

		expect(item_121.contains(item_12)).false;
		expect(item_122.contains(item_12)).false;
	});

	test("LinkedTreeItem.contains() returns false for siblings", () => {
		const tree = new LinkedTree({ items });
		const [item_1, item_2] = tree.items;
		const [item_11, item_12] = item_1.children;
		const [item_21, item_22] = item_2.children;
		const [item_111, item_112, item_113] = item_11.children;
		const [item_121, item_122] = item_12.children;

		expect(item_1.contains(item_2)).false;
		expect(item_1.contains(item_21)).false;
		expect(item_1.contains(item_22)).false;

		expect(item_11.contains(item_12)).false;
		expect(item_11.contains(item_121)).false;
		expect(item_11.contains(item_122)).false;
		expect(item_11.contains(item_2)).false;
		expect(item_11.contains(item_21)).false;
		expect(item_11.contains(item_22)).false;

		expect(item_12.contains(item_11)).false;
		expect(item_12.contains(item_111)).false;
		expect(item_12.contains(item_112)).false;
		expect(item_12.contains(item_113)).false;
		expect(item_12.contains(item_2)).false;
		expect(item_12.contains(item_21)).false;
		expect(item_12.contains(item_22)).false;

		expect(item_111.contains(item_112)).false;
		expect(item_111.contains(item_113)).false;
		expect(item_111.contains(item_12)).false;
		expect(item_111.contains(item_121)).false;
		expect(item_111.contains(item_122)).false;
		expect(item_111.contains(item_2)).false;
		expect(item_111.contains(item_21)).false;
		expect(item_111.contains(item_22)).false;

		expect(item_112.contains(item_111)).false;
		expect(item_112.contains(item_113)).false;
		expect(item_112.contains(item_12)).false;
		expect(item_112.contains(item_121)).false;
		expect(item_112.contains(item_122)).false;
		expect(item_112.contains(item_2)).false;
		expect(item_112.contains(item_21)).false;
		expect(item_112.contains(item_22)).false;

		expect(item_113.contains(item_111)).false;
		expect(item_113.contains(item_112)).false;
		expect(item_113.contains(item_12)).false;
		expect(item_113.contains(item_121)).false;
		expect(item_113.contains(item_122)).false;
		expect(item_113.contains(item_2)).false;
		expect(item_113.contains(item_21)).false;
		expect(item_113.contains(item_22)).false;
	});

	test("LinkedTreeItemList.prepend() inserts a new item at the start of the list", () => {
		effectRootScope(() => {
			const tree = new LinkedTree({ items });
			const item_1 = tree.items.head!;
			const [item_11, item_12] = item_1.children;

			//           1
			// 1         -- 1.3
			// -- 1.1    -- 1.1
			// -- 1.2    -- 1.2
			// 2         2
			const item_13 = item_1.children.prepend({
				id: "1.3",
				name: "Section 1.3",
			});

			expect(item_13.id).toBe("1.3");
			expect(item_13.name).toBe("Section 1.3");
			expect(item_13.depth).toBe(1);
			expect(item_13.parent).toBe(item_1);
			expect(item_13.siblings).toBe(item_1.children);

			expect(item_1.children.head).toBe(item_13);
			expect(item_1.children.tail).toBe(item_12);
			expect(item_1.children.length).toBe(3);

			expect(item_13.previousSibling).toBeUndefined();
			expect(item_13.nextSibling).toBe(item_11);

			expect(item_11.previousSibling).toBe(item_13);
			expect(item_11.nextSibling).toBe(item_12);

			expect(item_12.previousSibling).toBe(item_11);
			expect(item_12.nextSibling).toBeUndefined();
		});
	});

	test("LinkedTreeItemList.append() inserts a new item at the end of the list", () => {
		effectRootScope(() => {
			const tree = new LinkedTree({ items });
			const item_1 = tree.items.head!;
			const [item_11, item_12] = item_1.children;

			//           1
			// 1         -- 1.1
			// -- 1.1    -- 1.2
			// -- 1.2    -- 1.3
			// 2         2
			const item_13 = item_1.children.append({
				id: "1.3",
				name: "Section 1.3",
			});

			expect(item_13.id).toBe("1.3");
			expect(item_13.name).toBe("Section 1.3");
			expect(item_13.depth).toBe(1);
			expect(item_13.parent).toBe(item_1);
			expect(item_13.siblings).toBe(item_1.children);

			expect(item_1.children.head).toBe(item_11);
			expect(item_1.children.tail).toBe(item_13);
			expect(item_1.children.length).toBe(3);

			expect(item_11.previousSibling).toBeUndefined();
			expect(item_11.nextSibling).toBe(item_12);

			expect(item_12.previousSibling).toBe(item_11);
			expect(item_12.nextSibling).toBe(item_13);

			expect(item_13.previousSibling).toBe(item_12);
			expect(item_13.nextSibling).toBeUndefined();
		});
	});

	test("LinkedTreeItem.insertBefore() inserts a new item before this item", () => {
		effectRootScope(() => {
			const tree = new LinkedTree({ items });
			const item_1 = tree.items.head!;
			const [item_11, item_12] = item_1.children;

			//           1
			// 1         -- 1.1
			// -- 1.1    -- 1.3
			// -- 1.2    -- 1.2
			// 2         2
			const item_13 = item_12.insertBefore({
				id: "1.3",
				name: "Section 1.3",
			});

			expect(item_13.id).toBe("1.3");
			expect(item_13.name).toBe("Section 1.3");
			expect(item_13.depth).toBe(1);
			expect(item_13.parent).toBe(item_1);
			expect(item_13.siblings).toBe(item_1.children);

			expect(item_1.children.head).toBe(item_11);
			expect(item_1.children.tail).toBe(item_12);
			expect(item_1.children.length).toBe(3);

			expect(item_11.previousSibling).toBeUndefined();
			expect(item_11.nextSibling).toBe(item_13);

			expect(item_13.previousSibling).toBe(item_11);
			expect(item_13.nextSibling).toBe(item_12);

			expect(item_12.previousSibling).toBe(item_13);
			expect(item_12.nextSibling).toBeUndefined();
		});
	});

	test("LinkedTreeItem.insertAfter() inserts a new item after this item", () => {
		effectRootScope(() => {
			const tree = new LinkedTree({ items });
			const item_1 = tree.items.head!;
			const [item_11, item_12] = item_1.children;

			//           1
			// 1         -- 1.1
			// -- 1.1    -- 1.2
			// -- 1.2    -- 1.3
			// 2         2
			const item_13 = item_12.insertAfter({
				id: "1.3",
				name: "Section 1.3",
			});

			expect(item_13.id).toBe("1.3");
			expect(item_13.name).toBe("Section 1.3");
			expect(item_13.depth).toBe(1);
			expect(item_13.parent).toBe(item_1);
			expect(item_13.siblings).toBe(item_1.children);

			expect(item_1.children.head).toBe(item_11);
			expect(item_1.children.tail).toBe(item_13);
			expect(item_1.children.length).toBe(3);

			expect(item_11.previousSibling).toBeUndefined();
			expect(item_11.nextSibling).toBe(item_12);

			expect(item_12.previousSibling).toBe(item_11);
			expect(item_12.nextSibling).toBe(item_13);

			expect(item_13.previousSibling).toBe(item_12);
			expect(item_13.nextSibling).toBeUndefined();
		});
	});

	test("LinkedTreeItem.moveBefore() moves this item before the given item", () => {
		effectRootScope(() => {
			const tree = new LinkedTree({ items });
			const [item_1, item_2, item_3] = tree.items;
			const [item_11, item_12] = item_1.children;

			// 1         1
			// -- 1.1    -- 1.1
			// -- 1.2    -- 3
			// 2         -- 1.2
			// 3         2
			item_3.moveBefore(item_12);

			expect(item_3.depth).toBe(1);
			expect(item_3.parent).toBe(item_1);
			expect(item_3.siblings).toBe(item_1.children);

			expect(tree.items.head).toBe(item_1);
			expect(tree.items.tail).toBe(item_2);
			expect(tree.items.length).toBe(2);

			expect(item_1.previousSibling).toBeUndefined();
			expect(item_1.nextSibling).toBe(item_2);

			expect(item_2.previousSibling).toBe(item_1);
			expect(item_2.nextSibling).toBeUndefined();

			expect(item_1.children.head).toBe(item_11);
			expect(item_1.children.tail).toBe(item_12);
			expect(item_1.children.length).toBe(3);

			expect(item_11.previousSibling).toBeUndefined();
			expect(item_11.nextSibling).toBe(item_3);

			expect(item_3.previousSibling).toBe(item_11);
			expect(item_3.nextSibling).toBe(item_12);

			expect(item_12.previousSibling).toBe(item_3);
			expect(item_12.nextSibling).toBeUndefined();
		});
	});

	test("LinkedTreeItem.moveBefore() throws an error if the given item is a descandant", () => {
		const tree = new LinkedTree({ items });
		const item_1 = tree.items.head!;
		const [item_11, item_12] = item_1.children;
		const [item_111, item_112, item_113] = item_11.children;
		const [item_121, item_122] = item_12.children;

		expect(() => item_1.moveBefore(item_11)).toThrowError();
		expect(() => item_1.moveBefore(item_12)).toThrowError();

		expect(() => item_1.moveBefore(item_111)).toThrowError();
		expect(() => item_1.moveBefore(item_112)).toThrowError();
		expect(() => item_1.moveBefore(item_113)).toThrowError();

		expect(() => item_11.moveBefore(item_111)).toThrowError();
		expect(() => item_11.moveBefore(item_112)).toThrowError();
		expect(() => item_11.moveBefore(item_113)).toThrowError();

		expect(() => item_12.moveBefore(item_121)).toThrowError();
		expect(() => item_12.moveBefore(item_122)).toThrowError();
	});

	test("LinkedTreeItem.moveAfter() moves this item after the given item", () => {
		effectRootScope(() => {
			const tree = new LinkedTree({ items });
			const [item_1, item_2, item_3] = tree.items;
			const [item_11, item_12] = item_1.children;

			// 1         1
			// -- 1.1    -- 1.1
			// -- 1.2    -- 1.2
			// 2         -- 3
			// 3         2
			item_3.moveAfter(item_12);

			expect(item_3.depth).toBe(1);
			expect(item_3.parent).toBe(item_1);
			expect(item_3.siblings).toBe(item_1.children);

			expect(tree.items.head).toBe(item_1);
			expect(tree.items.tail).toBe(item_2);
			expect(tree.items.length).toBe(2);

			expect(item_1.previousSibling).toBeUndefined();
			expect(item_1.nextSibling).toBe(item_2);

			expect(item_2.previousSibling).toBe(item_1);
			expect(item_2.nextSibling).toBeUndefined();

			expect(item_1.children.head).toBe(item_11);
			expect(item_1.children.tail).toBe(item_3);
			expect(item_1.children.length).toBe(3);

			expect(item_11.previousSibling).toBeUndefined();
			expect(item_11.nextSibling).toBe(item_12);

			expect(item_12.previousSibling).toBe(item_11);
			expect(item_12.nextSibling).toBe(item_3);

			expect(item_3.previousSibling).toBe(item_12);
			expect(item_3.nextSibling).toBeUndefined();
		});
	});

	test("LinkedTreeItem.moveAfter() throws an error if the given item is a descandant", () => {
		const tree = new LinkedTree({ items });
		const item_1 = tree.items.head!;
		const [item_11, item_12] = item_1.children;
		const [item_111, item_112, item_113] = item_11.children;
		const [item_121, item_122] = item_12.children;

		expect(() => item_1.moveAfter(item_11)).toThrowError();
		expect(() => item_1.moveAfter(item_12)).toThrowError();

		expect(() => item_1.moveAfter(item_111)).toThrowError();
		expect(() => item_1.moveAfter(item_112)).toThrowError();
		expect(() => item_1.moveAfter(item_113)).toThrowError();

		expect(() => item_11.moveAfter(item_111)).toThrowError();
		expect(() => item_11.moveAfter(item_112)).toThrowError();
		expect(() => item_11.moveAfter(item_113)).toThrowError();

		expect(() => item_12.moveAfter(item_121)).toThrowError();
		expect(() => item_12.moveAfter(item_122)).toThrowError();
	});

	test("LinkedTreeItem.prependTo() prepends this item to the given item's children", () => {
		effectRootScope(() => {
			const tree = new LinkedTree({ items });
			const [item_1, item_2, item_3] = tree.items;
			const [item_11, item_12] = item_1.children;

			// 1         1
			// -- 1.1    -- 3
			// -- 1.2    -- 1.1
			// 2         -- 1.2
			// 3         2
			item_3.prependTo(item_1);

			expect(item_3.depth).toBe(1);
			expect(item_3.parent).toBe(item_1);
			expect(item_3.siblings).toBe(item_1.children);

			expect(tree.items.head).toBe(item_1);
			expect(tree.items.tail).toBe(item_2);
			expect(tree.items.length).toBe(2);

			expect(item_1.previousSibling).toBeUndefined();
			expect(item_1.nextSibling).toBe(item_2);

			expect(item_2.previousSibling).toBe(item_1);
			expect(item_2.nextSibling).toBeUndefined();

			expect(item_1.children.head).toBe(item_3);
			expect(item_1.children.tail).toBe(item_12);
			expect(item_1.children.length).toBe(3);

			expect(item_3.previousSibling).toBeUndefined();
			expect(item_3.nextSibling).toBe(item_11);

			expect(item_11.previousSibling).toBe(item_3);
			expect(item_11.nextSibling).toBe(item_12);

			expect(item_12.previousSibling).toBe(item_11);
			expect(item_12.nextSibling).toBeUndefined();
		});
	});

	test("LinkedTreeItem.prependTo() throws an error if the given item is a descandant", () => {
		const tree = new LinkedTree({ items });
		const item_1 = tree.items.head!;
		const [item_11, item_12] = item_1.children;
		const [item_111, item_112, item_113] = item_11.children;
		const [item_121, item_122] = item_12.children;

		expect(() => item_1.prependTo(item_11)).toThrowError();
		expect(() => item_1.prependTo(item_12)).toThrowError();

		expect(() => item_1.prependTo(item_111)).toThrowError();
		expect(() => item_1.prependTo(item_112)).toThrowError();
		expect(() => item_1.prependTo(item_113)).toThrowError();

		expect(() => item_11.prependTo(item_111)).toThrowError();
		expect(() => item_11.prependTo(item_112)).toThrowError();
		expect(() => item_11.prependTo(item_113)).toThrowError();

		expect(() => item_12.prependTo(item_121)).toThrowError();
		expect(() => item_12.prependTo(item_122)).toThrowError();
	});

	test("LinkedTreeItem.appendTo() appends this item to the given item's children", () => {
		effectRootScope(() => {
			const tree = new LinkedTree({ items });
			const [item_1, item_2, item_3] = tree.items;
			const [item_11, item_12] = item_1.children;

			// 1         1
			// -- 1.1    -- 1.1
			// -- 1.2    -- 1.2
			// 2         -- 3
			// 3         2
			item_3.appendTo(item_1);

			expect(item_3.depth).toBe(1);
			expect(item_3.parent).toBe(item_1);
			expect(item_3.siblings).toBe(item_1.children);

			expect(tree.items.head).toBe(item_1);
			expect(tree.items.tail).toBe(item_2);
			expect(tree.items.length).toBe(2);

			expect(item_1.previousSibling).toBeUndefined();
			expect(item_1.nextSibling).toBe(item_2);

			expect(item_2.previousSibling).toBe(item_1);
			expect(item_2.nextSibling).toBeUndefined();

			expect(item_1.children.head).toBe(item_11);
			expect(item_1.children.tail).toBe(item_3);
			expect(item_1.children.length).toBe(3);

			expect(item_11.previousSibling).toBeUndefined();
			expect(item_11.nextSibling).toBe(item_12);

			expect(item_12.previousSibling).toBe(item_11);
			expect(item_12.nextSibling).toBe(item_3);

			expect(item_3.previousSibling).toBe(item_12);
			expect(item_3.nextSibling).toBeUndefined();
		});
	});

	test("LinkedTreeItem.appendTo() throws an error if the given item is a descandant", () => {
		const tree = new LinkedTree({ items });
		const item_1 = tree.items.head!;
		const [item_11, item_12] = item_1.children;
		const [item_111, item_112, item_113] = item_11.children;
		const [item_121, item_122] = item_12.children;

		expect(() => item_1.appendTo(item_11)).toThrowError();
		expect(() => item_1.appendTo(item_12)).toThrowError();

		expect(() => item_1.appendTo(item_111)).toThrowError();
		expect(() => item_1.appendTo(item_112)).toThrowError();
		expect(() => item_1.appendTo(item_113)).toThrowError();

		expect(() => item_11.appendTo(item_111)).toThrowError();
		expect(() => item_11.appendTo(item_112)).toThrowError();
		expect(() => item_11.appendTo(item_113)).toThrowError();

		expect(() => item_12.appendTo(item_121)).toThrowError();
		expect(() => item_12.appendTo(item_122)).toThrowError();
	});

	test("LinkedTreeItem.remove() removes this item", () => {
		effectRootScope(() => {
			const tree = new LinkedTree({
				items,
				defaultExpanded: [
					"1",
					"1.1",
					"1.1.1",
					"1.1.2",
					"1.1.3",
					"1.2.1",
					"1.2.2",
					"1.2",
					"2",
					"3",
				],
				defaultSelected: [
					"1",
					"1.1",
					"1.1.1",
					"1.1.2",
					"1.1.3",
					"1.2",
					"1.2.1",
					"1.2.2",
					"2",
					"3",
				],
			});
			const [item_1, item_2, item_3] = tree.items;

			// 1
			// -- 1.1
			// ---- 1.1.1
			// ---- 1.1.2
			// ---- 1.1.3
			// -- 1.2
			// ---- 1.2.1
			// ---- 1.2.2
			// 2             2
			// 3             3
			item_1.remove();

			expect(item_1.previousSibling).toBeUndefined();
			expect(item_1.nextSibling).toBeUndefined();

			expect(tree.items.head).toBe(item_2);
			expect(tree.items.tail).toBe(item_3);
			expect(tree.items.length).toBe(2);

			expect(item_2.previousSibling).toBeUndefined();
			expect(item_2.nextSibling).toBe(item_3);

			expect(item_3.previousSibling).toBe(item_2);
			expect(item_3.nextSibling).toBeUndefined();

			expect([...tree.expanded]).toEqual(["2", "3"]);
			expect([...tree.selected]).toEqual(["2", "3"]);
		});
	});

	test("LinkedTreeItem.remove() does nothing if the item has already been removed", () => {
		effectRootScope(() => {
			const tree = new LinkedTree({ items });
			const [item_1, item_2, item_3] = tree.items;

			item_1.remove();
			item_1.remove();

			expect(item_1.previousSibling).toBeUndefined();
			expect(item_1.nextSibling).toBeUndefined();

			expect(tree.items.head).toBe(item_2);
			expect(tree.items.tail).toBe(item_3);
			expect(tree.items.length).toBe(2);

			expect(item_2.previousSibling).toBeUndefined();
			expect(item_2.nextSibling).toBe(item_3);

			expect(item_3.previousSibling).toBe(item_2);
			expect(item_3.nextSibling).toBeUndefined();
		});
	});
});

function traverse(
	items: LinkedTreeItemList,
	callback: (item: LinkedTreeItem) => void,
) {
	for (const item of items) {
		callback(item);
		traverse(item.children, callback);
	}
}

function createMapping<TOut>(
	tree: LinkedTree,
	transform: (item: LinkedTreeItem) => TOut,
) {
	const mapping: Record<string, TOut> = {};
	traverse(tree.items, (item) => {
		mapping[item.id] = transform(item);
	});
	return mapping;
}

function effectRootScope(scope: () => void) {
	const cleanup = $effect.root(scope);
	cleanup();
}
