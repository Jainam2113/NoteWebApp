import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { v4 as uuidv4 } from 'uuid';

// Types
/**
 * @typedef {Object} Note
 * @property {string} id - Unique identifier
 * @property {string} title - Note title
 * @property {string} content - Note content (HTML)
 * @property {string[]} tags - Array of tags
 * @property {number} createdAt - Creation timestamp
 * @property {number} updatedAt - Last update timestamp
 * @property {boolean} isPinned - Whether note is pinned
 * @property {Object[]} drawings - Array of drawing data
 */

// Constants
const STORAGE_KEY = 'advanced-notes-app';
const AUTO_SAVE_DELAY = 500; // ms

// Internal stores
const notes = writable([]);
const currentNoteId = writable(null);
const searchQuery = writable('');
const selectedTags = writable([]);
const sortBy = writable('updatedAt'); // 'updatedAt', 'createdAt', 'title'
const sortOrder = writable('desc'); // 'asc', 'desc'

// Auto-save timeout
let autoSaveTimeout = null;

// Initialize from localStorage
function initializeNotes() {
    if (!browser) return;

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const data = JSON.parse(stored);
            notes.set(data.notes || []);

            // Create a default note if none exist
            if (data.notes?.length === 0) {
                createWelcomeNote();
            }
        } else {
            createWelcomeNote();
        }
    } catch (error) {
        console.error('Failed to load notes from localStorage:', error);
        createWelcomeNote();
    }
}

// Create welcome note for new users
function createWelcomeNote() {
    const welcomeNote = {
        id: uuidv4(),
        title: 'Welcome to Advanced Notes! 👋',
        content: `<h1>Welcome to Advanced Notes!</h1>
<p>This is your first note. Here's what you can do:</p>
<h2>✨ Rich Text Editing</h2>
<ul>
<li><strong>Bold text</strong> and <em>italic text</em></li>
<li>Create headers with # or ##</li>
<li>Make bulleted and numbered lists</li>
</ul>
<h2>🎨 Drawing Features</h2>
<ul>
<li>Add drawings directly to your notes</li>
<li>Use shapes, free-drawing, and colors</li>
<li>Integrated seamlessly with text</li>
</ul>
<h2>🔍 Organization</h2>
<ul>
<li>Search across all your notes</li>
<li>Add tags for better organization</li>
<li>Pin important notes</li>
</ul>
<p>Start by editing this note or create a new one! Happy note-taking! 🚀</p>`,
        tags: ['welcome', 'tutorial'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isPinned: true,
        drawings: []
    };

    notes.set([welcomeNote]);
    currentNoteId.set(welcomeNote.id);
    saveToStorage();
}

// Save to localStorage with debouncing
function saveToStorage() {
    if (!browser) return;

    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
        notes.subscribe(notesData => {
            try {
                const data = {
                    notes: notesData,
                    version: '1.0.0',
                    lastSaved: Date.now()
                };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            } catch (error) {
                console.error('Failed to save notes to localStorage:', error);
            }
        })();
    }, AUTO_SAVE_DELAY);
}

// Derived stores
const allTags = derived(notes, $notes => {
    const tagSet = new Set();
    $notes.forEach(note => {
        note.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
});

const filteredNotes = derived(
    [notes, searchQuery, selectedTags, sortBy, sortOrder],
    ([$notes, $searchQuery, $selectedTags, $sortBy, $sortOrder]) => {
        let filtered = [...$notes];

        // Filter by search query
        if ($searchQuery.trim()) {
            const query = $searchQuery.toLowerCase();
            filtered = filtered.filter(note =>
                note.title.toLowerCase().includes(query) ||
                note.content.toLowerCase().includes(query) ||
                note.tags?.some(tag => tag.toLowerCase().includes(query))
            );
        }

        // Filter by selected tags
        if ($selectedTags.length > 0) {
            filtered = filtered.filter(note =>
                $selectedTags.every(tag => note.tags?.includes(tag))
            );
        }

        // Sort notes
        filtered.sort((a, b) => {
            let aValue, bValue;

            switch ($sortBy) {
                case 'title':
                    aValue = a.title.toLowerCase();
                    bValue = b.title.toLowerCase();
                    break;
                case 'createdAt':
                    aValue = a.createdAt;
                    bValue = b.createdAt;
                    break;
                default: // 'updatedAt'
                    aValue = a.updatedAt;
                    bValue = b.updatedAt;
            }

            if ($sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        // Pinned notes always at top
        const pinnedNotes = filtered.filter(note => note.isPinned);
        const unpinnedNotes = filtered.filter(note => !note.isPinned);

        return [...pinnedNotes, ...unpinnedNotes];
    }
);

const currentNote = derived(
    [notes, currentNoteId],
    ([$notes, $currentNoteId]) => {
        return $notes.find(note => note.id === $currentNoteId) || null;
    }
);

const notesStats = derived(notes, $notes => ({
    total: $notes.length,
    pinned: $notes.filter(note => note.isPinned).length,
    withTags: $notes.filter(note => note.tags?.length > 0).length,
    withDrawings: $notes.filter(note => note.drawings?.length > 0).length
}));

// Actions
const notesActions = {
    // Create new note
    createNote(title = 'Untitled Note', content = '') {
        const newNote = {
            id: uuidv4(),
            title,
            content,
            tags: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isPinned: false,
            drawings: []
        };

        notes.update(allNotes => {
            const updated = [newNote, ...allNotes];
            saveToStorage();
            return updated;
        });

        currentNoteId.set(newNote.id);
        return newNote.id;
    },

    // Update existing note
    updateNote(id, updates) {
        notes.update(allNotes => {
            const updated = allNotes.map(note => {
                if (note.id === id) {
                    return {
                        ...note,
                        ...updates,
                        updatedAt: Date.now()
                    };
                }
                return note;
            });
            saveToStorage();
            return updated;
        });
    },

    // Delete note
    deleteNote(id) {
        notes.update(allNotes => {
            const updated = allNotes.filter(note => note.id !== id);
            saveToStorage();
            return updated;
        });

        // If deleted note was current, select another
        currentNoteId.update(currentId => {
            if (currentId === id) {
                notes.subscribe(allNotes => {
                    return allNotes.length > 0 ? allNotes[0].id : null;
                })();
            }
            return currentId;
        });
    },

    // Duplicate note
    duplicateNote(id) {
        notes.subscribe(allNotes => {
            const originalNote = allNotes.find(note => note.id === id);
            if (originalNote) {
                const duplicatedNote = {
                    ...originalNote,
                    id: uuidv4(),
                    title: `${originalNote.title} (Copy)`,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    isPinned: false
                };

                notes.update(notes => {
                    const updated = [duplicatedNote, ...notes];
                    saveToStorage();
                    return updated;
                });

                currentNoteId.set(duplicatedNote.id);
            }
        })();
    },

    // Toggle pin status
    togglePin(id) {
        notes.update(allNotes => {
            const updated = allNotes.map(note => {
                if (note.id === id) {
                    return {
                        ...note,
                        isPinned: !note.isPinned,
                        updatedAt: Date.now()
                    };
                }
                return note;
            });
            saveToStorage();
            return updated;
        });
    },

    // Add tag to note
    addTag(noteId, tag) {
        if (!tag.trim()) return;

        notes.update(allNotes => {
            const updated = allNotes.map(note => {
                if (note.id === noteId) {
                    const tags = note.tags || [];
                    if (!tags.includes(tag)) {
                        return {
                            ...note,
                            tags: [...tags, tag],
                            updatedAt: Date.now()
                        };
                    }
                }
                return note;
            });
            saveToStorage();
            return updated;
        });
    },

    // Remove tag from note
    removeTag(noteId, tag) {
        notes.update(allNotes => {
            const updated = allNotes.map(note => {
                if (note.id === noteId) {
                    return {
                        ...note,
                        tags: (note.tags || []).filter(t => t !== tag),
                        updatedAt: Date.now()
                    };
                }
                return note;
            });
            saveToStorage();
            return updated;
        });
    },

    // Add drawing to note
    addDrawing(noteId, drawingData) {
        notes.update(allNotes => {
            const updated = allNotes.map(note => {
                if (note.id === noteId) {
                    return {
                        ...note,
                        drawings: [...(note.drawings || []), drawingData],
                        updatedAt: Date.now()
                    };
                }
                return note;
            });
            saveToStorage();
            return updated;
        });
    },

    // Update drawing in note
    updateDrawing(noteId, drawingIndex, drawingData) {
        notes.update(allNotes => {
            const updated = allNotes.map(note => {
                if (note.id === noteId) {
                    const drawings = [...(note.drawings || [])];
                    drawings[drawingIndex] = drawingData;
                    return {
                        ...note,
                        drawings,
                        updatedAt: Date.now()
                    };
                }
                return note;
            });
            saveToStorage();
            return updated;
        });
    },

    // Remove drawing from note
    removeDrawing(noteId, drawingIndex) {
        notes.update(allNotes => {
            const updated = allNotes.map(note => {
                if (note.id === noteId) {
                    const drawings = [...(note.drawings || [])];
                    drawings.splice(drawingIndex, 1);
                    return {
                        ...note,
                        drawings,
                        updatedAt: Date.now()
                    };
                }
                return note;
            });
            saveToStorage();
            return updated;
        });
    },

    // Set current note
    setCurrentNote(id) {
        currentNoteId.set(id);
    },

    // Search actions
    setSearchQuery(query) {
        searchQuery.set(query);
    },

    clearSearch() {
        searchQuery.set('');
        selectedTags.set([]);
    },

    // Tag filter actions
    toggleTagFilter(tag) {
        selectedTags.update(tags => {
            if (tags.includes(tag)) {
                return tags.filter(t => t !== tag);
            } else {
                return [...tags, tag];
            }
        });
    },

    clearTagFilters() {
        selectedTags.set([]);
    },

    // Sort actions
    setSortBy(field) {
        sortBy.set(field);
    },

    setSortOrder(order) {
        sortOrder.set(order);
    },

    toggleSortOrder() {
        sortOrder.update(order => order === 'asc' ? 'desc' : 'asc');
    },

    // Bulk actions
    deleteAllNotes() {
        notes.set([]);
        currentNoteId.set(null);
        saveToStorage();
    },

    // Export/Import
    exportNotes() {
        let notesData;
        notes.subscribe(data => notesData = data)();

        const exportData = {
            notes: notesData,
            exportedAt: Date.now(),
            version: '1.0.0'
        };

        return JSON.stringify(exportData, null, 2);
    },

    importNotes(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            if (data.notes && Array.isArray(data.notes)) {
                notes.set(data.notes);
                saveToStorage();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to import notes:', error);
            return false;
        }
    }
};

// Initialize on load
if (browser) {
    initializeNotes();
}

// Export stores and actions
export {
    // Stores
    notes,
    currentNoteId,
    currentNote,
    filteredNotes,
    searchQuery,
    selectedTags,
    allTags,
    sortBy,
    sortOrder,
    notesStats,

    // Actions
    notesActions
};

// Export store subscription helpers
export const useNotes = () => ({
    subscribe: notes.subscribe,
    ...notesActions
});

export const useCurrentNote = () => ({
    subscribe: currentNote.subscribe,
    setCurrentNote: notesActions.setCurrentNote
});

export const useSearch = () => ({
    query: { subscribe: searchQuery.subscribe },
    selectedTags: { subscribe: selectedTags.subscribe },
    setQuery: notesActions.setSearchQuery,
    clearSearch: notesActions.clearSearch,
    toggleTagFilter: notesActions.toggleTagFilter,
    clearTagFilters: notesActions.clearTagFilters
});

export const useSort = () => ({
    sortBy: { subscribe: sortBy.subscribe },
    sortOrder: { subscribe: sortOrder.subscribe },
    setSortBy: notesActions.setSortBy,
    setSortOrder: notesActions.setSortOrder,
    toggleSortOrder: notesActions.toggleSortOrder
});