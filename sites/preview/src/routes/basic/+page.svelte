<script lang="ts">
	import { ChevronDownIcon, FileIcon, FolderIcon, FolderOpenIcon } from "@lucide/svelte";
	import { SvelteSet } from "svelte/reactivity";
	import { Tree, TreeItem, type TreeItemState } from "svelte-file-tree";

	type TreeNode = {
		id: string;
		name: string;
		children?: TreeNode[];
	};

	function create_node(name: string, children?: TreeNode[]): TreeNode {
		return { id: crypto.randomUUID(), name, children };
	}

	// prettier-ignore
	const root = [
		create_node("Applications", [
			create_node("App Store.app"),
			create_node("FaceTime.app"),
			create_node("Mail.app"),
			create_node("Messages.app"),
			create_node("Music.app"),
			create_node("Safari.app"),
		]),
		create_node("Developer", [
			create_node("svelte-file-tree", [
				create_node("src", [
					create_node("components", [
						create_node("Tree.svelte"),
						create_node("TreeItem.svelte"),
						create_node("types.ts"),
					]),
					create_node("index.ts"),
					create_node("tree.svelte.ts"),
				]),
				create_node("package.json"),
				create_node("README.md"),
			]),
			create_node("svelte-material-ripple", [
				create_node("src", [
					create_node("Ripple.svelte"),
					create_node("index.ts"),
				]),
				create_node("package.json"),
				create_node("README.md"),
			]),
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
			create_node("Finding Nemo.mp4"),
		]),
	];

	const expanded_ids = new SvelteSet<string>();

	function on_toggle_click(event: MouseEvent, item: TreeItemState<TreeNode>) {
		if (item.expanded) {
			expanded_ids.delete(item.id);
		} else {
			expanded_ids.add(item.id);
		}
		event.preventDefault();
	}
</script>

<Tree {root} expandedIds={expanded_ids} class="py-6">
	{#snippet children({ items })}
		{#each items as item (item.id)}
			{@const children = item.node.children}
			<TreeItem
				{item}
				class="group p-3 hover:bg-neutral-200 focus:outline-2 focus:-outline-offset-2 focus:outline-current active:bg-neutral-300 aria-selected:bg-blue-200 aria-selected:text-blue-900 aria-selected:active:bg-blue-300"
			>
				<div
					class="flex items-center"
					style="padding-inline-start: calc({6 * item.depth} * var(--spacing))"
				>
					<ChevronDownIcon
						role="presentation"
						data-visible={children !== undefined && children.length !== 0}
						class="size-6 p-0.5 transition-transform duration-200 group-aria-expanded:-rotate-90 data-[visible=false]:invisible"
						onclick={(event) => on_toggle_click(event, item)}
					/>

					<div class="ps-1 pe-2">
						{#if children !== undefined && item.expanded}
							<FolderOpenIcon role="presentation" class="fill-blue-300" />
						{:else if children !== undefined}
							<FolderIcon role="presentation" class="fill-blue-300" />
						{:else}
							<FileIcon role="presentation" />
						{/if}
					</div>

					<span class="select-none">{item.node.name}</span>
				</div>
			</TreeItem>
		{/each}
	{/snippet}
</Tree>
