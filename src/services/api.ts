import { supabase } from '../lib/supabase';
import type { DbTable, DbQuery } from '../types/db';

// Tables CRUD
export const api = {
    // Fetch all tables
    getTables: async (): Promise<DbTable[]> => {
        const { data, error } = await supabase
            .from('tables')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    // Create a new table
    createTable: async (tableName: string, description: string): Promise<DbTable> => {
        const { data, error } = await supabase
            .from('tables')
            .insert([{ table_name: tableName, description }])
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
    }
};
