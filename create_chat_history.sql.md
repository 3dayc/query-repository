# Chat History Table Setup

Supabase SQL Editor에서 아래스크립트를 실행하여 채팅 내역 저장용 테이블을 생성해 주세요.

```sql
CREATE TABLE IF NOT EXISTS user_chat_history (
    user_email TEXT PRIMARY KEY,
    messages JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- (선택사항) 보안 정책 (RLS)
ALTER TABLE user_chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see own chat" ON user_chat_history
    FOR ALL
    USING (user_email = auth.jwt() ->> 'email')
    WITH CHECK (user_email = auth.jwt() ->> 'email');
```
