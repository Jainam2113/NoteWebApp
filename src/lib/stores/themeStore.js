import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

// Theme types
/**
 * @typedef {'light' | 'dark' | 'system'} ThemeMode
 */

/**
 * @typedef {Object} ThemePreferences
 * @property {ThemeMode} mode - Current theme mode
 * @property {boolean} reducedMotion - Prefer reduced motion
 * @property {boolean} highContrast - High contrast mode
 * @property {number} fontSize - Font size multiplier (0.8-1.2)
 * @property {string} fontFamily - Font family preference
 * @property {boolean} compactMode - Compact UI mode
 */

// Constants
const THEME_STORAGE_KEY = 'advanced-notes-theme';
const DEFAULT_PREFERENCES = {
    mode: 'system',
    reducedMotion: false,
    highContrast: false,
    fontSize: 1.0,
    fontFamily: 'inter',
    compactMode: false
};

// Internal stores
const preferences = writable(DEFAULT_PREFERENCES);
const systemTheme = writable('light');

// Initialize theme from localStorage and system preferences
function initializeTheme() {
    if (!browser) return;

    try {
        // Load saved preferences
        const saved = localStorage.getItem(THEME_STORAGE_KEY);
        if (saved) {
            const savedPrefs = JSON.parse(saved);
            preferences.set({ ...DEFAULT_PREFERENCES, ...savedPrefs });
        }

        // Detect system theme
        updateSystemTheme();

        // Listen for system theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', updateSystemTheme);

        // Detect system motion preference
        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        if (motionQuery.matches) {
            preferences.update(prefs => ({ ...prefs, reducedMotion: true }));
        }

        // Detect system contrast preference
        const contrastQuery = window.matchMedia('(prefers-contrast: high)');
        if (contrastQuery.matches) {
            preferences.update(prefs => ({ ...prefs, highContrast: true }));
        }

    } catch (error) {
        console.error('Failed to initialize theme:', error);
    }
}

// Update system theme detection
function updateSystemTheme() {
    if (!browser) return;

    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    systemTheme.set(isDark ? 'dark' : 'light');
}

// Save preferences to localStorage
function savePreferences(prefs) {
    if (!browser) return;

    try {
        localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(prefs));
    } catch (error) {
        console.error('Failed to save theme preferences:', error);
    }
}

// Apply theme to document
function applyTheme(resolvedTheme, prefs) {
    if (!browser) return;

    const html = document.documentElement;
    const body = document.body;

    // Apply theme class
    html.classList.remove('light', 'dark');
    html.classList.add(resolvedTheme);

    // Apply accessibility preferences
    html.classList.toggle('reduce-motion', prefs.reducedMotion);
    html.classList.toggle('high-contrast', prefs.highContrast);
    html.classList.toggle('compact-mode', prefs.compactMode);

    // Apply font preferences
    body.style.fontSize = `${prefs.fontSize}rem`;

    const fontFamilyMap = {
        inter: 'Inter, system-ui, sans-serif',
        system: 'system-ui, -apple-system, sans-serif',
        mono: 'JetBrains Mono, Monaco, Cascadia Code, monospace'
    };

    body.style.fontFamily = fontFamilyMap[prefs.fontFamily] || fontFamilyMap.inter;

    // Update meta theme-color
    const themeColor = resolvedTheme === 'dark' ? '#1e293b' : '#ffffff';
    let metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
        metaTheme.setAttribute('content', themeColor);
    } else {
        metaTheme = document.createElement('meta');
        metaTheme.name = 'theme-color';
        metaTheme.content = themeColor;
        document.head.appendChild(metaTheme);
    }
}

// Derived stores
const resolvedTheme = derived(
    [preferences, systemTheme],
    ([$preferences, $systemTheme]) => {
        if ($preferences.mode === 'system') {
            return $systemTheme;
        }
        return $preferences.mode;
    }
);

const isDark = derived(resolvedTheme, $resolvedTheme => $resolvedTheme === 'dark');

const themeConfig = derived(
    [preferences, resolvedTheme],
    ([$preferences, $resolvedTheme]) => ({
        ...$preferences,
        resolvedTheme: $resolvedTheme,
        isDark: $resolvedTheme === 'dark'
    })
);

// React to theme changes
if (browser) {
    // Apply theme when it changes
    themeConfig.subscribe(config => {
        applyTheme(config.resolvedTheme, config);
    });

    // Save preferences when they change
    preferences.subscribe(prefs => {
        savePreferences(prefs);
    });
}

// Theme actions
const themeActions = {
    // Set theme mode
    setMode(mode) {
        preferences.update(prefs => ({ ...prefs, mode }));
    },

    // Toggle between light and dark
    toggle() {
        preferences.update(prefs => {
            const newMode = prefs.mode === 'light' ? 'dark' :
                prefs.mode === 'dark' ? 'light' :
                    'light'; // default for system
            return { ...prefs, mode: newMode };
        });
    },

    // Accessibility preferences
    setReducedMotion(enabled) {
        preferences.update(prefs => ({ ...prefs, reducedMotion: enabled }));
    },

    setHighContrast(enabled) {
        preferences.update(prefs => ({ ...prefs, highContrast: enabled }));
    },

    setCompactMode(enabled) {
        preferences.update(prefs => ({ ...prefs, compactMode: enabled }));
    },

    // Typography preferences
    setFontSize(size) {
        const clampedSize = Math.max(0.8, Math.min(1.2, size));
        preferences.update(prefs => ({ ...prefs, fontSize: clampedSize }));
    },

    increaseFontSize() {
        preferences.update(prefs => ({
            ...prefs,
            fontSize: Math.min(1.2, prefs.fontSize + 0.1)
        }));
    },

    decreaseFontSize() {
        preferences.update(prefs => ({
            ...prefs,
            fontSize: Math.max(0.8, prefs.fontSize - 0.1)
        }));
    },

    resetFontSize() {
        preferences.update(prefs => ({ ...prefs, fontSize: 1.0 }));
    },

    setFontFamily(family) {
        preferences.update(prefs => ({ ...prefs, fontFamily: family }));
    },

    // Reset all preferences
    reset() {
        preferences.set(DEFAULT_PREFERENCES);
    },

    // Utility functions
    getSystemTheme() {
        if (!browser) return 'light';
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    },

    // Color scheme utilities for dynamic styling
    getColorValue(colorName) {
        if (!browser) return '';
        return getComputedStyle(document.documentElement)
            .getPropertyValue(`--color-${colorName}`)
            .trim();
    }
};

// Available theme options for UI
export const THEME_OPTIONS = {
    modes: [
        { value: 'light', label: 'Light', icon: 'sun' },
        { value: 'dark', label: 'Dark', icon: 'moon' },
        { value: 'system', label: 'System', icon: 'monitor' }
    ],
    fontFamilies: [
        { value: 'inter', label: 'Inter (Default)', preview: 'The quick brown fox jumps over the lazy dog' },
        { value: 'system', label: 'System Font', preview: 'The quick brown fox jumps over the lazy dog' },
        { value: 'mono', label: 'Monospace', preview: 'The quick brown fox jumps over the lazy dog' }
    ],
    fontSizes: [
        { value: 0.8, label: 'Small' },
        { value: 0.9, label: 'Medium Small' },
        { value: 1.0, label: 'Medium (Default)' },
        { value: 1.1, label: 'Medium Large' },
        { value: 1.2, label: 'Large' }
    ]
};

// Initialize on module load
if (browser) {
    initializeTheme();
}

// Export stores and actions
export {
    preferences,
    systemTheme,
    resolvedTheme,
    isDark,
    themeConfig,
    themeActions
};

// Export convenience hooks
export const useTheme = () => ({
    subscribe: themeConfig.subscribe,
    ...themeActions
});

export const useIsDark = () => ({
    subscribe: isDark.subscribe
});

// Export CSS custom properties helper
export const getCSSCustomProperty = (property) => {
    if (!browser) return '';
    return getComputedStyle(document.documentElement)
        .getPropertyValue(property)
        .trim();
};

// Export theme media query helpers
export const createThemeMediaQuery = (callback) => {
    if (!browser) return () => {};

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', callback);

    return () => {
        mediaQuery.removeEventListener('change', callback);
    };
};

export const createMotionMediaQuery = (callback) => {
    if (!browser) return () => {};

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    mediaQuery.addEventListener('change', callback);

    return () => {
        mediaQuery.removeEventListener('change', callback);
    };
};