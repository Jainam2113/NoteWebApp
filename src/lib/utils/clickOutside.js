/**
 * Svelte action for detecting clicks outside an element
 * Usage: use:clickOutside={callback}
 */
export function clickOutside(node, callback) {
    if (!callback || typeof callback !== 'function') {
        console.warn('clickOutside action requires a callback function');
        return;
    }

    function handleClick(event) {
        // Check if the clicked element is outside the node
        if (node && !node.contains(event.target) && !event.defaultPrevented) {
            callback(event);
        }
    }

    // Add event listener
    document.addEventListener('click', handleClick, true);

    return {
        // Cleanup function
        destroy() {
            document.removeEventListener('click', handleClick, true);
        },

        // Update function for when callback changes
        update(newCallback) {
            if (typeof newCallback === 'function') {
                callback = newCallback;
            }
        }
    };
}

/**
 * Enhanced click outside action with additional options
 */
export function clickOutsideEnhanced(node, options = {}) {
    const {
        callback,
        enabled = true,
        ignore = [],
        capture = true,
        mousedown = false,
        touchstart = false
    } = options;

    if (!callback || typeof callback !== 'function') {
        console.warn('clickOutsideEnhanced action requires a callback function');
        return;
    }

    function shouldIgnore(target) {
        // Check if target should be ignored
        return ignore.some(selector => {
            if (typeof selector === 'string') {
                return target.closest(selector);
            } else if (selector instanceof Element) {
                return selector.contains(target);
            } else if (typeof selector === 'function') {
                return selector(target);
            }
            return false;
        });
    }

    function handleEvent(event) {
        if (!enabled) return;

        const target = event.target;

        // Check if the clicked element is outside the node
        if (node &&
            !node.contains(target) &&
            !event.defaultPrevented &&
            !shouldIgnore(target)) {
            callback(event);
        }
    }

    const events = ['click'];
    if (mousedown) events.push('mousedown');
    if (touchstart) events.push('touchstart');

    // Add event listeners
    events.forEach(eventType => {
        document.addEventListener(eventType, handleEvent, capture);
    });

    return {
        destroy() {
            events.forEach(eventType => {
                document.removeEventListener(eventType, handleEvent, capture);
            });
        },

        update(newOptions) {
            Object.assign(options, newOptions);
        }
    };
}

/**
 * Focus trap action for modal dialogs and dropdowns
 */
export function focusTrap(node, enabled = true) {
    let firstFocusable;
    let lastFocusable;

    function getFocusableElements() {
        const focusableSelector =
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        const focusableElements = node.querySelectorAll(focusableSelector);

        firstFocusable = focusableElements[0];
        lastFocusable = focusableElements[focusableElements.length - 1];
    }

    function handleKeydown(event) {
        if (!enabled || event.key !== 'Tab') return;

        // Update focusable elements in case DOM changed
        getFocusableElements();

        if (event.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstFocusable) {
                event.preventDefault();
                lastFocusable?.focus();
            }
        } else {
            // Tab
            if (document.activeElement === lastFocusable) {
                event.preventDefault();
                firstFocusable?.focus();
            }
        }
    }

    if (enabled) {
        getFocusableElements();
        node.addEventListener('keydown', handleKeydown);

        // Focus first element
        firstFocusable?.focus();
    }

    return {
        destroy() {
            node.removeEventListener('keydown', handleKeydown);
        },

        update(newEnabled) {
            enabled = newEnabled;
            if (enabled) {
                getFocusableElements();
                node.addEventListener('keydown', handleKeydown);
                firstFocusable?.focus();
            } else {
                node.removeEventListener('keydown', handleKeydown);
            }
        }
    };
}

/**
 * Escape key action
 */
export function escapeKey(node, callback) {
    function handleKeydown(event) {
        if (event.key === 'Escape' && !event.defaultPrevented) {
            callback(event);
        }
    }

    node.addEventListener('keydown', handleKeydown);

    return {
        destroy() {
            node.removeEventListener('keydown', handleKeydown);
        },

        update(newCallback) {
            callback = newCallback;
        }
    };
}

/**
 * Auto-resize textarea action
 */
export function autoResize(node, options = {}) {
    const { minHeight = 0, maxHeight = null } = options;

    function resize() {
        node.style.height = 'auto';
        const scrollHeight = node.scrollHeight;

        let newHeight = scrollHeight;
        if (minHeight && newHeight < minHeight) {
            newHeight = minHeight;
        }
        if (maxHeight && newHeight > maxHeight) {
            newHeight = maxHeight;
        }

        node.style.height = newHeight + 'px';
    }

    // Initial resize
    resize();

    // Listen for input events
    node.addEventListener('input', resize);

    // Listen for paste events (with delay to allow content to be pasted)
    function handlePaste() {
        setTimeout(resize, 0);
    }
    node.addEventListener('paste', handlePaste);

    return {
        destroy() {
            node.removeEventListener('input', resize);
            node.removeEventListener('paste', handlePaste);
        },

        update(newOptions) {
            Object.assign(options, newOptions);
            resize();
        }
    };
}

/**
 * Intersection observer action for lazy loading or scroll effects
 */
export function intersection(node, options = {}) {
    const {
        callback,
        once = false,
        threshold = 0,
        rootMargin = '0px',
        root = null
    } = options;

    if (!callback || typeof callback !== 'function') {
        console.warn('intersection action requires a callback function');
        return;
    }

    let observer;

    if (typeof IntersectionObserver !== 'undefined') {
        observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                callback(entry);

                if (once && entry.isIntersecting) {
                    observer.unobserve(node);
                }
            });
        }, {
            threshold,
            rootMargin,
            root
        });

        observer.observe(node);
    }

    return {
        destroy() {
            if (observer) {
                observer.unobserve(node);
                observer.disconnect();
            }
        }
    };
}

/**
 * Portal action to render content in a different part of the DOM
 */
export function portal(node, target = 'body') {
    let targetElement;

    if (typeof target === 'string') {
        targetElement = document.querySelector(target);
    } else if (target instanceof Element) {
        targetElement = target;
    }

    if (!targetElement) {
        console.warn('Portal target not found:', target);
        return;
    }

    // Move the node to the target
    targetElement.appendChild(node);

    return {
        destroy() {
            if (node.parentNode) {
                node.parentNode.removeChild(node);
            }
        },

        update(newTarget) {
            if (typeof newTarget === 'string') {
                targetElement = document.querySelector(newTarget);
            } else if (newTarget instanceof Element) {
                targetElement = newTarget;
            }

            if (targetElement && node.parentNode !== targetElement) {
                targetElement.appendChild(node);
            }
        }
    };
}

/**
 * Tooltip action for adding hover tooltips
 */
export function tooltip(node, options = {}) {
    const {
        content = '',
        position = 'top',
        delay = 500,
        offset = 8
    } = options;

    let tooltipElement;
    let showTimeout;
    let hideTimeout;

    function createTooltip() {
        tooltipElement = document.createElement('div');
        tooltipElement.className = `
      absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg
      pointer-events-none opacity-0 transition-opacity duration-200
    `;
        tooltipElement.textContent = content;
        document.body.appendChild(tooltipElement);
    }

    function positionTooltip() {
        if (!tooltipElement) return;

        const nodeRect = node.getBoundingClientRect();
        const tooltipRect = tooltipElement.getBoundingClientRect();

        let left = nodeRect.left + (nodeRect.width - tooltipRect.width) / 2;
        let top;

        switch (position) {
            case 'top':
                top = nodeRect.top - tooltipRect.height - offset;
                break;
            case 'bottom':
                top = nodeRect.bottom + offset;
                break;
            case 'left':
                left = nodeRect.left - tooltipRect.width - offset;
                top = nodeRect.top + (nodeRect.height - tooltipRect.height) / 2;
                break;
            case 'right':
                left = nodeRect.right + offset;
                top = nodeRect.top + (nodeRect.height - tooltipRect.height) / 2;
                break;
        }

        // Keep tooltip within viewport
        left = Math.max(8, Math.min(left, window.innerWidth - tooltipRect.width - 8));
        top = Math.max(8, Math.min(top, window.innerHeight - tooltipRect.height - 8));

        tooltipElement.style.left = left + 'px';
        tooltipElement.style.top = top + 'px';
    }

    function showTooltip() {
        clearTimeout(hideTimeout);
        showTimeout = setTimeout(() => {
            if (!tooltipElement) createTooltip();
            positionTooltip();
            tooltipElement.style.opacity = '1';
        }, delay);
    }

    function hideTooltip() {
        clearTimeout(showTimeout);
        if (tooltipElement) {
            tooltipElement.style.opacity = '0';
            hideTimeout = setTimeout(() => {
                if (tooltipElement) {
                    document.body.removeChild(tooltipElement);
                    tooltipElement = null;
                }
            }, 200);
        }
    }

    node.addEventListener('mouseenter', showTooltip);
    node.addEventListener('mouseleave', hideTooltip);
    node.addEventListener('focus', showTooltip);
    node.addEventListener('blur', hideTooltip);

    return {
        destroy() {
            clearTimeout(showTimeout);
            clearTimeout(hideTimeout);
            node.removeEventListener('mouseenter', showTooltip);
            node.removeEventListener('mouseleave', hideTooltip);
            node.removeEventListener('focus', showTooltip);
            node.removeEventListener('blur', hideTooltip);

            if (tooltipElement) {
                document.body.removeChild(tooltipElement);
            }
        },

        update(newOptions) {
            Object.assign(options, newOptions);
            if (tooltipElement) {
                tooltipElement.textContent = options.content || '';
            }
        }
    };
}