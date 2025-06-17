<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import '../app.css';

    // Performance monitoring
    let loadTime = 0;

    onMount(() => {
        if (browser) {
            // Record load time
            loadTime = performance.now();

            // Add performance marks
            performance.mark('app-loaded');

            // Log app initialization
            console.log(`%c🚀 Advanced Notes App loaded in ${loadTime.toFixed(2)}ms`,
                'color: #3b82f6; font-weight: bold;'
            );

            // Check for service worker support
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js').catch(err => {
                    console.log('Service worker registration failed:', err);
                });
            }

            // Handle app updates
            window.addEventListener('beforeinstallprompt', (e) => {
                console.log('PWA install prompt available');
                // Store the event to show install prompt later
                window.deferredPrompt = e;
            });

            // Add error boundary for unhandled errors
            window.addEventListener('error', (event) => {
                console.error('Unhandled error:', event.error);
                // You could send this to an error reporting service
            });

            window.addEventListener('unhandledrejection', (event) => {
                console.error('Unhandled promise rejection:', event.reason);
                // You could send this to an error reporting service
            });
        }
    });
</script>

<svelte:head>
    <!-- Meta tags -->
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#3b82f6" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="Notes" />

    <!-- Open Graph -->
    <meta property="og:title" content="Advanced Notes App" />
    <meta property="og:description" content="A modern note-taking application with rich text editing and drawing capabilities" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="/og-image.png" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Advanced Notes App" />
    <meta name="twitter:description" content="A modern note-taking application with rich text editing and drawing capabilities" />
    <meta name="twitter:image" content="/og-image.png" />

    <!-- Icons -->
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
    <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#3b82f6" />

    <!-- Manifest -->
    <link rel="manifest" href="/manifest.json" />

    <!-- Preload critical resources -->
    <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin />

    <!-- DNS prefetch for external resources -->
    <link rel="dns-prefetch" href="//fonts.googleapis.com" />
    <link rel="dns-prefetch" href="//fonts.gstatic.com" />
</svelte:head>

<!-- Root component -->
<div id="app" class="h-full">
    <slot />
</div>

<!-- Loading indicator for slow connections -->
{#if browser && loadTime === 0}
    <div class="fixed inset-0 bg-white dark:bg-gray-900 flex items-center justify-center z-50">
        <div class="text-center">
            <div class="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p class="text-gray-600 dark:text-gray-400">Loading Notes...</p>
        </div>
    </div>
{/if}

<style>
    /* Critical CSS for initial render */
    #app {
        min-height: 100vh;
        min-height: 100dvh; /* Dynamic viewport height for mobile */
    }

    /* Prevent flash of unstyled content */
    :global(body) {
        visibility: visible;
    }

    /* Ensure smooth transitions */
    :global(*) {
        box-sizing: border-box;
    }

    /* Override any default margins/padding */
    :global(html, body) {
        margin: 0;
        padding: 0;
        height: 100%;
        overflow: hidden;
    }

    /* Loading animation */
    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    .animate-spin {
        animation: spin 1s linear infinite;
    }
</style>