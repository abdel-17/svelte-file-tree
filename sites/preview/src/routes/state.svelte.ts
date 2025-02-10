export type DialogStateProps<TResult> = {
	closeResult: TResult;
};

export const createDialogState = <TData, TResult>(props: DialogStateProps<TResult>) => {
	const { closeResult } = props;

	let dialogData: TData | undefined = $state.raw();
	let resolveOpenDialog: (result: TResult) => void;

	const openDialog = (data: TData): Promise<TResult> => {
		dialogData = data;
		return new Promise((resolve) => {
			resolveOpenDialog = resolve;
		});
	};

	const closeDialog = (result: TResult): void => {
		dialogData = undefined;
		resolveOpenDialog?.(result);
	};

	const dialogOpen = (): boolean => dialogData !== undefined;

	const onDialogOpenChange = (value: boolean): void => {
		if (!value) {
			dialogData = undefined;
			resolveOpenDialog?.(closeResult);
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
