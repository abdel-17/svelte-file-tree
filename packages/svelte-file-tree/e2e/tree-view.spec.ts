import { expect, type Page, test } from "@playwright/test";

const ROUTE = "/e2e/tree-view";

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

function getTreeItem(page: Page, id: string) {
	return page.getByTestId(`tree-item:${id}`);
}

test.describe("TreeView", () => {
	test("Tree is rendered correctly", async ({ page }) => {
		await page.goto(ROUTE);
		const tree = page.getByRole("tree");
		const items = page.getByRole("treeitem");
		await expect(tree).toHaveAttribute("aria-multiselectable", "true");
		await expect(items).toHaveText(["Section 1", "Section 2", "Section 3"]);
	});

	test("Tree items roving tabindex", async ({ page }) => {
		await page.goto(ROUTE);
		const item_1 = getTreeItem(page, "1");
		const item_2 = getTreeItem(page, "2");
		const item_3 = getTreeItem(page, "3");
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

	test("Space toggles selection", async ({ page }) => {
		await page.goto(ROUTE);
		const item_1 = getTreeItem(page, "1");
		await expect(item_1).toHaveAttribute("aria-selected", "false");

		await item_1.press("Space");
		await expect(item_1).toHaveAttribute("aria-selected", "true");

		await item_1.press("Space");
		await expect(item_1).toHaveAttribute("aria-selected", "false");
	});

	test("ArrowRight expands and ArrowLeft collapses", async ({ page }) => {
		await page.goto(ROUTE);
		const item_1 = getTreeItem(page, "1");
		await expect(item_1).toHaveAttribute("aria-expanded", "false");

		await item_1.press("ArrowRight");
		await expect(item_1).toHaveAttribute("aria-expanded", "true");

		const item_11 = getTreeItem(page, "1.1");
		await expect(item_11).toHaveAttribute("aria-expanded", "false");

		await item_11.press("ArrowRight");
		await expect(item_11).toHaveAttribute("aria-expanded", "true");

		const item_111 = getTreeItem(page, "1.1.1");
		await expect(item_111).not.toHaveAttribute("aria-expanded");

		await item_111.press("ArrowRight");
		await expect(item_111).not.toHaveAttribute("aria-expanded");

		const items = page.getByRole("treeitem");
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

		await item_11.press("ArrowLeft");
		await expect(item_11).toHaveAttribute("aria-expanded", "false");
		await expect(items).toHaveText([
			"Section 1",
			"Section 1.1",
			"Section 1.2",
			"Section 2",
			"Section 3",
		]);

		await item_1.press("ArrowLeft");
		await expect(item_1).toHaveAttribute("aria-expanded", "false");
		await expect(items).toHaveText(["Section 1", "Section 2", "Section 3"]);
	});

	test("Tree items have the correct aria attributes", async ({ page }) => {
		await page.goto(ROUTE);
		const item_1 = getTreeItem(page, "1");
		await expect(item_1).toHaveAttribute("aria-level", "1");
		await expect(item_1).toHaveAttribute("aria-posinset", "1");
		await expect(item_1).toHaveAttribute("aria-setsize", "3");

		await item_1.press("ArrowRight");
		const item_11 = getTreeItem(page, "1.1");
		await expect(item_11).toHaveAttribute("aria-level", "2");
		await expect(item_11).toHaveAttribute("aria-posinset", "1");
		await expect(item_11).toHaveAttribute("aria-setsize", "2");

		await item_11.press("ArrowRight");
		const item_111 = getTreeItem(page, "1.1.1");
		await expect(item_111).toHaveAttribute("aria-level", "3");
		await expect(item_111).toHaveAttribute("aria-posinset", "1");
		await expect(item_111).toHaveAttribute("aria-setsize", "3");

		const item_112 = getTreeItem(page, "1.1.2");
		await expect(item_112).toHaveAttribute("aria-level", "3");
		await expect(item_112).toHaveAttribute("aria-posinset", "2");
		await expect(item_112).toHaveAttribute("aria-setsize", "3");

		const item_113 = getTreeItem(page, "1.1.3");
		await expect(item_113).toHaveAttribute("aria-level", "3");
		await expect(item_113).toHaveAttribute("aria-posinset", "3");
		await expect(item_113).toHaveAttribute("aria-setsize", "3");

		const item_12 = getTreeItem(page, "1.2");
		await expect(item_12).toHaveAttribute("aria-level", "2");
		await expect(item_12).toHaveAttribute("aria-posinset", "2");
		await expect(item_12).toHaveAttribute("aria-setsize", "2");

		const item_2 = getTreeItem(page, "2");
		await expect(item_2).toHaveAttribute("aria-level", "1");
		await expect(item_2).toHaveAttribute("aria-posinset", "2");
		await expect(item_2).toHaveAttribute("aria-setsize", "3");

		await item_2.press("ArrowRight");
		const item_21 = getTreeItem(page, "2.1");
		await expect(item_21).toHaveAttribute("aria-level", "2");
		await expect(item_21).toHaveAttribute("aria-posinset", "1");
		await expect(item_21).toHaveAttribute("aria-setsize", "2");

		const item_22 = getTreeItem(page, "2.2");
		await expect(item_22).toHaveAttribute("aria-level", "2");
		await expect(item_22).toHaveAttribute("aria-posinset", "2");
		await expect(item_22).toHaveAttribute("aria-setsize", "2");

		const item_3 = getTreeItem(page, "3");
		await expect(item_3).toHaveAttribute("aria-level", "1");
		await expect(item_3).toHaveAttribute("aria-posinset", "3");
		await expect(item_3).toHaveAttribute("aria-setsize", "3");

		await item_3.press("ArrowRight");
		const item_31 = getTreeItem(page, "3.1");
		await expect(item_31).toHaveAttribute("aria-level", "2");
		await expect(item_31).toHaveAttribute("aria-posinset", "1");
		await expect(item_31).toHaveAttribute("aria-setsize", "2");

		const item_32 = getTreeItem(page, "3.2");
		await expect(item_32).toHaveAttribute("aria-level", "2");
		await expect(item_32).toHaveAttribute("aria-posinset", "2");
		await expect(item_32).toHaveAttribute("aria-setsize", "2");
	});

	test("ArrowRight navigates to the first child and ArrowLeft navigates back to the parent", async ({
		page,
	}) => {
		await page.goto(ROUTE);
		const item_1 = getTreeItem(page, "1");
		await item_1.press("ArrowRight");
		await item_1.press("ArrowRight");

		const item_11 = getTreeItem(page, "1.1");
		await expect(item_11).toBeFocused();

		await item_11.press("ArrowRight");
		await item_11.press("ArrowRight");
		const item_111 = getTreeItem(page, "1.1.1");
		await expect(item_111).toBeFocused();

		const item_112 = getTreeItem(page, "1.1.2");
		await item_112.press("ArrowLeft");
		await expect(item_11).toBeFocused();

		await item_11.press("ArrowLeft");
		await item_11.press("ArrowLeft");
		await expect(item_1).toBeFocused();

		await item_1.press("ArrowLeft");
		await expect(item_1).toBeFocused();
	});

	test("ArrowDown/ArrowUp navigates to the next/previous item", async ({
		page,
	}) => {
		await page.goto(ROUTE);
		const item_1 = getTreeItem(page, "1");
		await item_1.press("ArrowRight");
		await item_1.press("ArrowDown");
		const item_11 = getTreeItem(page, "1.1");
		await expect(item_11).toBeFocused();

		await item_11.press("ArrowRight");
		await item_11.press("ArrowDown");
		const item_111 = getTreeItem(page, "1.1.1");
		await expect(item_111).toBeFocused();

		await item_111.press("ArrowDown");
		const item_112 = getTreeItem(page, "1.1.2");
		await expect(item_112).toBeFocused();

		await item_112.press("ArrowDown");
		const item_113 = getTreeItem(page, "1.1.3");
		await expect(item_113).toBeFocused();

		await item_113.press("ArrowDown");
		const item_12 = getTreeItem(page, "1.2");
		await expect(item_12).toBeFocused();

		await item_12.press("ArrowDown");
		const item_2 = getTreeItem(page, "2");
		await expect(item_2).toBeFocused();

		await item_2.press("ArrowDown");
		const item_3 = getTreeItem(page, "3");
		await expect(item_3).toBeFocused();

		await item_3.press("ArrowDown");
		await expect(item_3).toBeFocused();

		await item_3.press("ArrowUp");
		await expect(item_2).toBeFocused();

		await item_2.press("ArrowUp");
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

	test("Shift + ArrowDown/ArrowUp both navigates and selects", async ({
		page,
	}) => {
		await page.goto(ROUTE);
		const item_1 = getTreeItem(page, "1");
		await item_1.press("ArrowRight");
		await item_1.press("ArrowDown");
		const item_11 = getTreeItem(page, "1.1");
		await expect(item_11).toBeFocused();
		await expect(item_1).toHaveAttribute("aria-selected", "false");
		await expect(item_11).toHaveAttribute("aria-selected", "false");

		await item_11.press("Shift+ArrowDown");
		const item_12 = getTreeItem(page, "1.2");
		await expect(item_12).toBeFocused();
		await expect(item_11).toHaveAttribute("aria-selected", "true");
		await expect(item_12).toHaveAttribute("aria-selected", "true");

		await item_12.press("ArrowDown");
		const item_2 = getTreeItem(page, "2");
		await expect(item_2).toBeFocused();
		await expect(item_12).toHaveAttribute("aria-selected", "true");
		await expect(item_2).toHaveAttribute("aria-selected", "false");

		await item_2.press("ArrowDown");
		const item_3 = getTreeItem(page, "3");
		await expect(item_3).toBeFocused();
		await expect(item_2).toHaveAttribute("aria-selected", "false");
		await expect(item_3).toHaveAttribute("aria-selected", "false");

		await item_3.press("Shift+ArrowDown");
		await expect(item_3).toBeFocused();
		await expect(item_3).toHaveAttribute("aria-selected", "false");

		await item_3.press("Shift+ArrowUp");
		await expect(item_2).toBeFocused();
		await expect(item_3).toHaveAttribute("aria-selected", "true");
		await expect(item_2).toHaveAttribute("aria-selected", "true");

		await item_2.press("ArrowUp");
		await expect(item_12).toBeFocused();
		await expect(item_2).toHaveAttribute("aria-selected", "true");
		await expect(item_12).toHaveAttribute("aria-selected", "true");

		await item_12.press("ArrowUp");
		await expect(item_11).toBeFocused();
		await expect(item_12).toHaveAttribute("aria-selected", "true");
		await expect(item_11).toHaveAttribute("aria-selected", "true");

		await item_11.press("ArrowUp");
		await expect(item_1).toBeFocused();
		await expect(item_11).toHaveAttribute("aria-selected", "true");
		await expect(item_1).toHaveAttribute("aria-selected", "false");

		await item_1.press("Shift+ArrowUp");
		await expect(item_1).toBeFocused();
		await expect(item_1).toHaveAttribute("aria-selected", "false");
	});

	test("PageDown/PageUp navigates to the last/first visible item after scrolling down/up", async ({
		page,
	}) => {
		// Tree is 150px tall and each item is 50px tall.
		// It should scroll a maximum of 3 items at a time.
		await page.goto(ROUTE);
		const item_1 = getTreeItem(page, "1");
		await item_1.press("PageDown");
		const item_3 = getTreeItem(page, "3");
		await expect(item_3).toBeFocused();

		await item_3.press("PageUp");
		await expect(item_1).toBeFocused();

		await item_1.press("ArrowRight");
		await item_1.press("PageDown");
		const item_2 = getTreeItem(page, "2");
		await expect(item_2).toBeFocused();

		await item_2.press("PageDown");
		await expect(item_3).toBeFocused();

		await item_3.press("PageDown");
		await expect(item_3).toBeFocused();

		await item_3.press("PageUp");
		const item_11 = getTreeItem(page, "1.1");
		await expect(item_11).toBeFocused();

		await item_11.press("PageUp");
		await expect(item_1).toBeFocused();

		await item_1.press("PageUp");
		await expect(item_1).toBeFocused();
	});

	test("PageDown/PageUp scroll distance is limited by the viewport's height", async ({
		page,
	}) => {
		// Viewport is 120px tall and each item is 50px tall.
		// It should scroll a maximum of 2 items at a time.
		await page.setViewportSize({ width: 720, height: 120 });
		await page.goto(ROUTE);
		const item_1 = getTreeItem(page, "1");
		await item_1.press("PageDown");
		const item_3 = getTreeItem(page, "3");
		await expect(item_3).toBeFocused();

		await item_3.press("PageUp");
		await expect(item_1).toBeFocused();

		await item_1.press("ArrowRight");
		await item_1.press("PageDown");
		const item_12 = getTreeItem(page, "1.2");
		await expect(item_12).toBeFocused();

		await item_12.press("PageDown");
		await expect(item_3).toBeFocused();

		await item_3.press("PageDown");
		await expect(item_3).toBeFocused();

		await item_3.press("PageUp");
		await expect(item_12).toBeFocused();

		await item_12.press("PageUp");
		await expect(item_1).toBeFocused();

		await item_1.press("PageUp");
		await expect(item_1).toBeFocused();
	});

	test("Shift + Control/Command + PageUp/PageDown both navigates and selects", async ({
		page,
	}) => {
		// Tree is 150px tall and each item is 50px tall.
		// It should scroll a maximum of 3 items at a time.
		await page.goto(ROUTE);
		const item_1 = getTreeItem(page, "1");
		await item_1.press("ArrowRight");
		await item_1.press("Shift+ControlOrMeta+PageDown");
		const item_11 = getTreeItem(page, "1.1");
		const item_12 = getTreeItem(page, "1.2");
		const item_2 = getTreeItem(page, "2");
		await expect(item_2).toBeFocused();
		await expect(item_1).toHaveAttribute("aria-selected", "true");
		await expect(item_11).toHaveAttribute("aria-selected", "true");
		await expect(item_12).toHaveAttribute("aria-selected", "true");
		await expect(item_2).toHaveAttribute("aria-selected", "true");

		await item_2.press("Shift+ControlOrMeta+PageDown");
		const item_3 = getTreeItem(page, "3");
		await expect(item_3).toBeFocused();
		await expect(item_2).toHaveAttribute("aria-selected", "true");
		await expect(item_3).toHaveAttribute("aria-selected", "true");

		await item_3.press(" ");
		await item_3.press("Shift+ControlOrMeta+PageDown");
		await expect(item_3).toBeFocused();
		await expect(item_3).toHaveAttribute("aria-selected", "false");

		await item_1.press(" ");
		await item_11.press(" ");
		await item_12.press(" ");
		await item_2.press(" ");
		await item_3.press("Shift+ControlOrMeta+PageUp");
		await expect(item_11).toBeFocused();
		await expect(item_3).toHaveAttribute("aria-selected", "true");
		await expect(item_2).toHaveAttribute("aria-selected", "true");
		await expect(item_12).toHaveAttribute("aria-selected", "true");
		await expect(item_11).toHaveAttribute("aria-selected", "true");

		await item_11.press("Shift+ControlOrMeta+PageUp");
		await expect(item_1).toBeFocused();
		await expect(item_11).toHaveAttribute("aria-selected", "true");
		await expect(item_1).toHaveAttribute("aria-selected", "true");

		await item_1.press(" ");
		await item_1.press("Shift+ControlOrMeta+PageUp");
		await expect(item_1).toBeFocused();
		await expect(item_1).toHaveAttribute("aria-selected", "false");
	});

	test("Home navigates to the first item", async ({ page }) => {
		await page.goto(ROUTE);
		const item_3 = getTreeItem(page, "3");
		await item_3.press("Home");
		const item_1 = getTreeItem(page, "1");
		await expect(item_1).toBeFocused();
	});

	test("Shift + Control/Command + Home navigates and selects all items up to the first item", async ({
		page,
	}) => {
		await page.goto(ROUTE);
		const item_1 = getTreeItem(page, "1");
		await item_1.press("Shift+ControlOrMeta+Home");
		await expect(item_1).toHaveAttribute("aria-selected", "false");

		await item_1.press("ArrowRight");
		const item_11 = getTreeItem(page, "1.1");
		const item_12 = getTreeItem(page, "1.1");
		const item_2 = getTreeItem(page, "2");
		await item_2.press("Shift+ControlOrMeta+Home");
		await expect(item_1).toBeFocused();
		await expect(item_2).toHaveAttribute("aria-selected", "true");
		await expect(item_12).toHaveAttribute("aria-selected", "true");
		await expect(item_11).toHaveAttribute("aria-selected", "true");
		await expect(item_1).toHaveAttribute("aria-selected", "true");
	});

	test("End navigates to the last item", async ({ page }) => {
		await page.goto(ROUTE);
		const item_1 = getTreeItem(page, "1");
		await item_1.press("End");
		const item_3 = getTreeItem(page, "3");
		await expect(item_3).toBeFocused();

		await item_3.press("ArrowRight");
		await item_3.press("End");
		const item_32 = getTreeItem(page, "3.2");
		await expect(item_32).toBeFocused();
	});

	test("Shift + Control/Command + End navigates and selects all items up to the last item", async ({
		page,
	}) => {
		await page.goto(ROUTE);
		const item_3 = getTreeItem(page, "3");
		await item_3.press("Shift+ControlOrMeta+End");
		await expect(item_3).toHaveAttribute("aria-selected", "false");

		await item_3.press("ArrowRight");
		await item_3.press("Shift+ControlOrMeta+End");
		const item_31 = getTreeItem(page, "3.1");
		const item_32 = getTreeItem(page, "3.2");
		await expect(item_32).toBeFocused();
		await expect(item_3).toHaveAttribute("aria-selected", "true");
		await expect(item_31).toHaveAttribute("aria-selected", "true");
		await expect(item_32).toHaveAttribute("aria-selected", "true");
	});

	test("F2 enters editing mode, Enter confirms the edits, and Escape discards them", async ({
		page,
	}) => {
		await page.goto(ROUTE);
		const item_1 = getTreeItem(page, "1");
		await item_1.press("F2");
		const input = page.getByRole("textbox");
		await expect(input).not.toBeVisible(); // item 1 is not editable

		const item_2 = getTreeItem(page, "2");
		await item_2.press("F2");
		await expect(input).toBeFocused();

		await input.press("Backspace");
		await input.fill("Section 2.0");
		await input.press("Enter");
		await expect(item_2).toHaveText("Section 2.0");
		await expect(item_2).toBeFocused();

		await item_2.press("F2");
		await input.press("Backspace");
		await input.fill("Section 2");
		await input.press("Escape");
		await expect(item_2).toHaveText("Section 2.0");
		await expect(item_2).toBeFocused();
		await expect(input).not.toBeVisible();

		await item_2.press("F2");
		await input.press("Backspace");
		await input.fill("Section 2");
		await input.blur();
		await expect(item_2).toHaveText("Section 2.0");
		await expect(item_2).not.toBeFocused();
		await expect(input).not.toBeVisible();
	});

	test("Control/Command + a selects all visible items", async ({ page }) => {
		await page.goto(ROUTE);
		const item_1 = getTreeItem(page, "1");
		await item_1.press("ControlOrMeta+a");
		const item_2 = getTreeItem(page, "2");
		const item_3 = getTreeItem(page, "3");
		await expect(item_1).toHaveAttribute("aria-selected", "true");
		await expect(item_2).toHaveAttribute("aria-selected", "true");
		await expect(item_3).toHaveAttribute("aria-selected", "true");

		await item_1.press("ArrowRight");
		const item_11 = getTreeItem(page, "1.1");
		const item_12 = getTreeItem(page, "1.2");
		await expect(item_1).toHaveAttribute("aria-selected", "true");
		await expect(item_11).toHaveAttribute("aria-selected", "false");
		await expect(item_12).toHaveAttribute("aria-selected", "false");
		await expect(item_2).toHaveAttribute("aria-selected", "true");
		await expect(item_3).toHaveAttribute("aria-selected", "true");

		await item_1.press("ControlOrMeta+a");
		await expect(item_1).toHaveAttribute("aria-selected", "true");
		await expect(item_11).toHaveAttribute("aria-selected", "true");
		await expect(item_12).toHaveAttribute("aria-selected", "true");
		await expect(item_2).toHaveAttribute("aria-selected", "true");
		await expect(item_3).toHaveAttribute("aria-selected", "true");
	});

	test("Asterik expands all sibling items", async ({ page }) => {
		await page.goto(ROUTE);
		const item_1 = getTreeItem(page, "1");
		await item_1.press("*");
		const item_2 = getTreeItem(page, "2");
		const item_3 = getTreeItem(page, "3");
		await expect(item_1).toHaveAttribute("aria-expanded", "true");
		await expect(item_2).toHaveAttribute("aria-expanded", "true");
		await expect(item_3).toHaveAttribute("aria-expanded", "true");

		const item_11 = getTreeItem(page, "1.1");
		const item_12 = getTreeItem(page, "1.2");
		await expect(item_11).toHaveAttribute("aria-expanded", "false");
		await expect(item_12).toHaveAttribute("aria-expanded", "false");

		await item_11.press("*");
		await expect(item_11).toHaveAttribute("aria-expanded", "true");
		await expect(item_12).toHaveAttribute("aria-expanded", "true");
	});
});
