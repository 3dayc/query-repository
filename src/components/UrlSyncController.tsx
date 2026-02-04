import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';

export function UrlSyncController() {
    const [searchParams, setSearchParams] = useSearchParams();
    const {
        tables, folders, isLoading, isReady,
        selectedTableId, targetQueryId,
        setSelectedTableId, setTargetQueryId, openFolder
    } = useAppStore();

    const [isSynced, setIsSynced] = useState(false);
    const ignoreNextParamsRef = useRef<string | null>(null);
    const prevParamsRef = useRef(searchParams.toString());

    // 1. Sync URL -> Store
    useEffect(() => {
        if (isLoading || !isReady) return;

        const currentParamsStr = searchParams.toString();

        // Only run if URL actually changed (prevent reverting Store updates)
        // Exception: Initial sync must run
        if (isSynced && currentParamsStr === prevParamsRef.current) {
            return;
        }
        prevParamsRef.current = currentParamsStr;

        if (ignoreNextParamsRef.current === currentParamsStr) {
            return;
        }

        const urlFolderId = searchParams.get('folderId');
        const urlTableId = searchParams.get('tableId');
        const urlQueryId = searchParams.get('queryId');

        // Initial Load Logic
        if (!isSynced) {
            // Sync Table
            if (urlTableId) {
                const table = tables.find(t => t.id === urlTableId);
                if (table) {
                    setSelectedTableId(urlTableId);
                    if (table.folder_id) openFolder(table.folder_id);
                } else {
                    // Invalid ID: Clear URL
                    setSearchParams({}, { replace: true });
                    return;
                }
            } else {
                // Ensure store clean
                if (selectedTableId) setSelectedTableId(null);
            }

            // Sync Query
            if (urlQueryId) {
                setTargetQueryId(urlQueryId);
            }

            // Sync Folder
            if (urlFolderId) {
                openFolder(urlFolderId);
            }

            setIsSynced(true);
            // Don't track initial URL as "ignored" because we want to react to Back button later
            // But if we just set Store, Store->URL will run? 
            // Effect 2 will see params match Store. No "changed". No push.
            return;
        }

        // Subsequent Navigation (Back/Forward) logic
        // We only update Store if URL mismatches Store (and assuming URL is the source of truth here)
        // However, Store -> URL sync also triggers this.
        // If Store changed (user interaction), URL is updated. params change. matches Store. No-op.
        // If URL changed (Back button), does not match Store. Update Store.

        // Table
        if (urlTableId && urlTableId !== selectedTableId) {
            const t = tables.find(t => t.id === urlTableId);
            if (t) setSelectedTableId(urlTableId);
        } else if (!urlTableId && selectedTableId) {
            setSelectedTableId(null);
        }

        // Query
        if (urlQueryId && urlQueryId !== targetQueryId) {
            setTargetQueryId(urlQueryId);
        } else if (!urlQueryId && targetQueryId) {
            setTargetQueryId(null);
        }

    }, [searchParams, isLoading, isReady, isSynced, tables, folders, selectedTableId, targetQueryId, setSelectedTableId, setTargetQueryId, openFolder, setSearchParams]);

    // 2. Sync Store -> URL
    useEffect(() => {
        if (isLoading || !isReady || !isSynced) return;

        const currentParams = new URLSearchParams(searchParams);
        let changed = false;

        // Sync Table & Folder
        if (selectedTableId) {
            if (currentParams.get('tableId') !== selectedTableId) {
                currentParams.set('tableId', selectedTableId);
                changed = true;

                // Auto-set Folder from Table in URL
                const table = tables.find(t => t.id === selectedTableId);
                if (table?.folder_id) {
                    currentParams.set('folderId', table.folder_id);
                }
            }
        } else {
            if (currentParams.has('tableId')) {
                currentParams.delete('tableId');
                currentParams.delete('folderId');
                changed = true;
            }
        }

        // Sync Query
        if (targetQueryId) {
            if (currentParams.get('queryId') !== targetQueryId) {
                currentParams.set('queryId', targetQueryId);
                changed = true;
            }
        } else {
            if (currentParams.has('queryId')) {
                currentParams.delete('queryId');
                changed = true;
            }
        }

        if (changed) {
            const nextStr = currentParams.toString();
            ignoreNextParamsRef.current = nextStr; // Ignore the update we are about to trigger
            setSearchParams(currentParams);
        }

    }, [selectedTableId, targetQueryId, isLoading, isSynced, tables, searchParams, setSearchParams]);

    return null;
}
