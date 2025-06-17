import { browser } from '$app/environment';

/**
 * @typedef {Object} ShortcutDefinition
 * @property {string} key - Key combination (e.g., 'cmd+s', 'ctrl+shift+n')
 * @property {Function} handler - Function to execute
 * @property {string} description - Human-readable description
 * @property {string} category - Category for grouping (e.g., 'editor', 'navigation')
 * @property {boolean} preventDefault - Whether to prevent default behavior
 * @property {Function} condition - Optional condition function
 */

/**
 * Keyboard shortcut manager for the notes app
 */
export class ShortcutManager {
    constructor() {
        this.shortcuts = new Map();
        this.globalShortcuts = new Map();
        this.isListening = false;
        this.activeElement = null;

        if (browser) {
            this.init();
        }
    }

    init() {
        // Bind event listeners
        this.handleKeydown = this.handleKeydown.bind(this);
        this.handleFocus = this.handleFocus.bind(this);
        this.handleBlur = this.handleBlur.bind(this);

        // Set up global shortcuts that work everywhere
        this.registerGlobalShortcuts();
    }

    /**
     * Start listening for keyboard events
     */
    startListening() {
        if (!browser || this.isListening) return;

        document.addEventListener('keydown', this.handleKeydown, true);
        document.addEventListener('focusin', this.handleFocus);
        document.addEventListener('focusout', this.handleBlur);
        this.isListening = true;
    }

    /**
     * Stop listening for keyboard events
     */
    stopListening() {
        if (!browser || !this.isListening) return;

        document.removeEventListener('keydown', this.handleKeydown, true);
        document.removeEventListener('focusin', this.handleFocus);
        document.removeEventListener('focusout', this.handleBlur);
        this.isListening = false;
    }

    /**
     * Register a keyboard shortcut
     */
    register(definition) {
        const { key, handler, description, category = 'general', preventDefault = true, condition } = definition;
        const normalizedKey = this.normalizeKey(key);

        this.shortcuts.set(normalizedKey, {
            handler,
            description,
            category,
            preventDefault,
            condition,
            originalKey: key
        });
    }

    /**
     * Unregister a keyboard shortcut
     */
    unregister(key) {
        const normalizedKey = this.normalizeKey(key);
        this.shortcuts.delete(normalizedKey);
    }

    /**
     * Register multiple shortcuts at once
     */
    registerMultiple(shortcuts) {
        shortcuts.forEach(shortcut => this.register(shortcut));
    }

    /**
     * Get all registered shortcuts grouped by category
     */
    getShortcutsByCategory() {
        const grouped = {};

        for (const [key, shortcut] of this.shortcuts) {
            if (!grouped[shortcut.category]) {
                grouped[shortcut.category] = [];
            }

            grouped[shortcut.category].push({
                key: shortcut.originalKey,
                description: shortcut.description
            });
        }

        return grouped;
    }

    /**
     * Handle keydown events
     */
    handleKeydown(event) {
        const keyCombo = this.getKeyCombo(event);
        const shortcut = this.shortcuts.get(keyCombo);

        if (shortcut) {
            // Check condition if it exists
            if (shortcut.condition && !shortcut.condition(event)) {
                return;
            }

            // Prevent default if requested
            if (shortcut.preventDefault) {
                event.preventDefault();
                event.stopPropagation();
            }

            // Execute handler
            try {
                shortcut.handler(event);
            } catch (error) {
                console.error('Error executing shortcut handler:', error);
            }
        }
    }

    /**
     * Handle focus events to track active element
     */
    handleFocus(event) {
        this.activeElement = event.target;
    }

    /**
     * Handle blur events
     */
    handleBlur(event) {
        if (this.activeElement === event.target) {
            this.activeElement = null;
        }
    }

    /**
     * Get key combination string from keyboard event
     */
    getKeyCombo(event) {
        const parts = [];

        // Add modifiers
        if (event.ctrlKey || event.metaKey) {
            parts.push(this.isMac() ? 'cmd' : 'ctrl');
        }
        if (event.altKey) {
            parts.push('alt');
        }
        if (event.shiftKey) {
            parts.push('shift');
        }

        // Add main key
        const key = event.key.toLowerCase();

        // Special key mappings
        const keyMap = {
            ' ': 'space',
            'enter': 'enter',
            'escape': 'esc',
            'arrowup': 'up',
            'arrowdown': 'down',
            'arrowleft': 'left',
            'arrowright': 'right',
            'backspace': 'backspace',
            'delete': 'del',
            'tab': 'tab'
        };

        parts.push(keyMap[key] || key);

        return parts.join('+');
    }

    /**
     * Normalize key combination string
     */
    normalizeKey(key) {
        return key
            .toLowerCase()
            .replace(/command|cmd/g, this.isMac() ? 'cmd' : 'ctrl')
            .replace(/control|ctrl/g, this.isMac() ? 'cmd' : 'ctrl')
            .split('+')
            .sort((a, b) => {
                // Sort modifiers in consistent order
                const order = ['ctrl', 'cmd', 'alt', 'shift'];
                const aIndex = order.indexOf(a);
                const bIndex = order.indexOf(b);

                if (aIndex !== -1 && bIndex !== -1) {
                    return aIndex - bIndex;
                }
                if (aIndex !== -1) return -1;
                if (bIndex !== -1) return 1;
                return 0;
            })
            .join('+');
    }

    /**
     * Check if running on Mac
     */
    isMac() {
        if (!browser) return false;
        return navigator.platform.toLowerCase().includes('mac');
    }

    /**
     * Check if element is editable
     */
    isEditableElement(element) {
        if (!element) return false;

        const editableTags = ['input', 'textarea', 'select'];
        const tagName = element.tagName.toLowerCase();

        return (
            editableTags.includes(tagName) ||
            element.contentEditable === 'true' ||
            element.isContentEditable
        );
    }

    /**
     * Register global shortcuts that work throughout the app
     */
    registerGlobalShortcuts() {
        // These shortcuts will be registered by the main app
        // This method is called during initialization
    }

    /**
     * Format key combination for display
     */
    formatKeyCombo(key) {
        const isMac = this.isMac();

        return key
            .split('+')
            .map(part => {
                switch (part.toLowerCase()) {
                    case 'cmd':
                    case 'ctrl':
                        return isMac ? '⌘' : 'Ctrl';
                    case 'alt':
                        return isMac ? '⌥' : 'Alt';
                    case 'shift':
                        return isMac ? '⇧' : 'Shift';
                    case 'enter':
                        return '↵';
                    case 'esc':
                        return 'Esc';
                    case 'space':
                        return 'Space';
                    case 'up':
                        return '↑';
                    case 'down':
                        return '↓';
                    case 'left':
                        return '←';
                    case 'right':
                        return '→';
                    case 'backspace':
                        return '⌫';
                    case 'del':
                        return 'Del';
                    case 'tab':
                        return '⇥';
                    default:
                        return part.toUpperCase();
                }
            })
            .join(isMac ? '' : '+');
    }

    /**
     * Check if a shortcut conflicts with browser shortcuts
     */
    conflictsWithBrowser(key) {
        const browserShortcuts = [
            'ctrl+t', 'cmd+t', // New tab
            'ctrl+w', 'cmd+w', // Close tab
            'ctrl+n', 'cmd+n', // New window
            'ctrl+r', 'cmd+r', // Refresh
            'ctrl+l', 'cmd+l', // Address bar
            'ctrl+d', 'cmd+d', // Bookmark
            'ctrl+f', 'cmd+f', // Find (we override this one)
            'ctrl+shift+t', 'cmd+shift+t', // Reopen tab
            'ctrl+shift+n', 'cmd+shift+n', // New incognito
            'f5', // Refresh
            'f12', // Dev tools
        ];

        const normalizedKey = this.normalizeKey(key);
        return browserShortcuts.some(shortcut =>
            this.normalizeKey(shortcut) === normalizedKey
        );
    }

    /**
     * Destroy the shortcut manager
     */
    destroy() {
        this.stopListening();
        this.shortcuts.clear();
        this.globalShortcuts.clear();
    }
}

// Create global instance
export const shortcutManager = new ShortcutManager();

// Predefined shortcut sets for different contexts

/**
 * Editor shortcuts for rich text editing
 */
export const EDITOR_SHORTCUTS = [
    {
        key: 'ctrl+b',
        description: 'Bold text',
        category: 'formatting',
        handler: (event, editor) => editor?.toggleBold?.()
    },
    {
        key: 'ctrl+i',
        description: 'Italic text',
        category: 'formatting',
        handler: (event, editor) => editor?.toggleItalic?.()
    },
    {
        key: 'ctrl+1',
        description: 'Heading 1',
        category: 'formatting',
        handler: (event, editor) => editor?.setHeading?.(1)
    },
    {
        key: 'ctrl+2',
        description: 'Heading 2',
        category: 'formatting',
        handler: (event, editor) => editor?.setHeading?.(2)
    },
    {
        key: 'ctrl+3',
        description: 'Heading 3',
        category: 'formatting',
        handler: (event, editor) => editor?.setHeading?.(3)
    },
    {
        key: 'ctrl+0',
        description: 'Normal text',
        category: 'formatting',
        handler: (event, editor) => editor?.setHeading?.(0)
    },
    {
        key: 'ctrl+shift+8',
        description: 'Bullet list',
        category: 'formatting',
        handler: (event, editor) => editor?.toggleBulletList?.()
    },
    {
        key: 'ctrl+shift+7',
        description: 'Numbered list',
        category: 'formatting',
        handler: (event, editor) => editor?.toggleOrderedList?.()
    },
    {
        key: 'ctrl+z',
        description: 'Undo',
        category: 'editing',
        handler: (event, editor) => editor?.undo?.()
    },
    {
        key: 'ctrl+y',
        description: 'Redo',
        category: 'editing',
        handler: (event, editor) => editor?.redo?.()
    },
    {
        key: 'ctrl+shift+z',
        description: 'Redo (alternative)',
        category: 'editing',
        handler: (event, editor) => editor?.redo?.()
    }
];

/**
 * Application shortcuts for navigation and actions
 */
export const APP_SHORTCUTS = [
    {
        key: 'ctrl+n',
        description: 'New note',
        category: 'navigation',
        handler: (event, actions) => actions?.createNote?.()
    },
    {
        key: 'ctrl+s',
        description: 'Save note',
        category: 'file',
        handler: (event, actions) => actions?.saveNote?.()
    },
    {
        key: 'ctrl+f',
        description: 'Search notes',
        category: 'navigation',
        handler: (event, actions) => actions?.focusSearch?.()
    },
    {
        key: 'ctrl+k',
        description: 'Command palette',
        category: 'navigation',
        handler: (event, actions) => actions?.openCommandPalette?.()
    },
    {
        key: 'ctrl+shift+d',
        description: 'Toggle dark mode',
        category: 'view',
        handler: (event, actions) => actions?.toggleTheme?.()
    },
    {
        key: 'ctrl+shift+n',
        description: 'New note (alternative)',
        category: 'navigation',
        handler: (event, actions) => actions?.createNote?.()
    },
    {
        key: 'ctrl+delete',
        description: 'Delete current note',
        category: 'file',
        handler: (event, actions) => actions?.deleteCurrentNote?.(),
        condition: (event) => !shortcutManager.isEditableElement(event.target)
    },
    {
        key: 'ctrl+d',
        description: 'Duplicate note',
        category: 'file',
        handler: (event, actions) => actions?.duplicateCurrentNote?.()
    },
    {
        key: 'ctrl+p',
        description: 'Pin/unpin note',
        category: 'organization',
        handler: (event, actions) => actions?.togglePinCurrentNote?.()
    },
    {
        key: 'esc',
        description: 'Close modal/dialog',
        category: 'navigation',
        handler: (event, actions) => actions?.closeModal?.()
    }
];

/**
 * Drawing shortcuts for canvas operations
 */
export const DRAWING_SHORTCUTS = [
    {
        key: 'p',
        description: 'Pen tool',
        category: 'drawing',
        handler: (event, actions) => actions?.selectPenTool?.()
    },
    {
        key: 'r',
        description: 'Rectangle tool',
        category: 'drawing',
        handler: (event, actions) => actions?.selectRectangleTool?.()
    },
    {
        key: 'o',
        description: 'Circle tool',
        category: 'drawing',
        handler: (event, actions) => actions?.selectCircleTool?.()
    },
    {
        key: 'l',
        description: 'Line tool',
        category: 'drawing',
        handler: (event, actions) => actions?.selectLineTool?.()
    },
    {
        key: 'e',
        description: 'Eraser tool',
        category: 'drawing',
        handler: (event, actions) => actions?.selectEraserTool?.()
    },
    {
        key: 'ctrl+z',
        description: 'Undo drawing',
        category: 'drawing',
        handler: (event, actions) => actions?.undoDrawing?.()
    },
    {
        key: 'ctrl+y',
        description: 'Redo drawing',
        category: 'drawing',
        handler: (event, actions) => actions?.redoDrawing?.()
    },
    {
        key: 'ctrl+a',
        description: 'Select all',
        category: 'drawing',
        handler: (event, actions) => actions?.selectAllDrawing?.()
    },
    {
        key: 'delete',
        description: 'Delete selected',
        category: 'drawing',
        handler: (event, actions) => actions?.deleteSelectedDrawing?.()
    }
];

/**
 * Utility function to register shortcuts for a specific context
 */
export function registerShortcuts(shortcuts, context, contextActions) {
    shortcuts.forEach(shortcut => {
        shortcutManager.register({
            ...shortcut,
            handler: (event) => shortcut.handler(event, contextActions),
            condition: shortcut.condition
        });
    });
}

/**
 * Utility function to unregister shortcuts
 */
export function unregisterShortcuts(shortcuts) {
    shortcuts.forEach(shortcut => {
        shortcutManager.unregister(shortcut.key);
    });
}

/**
 * Hook for Svelte components to easily manage shortcuts
 */
export function useShortcuts(shortcuts, actions) {
    if (!browser) return { cleanup: () => {} };

    // Register shortcuts
    registerShortcuts(shortcuts, null, actions);

    // Start listening if not already
    if (!shortcutManager.isListening) {
        shortcutManager.startListening();
    }

    // Return cleanup function
    return {
        cleanup() {
            unregisterShortcuts(shortcuts);
        }
    };
}

/**
 * Get help text for all shortcuts
 */
export function getShortcutHelp() {
    return shortcutManager.getShortcutsByCategory();
}

/**
 * Format shortcut for display in UI
 */
export function formatShortcut(key) {
    return shortcutManager.formatKeyCombo(key);
}

// Export the manager instance as default
export default shortcutManager;