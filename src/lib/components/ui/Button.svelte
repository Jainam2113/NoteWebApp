<script>
    import { createEventDispatcher } from 'svelte';

    // Props
    export let variant = 'primary'; // 'primary', 'secondary', 'ghost', 'danger'
    export let size = 'md'; // 'xs', 'sm', 'md', 'lg'
    export let disabled = false;
    export let loading = false;
    export let href = null; // If provided, renders as link
    export let type = 'button'; // 'button', 'submit', 'reset'
    export let fullWidth = false;
    export let icon = null; // Icon component or string
    export let iconPosition = 'left'; // 'left', 'right'
    export let tooltip = null;
    export let ariaLabel = null;
    export let className = '';

    // Event dispatcher
    const dispatch = createEventDispatcher();

    // Computed classes
    $: baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed';

    $: variantClasses = {
        primary: 'bg-primary-600 text-white hover:bg-primary-700 disabled:bg-gray-300 disabled:text-gray-500 shadow-sm hover:shadow-md',
        secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:disabled:bg-gray-900',
        ghost: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:text-gray-400 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100',
        danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-300 disabled:text-gray-500 shadow-sm hover:shadow-md'
    }[variant];

    $: sizeClasses = {
        xs: 'px-2 py-1 text-xs',
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base'
    }[size];

    $: classes = [
        baseClasses,
        variantClasses,
        sizeClasses,
        fullWidth ? 'w-full' : '',
        loading ? 'cursor-wait' : '',
        className
    ].filter(Boolean).join(' ');

    // Handle click
    function handleClick(event) {
        if (disabled || loading) {
            event.preventDefault();
            return;
        }
        dispatch('click', event);
    }

    // Handle keydown for accessibility
    function handleKeydown(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            handleClick(event);
        }
    }
</script>

{#if href}
    <a
            {href}
            class={classes}
            class:opacity-50={disabled}
            aria-label={ariaLabel}
            title={tooltip}
            on:click={handleClick}
            on:keydown={handleKeydown}
            tabindex={disabled ? -1 : 0}
            role="button"
            aria-disabled={disabled}
    >
        {#if loading}
            <div class="loading-spinner mr-2" aria-hidden="true"></div>
        {:else if icon && iconPosition === 'left'}
      <span class="mr-2" aria-hidden="true">
        {#if typeof icon === 'string'}
          {@html icon}
        {:else}
          <svelte:component this={icon} class="w-4 h-4" />
        {/if}
      </span>
        {/if}

        <slot />

        {#if icon && iconPosition === 'right' && !loading}
      <span class="ml-2" aria-hidden="true">
        {#if typeof icon === 'string'}
          {@html icon}
        {:else}
          <svelte:component this={icon} class="w-4 h-4" />
        {/if}
      </span>
        {/if}
    </a>
{:else}
    <button
            {type}
            class={classes}
            {disabled}
            aria-label={ariaLabel}
            title={tooltip}
            on:click={handleClick}
    >
        {#if loading}
            <div class="loading-spinner mr-2" aria-hidden="true"></div>
        {:else if icon && iconPosition === 'left'}
      <span class="mr-2" aria-hidden="true">
        {#if typeof icon === 'string'}
          {@html icon}
        {:else}
          <svelte:component this={icon} class="w-4 h-4" />
        {/if}
      </span>
        {/if}

        <slot />

        {#if icon && iconPosition === 'right' && !loading}
      <span class="ml-2" aria-hidden="true">
        {#if typeof icon === 'string'}
          {@html icon}
        {:else}
          <svelte:component this={icon} class="w-4 h-4" />
        {/if}
      </span>
        {/if}
    </button>
{/if}

<style>
    .loading-spinner {
        @apply inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin;
        border-right-color: transparent;
    }
</style>