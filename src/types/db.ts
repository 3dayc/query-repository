export interface DbTable {
    id: string;
    table_name: string;
    description: string | null;
    created_at: string;
}

export interface DbQuery {
    id: string;
    table_id: string;
    title: string;
    sql_code: string;
    created_at: string;
}

// Joined type for UI convenience
export interface TableWithQueries extends DbTable {
    queries: DbQuery[];
}
