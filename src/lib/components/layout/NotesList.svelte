<script>
    import { createEventDispatcher } from 'svelte';
    import {
        Pin,
        MoreVertical,
        Copy,
        Trash2,
        Tag,
        Calendar,
        FileText,
        Image
    } from 'lucide-svelte';
    import { slide } from 'svelte/transition';
    import { clickOutside } from '$lib/utils/clickOutside.js';

    import Button from '$lib/components/ui/Button.svelte';
    import { filteredNotes, currentNoteId } from '$lib/stores/notesStore.js';

    // Event dispatcher
    const dispatch = createEventDispatcher();

    // Local state
    let openMenuId = null;

    // Reactive values
    $: notes = $filteredNotes;
    $: selectedNoteId = $currentNoteId;

    // Format date for display
    function formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));
        const diffInHours = Math.floor(diffInMinutes / 60);
        const diffInDays = Math.floor(diffInHours / 24);

        if (diffInMinutes < 1) {
            return 'Just now';
        } else if (diffInMinutes < 60) {
            return `${diffInMinutes}m ago`;
        } else if (diffInHours < 24) {
            return `${diffInHours}h ago`;
        } else if (diffInDays < 7) {
            return `${diffInDays}d ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    // Extract text content from HTML
    function extractTextContent(html) {
        if (!html) return '';

        // Create a temporary element to strip HTML tags
        const temp = document.createElement('div');
        temp.innerHTML = html;
        return temp.textContent || temp.innerText || '';
    }

    // Truncate text to specified length
    function truncateText(text, maxLength = 100) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    // Handle note selection
    function handleNoteSelect(noteId) {
        dispatch('note-select', { noteId });
        openMenuId = null;
    }

    // Handle note actions
    function handlePin(noteId, event) {
        event.stopPropagation();
        dispatch('note-pin', { noteId });
        openMenuId = null;
    }

    function handleDuplicate(noteId, event) {
        event.stopPropagation();
        dispatch('note-duplicate', { noteId });
        openMenuId = null;
    }

    function handleDelete(noteId, event) {
        event.stopPropagation();
        dispatch('note-delete', { noteId });
        openMenuId = null;
    }

    // Handle menu toggle
    function toggleMenu(noteId, event) {
        event.stopPropagation();
        openMenuId = openMenuId === noteId ? null : noteId;
    }

    // Close menus when clicking outside
    function handleClickOutside() {
        openMenuId = null;
    }

    // Handle keyboard navigation
    function handleKeydown(event, noteId) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleNoteSelect(noteId);
        } else if (event.key === 'Escape') {
            openMenuId = null;
        }
    }
</script>

<div class="divide-y divide-gray-200 dark:divide-gray-700" use:clickOutside={handleClickOutside}>
    {#if notes.length === 0}
        <!-- Empty State -->
        <div class="p-8 text-center">
            <FileText class="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No notes found
            </h3>
            <p class="text-gray-500 dark:text-gray-400 mb-4">
                Create your first note or try adjusting your search filters.
            </p>
        </div>
    {:else}
        {#each notes as note (note.id)}
            <div
                    class="relative group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
                    class:bg-blue-50={selectedNoteId === note.id}
                    class:dark:bg-blue-950={selectedNoteId === note.id}
                    class:border-r-2={selectedNoteId === note.id}
                    class:border-blue-500={selectedNoteId === note.id}
                    on:click={() => handleNoteSelect(note.id)}
                    on:keydown={(e) => handleKeydown(e, note.id)}
                    role="button"
                    tabindex="0"
                    aria-label={`Select note: ${note.title}`}
            >
                <div class="p-4">
                    <!-- Note Header -->
                    <div class="flex items-start justify-between mb-2">
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 mb-1">
                                <!-- Pin indicator -->
                                {#if note.isPinned}
                                    <Pin class="w-4 h-4 text-amber-500 flex-shrink-0" />
                                {/if}

                                <!-- Note title -->
                                <h3 class="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {note.title || 'Untitled'}
                                </h3>
                            </div>

                            <!-- Note preview -->
                            {#if note.content}
                                <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                                    {truncateText(extractTextContent(note.content), 80)}
                                </p>
                            {/if}
                        </div>

                        <!-- Menu Button -->
                        <div class="relative">
                            <Button
                                    variant="ghost"
                                    size="xs"
                                    className="p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    ariaLabel="Note options"
                                    on:click={(e) => toggleMenu(note.id, e)}
                            >
                                <MoreVertical class="w-4 h-4" />
                            </Button>

                            <!-- Dropdown Menu -->
                            {#if openMenuId === note.id}
                                <div
                                        class="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 min-w-40"
                                        transition:slide={{ duration: 150 }}
                                >
                                    <button
                                            class="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg flex items-center gap-2"
                                            on:click={(e) => handlePin(note.id, e)}
                                    >
                                        <Pin class="w-4 h-4" />
                                        {note.isPinned ? 'Unpin' : 'Pin'}
                                    </button>

                                    <button
                                            class="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                            on:click={(e) => handleDuplicate(note.id, e)}
                                    >
                                        <Copy class="w-4 h-4" />
                                        Duplicate
                                    </button>

                                    <hr class="border-gray-200 dark:border-gray-700" />

                                    <button
                                            class="w-full px-3 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-b-lg flex items-center gap-2"
                                            on:click={(e) => handleDelete(note.id, e)}
                                    >
                                        <Trash2 class="w-4 h-4" />
                                        Delete
                                    </button>
                                </div>
                            {/if}
                        </div>
                    </div>

                    <!-- Note metadata -->
                    <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <div class="flex items-center gap-3">
                            <!-- Update time -->
                            <span class="flex items-center gap-1">
                <Calendar class="w-3 h-3" />
                                {formatDate(note.updatedAt)}
              </span>

                            <!-- Drawing indicator -->
                            {#if note.drawings && note.drawings.length > 0}
                <span class="flex items-center gap-1 text-blue-500">
                  <Image class="w-3 h-3" />
                    {note.drawings.length}
                </span>
                            {/if}
                        </div>
                    </div>

                    <!-- Tags -->
                    {#if note.tags && note.tags.length > 0}
                        <div class="flex flex-wrap gap-1 mt-2">
                            {#each note.tags.slice(0, 3) as tag}
                <span class="inline-flex items-center px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                  <Tag class="w-2.5 h-2.5 mr-1" />
                    {tag}
                </span>
                            {/each}

                            {#if note.tags.length > 3}
                <span class="text-xs text-gray-400 dark:text-gray-500">
                  +{note.tags.length - 3}
                </span>
                            {/if}
                        </div>
                    {/if}
                </div>
            </div>
        {/each}
    {/if}
</div>

<style>
    .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
</style>