import { create } from 'zustand';
import { api } from '../services/api';
import type { DbFolder, DbTable } from '../types/db';

interface AppState {
    folders: DbFolder[];
    tables: DbTable[];
    selectedTableId: string | null;
    isLoading: boolean;
    isReady: boolean;
    expandedFolderIds: string[];
    targetQueryId: string | null; // For smart navigation
    targetSessionId: string | null;

    // Actions
    fetchData: () => Promise<void>;
    setSelectedTableId: (id: string | null) => void;
    toggleFolder: (folderId: string) => void;
    openFolder: (folderId: string) => void;
    collapseAllFolders: () => void;
    setTargetQueryId: (id: string | null) => void;
    setTargetSessionId: (id: string | null) => void;

    // Mobile Menu
    isMobileMenuOpen: boolean;
    toggleMobileMenu: () => void;
    setMobileMenuOpen: (isOpen: boolean) => void;

    // AI Panel
    isAIPanelOpen: boolean;
    toggleAIPanel: () => void;
    setAIPanelOpen: (isOpen: boolean) => void;

    // Optimistic updates (UI only, API calls should be handled by caller or thunk-like pattern)
    setFolders: (folders: DbFolder[]) => void;
    setTables: (tables: DbTable[]) => void;
    addFolder: (folder: DbFolder) => void;
    addTable: (table: DbTable) => void;
    updateTable: (table: DbTable) => void;
    removeTable: (id: string) => void;
    removeFolder: (id: string) => void;

    // Modal State
    modal: {
        isOpen: boolean;
        type: 'alert' | 'confirm';
        title: string;
        message: string;
        onConfirm?: () => void;
    };
    openConfirm: (title: string, message: string, onConfirm: () => void) => void;
    openAlert: (title: string, message: string) => void;
    closeModal: () => void;

    // Queries (optional refactor, passing down setQueries is common but store is better)
    // For now, let's keep queries in local state of MainContent?
    // Requirement says "optimistic UI". MainContent has local state "queries".
    // DnD should be handled in MainContent or moved to store.
    // Moving to store is cleaner for global persistence context, but might be big refactor.
    // Let's implement optimistic update helper or move queries to store?
    // User request: "Optimistic UI".
    // I will stick to MainContent state for queries to avoid massive refactor, but using API directly.
    // Wait, requirement 5 says "Use React State to partially update UI".
    // I can just pass Reorder function to ExampleList.
    // View Mode
    viewMode: 'main' | 'trash';
    setViewMode: (mode: 'main' | 'trash') => void;

    // Edit Modal State
    editingTable: DbTable | null;
    setEditingTable: (table: DbTable | null) => void;
    editingFolder: DbFolder | null;
    setEditingFolder: (folder: DbFolder | null) => void;

    // Toast State
    toast: {
        message: string | null;
        isVisible: boolean;
        type: 'success' | 'error' | 'info';
    };
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    hideToast: () => void;

    // Unsaved Changes State
    hasUnsavedChanges: boolean;
    setHasUnsavedChanges: (has: boolean) => void;
    checkUnsavedChanges: (action: () => void) => void;
    // Auth State
    user: any | null; // Supabase User
    setUser: (user: any | null) => void;
    signOut: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
    folders: [],
    tables: [],
    selectedTableId: null,
    isLoading: false,
    isReady: false,
    expandedFolderIds: [],
    targetQueryId: null,
    targetSessionId: null,

    // Auth Init
    user: null,
    setUser: (user) => set({ user }),
    signOut: async () => {
        const { supabase } = await import('../lib/supabase');
        await supabase.auth.signOut();
        set({ user: null, isReady: false }); // Reset ready state to force re-check? Or just user null.
        // Also clear data if needed for security
        set({ folders: [], tables: [], selectedTableId: null });
    },

    fetchData: async () => {
        set({ isLoading: true });
        try {
            const [folders, tables] = await Promise.all([
                api.getFolders(),
                api.getTables(),
            ]);
            set({ folders, tables });
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            set({ isLoading: false, isReady: true });
        }
    },

    // ... rest of store ...

    setSelectedTableId: (id) => set({ selectedTableId: id, targetQueryId: null }),

    toggleFolder: (folderId) => set((state) => {
        const isExpanded = state.expandedFolderIds.includes(folderId);
        return {
            expandedFolderIds: isExpanded
                ? state.expandedFolderIds.filter((id) => id !== folderId)
                : [...state.expandedFolderIds, folderId],
        };
    }),

    openFolder: (folderId) => set((state) => {
        if (state.expandedFolderIds.includes(folderId)) return {};
        return { expandedFolderIds: [...state.expandedFolderIds, folderId] };
    }),

    collapseAllFolders: () => set({ expandedFolderIds: [] }),

    setTargetQueryId: (id) => set({ targetQueryId: id }),
    setTargetSessionId: (id) => set({ targetSessionId: id }),

    viewMode: 'main',
    setViewMode: (mode) => set({ viewMode: mode }),

    editingTable: null,
    setEditingTable: (table) => set({ editingTable: table }),
    editingFolder: null,
    setEditingFolder: (folder) => set({ editingFolder: folder }),

    isMobileMenuOpen: false,
    toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
    setMobileMenuOpen: (isOpen) => set({ isMobileMenuOpen: isOpen }),

    isAIPanelOpen: false,
    toggleAIPanel: () => set((state) => ({ isAIPanelOpen: !state.isAIPanelOpen })),
    setAIPanelOpen: (isOpen) => set({ isAIPanelOpen: isOpen }),

    setFolders: (folders) => set({ folders }),
    setTables: (tables) => set({ tables }),
    addFolder: (folder) => set((state) => ({ folders: [...state.folders, folder] })),
    addTable: (table) => set((state) => ({ tables: [...state.tables, table] })),
    updateTable: (table) => set((state) => ({
        tables: state.tables.map((t) => (t.id === table.id ? table : t)),
    })),
    removeTable: (id) => set((state) => ({
        tables: state.tables.filter((t) => t.id !== id),
    })),
    removeFolder: (id) => set((state) => ({
        folders: state.folders.filter((f) => f.id !== id),
        // Also move tables in this folder back to root (or delete them? Standard is move to root or delete cascading. 
        // For safety, let's keep tables but move them to root (null).
        tables: state.tables.map(t => t.folder_id === id ? { ...t, folder_id: null } : t)
    })),

    modal: {
        isOpen: false,
        type: 'alert',
        title: '',
        message: '',
    },
    openConfirm: (title, message, onConfirm) => set({
        modal: { isOpen: true, type: 'confirm', title, message, onConfirm }
    }),
    openAlert: (title, message) => set({
        modal: { isOpen: true, type: 'alert', title, message }
    }),
    closeModal: () => set((state) => ({
        modal: { ...state.modal, isOpen: false }
    })),

    // Toast Actions
    toast: {
        message: null,
        isVisible: false,
        type: 'info',
    },
    showToast: (message, type = 'info') => {
        set({ toast: { message, isVisible: true, type } });
        setTimeout(() => {
            set((state) => ({ toast: { ...state.toast, isVisible: false } }));
        }, 3000);
    },
    hideToast: () => set((state) => ({ toast: { ...state.toast, isVisible: false } })),

    // Unsaved Changes State
    hasUnsavedChanges: false,
    setHasUnsavedChanges: (has: boolean) => set({ hasUnsavedChanges: has }),
    checkUnsavedChanges: (action: () => void) => {
        const state = get();
        if (state.hasUnsavedChanges) {
            state.openConfirm(
                'Unsaved Changes',
                'You have unsaved changes. Do you want to discard them and continue?',
                () => {
                    set({ hasUnsavedChanges: false });
                    action();
                }
            );
        } else {
            action();
        }
    },
}));
