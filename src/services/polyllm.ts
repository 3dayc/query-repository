import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';

const API_KEY = import.meta.env.VITE_POLYLLM_API_KEY;
const BASE_URL = 'https://api.ynext.cloud/services/polyLLM';
const CHAT_URL = `${BASE_URL}/chat/completions`;
const MODELS_URL = `${BASE_URL}/models`;

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

export interface AIModel {
    id: string;
    object?: string;
    created?: number;
    owned_by?: string;
}

export const polyGlobalService = {
    async getModels(): Promise<AIModel[]> {
        if (!API_KEY) {
            console.warn("PolyLLM API Key missing for fetching models.");
            return [];
        }

        try {
            const response = await fetch(MODELS_URL, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${API_KEY}`
                }
            });

            if (!response.ok) {
                console.warn(`Failed to fetch models (${response.status}). Using fallback.`);
                throw new Error(response.statusText);
            }

            const data = await response.json();
            // Expecting { data: [ { id: "..." }, ... ] }
            return data.data || [];
        } catch (error) {
            // Fallback models
            return [
                { id: 'gpt-4o' },
                { id: 'gpt-4-turbo' },
                { id: 'gpt-3.5-turbo' }
            ];
        }
    },

    async generateResponse(
        prompt: string,
        history: ChatMessage[] = [],
        modelId: string = 'gpt-4o'
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
        const systemMessage = {
            role: "system",
            content: `너는 항공 데이터 전문 SQL PM이야. 저장된 테이블 구조와 쿼리 예시를 참고해서 최적의 SQL 조합을 제안해.\n\n${schemaContext}`
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
            const response = await fetch(CHAT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify({
                    model: modelId,
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
                const errData = await response.json().catch(() => ({}));
                throw new Error(`PolyLLM API Error: ${response.status} ${errData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            const reply = data.choices?.[0]?.message?.content;

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
