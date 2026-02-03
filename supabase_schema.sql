-- Create tables table
CREATE TABLE public.tables (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create queries table
CREATE TABLE public.queries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_id UUID REFERENCES public.tables(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    sql_code TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queries ENABLE ROW LEVEL SECURITY;

-- Create policies (Allow all access for this prototype project)
-- Note: In a real production app, you would restrict this based on user auth.
CREATE POLICY "Enable all access for tables" ON public.tables
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for queries" ON public.queries
    FOR ALL USING (true) WITH CHECK (true);

-- Insert initial sample data
INSERT INTO public.tables (table_name, description) VALUES
('daily_user_events', '사용자 행동 로그 테이블'),
('sales_transactions', '매출 거래 데이터');

-- Insert sample queries (Assuming IDs need to be looked up, but for SQL script simplicity we can just insert)
-- Ideally run this after tables are created to get actual IDs, or use a DO block.
-- Here is a sample DO block to populate data safely:

DO $$
DECLARE
    v_table_id_1 UUID;
    v_table_id_2 UUID;
BEGIN
    SELECT id INTO v_table_id_1 FROM public.tables WHERE table_name = 'daily_user_events' LIMIT 1;
    SELECT id INTO v_table_id_2 FROM public.tables WHERE table_name = 'sales_transactions' LIMIT 1;

    INSERT INTO public.queries (table_id, title, sql_code) VALUES
    (v_table_id_1, '기본 조회', 'SELECT * FROM daily_user_events LIMIT 100;'),
    (v_table_id_1, 'DAU 계산', 'SELECT event_date, COUNT(DISTINCT user_id) FROM daily_user_events GROUP BY 1;'),
    (v_table_id_2, '월별 매출', 'SELECT trunk(order_date, ''MM''), SUM(amount) FROM sales_transactions GROUP BY 1;');
END $$;
