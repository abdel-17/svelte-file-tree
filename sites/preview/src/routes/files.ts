export type FileData = {
	name: string;
};

export type FolderData = {
	name: string;
	children: Array<FileData | FolderData>;
};

export const files: Array<FileData | FolderData> = [
	{
		name: "Applications",
		children: [
			{
				name: "App Store.app",
			},
			{
				name: "Facetime.app",
			},
			{
				name: "Mail.app",
			},
			{
				name: "Messages.app",
			},
			{
				name: "Music.app",
			},
			{
				name: "Safari.app",
			},
		],
	},
	{
		name: "Developer",
		children: [
			{
				name: "svelte-file-tree",
				children: [
					{
						name: "src",
						children: [
							{
								name: "components",
								children: [
									{
										name: "Tree.svelte",
									},
									{
										name: "TreeItem.svelte",
									},
									{
										name: "TreeItemInput.svelte",
									},
								],
							},
							{
								name: "index.ts",
							},
							{
								name: "tree.svelte.ts",
							},
						],
					},
					{
						name: "package.json",
					},
					{
						name: "README.md",
					},
				],
			},
			{
				name: "svelte-material-ripple",
				children: [
					{
						name: "src",
						children: [
							{
								name: "index.ts",
							},
							{
								name: "Ripple.svelte",
							},
						],
					},
					{
						name: "package.json",
					},
					{
						name: "README.md",
					},
				],
			},
		],
	},
	{
		name: "Documents",
		children: [
			{
				name: "Project Planning",
				children: [
					{
						name: "q1-goals.xlsx",
					},
					{
						name: "timeline.pdf",
					},
				],
			},
			{
				name: "meeting-notes.docx",
			},
			{
				name: "resume.pdf",
			},
		],
	},
	{
		name: "Downloads",
		children: [
			{
				name: "conference-slides.pptx",
			},
			{
				name: "typescript-cheatsheet.pdf",
			},
		],
	},
	{
		name: "Movies",
		children: [
			{
				name: "Finding Nemo.mp4",
			},
			{
				name: "Inside Out.mp4",
			},
			{
				name: "Up.mp4",
			},
		],
	},
	{
		name: "Pictures",
		children: [
			{
				name: "Screenshots",
				children: [
					{
						name: "bug-report.png",
					},
					{
						name: "component-diagram.png",
					},
					{
						name: "design-mockup.png",
					},
				],
			},
			{
				name: "profile-photo.jpg",
			},
		],
	},
];
