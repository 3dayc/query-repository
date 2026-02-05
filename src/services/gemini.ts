import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

export const geminiService = {
    async generateResponse(
        prompt: string,
        history: ChatMessage[] = []
    ): Promise<string> {
        if (!API_KEY) throw new Error("Gemini API Key missing. Please check .env.local");

        const genAI = new GoogleGenerativeAI(API_KEY);
        // Using gemini-1.5-flash as requested
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // 1. Fetch Full Context
        // We use store for Folders/Tables, but Queries might be partial in store (fetched on demand).
        // Fetch all queries to provide full context to Gemini.
        const { tables } = useAppStore.getState();

        const { data: allQueries, error } = await supabase
            .from('queries')
            .select('*')
            .is('deleted_at', null);

        if (error) {
            console.error("Failed to fetch query context for AI:", error);
            // Continue with partial context is risky, effectively AI won't know queries.
            // But we can still proceed with Table schemas.
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
                        // Truncate very long SQL to save tokens if necessary, but 1.5 Pro has large window.
                        schemaContext += `  - "${q.title}":\n    ${q.sql_code.replace(/\n/g, ' ')}\n`;
                        if (q.related_link) schemaContext += `    (Link: ${q.related_link})\n`;
                    });
                }
                schemaContext += "\n";
            });
        }

        // 3. System Instruction Construction
        // We prepend this to the chat history as the 'System Context'
        const systemInstruction = `
You are an expert SQL Data Analyst for 'NolUniverse' (Global Flight & Travel Data Platform).
Your role is to assist the user in writing, optimizing, and understanding SQL queries based on the provided schema and existing query repository.

Guidelines:
1. **Domain Context**: NolUniverse deals with flights, bookings, schedules, and user data. Use this context to infer relationships (e.g., Joining Flights with Bookings on flight_id).
2. **Reuse & Adapt**: If an existing query in the repository allows, suggest modifying it rather than starting from scratch.
3. **Complex Logic**: Don't shy away from JOINs, Subqueries, or Window Functions if specific analysis is requested (e.g., ROI, Retention, Conversion).
4. **Format**: 
   - Provide the SQL code inside a markdown block: \`\`\`sql ... \`\`\`.
   - Before or after the code, explain your logic briefly.
5. **Output**: Always generate valid PostgreSQL syntax compatible with Supabase.

${schemaContext}
`;

        // 4. Start Chat
        // We simulate a persistent chat by passing history.
        // However, we need to inject system instruction at the start.
        // Google Generative AI SDK's startChat history must alternate user/model.
        // We will treat the system instruction as the first User message, and a dummy Model acknowledgement.

        const validHistory = history.map(h => ({
            role: h.role,
            parts: [{ text: h.text }]
        }));

        const chat = model.startChat({
            history: [
                {
                    role: 'user',
                    parts: [{ text: `SYSTEM_INSTRUCTION:\n${systemInstruction}` }]
                },
                {
                    role: 'model',
                    parts: [{ text: "Understood. I have analyzed the schema and query repository. I am ready to help you write SQL queries for NolUniverse." }]
                },
                ...validHistory
            ]
        });

        const result = await chat.sendMessage(prompt);
        const response = result.response;
        return response.text();
    }
};
