export type DialogStateProps<TResult> = {
	defaultResult: TResult;
};

export const createDialogState = <TData, TResult>({ defaultResult }: DialogStateProps<TResult>) => {
	let dialogData: TData | undefined = $state.raw();
	let resolveOpenDialog: ((result: TResult) => void) | undefined;

	const openDialog = (data: TData): Promise<TResult> => {
		dialogData = data;
		return new Promise((resolve) => {
			resolveOpenDialog = resolve;
		});
	};

	const closeDialog = (result: TResult = defaultResult): void => {
		dialogData = undefined;
		resolveOpenDialog?.(result);
	};

	const dialogOpen = (): boolean => dialogData !== undefined;

	const onDialogOpenChange = (value: boolean): void => {
		if (!value) {
			closeDialog();
		}
	};

	return {
		dialogData: () => dialogData,
		openDialog,
		closeDialog,
		dialogOpen,
		onDialogOpenChange,
	};
};
