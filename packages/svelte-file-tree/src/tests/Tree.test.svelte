<script lang="ts" module>
import { FileTree, type FileTreeProps } from "$lib/index.js";
import { type Locator, commands, page } from "@vitest/browser/context";
import type { ComponentProps, ComponentType, SvelteComponent } from "svelte";
import { describe, expect, onTestFinished, test, vi } from "vitest";
import {
	type RenderResult,
	type SvelteComponentOptions,
	render as vitestRender,
} from "vitest-browser-svelte";
import Tree from "./Tree.svelte";

function createTree(props?: FileTreeProps): FileTree {
	const tree = new FileTree(props);
	tree.nodes = [
		tree.createFolder({
			id: "1",
			name: "Section 1",
			children: [
				tree.createFolder({
					id: "1.1",
					name: "Section 1.1",
					children: [
						tree.createFile({
							id: "1.1.1",
							name: "Section 1.1.1",
						}),
						tree.createFile({
							id: "1.1.2",
							name: "Section 1.1.2",
						}),
						tree.createFile({
							id: "1.1.3",
							name: "Section 1.1.3",
						}),
					],
				}),
				tree.createFolder({
					id: "1.2",
					name: "Section 1.2",
					children: [
						tree.createFile({
							id: "1.2.1",
							name: "Section 1.2.1",
						}),
						tree.createFile({
							id: "1.2.2",
							name: "Section 1.2.2",
						}),
					],
				}),
			],
		}),
		tree.createFolder({
			id: "2",
			name: "Section 2",
			children: [
				tree.createFile({
					id: "2.1",
					name: "Section 2.1",
				}),
				tree.createFile({
					id: "2.2",
					name: "Section 2.2",
				}),
			],
		}),
		tree.createFolder({
			id: "3",
			name: "Section 3",
			children: [
				tree.createFile({
					id: "3.1",
					name: "Section 3.1",
				}),
				tree.createFile({
					id: "3.2",
					name: "Section 3.2",
				}),
			],
		}),
	];
	return tree;
}

type TreeComponent = SvelteComponent<ComponentProps<typeof Tree>>;

function renderTree(options: SvelteComponentOptions<TreeComponent>): RenderResult<TreeComponent> {
	// biome-ignore lint/suspicious/noExplicitAny: Vitest types need to be updated
	return vitestRender(Tree as any as ComponentType<TreeComponent>, options);
}

describe("Tree", () => {
	test("Tree is rendered correctly", async () => {
		const tree = createTree();
		const screen = renderTree({
			props: { tree },
		});
		const treeElement = screen.getByRole("tree");
		const item_1 = getTreeItem(screen, "Section 1");
		const item_11 = getTreeItem(screen, "Section 1.1");
		const item_111 = getTreeItem(screen, "Section 1.1.1");
		const item_112 = getTreeItem(screen, "Section 1.1.2");
		const item_113 = getTreeItem(screen, "Section 1.1.3");
		const item_12 = getTreeItem(screen, "Section 1.2");
		const item_121 = getTreeItem(screen, "Section 1.2.1");
		const item_122 = getTreeItem(screen, "Section 1.2.2");
		const item_2 = getTreeItem(screen, "Section 2");
		const item_21 = getTreeItem(screen, "Section 2.1");
		const item_22 = getTreeItem(screen, "Section 2.2");
		const item_3 = getTreeItem(screen, "Section 3");
		const item_31 = getTreeItem(screen, "Section 3.1");
		const item_32 = getTreeItem(screen, "Section 3.2");

		await expect.element(treeElement).toBeVisible();
		await expect.element(treeElement).toHaveAttribute("aria-multiselectable", "true");

		await expect.element(item_1).toBeVisible();
		await expect.element(item_1).toHaveAttribute("aria-selected", "false");
		await expect.element(item_1).toHaveAttribute("aria-expanded", "false");
		await expect.element(item_1).toHaveAttribute("aria-level", "1");
		await expect.element(item_1).toHaveAttribute("aria-posinset", "1");
		await expect.element(item_1).toHaveAttribute("aria-setsize", "3");
		await expect.element(item_1).toHaveAttribute("tabindex", "0");
		await expect.element(item_1).not.toHaveAttribute("data-editing");
		await expect.element(item_1).not.toHaveAttribute("data-dragged");
		await expect.element(item_1).not.toHaveAttribute("data-drop-position");

		await expect.element(item_11).not.toBeInTheDocument();
		await expect.element(item_111).not.toBeInTheDocument();
		await expect.element(item_112).not.toBeInTheDocument();
		await expect.element(item_113).not.toBeInTheDocument();
		await expect.element(item_12).not.toBeInTheDocument();
		await expect.element(item_121).not.toBeInTheDocument();
		await expect.element(item_122).not.toBeInTheDocument();

		await expect.element(item_2).toBeVisible();
		await expect.element(item_2).toHaveAttribute("aria-selected", "false");
		await expect.element(item_2).toHaveAttribute("aria-expanded", "false");
		await expect.element(item_2).toHaveAttribute("aria-level", "1");
		await expect.element(item_2).toHaveAttribute("aria-posinset", "2");
		await expect.element(item_2).toHaveAttribute("aria-setsize", "3");
		await expect.element(item_2).toHaveAttribute("tabindex", "-1");
		await expect.element(item_2).not.toHaveAttribute("data-editing");
		await expect.element(item_2).not.toHaveAttribute("data-dragged");
		await expect.element(item_2).not.toHaveAttribute("data-drop-position");

		await expect.element(item_21).not.toBeInTheDocument();
		await expect.element(item_22).not.toBeInTheDocument();

		await expect.element(item_3).toBeVisible();
		await expect.element(item_3).toHaveAttribute("aria-selected", "false");
		await expect.element(item_3).toHaveAttribute("aria-expanded", "false");
		await expect.element(item_3).toHaveAttribute("aria-level", "1");
		await expect.element(item_3).toHaveAttribute("aria-posinset", "3");
		await expect.element(item_3).toHaveAttribute("aria-setsize", "3");
		await expect.element(item_3).toHaveAttribute("tabindex", "-1");
		await expect.element(item_3).not.toHaveAttribute("data-editing");
		await expect.element(item_3).not.toHaveAttribute("data-dragged");
		await expect.element(item_3).not.toHaveAttribute("data-drop-position");

		await expect.element(item_31).not.toBeInTheDocument();
		await expect.element(item_32).not.toBeInTheDocument();

		tree.expanded.add("1");

		await expect.element(item_11).toBeVisible();
		await expect.element(item_11).toHaveAttribute("aria-selected", "false");
		await expect.element(item_11).toHaveAttribute("aria-expanded", "false");
		await expect.element(item_11).toHaveAttribute("aria-level", "2");
		await expect.element(item_11).toHaveAttribute("aria-posinset", "1");
		await expect.element(item_11).toHaveAttribute("aria-setsize", "2");
		await expect.element(item_11).toHaveAttribute("tabindex", "-1");
		await expect.element(item_11).not.toHaveAttribute("data-editing");
		await expect.element(item_11).not.toHaveAttribute("data-dragged");
		await expect.element(item_11).not.toHaveAttribute("data-drop-position");

		await expect.element(item_111).not.toBeInTheDocument();
		await expect.element(item_112).not.toBeInTheDocument();
		await expect.element(item_113).not.toBeInTheDocument();

		await expect.element(item_12).toBeVisible();
		await expect.element(item_12).toHaveAttribute("aria-selected", "false");
		await expect.element(item_12).toHaveAttribute("aria-expanded", "false");
		await expect.element(item_12).toHaveAttribute("aria-level", "2");
		await expect.element(item_12).toHaveAttribute("aria-posinset", "2");
		await expect.element(item_12).toHaveAttribute("aria-setsize", "2");
		await expect.element(item_12).toHaveAttribute("tabindex", "-1");
		await expect.element(item_12).not.toHaveAttribute("data-editing");
		await expect.element(item_12).not.toHaveAttribute("data-dragged");
		await expect.element(item_12).not.toHaveAttribute("data-drop-position");

		await expect.element(item_121).not.toBeInTheDocument();
		await expect.element(item_122).not.toBeInTheDocument();

		tree.expanded.add("1.1");

		await expect.element(item_111).toBeVisible();
		await expect.element(item_111).toHaveAttribute("aria-selected", "false");
		await expect.element(item_111).not.toHaveAttribute("aria-expanded");
		await expect.element(item_111).toHaveAttribute("aria-level", "3");
		await expect.element(item_111).toHaveAttribute("aria-posinset", "1");
		await expect.element(item_111).toHaveAttribute("aria-setsize", "3");
		await expect.element(item_111).toHaveAttribute("tabindex", "-1");
		await expect.element(item_111).not.toHaveAttribute("data-editing");
		await expect.element(item_111).not.toHaveAttribute("data-dragged");
		await expect.element(item_111).not.toHaveAttribute("data-drop-position");

		await expect.element(item_112).toBeVisible();
		await expect.element(item_112).toHaveAttribute("aria-selected", "false");
		await expect.element(item_112).not.toHaveAttribute("aria-expanded");
		await expect.element(item_112).toHaveAttribute("aria-level", "3");
		await expect.element(item_112).toHaveAttribute("aria-posinset", "2");
		await expect.element(item_112).toHaveAttribute("aria-setsize", "3");
		await expect.element(item_112).toHaveAttribute("tabindex", "-1");
		await expect.element(item_112).not.toHaveAttribute("data-editing");
		await expect.element(item_112).not.toHaveAttribute("data-dragged");
		await expect.element(item_112).not.toHaveAttribute("data-drop-position");

		await expect.element(item_113).toBeVisible();
		await expect.element(item_113).toHaveAttribute("aria-selected", "false");
		await expect.element(item_113).not.toHaveAttribute("aria-expanded");
		await expect.element(item_113).toHaveAttribute("aria-level", "3");
		await expect.element(item_113).toHaveAttribute("aria-posinset", "3");
		await expect.element(item_113).toHaveAttribute("aria-setsize", "3");
		await expect.element(item_113).toHaveAttribute("tabindex", "-1");
		await expect.element(item_113).not.toHaveAttribute("data-editing");
		await expect.element(item_113).not.toHaveAttribute("data-dragged");
		await expect.element(item_113).not.toHaveAttribute("data-drop-position");

		tree.expanded.add("1.2");

		await expect.element(item_121).toBeVisible();
		await expect.element(item_121).toHaveAttribute("aria-selected", "false");
		await expect.element(item_121).not.toHaveAttribute("aria-expanded");
		await expect.element(item_121).toHaveAttribute("aria-level", "3");
		await expect.element(item_121).toHaveAttribute("aria-posinset", "1");
		await expect.element(item_121).toHaveAttribute("aria-setsize", "2");
		await expect.element(item_121).toHaveAttribute("tabindex", "-1");
		await expect.element(item_121).not.toHaveAttribute("data-editing");
		await expect.element(item_121).not.toHaveAttribute("data-dragged");
		await expect.element(item_121).not.toHaveAttribute("data-drop-position");

		await expect.element(item_122).toBeVisible();
		await expect.element(item_122).toHaveAttribute("aria-selected", "false");
		await expect.element(item_122).not.toHaveAttribute("aria-expanded");
		await expect.element(item_122).toHaveAttribute("aria-level", "3");
		await expect.element(item_122).toHaveAttribute("aria-posinset", "2");
		await expect.element(item_122).toHaveAttribute("aria-setsize", "2");
		await expect.element(item_122).toHaveAttribute("tabindex", "-1");
		await expect.element(item_122).not.toHaveAttribute("data-editing");
		await expect.element(item_122).not.toHaveAttribute("data-dragged");
		await expect.element(item_122).not.toHaveAttribute("data-drop-position");

		tree.expanded.add("2");

		await expect.element(item_21).toBeVisible();
		await expect.element(item_21).toHaveAttribute("aria-selected", "false");
		await expect.element(item_21).not.toHaveAttribute("aria-expanded");
		await expect.element(item_21).toHaveAttribute("aria-level", "2");
		await expect.element(item_21).toHaveAttribute("aria-posinset", "1");
		await expect.element(item_21).toHaveAttribute("aria-setsize", "2");
		await expect.element(item_21).toHaveAttribute("tabindex", "-1");
		await expect.element(item_21).not.toHaveAttribute("data-editing");
		await expect.element(item_21).not.toHaveAttribute("data-dragged");
		await expect.element(item_21).not.toHaveAttribute("data-drop-position");

		await expect.element(item_22).toBeVisible();
		await expect.element(item_22).toHaveAttribute("aria-selected", "false");
		await expect.element(item_22).not.toHaveAttribute("aria-expanded");
		await expect.element(item_22).toHaveAttribute("aria-level", "2");
		await expect.element(item_22).toHaveAttribute("aria-posinset", "2");
		await expect.element(item_22).toHaveAttribute("aria-setsize", "2");
		await expect.element(item_22).toHaveAttribute("tabindex", "-1");
		await expect.element(item_22).not.toHaveAttribute("data-editing");
		await expect.element(item_22).not.toHaveAttribute("data-dragged");
		await expect.element(item_22).not.toHaveAttribute("data-drop-position");

		tree.expanded.add("3");

		await expect.element(item_31).toBeVisible();
		await expect.element(item_31).toHaveAttribute("aria-selected", "false");
		await expect.element(item_31).not.toHaveAttribute("aria-expanded");
		await expect.element(item_31).toHaveAttribute("aria-level", "2");
		await expect.element(item_31).toHaveAttribute("aria-posinset", "1");
		await expect.element(item_31).toHaveAttribute("aria-setsize", "2");
		await expect.element(item_31).toHaveAttribute("tabindex", "-1");
		await expect.element(item_31).not.toHaveAttribute("data-editing");
		await expect.element(item_31).not.toHaveAttribute("data-dragged");
		await expect.element(item_31).not.toHaveAttribute("data-drop-position");

		await expect.element(item_32).toBeVisible();
		await expect.element(item_32).toHaveAttribute("aria-selected", "false");
		await expect.element(item_32).not.toHaveAttribute("aria-expanded");
		await expect.element(item_32).toHaveAttribute("aria-level", "2");
		await expect.element(item_32).toHaveAttribute("aria-posinset", "2");
		await expect.element(item_32).toHaveAttribute("aria-setsize", "2");
		await expect.element(item_32).toHaveAttribute("tabindex", "-1");
		await expect.element(item_32).not.toHaveAttribute("data-editing");
		await expect.element(item_32).not.toHaveAttribute("data-dragged");
		await expect.element(item_32).not.toHaveAttribute("data-drop-position");
	});

	test("Selected items have aria-selected set to true", async () => {
		const tree = createTree();
		const screen = renderTree({
			props: { tree },
		});
		const item_1 = getTreeItem(screen, "Section 1");
		const item_2 = getTreeItem(screen, "Section 2");
		const item_3 = getTreeItem(screen, "Section 3");

		tree.selected.add("1");
		await expect.element(item_1).toHaveAttribute("aria-selected", "true");
		await expect.element(item_2).toHaveAttribute("aria-selected", "false");
		await expect.element(item_3).toHaveAttribute("aria-selected", "false");

		tree.selected.add("2");
		await expect.element(item_1).toHaveAttribute("aria-selected", "true");
		await expect.element(item_2).toHaveAttribute("aria-selected", "true");
		await expect.element(item_3).toHaveAttribute("aria-selected", "false");

		tree.selected.add("3");
		await expect.element(item_1).toHaveAttribute("aria-selected", "true");
		await expect.element(item_2).toHaveAttribute("aria-selected", "true");
		await expect.element(item_3).toHaveAttribute("aria-selected", "true");

		tree.selected.delete("1");
		await expect.element(item_1).toHaveAttribute("aria-selected", "false");
		await expect.element(item_2).toHaveAttribute("aria-selected", "true");
		await expect.element(item_3).toHaveAttribute("aria-selected", "true");

		tree.selected.delete("2");
		await expect.element(item_1).toHaveAttribute("aria-selected", "false");
		await expect.element(item_2).toHaveAttribute("aria-selected", "false");
		await expect.element(item_3).toHaveAttribute("aria-selected", "true");

		tree.selected.delete("3");
		await expect.element(item_1).toHaveAttribute("aria-selected", "false");
		await expect.element(item_2).toHaveAttribute("aria-selected", "false");
		await expect.element(item_3).toHaveAttribute("aria-selected", "false");
	});

	test("Tree roving focus", async () => {
		const tree = createTree();
		const screen = renderTree({
			props: { tree },
		});
		const item_1 = getTreeItem(screen, "Section 1");
		const item_2 = getTreeItem(screen, "Section 2");
		const item_3 = getTreeItem(screen, "Section 3");

		focus(item_1);
		await expect.element(item_1).toHaveAttribute("tabindex", "0");
		await expect.element(item_2).toHaveAttribute("tabindex", "-1");
		await expect.element(item_3).toHaveAttribute("tabindex", "-1");

		focus(item_2);
		await expect.element(item_1).toHaveAttribute("tabindex", "-1");
		await expect.element(item_2).toHaveAttribute("tabindex", "0");
		await expect.element(item_3).toHaveAttribute("tabindex", "-1");

		focus(item_3);
		await expect.element(item_1).toHaveAttribute("tabindex", "-1");
		await expect.element(item_2).toHaveAttribute("tabindex", "-1");
		await expect.element(item_3).toHaveAttribute("tabindex", "0");
	});

	test("Space toggles selection", async () => {
		const tree = createTree();
		const screen = renderTree({
			props: { tree },
		});
		const item_1 = getTreeItem(screen, "Section 1");
		const item_2 = getTreeItem(screen, "Section 2");
		const item_3 = getTreeItem(screen, "Section 3");

		focus(item_1);
		await commands.press("Space");
		expect([...tree.selected]).toEqual(["1"]);

		focus(item_2);
		await commands.press("Space");
		expect([...tree.selected]).toEqual(["1", "2"]);

		focus(item_3);
		await commands.press("Space");
		expect([...tree.selected]).toEqual(["1", "2", "3"]);

		focus(item_1);
		await commands.press("Space");
		expect([...tree.selected]).toEqual(["2", "3"]);

		focus(item_2);
		await commands.press("Space");
		expect([...tree.selected]).toEqual(["3"]);

		focus(item_3);
		await commands.press("Space");
		expect(tree.selected).empty;
	});

	test("Shift+Space selects multiple items", async () => {
		const tree = createTree({
			defaultExpanded: ["1", "2", "3"],
		});
		const screen = renderTree({
			props: { tree },
		});
		const item_2 = getTreeItem(screen, "Section 2");
		const item_3 = getTreeItem(screen, "Section 3");

		tree.selected.add("1").add("2");
		focus(item_3);
		await commands.press("Shift+Space");
		expect([...tree.selected]).toEqual(["1", "2", "2.1", "2.2", "3"]);

		tree.selected.clear();
		tree.selected.add("1").add("3");
		focus(item_2);
		await commands.press("Shift+Space");
		expect([...tree.selected]).toEqual(["1", "3", "2.2", "2.1", "2"]);

		tree.selected.clear();
		await commands.press("Shift+Space");
		expect([...tree.selected]).toEqual(["1", "1.1", "1.2", "2"]);

		await commands.press("Shift+Space");
		expect([...tree.selected]).toEqual(["1", "1.1", "1.2", "2"]);
	});

	test("Control/Command+a selects all items", async () => {
		const tree = createTree();
		const screen = renderTree({
			props: { tree },
		});
		const item_2 = getTreeItem(screen, "Section 2");

		focus(item_2);
		await commands.press("ControlOrMeta+a");
		expect([...tree.selected]).toEqual(["1", "2", "3"]);

		tree.selected.clear();
		tree.expanded.add("1").add("1.1");
		await commands.press("ControlOrMeta+a");
		expect([...tree.selected]).toEqual(["1", "1.1", "1.1.1", "1.1.2", "1.1.3", "1.2", "2", "3"]);
	});

	test("Escape unselects all items", async () => {
		const tree = createTree({
			defaultSelected: ["1", "2", "3"],
		});
		const screen = renderTree({
			props: { tree },
		});
		const item_2 = getTreeItem(screen, "Section 2");

		focus(item_2);
		await commands.press("Escape");
		expect(tree.selected).empty;
	});

	test("ArrowLeft/Right navigation", async () => {
		const tree = createTree();
		const screen = renderTree({
			props: { tree },
		});
		const item_1 = getTreeItem(screen, "Section 1");
		const item_11 = getTreeItem(screen, "Section 1.1");
		const item_111 = getTreeItem(screen, "Section 1.1.1");
		const item_112 = getTreeItem(screen, "Section 1.1.2");
		const item_113 = getTreeItem(screen, "Section 1.1.3");
		const item_12 = getTreeItem(screen, "Section 1.2");
		const item_121 = getTreeItem(screen, "Section 1.2.1");
		const item_122 = getTreeItem(screen, "Section 1.2.2");

		focus(item_1);
		await commands.press("ArrowRight");
		await expect.element(item_1).toHaveFocus();
		expect([...tree.expanded]).toEqual(["1"]);

		await commands.press("ArrowRight");
		await expect.element(item_11).toHaveFocus();
		expect([...tree.expanded]).toEqual(["1"]);

		await commands.press("ArrowRight");
		await expect.element(item_11).toHaveFocus();
		expect([...tree.expanded]).toEqual(["1", "1.1"]);

		await commands.press("ArrowRight");
		await expect.element(item_111).toHaveFocus();
		expect([...tree.expanded]).toEqual(["1", "1.1"]);

		await commands.press("ArrowRight");
		await expect.element(item_111).toHaveFocus();
		expect([...tree.expanded]).toEqual(["1", "1.1"]);

		await commands.press("ArrowLeft");
		await expect.element(item_11).toHaveFocus();
		expect([...tree.expanded]).toEqual(["1", "1.1"]);

		focus(item_112);
		await commands.press("ArrowRight");
		await expect.element(item_112).toHaveFocus();
		expect([...tree.expanded]).toEqual(["1", "1.1"]);

		await commands.press("ArrowLeft");
		await expect.element(item_11).toHaveFocus();
		expect([...tree.expanded]).toEqual(["1", "1.1"]);

		focus(item_113);
		await commands.press("ArrowRight");
		await expect.element(item_113).toHaveFocus();
		expect([...tree.expanded]).toEqual(["1", "1.1"]);

		await commands.press("ArrowLeft");
		await expect.element(item_11).toHaveFocus();
		expect([...tree.expanded]).toEqual(["1", "1.1"]);

		await commands.press("ArrowLeft");
		await expect.element(item_11).toHaveFocus();
		expect([...tree.expanded]).toEqual(["1"]);

		await commands.press("ArrowLeft");
		await expect.element(item_1).toHaveFocus();
		expect([...tree.expanded]).toEqual(["1"]);

		focus(item_12);
		await commands.press("ArrowRight");
		await expect.element(item_12).toHaveFocus();
		expect([...tree.expanded]).toEqual(["1", "1.2"]);

		await commands.press("ArrowRight");
		await expect.element(item_121).toHaveFocus();
		expect([...tree.expanded]).toEqual(["1", "1.2"]);

		await commands.press("ArrowRight");
		await expect.element(item_121).toHaveFocus();
		expect([...tree.expanded]).toEqual(["1", "1.2"]);

		await commands.press("ArrowLeft");
		await expect.element(item_12).toHaveFocus();
		expect([...tree.expanded]).toEqual(["1", "1.2"]);

		focus(item_122);
		await commands.press("ArrowRight");
		await expect.element(item_122).toHaveFocus();
		expect([...tree.expanded]).toEqual(["1", "1.2"]);

		await commands.press("ArrowLeft");
		await expect.element(item_12).toHaveFocus();
		expect([...tree.expanded]).toEqual(["1", "1.2"]);

		await commands.press("ArrowLeft");
		await expect.element(item_12).toHaveFocus();
		expect([...tree.expanded]).toEqual(["1"]);

		await commands.press("ArrowLeft");
		await expect.element(item_1).toHaveFocus();
		expect([...tree.expanded]).toEqual(["1"]);

		await commands.press("ArrowLeft");
		await expect.element(item_1).toHaveFocus();
		expect(tree.expanded).empty;

		await commands.press("ArrowLeft");
		await expect.element(item_1).toHaveFocus();
		expect(tree.expanded).empty;
	});

	test("ArrowDown/Up navigation", async () => {
		const tree = createTree({
			defaultExpanded: ["1", "1.1", "1.2", "2", "3"],
		});
		const screen = renderTree({
			props: { tree },
		});
		const item_1 = getTreeItem(screen, "Section 1");
		const item_11 = getTreeItem(screen, "Section 1.1");
		const item_111 = getTreeItem(screen, "Section 1.1.1");
		const item_112 = getTreeItem(screen, "Section 1.1.2");
		const item_113 = getTreeItem(screen, "Section 1.1.3");
		const item_12 = getTreeItem(screen, "Section 1.2");
		const item_121 = getTreeItem(screen, "Section 1.2.1");
		const item_122 = getTreeItem(screen, "Section 1.2.2");
		const item_2 = getTreeItem(screen, "Section 2");
		const item_21 = getTreeItem(screen, "Section 2.1");
		const item_22 = getTreeItem(screen, "Section 2.2");
		const item_3 = getTreeItem(screen, "Section 3");
		const item_31 = getTreeItem(screen, "Section 3.1");
		const item_32 = getTreeItem(screen, "Section 3.2");

		focus(item_1);
		await commands.press("ArrowDown");
		await expect.element(item_11).toHaveFocus();

		await commands.press("ArrowDown");
		await expect.element(item_111).toHaveFocus();

		await commands.press("ArrowDown");
		await expect.element(item_112).toHaveFocus();

		await commands.press("ArrowDown");
		await expect.element(item_113).toHaveFocus();

		await commands.press("ArrowDown");
		await expect.element(item_12).toHaveFocus();

		await commands.press("ArrowDown");
		await expect.element(item_121).toHaveFocus();

		await commands.press("ArrowDown");
		await expect.element(item_122).toHaveFocus();

		await commands.press("ArrowDown");
		await expect.element(item_2).toHaveFocus();

		await commands.press("ArrowDown");
		await expect.element(item_21).toHaveFocus();

		await commands.press("ArrowDown");
		await expect.element(item_22).toHaveFocus();

		await commands.press("ArrowDown");
		await expect.element(item_3).toHaveFocus();

		await commands.press("ArrowDown");
		await expect.element(item_31).toHaveFocus();

		await commands.press("ArrowDown");
		await expect.element(item_32).toHaveFocus();

		await commands.press("ArrowDown");
		await expect.element(item_32).toHaveFocus();

		await commands.press("ArrowUp");
		await expect.element(item_31).toHaveFocus();

		await commands.press("ArrowUp");
		await expect.element(item_3).toHaveFocus();

		await commands.press("ArrowUp");
		await expect.element(item_22).toHaveFocus();

		await commands.press("ArrowUp");
		await expect.element(item_21).toHaveFocus();

		await commands.press("ArrowUp");
		await expect.element(item_2).toHaveFocus();

		await commands.press("ArrowUp");
		await expect.element(item_122).toHaveFocus();

		await commands.press("ArrowUp");
		await expect.element(item_121).toHaveFocus();

		await commands.press("ArrowUp");
		await expect.element(item_12).toHaveFocus();

		await commands.press("ArrowUp");
		await expect.element(item_113).toHaveFocus();

		await commands.press("ArrowUp");
		await expect.element(item_112).toHaveFocus();

		await commands.press("ArrowUp");
		await expect.element(item_111).toHaveFocus();

		await commands.press("ArrowUp");
		await expect.element(item_11).toHaveFocus();

		await commands.press("ArrowUp");
		await expect.element(item_1).toHaveFocus();

		await commands.press("ArrowUp");
		await expect.element(item_1).toHaveFocus();
	});

	test("Shift+ArrowDown/Up navigates and selects", async () => {
		const tree = createTree({
			defaultExpanded: ["1"],
		});
		const screen = renderTree({
			props: { tree },
		});
		const item_1 = getTreeItem(screen, "Section 1");
		const item_11 = getTreeItem(screen, "Section 1.1");
		const item_12 = getTreeItem(screen, "Section 1.2");
		const item_2 = getTreeItem(screen, "Section 2");
		const item_3 = getTreeItem(screen, "Section 3");

		focus(item_1);
		await commands.press("Shift+ArrowDown");
		await expect.element(item_11).toHaveFocus();
		expect([...tree.selected]).toEqual(["1", "1.1"]);

		await commands.press("Shift+ArrowDown");
		await expect.element(item_12).toHaveFocus();
		expect([...tree.selected]).toEqual(["1", "1.1", "1.2"]);

		await commands.press("Shift+ArrowDown");
		await expect.element(item_2).toHaveFocus();
		expect([...tree.selected]).toEqual(["1", "1.1", "1.2", "2"]);

		await commands.press("Shift+ArrowDown");
		await expect.element(item_3).toHaveFocus();
		expect([...tree.selected]).toEqual(["1", "1.1", "1.2", "2", "3"]);

		tree.selected.clear();
		await commands.press("Shift+ArrowDown");
		await expect.element(item_3).toHaveFocus();
		expect(tree.selected).empty;

		await commands.press("Shift+ArrowUp");
		await expect.element(item_2).toHaveFocus();
		expect([...tree.selected]).toEqual(["3", "2"]);

		await commands.press("Shift+ArrowUp");
		await expect.element(item_12).toHaveFocus();
		expect([...tree.selected]).toEqual(["3", "2", "1.2"]);

		await commands.press("Shift+ArrowUp");
		await expect.element(item_11).toHaveFocus();
		expect([...tree.selected]).toEqual(["3", "2", "1.2", "1.1"]);

		await commands.press("Shift+ArrowUp");
		await expect.element(item_1).toHaveFocus();
		expect([...tree.selected]).toEqual(["3", "2", "1.2", "1.1", "1"]);

		tree.selected.clear();
		await commands.press("Shift+ArrowUp");
		await expect.element(item_1).toHaveFocus();
		expect(tree.selected).empty;
	});

	test("PageDown/Up navigation", async () => {
		const tree = createTree({
			defaultExpanded: ["1"],
		});
		const screen = renderTree({
			props: {
				tree,
				style: "height: 175px;",
				getItemProps() {
					return {
						style: "height: 50px;",
					};
				},
			},
		});
		const item_1 = getTreeItem(screen, "Section 1");
		const item_11 = getTreeItem(screen, "Section 1.1");
		const item_2 = getTreeItem(screen, "Section 2");
		const item_3 = getTreeItem(screen, "Section 3");

		// The tree is 175px tall and each item is 50px tall.
		// PageDown/Up should scroll a maximum of 3 items at a time.
		focus(item_1);
		await commands.press("PageDown");
		await expect.element(item_2).toHaveFocus();

		await commands.press("PageDown");
		await expect.element(item_3).toHaveFocus();

		await commands.press("PageDown");
		await expect.element(item_3).toHaveFocus();

		await commands.press("PageUp");
		await expect.element(item_11).toHaveFocus();

		await commands.press("PageUp");
		await expect.element(item_1).toHaveFocus();

		await commands.press("PageUp");
		await expect.element(item_1).toHaveFocus();
	});

	test("PageDown/Up navigation does not overscroll the viewport", async () => {
		const tree = createTree({
			defaultExpanded: ["1"],
		});
		const screen = renderTree({
			props: {
				tree,
				style: "height: 175px;",
				getItemProps() {
					return {
						style: "height: 50px;",
					};
				},
			},
		});
		const item_1 = getTreeItem(screen, "Section 1");
		const item_12 = getTreeItem(screen, "Section 1.2");
		const item_3 = getTreeItem(screen, "Section 3");

		// The viewport is 100px tall and each item is 50px tall.
		// PageDown/Up should scroll a maximum of 2 items at a time.
		await page.viewport(1280, 100);

		// Restore the default viewport size after the test is done.
		onTestFinished(() => page.viewport(896, 414));

		focus(item_1);
		await commands.press("PageDown");
		await expect.element(item_12).toHaveFocus();

		await commands.press("PageDown");
		await expect.element(item_3).toHaveFocus();

		await commands.press("PageDown");
		await expect.element(item_3).toHaveFocus();

		await commands.press("PageUp");
		await expect.element(item_12).toHaveFocus();

		await commands.press("PageUp");
		await expect.element(item_1).toHaveFocus();

		await commands.press("PageUp");
		await expect.element(item_1).toHaveFocus();
	});

	test("Shift+PageUp/Down navigates and selects", async () => {
		const tree = createTree({
			defaultExpanded: ["1"],
		});
		const screen = renderTree({
			props: {
				tree,
				style: "height: 175px;",
				getItemProps() {
					return {
						style: "height: 50px;",
					};
				},
			},
		});
		const item_1 = getTreeItem(screen, "Section 1");
		const item_11 = getTreeItem(screen, "Section 1.1");
		const item_2 = getTreeItem(screen, "Section 2");
		const item_3 = getTreeItem(screen, "Section 3");

		// The tree is 175px tall and each item is 50px tall.
		// PageDown/Up should scroll a maximum of 3 items at a time.
		focus(item_1);
		await commands.press("Shift+PageDown");
		await expect.element(item_2).toHaveFocus();
		expect([...tree.selected]).toEqual(["1", "1.1", "1.2", "2"]);

		await commands.press("Shift+PageDown");
		await expect.element(item_3).toHaveFocus();
		expect([...tree.selected]).toEqual(["1", "1.1", "1.2", "2", "3"]);

		tree.selected.clear();
		await commands.press("Shift+PageDown");
		await expect.element(item_3).toHaveFocus();
		expect(tree.selected).empty;

		await commands.press("Shift+PageUp");
		await expect.element(item_11).toHaveFocus();
		expect([...tree.selected]).toEqual(["3", "2", "1.2", "1.1"]);

		await commands.press("Shift+PageUp");
		await expect.element(item_1).toHaveFocus();
		expect([...tree.selected]).toEqual(["3", "2", "1.2", "1.1", "1"]);

		tree.selected.clear();
		await commands.press("Shift+PageUp");
		await expect.element(item_1).toHaveFocus();
		expect(tree.selected).empty;
	});

	test("Home navigates to the first item", async () => {
		const tree = createTree();
		const screen = renderTree({
			props: { tree },
		});
		const item_1 = getTreeItem(screen, "Section 1");
		const item_3 = getTreeItem(screen, "Section 3");

		focus(item_3);
		await commands.press("Home");
		await expect.element(item_1).toHaveFocus();

		await commands.press("Home");
		await expect.element(item_1).toHaveFocus();
	});

	test("Control/Command+Shift+Home navigates and selects", async () => {
		const tree = createTree({
			defaultExpanded: ["1"],
		});
		const screen = renderTree({
			props: { tree },
		});
		const item_1 = getTreeItem(screen, "Section 1");
		const item_2 = getTreeItem(screen, "Section 2");

		focus(item_2);
		await commands.press("ControlOrMeta+Shift+Home");
		await expect.element(item_1).toHaveFocus();
		expect([...tree.selected]).toEqual(["2", "1.2", "1.1", "1"]);

		tree.selected.clear();
		await commands.press("ControlOrMeta+Shift+Home");
		await expect.element(item_1).toHaveFocus();
		expect(tree.selected).empty;
	});

	test("End navigates to the last item", async () => {
		const tree = createTree();
		const screen = renderTree({
			props: { tree },
		});
		const item_1 = getTreeItem(screen, "Section 1");
		const item_3 = getTreeItem(screen, "Section 3");
		const item_32 = getTreeItem(screen, "Section 3.2");

		focus(item_1);
		await commands.press("End");
		await expect.element(item_3).toHaveFocus();

		tree.expanded.add("3");
		await commands.press("End");
		await expect.element(item_32).toHaveFocus();

		await commands.press("End");
		await expect.element(item_32).toHaveFocus();
	});

	test("Control/Command+Shift+End navigates and selects", async () => {
		const tree = createTree();
		const screen = renderTree({
			props: { tree },
		});
		const item_1 = getTreeItem(screen, "Section 1");
		const item_3 = getTreeItem(screen, "Section 3");
		const item_32 = getTreeItem(screen, "Section 3.2");

		focus(item_1);
		await commands.press("ControlOrMeta+Shift+End");
		await expect.element(item_3).toHaveFocus();
		expect([...tree.selected]).toEqual(["1", "2", "3"]);

		tree.expanded.add("3");
		await commands.press("ControlOrMeta+Shift+End");
		await expect.element(item_32).toHaveFocus();
		expect([...tree.selected]).toEqual(["1", "2", "3", "3.1", "3.2"]);

		tree.selected.clear();
		await commands.press("ControlOrMeta+Shift+End");
		await expect.element(item_32).toHaveFocus();
		expect(tree.selected).empty;
	});

	test("F2 starts editing", async () => {
		const tree = createTree();
		const onRenameItem = vi.fn();
		const onRenameError = vi.fn();
		const screen = renderTree({
			props: {
				tree,
				onRenameItem,
				onRenameError,
				getItemProps() {
					return {
						editable: true,
					};
				},
			},
		});
		const item = screen.getByTestId("1");
		const input = screen.getByRole("textbox");

		focus(item);
		await commands.press("F2");
		await expect.element(input).toBeVisible();
		await expect.element(input).toHaveFocus();
		expect(onRenameItem).not.toHaveBeenCalled();
		expect(onRenameError).not.toHaveBeenCalled();

		await commands.press("Backspace");
		await expect.element(input).toHaveValue("");
		expect(onRenameItem).not.toHaveBeenCalled();
		expect(onRenameError).not.toHaveBeenCalled();

		await input.fill("Section One");
		await expect.element(input).toHaveValue("Section One");
		await commands.press("Enter");
		await expect.element(item).toHaveFocus();
		await expect.element(item).toHaveTextContent("Section One");
		await expect.element(input).not.toBeInTheDocument();
		expect(onRenameItem).toHaveBeenCalledOnce();
		expect(onRenameItem).toHaveBeenCalledWith(tree.nodes[0]);
		expect(onRenameError).not.toHaveBeenCalled();
	});

	test("Non-editable items cannot be edited", async () => {
		const tree = createTree();
		const onRenameItem = vi.fn();
		const onRenameError = vi.fn();
		const screen = renderTree({
			props: {
				tree,
				onRenameItem,
				onRenameError,
			},
		});
		const item = screen.getByTestId("1");
		const input = screen.getByRole("textbox");

		focus(item);
		await commands.press("F2");
		await expect.element(item).toHaveFocus();
		await expect.element(input).not.toBeInTheDocument();
		expect(onRenameItem).not.toHaveBeenCalled();
		expect(onRenameError).not.toHaveBeenCalled();
	});

	test("Escape discards edits", async () => {
		const tree = createTree();
		const onRenameItem = vi.fn();
		const onRenameError = vi.fn();
		const screen = renderTree({
			props: {
				tree,
				onRenameItem,
				onRenameError,
				getItemProps() {
					return {
						editable: true,
					};
				},
			},
		});
		const item = screen.getByTestId("1");
		const input = screen.getByRole("textbox");

		focus(item);
		await commands.press("F2");
		await input.fill("Section One");
		await commands.press("Escape");
		await expect.element(item).toHaveFocus();
		await expect.element(item).toHaveTextContent("Section 1");
		await expect.element(input).not.toBeInTheDocument();
		expect(onRenameItem).not.toHaveBeenCalled();
		expect(onRenameError).not.toHaveBeenCalled();
	});

	test("Blurring the input discards edits", async () => {
		const tree = createTree();
		const onRenameItem = vi.fn();
		const onRenameError = vi.fn();
		const screen = renderTree({
			props: {
				tree,
				onRenameItem,
				onRenameError,
				getItemProps() {
					return {
						editable: true,
					};
				},
			},
		});
		const item = screen.getByTestId("1");
		const input = screen.getByRole("textbox");

		focus(item);
		await commands.press("F2");
		await input.fill("Section One");
		blur(input);
		await expect.element(item).not.toHaveFocus();
		await expect.element(item).toHaveTextContent("Section 1");
		await expect.element(input).not.toBeInTheDocument();
		expect(onRenameItem).not.toHaveBeenCalled();
		expect(onRenameError).not.toHaveBeenCalled();
	});

	test("Items in the same folder cannot have the same name", async () => {
		const tree = createTree();
		const onRenameItem = vi.fn();
		const onRenameError = vi.fn();
		const screen = renderTree({
			props: {
				tree,
				onRenameItem,
				onRenameError,
				getItemProps() {
					return {
						editable: true,
					};
				},
			},
		});
		const item = screen.getByTestId("1");
		const input = screen.getByRole("textbox");

		focus(item);
		await commands.press("F2");
		await input.fill("Section 2");
		await commands.press("Enter");
		await expect.element(input).toHaveFocus();
		expect(onRenameItem).not.toHaveBeenCalled();
		expect(onRenameError).toHaveBeenCalledOnce();
		expect(onRenameError).toHaveBeenCalledWith(tree.nodes[0], {
			type: "duplicate",
			name: "Section 2",
		});
	});

	test("Items cannot have empty names", async () => {
		const tree = createTree();
		const onRenameItem = vi.fn();
		const onRenameError = vi.fn();
		const screen = renderTree({
			props: {
				tree,
				onRenameItem,
				onRenameError,
				getItemProps() {
					return {
						editable: true,
					};
				},
			},
		});
		const item = screen.getByTestId("1");
		const input = screen.getByRole("textbox");

		focus(item);
		await commands.press("F2");
		await commands.press("Backspace");
		await commands.press("Enter");
		await expect.element(input).toHaveFocus();
		expect(onRenameItem).not.toHaveBeenCalled();
		expect(onRenameError).toHaveBeenCalledOnce();
		expect(onRenameError).toHaveBeenCalledWith(tree.nodes[0], {
			type: "empty",
		});
	});

	test("* expands all sibling folders", async () => {
		const tree = createTree();
		const screen = renderTree({
			props: { tree },
		});
		const item_1 = getTreeItem(screen, "Section 1");
		const item_11 = getTreeItem(screen, "Section 1.1");
		const item_111 = getTreeItem(screen, "Section 1.1.1");

		focus(item_1);
		await commands.press("*");
		expect([...tree.expanded]).toEqual(["1", "2", "3"]);

		focus(item_11);
		await commands.press("*");
		expect([...tree.expanded]).toEqual(["1", "2", "3", "1.1", "1.2"]);

		focus(item_111);
		await commands.press("*");
		expect([...tree.expanded]).toEqual(["1", "2", "3", "1.1", "1.2"]);
	});

	test("Delete removes all selected items", async () => {
		const tree = createTree({
			defaultSelected: ["1", "1.2", "1.2.2"],
			defaultExpanded: ["1", "1.1", "1.2", "2", "3"],
		});
		const [node_1, node_2, node_3] = tree.nodes;
		const onDeleteItems = vi.fn();
		const screen = renderTree({
			props: {
				tree,
				onDeleteItems,
			},
		});
		const item_1 = getTreeItem(screen, "Section 1");
		const item_11 = getTreeItem(screen, "Section 1.1");
		const item_111 = getTreeItem(screen, "Section 1.1.1");
		const item_112 = getTreeItem(screen, "Section 1.1.2");
		const item_113 = getTreeItem(screen, "Section 1.1.3");
		const item_12 = getTreeItem(screen, "Section 1.2");
		const item_121 = getTreeItem(screen, "Section 1.2.1");
		const item_122 = getTreeItem(screen, "Section 1.2.2");
		const item_2 = getTreeItem(screen, "Section 2");
		const item_3 = getTreeItem(screen, "Section 3");

		focus(item_11);
		await commands.press("Delete");
		await expect.element(item_1).not.toBeInTheDocument();
		await expect.element(item_11).not.toBeInTheDocument();
		await expect.element(item_111).not.toBeInTheDocument();
		await expect.element(item_112).not.toBeInTheDocument();
		await expect.element(item_113).not.toBeInTheDocument();
		await expect.element(item_12).not.toBeInTheDocument();
		await expect.element(item_121).not.toBeInTheDocument();
		await expect.element(item_122).not.toBeInTheDocument();
		await expect.element(item_2).toHaveFocus();
		await expect.element(item_2).toBeVisible();
		await expect.element(item_3).toBeVisible();
		expect(tree.nodes).toEqual([node_2, node_3]);
		expect(tree.selected).empty;
		expect([...tree.expanded]).toEqual(["2", "3"]);
		expect(onDeleteItems).toHaveBeenCalledOnce();
		expect(onDeleteItems).toHaveBeenCalledWith([node_1]);
	});

	test("Delete does not remove focus from the current item if it is not selected", async () => {
		const tree = createTree({
			defaultSelected: ["1"],
		});
		const screen = renderTree({
			props: { tree },
		});
		const item_2 = getTreeItem(screen, "Section 2");

		focus(item_2);
		await commands.press("Delete");
		await expect.element(item_2).toHaveFocus();
	});

	test("Delete moves focus to the first item before if all items after are selected", async () => {
		const tree = createTree({
			defaultSelected: ["1.2", "2", "2.1", "2.2", "3", "3.1", "3.2"],
			defaultExpanded: ["1", "2", "3"],
		});
		const screen = renderTree({
			props: { tree },
		});
		const item_11 = getTreeItem(screen, "Section 1.1");
		const item_2 = getTreeItem(screen, "Section 2");

		focus(item_2);
		await commands.press("Delete");
		await expect.element(item_11).toHaveFocus();
	});

	test("Click clears selection and selects the item", async () => {
		const tree = createTree();
		const screen = renderTree({
			props: { tree },
		});
		const item_1 = getTreeItem(screen, "Section 1");
		const item_2 = getTreeItem(screen, "Section 2");
		const item_3 = getTreeItem(screen, "Section 3");

		await item_1.click();
		await expect.element(item_1).toHaveFocus();
		expect([...tree.selected]).toEqual(["1"]);

		await item_2.click();
		await expect.element(item_2).toHaveFocus();
		expect([...tree.selected]).toEqual(["2"]);

		await item_3.click();
		await expect.element(item_3).toHaveFocus();
		expect([...tree.selected]).toEqual(["3"]);
	});

	test("Control/Command+Click toggles selection", async () => {
		const tree = createTree();
		const screen = renderTree({
			props: { tree },
		});
		const item_1 = getTreeItem(screen, "Section 1");
		const item_2 = getTreeItem(screen, "Section 2");
		const item_3 = getTreeItem(screen, "Section 3");

		await item_1.click({ modifiers: ["ControlOrMeta"] });
		await expect.element(item_1).toHaveFocus();
		expect([...tree.selected]).toEqual(["1"]);

		await item_2.click({ modifiers: ["ControlOrMeta"] });
		await expect.element(item_2).toHaveFocus();
		expect([...tree.selected]).toEqual(["1", "2"]);

		await item_3.click({ modifiers: ["ControlOrMeta"] });
		await expect.element(item_3).toHaveFocus();
		expect([...tree.selected]).toEqual(["1", "2", "3"]);

		await item_1.click({ modifiers: ["ControlOrMeta"] });
		await expect.element(item_1).toHaveFocus();
		expect([...tree.selected]).toEqual(["2", "3"]);

		await item_2.click({ modifiers: ["ControlOrMeta"] });
		await expect.element(item_2).toHaveFocus();
		expect([...tree.selected]).toEqual(["3"]);

		await item_3.click({ modifiers: ["ControlOrMeta"] });
		await expect.element(item_3).toHaveFocus();
		expect(tree.selected).empty;
	});

	test("Shift+Click selects multiple items", async () => {
		const tree = createTree({
			defaultExpanded: ["1", "2", "3"],
		});
		const screen = renderTree({
			props: { tree },
		});
		const item_2 = getTreeItem(screen, "Section 2");
		const item_3 = getTreeItem(screen, "Section 3");

		tree.selected.add("1").add("2");
		await item_3.click({ modifiers: ["Shift"] });
		await expect.element(item_3).toHaveFocus();
		expect([...tree.selected]).toEqual(["1", "2", "2.1", "2.2", "3"]);

		tree.selected.clear();
		tree.selected.add("1").add("3");
		await item_2.click({ modifiers: ["Shift"] });
		await expect.element(item_2).toHaveFocus();
		expect([...tree.selected]).toEqual(["1", "3", "2.2", "2.1", "2"]);

		tree.selected.clear();
		await item_2.click({ modifiers: ["Shift"] });
		await expect.element(item_2).toHaveFocus();
		expect([...tree.selected]).toEqual(["1", "1.1", "1.2", "2"]);

		await item_2.click({ modifiers: ["Shift"] });
		await expect.element(item_2).toHaveFocus();
		expect([...tree.selected]).toEqual(["1", "1.1", "1.2", "2"]);
	});

	// TODO: test dnd
});

function getTreeItem(screen: RenderResult<SvelteComponent>, name: string) {
	return screen.getByRole("treeitem", {
		name,
		exact: true,
	});
}

function focus(target: Locator) {
	const element = target.element();
	if (element instanceof HTMLElement) {
		element.focus();
	} else {
		throw new Error("Element is not an HTMLElement");
	}
}

function blur(target: Locator) {
	const element = target.element();
	if (element instanceof HTMLElement) {
		element.blur();
	} else {
		throw new Error("Element is not an HTMLElement");
	}
}
</script>
