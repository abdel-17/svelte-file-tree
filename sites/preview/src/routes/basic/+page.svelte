<script lang="ts">
	import Tree from "$lib/Tree.svelte";
	import TreeItem from "$lib/TreeItem.svelte";
	import { FileNode, FileTree, FolderNode, type FileTreeNode } from "$lib/tree.svelte.js";

	const KB = 1024;
	const MB = 1024 * KB;
	const GB = 1024 * MB;

	function createFile(name: string, size: number) {
		return new FileNode({
			id: crypto.randomUUID(),
			name,
			size,
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
	const root = new FileTree([
		createFolder("Applications", [
			createFile("App Store.app", 50 * MB),
			createFile("FaceTime.app", 30 * MB),
			createFile("Mail.app", 20 * MB),
			createFile("Messages.app", 35 * MB),
			createFile("Music.app", 100 * MB),
			createFile("Safari.app", 70 * MB),
		]),
		createFolder("Developer", [
			createFolder("svelte-file-tree", [
				createFolder("src", [
					createFolder("components", [
						createFile("Tree.svelte", 11 * KB),
						createFile("TreeItem.svelte", 5 * KB),
						createFile("VirtualList.svelte", 5 * KB),
						createFile("types.ts", 3 * KB),
					]),
					createFile("index.ts", 900),
					createFile("tree.svelte.ts", 7 * KB),
				]),
				createFile("package.json", 10 * KB),
				createFile("README.md", 15 * KB),
			]),
			createFolder("svelte-material-ripple", [
				createFolder("src", [
					createFile("Ripple.svelte", 5 * KB),
					createFile("index.ts", 1 * KB),
				]),
				createFile("package.json", 12 * KB),
				createFile("README.md", 18 * KB),
			]),
		]),
		createFolder("Documents", [
			createFolder("Project Planning", [
				createFile("q1-goals.xlsx", 10 * MB),
				createFile("timeline.pdf", 20 * MB),
			]),
			createFile("meeting-notes.docx", 10 * MB),
			createFile("resume.pdf", 10 * MB),
		]),
		createFolder("Downloads", [
			createFile("conference-slides.pptx", 33 * MB),
			createFile("typescript-cheatsheet.pdf", 10 * MB),
		]),
		createFolder("Movies", [
			createFile("Finding Nemo.mp4", 1.5 * GB),
			createFile("Inside Out.mp4", 1 * GB),
			createFile("Up.mp4", 2 * GB),
		]),
		createFolder("Pictures", [
			createFolder("Screenshots", [
				createFile("bug-report.png", 1 * MB),
				createFile("component-diagram.png", 3 * MB),	
				createFile("design-mockup.png", 2 * MB),
			]),
			createFile("profile-photo.jpg", 6 * MB),
		]),
		createFolder("Videos", [
			createFile("Family Trip.mp4", 300 * MB),
			createFile("Finding Nemo.mp4", 1.5 * GB),
		]),
	]);
</script>

<Tree {root} class="min-h-svh scroll-p-6 p-6">
	{#snippet children({ visibleItems })}
		{#each visibleItems as item, order (item.node.id)}
			<TreeItem {item} {order} />
		{/each}
	{/snippet}
</Tree>
