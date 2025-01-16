export class Ref<TCurrent> {
	readonly get: () => TCurrent;

	constructor(get: () => TCurrent) {
		this.get = get;
	}

	get current(): TCurrent {
		return this.get();
	}
}
