import { db } from "$lib/server/database/index.js";
import type { ServerInit } from "@sveltejs/kit";

type RecursiveFileInsert =
	| {
			type: "file";
			name: string;
	  }
	| {
			type: "folder";
			name: string;
			children: ReadonlyArray<RecursiveFileInsert>;
	  };

const insertFiles = db.transaction(function insertFiles(
	files: ReadonlyArray<RecursiveFileInsert>,
	parentId: number | null = null,
): void {
	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		const result = db.insertFile({
			type: file.type,
			name: file.name,
			parent_id: parentId,
			index_in_parent: i,
		});

		if (file.type === "folder") {
			insertFiles(file.children, result.lastInsertRowid as number);
		}
	}
});

const seedDatabase = (): void => {
	insertFiles([
		{
			type: "folder",
			name: "Documents",
			children: [
				{
					type: "folder",
					name: "Work",
					children: [
						{
							type: "folder",
							name: "Projects",
							children: [
								{
									type: "file",
									name: "project_a.md",
								},
								{
									type: "file",
									name: "project_b.md",
								},
							],
						},
						{
							type: "file",
							name: "q4_report.docx",
						},
						{
							type: "folder",
							name: "Meetings",
							children: [
								{
									type: "file",
									name: "meeting_minutes.txt",
								},
								{
									type: "file",
									name: "schedule.pdf",
								},
							],
						},
					],
				},
				{
					type: "folder",
					name: "Personal",
					children: [
						{
							type: "folder",
							name: "Recipes",
							children: [
								{
									type: "file",
									name: "pasta.txt",
								},
								{
									type: "file",
									name: "cookies.txt",
								},
							],
						},
						{
							type: "file",
							name: "taxes_2023.pdf",
						},
					],
				},
				{
					type: "file",
					name: "resume.pdf",
				},
			],
		},
		{
			type: "folder",
			name: "Pictures",
			children: [
				{
					type: "folder",
					name: "Vacation",
					children: [
						{
							type: "file",
							name: "beach.jpg",
						},
						{
							type: "file",
							name: "mountain.jpg",
						},
					],
				},
				{
					type: "file",
					name: "profile.jpg",
				},
			],
		},
		{
			type: "file",
			name: "notes.txt",
		},
	]);
};

export const init: ServerInit = () => {
	seedDatabase();
};
