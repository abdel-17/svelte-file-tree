export function findElementById(id: string): HTMLElement {
	const element = document.getElementById(id);
	if (element === null) {
		throw new Error(`Element with id "${id}" not found`);
	}
	return element;
}
