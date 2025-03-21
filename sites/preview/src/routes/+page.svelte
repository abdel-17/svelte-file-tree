<script lang="ts">
	import {
		FileNode,
		FileTree,
		FolderNode,
		type AlreadyExistsErrorArgs,
		type CircularReferenceErrorArgs,
	} from "svelte-file-tree";
	import { StyledTree } from "svelte-file-tree-styled";
	import { toast } from "svelte-sonner";

	const tree = new FileTree([
		new FolderNode({
			id: "0",
			data: {
				name: "Documents",
			},
			children: [
				new FolderNode({
					id: "1",
					data: {
						name: "Work",
					},
					children: [
						new FolderNode({
							id: "2",
							data: {
								name: "Projects",
							},
							children: [
								new FileNode({
									id: "3",
									data: {
										name: "project_a.md",
									},
								}),
								new FileNode({
									id: "4",
									data: {
										name: "project_b.md",
									},
								}),
							],
						}),
						new FileNode({
							id: "5",
							data: {
								name: "q4_report.docx",
							},
						}),
						new FolderNode({
							id: "6",
							data: {
								name: "Meetings",
							},
							children: [
								new FileNode({
									id: "7",
									data: {
										name: "meeting_minutes.txt",
									},
								}),
								new FileNode({
									id: "8",
									data: {
										name: "schedule.pdf",
									},
								}),
							],
						}),
					],
				}),
				new FolderNode({
					id: "9",
					data: {
						name: "Personal",
					},
					children: [
						new FolderNode({
							id: "10",
							data: {
								name: "Recipes",
							},
							children: [
								new FileNode({
									id: "11",
									data: {
										name: "pasta.txt",
									},
								}),
								new FileNode({
									id: "12",
									data: {
										name: "cookies.txt",
									},
								}),
							],
						}),
						new FileNode({
							id: "13",
							data: {
								name: "taxes_2023.pdf",
							},
						}),
					],
				}),
				new FileNode({
					id: "14",
					data: {
						name: "resume.pdf",
					},
				}),
			],
		}),
		new FolderNode({
			id: "15",
			data: {
				name: "Pictures",
			},
			children: [
				new FolderNode({
					id: "16",
					data: {
						name: "Vacation",
					},
					children: [
						new FileNode({
							id: "17",
							data: {
								name: "beach.jpg",
							},
						}),
						new FileNode({
							id: "18",
							data: {
								name: "mountain.jpg",
							},
						}),
					],
				}),
				new FileNode({
					id: "19",
					data: {
						name: "profile.jpg",
					},
				}),
			],
		}),
		new FileNode({
			id: "20",
			data: {
				name: "notes.txt",
			},
		}),
	]);

	function handleAlreadyExistsError({ name }: AlreadyExistsErrorArgs): void {
		toast.error(`An item with the name "${name}" already exists`);
	}

	function handleCircularReferenceError({ target, position }: CircularReferenceErrorArgs): void {
		toast.error(`Cannot move "${target.data.name}" ${position} itself`);
	}
</script>

<main class="p-8">
	<StyledTree
		{tree}
		isItemEditable
		onAlreadyExistsError={handleAlreadyExistsError}
		onCircularReferenceError={handleCircularReferenceError}
	/>
</main>
