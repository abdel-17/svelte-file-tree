import type { DeleteFilesBody } from "./api/files/delete/+server.js";
import type { InsertFilesBody } from "./api/files/insert/+server.js";
import type { MoveFilesBody } from "./api/files/move/+server.js";
import type { RenameFileBody } from "./api/files/rename/+server.js";

function throwNonOk(response: Response): Response {
	if (!response.ok) {
		throw new Error(response.statusText);
	}
	return response;
}

export async function deleteFiles(body: DeleteFilesBody): Promise<Response> {
	const response = await fetch("/api/files/delete", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});
	return throwNonOk(response);
}

export async function insertFiles(body: InsertFilesBody): Promise<Response> {
	const response = await fetch("/api/files/insert", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});
	return throwNonOk(response);
}

export async function moveFiles(body: MoveFilesBody): Promise<Response> {
	const response = await fetch("/api/files/move", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});
	return throwNonOk(response);
}

export async function renameFile(body: RenameFileBody): Promise<Response> {
	const response = await fetch("/api/files/rename", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});
	return throwNonOk(response);
}

export type { DeleteFilesBody, InsertFilesBody, MoveFilesBody, RenameFileBody };
