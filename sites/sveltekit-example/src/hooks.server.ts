import { insertFile } from "$lib/server/database.js";
import type { ServerInit } from "@sveltejs/kit";

const seedDatabase = () => {
	insertFile({
		type: "folder",
		name: "Documents",
		parent_id: null,
		index_in_parent: 0,
	});
	insertFile({
		type: "folder",
		name: "Pictures",
		parent_id: null,
		index_in_parent: 1,
	});
	insertFile({
		type: "file",
		name: "notes.txt",
		parent_id: null,
		index_in_parent: 2,
	});

	// Documents
	insertFile({
		type: "folder",
		name: "Work",
		parent_id: 1,
		index_in_parent: 0,
	});
	insertFile({
		type: "folder",
		name: "Personal",
		parent_id: 1,
		index_in_parent: 1,
	});
	insertFile({
		type: "file",
		name: "resume.pdf",
		parent_id: 1,
		index_in_parent: 2,
	});

	// Work
	insertFile({
		type: "folder",
		name: "Projects",
		parent_id: 4,
		index_in_parent: 0,
	});
	insertFile({
		type: "folder",
		name: "Meetings",
		parent_id: 4,
		index_in_parent: 1,
	});
	insertFile({
		type: "file",
		name: "q4_report.docx",
		parent_id: 4,
		index_in_parent: 2,
	});

	// Projects
	insertFile({
		type: "file",
		name: "project_a.md",
		parent_id: 7,
		index_in_parent: 0,
	});
	insertFile({
		type: "file",
		name: "project_b.md",
		parent_id: 7,
		index_in_parent: 1,
	});

	// Meetings
	insertFile({
		type: "file",
		name: "meeting_minutes.txt",
		parent_id: 8,
		index_in_parent: 0,
	});
	insertFile({
		type: "file",
		name: "schedule.pdf",
		parent_id: 8,
		index_in_parent: 1,
	});

	// Personal
	insertFile({
		type: "folder",
		name: "Recipes",
		parent_id: 5,
		index_in_parent: 0,
	});
	insertFile({
		type: "file",
		name: "taxes_2023.pdf",
		parent_id: 5,
		index_in_parent: 1,
	});

	// Recipes
	insertFile({
		type: "file",
		name: "pasta.txt",
		parent_id: 13,
		index_in_parent: 0,
	});
	insertFile({
		type: "file",
		name: "cookies.txt",
		parent_id: 13,
		index_in_parent: 1,
	});

	// Pictures
	insertFile({
		type: "folder",
		name: "Vacation",
		parent_id: 2,
		index_in_parent: 0,
	});
	insertFile({
		type: "file",
		name: "profile.jpg",
		parent_id: 2,
		index_in_parent: 1,
	});

	// Vacation
	insertFile({
		type: "file",
		name: "beach.jpg",
		parent_id: 17,
		index_in_parent: 0,
	});
	insertFile({
		type: "file",
		name: "mountain.jpg",
		parent_id: 17,
		index_in_parent: 1,
	});
};

export const init: ServerInit = () => {
	seedDatabase();
};
