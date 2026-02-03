export interface Example {
    title: string;
    sql: string;
}

export interface TableInfo {
    id: number;
    tableName: string;
    description: string;
    examples: Example[];
}

export const tableList: TableInfo[] = [
    {
        "id": 1,
        "tableName": "daily_user_events",
        "description": "사용자 행동 로그 테이블",
        "examples": [
            { "title": "기본 조회", "sql": "SELECT * FROM daily_user_events LIMIT 100;" },
            { "title": "DAU 계산", "sql": "SELECT event_date, COUNT(DISTINCT user_id) FROM daily_user_events GROUP BY 1;" },
            { "title": "이벤트별 통계", "sql": "SELECT event_name, COUNT(*) FROM daily_user_events WHERE event_date = '2024-01-01' GROUP BY 1;" }
        ]
    },
    {
        "id": 2,
        "tableName": "sales_transactions",
        "description": "매출 거래 데이터",
        "examples": [
            { "title": "월별 매출", "sql": "SELECT trunk(order_date, 'MM'), SUM(amount) FROM sales_transactions GROUP BY 1;" },
            { "title": "고객별 누적 구매", "sql": "SELECT user_id, SUM(amount) OVER(PARTITION BY user_id) FROM sales_transactions;" }
        ]
    }
];
