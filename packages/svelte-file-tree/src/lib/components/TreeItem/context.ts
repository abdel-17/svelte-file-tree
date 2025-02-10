import { Context } from "runed";

export const TreeItemContext = new Context<{
	setEditing: (value: boolean) => void;
}>("TreeItem");
