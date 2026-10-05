<script lang="ts">
	import chevron_down_svg from "#lib/icons/chevron-down.svg?raw";
	import file_svg from "#lib/icons/file.svg?raw";
	import folder_svg from "#lib/icons/folder.svg?raw";
	import folder_open_svg from "#lib/icons/folder-open.svg?raw";
	import { SvelteSet } from "svelte/reactivity";
	import { create_flat_tree, Tree, TreeItem } from "svelte-file-tree";

	type TreeNode = {
		id: string,
		name: string,
		children?: TreeNode[],
	};

	function create_node(name: string, children?: TreeNode[]): TreeNode {
		const id = crypto.randomUUID();
		return { id, name, children };
	}

	function get_id(node: TreeNode): string {
		return node.id;
	}

	function has_children(node: TreeNode): boolean {
		return node.children !== undefined;
	}

	function get_children(node: TreeNode): TreeNode[] | undefined {
		return node.children;
	}

	const root = [
		create_node("Applications", [
			create_node("App Store.app"),
			create_node("FaceTime.app"),
			create_node("Mail.app"),
			create_node("Messages.app"),
			create_node("Music.app"),
			create_node("Safari.app"),
		]),
		create_node("Documents", [
			create_node("Project Planning", [
				create_node("q1-goals.xlsx"),
				create_node("timeline.pdf"),
			]),
			create_node("meeting-notes.docx"),
			create_node("resume.pdf"),
		]),
		create_node("Downloads", [
			create_node("conference-slides.pptx"),
			create_node("typescript-cheatsheet.pdf"),
		]),
		create_node("Movies", [
			create_node("Finding Nemo.mp4"),
			create_node("Inside Out.mp4"),
			create_node("Up.mp4"),
		]),
		create_node("Pictures", [
			create_node("Screenshots", [
				create_node("bug-report.png"),
				create_node("component-diagram.png"),
				create_node("design-mockup.png"),
			]),
			create_node("profile-photo.jpg"),
		]),
		create_node("Videos", [
			create_node("Family Trip.mp4"),
		]),
	];
	const selected_ids = new SvelteSet<string>();
	const expanded_ids = new SvelteSet<string>();
	const items = $derived(create_flat_tree({ root, expanded_ids, get_id, get_children }));

	function set_toggle(ids: Set<string>, id: string): void {
		const deleted = ids.delete(id);
		if (!deleted) {
			ids.add(id);
		}
	}
</script>

<svelte:head>
	<title>Svelte File Tree - Minimal</title>
</svelte:head>

<Tree {items} {selected_ids} {expanded_ids} {get_id} {has_children} aria-label="Files">
	{#each items as item, index (item.id)}
		{const selected = $derived(selected_ids.has(item.id))}
		{const expanded = $derived(expanded_ids.has(item.id))}
		<TreeItem {item} {index} {selected} {expanded} class="treeitem" style="--depth: {item.depth}">
			<span
				aria-hidden="true"
				class="treeitem-expand-icon"
				onclick={(event) => {
					set_toggle(expanded_ids, item.id);
					event.preventDefault();
				}}
			>
				{@html chevron_down_svg}
			</span>

			<span aria-hidden="true" class="treeitem-icon">
				{#if item.data.children === undefined}
					{@html file_svg}
				{:else if expanded}
					{@html folder_open_svg}
				{:else}
					{@html folder_svg}
				{/if}
			</span>

			{item.data.name}
		</TreeItem>
	{/each}
</Tree>
