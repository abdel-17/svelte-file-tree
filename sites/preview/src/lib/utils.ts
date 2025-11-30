export function arabicNumbers(text: string) {
	return text.replace(/[0-9]/g, (digit) => "٠١٢٣٤٥٦٧٨٩".charAt(+digit));
}
