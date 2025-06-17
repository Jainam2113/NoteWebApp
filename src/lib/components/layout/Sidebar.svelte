<script>
    import {createEventDispatcher, onMount} from 'svelte';
    import {
        Plus,
        Search,
        Settings,
        Moon,
        Sun,
        Monitor,
        Menu,
        X,
        Filter,
        SortAsc,
        SortDesc,
        Tag,
        Pin,
        Calendar,
        FileText
    } from 'lucide-svelte';
    import {slide} from 'svelte/transition';
    import {clickOutside} from '../../utils/clickOutside.js';

    import Button from '../../components/ui/Button.svelte';
    import SearchBar from '../../components/ui/SearchBar.svelte';
    import NotesList from './NotesList.svelte';

    import {useTheme} from '../../stores/themeStore.js';
    import {useSearch, useSort, allTags, notesStats} from "../../stores/notesStore.js";

    // Props
    export let isOpen = false;
    export let isMobile = false;

    // Event dispatcher
    const dispatch = createEventDispatcher();

    // Store subscriptions - FIXED: Properly destructure the returned objects
    const theme = useTheme();
    const {
        query: searchQuery,
        selectedTags: searchSelectedTags,
        setQuery,
        clearSearch,
        toggleTagFilter,
        clearTagFilters
    } = useSearch();
    const {
        sortBy,
        sortOrder,
        setSortBy,
        setSortOrder,
        toggleSortOrder
    } = useSort();

    // Local state
    let showFilters = false;
    let showSortMenu = false;
    let showTagFilter = false;

    // Reactive values - FIXED: Use the destructured stores directly
    $: searchQueryValue = $searchQuery;
    $: selectedTags = $searchSelectedTags;
    $: currentSortBy = $sortBy;
    $: currentSortOrder = $sortOrder;
    $: tags = $allTags;
    $: stats = $notesStats;

    // Filter count for display
    $: filterCount = selectedTags.length;

    // Theme icons
    $: themeIcon = $theme.isDark ? Sun : $theme.mode === 'system' ? Monitor : Moon;

    // Handle search - FIXED: Use the destructured function
    function handleSearch(event) {
        setQuery(event.detail.query);
    }

    // Handle search clear - FIXED: Use the destructured function
    function handleSearchClear() {
        clearSearch();
    }

    // Handle new note
    function handleNewNote() {
        dispatch('create-note');
    }

    // Handle settings
    function handleSettings() {
        dispatch('open-settings');
    }

    // Handle theme toggle
    function handleThemeToggle() {
        theme.toggle();
    }

    // Handle sort changes - FIXED: Use the destructured functions
    function handleSortBy(field) {
        setSortBy(field);
        showSortMenu = false;
    }

    function handleSortOrder() {
        toggleSortOrder();
    }

    // Handle tag filter - FIXED: Use the destructured function
    function handleTagFilter(tag) {
        toggleTagFilter(tag);
    }

    // Handle filter toggle
    function handleFilterToggle() {
        showFilters = !showFilters;
    }

    // Close sidebar on mobile
    function closeSidebar() {
        if (isMobile) {
            dispatch('close');
        }
    }

    // Handle click outside to close menus
    function handleClickOutside() {
        showSortMenu = false;
        showTagFilter = false;
    }

    // Keyboard shortcuts
    function handleKeydown(event) {
        if (event.key === 'Escape') {
            showFilters = false;
            showSortMenu = false;
            showTagFilter = false;
        }
    }

    onMount(() => {
        document.addEventListener('keydown', handleKeydown);
        return () => {
            document.removeEventListener('keydown', handleKeydown);
        };
    });
</script>

<!-- Sidebar Container -->
<aside
        class="bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full"
        class:fixed={isMobile}
        class:inset-y-0={isMobile}
        class:left-0={isMobile}
        class:w-80={isMobile}
        class:z-50={isMobile}
        class:transform={isMobile}
        class:transition-transform={isMobile}
        class:duration-300={isMobile}
        class:ease-in-out={isMobile}
        class:-translate-x-full={isMobile && !isOpen}
        class:translate-x-0={isMobile && isOpen}
        class:sidebar-width={!isMobile}
        use:clickOutside={handleClickOutside}
>
    <!-- Header -->
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between mb-4">
            <h1 class="text-xl font-bold text-gray-900 dark:text-white">
                Notes
            </h1>

            <!-- Mobile close button -->
            {#if isMobile}
                <Button
                        variant="ghost"
                        size="sm"
                        className="p-2"
                        ariaLabel="Close sidebar"
                        on:click={closeSidebar}
                >
                    <X class="w-5 h-5"/>
                </Button>
            {/if}
        </div>

        <!-- New Note Button -->
        <Button
                variant="primary"
                fullWidth
                className="mb-4"
                on:click={handleNewNote}
        >
            <Plus class="w-4 h-4 mr-2"/>
            New Note
        </Button>

        <!-- Search Bar - FIXED: Use the correct reactive value -->
        <SearchBar
                bind:value={searchQueryValue}
                placeholder="Search notes..."
                showFilterButton={true}
                {filterCount}
                on:search={handleSearch}
                on:clear={handleSearchClear}
                on:filter={handleFilterToggle}
        >
            <div slot="hint" class="flex items-center gap-2">
                <span>Press</span>
                <kbd class="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 rounded border">
                    Ctrl+F
                </kbd>
                <span>to search</span>
            </div>
        </SearchBar>
    </div>

    <!-- Filters Section -->
    {#if showFilters}
        <div
                class="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
                transition:slide={{ duration: 200 }}
        >
            <!-- Sort Controls -->
            <div class="mb-4">
                <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sort by
                </h3>
                <div class="flex items-center gap-2">
                    <div class="relative">
                        <Button
                                variant="secondary"
                                size="sm"
                                className="min-w-0"
                                on:click={() => showSortMenu = !showSortMenu}
                        >
                            {#if currentSortBy === 'title'}
                                <FileText class="w-4 h-4 mr-2"/>
                                Title
                            {:else if currentSortBy === 'createdAt'}
                                <Calendar class="w-4 h-4 mr-2"/>
                                Created
                            {:else}
                                <Calendar class="w-4 h-4 mr-2"/>
                                Updated
                            {/if}
                        </Button>

                        {#if showSortMenu}
                            <div
                                    class="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 min-w-32"
                                    transition:slide={{ duration: 150 }}
                            >
                                <button
                                        class="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
                                        class:bg-gray-100={currentSortBy === 'updatedAt'}
                                        class:dark:bg-gray-700={currentSortBy === 'updatedAt'}
                                        on:click={() => handleSortBy('updatedAt')}
                                >
                                    Updated
                                </button>
                                <button
                                        class="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                                        class:bg-gray-100={currentSortBy === 'createdAt'}
                                        class:dark:bg-gray-700={currentSortBy === 'createdAt'}
                                        on:click={() => handleSortBy('createdAt')}
                                >
                                    Created
                                </button>
                                <button
                                        class="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg"
                                        class:bg-gray-100={currentSortBy === 'title'}
                                        class:dark:bg-gray-700={currentSortBy === 'title'}
                                        on:click={() => handleSortBy('title')}
                                >
                                    Title
                                </button>
                            </div>
                        {/if}
                    </div>

                    <Button
                            variant="secondary"
                            size="sm"
                            className="p-2"
                            ariaLabel={`Sort ${currentSortOrder === 'asc' ? 'ascending' : 'descending'}`}
                            on:click={handleSortOrder}
                    >
                        {#if currentSortOrder === 'asc'}
                            <SortAsc class="w-4 h-4"/>
                        {:else}
                            <SortDesc class="w-4 h-4"/>
                        {/if}
                    </Button>
                </div>
            </div>

            <!-- Tag Filters -->
            {#if tags.length > 0}
                <div>
                    <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Filter by tags
                    </h3>
                    <div class="flex flex-wrap gap-2">
                        {#each tags as tag}
                            <button
                                    class="inline-flex items-center px-2 py-1 text-xs rounded-full border transition-colors"
                                    class:bg-primary-100={selectedTags.includes(tag)}
                                    class:text-primary-800={selectedTags.includes(tag)}
                                    class:border-primary-300={selectedTags.includes(tag)}
                                    class:bg-gray-100={!selectedTags.includes(tag)}
                                    class:text-gray-600={!selectedTags.includes(tag)}
                                    class:border-gray-300={!selectedTags.includes(tag)}
                                    class:dark:bg-primary-900={selectedTags.includes(tag)}
                                    class:dark:text-primary-200={selectedTags.includes(tag)}
                                    class:dark:border-primary-700={selectedTags.includes(tag)}
                                    class:dark:bg-gray-800={!selectedTags.includes(tag)}
                                    class:dark:text-gray-400={!selectedTags.includes(tag)}
                                    class:dark:border-gray-600={!selectedTags.includes(tag)}
                                    on:click={() => handleTagFilter(tag)}
                            >
                                <Tag class="w-3 h-3 mr-1"/>
                                {tag}
                            </button>
                        {/each}
                    </div>

                    {#if selectedTags.length > 0}
                        <Button
                                variant="ghost"
                                size="xs"
                                className="mt-2"
                                on:click={() => clearTagFilters()}
                        >
                            Clear filters
                        </Button>
                    {/if}
                </div>
            {/if}
        </div>
    {/if}

    <!-- Stats Bar -->
    <div class="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{stats.total} notes</span>
            {#if stats.pinned > 0}
        <span class="flex items-center gap-1">
          <Pin class="w-3 h-3"/>
            {stats.pinned}
        </span>
            {/if}
        </div>
    </div>

    <!-- Notes List -->
    <div class="flex-1 overflow-y-auto">
        <NotesList
                on:note-select={(e) => dispatch('note-select', e.detail)}
                on:note-delete={(e) => dispatch('note-delete', e.detail)}
                on:note-pin={(e) => dispatch('note-pin', e.detail)}
                on:note-duplicate={(e) => dispatch('note-duplicate', e.detail)}
        />
    </div>

    <!-- Footer -->
    <div class="p-4 border-t border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
            <!-- Theme Toggle -->
            <Button
                    variant="ghost"
                    size="sm"
                    className="p-2"
                    ariaLabel="Toggle theme"
                    on:click={handleThemeToggle}
            >
                <svelte:component this={themeIcon} class="w-5 h-5"/>
            </Button>

            <!-- Settings -->
            <Button
                    variant="ghost"
                    size="sm"
                    className="p-2"
                    ariaLabel="Settings"
                    on:click={handleSettings}
            >
                <Settings class="w-5 h-5"/>
            </Button>
        </div>
    </div>
</aside>

<!-- Mobile Backdrop -->
{#if isMobile && isOpen}
    <div
            class="fixed inset-0 bg-black bg-opacity-50 z-40"
            on:click={closeSidebar}
            transition:fade={{ duration: 300 }}
    ></div>
{/if}

<style>
    .sidebar-width {
        width: 320px;
        min-width: 320px;
    }

    kbd {
        font-family: inherit;
        font-size: inherit;
    }
</style>