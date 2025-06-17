<script>
    import { createEventDispatcher, onMount, onDestroy } from 'svelte';
    import { fade, scale } from 'svelte/transition';
    import {
        Search,
        Plus,
        FileText,
        Settings,
        Moon,
        Sun,
        Monitor,
        Command,
        Hash,
        Calendar,
        Palette,
        Download,
        Upload,
        Copy,
        Trash2,
        Pin,
        Filter,
        SortAsc,
        ArrowRight
    } from 'lucide-svelte';

    import { clickOutside, escapeKey } from '$lib/utils/clickOutside.js';
    import { debounceSearch } from '$lib/utils/debounce.js';
    import { formatShortcut } from '$lib/utils/shortcuts.js';

    import { notesActions, filteredNotes, currentNote } from '$lib/stores/notesStore.js';
    import { useTheme } from '$lib/stores/themeStore.js';

    // Props
    export let open = false;
    export let className = '';

    // Event dispatcher
    const dispatch = createEventDispatcher();

    // Theme store
    const theme = useTheme();

    // Local state
    let searchQuery = '';
    let selectedIndex = 0;
    let commandInput;
    let commandList;

    // Available commands
    const baseCommands = [
        {
            id: 'new-note',
            title: 'Create New Note',
            description: 'Start writing a new note',
            icon: Plus,
            shortcut: 'Ctrl+N',
            category: 'actions',
            action: () => {
                dispatch('create-note');
                close();
            }
        },
        {
            id: 'search-notes',
            title: 'Search Notes',
            description: 'Find notes by title or content',
            icon: Search,
            shortcut: 'Ctrl+F',
            category: 'navigation',
            action: () => {
                dispatch('search-notes');
                close();
            }
        },
        {
            id: 'toggle-theme',
            title: 'Toggle Theme',
            description: 'Switch between light and dark mode',
            icon: $theme.isDark ? Sun : Moon,
            shortcut: 'Ctrl+Shift+D',
            category: 'settings',
            action: () => {
                theme.toggle();
                close();
            }
        },
        {
            id: 'system-theme',
            title: 'Use System Theme',
            description: 'Follow system theme preference',
            icon: Monitor,
            category: 'settings',
            action: () => {
                theme.setMode('system');
                close();
            }
        },
        {
            id: 'settings',
            title: 'Open Settings',
            description: 'Configure app preferences',
            icon: Settings,
            category: 'settings',
            action: () => {
                dispatch('open-settings');
                close();
            }
        },
        {
            id: 'export-notes',
            title: 'Export All Notes',
            description: 'Download notes as JSON file',
            icon: Download,
            category: 'data',
            action: () => {
                dispatch('export-notes');
                close();
            }
        },
        {
            id: 'import-notes',
            title: 'Import Notes',
            description: 'Upload notes from JSON file',
            icon: Upload,
            category: 'data',
            action: () => {
                dispatch('import-notes');
                close();
            }
        }
    ];

    // Dynamic commands based on current note
    $: currentNoteCommands = $currentNote ? [
        {
            id: 'save-note',
            title: 'Save Current Note',
            description: 'Save the current note',
            icon: FileText,
            shortcut: 'Ctrl+S',
            category: 'current',
            action: () => {
                dispatch('save-note');
                close();
            }
        },
        {
            id: 'duplicate-note',
            title: 'Duplicate Current Note',
            description: 'Create a copy of this note',
            icon: Copy,
            shortcut: 'Ctrl+D',
            category: 'current',
            action: () => {
                notesActions.duplicateNote($currentNote.id);
                close();
            }
        },
        {
            id: 'pin-note',
            title: $currentNote.isPinned ? 'Unpin Note' : 'Pin Note',
            description: $currentNote.isPinned ? 'Remove from pinned notes' : 'Pin to top of list',
            icon: Pin,
            shortcut: 'Ctrl+P',
            category: 'current',
            action: () => {
                notesActions.togglePin($currentNote.id);
                close();
            }
        },
        {
            id: 'delete-note',
            title: 'Delete Current Note',
            description: 'Move note to trash',
            icon: Trash2,
            shortcut: 'Ctrl+Delete',
            category: 'current',
            className: 'text-red-600 dark:text-red-400',
            action: () => {
                if (confirm('Are you sure you want to delete this note?')) {
                    notesActions.deleteNote($currentNote.id);
                    close();
                }
            }
        }
    ] : [];

    // Recent notes commands
    $: recentNotesCommands = $filteredNotes.slice(0, 5).map(note => ({
        id: `note-${note.id}`,
        title: note.title || 'Untitled',
        description: `Updated ${formatDate(note.updatedAt)}`,
        icon: FileText,
        category: 'recent',
        action: () => {
            dispatch('select-note', { noteId: note.id });
            close();
        }
    }));

    // All available commands
    $: allCommands = [
        ...baseCommands,
        ...currentNoteCommands,
        ...recentNotesCommands
    ];

    // Filtered commands based on search
    $: filteredCommands = searchQuery.trim()
        ? filterCommands(allCommands, searchQuery)
        : groupCommandsByCategory(allCommands);

    // Debounced search
    const debouncedSearch = debounceSearch((query) => {
        searchQuery = query;
        selectedIndex = 0;
    }, 150);

    // Filter commands by search query
    function filterCommands(commands, query) {
        const lowerQuery = query.toLowerCase();

        const filtered = commands.filter(command =>
            command.title.toLowerCase().includes(lowerQuery) ||
            command.description?.toLowerCase().includes(lowerQuery) ||
            command.category?.toLowerCase().includes(lowerQuery)
        );

        // Score and sort by relevance
        return filtered
            .map(command => ({
                ...command,
                score: getSearchScore(command, lowerQuery)
            }))
            .sort((a, b) => b.score - a.score);
    }

    // Calculate search relevance score
    function getSearchScore(command, query) {
        let score = 0;
        const title = command.title.toLowerCase();
        const description = command.description?.toLowerCase() || '';

        // Exact title match gets highest score
        if (title === query) score += 100;
        // Title starts with query
        else if (title.startsWith(query)) score += 50;
        // Title contains query
        else if (title.includes(query)) score += 25;

        // Description matches
        if (description.includes(query)) score += 10;

        // Category bonus
        if (command.category === 'actions') score += 5;
        if (command.category === 'current') score += 3;

        return score;
    }

    // Group commands by category
    function groupCommandsByCategory(commands) {
        const groups = {};

        commands.forEach(command => {
            const category = command.category || 'other';
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(command);
        });

        // Define category order and labels
        const categoryOrder = ['current', 'actions', 'recent', 'navigation', 'settings', 'data'];
        const categoryLabels = {
            current: 'Current Note',
            actions: 'Actions',
            recent: 'Recent Notes',
            navigation: 'Navigation',
            settings: 'Settings',
            data: 'Data Management'
        };

        const result = [];
        categoryOrder.forEach(category => {
            if (groups[category] && groups[category].length > 0) {
                result.push({
                    category,
                    label: categoryLabels[category] || category,
                    commands: groups[category]
                });
            }
        });

        return result;
    }

    // Format date for display
    function formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return date.toLocaleDateString();
    }

    // Get all commands as flat list for navigation
    $: flatCommands = Array.isArray(filteredCommands)
        ? filteredCommands
        : filteredCommands.flatMap(group => group.commands);

    // Handle input
    function handleInput(event) {
        debouncedSearch(event.target.value);
    }

    // Handle keyboard navigation
    function handleKeydown(event) {
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, flatCommands.length - 1);
                scrollToSelected();
                break;

            case 'ArrowUp':
                event.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, 0);
                scrollToSelected();
                break;

            case 'Enter':
                event.preventDefault();
                executeSelectedCommand();
                break;

            case 'Escape':
                event.preventDefault();
                close();
                break;

            case 'Tab':
                event.preventDefault();
                if (event.shiftKey) {
                    selectedIndex = Math.max(selectedIndex - 1, 0);
                } else {
                    selectedIndex = Math.min(selectedIndex + 1, flatCommands.length - 1);
                }
                scrollToSelected();
                break;
        }
    }

    // Execute selected command
    function executeSelectedCommand() {
        const command = flatCommands[selectedIndex];
        if (command && command.action) {
            command.action();
        }
    }

    // Scroll to selected item
    function scrollToSelected() {
        if (commandList) {
            const selectedElement = commandList.querySelector(`[data-index="${selectedIndex}"]`);
            if (selectedElement) {
                selectedElement.scrollIntoView({ block: 'nearest' });
            }
        }
    }

    // Close command palette
    function close() {
        open = false;
        searchQuery = '';
        selectedIndex = 0;
        dispatch('close');
    }

    // Handle click outside
    function handleClickOutside() {
        close();
    }

    // Focus input when opened
    $: if (open && commandInput) {
        commandInput.focus();
    }

    // Reset selection when search changes
    $: if (searchQuery !== undefined) {
        selectedIndex = 0;
    }
</script>

{#if open}
    <!-- Backdrop -->
    <div
            class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            transition:fade={{ duration: 200 }}
            on:click={handleClickOutside}
            role="presentation"
    >
        <!-- Command Palette -->
        <div
                class="fixed top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl mx-4"
                use:clickOutside={handleClickOutside}
                use:escapeKey={close}
        >
            <div
                    class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden {className}"
                    transition:scale={{ duration: 200, start: 0.95 }}
                    role="dialog"
                    aria-label="Command palette"
            >
                <!-- Search Input -->
                <div class="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <Search class="w-5 h-5 text-gray-400 dark:text-gray-500 mr-3" />
                    <input
                            bind:this={commandInput}
                            type="text"
                            placeholder="Type a command or search..."
                            class="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border-none outline-none text-lg"
                            on:input={handleInput}
                            on:keydown={handleKeydown}
                            autocomplete="off"
                            spellcheck="false"
                    />
                    <div class="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                        <kbd class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded border">
                            {formatShortcut('Ctrl+K')}
                        </kbd>
                    </div>
                </div>

                <!-- Commands List -->
                <div
                        bind:this={commandList}
                        class="max-h-96 overflow-y-auto"
                >
                    {#if flatCommands.length === 0}
                        <!-- No Results -->
                        <div class="px-4 py-8 text-center">
                            <Command class="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                            <p class="text-gray-500 dark:text-gray-400">
                                No commands found
                            </p>
                            <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">
                                Try different keywords
                            </p>
                        </div>
                    {:else if Array.isArray(filteredCommands)}
                        <!-- Flat list (search results) -->
                        {#each filteredCommands as command, index}
                            <button
                                    class="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
                                    class:bg-gray-50={selectedIndex === index}
                                    class:dark:bg-gray-700={selectedIndex === index}
                                    class:text-red-600={command.className?.includes('text-red')}
                                    class:dark:text-red-400={command.className?.includes('text-red')}
                                    data-index={index}
                                    on:click={command.action}
                                    on:mouseenter={() => selectedIndex = index}
                            >
                                <svelte:component this={command.icon} class="w-5 h-5 flex-shrink-0" />
                                <div class="flex-1 min-w-0">
                                    <div class="font-medium text-gray-900 dark:text-white truncate">
                                        {command.title}
                                    </div>
                                    {#if command.description}
                                        <div class="text-sm text-gray-500 dark:text-gray-400 truncate">
                                            {command.description}
                                        </div>
                                    {/if}
                                </div>
                                {#if command.shortcut}
                                    <div class="text-xs text-gray-400 dark:text-gray-500">
                                        <kbd class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded border">
                                            {formatShortcut(command.shortcut)}
                                        </kbd>
                                    </div>
                                {/if}
                                <ArrowRight class="w-4 h-4 text-gray-400 dark:text-gray-500" />
                            </button>
                        {/each}
                    {:else}
                        <!-- Grouped list -->
                        {#each filteredCommands as group}
                            <div class="py-2">
                                <!-- Group Header -->
                                <div class="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    {group.label}
                                </div>

                                <!-- Group Commands -->
                                {#each group.commands as command, groupIndex}
                                    {@const globalIndex = filteredCommands
                                        .slice(0, filteredCommands.indexOf(group))
                                        .reduce((acc, g) => acc + g.commands.length, 0) + groupIndex}

                                    <button
                                            class="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
                                            class:bg-gray-50={selectedIndex === globalIndex}
                                            class:dark:bg-gray-700={selectedIndex === globalIndex}
                                            class:text-red-600={command.className?.includes('text-red')}
                                            class:dark:text-red-400={command.className?.includes('text-red')}
                                            data-index={globalIndex}
                                            on:click={command.action}
                                            on:mouseenter={() => selectedIndex = globalIndex}
                                    >
                                        <svelte:component this={command.icon} class="w-5 h-5 flex-shrink-0" />
                                        <div class="flex-1 min-w-0">
                                            <div class="font-medium text-gray-900 dark:text-white truncate">
                                                {command.title}
                                            </div>
                                            {#if command.description}
                                                <div class="text-sm text-gray-500 dark:text-gray-400 truncate">
                                                    {command.description}
                                                </div>
                                            {/if}
                                        </div>
                                        {#if command.shortcut}
                                            <div class="text-xs text-gray-400 dark:text-gray-500">
                                                <kbd class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded border">
                                                    {formatShortcut(command.shortcut)}
                                                </kbd>
                                            </div>
                                        {/if}
                                        <ArrowRight class="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                    </button>
                                {/each}
                            </div>
                        {/each}
                    {/if}
                </div>

                <!-- Footer -->
                <div class="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <div class="flex items-center gap-4">
              <span class="flex items-center gap-1">
                <kbd class="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">↑↓</kbd>
                to navigate
              </span>
                            <span class="flex items-center gap-1">
                <kbd class="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">↵</kbd>
                to select
              </span>
                            <span class="flex items-center gap-1">
                <kbd class="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">esc</kbd>
                to close
              </span>
                        </div>
                        <div>
                            {flatCommands.length} commands
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    kbd {
        font-family: inherit;
        font-size: inherit;
    }
</style>