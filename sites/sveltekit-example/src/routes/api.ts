import type { DeleteFilesBody } from "./api/files/delete/+server.js";
import type { InsertFilesBody } from "./api/files/insert/+server.js";
import type { MoveFilesBody } from "./api/files/move/+server.js";
import type { RenameFileBody } from "./api/files/rename/+server.js";

const throwNonOk = (response: Response): Response => {
	if (!response.ok) {
		throw response;
	}
	return response;
};

export const deleteFiles = async (body: DeleteFilesBody): Promise<Response> => {
	const response = await fetch("/api/files/delete", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});
	return throwNonOk(response);
};

export const insertFiles = async (body: InsertFilesBody): Promise<Response> => {
	const response = await fetch("/api/files/insert", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});
	return throwNonOk(response);
};

export const moveFiles = async (body: MoveFilesBody): Promise<Response> => {
	const response = await fetch("/api/files/move", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});
	return throwNonOk(response);
};

export const renameFile = async (body: RenameFileBody): Promise<Response> => {
	const response = await fetch("/api/files/rename", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});
	return throwNonOk(response);
};

export type { DeleteFilesBody, InsertFilesBody, MoveFilesBody, RenameFileBody };
