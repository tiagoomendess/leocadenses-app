/**
 * The visitor's IP for throttling. adapter-node reads it from ADDRESS_HEADER (CF-Connecting-IP
 * in production) and throws when a request lacks it, e.g. one that reached nginx without going
 * through Cloudflare. Such requests share one "unknown" bucket instead of failing with a 500.
 */
export function clientIp(getClientAddress: () => string): string {
	try {
		return getClientAddress() || 'unknown';
	} catch {
		return 'unknown';
	}
}
