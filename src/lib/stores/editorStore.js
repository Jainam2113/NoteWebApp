import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

// Editor state types
/**
 * @typedef {Object} EditorState
 * @property {boolean} isEditing - Whether editor is in edit mode
 * @property {boolean} isFocused - Whether editor has focus
 * @property {boolean} isLoading - Whether editor is loading
 * @property {boolean} hasUnsavedChanges - Whether there are unsaved changes
 * @property {number} wordCount - Current word count
 * @property {number} characterCount - Current character count
 * @property {string} currentFormat - Current text format at cursor
 * @property {Object} selection - Current text selection
 * @property {string[]} history - Undo/redo history
 * @property {number} historyIndex - Current position in history
 */

/**
 * @typedef {Object} EditorPreferences
 * @property {boolean} autoSave - Auto-save enabled
 * @property {number} autoSaveDelay - Auto-save delay in ms
 * @property {boolean} showWordCount - Show word count
 * @property {boolean} showCharacterCount - Show character count
 * @property {boolean} spellCheck - Spell check enabled
 * @property {boolean} typewriterMode - Typewriter scrolling mode
 * @property {boolean} focusMode - Focus mode (highlight current paragraph)
 * @property {string} editorWidth - Editor width preference
 */

// Constants
const EDITOR_STORAGE_KEY = 'advanced-notes-editor-prefs';
const AUTO_SAVE_DELAY = 500;
const MAX_HISTORY_SIZE = 50;

const DEFAULT_PREFERENCES = {
    autoSave: true,
    autoSaveDelay: AUTO_SAVE_DELAY,
    showWordCount: true,
    showCharacterCount: false,
    spellCheck: true,
    typewriterMode: false,
    focusMode: false,
    editorWidth: 'normal' // 'narrow', 'normal', 'wide', 'full'
};

const DEFAULT_STATE = {
    isEditing: false,
    isFocused: false,
    isLoading: false,
    hasUnsavedChanges: false,
    wordCount: 0,
    characterCount: 0,
    currentFormat: {},
    selection: { from: 0, to: 0 },
    history: [],
    historyIndex: -1
};

// Internal stores
const editorState = writable(DEFAULT_STATE);
const editorPreferences = writable(DEFAULT_PREFERENCES);
const editorInstance = writable(null);
const currentContent = writable('');
const lastSavedContent = writable('');

// Auto-save timer
let autoSaveTimer = null;

// Initialize preferences from localStorage
function initializeEditorPreferences() {
    if (!browser) return;

    try {
        const saved = localStorage.getItem(EDITOR_STORAGE_KEY);
        if (saved) {
            const savedPrefs = JSON.parse(saved);
            editorPreferences.set({ ...DEFAULT_PREFERENCES, ...savedPrefs });
        }
    } catch (error) {
        console.error('Failed to load editor preferences:', error);
    }
}

// Save preferences to localStorage
function saveEditorPreferences(prefs) {
    if (!browser) return;

    try {
        localStorage.setItem(EDITOR_STORAGE_KEY, JSON.stringify(prefs));
    } catch (error) {
        console.error('Failed to save editor preferences:', error);
    }
}

// Text analysis utilities
function analyzeText(text) {
    if (!text || typeof text !== 'string') {
        return { wordCount: 0, characterCount: 0 };
    }

    // Remove HTML tags for accurate counting
    const plainText = text.replace(/<[^>]*>/g, '');

    // Count words (split by whitespace, filter empty strings)
    const words = plainText.trim().split(/\s+/).filter(word => word.length > 0);
    const wordCount = plainText.trim() === '' ? 0 : words.length;

    // Count characters (excluding spaces for readability)
    const characterCount = plainText.replace(/\s/g, '').length;

    return { wordCount, characterCount };
}

// Format detection utilities
function detectCurrentFormat(editor) {
    if (!editor) return {};

    const { state } = editor;
    const { $from } = state.selection;

    const format = {
        bold: false,
        italic: false,
        heading: null,
        list: null,
        blockquote: false
    };

    // Check for active marks
    state.storedMarks?.forEach(mark => {
        if (mark.type.name === 'bold') format.bold = true;
        if (mark.type.name === 'italic') format.italic = true;
    });

    // Check current node type
    const node = $from.parent;
    if (node.type.name.startsWith('heading')) {
        format.heading = parseInt(node.type.name.replace('heading', ''));
    } else if (node.type.name === 'bulletList') {
        format.list = 'bullet';
    } else if (node.type.name === 'orderedList') {
        format.list = 'ordered';
    } else if (node.type.name === 'blockquote') {
        format.blockquote = true;
    }

    return format;
}

// Derived stores
const hasUnsavedChanges = derived(
    [currentContent, lastSavedContent],
    ([$currentContent, $lastSavedContent]) => {
        return $currentContent !== $lastSavedContent;
    }
);

const editorStats = derived(
    [currentContent],
    ([$currentContent]) => {
        return analyzeText($currentContent);
    }
);

const canUndo = derived(
    [editorState],
    ([$editorState]) => {
        return $editorState.historyIndex > 0;
    }
);

const canRedo = derived(
    [editorState],
    ([$editorState]) => {
        return $editorState.historyIndex < $editorState.history.length - 1;
    }
);

// Auto-save functionality
function scheduleAutoSave(content, onSave) {
    clearTimeout(autoSaveTimer);

    editorPreferences.subscribe(prefs => {
        if (prefs.autoSave) {
            autoSaveTimer = setTimeout(() => {
                onSave(content);
                lastSavedContent.set(content);
                editorState.update(state => ({ ...state, hasUnsavedChanges: false }));
            }, prefs.autoSaveDelay);
        }
    })();
}

// Subscribe to preferences changes and save
if (browser) {
    editorPreferences.subscribe(prefs => {
        saveEditorPreferences(prefs);
    });
}

// Editor actions
const editorActions = {
    // Initialize editor
    initializeEditor(editor) {
        editorInstance.set(editor);

        // Set up editor event listeners
        editor.on('update', ({ editor: ed }) => {
            const content = ed.getHTML();
            currentContent.set(content);

            const stats = analyzeText(content);
            const format = detectCurrentFormat(ed);
            const selection = {
                from: ed.state.selection.from,
                to: ed.state.selection.to
            };

            editorState.update(state => ({
                ...state,
                wordCount: stats.wordCount,
                characterCount: stats.characterCount,
                currentFormat: format,
                selection
            }));
        });

        editor.on('focus', () => {
            editorState.update(state => ({ ...state, isFocused: true }));
        });

        editor.on('blur', () => {
            editorState.update(state => ({ ...state, isFocused: false }));
        });
    },

    // Content management
    setContent(content) {
        currentContent.set(content);
        lastSavedContent.set(content);

        editorInstance.subscribe(editor => {
            if (editor && editor.getHTML() !== content) {
                editor.commands.setContent(content);
            }
        })();
    },

    getContent() {
        let content = '';
        editorInstance.subscribe(editor => {
            if (editor) {
                content = editor.getHTML();
            }
        })();
        return content;
    },

    // Auto-save management
    enableAutoSave(onSave) {
        currentContent.subscribe(content => {
            hasUnsavedChanges.subscribe(hasChanges => {
                if (hasChanges && content) {
                    scheduleAutoSave(content, onSave);
                }
            })();
        })();
    },

    disableAutoSave() {
        clearTimeout(autoSaveTimer);
    },

    // Manual save
    save(onSave) {
        currentContent.subscribe(content => {
            onSave(content);
            lastSavedContent.set(content);
            editorState.update(state => ({ ...state, hasUnsavedChanges: false }));
        })();
    },

    // Editor state management
    setEditing(isEditing) {
        editorState.update(state => ({ ...state, isEditing }));
    },

    setLoading(isLoading) {
        editorState.update(state => ({ ...state, isLoading }));
    },

    // History management
    addToHistory(content) {
        editorState.update(state => {
            const newHistory = state.history.slice(0, state.historyIndex + 1);
            newHistory.push(content);

            // Limit history size
            if (newHistory.length > MAX_HISTORY_SIZE) {
                newHistory.shift();
            }

            return {
                ...state,
                history: newHistory,
                historyIndex: newHistory.length - 1
            };
        });
    },

    undo() {
        editorState.update(state => {
            if (state.historyIndex > 0) {
                const newIndex = state.historyIndex - 1;
                const content = state.history[newIndex];

                editorInstance.subscribe(editor => {
                    if (editor) {
                        editor.commands.setContent(content);
                    }
                })();

                return { ...state, historyIndex: newIndex };
            }
            return state;
        });
    },

    redo() {
        editorState.update(state => {
            if (state.historyIndex < state.history.length - 1) {
                const newIndex = state.historyIndex + 1;
                const content = state.history[newIndex];

                editorInstance.subscribe(editor => {
                    if (editor) {
                        editor.commands.setContent(content);
                    }
                })();

                return { ...state, historyIndex: newIndex };
            }
            return state;
        });
    },

    // Formatting commands
    toggleBold() {
        editorInstance.subscribe(editor => {
            if (editor) {
                editor.chain().focus().toggleBold().run();
            }
        })();
    },

    toggleItalic() {
        editorInstance.subscribe(editor => {
            if (editor) {
                editor.chain().focus().toggleItalic().run();
            }
        })();
    },

    setHeading(level) {
        editorInstance.subscribe(editor => {
            if (editor) {
                if (level === 0) {
                    editor.chain().focus().setParagraph().run();
                } else {
                    editor.chain().focus().toggleHeading({ level }).run();
                }
            }
        })();
    },

    toggleBulletList() {
        editorInstance.subscribe(editor => {
            if (editor) {
                editor.chain().focus().toggleBulletList().run();
            }
        })();
    },

    toggleOrderedList() {
        editorInstance.subscribe(editor => {
            if (editor) {
                editor.chain().focus().toggleOrderedList().run();
            }
        })();
    },

    // Preferences management
    updatePreferences(updates) {
        editorPreferences.update(prefs => ({ ...prefs, ...updates }));
    },

    setAutoSave(enabled) {
        editorPreferences.update(prefs => ({ ...prefs, autoSave: enabled }));
    },

    setAutoSaveDelay(delay) {
        editorPreferences.update(prefs => ({ ...prefs, autoSaveDelay: delay }));
    },

    setShowWordCount(show) {
        editorPreferences.update(prefs => ({ ...prefs, showWordCount: show }));
    },

    setSpellCheck(enabled) {
        editorPreferences.update(prefs => ({ ...prefs, spellCheck: enabled }));
    },

    setTypewriterMode(enabled) {
        editorPreferences.update(prefs => ({ ...prefs, typewriterMode: enabled }));
    },

    setFocusMode(enabled) {
        editorPreferences.update(prefs => ({ ...prefs, focusMode: enabled }));
    },

    setEditorWidth(width) {
        editorPreferences.update(prefs => ({ ...prefs, editorWidth: width }));
    },

    // Utility functions
    insertText(text) {
        editorInstance.subscribe(editor => {
            if (editor) {
                editor.chain().focus().insertContent(text).run();
            }
        })();
    },

    getSelectedText() {
        let selectedText = '';
        editorInstance.subscribe(editor => {
            if (editor) {
                const { from, to } = editor.state.selection;
                selectedText = editor.state.doc.textBetween(from, to);
            }
        })();
        return selectedText;
    },

    clearContent() {
        editorInstance.subscribe(editor => {
            if (editor) {
                editor.commands.clearContent();
            }
        })();
    },

    focus() {
        editorInstance.subscribe(editor => {
            if (editor) {
                editor.commands.focus();
            }
        })();
    },

    blur() {
        editorInstance.subscribe(editor => {
            if (editor) {
                editor.commands.blur();
            }
        })();
    }
};

// Initialize on module load
if (browser) {
    initializeEditorPreferences();
}

// Export stores and actions
export {
    editorState,
    editorPreferences,
    editorInstance,
    currentContent,
    lastSavedContent,
    hasUnsavedChanges,
    editorStats,
    canUndo,
    canRedo,
    editorActions
};

// Export convenience hooks
export const useEditor = () => ({
    state: { subscribe: editorState.subscribe },
    preferences: { subscribe: editorPreferences.subscribe },
    content: { subscribe: currentContent.subscribe },
    stats: { subscribe: editorStats.subscribe },
    hasUnsavedChanges: { subscribe: hasUnsavedChanges.subscribe },
    canUndo: { subscribe: canUndo.subscribe },
    canRedo: { subscribe: canRedo.subscribe },
    ...editorActions
});

export const useEditorStats = () => ({
    subscribe: editorStats.subscribe
});

export const useEditorState = () => ({
    subscribe: editorState.subscribe
});

// Export editor width options for UI
export const EDITOR_WIDTH_OPTIONS = [
    { value: 'narrow', label: 'Narrow', description: 'Focus on text, minimal distractions' },
    { value: 'normal', label: 'Normal', description: 'Balanced layout for most use cases' },
    { value: 'wide', label: 'Wide', description: 'More space for complex content' },
    { value: 'full', label: 'Full Width', description: 'Maximum available space' }
];