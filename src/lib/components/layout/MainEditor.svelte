<script>
    import { createEventDispatcher, onMount, onDestroy } from 'svelte';
    import { browser } from '$app/environment';
    import {
        Save,
        MoreVertical,
        Pin,
        Copy,
        Trash2,
        Tag,
        Hash,
        Calendar,
        FileText,
        Image,
        Palette, Plus
    } from 'lucide-svelte';
    import { slide } from 'svelte/transition';

    import Button from '../../components/ui/Button.svelte';
    import Modal from '../../components/ui/Modal.svelte';
    import RichTextEditor from '../../components/editor/RichTextEditor.svelte';
    import DrawingCanvas from '../../components/drawing/DrawingCanvas.svelte';

    import { useCurrentNote, notesActions } from '../../stores/notesStore.js';
    import { useEditor } from '../../stores/editorStore.js';
    import { debounceAutoSave } from '../../utils/debounce.js';
    import { clickOutside } from '../../utils/clickOutside.js';

    // Props
    export let className = '';

    // Event dispatcher
    const dispatch = createEventDispatcher();

    // Store subscriptions - FIXED: useCurrentNote() IS a store, not an object to destructure
    const currentNote = useCurrentNote();

    const {
        state: editorState,
        preferences: editorPreferences,
        content: editorContent,
        stats: editorStats,
        hasUnsavedChanges: editorHasUnsavedChanges,
        canUndo,
        canRedo,
        // Include all the editor actions
        initializeEditor,
        setContent,
        getContent,
        enableAutoSave,
        disableAutoSave,
        save,
        setEditing,
        setLoading,
        addToHistory,
        undo,
        redo,
        toggleBold,
        toggleItalic,
        setHeading,
        toggleBulletList,
        toggleOrderedList,
        updatePreferences,
        setAutoSave,
        setAutoSaveDelay,
        setShowWordCount,
        setSpellCheck,
        setTypewriterMode,
        setFocusMode,
        setEditorWidth,
        insertText,
        getSelectedText,
        clearContent,
        focus,
        blur
    } = useEditor();

    // Local state
    let showNoteMenu = false;
    let showTagInput = false;
    let showDrawing = false;
    let newTag = '';
    let tagInput;
    let editorComponent;
    let lastSavedContent = '';

    // Reactive values - FIXED: Use the stores correctly
    $: note = $currentNote;
    $: hasUnsavedChangesValue = $editorHasUnsavedChanges;
    $: statsValue = $editorStats;

    // Auto-save function
    const debouncedSave = debounceAutoSave((content) => {
        if (note && content !== lastSavedContent) {
            notesActions.updateNote(note.id, { content });
            lastSavedContent = content;
        }
    }, 500);

    // Handle editor updates
    function handleEditorUpdate(event) {
        const { content } = event.detail;
        debouncedSave(content);
    }

    // Handle manual save
    function handleSave() {
        if (editorComponent && note) {
            const content = editorComponent.getContent();
            notesActions.updateNote(note.id, { content });
            lastSavedContent = content;
            dispatch('save');
        }
    }

    // Handle title update
    function handleTitleUpdate(event) {
        const title = event.target.value;
        if (note) {
            notesActions.updateNote(note.id, { title });
        }
    }

    // Handle note actions
    function handlePin() {
        if (note) {
            notesActions.togglePin(note.id);
            showNoteMenu = false;
        }
    }

    function handleDuplicate() {
        if (note) {
            notesActions.duplicateNote(note.id);
            showNoteMenu = false;
        }
    }

    function handleDelete() {
        if (note && confirm('Are you sure you want to delete this note?')) {
            notesActions.deleteNote(note.id);
            showNoteMenu = false;
            dispatch('note-deleted');
        }
    }

    // Handle tag management
    function showTagInputField() {
        showTagInput = true;
        showNoteMenu = false;
        setTimeout(() => tagInput?.focus(), 0);
    }

    function handleTagKeydown(event) {
        if (event.key === 'Enter') {
            addTag();
        } else if (event.key === 'Escape') {
            cancelTagInput();
        }
    }

    function addTag() {
        if (newTag.trim() && note) {
            notesActions.addTag(note.id, newTag.trim());
            newTag = '';
            showTagInput = false;
        }
    }

    function cancelTagInput() {
        newTag = '';
        showTagInput = false;
    }

    function removeTag(tag) {
        if (note) {
            notesActions.removeTag(note.id, tag);
        }
    }

    // Handle drawing
    function handleInsertDrawing() {
        showDrawing = true;
    }

    function handleDrawingSave(event) {
        const { drawingData } = event.detail;
        if (note) {
            notesActions.addDrawing(note.id, drawingData);
            showDrawing = false;
        }
    }

    function handleDrawingCancel() {
        showDrawing = false;
    }

    // Format date
    function formatDate(timestamp) {
        return new Date(timestamp).toLocaleString();
    }

    // Close menus when clicking outside
    function handleClickOutside() {
        showNoteMenu = false;
    }

    // Initialize editor content when note changes
    $: if (note && editorComponent) {
        const noteContent = note.content || '';
        if (noteContent !== editorComponent.getContent()) {
            editorComponent.setContent(noteContent);
            lastSavedContent = noteContent;
        }
    }

    // Keyboard shortcuts
    function handleKeydown(event) {
        // Ctrl+S to save
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
            event.preventDefault();
            handleSave();
        }
        // Ctrl+P to pin
        else if ((event.ctrlKey || event.metaKey) && event.key === 'p') {
            event.preventDefault();
            handlePin();
        }
        // Ctrl+D to duplicate
        else if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
            event.preventDefault();
            handleDuplicate();
        }
        // Escape to close menus
        else if (event.key === 'Escape') {
            showNoteMenu = false;
            showTagInput = false;
        }
    }

    onMount(() => {
        if (browser) {
            document.addEventListener('keydown', handleKeydown);
        }
    });

    onDestroy(() => {
        if (browser) {
            document.removeEventListener('keydown', handleKeydown);
        }
    });
</script>

<div class="flex flex-col h-full bg-gray-50 dark:bg-gray-900 {className}" use:clickOutside={handleClickOutside}>
    {#if note}
        <!-- Note Header -->
        <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
            <div class="flex items-start justify-between mb-4">
                <!-- Title Input -->
                <input
                        type="text"
                        value={note.title || ''}
                        placeholder="Untitled Note"
                        class="flex-1 text-2xl font-bold bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border-none outline-none resize-none mr-4"
                        on:input={handleTitleUpdate}
                        on:blur={handleTitleUpdate}
                />

                <!-- Actions -->
                <div class="flex items-center gap-2">
                    <!-- Save Button - FIXED: Use the reactive value -->
                    <Button
                            variant={hasUnsavedChangesValue ? 'primary' : 'ghost'}
                            size="sm"
                            className="relative"
                            ariaLabel="Save note"
                            on:click={handleSave}
                    >
                        <Save class="w-4 h-4 mr-2" />
                        Save
                        {#if hasUnsavedChangesValue}
                            <span class="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full"></span>
                        {/if}
                    </Button>

                    <!-- More Menu -->
                    <div class="relative">
                        <Button
                                variant="ghost"
                                size="sm"
                                className="p-2"
                                ariaLabel="More options"
                                on:click={() => showNoteMenu = !showNoteMenu}
                        >
                            <MoreVertical class="w-4 h-4" />
                        </Button>

                        {#if showNoteMenu}
                            <div
                                    class="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 min-w-48"
                                    transition:slide={{ duration: 150 }}
                            >
                                <button
                                        class="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg flex items-center gap-2"
                                        on:click={handlePin}
                                >
                                    <Pin class="w-4 h-4" />
                                    {note.isPinned ? 'Unpin Note' : 'Pin Note'}
                                </button>

                                <button
                                        class="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                        on:click={showTagInputField}
                                >
                                    <Tag class="w-4 h-4" />
                                    Add Tag
                                </button>

                                <button
                                        class="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                        on:click={handleDuplicate}
                                >
                                    <Copy class="w-4 h-4" />
                                    Duplicate
                                </button>

                                <hr class="border-gray-200 dark:border-gray-700" />

                                <button
                                        class="w-full px-3 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-b-lg flex items-center gap-2"
                                        on:click={handleDelete}
                                >
                                    <Trash2 class="w-4 h-4" />
                                    Delete Note
                                </button>
                            </div>
                        {/if}
                    </div>
                </div>
            </div>

            <!-- Tags -->
            <div class="flex flex-wrap items-center gap-2 mb-4">
                {#if note.tags && note.tags.length > 0}
                    {#each note.tags as tag}
            <span class="inline-flex items-center px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
              <Hash class="w-3 h-3 mr-1" />
                {tag}
                <button
                        class="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                        on:click={() => removeTag(tag)}
                        aria-label="Remove tag"
                >
                ×
              </button>
            </span>
                    {/each}
                {/if}

                {#if showTagInput}
                    <div class="inline-flex items-center" transition:slide={{ duration: 150 }}>
                        <input
                                bind:this={tagInput}
                                bind:value={newTag}
                                type="text"
                                placeholder="Add tag..."
                                class="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                on:keydown={handleTagKeydown}
                                on:blur={cancelTagInput}
                        />
                    </div>
                {:else}
                    <button
                            class="inline-flex items-center px-2 py-1 text-xs text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 rounded-full hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                            on:click={showTagInputField}
                    >
                        <Tag class="w-3 h-3 mr-1" />
                        Add tag
                    </button>
                {/if}
            </div>

            <!-- Note Metadata -->
            <div class="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
        <span class="flex items-center gap-1">
          <Calendar class="w-4 h-4" />
          Created {formatDate(note.createdAt)}
        </span>

                <span class="flex items-center gap-1">
          <FileText class="w-4 h-4" />
          Modified {formatDate(note.updatedAt)}
        </span>

                {#if note.drawings && note.drawings.length > 0}
          <span class="flex items-center gap-1 text-blue-500">
            <Image class="w-4 h-4" />
              {note.drawings.length} drawing{note.drawings.length > 1 ? 's' : ''}
          </span>
                {/if}

                <!-- FIXED: Use the reactive value -->
                {#if statsValue}
          <span class="flex items-center gap-2">
            {#if statsValue.wordCount > 0}
              <span>{statsValue.wordCount} words</span>
            {/if}
              {#if statsValue.characterCount > 0}
              <span>{statsValue.characterCount} characters</span>
            {/if}
          </span>
                {/if}
            </div>
        </div>

        <!-- Editor Container -->
        <div class="flex-1 overflow-hidden">
            <RichTextEditor
                    bind:this={editorComponent}
                    content={note.content || ''}
                    placeholder="Start writing your note..."
                    autoSave={true}
                    on:update={handleEditorUpdate}
                    on:save={handleSave}
                    on:insert-drawing={handleInsertDrawing}
            />
        </div>

        <!-- Drawings Display -->
        {#if note.drawings && note.drawings.length > 0}
            <div class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
                <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <Image class="w-4 h-4" />
                    Drawings ({note.drawings.length})
                </h3>
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {#each note.drawings as drawing, index}
                        <div class="group relative">
                            <div class="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                                <!-- Drawing preview would go here -->
                                <div class="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                                    <Palette class="w-8 h-8" />
                                </div>
                            </div>
                            <button
                                    class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded shadow transition-opacity"
                                    on:click={() => notesActions.removeDrawing(note.id, index)}
                                    aria-label="Remove drawing"
                            >
                                <Trash2 class="w-3 h-3 text-red-500" />
                            </button>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}
    {:else}
        <!-- No Note Selected -->
        <div class="flex-1 flex items-center justify-center">
            <div class="text-center max-w-md mx-auto p-8">
                <FileText class="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Select a note to start editing
                </h2>
                <p class="text-gray-500 dark:text-gray-400 mb-6">
                    Choose a note from the sidebar or create a new one to begin writing.
                </p>
                <Button
                        variant="primary"
                        on:click={() => dispatch('create-note')}
                >
                    <Plus class="w-4 h-4 mr-2" />
                    Create New Note
                </Button>
            </div>
        </div>
    {/if}
</div>

<!-- Drawing Modal -->
<DrawingCanvas
        bind:open={showDrawing}
        on:save={handleDrawingSave}
        on:cancel={handleDrawingCancel}
/>

<style>
    /* Custom scrollbar for better UX */
    :global(.editor-container) {
        scrollbar-width: thin;
        scrollbar-color: #cbd5e1 transparent;
    }

    :global(.editor-container::-webkit-scrollbar) {
        width: 6px;
    }

    :global(.editor-container::-webkit-scrollbar-track) {
        background: transparent;
    }

    :global(.editor-container::-webkit-scrollbar-thumb) {
        background-color: #cbd5e1;
        border-radius: 3px;
    }

    :global(.dark .editor-container::-webkit-scrollbar-thumb) {
        background-color: #4b5563;
    }
</style>