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
        // 3. Construct Payload
        // 'rule' 테이블 -> 'prompt' 쿼리 추출
        let ruleContext = "";
        const ruleTable = tables.find(t => t.table_name.toLowerCase() === 'rule');
        if (ruleTable && allQueries) {
            const promptQuery = allQueries.find(q => q.table_id === ruleTable.id && q.title.toLowerCase() === 'prompt');
            if (promptQuery) {
                // Rule context is appended to User Message
                ruleContext = `\n\n[USER DEFINED INSTRUCTIONS]\n${promptQuery.sql_code}\n`;
            }
        }

        const apiMessages = [
            ...history.map(msg => ({
                role: msg.role === 'model' ? 'assistant' : 'user',
                content: msg.text
            })),
            { role: "user", content: `${prompt}${ruleContext || ""}\n\n[DATABASE SCHEMA]\n${schemaContext}` }
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

            return reply;

        } catch (error: any) {
            console.error("PolyLLM Request Failed:", error);
            throw error;
        }
    }
};
