# Bulk Update SQL

Supabase SQL Editor에서 아래 쿼리를 실행하여 모든 쿼리의 작업자를 변경하세요:

```sql
UPDATE queries 
SET 
  created_by = 'dale8@nol-universe.com',
  last_updated_by = 'dale8@nol-universe.com',
  last_updated_at = now();
```
