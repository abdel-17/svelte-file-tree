<script lang="ts">
	import Tree from "$lib/components/Tree.svelte";
	import { FileNode, FileTree, FolderNode } from "svelte-file-tree";

	const tree = new FileTree([
		new FolderNode({
			id: "0",
			name: "Documents",
			children: [
				new FolderNode({
					id: "1",
					name: "Work",
					children: [
						new FolderNode({
							id: "2",
							name: "Projects",
							children: [
								new FileNode({
									id: "3",
									name: "project_a.md",
								}),
								new FileNode({
									id: "4",
									name: "project_b.md",
								}),
							],
						}),
						new FileNode({
							id: "5",
							name: "q4_report.docx",
						}),
						new FolderNode({
							id: "6",
							name: "Meetings",
							children: [
								new FileNode({
									id: "7",
									name: "meeting_minutes.txt",
								}),
								new FileNode({
									id: "8",
									name: "schedule.pdf",
								}),
							],
						}),
					],
				}),
				new FolderNode({
					id: "9",
					name: "Personal",
					children: [
						new FolderNode({
							id: "10",
							name: "Recipes",
							children: [
								new FileNode({
									id: "11",
									name: "pasta.txt",
								}),
								new FileNode({
									id: "12",
									name: "cookies.txt",
								}),
							],
						}),
						new FileNode({
							id: "13",
							name: "taxes_2023.pdf",
						}),
					],
				}),
				new FileNode({
					id: "14",
					name: "resume.pdf",
				}),
			],
		}),
		new FolderNode({
			id: "15",
			name: "Pictures",
			children: [
				new FolderNode({
					id: "16",
					name: "Vacation",
					children: [
						new FileNode({
							id: "17",
							name: "beach.jpg",
						}),
						new FileNode({
							id: "18",
							name: "mountain.jpg",
						}),
					],
				}),
				new FileNode({
					id: "19",
					name: "profile.jpg",
				}),
			],
		}),
		new FileNode({
			id: "20",
			name: "notes.txt",
		}),
	]);
</script>

<main class="p-8">
	<Tree {tree} isItemEditable />
</main>
