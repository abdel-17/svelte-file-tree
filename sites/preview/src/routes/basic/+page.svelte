<script lang="ts">
	import { TreeItemData } from "$lib/tree.svelte";
	import { ChevronDownIcon, FileIcon, FolderIcon, FolderOpenIcon } from "@lucide/svelte";
	import { SvelteSet } from "svelte/reactivity";
	import {
		Tree,
		TreeItem,
		type OnCircularReferenceArgs,
		type OnCopyArgs,
		type OnMoveArgs,
		type OnRemoveArgs,
		type TreeItemState,
	} from "svelte-file-tree";
	import { toast } from "svelte-sonner";

	// prettier-ignore
	const root = $state([
		new TreeItemData("Applications", [
			new TreeItemData("App Store.app"),
			new TreeItemData("FaceTime.app"),
			new TreeItemData("Mail.app"),
			new TreeItemData("Messages.app"),
			new TreeItemData("Music.app"),
			new TreeItemData("Safari.app"),
		]),
		new TreeItemData("Developer", [
			new TreeItemData("svelte-file-tree", [
				new TreeItemData("src", [
					new TreeItemData("components", [
						new TreeItemData("Tree.svelte"),
						new TreeItemData("TreeItem.svelte"),
						new TreeItemData("types.ts"),
					]),
					new TreeItemData("index.ts"),
					new TreeItemData("tree.svelte.ts"),
				]),
				new TreeItemData("package.json"),
				new TreeItemData("README.md"),
			]),
			new TreeItemData("svelte-material-ripple", [
				new TreeItemData("src", [
					new TreeItemData("Ripple.svelte"),
					new TreeItemData("index.ts"),
				]),
				new TreeItemData("package.json"),
				new TreeItemData("README.md"),
			]),
		]),
		new TreeItemData("Documents", [
			new TreeItemData("Project Planning", [
				new TreeItemData("q1-goals.xlsx"),
				new TreeItemData("timeline.pdf"),
			]),
			new TreeItemData("meeting-notes.docx"),
			new TreeItemData("resume.pdf"),
		]),
		new TreeItemData("Downloads", [
			new TreeItemData("conference-slides.pptx"),
			new TreeItemData("typescript-cheatsheet.pdf"),
		]),
		new TreeItemData("Movies", [
			new TreeItemData("Finding Nemo.mp4"),
			new TreeItemData("Inside Out.mp4"),
			new TreeItemData("Up.mp4"),
		]),
		new TreeItemData("Pictures", [
			new TreeItemData("Screenshots", [
				new TreeItemData("bug-report.png"),
				new TreeItemData("component-diagram.png"),
				new TreeItemData("design-mockup.png"),
			]),
			new TreeItemData("profile-photo.jpg"),
		]),
		new TreeItemData("Videos", [
			new TreeItemData("Family Trip.mp4"),
			new TreeItemData("Finding Nemo.mp4"),
		]),
	]);

	const expanded_ids = new SvelteSet<string>();

	function on_circular_reference({ source }: OnCircularReferenceArgs<TreeItemData>) {
		toast.error(`Cannot move "${source.data.name}" inside itself`);
	}

	function on_copy({ sources, destination }: OnCopyArgs<TreeItemData>) {
		const destination_children = destination?.data.children ?? root;
		for (const source of sources) {
			const copy = source.data.copy();
			destination_children.push(copy);
		}
	}

	function on_move({ sources, destination }: OnMoveArgs<TreeItemData>) {
		const destination_children = destination?.data.children ?? root;
		for (const source of sources) {
			const index = source.parentChildren.findIndex((data) => data.id === source.id);
			source.parentChildren.splice(index, 1);
			destination_children.push(source.data);
		}
	}

	function on_remove({ removed, nearestRemaining }: OnRemoveArgs<TreeItemData>) {
		for (const item of removed) {
			const index = item.parentChildren.findIndex((data) => data.id === item.id);
			item.parentChildren.splice(index, 1);
		}

		if (nearestRemaining !== undefined) {
			document.getElementById(nearestRemaining.elementId)?.focus();
		}
	}

	function on_toggle_click(event: MouseEvent, item: TreeItemState<TreeItemData>) {
		if (item.expanded) {
			expanded_ids.delete(item.id);
		} else {
			expanded_ids.add(item.id);
		}
		event.preventDefault();
	}
</script>

<Tree
	{root}
	expandedIds={expanded_ids}
	onCircularReference={on_circular_reference}
	onCopy={on_copy}
	onMove={on_move}
	onRemove={on_remove}
	class="py-6"
>
	{#snippet children({ items })}
		{#each items as item (item.id)}
			{@const has_children = item.data.children !== undefined && item.data.children.length !== 0}
			<TreeItem
				{item}
				class="group flex items-center p-3 hover:bg-neutral-200 focus:outline-2 focus:-outline-offset-2 focus:outline-current active:bg-neutral-300 aria-selected:bg-blue-200 aria-selected:text-blue-900 aria-selected:active:bg-blue-300"
				style="padding-inline-start: calc({3 + 6 * item.depth} * var(--spacing))"
			>
				<ChevronDownIcon
					role="presentation"
					data-visible={has_children}
					class="size-6 p-0.5 transition-transform duration-200 group-aria-expanded:-rotate-90 data-[visible=false]:invisible"
					onclick={(event) => on_toggle_click(event, item)}
				/>

				<div class="ps-1 pe-2">
					{#if has_children && item.expanded}
						<FolderOpenIcon role="presentation" class="fill-blue-300" />
					{:else if has_children}
						<FolderIcon role="presentation" class="fill-blue-300" />
					{:else}
						<FileIcon role="presentation" />
					{/if}
				</div>

				<span class="select-none">{item.data.name}</span>
			</TreeItem>
		{/each}
	{/snippet}
</Tree>
