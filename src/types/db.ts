export interface DbFolder {
    id: string;
    name: string;
    order_index: number;
    created_at: string;
    deleted_at?: string | null;
}

export interface DbTable {
    id: string;
    table_name: string;
    schema_name?: string | null;
    description: string | null;
    folder_id: string | null;
    order_index: number;
    created_at: string;
    deleted_at?: string | null;
}

export interface DbQuery {
    id: string;
    table_id: string;
    title: string;
    sql_code: string;
    order_index: number;
    created_at: string;
    deleted_at?: string | null;
}

// Joined type for UI convenience
export interface TableWithQueries extends DbTable {
    queries: DbQuery[];
}

export interface SearchResult extends DbQuery {
    tables: {
        table_name: string;
        description?: string | null;
        folder_id: string | null;
    } | null; // Supabase returns object for single relation or array for multiple? Usually object if 1:1 or N:1
}
