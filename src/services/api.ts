import { supabase } from '../lib/supabase';
import type { DbTable, DbQuery, DbFolder } from '../types/db';

// Tables CRUD
export const api = {
    // Fetch all folders (Active only)
    getFolders: async (): Promise<DbFolder[]> => {
        const { data, error } = await supabase
            .from('folders')
            .select('*')
            .is('deleted_at', null)
            .order('order_index', { ascending: true })
            .order('name', { ascending: true });

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

    // Update folder name
    updateFolder: async (id: string, name: string): Promise<DbFolder> => {
        const { data, error } = await supabase
            .from('folders')
            .update({ name })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Soft Delete Folder
    softDeleteFolder: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('folders')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);
        if (error) throw error;
    },

    // Restore Folder
    restoreFolder: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('folders')
            .update({ deleted_at: null })
            .eq('id', id);
        if (error) throw error;
    },

    // Hard Delete Folder
    hardDeleteFolder: async (id: string): Promise<void> => {
        // 1. Unlink tables (Optional: depends on if we want to delete them or move to root. Moving to root is safer)
        await supabase.from('tables').update({ folder_id: null }).eq('folder_id', id);

        const { error } = await supabase.from('folders').delete().eq('id', id);
        if (error) throw error;
    },

    // Fetch all tables (Active only)
    getTables: async (): Promise<DbTable[]> => {
        const { data, error } = await supabase
            .from('tables')
            .select('*')
            .is('deleted_at', null)
            .order('order_index', { ascending: true })
            .order('table_name', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    // Create a new table
    createTable: async (tableName: string, description: string, folderId: string | null, orderIndex: number = 0, schemaName: string = 'public'): Promise<DbTable> => {
        const { data, error } = await supabase
            .from('tables')
            .insert([{
                table_name: tableName,
                description,
                folder_id: folderId,
                order_index: orderIndex,
                schema_name: schemaName
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Update a table
    updateTable: async (id: string, name: string, description: string, schemaName?: string): Promise<DbTable> => {
        const updates: any = { table_name: name, description };
        if (schemaName !== undefined) updates.schema_name = schemaName;

        const { data, error } = await supabase
            .from('tables')
            .update(updates)
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

    // Soft Delete Table
    softDeleteTable: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('tables')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);
        if (error) throw error;
    },

    // Restore Table
    restoreTable: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('tables')
            .update({ deleted_at: null })
            .eq('id', id);
        if (error) throw error;
    },

    // Hard Delete Table
    hardDeleteTable: async (id: string): Promise<void> => {
        const { error } = await supabase.from('tables').delete().eq('id', id);
        if (error) throw error;
    },

    // Fetch queries for a specific table (Active only)
    getQueries: async (tableId: string): Promise<DbQuery[]> => {
        const { data, error } = await supabase
            .from('queries')
            .select('*')
            .eq('table_id', tableId)
            .is('deleted_at', null)
            .order('order_index', { ascending: true })
            .order('created_at', { ascending: true });

        if (!error) return data || [];

        // Fallback
        const { data: fallbackData, error: fallbackError } = await supabase
            .from('queries')
            .select('*')
            .eq('table_id', tableId)
            .is('deleted_at', null)
            .order('created_at', { ascending: true });

        if (fallbackError) throw fallbackError;
        return fallbackData || [];
    },

    // Create a new query
    // Create a new query
    createQuery: async (tableId: string, title: string, sqlCode: string, orderIndex: number = 0, relatedLink?: string, userEmail?: string): Promise<DbQuery> => {
        const payload = {
            table_id: tableId,
            title,
            sql_code: sqlCode,
            order_index: orderIndex,
            related_link: relatedLink,
            created_by: userEmail,
            last_updated_by: userEmail,
            last_updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('queries')
            .insert([payload])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Update a query
    // Update a query
    updateQuery: async (id: string, title: string, sqlCode: string, relatedLink?: string, userEmail?: string): Promise<DbQuery> => {
        const { data, error } = await supabase
            .from('queries')
            .update({
                title,
                sql_code: sqlCode,
                related_link: relatedLink,
                last_updated_by: userEmail,
                last_updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Soft Delete Query
    softDeleteQuery: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('queries')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);
        if (error) throw error;
    },

    // Restore Query
    restoreQuery: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('queries')
            .update({ deleted_at: null })
            .eq('id', id);
        if (error) throw error;
    },

    // Hard Delete Query
    hardDeleteQuery: async (id: string): Promise<void> => {
        const { error } = await supabase.from('queries').delete().eq('id', id);
        if (error) throw error;
    },

    // Update query order
    updateQueryOrder: async (id: string, newIndex: number): Promise<void> => {
        const { error } = await supabase
            .from('queries')
            .update({ order_index: newIndex })
            .eq('id', id);
        if (error) console.warn('Failed to update query order:', error.message);
    },

    // Search Queries
    searchQueries: async (query: string): Promise<any[]> => {
        if (!query.trim()) return [];
        const { data: matchingTables } = await supabase
            .from('tables')
            .select('id')
            .is('deleted_at', null)
            .or(`description.ilike.%${query}%,table_name.ilike.%${query}%`);

        const tableIds = matchingTables?.map(t => t.id) || [];
        const tableIdFilter = tableIds.length > 0 ? `,table_id.in.(${tableIds.join(',')})` : '';

        const { data, error } = await supabase
            .from('queries')
            .select(`*, tables (table_name, description, folder_id)`)
            .is('deleted_at', null)
            .or(`title.ilike.%${query}%,sql_code.ilike.%${query}%${tableIdFilter}`)
            .limit(20);

        if (error) throw error;
        return data || [];
    },

    // Get Trash Items
    getTrashItems: async () => {
        const [folders, tables, queries] = await Promise.all([
            supabase.from('folders').select('*').not('deleted_at', 'is', null).order('deleted_at', { ascending: false }),
            supabase.from('tables').select('*').not('deleted_at', 'is', null).order('deleted_at', { ascending: false }),
            supabase.from('queries').select(`*, tables (table_name)`).not('deleted_at', 'is', null).order('deleted_at', { ascending: false })
        ]);

        return {
            folders: folders.data || [],
            tables: tables.data || [],
            queries: queries.data || []
        };
    },

    // Empty Trash
    emptyTrash: async (): Promise<void> => {
        // 1. Delete Queries
        const { error: errorQ } = await supabase.from('queries').delete().not('deleted_at', 'is', null);
        if (errorQ) throw errorQ;

        // 2. Delete Tables
        const { error: errorT } = await supabase.from('tables').delete().not('deleted_at', 'is', null);
        if (errorT) throw errorT;

        // 3. Delete Folders (Foreign keys set to SET NULL automatically unlinks active tables)
        const { error: errorF } = await supabase.from('folders').delete().not('deleted_at', 'is', null);
        if (errorF) throw errorF;
    },

    // --- Chat History ---
    getChatHistory: async (email: string) => {
        const { data, error } = await supabase
            .from('user_chat_history')
            .select('messages')
            .eq('user_email', email)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is 'not found'
            console.error('Error fetching chat history:', error);
        }
        return data?.messages || [];
    },

    saveChatHistory: async (email: string, messages: any[]) => {
        const { error } = await supabase
            .from('user_chat_history')
            .upsert({
                user_email: email,
                messages: messages,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_email' });

        if (error) console.error('Error saving chat history:', error);
    },

    // --- Chat Sessions & Messages (New) ---
    createSession: async (email: string, title?: string) => {
        const { data, error } = await supabase
            .from('chat_sessions')
            .insert({ user_email: email, title: title || 'New Chat' })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    getSessions: async (email: string) => {
        const { data, error } = await supabase
            .from('chat_sessions')
            .select('*')
            .eq('user_email', email)
            .order('updated_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    deleteSession: async (sessionId: string) => {
        const { error } = await supabase
            .from('chat_sessions')
            .delete()
            .eq('id', sessionId);
        if (error) throw error;
    },

    getChatMessages: async (sessionId: string) => {
        const { data, error } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    addChatMessage: async (sessionId: string, role: string, content: string) => {
        // Map 'model' to 'assistant' for DB consistency
        const dbRole = role === 'model' ? 'assistant' : role;

        const { data, error } = await supabase
            .from('chat_messages')
            .insert({ session_id: sessionId, role: dbRole, content })
            .select()
            .single();

        if (error) throw error;

        // Update session timestamp
        await supabase
            .from('chat_sessions')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', sessionId);

        return data;
    },

    updateSessionTitle: async (sessionId: string, title: string) => {
        const { error } = await supabase
            .from('chat_sessions')
            .update({ title })
            .eq('id', sessionId);
        if (error) throw error;
    }
};


