<script lang="ts">
	import { Node } from "$lib/tree.svelte";
	import { ChevronDownIcon, FileIcon, FolderIcon, FolderOpenIcon } from "@lucide/svelte";
	import { SvelteSet } from "svelte/reactivity";
	import {
		Tree,
		TreeItem,
		TreeItemData,
		type OnCircularReferenceArgs,
		type OnCopyArgs,
		type OnMoveArgs,
		type OnRemoveArgs,
	} from "svelte-file-tree";
	import { toast } from "svelte-sonner";

	// prettier-ignore
	const root = $state([
		new Node("Applications", [
			new Node("App Store.app"),
			new Node("FaceTime.app"),
			new Node("Mail.app"),
			new Node("Messages.app"),
			new Node("Music.app"),
			new Node("Safari.app"),
		]),
		new Node("Developer", [
			new Node("svelte-file-tree", [
				new Node("src", [
					new Node("components", [
						new Node("Tree.svelte"),
						new Node("TreeItem.svelte"),
						new Node("types.ts"),
					]),
					new Node("index.ts"),
					new Node("tree.svelte.ts"),
				]),
				new Node("package.json"),
				new Node("README.md"),
			]),
			new Node("svelte-material-ripple", [
				new Node("src", [
					new Node("Ripple.svelte"),
					new Node("index.ts"),
				]),
				new Node("package.json"),
				new Node("README.md"),
			]),
		]),
		new Node("Documents", [
			new Node("Project Planning", [
				new Node("q1-goals.xlsx"),
				new Node("timeline.pdf"),
			]),
			new Node("meeting-notes.docx"),
			new Node("resume.pdf"),
		]),
		new Node("Downloads", [
			new Node("conference-slides.pptx"),
			new Node("typescript-cheatsheet.pdf"),
		]),
		new Node("Movies", [
			new Node("Finding Nemo.mp4"),
			new Node("Inside Out.mp4"),
			new Node("Up.mp4"),
		]),
		new Node("Pictures", [
			new Node("Screenshots", [
				new Node("bug-report.png"),
				new Node("component-diagram.png"),
				new Node("design-mockup.png"),
			]),
			new Node("profile-photo.jpg"),
		]),
		new Node("Videos", [
			new Node("Family Trip.mp4"),
			new Node("Finding Nemo.mp4"),
		]),
	]);

	const expanded_ids = new SvelteSet<string>();

	function on_circular_reference({ source }: OnCircularReferenceArgs<Node>) {
		toast.error(`Cannot move "${source.data.name}" inside itself`);
	}

	function on_copy({ sources, destination }: OnCopyArgs<Node>) {
		const destination_children = destination?.data.children ?? root;
		for (const source of sources) {
			const copy = source.data.copy();
			destination_children.push(copy);
		}
	}

	function on_move({ sources, destination }: OnMoveArgs<Node>) {
		const destination_children = destination?.data.children ?? root;
		for (const source of sources) {
			const index = source.parentChildren.findIndex((data) => data.id === source.id);
			source.parentChildren.splice(index, 1);
			destination_children.push(source.data);
		}
	}

	function on_remove({ removed, nearestRemaining }: OnRemoveArgs<Node>) {
		for (const item of removed) {
			const index = item.parentChildren.findIndex((data) => data.id === item.id);
			item.parentChildren.splice(index, 1);
		}

		if (nearestRemaining !== undefined) {
			document.getElementById(nearestRemaining.elementId)?.focus();
		}
	}

	function on_toggle_click(event: MouseEvent, item: TreeItemData<Node>) {
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
			<TreeItem
				{item}
				class="group flex items-center p-3 hover:bg-neutral-200 focus:outline-2 focus:-outline-offset-2 focus:outline-current active:bg-neutral-300 aria-selected:bg-blue-200 aria-selected:text-blue-900 aria-selected:active:bg-blue-300"
				style="padding-inline-start: calc({3 + 6 * item.depth} * var(--spacing))"
			>
				<ChevronDownIcon
					role="presentation"
					data-visible={item.hasChildren}
					class="size-6 p-0.5 transition-transform duration-200 group-aria-expanded:-rotate-90 data-[visible=false]:invisible"
					onclick={(event) => on_toggle_click(event, item)}
				/>

				<div class="ps-1 pe-2">
					{#if item.hasChildren && item.expanded}
						<FolderOpenIcon role="presentation" class="fill-blue-300" />
					{:else if item.hasChildren}
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
