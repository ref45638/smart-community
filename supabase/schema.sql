-- 社區投票系統資料庫 Schema

-- 1. 住戶登入記錄表
CREATE TABLE IF NOT EXISTS residents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  building TEXT NOT NULL,
  unit_number TEXT NOT NULL,
  floor INTEGER NOT NULL,
  token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(building, unit_number, floor)
);

-- 2. 投票項目表
CREATE TABLE IF NOT EXISTS polls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by TEXT DEFAULT 'admin'
);

-- 3. 投票記錄表
CREATE TABLE IF NOT EXISTS votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  resident_id TEXT NOT NULL,
  vote TEXT NOT NULL CHECK (vote IN ('agree', 'disagree')),
  voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_id, resident_id)
);

-- 建立索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_polls_active ON polls(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_votes_poll_id ON votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_votes_resident_id ON votes(resident_id);

-- 啟用 Row Level Security (RLS)
ALTER TABLE residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- RLS 政策：住戶只能查看自己的記錄
CREATE POLICY "Residents can view own records"
  ON residents FOR SELECT
  USING (true);

-- RLS 政策：所有人都可以查看進行中的投票
CREATE POLICY "Anyone can view active polls"
  ON polls FOR SELECT
  USING (is_active = true AND expires_at > NOW());

-- RLS 政策：所有人都可以查看投票結果
CREATE POLICY "Anyone can view votes"
  ON votes FOR SELECT
  USING (true);

-- RLS 政策：住戶可以投票
CREATE POLICY "Residents can vote"
  ON votes FOR INSERT
  WITH CHECK (true);

-- RLS 政策：管理員可以建立投票（需要認證）
CREATE POLICY "Authenticated users can create polls"
  ON polls FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- RLS 政策：管理員可以查看所有投票
CREATE POLICY "Authenticated users can view all polls"
  ON polls FOR SELECT
  USING (auth.role() = 'authenticated');

-- 啟用 Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE polls;
ALTER PUBLICATION supabase_realtime ADD TABLE votes;

-- 建立函式：自動更新 last_active_at
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_active_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 建立觸發器
CREATE TRIGGER update_residents_last_active
  BEFORE UPDATE ON residents
  FOR EACH ROW
  EXECUTE FUNCTION update_last_active();
