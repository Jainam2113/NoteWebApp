<script>
    import { onMount, onDestroy, createEventDispatcher } from 'svelte';
    import { Editor } from '@tiptap/core';
    import Document from '@tiptap/extension-document';
    import Paragraph from '@tiptap/extension-paragraph';
    import Text from '@tiptap/extension-text';
    import Bold from '@tiptap/extension-bold';
    import Italic from '@tiptap/extension-italic';
    import Heading from '@tiptap/extension-heading';
    import BulletList from '@tiptap/extension-bullet-list';
    import OrderedList from '@tiptap/extension-ordered-list';
    import ListItem from '@tiptap/extension-list-item';
    import HardBreak from '@tiptap/extension-hard-break';
    import History from '@tiptap/extension-history';

    import {
        Bold as BoldIcon,
        Italic as ItalicIcon,
        List,
        ListOrdered,
        Heading1,
        Heading2,
        Heading3,
        Undo,
        Redo,
        Type,
        Palette,
        AlignLeft,
        Image as ImageIcon
    } from 'lucide-svelte';

    import Button from '$lib/components/ui/Button.svelte';
    import { editorActions } from '$lib/stores/editorStore.js';
    import { debounceAutoSave } from '$lib/utils/debounce.js';

    // Props
    export let content = '';
    export let placeholder = 'Start writing...';
    export let editable = true;
    export let showToolbar = true;
    export let autoSave = true;
    export let className = '';

    // Event dispatcher
    const dispatch = createEventDispatcher();

    // Editor instance
    let editor;
    let editorElement;
    let toolbarElement;

    // Editor state
    let isEditorFocused = false;
    let currentFormat = {};

    // Auto-save function
    const debouncedSave = debounceAutoSave((content) => {
        dispatch('save', { content });
    }, 500);

    // Initialize editor
    onMount(() => {
        editor = new Editor({
            element: editorElement,
            extensions: [
                Document,
                Paragraph,
                Text,
                Bold,
                Italic,
                Heading.configure({
                    levels: [1, 2, 3],
                }),
                BulletList.configure({
                    HTMLAttributes: {
                        class: 'tiptap-bullet-list',
                    },
                }),
                OrderedList.configure({
                    HTMLAttributes: {
                        class: 'tiptap-ordered-list',
                    },
                }),
                ListItem,
                HardBreak,
                History.configure({
                    depth: 50,
                }),
            ],
            content,
            editable,
            autofocus: false,
            editorProps: {
                attributes: {
                    class: 'prose dark:prose-dark max-w-none focus:outline-none px-6 py-4',
                    spellcheck: 'true',
                },
            },
            onUpdate: ({ editor: ed }) => {
                const newContent = ed.getHTML();
                content = newContent;
                updateCurrentFormat();
                dispatch('update', { content: newContent });

                if (autoSave) {
                    debouncedSave(newContent);
                }
            },
            onFocus: () => {
                isEditorFocused = true;
                dispatch('focus');
            },
            onBlur: () => {
                isEditorFocused = false;
                dispatch('blur');
            },
            onSelectionUpdate: () => {
                updateCurrentFormat();
            },
        });

        // Initialize editor actions
        editorActions.initializeEditor(editor);

        // Set initial content if provided
        if (content && content !== editor.getHTML()) {
            editor.commands.setContent(content);
        }
    });

    // Cleanup
    onDestroy(() => {
        if (editor) {
            editor.destroy();
        }
    });

    // Update current format state
    function updateCurrentFormat() {
        if (!editor) return;

        currentFormat = {
            bold: editor.isActive('bold'),
            italic: editor.isActive('italic'),
            heading1: editor.isActive('heading', { level: 1 }),
            heading2: editor.isActive('heading', { level: 2 }),
            heading3: editor.isActive('heading', { level: 3 }),
            bulletList: editor.isActive('bulletList'),
            orderedList: editor.isActive('orderedList'),
        };
    }

    // Toolbar actions
    function toggleBold() {
        editor?.chain().focus().toggleBold().run();
    }

    function toggleItalic() {
        editor?.chain().focus().toggleItalic().run();
    }

    function toggleHeading(level) {
        if (editor?.isActive('heading', { level })) {
            editor.chain().focus().setParagraph().run();
        } else {
            editor?.chain().focus().toggleHeading({ level }).run();
        }
    }

    function toggleBulletList() {
        editor?.chain().focus().toggleBulletList().run();
    }

    function toggleOrderedList() {
        editor?.chain().focus().toggleOrderedList().run();
    }

    function undo() {
        editor?.chain().focus().undo().run();
    }

    function redo() {
        editor?.chain().focus().redo().run();
    }

    function insertDrawing() {
        dispatch('insert-drawing');
    }

    // Public methods
    export function focus() {
        editor?.commands.focus();
    }

    export function getContent() {
        return editor?.getHTML() || '';
    }

    export function setContent(newContent) {
        if (editor && newContent !== editor.getHTML()) {
            editor.commands.setContent(newContent);
        }
    }

    export function insertContent(newContent) {
        editor?.commands.insertContent(newContent);
    }

    export function clearContent() {
        editor?.commands.clearContent();
    }

    // Handle slash commands
    function handleSlashCommand(command) {
        switch (command) {
            case 'heading1':
            case 'h1':
                toggleHeading(1);
                break;
            case 'heading2':
            case 'h2':
                toggleHeading(2);
                break;
            case 'heading3':
            case 'h3':
                toggleHeading(3);
                break;
            case 'bullet':
            case 'ul':
                toggleBulletList();
                break;
            case 'number':
            case 'ol':
                toggleOrderedList();
                break;
            case 'drawing':
            case 'draw':
                insertDrawing();
                break;
        }
    }

    // Watch for content changes from outside
    $: if (editor && content !== editor.getHTML()) {
        editor.commands.setContent(content);
    }

    // Watch for editable changes
    $: if (editor) {
        editor.setEditable(editable);
    }
</script>

<div class="flex flex-col h-full bg-white dark:bg-gray-900 {className}">
    <!-- Toolbar -->
    {#if showToolbar}
        <div
                bind:this={toolbarElement}
                class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2"
        >
            <div class="flex items-center gap-1 flex-wrap">
                <!-- Text Formatting -->
                <div class="flex items-center gap-1 pr-2 border-r border-gray-300 dark:border-gray-600">
                    <Button
                            variant={currentFormat.bold ? 'primary' : 'ghost'}
                            size="sm"
                            className="p-2"
                            ariaLabel="Bold"
                            on:click={toggleBold}
                    >
                        <BoldIcon class="w-4 h-4" />
                    </Button>

                    <Button
                            variant={currentFormat.italic ? 'primary' : 'ghost'}
                            size="sm"
                            className="p-2"
                            ariaLabel="Italic"
                            on:click={toggleItalic}
                    >
                        <ItalicIcon class="w-4 h-4" />
                    </Button>
                </div>

                <!-- Headings -->
                <div class="flex items-center gap-1 pr-2 border-r border-gray-300 dark:border-gray-600">
                    <Button
                            variant={currentFormat.heading1 ? 'primary' : 'ghost'}
                            size="sm"
                            className="p-2"
                            ariaLabel="Heading 1"
                            on:click={() => toggleHeading(1)}
                    >
                        <Heading1 class="w-4 h-4" />
                    </Button>

                    <Button
                            variant={currentFormat.heading2 ? 'primary' : 'ghost'}
                            size="sm"
                            className="p-2"
                            ariaLabel="Heading 2"
                            on:click={() => toggleHeading(2)}
                    >
                        <Heading2 class="w-4 h-4" />
                    </Button>

                    <Button
                            variant={currentFormat.heading3 ? 'primary' : 'ghost'}
                            size="sm"
                            className="p-2"
                            ariaLabel="Heading 3"
                            on:click={() => toggleHeading(3)}
                    >
                        <Heading3 class="w-4 h-4" />
                    </Button>
                </div>

                <!-- Lists -->
                <div class="flex items-center gap-1 pr-2 border-r border-gray-300 dark:border-gray-600">
                    <Button
                            variant={currentFormat.bulletList ? 'primary' : 'ghost'}
                            size="sm"
                            className="p-2"
                            ariaLabel="Bullet List"
                            on:click={toggleBulletList}
                    >
                        <List class="w-4 h-4" />
                    </Button>

                    <Button
                            variant={currentFormat.orderedList ? 'primary' : 'ghost'}
                            size="sm"
                            className="p-2"
                            ariaLabel="Numbered List"
                            on:click={toggleOrderedList}
                    >
                        <ListOrdered class="w-4 h-4" />
                    </Button>
                </div>

                <!-- Drawing -->
                <div class="flex items-center gap-1 pr-2 border-r border-gray-300 dark:border-gray-600">
                    <Button
                            variant="ghost"
                            size="sm"
                            className="p-2"
                            ariaLabel="Insert Drawing"
                            on:click={insertDrawing}
                    >
                        <ImageIcon class="w-4 h-4" />
                    </Button>
                </div>

                <!-- History -->
                <div class="flex items-center gap-1">
                    <Button
                            variant="ghost"
                            size="sm"
                            className="p-2"
                            ariaLabel="Undo"
                            disabled={!editor?.can().undo()}
                            on:click={undo}
                    >
                        <Undo class="w-4 h-4" />
                    </Button>

                    <Button
                            variant="ghost"
                            size="sm"
                            className="p-2"
                            ariaLabel="Redo"
                            disabled={!editor?.can().redo()}
                            on:click={redo}
                    >
                        <Redo class="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    {/if}

    <!-- Editor Container -->
    <div class="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
        <div
                bind:this={editorElement}
                class="min-h-full"
                data-placeholder={placeholder}
        ></div>
    </div>
</div>

<style>
    /* TipTap Editor Styles */
    :global(.ProseMirror) {
        outline: none;
        min-height: 100%;
        line-height: 1.6;
    }

    :global(.ProseMirror p.is-editor-empty:first-child::before) {
        content: attr(data-placeholder);
        float: left;
        color: #9ca3af;
        pointer-events: none;
        height: 0;
    }

    /* Dark mode placeholder */
    :global(.dark .ProseMirror p.is-editor-empty:first-child::before) {
        color: #6b7280;
    }

    /* List styles */
    :global(.tiptap-bullet-list) {
        list-style-type: disc;
        margin-left: 1rem;
        padding-left: 0.5rem;
    }

    :global(.tiptap-ordered-list) {
        list-style-type: decimal;
        margin-left: 1rem;
        padding-left: 0.5rem;
    }

    :global(.tiptap-bullet-list li),
    :global(.tiptap-ordered-list li) {
        margin: 0.25rem 0;
    }

    /* Nested lists */
    :global(.tiptap-bullet-list .tiptap-bullet-list) {
        list-style-type: circle;
    }

    :global(.tiptap-bullet-list .tiptap-bullet-list .tiptap-bullet-list) {
        list-style-type: square;
    }

    /* Heading styles */
    :global(.ProseMirror h1) {
        font-size: 2rem;
        font-weight: 700;
        line-height: 1.2;
        margin: 1.5rem 0 1rem 0;
        color: #111827;
    }

    :global(.ProseMirror h2) {
        font-size: 1.5rem;
        font-weight: 600;
        line-height: 1.3;
        margin: 1.25rem 0 0.75rem 0;
        color: #111827;
    }

    :global(.ProseMirror h3) {
        font-size: 1.25rem;
        font-weight: 600;
        line-height: 1.4;
        margin: 1rem 0 0.5rem 0;
        color: #111827;
    }

    /* Dark mode heading styles */
    :global(.dark .ProseMirror h1),
    :global(.dark .ProseMirror h2),
    :global(.dark .ProseMirror h3) {
        color: #f9fafb;
    }

    /* Paragraph styles */
    :global(.ProseMirror p) {
        margin: 0.75rem 0;
        color: #374151;
    }

    :global(.dark .ProseMirror p) {
        color: #d1d5db;
    }

    /* Strong and emphasis */
    :global(.ProseMirror strong) {
        font-weight: 700;
    }

    :global(.ProseMirror em) {
        font-style: italic;
    }

    /* Selection */
    :global(.ProseMirror ::selection) {
        background-color: #3b82f6;
        color: white;
    }

    /* Focus styles */
    :global(.ProseMirror:focus) {
        outline: none;
    }

    /* Hard break */
    :global(.ProseMirror br) {
        margin: 0;
    }
</style>