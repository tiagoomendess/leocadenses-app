/**
 * Process-local sliding-window rate limiter (the app runs as a single PM2 instance). Each key
 * (e.g. a client IP) may act `max` times per `windowMs`.
 */
export function createRateLimiter({ windowMs, max }: { windowMs: number; max: number }) {
	const hits = new Map<string, number[]>();

	function recent(key: string, now: number) {
		const list = (hits.get(key) ?? []).filter((at) => now - at < windowMs);
		if (list.length === 0) hits.delete(key);
		else hits.set(key, list);
		return list;
	}

	return {
		isLimited(key: string, now = Date.now()) {
			return recent(key, now).length >= max;
		},
		record(key: string, now = Date.now()) {
			hits.set(key, [...recent(key, now), now]);
		}
	};
}
