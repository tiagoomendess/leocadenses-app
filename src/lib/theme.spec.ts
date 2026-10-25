import { describe, expect, it } from 'vitest';
import { chromeColor, themePreference } from './theme';

describe('themePreference', () => {
	it('reads the theme cookie', () => {
		expect(themePreference('dark')).toBe('dark');
		expect(themePreference('light')).toBe('light');
		expect(themePreference(undefined)).toBe('system');
		expect(themePreference('blue')).toBe('system');
	});
});

describe('chromeColor', () => {
	it('follows each system scheme while the site follows the system', () => {
		expect(chromeColor('light', 'system')).toBe('#f9fafb');
		expect(chromeColor('dark', 'system')).toBe('#030712');
	});

	// A phone in light mode showing the site in dark mode must still get a dark status bar.
	it('uses the chosen theme for both schemes', () => {
		expect(chromeColor('light', 'dark')).toBe('#030712');
		expect(chromeColor('dark', 'dark')).toBe('#030712');
		expect(chromeColor('light', 'light')).toBe('#f9fafb');
		expect(chromeColor('dark', 'light')).toBe('#f9fafb');
	});
});
