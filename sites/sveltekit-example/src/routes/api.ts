import type { DeleteFilesBody } from "./api/files/delete/+server.js";
import type { InsertFilesBody } from "./api/files/insert/+server.js";
import type { MoveFilesBody } from "./api/files/move/+server.js";
import type { RenameFileBody } from "./api/files/rename/+server.js";

async function fetchJSON(method: string, url: string, body: unknown): Promise<Response> {
	const response = await fetch(url, {
		method,
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});

	if (!response.ok) {
		throw new Error(response.statusText);
	}

	return response;
}

export function deleteFiles(body: DeleteFilesBody): Promise<Response> {
	return fetchJSON("POST", "/api/files/delete", body);
}

export function insertFiles(body: InsertFilesBody): Promise<Response> {
	return fetchJSON("POST", "/api/files/insert", body);
}

export function moveFiles(body: MoveFilesBody): Promise<Response> {
	return fetchJSON("POST", "/api/files/move", body);
}

export function renameFile(body: RenameFileBody): Promise<Response> {
	return fetchJSON("POST", "/api/files/rename", body);
}

export type { DeleteFilesBody, InsertFilesBody, MoveFilesBody, RenameFileBody };
