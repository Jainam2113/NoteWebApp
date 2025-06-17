<script>
    import { createEventDispatcher } from 'svelte';
    import {
        Settings,
        Palette,
        Type,
        Eye,
        Download,
        Upload,
        Trash2,
        Info,
        Moon,
        Sun,
        Monitor,
        Zap,
        FileText,
        Save
    } from 'lucide-svelte';

    import Modal from '$lib/components/ui/Modal.svelte';
    import Button from '$lib/components/ui/Button.svelte';

    import { useTheme, THEME_OPTIONS } from '$lib/stores/themeStore.js';
    import { useEditor, EDITOR_WIDTH_OPTIONS } from '$lib/stores/editorStore.js';
    import { notesActions, notesStats } from '$lib/stores/notesStore.js';
    import { storageQuota, notesStorage } from '$lib/utils/storage.js';

    // Props
    export let open = false;

    // Event dispatcher
    const dispatch = createEventDispatcher();

    // Store subscriptions - FIXED: Properly destructure the editor store
    const theme = useTheme();
    const {
        preferences: editorPreferences,
        setAutoSave,
        setSpellCheck,
        setTypewriterMode,
        setFocusMode,
        setEditorWidth,
        setShowWordCount
    } = useEditor();

    // Local state
    let activeTab = 'appearance';
    let storageInfo = null;
    let exportData = '';
    let importInput;

    // Reactive values
    $: stats = $notesStats;
    $: preferences = $editorPreferences; // Now this will work correctly
    $: themeConfig = $theme;

    // Tabs configuration
    const tabs = [
        { id: 'appearance', label: 'Appearance', icon: Palette },
        { id: 'editor', label: 'Editor', icon: Type },
        { id: 'data', label: 'Data', icon: FileText },
        { id: 'about', label: 'About', icon: Info }
    ];

    // Load storage information
    async function loadStorageInfo() {
        try {
            const usage = notesStorage.getUsageStats();
            const quota = await storageQuota.getQuotaInfo();
            const persistent = await storageQuota.isPersistent();

            storageInfo = {
                usage,
                quota,
                persistent
            };
        } catch (error) {
            console.error('Failed to load storage info:', error);
        }
    }

    // Handle theme changes
    function handleThemeChange(mode) {
        theme.setMode(mode);
    }

    function handleFontFamilyChange(event) {
        theme.setFontFamily(event.target.value);
    }

    function handleFontSizeChange(event) {
        theme.setFontSize(parseFloat(event.target.value));
    }

    function handleCompactModeChange(event) {
        theme.setCompactMode(event.target.checked);
    }

    function handleHighContrastChange(event) {
        theme.setHighContrast(event.target.checked);
    }

    function handleReducedMotionChange(event) {
        theme.setReducedMotion(event.target.checked);
    }

    // Handle editor preference changes - FIXED: Use the destructured functions
    function handleAutoSaveChange(event) {
        setAutoSave(event.target.checked);
    }

    function handleSpellCheckChange(event) {
        setSpellCheck(event.target.checked);
    }

    function handleTypewriterModeChange(event) {
        setTypewriterMode(event.target.checked);
    }

    function handleFocusModeChange(event) {
        setFocusMode(event.target.checked);
    }

    function handleEditorWidthChange(event) {
        setEditorWidth(event.target.value);
    }

    function handleWordCountChange(event) {
        setShowWordCount(event.target.checked);
    }

    // Data management
    function exportNotes() {
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
    }

    function handleImportFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target.result;
                const success = notesActions.importNotes(data);

                if (success) {
                    alert('Notes imported successfully!');
                } else {
                    alert('Failed to import notes. Please check the file format.');
                }
            } catch (error) {
                alert('Failed to import notes. Invalid file format.');
                console.error('Import error:', error);
            }
        };
        reader.readAsText(file);

        // Reset input
        event.target.value = '';
    }

    function clearAllData() {
        if (confirm('Are you sure you want to delete all notes? This action cannot be undone.')) {
            if (confirm('This will permanently delete all your notes. Are you absolutely sure?')) {
                notesActions.deleteAllNotes();
                alert('All notes have been deleted.');
            }
        }
    }

    async function requestPersistentStorage() {
        try {
            const granted = await storageQuota.requestPersistentStorage();
            if (granted) {
                alert('Persistent storage granted! Your notes are now protected from automatic cleanup.');
            } else {
                alert('Persistent storage was not granted. Your notes may be cleared if storage runs low.');
            }
            loadStorageInfo();
        } catch (error) {
            alert('Failed to request persistent storage.');
            console.error('Persistent storage error:', error);
        }
    }

    // Handle modal open
    $: if (open) {
        loadStorageInfo();
    }

    // Close modal
    function handleClose() {
        dispatch('close');
    }
</script>

<Modal bind:open size="lg" title="Settings" on:close={handleClose}>
    <div class="flex h-96">
        <!-- Sidebar -->
        <div class="w-48 border-r border-gray-200 dark:border-gray-700 pr-4">
            <nav class="space-y-1">
                {#each tabs as tab}
                    <button
                            class="w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2"
                            class:bg-primary-100={activeTab === tab.id}
                            class:text-primary-700={activeTab === tab.id}
                            class:dark:bg-primary-900={activeTab === tab.id}
                            class:dark:text-primary-200={activeTab === tab.id}
                            class:text-gray-600={activeTab !== tab.id}
                            class:dark:text-gray-400={activeTab !== tab.id}
                            class:hover:bg-gray-100={activeTab !== tab.id}
                            class:dark:hover:bg-gray-700={activeTab !== tab.id}
                            on:click={() => activeTab = tab.id}
                    >
                        <svelte:component this={tab.icon} class="w-4 h-4" />
                        {tab.label}
                    </button>
                {/each}
            </nav>
        </div>

        <!-- Content -->
        <div class="flex-1 pl-6 overflow-y-auto">
            {#if activeTab === 'appearance'}
                <div class="space-y-6">
                    <div>
                        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                            Theme
                        </h3>

                        <div class="grid grid-cols-3 gap-3 mb-6">
                            {#each THEME_OPTIONS.modes as mode}
                                <button
                                        class="p-4 border-2 rounded-lg transition-colors text-center"
                                        class:border-primary-500={themeConfig.mode === mode.value}
                                        class:bg-primary-50={themeConfig.mode === mode.value}
                                        class:dark:bg-primary-950={themeConfig.mode === mode.value}
                                        class:border-gray-300={themeConfig.mode !== mode.value}
                                        class:dark:border-gray-600={themeConfig.mode !== mode.value}
                                        on:click={() => handleThemeChange(mode.value)}
                                >
                                    <div class="flex justify-center mb-2">
                                        {#if mode.icon === 'sun'}
                                            <Sun class="w-6 h-6" />
                                        {:else if mode.icon === 'moon'}
                                            <Moon class="w-6 h-6" />
                                        {:else}
                                            <Monitor class="w-6 h-6" />
                                        {/if}
                                    </div>
                                    <div class="text-sm font-medium">{mode.label}</div>
                                </button>
                            {/each}
                        </div>
                    </div>

                    <div>
                        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                            Typography
                        </h3>

                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Font Family
                                </label>
                                <select
                                        value={themeConfig.fontFamily}
                                        on:change={handleFontFamilyChange}
                                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                >
                                    {#each THEME_OPTIONS.fontFamilies as font}
                                        <option value={font.value}>{font.label}</option>
                                    {/each}
                                </select>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Font Size: {themeConfig.fontSize}
                                </label>
                                <input
                                        type="range"
                                        min="0.8"
                                        max="1.2"
                                        step="0.1"
                                        value={themeConfig.fontSize}
                                        on:input={handleFontSizeChange}
                                        class="w-full"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                            Accessibility
                        </h3>

                        <div class="space-y-3">
                            <label class="flex items-center">
                                <input
                                        type="checkbox"
                                        checked={themeConfig.compactMode}
                                        on:change={handleCompactModeChange}
                                        class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Compact mode
                </span>
                            </label>

                            <label class="flex items-center">
                                <input
                                        type="checkbox"
                                        checked={themeConfig.highContrast}
                                        on:change={handleHighContrastChange}
                                        class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  High contrast mode
                </span>
                            </label>

                            <label class="flex items-center">
                                <input
                                        type="checkbox"
                                        checked={themeConfig.reducedMotion}
                                        on:change={handleReducedMotionChange}
                                        class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Reduce motion
                </span>
                            </label>
                        </div>
                    </div>
                </div>

            {:else if activeTab === 'editor'}
                <div class="space-y-6">
                    <div>
                        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                            Editor Preferences
                        </h3>

                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Editor Width
                                </label>
                                <select
                                        value={preferences.editorWidth}
                                        on:change={handleEditorWidthChange}
                                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                >
                                    {#each EDITOR_WIDTH_OPTIONS as option}
                                        <option value={option.value}>{option.label}</option>
                                    {/each}
                                </select>
                                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {EDITOR_WIDTH_OPTIONS.find(o => o.value === preferences.editorWidth)?.description}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                            Writing Features
                        </h3>

                        <div class="space-y-3">
                            <label class="flex items-center">
                                <input
                                        type="checkbox"
                                        checked={preferences.autoSave}
                                        on:change={handleAutoSaveChange}
                                        class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Auto-save enabled
                </span>
                            </label>

                            <label class="flex items-center">
                                <input
                                        type="checkbox"
                                        checked={preferences.spellCheck}
                                        on:change={handleSpellCheckChange}
                                        class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Spell check
                </span>
                            </label>

                            <label class="flex items-center">
                                <input
                                        type="checkbox"
                                        checked={preferences.typewriterMode}
                                        on:change={handleTypewriterModeChange}
                                        class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Typewriter scrolling
                </span>
                            </label>

                            <label class="flex items-center">
                                <input
                                        type="checkbox"
                                        checked={preferences.focusMode}
                                        on:change={handleFocusModeChange}
                                        class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Focus mode
                </span>
                            </label>

                            <label class="flex items-center">
                                <input
                                        type="checkbox"
                                        checked={preferences.showWordCount}
                                        on:change={handleWordCountChange}
                                        class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Show word count
                </span>
                            </label>
                        </div>
                    </div>
                </div>

            {:else if activeTab === 'data'}
                <div class="space-y-6">
                    <div>
                        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                            Notes Statistics
                        </h3>

                        <div class="grid grid-cols-2 gap-4 mb-6">
                            <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                <div class="text-2xl font-bold text-primary-600">{stats.total}</div>
                                <div class="text-sm text-gray-500 dark:text-gray-400">Total Notes</div>
                            </div>

                            <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                <div class="text-2xl font-bold text-amber-600">{stats.pinned}</div>
                                <div class="text-sm text-gray-500 dark:text-gray-400">Pinned</div>
                            </div>

                            <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                <div class="text-2xl font-bold text-blue-600">{stats.withTags}</div>
                                <div class="text-sm text-gray-500 dark:text-gray-400">With Tags</div>
                            </div>

                            <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                <div class="text-2xl font-bold text-purple-600">{stats.withDrawings}</div>
                                <div class="text-sm text-gray-500 dark:text-gray-400">With Drawings</div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                            Storage Information
                        </h3>

                        {#if storageInfo}
                            <div class="space-y-4">
                                <div>
                                    <div class="flex justify-between text-sm mb-1">
                                        <span>Used Storage</span>
                                        <span>{storageInfo.usage.usedFormatted}</span>
                                    </div>
                                    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                        <div
                                                class="bg-primary-600 h-2 rounded-full"
                                                style="width: {storageInfo.usage.percentage}%"
                                        ></div>
                                    </div>
                                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {storageInfo.usage.percentage.toFixed(1)}% of estimated limit
                                    </div>
                                </div>

                                {#if !storageInfo.persistent}
                                    <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                                        <div class="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                                            Your storage is not persistent and may be cleared automatically.
                                        </div>
                                        <Button
                                                size="sm"
                                                variant="secondary"
                                                on:click={requestPersistentStorage}
                                        >
                                            Request Persistent Storage
                                        </Button>
                                    </div>
                                {/if}
                            </div>
                        {/if}
                    </div>

                    <div>
                        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                            Import & Export
                        </h3>

                        <div class="space-y-3">
                            <Button
                                    variant="secondary"
                                    fullWidth
                                    on:click={exportNotes}
                            >
                                <Download class="w-4 h-4 mr-2" />
                                Export All Notes
                            </Button>

                            <Button
                                    variant="secondary"
                                    fullWidth
                                    on:click={() => importInput?.click()}
                            >
                                <Upload class="w-4 h-4 mr-2" />
                                Import Notes
                            </Button>

                            <input
                                    bind:this={importInput}
                                    type="file"
                                    accept=".json"
                                    class="hidden"
                                    on:change={handleImportFile}
                            />

                            <Button
                                    variant="danger"
                                    fullWidth
                                    on:click={clearAllData}
                            >
                                <Trash2 class="w-4 h-4 mr-2" />
                                Clear All Data
                            </Button>
                        </div>
                    </div>
                </div>

            {:else if activeTab === 'about'}
                <div class="space-y-6">
                    <div>
                        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                            Advanced Notes App
                        </h3>

                        <div class="space-y-4 text-sm text-gray-600 dark:text-gray-400">
                            <p>
                                A modern note-taking application built with Svelte and TailwindCSS,
                                featuring rich text editing, drawing capabilities, and advanced organization tools.
                            </p>

                            <div>
                                <h4 class="font-medium text-gray-900 dark:text-white mb-2">Features</h4>
                                <ul class="list-disc list-inside space-y-1">
                                    <li>Rich text editing with formatting options</li>
                                    <li>Drawing and annotation tools</li>
                                    <li>Tag-based organization</li>
                                    <li>Search and filtering</li>
                                    <li>Dark mode support</li>
                                    <li>Keyboard shortcuts</li>
                                    <li>Auto-save functionality</li>
                                    <li>Data export and import</li>
                                </ul>
                            </div>

                            <div>
                                <h4 class="font-medium text-gray-900 dark:text-white mb-2">Keyboard Shortcuts</h4>
                                <div class="grid grid-cols-2 gap-2">
                                    <div class="flex justify-between">
                                        <span>New Note</span>
                                        <code class="text-xs">Ctrl+N</code>
                                    </div>
                                    <div class="flex justify-between">
                                        <span>Save</span>
                                        <code class="text-xs">Ctrl+S</code>
                                    </div>
                                    <div class="flex justify-between">
                                        <span>Search</span>
                                        <code class="text-xs">Ctrl+F</code>
                                    </div>
                                    <div class="flex justify-between">
                                        <span>Command Palette</span>
                                        <code class="text-xs">Ctrl+K</code>
                                    </div>
                                </div>
                            </div>

                            <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
                                <p class="text-xs">
                                    Version 1.0.0 • Built with ❤️ using Svelte
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            {/if}
        </div>
    </div>

    <div slot="footer">
        <Button variant="primary" on:click={handleClose}>
            <Save class="w-4 h-4 mr-2" />
            Save Settings
        </Button>
    </div>
</Modal>