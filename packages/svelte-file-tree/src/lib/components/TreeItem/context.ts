import type { WritableBox } from "$lib/internal/box.svelte.js";
import { Context } from "runed";

export const TreeItemContext = new Context<{
	editing: WritableBox<boolean>;
}>("TreeItem");
