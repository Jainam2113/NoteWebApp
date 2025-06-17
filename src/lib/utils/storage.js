import { browser } from '$app/environment';

/**
 * Storage quota and persistence utilities
 */
export const storageQuota = {
    /**
     * Get storage quota information
     */
    async getQuotaInfo() {
        if (!browser || !navigator.storage || !navigator.storage.estimate) {
            return {
                quota: 0,
                usage: 0,
                available: 0,
                percentage: 0
            };
        }

        try {
            const estimate = await navigator.storage.estimate();
            const quota = estimate.quota || 0;
            const usage = estimate.usage || 0;
            const available = quota - usage;
            const percentage = quota > 0 ? (usage / quota) * 100 : 0;

            return {
                quota,
                usage,
                available,
                percentage,
                quotaFormatted: formatBytes(quota),
                usageFormatted: formatBytes(usage),
                availableFormatted: formatBytes(available)
            };
        } catch (error) {
            console.error('Failed to get storage quota:', error);
            return {
                quota: 0,
                usage: 0,
                available: 0,
                percentage: 0
            };
        }
    },

    /**
     * Check if storage is persistent
     */
    async isPersistent() {
        if (!browser || !navigator.storage || !navigator.storage.persisted) {
            return false;
        }

        try {
            return await navigator.storage.persisted();
        } catch (error) {
            console.error('Failed to check storage persistence:', error);
            return false;
        }
    },

    /**
     * Request persistent storage
     */
    async requestPersistentStorage() {
        if (!browser || !navigator.storage || !navigator.storage.persist) {
            return false;
        }

        try {
            return await navigator.storage.persist();
        } catch (error) {
            console.error('Failed to request persistent storage:', error);
            return false;
        }
    }
};

/**
 * Notes storage utilities
 */
export const notesStorage = {
    /**
     * Get storage usage statistics for the notes app
     */
    getUsageStats() {
        if (!browser) {
            return {
                used: 0,
                usedFormatted: '0 B',
                percentage: 0
            };
        }

        try {
            // Calculate localStorage usage
            let totalSize = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    totalSize += localStorage[key].length + key.length;
                }
            }

            // Convert to bytes (approximate)
            const usedBytes = totalSize * 2; // UTF-16 uses 2 bytes per character

            return {
                used: usedBytes,
                usedFormatted: formatBytes(usedBytes),
                percentage: this.calculateUsagePercentage(usedBytes)
            };
        } catch (error) {
            console.error('Failed to calculate storage usage:', error);
            return {
                used: 0,
                usedFormatted: '0 B',
                percentage: 0
            };
        }
    },

    /**
     * Calculate usage percentage (rough estimate)
     */
    calculateUsagePercentage(usedBytes) {
        // localStorage typical limit is around 5-10MB per origin
        const estimatedLimit = 10 * 1024 * 1024; // 10MB
        return Math.min((usedBytes / estimatedLimit) * 100, 100);
    },

    /**
     * Get notes data size
     */
    getNotesDataSize() {
        if (!browser) return 0;

        try {
            const notesData = localStorage.getItem('advanced-notes-app');
            if (!notesData) return 0;

            return notesData.length * 2; // UTF-16 bytes
        } catch (error) {
            console.error('Failed to get notes data size:', error);
            return 0;
        }
    },

    /**
     * Clean up storage (remove old or unused data)
     */
    cleanup() {
        if (!browser) return;

        try {
            // Remove any old keys that might exist
            const keysToRemove = [];
            for (let key in localStorage) {
                if (key.startsWith('notes-') || key.startsWith('old-notes')) {
                    keysToRemove.push(key);
                }
            }

            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
            });

            return keysToRemove.length;
        } catch (error) {
            console.error('Failed to cleanup storage:', error);
            return 0;
        }
    },

    /**
     * Check if storage is available and working
     */
    isAvailable() {
        if (!browser) return false;

        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            return false;
        }
    },

    /**
     * Get storage health information
     */
    getHealthInfo() {
        return {
            available: this.isAvailable(),
            usage: this.getUsageStats(),
            notesSize: formatBytes(this.getNotesDataSize())
        };
    }
};

/**
 * Format bytes into human readable format
 */
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Storage event listener utilities
 */
export const storageEvents = {
    /**
     * Listen for storage changes
     */
    onStorageChange(callback) {
        if (!browser) return () => {};

        function handleStorageChange(event) {
            if (event.key === 'advanced-notes-app') {
                callback(event);
            }
        }

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    },

    /**
     * Listen for storage quota changes
     */
    onQuotaExceeded(callback) {
        if (!browser) return () => {};

        function handleQuotaExceeded() {
            callback();
        }

        // Listen for quota exceeded errors
        window.addEventListener('error', (event) => {
            if (event.error && event.error.name === 'QuotaExceededError') {
                handleQuotaExceeded();
            }
        });

        return () => {
            // Cleanup would go here if needed
        };
    }
};

/**
 * Backup and restore utilities
 */
export const storageBackup = {
    /**
     * Create a backup of all notes data
     */
    createBackup() {
        if (!browser) return null;

        try {
            const data = {
                notes: localStorage.getItem('advanced-notes-app'),
                theme: localStorage.getItem('advanced-notes-theme'),
                editor: localStorage.getItem('advanced-notes-editor-prefs'),
                timestamp: Date.now(),
                version: '1.0.0'
            };

            return JSON.stringify(data, null, 2);
        } catch (error) {
            console.error('Failed to create backup:', error);
            return null;
        }
    },

    /**
     * Restore from backup
     */
    restoreBackup(backupData) {
        if (!browser) return false;

        try {
            const data = JSON.parse(backupData);

            if (data.notes) {
                localStorage.setItem('advanced-notes-app', data.notes);
            }
            if (data.theme) {
                localStorage.setItem('advanced-notes-theme', data.theme);
            }
            if (data.editor) {
                localStorage.setItem('advanced-notes-editor-prefs', data.editor);
            }

            return true;
        } catch (error) {
            console.error('Failed to restore backup:', error);
            return false;
        }
    }
};