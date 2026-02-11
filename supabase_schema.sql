-- 1. Create folders table first (referenced by tables)
CREATE TABLE IF NOT EXISTS public.folders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create tables table (or modify existing)
CREATE TABLE IF NOT EXISTS public.tables (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name TEXT NOT NULL,
    description TEXT,
    folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: If 'tables' already exists without these columns, you would run:
-- ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL;
-- ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- 3. Create queries table
CREATE TABLE IF NOT EXISTS public.queries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_id UUID REFERENCES public.tables(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    sql_code TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queries ENABLE ROW LEVEL SECURITY;

-- Create policies (Allow all access for this prototype project)
-- Note: In a real production app, you would restrict this based on user auth.
DROP POLICY IF EXISTS "Enable all access for tables" ON public.tables;
CREATE POLICY "Enable all access for tables" ON public.tables
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for folders" ON public.folders;
CREATE POLICY "Enable all access for folders" ON public.folders
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for queries" ON public.queries;
CREATE POLICY "Enable all access for queries" ON public.queries
    FOR ALL USING (true) WITH CHECK (true);

-- Insert initial sample data
-- First crate folders
INSERT INTO public.folders (name, order_index) VALUES
('실적', 0),
('유입', 1);

-- Insert tables (We will update folder_ids manually in a real scenario, but here we can try to link if we used DO block, 
-- but for simplicity of the schema file, we'll just insert raw data.
-- In a running app, migrations would be handled differently. 
-- For this "setup" script, let's keep it simple.)

INSERT INTO public.tables (table_name, description, order_index) VALUES
('daily_user_events', '사용자 행동 로그 테이블', 0),
('sales_transactions', '매출 거래 데이터', 1);

-- Insert sample queries
-- (Logic unchanged, just ensuring schema validity)
DO $$
DECLARE
    v_table_id_1 UUID;
    v_table_id_2 UUID;
BEGIN
    -- Only insert queries if tables exist and IDs can be found
    SELECT id INTO v_table_id_1 FROM public.tables WHERE table_name = 'daily_user_events' LIMIT 1;
    SELECT id INTO v_table_id_2 FROM public.tables WHERE table_name = 'sales_transactions' LIMIT 1;

    IF v_table_id_1 IS NOT NULL THEN
        INSERT INTO public.queries (table_id, title, sql_code) VALUES
        (v_table_id_1, '기본 조회', 'SELECT * FROM daily_user_events LIMIT 100;'),
        (v_table_id_1, 'DAU 계산', 'SELECT event_date, COUNT(DISTINCT user_id) FROM daily_user_events GROUP BY 1;');
    END IF;

    IF v_table_id_2 IS NOT NULL THEN
        INSERT INTO public.queries (table_id, title, sql_code) VALUES
        (v_table_id_2, '월별 매출', 'SELECT trunk(order_date, ''MM''), SUM(amount) FROM sales_transactions GROUP BY 1;');
    END IF;
END $$;

-- 4. Chat History Support
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email TEXT NOT NULL,
    title TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for chat_sessions" ON public.chat_sessions;
CREATE POLICY "Allow all for chat_sessions" ON public.chat_sessions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for chat_messages" ON public.chat_messages;
CREATE POLICY "Allow all for chat_messages" ON public.chat_messages FOR ALL USING (true) WITH CHECK (true);
