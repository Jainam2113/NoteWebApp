<script>
    import { onMount, onDestroy } from 'svelte';
    import { browser } from '$app/environment';
    import { Menu, X } from 'lucide-svelte';

    import Sidebar from '../../src/lib/components/layout/Sidebar.svelte';
    import MainEditor from '../../src/lib/components/layout/MainEditor.svelte';
    import CommandPalette from '../../src/lib/components/editor/CommandPalette.svelte';
    import SettingsModal from '../../src/lib/components/SettingsModal.svelte';
    import Button from '../../src/lib/components/ui/Button.svelte';

    import { notesActions, useCurrentNote } from '../lib/stores/notesStore.js';
    import { shortcutManager, APP_SHORTCUTS, registerShortcuts, unregisterShortcuts } from '../lib/utils/shortcuts.js';
    import { throttleResize } from '../lib/utils/debounce.js';

    // Responsive state
    let isMobile = false;
    let sidebarOpen = false;
    let showCommandPalette = false;
    let showSettings = false;

    // Store subscriptions
    const currentNote = useCurrentNote();

    // Check if viewport is mobile
    function checkMobile() {
        if (browser) {
            isMobile = window.innerWidth < 1024;
            if (!isMobile) {
                sidebarOpen = false;
            }
        }
    }

    // Throttled resize handler
    const handleResize = throttleResize(checkMobile, 100);

    // Application actions for shortcuts
    const appActions = {
        createNote() {
            handleCreateNote();
        },

        saveNote() {
            // Trigger save via MainEditor
            document.dispatchEvent(new CustomEvent('save-note'));
        },

        focusSearch() {
            // Focus search in sidebar
            document.dispatchEvent(new CustomEvent('focus-search'));
        },

        openCommandPalette() {
            showCommandPalette = true;
        },

        toggleTheme() {
            // Theme toggle handled via command palette or settings
            document.dispatchEvent(new CustomEvent('toggle-theme'));
        },

        deleteCurrentNote() {
            if ($currentNote) {
                handleDeleteNote($currentNote.id);
            }
        },

        duplicateCurrentNote() {
            if ($currentNote) {
                notesActions.duplicateNote($currentNote.id);
            }
        },

        togglePinCurrentNote() {
            if ($currentNote) {
                notesActions.togglePin($currentNote.id);
            }
        },

        closeModal() {
            showCommandPalette = false;
            showSettings = false;
        }
    };

    // Note management
    function handleCreateNote() {
        const noteId = notesActions.createNote();
        if (isMobile) {
            sidebarOpen = false;
        }
    }

    function handleNoteSelect(event) {
        const { noteId } = event.detail;
        notesActions.setCurrentNote(noteId);
        if (isMobile) {
            sidebarOpen = false;
        }
    }

    function handleDeleteNote(noteId) {
        if (confirm('Are you sure you want to delete this note?')) {
            notesActions.deleteNote(noteId);
        }
    }

    function handlePinNote(event) {
        const { noteId } = event.detail;
        notesActions.togglePin(noteId);
    }

    function handleDuplicateNote(event) {
        const { noteId } = event.detail;
        notesActions.duplicateNote(noteId);
    }

    // UI actions
    function toggleSidebar() {
        sidebarOpen = !sidebarOpen;
    }

    function closeSidebar() {
        sidebarOpen = false;
    }

    function handleOpenSettings() {
        showSettings = true;
    }

    function handleCloseSettings() {
        showSettings = false;
    }

    // Command palette actions
    function handleCommandPaletteAction(event) {
        const { type, detail } = event;

        switch (type) {
            case 'create-note':
                handleCreateNote();
                break;
            case 'search-notes':
                // Focus search would be handled by sidebar
                break;
            case 'open-settings':
                handleOpenSettings();
                break;
            case 'select-note':
                handleNoteSelect(event);
                break;
            case 'export-notes':
                exportNotes();
                break;
            case 'import-notes':
                // This would trigger file input
                break;
        }
    }

    // Data management
    function exportNotes() {
        try {
            const data = notesActions.exportNotes();
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `notes-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to export notes:', error);
            alert('Failed to export notes. Please try again.');
        }
    }

    // Keyboard shortcuts
    function setupShortcuts() {
        // Register global shortcuts
        registerShortcuts(APP_SHORTCUTS, 'app', appActions);

        // Add command palette shortcut
        shortcutManager.register({
            key: 'ctrl+k',
            description: 'Open command palette',
            category: 'navigation',
            handler: () => {
                showCommandPalette = true;
            }
        });

        // Start listening for shortcuts
        shortcutManager.startListening();
    }

    function cleanupShortcuts() {
        unregisterShortcuts(APP_SHORTCUTS);
        shortcutManager.unregister('ctrl+k');
        shortcutManager.stopListening();
    }

    // Handle global key events
    function handleGlobalKeydown(event) {
        // Escape key closes modals
        if (event.key === 'Escape') {
            if (showCommandPalette) {
                showCommandPalette = false;
                event.preventDefault();
            } else if (showSettings) {
                showSettings = false;
                event.preventDefault();
            } else if (isMobile && sidebarOpen) {
                sidebarOpen = false;
                event.preventDefault();
            }
        }
    }

    // Lifecycle
    onMount(() => {
        checkMobile();
        setupShortcuts();

        if (browser) {
            window.addEventListener('resize', handleResize);
            document.addEventListener('keydown', handleGlobalKeydown);
        }
    });

    onDestroy(() => {
        cleanupShortcuts();

        if (browser) {
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('keydown', handleGlobalKeydown);
        }
    });
</script>

<svelte:head>
    <title>Advanced Notes App</title>
    <meta name="description" content="A modern note-taking application with rich text editing and drawing capabilities." />
</svelte:head>

<div class="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
    <!-- Sidebar -->
    <Sidebar
            bind:isOpen={sidebarOpen}
            {isMobile}
            on:create-note={handleCreateNote}
            on:note-select={handleNoteSelect}
            on:note-delete={handleDeleteNote}
            on:note-pin={handlePinNote}
            on:note-duplicate={handleDuplicateNote}
            on:open-settings={handleOpenSettings}
            on:close={closeSidebar}
    />

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Mobile Header -->
        {#if isMobile}
            <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between lg:hidden">
                <Button
                        variant="ghost"
                        size="sm"
                        className="p-2"
                        ariaLabel="Open sidebar"
                        on:click={toggleSidebar}
                >
                    <Menu class="w-5 h-5" />
                </Button>

                <h1 class="text-lg font-semibold text-gray-900 dark:text-white">
                    Notes
                </h1>

                <Button
                        variant="ghost"
                        size="sm"
                        className="p-2"
                        ariaLabel="Open command palette"
                        on:click={() => showCommandPalette = true}
                >
                    ⌘K
                </Button>
            </div>
        {/if}

        <!-- Editor -->
        <MainEditor
                className="flex-1"
                on:create-note={handleCreateNote}
                on:save={() => {
        // Save handled internally by editor
      }}
                on:note-deleted={() => {
        // Note was deleted, editor will show empty state
      }}
        />
    </div>
</div>

<!-- Command Palette -->
<CommandPalette
        bind:open={showCommandPalette}
        on:create-note={handleCommandPaletteAction}
        on:search-notes={handleCommandPaletteAction}
        on:open-settings={handleCommandPaletteAction}
        on:select-note={handleCommandPaletteAction}
        on:export-notes={handleCommandPaletteAction}
        on:import-notes={handleCommandPaletteAction}
        on:close={() => showCommandPalette = false}
/>

<!-- Settings Modal -->
<SettingsModal
        bind:open={showSettings}
        on:close={handleCloseSettings}
/>

<!-- Global Styles -->
<style>
    :global(html) {
        height: 100%;
    }

    :global(body) {
        height: 100%;
        margin: 0;
        overflow: hidden;
    }

    :global(#svelte) {
        height: 100%;
    }

    /* Custom scrollbar styles */
    :global(.custom-scrollbar) {
        scrollbar-width: thin;
        scrollbar-color: #cbd5e1 transparent;
    }

    :global(.custom-scrollbar::-webkit-scrollbar) {
        width: 6px;
    }

    :global(.custom-scrollbar::-webkit-scrollbar-track) {
        background: transparent;
    }

    :global(.custom-scrollbar::-webkit-scrollbar-thumb) {
        background-color: #cbd5e1;
        border-radius: 3px;
    }

    :global(.dark .custom-scrollbar::-webkit-scrollbar-thumb) {
        background-color: #4b5563;
    }

    /* Ensure modals appear above everything */
    :global(.modal-backdrop) {
        z-index: 1000;
    }

    /* Animation for mobile sidebar */
    @media (max-width: 1023px) {
        :global(.sidebar-mobile) {
            transform: translateX(-100%);
            transition: transform 0.3s ease-in-out;
        }

        :global(.sidebar-mobile.open) {
            transform: translateX(0);
        }
    }

    /* Focus management */
    :global(*:focus) {
        outline: none;
    }

    :global(*:focus-visible) {
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
    }

    /* High contrast mode adjustments */
    @media (prefers-contrast: high) {
        :global(.border-gray-200) {
            border-color: #000000;
        }

        :global(.dark .border-gray-700) {
            border-color: #ffffff;
        }
    }

    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
        :global(*) {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
        }
    }

    /* Print styles */
    @media print {
        :global(.no-print) {
            display: none !important;
        }

        :global(.print-only) {
            display: block !important;
        }
    }
</style>