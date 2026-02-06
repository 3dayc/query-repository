import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';

const API_KEY = import.meta.env.VITE_POLYLLM_API_KEY;
const API_URL = 'https://api.ynext.cloud/services/polyLLM/chat/completions';

export interface ChatMessage {
    role: 'user' | 'model'; // Keep 'model' to match UI state, but map to 'assistant' for API
    text: string;
}

export const polyGlobalService = {
    async generateResponse(
        prompt: string,
        history: ChatMessage[] = []
    ): Promise<string> {
        if (!API_KEY) {
            console.error("PolyLLM API Key missing. Please set VITE_POLYLLM_API_KEY in .env.local");
            throw new Error("API Key configuration missing.");
        }

        // 1. Fetch Full Context (Same as before)
        const { tables } = useAppStore.getState();
        const { data: allQueries, error } = await supabase
            .from('queries')
            .select('*')
            .is('deleted_at', null);

        if (error) {
            console.error("Failed to fetch query context for AI:", error);
        }

        // 2. Build Schema Context
        let schemaContext = "Current Database Schema & Query Repository:\n\n";
        if (tables.length === 0) {
            schemaContext += "(No tables defined yet)\n";
        } else {
            tables.forEach(table => {
                schemaContext += `[Table: ${table.table_name}] (ID: ${table.id})\n`;
                if (table.description) schemaContext += `Description: ${table.description}\n`;

                const tableQueries = allQueries?.filter(q => q.table_id === table.id) || [];
                if (tableQueries.length > 0) {
                    schemaContext += "  Saved Queries:\n";
                    tableQueries.forEach(q => {
                        schemaContext += `  - "${q.title}":\n    ${q.sql_code.replace(/\n/g, ' ')}\n`;
                        if (q.related_link) schemaContext += `    (Link: ${q.related_link})\n`;
                    });
                }
                schemaContext += "\n";
            });
        }

        // 3. Construct Payload
        // 'reference' 테이블의 데이터를 명시적으로 추출하여 Context에 추가
        const refTable = tables.find(t => t.table_name.toLowerCase() === 'reference');
        let refContext = "";
        if (refTable && allQueries) {
            const refQueries = allQueries.filter(q => q.table_id === refTable.id);
            if (refQueries.length > 0) {
                refContext = "\n\n[PAST ERROR CASES & REFERENCE (MUST FOLLOW)]\n";
                refQueries.forEach(q => {
                    refContext += `- CASE: ${q.title}\n  SQL: ${q.sql_code.replace(/\n/g, ' ')}\n`;
                });
            }
        }

        const systemMessage = {
            role: "system",
            content: `너는 항공 데이터 전문 Databricks SQL 전문가야. 모든 쿼리는 반드시 Spark SQL 문법에 맞춰서 작성해야 해. 특히 날짜 함수나 윈도우 함수 사용 시 Databricks 특유의 규칙을 엄격히 준수해. 저장된 테이블 구조와 쿼리(주석 포함) 예시를 참고해서 최적의 SQL 조합을 제안해. 그리고 아래 첨부된 'PAST ERROR CASES & REFERENCE'를 반드시 참조해서 최적의 SQL 조합을 제안하고 동일한 실수를 반복하지 마. 또한, 모든 AS 뒤의 컬럼 별칭(Alias)은 반드시 백틱(\`)으로 감싸서 생성해. (예: AS \`basis_dt\`) 특히 한글이나 숫자가 포함된 별칭은 예외 없이 적용해. 단, 답변할 때 마크다운 문법은 절대 사용하지 말고 평문으로 작성해.\n\n${schemaContext}${refContext}`
        };

        const apiMessages = [
            systemMessage,
            ...history.map(msg => ({
                role: msg.role === 'model' ? 'assistant' : 'user',
                content: msg.text
            })),
            { role: "user", content: prompt }
        ];

        // 4. Call PolyLLM API
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o',
                    messages: apiMessages
                })
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error("Authentication Failed (401). Please check your VITE_POLYLLM_API_KEY.");
                }
                if (response.status === 404) {
                    throw new Error("API Endpoint Not Found (404). Please contact support.");
                }
                throw new Error(`PolyLLM API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            let reply = data.choices?.[0]?.message?.content;

            if (!reply) {
                throw new Error("Empty response from PolyLLM.");
            }

            // Remove markdown bold syntax if present
            reply = reply.replace(/\*\*/g, '');

            return reply;

        } catch (error: any) {
            console.error("PolyLLM Request Failed:", error);
            throw error;
        }
    }
};
