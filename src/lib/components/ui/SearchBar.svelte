<script>
    import { createEventDispatcher, onMount } from 'svelte';
    import { Search, X, Filter } from 'lucide-svelte';
    import { debounceSearch } from '$lib/utils/debounce.js';
    import Button from './Button.svelte';

    // Props
    export let value = '';
    export let placeholder = 'Search notes...';
    export let disabled = false;
    export let autofocus = false;
    export let showClearButton = true;
    export let showFilterButton = false;
    export let size = 'md'; // 'sm', 'md', 'lg'
    export let className = '';
    export let debounceDelay = 300;
    export let filterCount = 0;

    // Event dispatcher
    const dispatch = createEventDispatcher();

    let inputElement;
    let isFocused = false;

    // Debounced search function
    const debouncedSearch = debounceSearch((query) => {
        dispatch('search', { query });
    }, debounceDelay);

    // Size classes
    $: sizeClasses = {
        sm: 'px-3 py-2 text-sm',
        md: 'px-4 py-2.5 text-sm',
        lg: 'px-4 py-3 text-base'
    }[size];

    $: iconSize = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-5 h-5'
    }[size];

    // Handle input changes
    function handleInput(event) {
        value = event.target.value;
        dispatch('input', { value });
        debouncedSearch(value);
    }

    // Handle key events
    function handleKeydown(event) {
        dispatch('keydown', event);

        if (event.key === 'Escape') {
            clear();
            inputElement?.blur();
        } else if (event.key === 'Enter') {
            dispatch('submit', { value });
        }
    }

    // Clear search
    function clear() {
        value = '';
        dispatch('input', { value });
        dispatch('clear');
        debouncedSearch('');
        inputElement?.focus();
    }

    // Handle focus events
    function handleFocus(event) {
        isFocused = true;
        dispatch('focus', event);
    }

    function handleBlur(event) {
        isFocused = false;
        dispatch('blur', event);
    }

    // Handle filter button click
    function handleFilterClick() {
        dispatch('filter');
    }

    // Public methods
    export function focus() {
        inputElement?.focus();
    }

    export function blur() {
        inputElement?.blur();
    }

    export function select() {
        inputElement?.select();
    }

    // Auto-focus
    onMount(() => {
        if (autofocus) {
            inputElement?.focus();
        }
    });
</script>

<div class="relative {className}">
    <!-- Search Input Container -->
    <div
            class="relative flex items-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg transition-all duration-200"
            class:ring-2={isFocused}
            class:ring-primary-500={isFocused}
            class:border-primary-500={isFocused}
            class:opacity-50={disabled}
    >
        <!-- Search Icon -->
        <div class="absolute left-3 flex items-center pointer-events-none">
            <Search class="{iconSize} text-gray-400 dark:text-gray-500" />
        </div>

        <!-- Input Field -->
        <input
                bind:this={inputElement}
                type="text"
                {value}
                {placeholder}
                {disabled}
                class="w-full {sizeClasses} pl-10 pr-12 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border-none rounded-lg focus:outline-none focus:ring-0"
                class:pr-20={showClearButton && showFilterButton}
                class:pr-16={(showClearButton && !showFilterButton) || (!showClearButton && showFilterButton)}
                on:input={handleInput}
                on:keydown={handleKeydown}
                on:focus={handleFocus}
                on:blur={handleBlur}
                autocomplete="off"
                spellcheck="false"
        />

        <!-- Right Side Buttons -->
        <div class="absolute right-2 flex items-center gap-1">
            <!-- Clear Button -->
            {#if showClearButton && value}
                <Button
                        variant="ghost"
                        size="xs"
                        className="p-1.5"
                        ariaLabel="Clear search"
                        on:click={clear}
                >
                    <X class="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                </Button>
            {/if}

            <!-- Filter Button -->
            {#if showFilterButton}
                <Button
                        variant="ghost"
                        size="xs"
                        className="p-1.5 relative"
                        ariaLabel="Filter options"
                        on:click={handleFilterClick}
                >
                    <Filter class="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                    {#if filterCount > 0}
            <span class="absolute -top-1 -right-1 w-4 h-4 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center">
              {filterCount > 9 ? '9+' : filterCount}
            </span>
                    {/if}
                </Button>
            {/if}
        </div>
    </div>

    <!-- Search Suggestions/Results (slot) -->
    {#if $$slots.suggestions}
        <div class="absolute top-full left-0 right-0 z-50 mt-1">
            <slot name="suggestions" />
        </div>
    {/if}
</div>

<!-- Keyboard Shortcut Hint -->
{#if $$slots.hint}
    <div class="mt-2 text-xs text-gray-500 dark:text-gray-400">
        <slot name="hint" />
    </div>
{/if}

<style>
    /* Remove default input styling */
    input::-webkit-search-decoration,
    input::-webkit-search-cancel-button,
    input::-webkit-search-results-button,
    input::-webkit-search-results-decoration {
        -webkit-appearance: none;
    }

    input[type="search"] {
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
    }
</style>