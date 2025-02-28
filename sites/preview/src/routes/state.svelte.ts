export type DialogStateProps<TResult> = {
	defaultResult: TResult;
};

export class DialogState<TData, TResult> {
	readonly #defaultResult: TResult;
	#data?: TData = $state.raw();
	#resolveOpen?: (result: TResult) => void;

	constructor(props: DialogStateProps<TResult>) {
		this.#defaultResult = props.defaultResult;
	}

	get data(): TData | undefined {
		return this.#data;
	}

	open(data: TData): Promise<TResult> {
		this.#data = data;
		return new Promise((resolve) => {
			this.#resolveOpen = resolve;
		});
	}

	close(result: TResult = this.#defaultResult): void {
		this.#data = undefined;
		this.#resolveOpen?.(result);
	}
}
