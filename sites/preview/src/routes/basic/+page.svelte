<script lang="ts">
	import Tree from "$lib/Tree.svelte";
	import TreeItem from "$lib/TreeItem.svelte";
	import { FileNode, FileTree, FolderNode, type FileTreeNode } from "svelte-file-tree";

	function createFile(name: string) {
		return new FileNode({
			id: crypto.randomUUID(),
			name,
		});
	}

	function createFolder(name: string, children: Array<FileTreeNode>) {
		return new FolderNode({
			id: crypto.randomUUID(),
			name,
			children,
		});
	}

	// prettier-ignore
	const root = new FileTree<FileTreeNode>([
		createFolder("Applications", [
			createFile("App Store.app"),
			createFile("FaceTime.app"),
			createFile("Mail.app"),
			createFile("Messages.app"),
			createFile("Music.app"),
			createFile("Safari.app"),
		]),
		createFolder("Developer", [
			createFolder("svelte-file-tree", [
				createFolder("src", [
					createFolder("components", [
						createFile("Tree.svelte"),
						createFile("TreeItem.svelte"),
						createFile("VirtualList.svelte"),
						createFile("types.ts"),
					]),
					createFile("index.ts"),
					createFile("tree.svelte.ts"),
				]),
				createFile("package.json"),
				createFile("README.md"),
			]),
			createFolder("svelte-material-ripple", [
				createFolder("src", [
					createFile("Ripple.svelte"),
					createFile("index.ts"),
				]),
				createFile("package.json"),
				createFile("README.md"),
			]),
		]),
		createFolder("Documents", [
			createFolder("Project Planning", [
				createFile("q1-goals.xlsx"),
				createFile("timeline.pdf"),
			]),
			createFile("meeting-notes.docx"),
			createFile("resume.pdf"),
		]),
		createFolder("Downloads", [
			createFile("conference-slides.pptx"),
			createFile("typescript-cheatsheet.pdf"),
		]),
		createFolder("Movies", [
			createFile("Finding Nemo.mp4"),
			createFile("Inside Out.mp4"),
			createFile("Up.mp4"),
		]),
		createFolder("Pictures", [
			createFolder("Screenshots", [
				createFile("bug-report.png"),
				createFile("component-diagram.png"),
				createFile("design-mockup.png"),
			]),
			createFile("profile-photo.jpg"),
		]),
		createFolder("Videos", [
			createFile("Family Trip.mp4"),
			createFile("Finding Nemo.mp4"),
		]),
	]);
</script>

<Tree {root} class="min-h-svh p-6">
	{#snippet children({ items })}
		{#each items as item}
			{#if item.visible}
				<TreeItem {item} />
			{/if}
		{/each}
	{/snippet}
</Tree>
