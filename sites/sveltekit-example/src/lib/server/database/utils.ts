import Database from "better-sqlite3";

type DatabaseFile = {
	id: number;
	type: "file" | "folder";
	name: string;
	parent_id: number | null;
	index_in_parent: number;
	created_at: string;
	updated_at: string;
};

export type FileInsert =
	| {
			type: "file";
			name: string;
	  }
	| {
			type: "folder";
			name: string;
			children: Array<FileInsert>;
	  };

export type FileSelect = {
	id: number;
	type: "file" | "folder";
	name: string;
	parentId: number | null;
	index: number;
	createdAt: Date;
	updatedAt: Date;
	children: Array<FileSelect>;
};

export const createDatabase = (filename: string) => {
	const db = new Database(filename);
	db.pragma("foreign_keys = ON");
	db.exec(`
		CREATE TABLE IF NOT EXISTS files (
			id INTEGER NOT NULL PRIMARY KEY,
			type TEXT NOT NULL,
			name TEXT NOT NULL,
			parent_id INTEGER,
			index_in_parent INTEGER NOT NULL,
			created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (parent_id) REFERENCES files (id) ON DELETE CASCADE,
			UNIQUE (parent_id, name)
		);
	`);

	const statements = {
		deleteFile: db.prepare<[params: Pick<DatabaseFile, "id">]>(`
			DELETE FROM files
			WHERE id = :id;
		`),
		getFiles: db.prepare<[], DatabaseFile>(`
			SELECT * FROM files
			ORDER BY index_in_parent;
		`),
		getFile: db.prepare<[params: Pick<DatabaseFile, "id">], DatabaseFile>(`
			SELECT * FROM files
			WHERE id = :id;
		`),
		getParentChildren: db.prepare<[params: Pick<DatabaseFile, "parent_id">], DatabaseFile>(`
			SELECT * FROM files
			WHERE parent_id IS NOT DISTINCT FROM :parent_id
			ORDER BY index_in_parent;
		`),
		insertFile: db.prepare<
			[params: Pick<DatabaseFile, "type" | "name" | "parent_id" | "index_in_parent">]
		>(`
			INSERT INTO files (type, name, parent_id, index_in_parent)
			VALUES (:type, :name, :parent_id, :index_in_parent);
		`),
		moveFile: db.prepare<[params: Pick<DatabaseFile, "id" | "parent_id" | "index_in_parent">]>(`
			UPDATE files
			SET parent_id = :parent_id, index_in_parent = :index_in_parent, updated_at = CURRENT_TIMESTAMP
			WHERE id = :id;
		`),
		renameFile: db.prepare<[params: Pick<DatabaseFile, "id" | "name">]>(`
			UPDATE files
			SET name = :name, updated_at = CURRENT_TIMESTAMP
			WHERE id = :id;
		`),
		shiftParentChildren: db.prepare<
			[
				params: {
					by: number;
					parent_id: DatabaseFile["parent_id"];
					start: number;
				},
			]
		>(`
			UPDATE files
			SET index_in_parent = index_in_parent + :by, updated_at = CURRENT_TIMESTAMP
			WHERE parent_id IS NOT DISTINCT FROM :parent_id and index_in_parent >= :start;
		`),
	};

	const getFiles = (): Array<FileSelect> => {
		const lookup = new Map<number, FileSelect>();
		for (const file of statements.getFiles.all()) {
			lookup.set(file.id, {
				id: file.id,
				type: file.type,
				name: file.name,
				parentId: file.parent_id,
				index: file.index_in_parent,
				createdAt: new Date(file.created_at),
				updatedAt: new Date(file.created_at),
				children: [],
			});
		}

		const files: Array<FileSelect> = [];
		for (const file of lookup.values()) {
			let pushTo: Array<FileSelect>;
			if (file.parentId === null) {
				pushTo = files;
			} else {
				const parent = lookup.get(file.parentId);
				if (parent === undefined) {
					throw new Error(`Parent of ${file.id} not found`);
				}
				if (parent.type !== "folder") {
					throw new Error(`Parent of ${file.id} is not a folder`);
				}
				pushTo = parent.children;
			}

			const index = pushTo.push(file) - 1;
			if (file.index !== index) {
				throw new Error(
					`Expected item ${file.id} to be at index ${file.index}, but it was at ${index}`,
				);
			}
		}
		return files;
	};

	const _insertFiles = (
		parentId: number | null,
		start: number,
		inserted: Array<FileInsert>,
	): void => {
		for (let i = 0; i < inserted.length; i++) {
			const file = inserted[i];
			const result = statements.insertFile.run({
				type: file.type,
				name: file.name,
				parent_id: parentId,
				index_in_parent: start + i,
			});

			if (file.type === "folder") {
				_insertFiles(result.lastInsertRowid as number, 0, file.children);
			}
		}
	};

	const insertFiles = db.transaction(
		({
			parentId,
			start,
			inserted,
		}: {
			parentId: number | null;
			start: number;
			inserted: Array<FileInsert>;
		}): void => {
			statements.shiftParentChildren.run({
				by: inserted.length,
				parent_id: parentId,
				start,
			});
			_insertFiles(parentId, start, inserted);
		},
	);

	const renameFile = ({ id, name }: { id: number; name: string }): void => {
		statements.renameFile.run({ id, name });
	};

	const moveFiles = db.transaction(
		(
			moved: Array<{
				id: number;
				parentId: number | null;
				index: number;
			}>,
		): void => {
			for (const { id, parentId, index } of moved) {
				statements.moveFile.run({
					id,
					parent_id: parentId,
					index_in_parent: index,
				});
			}
		},
	);

	const deleteFiles = db.transaction((ids: Array<number>): void => {
		const parentIds = new Set<number | null>();
		for (const id of ids) {
			const file = statements.getFile.get({ id });
			if (file !== undefined) {
				parentIds.add(file.parent_id);
				statements.deleteFile.run({ id });
			}
		}

		for (const parentId of parentIds) {
			const children = statements.getParentChildren.all({
				parent_id: parentId,
			});
			for (let i = 0; i < children.length; i++) {
				const child = children[i];
				if (child.index_in_parent !== i) {
					statements.moveFile.run({
						id: child.id,
						parent_id: parentId,
						index_in_parent: i,
					});
				}
			}
		}
	});

	return {
		getFiles,
		insertFiles,
		renameFile,
		moveFiles,
		deleteFiles,
	};
};
