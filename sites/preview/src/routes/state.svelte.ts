export class DialogState<TData, TResult> {
	#data?: TData = $state.raw();
	#resolveOpen?: (result: TResult) => void;

	get data(): TData | undefined {
		return this.#data;
	}

	open(data: TData): Promise<TResult> {
		this.#data = data;
		return new Promise((resolve) => {
			this.#resolveOpen = resolve;
		});
	}

	close(result: TResult): void {
		this.#data = undefined;
		this.#resolveOpen?.(result);
	}
}
