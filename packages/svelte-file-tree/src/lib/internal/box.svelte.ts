export type Box<T> = {
	readonly current: T;
	readonly get: () => T;
};

export type WritableBox<T> = {
	current: T;
	readonly get: () => T;
	readonly set: (value: T) => void;
};

export class Ref<T> {
	constructor(readonly get: () => T) {
		this.get = get;
	}

	get current() {
		return this.get();
	}
}

export class WritableRef<T> {
	constructor(
		readonly get: () => T,
		readonly set: (value: T) => void,
	) {
		this.get = get;
		this.set = set;
	}

	get current() {
		return this.get();
	}

	set current(value) {
		this.set(value);
	}
}
