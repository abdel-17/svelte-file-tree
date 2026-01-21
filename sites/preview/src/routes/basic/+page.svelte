<script lang="ts">
	import { TreeNode } from "$lib/tree.svelte";
	import { ChevronDownIcon, FileIcon, FolderIcon, FolderOpenIcon } from "@lucide/svelte";
	import { SvelteSet } from "svelte/reactivity";
	import {
		Tree,
		TreeItem,
		type OnCircularReferenceArgs,
		type OnCopyArgs,
		type OnCutArgs,
		type OnRemoveArgs,
		type PasteOperation,
		type TreeItemState,
	} from "svelte-file-tree";
	import { toast } from "svelte-sonner";

	// prettier-ignore
	const root = $state([
		new TreeNode("Applications", [
			new TreeNode("App Store.app"),
			new TreeNode("FaceTime.app"),
			new TreeNode("Mail.app"),
			new TreeNode("Messages.app"),
			new TreeNode("Music.app"),
			new TreeNode("Safari.app"),
		]),
		new TreeNode("Developer", [
			new TreeNode("svelte-file-tree", [
				new TreeNode("src", [
					new TreeNode("components", [
						new TreeNode("Tree.svelte"),
						new TreeNode("TreeItem.svelte"),
						new TreeNode("types.ts"),
					]),
					new TreeNode("index.ts"),
					new TreeNode("tree.svelte.ts"),
				]),
				new TreeNode("package.json"),
				new TreeNode("README.md"),
			]),
			new TreeNode("svelte-material-ripple", [
				new TreeNode("src", [
					new TreeNode("Ripple.svelte"),
					new TreeNode("index.ts"),
				]),
				new TreeNode("package.json"),
				new TreeNode("README.md"),
			]),
		]),
		new TreeNode("Documents", [
			new TreeNode("Project Planning", [
				new TreeNode("q1-goals.xlsx"),
				new TreeNode("timeline.pdf"),
			]),
			new TreeNode("meeting-notes.docx"),
			new TreeNode("resume.pdf"),
		]),
		new TreeNode("Downloads", [
			new TreeNode("conference-slides.pptx"),
			new TreeNode("typescript-cheatsheet.pdf"),
		]),
		new TreeNode("Movies", [
			new TreeNode("Finding Nemo.mp4"),
			new TreeNode("Inside Out.mp4"),
			new TreeNode("Up.mp4"),
		]),
		new TreeNode("Pictures", [
			new TreeNode("Screenshots", [
				new TreeNode("bug-report.png"),
				new TreeNode("component-diagram.png"),
				new TreeNode("design-mockup.png"),
			]),
			new TreeNode("profile-photo.jpg"),
		]),
		new TreeNode("Videos", [
			new TreeNode("Family Trip.mp4"),
			new TreeNode("Finding Nemo.mp4"),
		]),
	]);

	const expanded_ids = new SvelteSet<string>();
	const clipboard_ids = new SvelteSet<string>();
	let paste_operation: PasteOperation | undefined = $state.raw();

	function on_circular_reference({ source }: OnCircularReferenceArgs<TreeNode>) {
		toast.error(`Cannot move "${source.node.name}" inside itself`);
	}

	function on_copy({ sources, destination }: OnCopyArgs<TreeNode>) {
		const destination_children = destination?.node.children ?? root;
		for (const source of sources) {
			const copy = source.node.copy();
			destination_children.push(copy);
		}
	}

	function on_cut({ sources, destination }: OnCutArgs<TreeNode>) {
		const destination_children = destination?.node.children ?? root;
		for (const source of sources) {
			const index = source.parentChildren.findIndex((node) => node.id === source.id);
			source.parentChildren.splice(index, 1);
			destination_children.push(source.node);
		}

		clipboard_ids.clear();
		paste_operation = undefined;
	}

	function on_remove({ sources, nearestRemaining }: OnRemoveArgs<TreeNode>) {
		for (const source of sources) {
			const index = source.parentChildren.findIndex((node) => node.id === source.id);
			source.parentChildren.splice(index, 1);
		}

		if (nearestRemaining !== undefined) {
			document.getElementById(nearestRemaining.elementId)?.focus();
		}
	}

	function on_toggle_click(event: MouseEvent, item: TreeItemState<TreeNode>) {
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
	clipboardIds={clipboard_ids}
	bind:pasteOperation={paste_operation}
	onCircularReference={on_circular_reference}
	onCopy={on_copy}
	onCut={on_cut}
	onRemove={on_remove}
	class="py-6"
>
	{#snippet children({ items })}
		{#each items as item (item.id)}
			{@const children = item.node.children}
			<TreeItem
				{item}
				class="group flex items-center p-3 hover:bg-neutral-200 focus:outline-2 focus:-outline-offset-2 focus:outline-current active:bg-neutral-300 aria-selected:bg-blue-200 aria-selected:text-blue-900 aria-selected:active:bg-blue-300"
				style="padding-inline-start: calc({3 + 6 * item.depth} * var(--spacing))"
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
			</TreeItem>
		{/each}
	{/snippet}
</Tree>
