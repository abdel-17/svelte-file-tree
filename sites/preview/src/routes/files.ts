export type FileData = {
	name: string;
	size: number;
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
				size: 10000000,
			},
			{
				name: "Facetime.app",
				size: 15000000,
			},
			{
				name: "Mail.app",
				size: 25000000,
			},
			{
				name: "Messages.app",
				size: 5000000,
			},
			{
				name: "Music.app",
				size: 50000000,
			},
			{
				name: "Safari.app",
				size: 14000000,
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
										size: 3000,
									},
									{
										name: "TreeItem.svelte",
										size: 1100,
									},
									{
										name: "TreeItemInput.svelte",
										size: 2000,
									},
								],
							},
							{
								name: "index.ts",
								size: 500,
							},
							{
								name: "tree.svelte.ts",
								size: 1000,
							},
						],
					},
					{
						name: "package.json",
						size: 2000,
					},
					{
						name: "README.md",
						size: 1000,
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
								size: 200,
							},
							{
								name: "Ripple.svelte",
								size: 10000,
							},
						],
					},
					{
						name: "package.json",
						size: 3000,
					},
					{
						name: "README.md",
						size: 1000,
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
						size: 22000000,
					},
					{
						name: "timeline.pdf",
						size: 1500000,
					},
				],
			},
			{
				name: "meeting-notes.docx",
				size: 10000,
			},
			{
				name: "resume.pdf",
				size: 1200000,
			},
		],
	},
	{
		name: "Downloads",
		children: [
			{
				name: "conference-slides.pptx",
				size: 5000000,
			},
			{
				name: "typescript-cheatsheet.pdf",
				size: 50000,
			},
		],
	},
	{
		name: "Movies",
		children: [
			{
				name: "Finding Nemo.mp4",
				size: 1000000000,
			},
			{
				name: "Inside Out.mp4",
				size: 1000000000,
			},
			{
				name: "Up.mp4",
				size: 1000000000,
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
						size: 300000,
					},
					{
						name: "component-diagram.png",
						size: 400000,
					},
					{
						name: "design-mockup.png",
						size: 350000,
					},
				],
			},
			{
				name: "profile-photo.jpg",
				size: 200000,
			},
		],
	},
];
