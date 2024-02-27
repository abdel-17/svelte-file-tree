import data from "./data.json" with { type: "json" };

export function load() {
	return {
		tree: data,
	};
}
