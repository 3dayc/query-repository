import { supabase } from '../lib/supabase';
import type { DbTable, DbQuery, DbFolder } from '../types/db';

// Tables CRUD
export const api = {
    // Fetch all folders
    getFolders: async (): Promise<DbFolder[]> => {
        const { data, error } = await supabase
            .from('folders')
            .select('*')
            .order('order_index', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    // Create a new folder
    createFolder: async (name: string, orderIndex: number): Promise<DbFolder> => {
        const { data, error } = await supabase
            .from('folders')
            .insert([{ name, order_index: orderIndex }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Update folder order
    updateFolderOrder: async (id: string, newIndex: number): Promise<void> => {
        const { error } = await supabase
            .from('folders')
            .update({ order_index: newIndex })
            .eq('id', id);

        if (error) throw error;
    },

    // Delete a folder (Safe Delete: Move tables to root first)
    deleteFolder: async (id: string): Promise<void> => {
        // 1. Unlink tables
        const { error: updateError } = await supabase
            .from('tables')
            .update({ folder_id: null })
            .eq('folder_id', id);

        if (updateError) throw updateError;

        // 2. Delete folder
        const { error } = await supabase
            .from('folders')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Fetch all tables
    getTables: async (): Promise<DbTable[]> => {
        const { data, error } = await supabase
            .from('tables')
            .select('*')
            .order('order_index', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    // Create a new table
    createTable: async (tableName: string, description: string, folderId: string | null, orderIndex: number = 0): Promise<DbTable> => {
        const { data, error } = await supabase
            .from('tables')
            .insert([{
                table_name: tableName,
                description,
                folder_id: folderId,
                order_index: orderIndex
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Update a table
    updateTable: async (id: string, name: string, description: string): Promise<DbTable> => {
        const { data, error } = await supabase
            .from('tables')
            .update({ table_name: name, description })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Update table location/order
    updateTableLocation: async (id: string, folderId: string | null, newIndex: number): Promise<void> => {
        const { error } = await supabase
            .from('tables')
            .update({ folder_id: folderId, order_index: newIndex })
            .eq('id', id);

        if (error) throw error;
    },

    // Delete a table
    deleteTable: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('tables')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Queries CRUD

    // Fetch queries for a specific table
    getQueries: async (tableId: string): Promise<DbQuery[]> => {
        const { data, error } = await supabase
            .from('queries')
            .select('*')
            .eq('table_id', tableId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    // Create a new query
    createQuery: async (tableId: string, title: string, sqlCode: string): Promise<DbQuery> => {
        const { data, error } = await supabase
            .from('queries')
            .insert([{ table_id: tableId, title, sql_code: sqlCode }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Update a query
    updateQuery: async (id: string, title: string, sqlCode: string): Promise<DbQuery> => {
        const { data, error } = await supabase
            .from('queries')
            .update({ title, sql_code: sqlCode })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Delete a query
    deleteQuery: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('queries')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Update query order
    updateQueryOrder: async (id: string, newIndex: number): Promise<void> => {
        const { error } = await supabase
            .from('queries')
            .update({ order_index: newIndex })
            .eq('id', id);

        if (error) throw error;
    }
};


