export interface DbFolder {
    id: string;
    name: string;
    order_index: number;
    created_at: string;
}

export interface DbTable {
    id: string;
    table_name: string;
    description: string | null;
    folder_id: string | null;
    order_index: number;
    created_at: string;
}

export interface DbQuery {
    id: string;
    table_id: string;
    title: string;
    sql_code: string;
    order_index: number;
    created_at: string;
}

// Joined type for UI convenience
export interface TableWithQueries extends DbTable {
    queries: DbQuery[];
}
