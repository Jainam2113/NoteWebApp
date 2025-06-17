<script>
    import { createEventDispatcher, onMount, onDestroy } from 'svelte';
    import { fade, scale } from 'svelte/transition';
    import { browser } from '$app/environment';
    import { X } from 'lucide-svelte';
    import Button from './Button.svelte';

    // Props
    export let open = false;
    export let title = '';
    export let description = '';
    export let size = 'md'; // 'sm', 'md', 'lg', 'xl', 'full'
    export let closable = true;
    export let closeOnEscape = true;
    export let closeOnBackdrop = true;
    export let showHeader = true;
    export let showFooter = false;
    export let className = '';
    export let zIndex = 50;

    // Event dispatcher
    const dispatch = createEventDispatcher();

    let modalElement;
    let previousFocus;

    // Size classes
    $: sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-7xl mx-4'
    }[size];

    // Handle escape key
    function handleKeydown(event) {
        if (event.key === 'Escape' && closeOnEscape && closable) {
            close();
        }
    }

    // Handle backdrop click
    function handleBackdropClick(event) {
        if (event.target === event.currentTarget && closeOnBackdrop && closable) {
            close();
        }
    }

    // Close modal
    function close() {
        dispatch('close');
    }

    // Focus management - FIXED: Guard with browser check
    function trapFocus(node) {
        if (!browser) return {};

        const focusableElements = node.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        function handleTabKey(event) {
            if (event.key !== 'Tab') return;

            if (event.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    event.preventDefault();
                    lastFocusable?.focus();
                }
            } else {
                if (document.activeElement === lastFocusable) {
                    event.preventDefault();
                    firstFocusable?.focus();
                }
            }
        }

        node.addEventListener('keydown', handleTabKey);

        // Focus first element
        if (firstFocusable) {
            firstFocusable.focus();
        }

        return {
            destroy() {
                node.removeEventListener('keydown', handleTabKey);
            }
        };
    }

    // FIXED: Move document access to onMount to avoid SSR issues
    onMount(() => {
        // This reactive effect will only run in browser
        const unsubscribe = (() => {
            let prevOpen = false;

            return () => {
                if (open && !prevOpen) {
                    // Opening modal
                    previousFocus = document.activeElement;
                    document.body.style.overflow = 'hidden';
                    document.addEventListener('keydown', handleKeydown);
                } else if (!open && prevOpen) {
                    // Closing modal
                    document.body.style.overflow = '';
                    document.removeEventListener('keydown', handleKeydown);
                    if (previousFocus) {
                        previousFocus.focus();
                    }
                }
                prevOpen = open;
            };
        })();

        // Watch for changes to open prop
        $: if (browser) {
            unsubscribe();
        }

        return unsubscribe;
    });

    onDestroy(() => {
        // Cleanup - FIXED: Guard with browser check
        if (browser) {
            document.body.style.overflow = '';
            document.removeEventListener('keydown', handleKeydown);
        }
    });
</script>

{#if open}
    <!-- Backdrop -->
    <div
            class="fixed inset-0 bg-black/50 backdrop-blur-sm"
            style="z-index: {zIndex}"
            transition:fade={{ duration: 200 }}
            on:click={handleBackdropClick}
            on:keydown={handleKeydown}
            role="presentation"
    >
        <!-- Modal Container -->
        <div
                class="fixed inset-0 flex items-center justify-center p-4"
                role="presentation"
        >
            <!-- Modal -->
            <div
                    bind:this={modalElement}
                    class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full {sizeClasses} max-h-[90vh] flex flex-col {className}"
                    transition:scale={{ duration: 200, start: 0.95 }}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={title ? 'modal-title' : undefined}
                    aria-describedby={description ? 'modal-description' : undefined}
                    use:trapFocus
            >
                <!-- Header -->
                {#if showHeader}
                    <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                        <div class="flex-1 min-w-0">
                            {#if title}
                                <h2 id="modal-title" class="text-xl font-semibold text-gray-900 dark:text-white truncate">
                                    {title}
                                </h2>
                            {/if}
                            {#if description}
                                <p id="modal-description" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    {description}
                                </p>
                            {/if}
                            <slot name="header" />
                        </div>

                        {#if closable}
                            <Button
                                    variant="ghost"
                                    size="sm"
                                    className="ml-4 p-2"
                                    ariaLabel="Close modal"
                                    on:click={close}
                            >
                                <X class="w-5 h-5" />
                            </Button>
                        {/if}
                    </div>
                {/if}

                <!-- Content -->
                <div class="flex-1 overflow-y-auto p-6">
                    <slot />
                </div>

                <!-- Footer -->
                {#if showFooter || $$slots.footer}
                    <div class="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                        <slot name="footer">
                            {#if closable}
                                <Button variant="secondary" on:click={close}>
                                    Cancel
                                </Button>
                            {/if}
                        </slot>
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}

<style>
    /* Ensure modal appears above other content */
    :global(body.modal-open) {
        overflow: hidden;
    }
</style>