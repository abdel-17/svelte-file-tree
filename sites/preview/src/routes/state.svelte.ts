export const createDialogState = <TData, TResult>() => {
	let dialogData: TData | undefined = $state.raw();
	let resolveOpenDialogPromise: (result?: TResult) => void;

	const openDialog = (data: TData): Promise<TResult | undefined> => {
		dialogData = data;
		return new Promise((resolve) => {
			resolveOpenDialogPromise = resolve;
		});
	};

	const closeDialog = (result?: TResult): void => {
		dialogData = undefined;
		resolveOpenDialogPromise?.(result);
	};

	const dialogOpen = (): boolean => dialogData !== undefined;

	const onDialogOpenChange = (value: boolean): void => {
		if (!value) {
			closeDialog();
		}
	};

	return {
		dialogData: () => dialogData,
		dialogOpen,
		onDialogOpenChange,
		openDialog,
		closeDialog,
	};
};
