/**
 * Creates a debounced function that delays invoking the provided function
 * until after wait milliseconds have elapsed since the last time it was invoked.
 *
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @param {Object} options - Options object
 * @param {boolean} options.leading - Trigger on the leading edge
 * @param {boolean} options.trailing - Trigger on the trailing edge
 * @returns {Function} The debounced function
 */
export function debounce(func, wait, options = {}) {
    const { leading = false, trailing = true } = options;
    let timeoutId;
    let lastCallTime;
    let lastInvokeTime = 0;
    let lastArgs;
    let lastThis;
    let result;

    function invokeFunc(time) {
        const args = lastArgs;
        const thisArg = lastThis;

        lastArgs = lastThis = undefined;
        lastInvokeTime = time;
        result = func.apply(thisArg, args);
        return result;
    }

    function leadingEdge(time) {
        lastInvokeTime = time;
        timeoutId = setTimeout(timerExpired, wait);
        return leading ? invokeFunc(time) : result;
    }

    function remainingWait(time) {
        const timeSinceLastCall = time - lastCallTime;
        const timeSinceLastInvoke = time - lastInvokeTime;
        const timeWaiting = wait - timeSinceLastCall;
        return timeWaiting;
    }

    function shouldInvoke(time) {
        const timeSinceLastCall = time - lastCallTime;
        const timeSinceLastInvoke = time - lastInvokeTime;

        return (
            lastCallTime === undefined ||
            timeSinceLastCall >= wait ||
            timeSinceLastCall < 0 ||
            timeSinceLastInvoke >= wait
        );
    }

    function timerExpired() {
        const time = Date.now();
        if (shouldInvoke(time)) {
            return trailingEdge(time);
        }
        timeoutId = setTimeout(timerExpired, remainingWait(time));
    }

    function trailingEdge(time) {
        timeoutId = undefined;

        if (trailing && lastArgs) {
            return invokeFunc(time);
        }
        lastArgs = lastThis = undefined;
        return result;
    }

    function cancel() {
        if (timeoutId !== undefined) {
            clearTimeout(timeoutId);
        }
        lastInvokeTime = 0;
        lastArgs = lastCallTime = lastThis = timeoutId = undefined;
    }

    function flush() {
        return timeoutId === undefined ? result : trailingEdge(Date.now());
    }

    function pending() {
        return timeoutId !== undefined;
    }

    function debounced(...args) {
        const time = Date.now();
        const isInvoking = shouldInvoke(time);

        lastArgs = args;
        lastThis = this;
        lastCallTime = time;

        if (isInvoking) {
            if (timeoutId === undefined) {
                return leadingEdge(lastCallTime);
            }
            timeoutId = setTimeout(timerExpired, wait);
            return invokeFunc(lastCallTime);
        }
        if (timeoutId === undefined) {
            timeoutId = setTimeout(timerExpired, wait);
        }
        return result;
    }

    debounced.cancel = cancel;
    debounced.flush = flush;
    debounced.pending = pending;

    return debounced;
}

/**
 * Creates a throttled function that only invokes the provided function at most
 * once per every wait milliseconds.
 *
 * @param {Function} func - The function to throttle
 * @param {number} wait - The number of milliseconds to throttle invocations to
 * @param {Object} options - Options object
 * @param {boolean} options.leading - Trigger on the leading edge
 * @param {boolean} options.trailing - Trigger on the trailing edge
 * @returns {Function} The throttled function
 */
export function throttle(func, wait, options = {}) {
    return debounce(func, wait, {
        leading: true,
        trailing: true,
        ...options
    });
}

/**
 * Creates a debounced function specifically for search operations
 * with sensible defaults for search UX.
 *
 * @param {Function} searchFunc - The search function to debounce
 * @param {number} delay - Delay in milliseconds (default: 300)
 * @returns {Function} The debounced search function
 */
export function debounceSearch(searchFunc, delay = 300) {
    return debounce(searchFunc, delay, {
        leading: false,
        trailing: true
    });
}

/**
 * Creates a debounced function for auto-save operations
 * with appropriate settings for save UX.
 *
 * @param {Function} saveFunc - The save function to debounce
 * @param {number} delay - Delay in milliseconds (default: 500)
 * @returns {Function} The debounced save function
 */
export function debounceAutoSave(saveFunc, delay = 500) {
    return debounce(saveFunc, delay, {
        leading: false,
        trailing: true
    });
}

/**
 * Creates a throttled function for scroll event handling
 * with appropriate settings for smooth scrolling.
 *
 * @param {Function} scrollFunc - The scroll function to throttle
 * @param {number} delay - Delay in milliseconds (default: 16 for 60fps)
 * @returns {Function} The throttled scroll function
 */
export function throttleScroll(scrollFunc, delay = 16) {
    return throttle(scrollFunc, delay, {
        leading: true,
        trailing: false
    });
}

/**
 * Creates a throttled function for resize event handling
 * with appropriate settings for responsive behavior.
 *
 * @param {Function} resizeFunc - The resize function to throttle
 * @param {number} delay - Delay in milliseconds (default: 100)
 * @returns {Function} The throttled resize function
 */
export function throttleResize(resizeFunc, delay = 100) {
    return throttle(resizeFunc, delay, {
        leading: false,
        trailing: true
    });
}

/**
 * Creates a debounced function for input validation
 * with settings optimized for form validation UX.
 *
 * @param {Function} validateFunc - The validation function to debounce
 * @param {number} delay - Delay in milliseconds (default: 250)
 * @returns {Function} The debounced validation function
 */
export function debounceValidation(validateFunc, delay = 250) {
    return debounce(validateFunc, delay, {
        leading: false,
        trailing: true
    });
}

/**
 * Utility to create a cancelable promise with debouncing
 * Useful for async operations that might be superseded by newer requests
 *
 * @param {Function} asyncFunc - The async function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Function that returns a cancelable promise
 */
export function debounceAsync(asyncFunc, delay = 300) {
    let timeoutId;
    let cancelPrevious;

    return function debounced(...args) {
        return new Promise((resolve, reject) => {
            // Cancel previous promise if it exists
            if (cancelPrevious) {
                cancelPrevious();
            }

            // Clear existing timeout
            clearTimeout(timeoutId);

            // Set up cancellation for this promise
            let isCanceled = false;
            cancelPrevious = () => {
                isCanceled = true;
                reject(new Error('Operation canceled by newer request'));
            };

            // Set up debounced execution
            timeoutId = setTimeout(async () => {
                if (isCanceled) return;

                try {
                    const result = await asyncFunc.apply(this, args);
                    if (!isCanceled) {
                        resolve(result);
                    }
                } catch (error) {
                    if (!isCanceled) {
                        reject(error);
                    }
                }
            }, delay);
        });
    };
}

/**
 * Creates a rate-limited function that ensures a minimum delay between calls
 * Useful for API calls or expensive operations
 *
 * @param {Function} func - The function to rate limit
 * @param {number} minDelay - Minimum delay between calls in milliseconds
 * @returns {Function} The rate-limited function
 */
export function rateLimit(func, minDelay = 1000) {
    let lastCallTime = 0;
    let timeoutId;

    return function rateLimited(...args) {
        const now = Date.now();
        const timeSinceLastCall = now - lastCallTime;

        if (timeSinceLastCall >= minDelay) {
            lastCallTime = now;
            return func.apply(this, args);
        } else {
            clearTimeout(timeoutId);
            return new Promise((resolve) => {
                timeoutId = setTimeout(() => {
                    lastCallTime = Date.now();
                    resolve(func.apply(this, args));
                }, minDelay - timeSinceLastCall);
            });
        }
    };
}

/**
 * Batches multiple calls into a single execution
 * Useful for operations that can process multiple items at once
 *
 * @param {Function} batchFunc - Function that processes an array of items
 * @param {number} delay - Delay to wait for more items (default: 50ms)
 * @param {number} maxBatchSize - Maximum number of items per batch (default: 10)
 * @returns {Function} Function that adds items to the batch
 */
export function batchCalls(batchFunc, delay = 50, maxBatchSize = 10) {
    let batch = [];
    let timeoutId;

    function processBatch() {
        if (batch.length === 0) return;

        const itemsToProcess = batch.splice(0, maxBatchSize);
        batchFunc(itemsToProcess);

        // Schedule next batch if there are remaining items
        if (batch.length > 0) {
            timeoutId = setTimeout(processBatch, 0);
        }
    }

    return function addToBatch(item) {
        batch.push(item);

        // Process immediately if batch is full
        if (batch.length >= maxBatchSize) {
            clearTimeout(timeoutId);
            processBatch();
        } else {
            // Otherwise, schedule batched processing
            clearTimeout(timeoutId);
            timeoutId = setTimeout(processBatch, delay);
        }
    };
}

/**
 * Creates a function that ensures only one instance can run at a time
 * Subsequent calls while the function is running will be ignored
 *
 * @param {Function} func - The function to make exclusive
 * @returns {Function} The exclusive function
 */
export function makeExclusive(func) {
    let isRunning = false;

    return async function exclusive(...args) {
        if (isRunning) {
            return;
        }

        isRunning = true;
        try {
            return await func.apply(this, args);
        } finally {
            isRunning = false;
        }
    };
}