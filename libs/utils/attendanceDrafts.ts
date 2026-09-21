interface DraftLike {
	attendanceStatus: unknown;
	note: string;
}

/**
 * Shallow equality for per-child attendance draft maps.
 *
 * The attendance screens rebuild their drafts in an effect. Returning a freshly
 * built object from the `setDrafts` updater every time -- even when its contents
 * were unchanged -- meant React always saw new state, re-rendered, and re-ran the
 * effect. While the children/attendances queries were still skipped or loading,
 * that never reached a fixed point: an unbounded render loop pinning a CPU core.
 * Returning `prev` when nothing changed lets React bail out of the re-render.
 */
export const areDraftMapsEqual = <T extends DraftLike>(a: Record<string, T>, b: Record<string, T>): boolean => {
	const aKeys = Object.keys(a);
	if (aKeys.length !== Object.keys(b).length) return false;

	return aKeys.every((key) => {
		const other = b[key];
		return other !== undefined && a[key].attendanceStatus === other.attendanceStatus && a[key].note === other.note;
	});
};
