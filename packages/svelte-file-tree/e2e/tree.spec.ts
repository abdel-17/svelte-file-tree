import { expect, type Locator, test } from "@playwright/test";

const ROUTE = "/e2e/tree";

// Section 1
// -- Section 1.1
// ---- Section 1.1.1
// ---- Section 1.1.2
// ---- Section 1.1.3
// -- Section 1.2
// ---- Section 1.2.1
// ---- Section 1.2.2
// Section 2 (editable)
// -- Section 2.1
// -- Section 2.2
// Section 3
// -- Section 3.1
// -- Section 3.2

test.describe("Tree", () => {
	test("Tree is rendered correctly", async ({ page }) => {
		await page.goto(ROUTE);
		const tree = page.getByRole("tree");
		const items = tree.getByRole("treeitem");
		await expect(tree).toBeVisible();
		await expect(items).toHaveText(["Section 1", "Section 2", "Section 3"]);
	});

	test("Tree roving tabindex", async ({ page }) => {
		await page.goto(ROUTE);
		const tree = page.getByRole("tree");
		const item_1 = getTreeItem(tree, "1");
		const item_2 = getTreeItem(tree, "2");
		const item_3 = getTreeItem(tree, "3");

		await expect(item_1).toHaveAttribute("tabindex", "0");
		await expect(item_2).toHaveAttribute("tabindex", "-1");
		await expect(item_3).toHaveAttribute("tabindex", "-1");

		await item_2.focus();
		await expect(item_1).toHaveAttribute("tabindex", "-1");
		await expect(item_2).toHaveAttribute("tabindex", "0");
		await expect(item_3).toHaveAttribute("tabindex", "-1");

		await item_3.focus();
		await expect(item_1).toHaveAttribute("tabindex", "-1");
		await expect(item_2).toHaveAttribute("tabindex", "-1");
		await expect(item_3).toHaveAttribute("tabindex", "0");
	});

	test("ArrowLeft/Right navigation", async ({ page }) => {
		await page.goto(ROUTE);
		const tree = page.getByRole("tree");
		const items = page.getByRole("treeitem");
		const item_1 = getTreeItem(tree, "1");
		const item_11 = getTreeItem(tree, "1.1");
		const item_111 = getTreeItem(tree, "1.1.1");
		const item_112 = getTreeItem(tree, "1.1.2");
		const item_113 = getTreeItem(tree, "1.1.3");
		const item_12 = getTreeItem(tree, "1.2");
		const item_121 = getTreeItem(tree, "1.2.1");
		const item_122 = getTreeItem(tree, "1.2.2");
		const item_2 = getTreeItem(tree, "2");
		const item_3 = getTreeItem(tree, "3");

		await expectCollapsed(item_1, item_2, item_3);

		await item_1.press("ArrowRight");
		await expect(item_1).toBeFocused();
		await expect(items).toHaveText([
			"Section 1",
			"Section 1.1",
			"Section 1.2",
			"Section 2",
			"Section 3",
		]);
		await expectExpanded(item_1);
		await expectCollapsed(item_11, item_12, item_2, item_3);

		await item_1.press("ArrowRight");
		await expect(item_11).toBeFocused();
		await expect(items).toHaveText([
			"Section 1",
			"Section 1.1",
			"Section 1.2",
			"Section 2",
			"Section 3",
		]);
		await expectExpanded(item_1);
		await expectCollapsed(item_11, item_12, item_2, item_3);

		await item_11.press("ArrowRight");
		await expect(item_11).toBeFocused();
		await expect(items).toHaveText([
			"Section 1",
			"Section 1.1",
			"Section 1.1.1",
			"Section 1.1.2",
			"Section 1.1.3",
			"Section 1.2",
			"Section 2",
			"Section 3",
		]);
		await expectExpanded(item_1, item_11);
		await expectNonExpandable(item_111, item_112, item_113);
		await expectCollapsed(item_12, item_2, item_3);

		await item_11.press("ArrowRight");
		await expect(item_111).toBeFocused();
		await expect(items).toHaveText([
			"Section 1",
			"Section 1.1",
			"Section 1.1.1",
			"Section 1.1.2",
			"Section 1.1.3",
			"Section 1.2",
			"Section 2",
			"Section 3",
		]);
		await expectExpanded(item_1, item_11);
		await expectNonExpandable(item_111, item_112, item_113);
		await expectCollapsed(item_12, item_2, item_3);

		await item_111.press("ArrowRight");
		await expect(item_111).toBeFocused();
		await expect(items).toHaveText([
			"Section 1",
			"Section 1.1",
			"Section 1.1.1",
			"Section 1.1.2",
			"Section 1.1.3",
			"Section 1.2",
			"Section 2",
			"Section 3",
		]);
		await expectExpanded(item_1, item_11);
		await expectNonExpandable(item_111, item_112, item_113);
		await expectCollapsed(item_12, item_2, item_3);

		await item_111.press("ArrowLeft");
		await expect(item_11).toBeFocused();
		await expect(items).toHaveText([
			"Section 1",
			"Section 1.1",
			"Section 1.1.1",
			"Section 1.1.2",
			"Section 1.1.3",
			"Section 1.2",
			"Section 2",
			"Section 3",
		]);
		await expectExpanded(item_1, item_11);
		await expectNonExpandable(item_111, item_112, item_113);
		await expectCollapsed(item_12, item_2, item_3);

		await item_112.press("ArrowLeft");
		await expect(item_11).toBeFocused();
		await expect(items).toHaveText([
			"Section 1",
			"Section 1.1",
			"Section 1.1.1",
			"Section 1.1.2",
			"Section 1.1.3",
			"Section 1.2",
			"Section 2",
			"Section 3",
		]);
		await expectExpanded(item_1, item_11);
		await expectNonExpandable(item_111, item_112, item_113);
		await expectCollapsed(item_12, item_2, item_3);

		await item_113.press("ArrowLeft");
		await expect(item_11).toBeFocused();
		await expect(items).toHaveText([
			"Section 1",
			"Section 1.1",
			"Section 1.1.1",
			"Section 1.1.2",
			"Section 1.1.3",
			"Section 1.2",
			"Section 2",
			"Section 3",
		]);
		await expectExpanded(item_1, item_11);
		await expectNonExpandable(item_111, item_112, item_113);
		await expectCollapsed(item_12, item_2, item_3);

		await item_11.press("ArrowLeft");
		await expect(item_11).toBeFocused();
		await expect(items).toHaveText([
			"Section 1",
			"Section 1.1",
			"Section 1.2",
			"Section 2",
			"Section 3",
		]);
		await expectExpanded(item_1);
		await expectCollapsed(item_11, item_12, item_2, item_3);

		await item_12.press("ArrowRight");
		await expect(item_12).toBeFocused();
		await expect(items).toHaveText([
			"Section 1",
			"Section 1.1",
			"Section 1.2",
			"Section 1.2.1",
			"Section 1.2.2",
			"Section 2",
			"Section 3",
		]);
		await expectExpanded(item_1, item_12);
		await expectNonExpandable(item_121, item_122);
		await expectCollapsed(item_11, item_2, item_3);

		await item_12.press("ArrowRight");
		await expect(item_121).toBeFocused();
		await expect(items).toHaveText([
			"Section 1",
			"Section 1.1",
			"Section 1.2",
			"Section 1.2.1",
			"Section 1.2.2",
			"Section 2",
			"Section 3",
		]);
		await expectExpanded(item_1, item_12);
		await expectNonExpandable(item_121, item_122);
		await expectCollapsed(item_11, item_2, item_3);

		await item_121.press("ArrowLeft");
		await expect(item_12).toBeFocused();
		await expect(items).toHaveText([
			"Section 1",
			"Section 1.1",
			"Section 1.2",
			"Section 1.2.1",
			"Section 1.2.2",
			"Section 2",
			"Section 3",
		]);
		await expectExpanded(item_1, item_12);
		await expectNonExpandable(item_121, item_122);
		await expectCollapsed(item_11, item_2, item_3);

		await item_122.press("ArrowLeft");
		await expect(item_12).toBeFocused();
		await expect(items).toHaveText([
			"Section 1",
			"Section 1.1",
			"Section 1.2",
			"Section 1.2.1",
			"Section 1.2.2",
			"Section 2",
			"Section 3",
		]);
		await expectExpanded(item_1, item_12);
		await expectNonExpandable(item_121, item_122);
		await expectCollapsed(item_11, item_2, item_3);

		await item_12.press("ArrowLeft");
		await expect(item_12).toBeFocused();
		await expect(items).toHaveText([
			"Section 1",
			"Section 1.1",
			"Section 1.2",
			"Section 2",
			"Section 3",
		]);
		await expectExpanded(item_1);
		await expectCollapsed(item_11, item_12, item_2, item_3);

		await item_12.press("ArrowLeft");
		await expect(item_1).toBeFocused();
		await expect(items).toHaveText([
			"Section 1",
			"Section 1.1",
			"Section 1.2",
			"Section 2",
			"Section 3",
		]);
		await expectExpanded(item_1);
		await expectCollapsed(item_11, item_12, item_2, item_3);

		await item_1.press("ArrowLeft");
		await expect(item_1).toBeFocused();
		await expect(items).toHaveText(["Section 1", "Section 2", "Section 3"]);
		await expectCollapsed(item_1, item_2, item_3);

		await item_1.press("ArrowLeft");
		await expect(item_1).toBeFocused();
		await expect(items).toHaveText(["Section 1", "Section 2", "Section 3"]);
		await expectCollapsed(item_1, item_2, item_3);
	});

	test("Space toggles selection", async ({ page }) => {
		await page.goto(ROUTE);
		const tree = page.getByRole("tree");
		const item_1 = getTreeItem(tree, "1");
		const item_2 = getTreeItem(tree, "2");
		const item_3 = getTreeItem(tree, "3");

		await expectUnselected(item_1, item_2, item_3);

		await item_1.press("Space");
		await expectSelected(item_1);
		await expectUnselected(item_2, item_3);

		await item_2.press("Space");
		await expectSelected(item_1, item_2);
		await expectUnselected(item_3);

		await item_3.press("Space");
		await expectSelected(item_1, item_2, item_3);

		await item_3.press("Space");
		await expectSelected(item_1, item_2);
		await expectUnselected(item_3);

		await item_2.press("Space");
		await expectSelected(item_1);
		await expectUnselected(item_2, item_3);

		await item_1.press("Space");
		await expectUnselected(item_1, item_2, item_3);
	});

	test("Shift+Space selects multiple items", async ({ page }) => {
		await page.goto(ROUTE);
		const tree = page.getByRole("tree");
		const item_1 = getTreeItem(tree, "1");
		const item_11 = getTreeItem(tree, "1.1");
		const item_12 = getTreeItem(tree, "1.2");
		const item_2 = getTreeItem(tree, "2");
		const item_21 = getTreeItem(tree, "2.1");
		const item_22 = getTreeItem(tree, "2.2");
		const item_3 = getTreeItem(tree, "3");

		await item_1.press("ArrowRight");
		await item_2.press("ArrowRight");

		await item_2.press("Space");
		await item_3.press("Shift+Space");
		await expect(item_3).toBeFocused();
		await expectSelected(item_2, item_21, item_22, item_3);
		await expectUnselected(item_1, item_11, item_12);

		await item_2.press("Escape");
		await item_2.press("Shift+Space");
		await expectSelected(item_1, item_11, item_12, item_2);
		await expectUnselected(item_21, item_22, item_3);
	});

	test("Ctrl/Cmd+a selects all and Esc unselects all", async ({ page }) => {
		await page.goto(ROUTE);
		const tree = page.getByRole("tree");
		const item_1 = getTreeItem(tree, "1");
		const item_11 = getTreeItem(tree, "1.1");
		const item_12 = getTreeItem(tree, "1.2");
		const item_2 = getTreeItem(tree, "2");
		const item_3 = getTreeItem(tree, "3");

		await item_2.press("ControlOrMeta+a");
		await expectSelected(item_1, item_2, item_3);

		await item_2.press("Escape");
		await expectUnselected(item_1, item_2, item_3);

		await item_1.press("ArrowRight");
		await item_2.press("ControlOrMeta+a");
		await expectSelected(item_1, item_11, item_12, item_2, item_3);

		await item_2.press("Escape");
		await expectUnselected(item_1, item_11, item_12, item_2, item_3);
	});

	test("Tree aria attributes", async ({ page }) => {
		await page.goto(ROUTE);
		const tree = page.getByRole("tree");
		const item_1 = getTreeItem(tree, "1");
		const item_11 = getTreeItem(tree, "1.1");
		const item_111 = getTreeItem(tree, "1.1.1");
		const item_112 = getTreeItem(tree, "1.1.2");
		const item_113 = getTreeItem(tree, "1.1.3");
		const item_12 = getTreeItem(tree, "1.2");
		const item_121 = getTreeItem(tree, "1.2.1");
		const item_122 = getTreeItem(tree, "1.2.2");
		const item_2 = getTreeItem(tree, "2");
		const item_21 = getTreeItem(tree, "2.1");
		const item_22 = getTreeItem(tree, "2.2");
		const item_3 = getTreeItem(tree, "3");
		const item_31 = getTreeItem(tree, "3.1");
		const item_32 = getTreeItem(tree, "3.2");

		await expect(tree).toHaveAttribute("aria-multiselectable", "true");

		await expect(item_1).toHaveAttribute("aria-level", "1");
		await expect(item_1).toHaveAttribute("aria-posinset", "1");
		await expect(item_1).toHaveAttribute("aria-setsize", "3");

		await item_1.press("ArrowRight");

		await expect(item_11).toHaveAttribute("aria-level", "2");
		await expect(item_11).toHaveAttribute("aria-posinset", "1");
		await expect(item_11).toHaveAttribute("aria-setsize", "2");

		await item_11.press("ArrowRight");

		await expect(item_111).toHaveAttribute("aria-level", "3");
		await expect(item_111).toHaveAttribute("aria-posinset", "1");
		await expect(item_111).toHaveAttribute("aria-setsize", "3");

		await expect(item_112).toHaveAttribute("aria-level", "3");
		await expect(item_112).toHaveAttribute("aria-posinset", "2");
		await expect(item_112).toHaveAttribute("aria-setsize", "3");

		await expect(item_113).toHaveAttribute("aria-level", "3");
		await expect(item_113).toHaveAttribute("aria-posinset", "3");
		await expect(item_113).toHaveAttribute("aria-setsize", "3");

		await expect(item_12).toHaveAttribute("aria-level", "2");
		await expect(item_12).toHaveAttribute("aria-posinset", "2");
		await expect(item_12).toHaveAttribute("aria-setsize", "2");

		await item_12.press("ArrowRight");

		await expect(item_121).toHaveAttribute("aria-level", "3");
		await expect(item_121).toHaveAttribute("aria-posinset", "1");
		await expect(item_121).toHaveAttribute("aria-setsize", "2");

		await expect(item_122).toHaveAttribute("aria-level", "3");
		await expect(item_122).toHaveAttribute("aria-posinset", "2");
		await expect(item_122).toHaveAttribute("aria-setsize", "2");

		await expect(item_2).toHaveAttribute("aria-level", "1");
		await expect(item_2).toHaveAttribute("aria-posinset", "2");
		await expect(item_2).toHaveAttribute("aria-setsize", "3");

		await item_2.press("ArrowRight");

		await expect(item_21).toHaveAttribute("aria-level", "2");
		await expect(item_21).toHaveAttribute("aria-posinset", "1");
		await expect(item_21).toHaveAttribute("aria-setsize", "2");

		await expect(item_22).toHaveAttribute("aria-level", "2");
		await expect(item_22).toHaveAttribute("aria-posinset", "2");
		await expect(item_22).toHaveAttribute("aria-setsize", "2");

		await expect(item_3).toHaveAttribute("aria-level", "1");
		await expect(item_3).toHaveAttribute("aria-posinset", "3");
		await expect(item_3).toHaveAttribute("aria-setsize", "3");

		await item_3.press("ArrowRight");

		await expect(item_31).toHaveAttribute("aria-level", "2");
		await expect(item_31).toHaveAttribute("aria-posinset", "1");
		await expect(item_31).toHaveAttribute("aria-setsize", "2");

		await expect(item_32).toHaveAttribute("aria-level", "2");
		await expect(item_32).toHaveAttribute("aria-posinset", "2");
		await expect(item_32).toHaveAttribute("aria-setsize", "2");
	});

	test("ArrowDown/Up navigation", async ({ page }) => {
		await page.goto(ROUTE);
		const tree = page.getByRole("tree");
		const item_1 = getTreeItem(tree, "1");
		const item_11 = getTreeItem(tree, "1.1");
		const item_111 = getTreeItem(tree, "1.1.1");
		const item_112 = getTreeItem(tree, "1.1.2");
		const item_113 = getTreeItem(tree, "1.1.3");
		const item_12 = getTreeItem(tree, "1.2");
		const item_121 = getTreeItem(tree, "1.2.1");
		const item_122 = getTreeItem(tree, "1.2.2");
		const item_2 = getTreeItem(tree, "2");
		const item_21 = getTreeItem(tree, "2.1");
		const item_22 = getTreeItem(tree, "2.2");
		const item_3 = getTreeItem(tree, "3");
		const item_31 = getTreeItem(tree, "3.1");
		const item_32 = getTreeItem(tree, "3.2");

		await item_1.press("ArrowRight");
		await item_1.press("ArrowDown");
		await expect(item_11).toBeFocused();

		await item_11.press("ArrowRight");
		await item_11.press("ArrowDown");
		await expect(item_111).toBeFocused();

		await item_111.press("ArrowDown");
		await expect(item_112).toBeFocused();

		await item_112.press("ArrowDown");
		await expect(item_113).toBeFocused();

		await item_113.press("ArrowDown");
		await expect(item_12).toBeFocused();

		await item_12.press("ArrowRight");
		await item_12.press("ArrowDown");
		await expect(item_121).toBeFocused();

		await item_121.press("ArrowDown");
		await expect(item_122).toBeFocused();

		await item_122.press("ArrowDown");
		await expect(item_2).toBeFocused();

		await item_2.press("ArrowRight");
		await item_2.press("ArrowDown");
		await expect(item_21).toBeFocused();

		await item_21.press("ArrowDown");
		await expect(item_22).toBeFocused();

		await item_22.press("ArrowDown");
		await expect(item_3).toBeFocused();

		await item_3.press("ArrowRight");
		await item_3.press("ArrowDown");
		await expect(item_31).toBeFocused();

		await item_31.press("ArrowDown");
		await expect(item_32).toBeFocused();

		await item_32.press("ArrowDown");
		await expect(item_32).toBeFocused();

		await item_32.press("ArrowUp");
		await expect(item_31).toBeFocused();

		await item_31.press("ArrowUp");
		await expect(item_3).toBeFocused();

		await item_3.press("ArrowUp");
		await expect(item_22).toBeFocused();

		await item_22.press("ArrowUp");
		await expect(item_21).toBeFocused();

		await item_21.press("ArrowUp");
		await expect(item_2).toBeFocused();

		await item_2.press("ArrowUp");
		await expect(item_122).toBeFocused();

		await item_122.press("ArrowUp");
		await expect(item_121).toBeFocused();

		await item_121.press("ArrowUp");
		await expect(item_12).toBeFocused();

		await item_12.press("ArrowUp");
		await expect(item_113).toBeFocused();

		await item_113.press("ArrowUp");
		await expect(item_112).toBeFocused();

		await item_112.press("ArrowUp");
		await expect(item_111).toBeFocused();

		await item_111.press("ArrowUp");
		await expect(item_11).toBeFocused();

		await item_11.press("ArrowUp");
		await expect(item_1).toBeFocused();

		await item_1.press("ArrowUp");
		await expect(item_1).toBeFocused();
	});

	test("Shift+ArrowDown/Up navigates and selects", async ({ page }) => {
		await page.goto(ROUTE);
		const tree = page.getByRole("tree");
		const item_1 = getTreeItem(tree, "1");
		const item_11 = getTreeItem(tree, "1.1");
		const item_12 = getTreeItem(tree, "1.2");
		const item_2 = getTreeItem(tree, "2");
		const item_3 = getTreeItem(tree, "3");

		await item_1.press("ArrowRight");
		await item_1.press("Shift+ArrowDown");
		await expect(item_11).toBeFocused();
		await expectSelected(item_1, item_11);
		await expectUnselected(item_12, item_2, item_3);

		await item_2.press("Shift+ArrowDown");
		await expect(item_3).toBeFocused();
		await expectSelected(item_1, item_11, item_2, item_3);
		await expectUnselected(item_12);

		await item_3.press("Escape");
		await item_3.press("Shift+ArrowDown");
		await expect(item_3).toBeFocused();
		await expectUnselected(item_1, item_11, item_12, item_2, item_3);

		await item_3.press("Shift+ArrowUp");
		await expect(item_2).toBeFocused();
		await expectSelected(item_2, item_3);
		await expectUnselected(item_1, item_11, item_12);

		await item_11.press("Shift+ArrowUp");
		await expect(item_1).toBeFocused();
		await expectSelected(item_1, item_11, item_2, item_3);
		await expectUnselected(item_12);

		await item_1.press("Escape");
		await item_1.press("Shift+ArrowUp");
		await expect(item_1).toBeFocused();
		await expectUnselected(item_1, item_11, item_12, item_2, item_3);
	});

	test("PageDown/Up navigation", async ({ page }) => {
		await page.goto(ROUTE);
		const tree = page.getByRole("tree");
		const item_1 = getTreeItem(tree, "1");
		const item_11 = getTreeItem(tree, "1.1");
		const item_12 = getTreeItem(tree, "1.2");
		const item_2 = getTreeItem(tree, "2");
		const item_3 = getTreeItem(tree, "3");

		// The tree is 150px tall and each item is 50px tall.
		// Each item should scroll a maximum of 3 items at a time.
		await item_1.press("ArrowRight");
		await item_1.press("PageDown");
		await expect(item_2).toBeFocused();

		await item_2.press("PageDown");
		await expect(item_3).toBeFocused();

		await item_3.press("PageDown");
		await expect(item_3).toBeFocused();

		await item_3.press("PageUp");
		await expect(item_11).toBeFocused();

		await item_11.press("PageUp");
		await expect(item_1).toBeFocused();

		await item_1.press("PageUp");
		await expect(item_1).toBeFocused();

		// Each item should scroll a maximum of 2 items at a time.
		await page.setViewportSize({ width: 720, height: 125 });

		await item_1.press("PageDown");
		await expect(item_12).toBeFocused();

		await item_12.press("PageDown");
		await expect(item_3).toBeFocused();

		await item_3.press("PageDown");
		await expect(item_3).toBeFocused();

		await item_3.press("PageUp");
		await expect(item_12).toBeFocused();

		await item_12.press("PageUp");
		await expect(item_1).toBeFocused();

		// Each item should scroll a maximum of 1 item at a time.
		await page.setViewportSize({ width: 720, height: 75 });

		await item_1.press("PageDown");
		await expect(item_11).toBeFocused();

		await item_11.press("PageDown");
		await expect(item_12).toBeFocused();

		await item_12.press("PageDown");
		await expect(item_2).toBeFocused();

		await item_2.press("PageDown");
		await expect(item_3).toBeFocused();

		await item_3.press("PageDown");
		await expect(item_3).toBeFocused();

		await item_3.press("PageUp");
		await expect(item_2).toBeFocused();

		await item_2.press("PageUp");
		await expect(item_12).toBeFocused();

		await item_12.press("PageUp");
		await expect(item_11).toBeFocused();

		await item_11.press("PageUp");
		await expect(item_1).toBeFocused();

		await item_1.press("PageUp");
		await expect(item_1).toBeFocused();
	});

	test("Shift+PageUp/Down navigates and selects", async ({ page }) => {
		await page.goto(ROUTE);
		const tree = page.getByRole("tree");
		const item_1 = getTreeItem(tree, "1");
		const item_11 = getTreeItem(tree, "1.1");
		const item_12 = getTreeItem(tree, "1.2");
		const item_2 = getTreeItem(tree, "2");
		const item_3 = getTreeItem(tree, "3");

		// The tree is 150px tall and each item is 50px tall.
		// Each item should scroll a maximum of 3 items at a time.
		await item_1.press("ArrowRight");
		await item_1.press("Shift+PageDown");
		await expect(item_2).toBeFocused();
		await expectSelected(item_1, item_11, item_12, item_2);
		await expectUnselected(item_3);

		await item_2.press("Escape");
		await item_2.press("Shift+PageDown");
		await expect(item_3).toBeFocused();
		await expectSelected(item_2, item_3);
		await expectUnselected(item_1, item_11, item_12);

		await item_3.press("Escape");
		await item_3.press("Shift+PageDown");
		await expect(item_3).toBeFocused();
		await expectUnselected(item_1, item_11, item_12, item_2, item_3);

		await item_3.press("Shift+PageUp");
		await expect(item_11).toBeFocused();
		await expectSelected(item_11, item_12, item_2, item_3);
		await expectUnselected(item_1);

		await item_11.press("Escape");
		await item_11.press("Shift+PageUp");
		await expect(item_1).toBeFocused();
		await expectSelected(item_1, item_11);
		await expectUnselected(item_12, item_2, item_3);

		await item_1.press("Escape");
		await item_1.press("Shift+PageUp");
		await expect(item_1).toBeFocused();
		await expectUnselected(item_1, item_11, item_12, item_2, item_3);
	});

	test("Home navigates to the first item", async ({ page }) => {
		await page.goto(ROUTE);
		const tree = page.getByRole("tree");
		const item_1 = getTreeItem(tree, "1");
		const item_3 = getTreeItem(tree, "3");
		await item_3.press("Home");
		await expect(item_1).toBeFocused();
	});

	test("Shift+Ctrl/Cmd+Home navigates and selects", async ({ page }) => {
		await page.goto(ROUTE);
		const tree = page.getByRole("tree");
		const item_1 = getTreeItem(tree, "1");
		const item_11 = getTreeItem(tree, "1.1");
		const item_12 = getTreeItem(tree, "1.2");
		const item_2 = getTreeItem(tree, "2");
		const item_3 = getTreeItem(tree, "3");

		await item_1.press("ArrowRight");
		await item_2.press("Shift+ControlOrMeta+Home");
		await expect(item_1).toBeFocused();
		await expectSelected(item_1);
		await expectSelected(item_11);
		await expectSelected(item_12);
		await expectSelected(item_2);
		await expectUnselected(item_3);

		await item_1.press("Escape");
		await item_1.press("Shift+ControlOrMeta+Home");
		await expect(item_1).toBeFocused();
		await expectUnselected(item_1);
		await expectUnselected(item_11);
		await expectUnselected(item_12);
		await expectUnselected(item_2);
		await expectUnselected(item_3);
	});

	test("End navigates to the last item", async ({ page }) => {
		await page.goto(ROUTE);
		const tree = page.getByRole("tree");
		const item_1 = getTreeItem(tree, "1");
		const item_3 = getTreeItem(tree, "3");
		const item_32 = getTreeItem(tree, "3.2");

		await item_1.press("End");
		await expect(item_3).toBeFocused();

		await item_3.press("ArrowRight");
		await item_3.press("End");
		await expect(item_32).toBeFocused();
	});

	test("Shift+Ctrl/Cmd+End navigates and selects", async ({ page }) => {
		await page.goto(ROUTE);
		const tree = page.getByRole("tree");
		const item_1 = getTreeItem(tree, "1");
		const item_2 = getTreeItem(tree, "2");
		const item_3 = getTreeItem(tree, "3");
		const item_31 = getTreeItem(tree, "3.1");
		const item_32 = getTreeItem(tree, "3.2");

		await item_2.press("Shift+ControlOrMeta+End");
		await expect(item_3).toBeFocused();
		await expectSelected(item_2, item_3);
		await expectUnselected(item_1);

		await item_3.press("ArrowRight");
		await item_3.press("Escape");
		await item_3.press("Shift+ControlOrMeta+End");
		await expect(item_32).toBeFocused();
		await expectSelected(item_3, item_31, item_32);
		await expectUnselected(item_1);
		await expectUnselected(item_2);

		await item_32.press("Escape");
		await item_32.press("Shift+ControlOrMeta+End");
		await expect(item_32).toBeFocused();
		await expectUnselected(item_1, item_2, item_3, item_31, item_32);
	});

	test("F2 starts editing", async ({ page }) => {
		await page.goto(ROUTE);
		const tree = page.getByRole("tree");
		const item_1 = getTreeItem(tree, "1");
		const item_2 = getTreeItem(tree, "2");
		const input_1 = item_1.getByRole("textbox");
		const input_2 = item_2.getByRole("textbox");

		await item_1.press("F2");
		await expect(input_1).not.toBeVisible(); // item 1 is not editable

		await item_2.press("F2");
		await expect(input_2).toBeFocused();

		await input_2.press("Backspace");
		await input_2.fill("Section Two");
		await input_2.press("Enter");
		await expect(item_2).toBeFocused();
		await expect(item_2).toHaveText("Section Two");
		await expect(input_2).not.toBeVisible();

		await item_2.press("Space");
		await item_2.press("F2");
		await input_2.press("Backspace");
		await input_2.fill("Section 2");
		await input_2.press("Escape");
		await expect(item_2).toBeFocused();
		await expect(item_2).toHaveText("Section Two");
		await expectSelected(item_2);
		await expect(input_2).not.toBeVisible();

		await item_2.press("F2");
		await input_2.press("Backspace");
		await input_2.fill("Section 2");
		await input_2.blur();
		await expect(item_2).not.toBeFocused();
		await expect(item_2).toHaveText("Section Two");
		await expect(input_2).not.toBeVisible();

		await item_2.press("F2");
		await input_2.press("Backspace");
		await input_2.fill("Section 2");
		await input_2.press("Enter");
		await expect(item_2).toBeFocused();
		await expect(item_2).toHaveText("Section 2");
		await expect(input_2).not.toBeVisible();
	});

	test("Asterik expands all siblings", async ({ page }) => {
		await page.goto(ROUTE);
		const tree = page.getByRole("tree");
		const item_1 = getTreeItem(tree, "1");
		const item_11 = getTreeItem(tree, "1.1");
		const item_111 = getTreeItem(tree, "1.1.1");
		const item_112 = getTreeItem(tree, "1.1.2");
		const item_113 = getTreeItem(tree, "1.1.3");
		const item_12 = getTreeItem(tree, "1.2");
		const item_121 = getTreeItem(tree, "1.2.1");
		const item_122 = getTreeItem(tree, "1.2.2");
		const item_2 = getTreeItem(tree, "2");
		const item_21 = getTreeItem(tree, "2.1");
		const item_22 = getTreeItem(tree, "2.2");
		const item_3 = getTreeItem(tree, "3");
		const item_31 = getTreeItem(tree, "3.1");
		const item_32 = getTreeItem(tree, "3.2");

		await item_1.press("*");
		await expectExpanded(item_1, item_2, item_3);
		await expectNonExpandable(item_21, item_22, item_31, item_32);
		await expectCollapsed(item_11, item_12);

		await item_11.press("*");
		await expectExpanded(item_1, item_11, item_12, item_2, item_3);
		await expectNonExpandable(
			item_111,
			item_112,
			item_113,
			item_121,
			item_122,
			item_21,
			item_22,
			item_31,
			item_32,
		);
	});

	test("Delete removes all selected items", async ({ page }) => {
		await page.goto(ROUTE);
		const tree = page.getByRole("tree");
		const items = tree.getByRole("treeitem");
		const item_1 = getTreeItem(tree, "1");
		const item_11 = getTreeItem(tree, "1.1");
		const item_111 = getTreeItem(tree, "1.1.1");
		const item_112 = getTreeItem(tree, "1.1.2");
		const item_113 = getTreeItem(tree, "1.1.3");
		const item_12 = getTreeItem(tree, "1.2");
		const item_2 = getTreeItem(tree, "2");
		const item_3 = getTreeItem(tree, "3");

		await item_1.press("ArrowRight");
		await item_11.press("ArrowRight");
		await item_12.press("ArrowRight");
		await item_2.press("ArrowRight");
		await item_3.press("ArrowRight");

		await item_3.press("Space");
		await item_12.press("Space");
		await item_12.press("Delete");
		await expect(item_2).toBeFocused();
		await expect(items).toHaveText([
			"Section 1",
			"Section 1.1",
			"Section 1.1.1",
			"Section 1.1.2",
			"Section 1.1.3",
			"Section 2",
			"Section 2.1",
			"Section 2.2",
		]);

		await item_2.press("Delete");
		await expect(item_2).toBeFocused();
		await expect(items).toHaveText([
			"Section 1",
			"Section 1.1",
			"Section 1.1.1",
			"Section 1.1.2",
			"Section 1.1.3",
			"Section 2",
			"Section 2.1",
			"Section 2.2",
		]);

		await item_2.press("Space");
		await item_2.press("Delete");
		await expect(item_113).toBeFocused();
		await expect(items).toHaveText([
			"Section 1",
			"Section 1.1",
			"Section 1.1.1",
			"Section 1.1.2",
			"Section 1.1.3",
		]);

		await item_113.press("Space");
		await item_112.press("Space");
		await item_112.press("Delete");
		await expect(item_111).toBeFocused();
		await expect(items).toHaveText([
			"Section 1",
			"Section 1.1",
			"Section 1.1.1",
		]);

		await item_11.press("Space");
		await item_11.press("Delete");
		await expect(item_1).toBeFocused();
		await expect(items).toHaveText(["Section 1"]);
	});

	test("Click clears selection and selects the item", async ({ page }) => {
		await page.goto(ROUTE);
		const tree = page.getByRole("tree");
		const item_1 = getTreeItem(tree, "1");
		const item_2 = getTreeItem(tree, "2");
		const item_3 = getTreeItem(tree, "3");

		await item_1.click();
		await expect(item_1).toBeFocused();
		await expectSelected(item_1);
		await expectUnselected(item_2, item_3);

		await item_2.click();
		await expect(item_2).toBeFocused();
		await expectSelected(item_2);
		await expectUnselected(item_1, item_3);

		await item_3.click();
		await expect(item_3).toBeFocused();
		await expectSelected(item_3);
		await expectUnselected(item_1, item_2);
	});

	test("Ctrl/Cmd+Click toggles selection", async ({ page }) => {
		await page.goto(ROUTE);
		const tree = page.getByRole("tree");
		const item_1 = getTreeItem(tree, "1");
		const item_2 = getTreeItem(tree, "2");
		const item_3 = getTreeItem(tree, "3");

		await item_1.click({ modifiers: ["ControlOrMeta"] });
		await expect(item_1).toBeFocused();
		await expectSelected(item_1);
		await expectUnselected(item_2, item_3);

		await item_2.click({ modifiers: ["ControlOrMeta"] });
		await expect(item_2).toBeFocused();
		await expectSelected(item_1, item_2);
		await expectUnselected(item_3);

		await item_3.click({ modifiers: ["ControlOrMeta"] });
		await expect(item_3).toBeFocused();
		await expectSelected(item_1, item_2, item_3);

		await item_3.click({ modifiers: ["ControlOrMeta"] });
		await expect(item_3).toBeFocused();
		await expectSelected(item_1, item_2);
		await expectUnselected(item_3);

		await item_2.click({ modifiers: ["ControlOrMeta"] });
		await expect(item_2).toBeFocused();
		await expectSelected(item_1);
		await expectUnselected(item_2, item_3);

		await item_1.click({ modifiers: ["ControlOrMeta"] });
		await expect(item_1).toBeFocused();
		await expectUnselected(item_1, item_2, item_3);
	});

	test("Shift+Click selects multiple items", async ({ page }) => {
		await page.goto(ROUTE);
		const tree = page.getByRole("tree");
		const item_1 = getTreeItem(tree, "1");
		const item_11 = getTreeItem(tree, "1.1");
		const item_12 = getTreeItem(tree, "1.2");
		const item_2 = getTreeItem(tree, "2");
		const item_21 = getTreeItem(tree, "2.1");
		const item_22 = getTreeItem(tree, "2.2");
		const item_3 = getTreeItem(tree, "3");

		await item_1.press("ArrowRight");
		await item_2.press("ArrowRight");

		await item_2.click();
		await item_3.click({ modifiers: ["Shift"] });
		await expect(item_3).toBeFocused();
		await expectSelected(item_2, item_21, item_22, item_3);
		await expectUnselected(item_1, item_11, item_12);

		await item_2.press("Escape");
		await item_2.click({ modifiers: ["Shift"] });
		await expectSelected(item_1, item_11, item_12, item_2);
		await expectUnselected(item_21, item_22, item_3);
	});

	// TODO: test dnd
});

function getTreeItem(tree: Locator, id: string) {
	return tree.getByTestId(`tree-item:${id}`);
}

async function expectExpanded(...items: Locator[]) {
	for (const item of items) {
		await expect(item).toHaveAttribute("aria-expanded", "true");
	}
}

async function expectCollapsed(...items: Locator[]) {
	for (const item of items) {
		await expect(item).toHaveAttribute("aria-expanded", "false");
	}
}

async function expectNonExpandable(...items: Locator[]) {
	for (const item of items) {
		await expect(item).not.toHaveAttribute("aria-expanded");
	}
}

async function expectSelected(...items: Locator[]) {
	for (const item of items) {
		await expect(item).toHaveAttribute("aria-selected", "true");
	}
}

async function expectUnselected(...items: Locator[]) {
	for (const item of items) {
		await expect(item).toHaveAttribute("aria-selected", "false");
	}
}
