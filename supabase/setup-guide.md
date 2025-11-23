# Supabase 設定指南

本文件說明如何設定 Supabase 專案以支援社區投票系統。

## 步驟 1：建立 Supabase 專案

1. 前往 [Supabase](https://supabase.com/) 並登入
2. 點擊 "New Project"
3. 填寫專案資訊：
   - **Name**: smart-community（或您喜歡的名稱）
   - **Database Password**: 設定一個強密碼並記住它
   - **Region**: 選擇最接近您的地區（建議選擇 Northeast Asia (Tokyo)）
4. 點擊 "Create new project" 並等待專案建立完成（約 2 分鐘）

## 步驟 2：執行資料庫 Schema

1. 在 Supabase Dashboard 左側選單中，點擊 **SQL Editor**
2. 點擊 "New query"
3. 複製 `supabase/schema.sql` 檔案的所有內容
4. 貼上到 SQL Editor 中
5. 點擊右下角的 "Run" 按鈕執行
6. 確認所有指令都成功執行（應該會看到 "Success. No rows returned"）

## 步驟 3：建立管理員帳號

1. 在左側選單中，點擊 **Authentication** > **Users**
2. 點擊 "Add user" > "Create new user"
3. 填寫管理員資訊：
   - **Email**: 您的管理員 email（例如：admin@example.com）
   - **Password**: 設定管理員密碼
   - **Auto Confirm User**: 勾選此選項
4. 點擊 "Create user"

> **重要**：這個 email 和密碼就是您登入管理員後台時使用的帳號密碼

## 步驟 4：取得 API Keys

1. 在左側選單中，點擊 **Project Settings**（齒輪圖示）
2. 點擊 **API** 分頁
3. 找到以下兩個值並複製：
   - **Project URL**: 類似 `https://xxxxx.supabase.co`
   - **anon public**: 這是您的 anon key

## 步驟 5：設定環境變數

1. 在專案根目錄建立 `.env` 檔案（複製 `.env.example`）
2. 填入您的 Supabase 資訊：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_JWT_SECRET=your-random-secret-key-for-qrcode
```

> **JWT_SECRET**: 請自行產生一個隨機字串，用於 QR Code token 加密。可以使用線上工具或執行：
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

## 步驟 6：啟用 Realtime

1. 在左側選單中，點擊 **Database** > **Replication**
2. 找到 `polls` 和 `votes` 資料表
3. 確認它們的 "Realtime" 欄位已啟用（應該會顯示綠色勾勾）
4. 如果沒有啟用，點擊切換按鈕來啟用

## 步驟 7：驗證設定

執行以下 SQL 查詢來驗證資料表是否正確建立：

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('residents', 'polls', 'votes');
```

應該會看到三個資料表：
- residents
- polls
- votes

## 完成！

現在您的 Supabase 專案已經設定完成，可以開始使用社區投票系統了。

## 常見問題

### Q: 如何新增更多管理員？
A: 在 Authentication > Users 頁面重複步驟 3 即可。

### Q: 如何查看投票資料？
A: 在 Database > Tables 中選擇對應的資料表即可查看所有資料。

### Q: 如何備份資料庫？
A: 在 Database > Backups 中可以手動建立備份或設定自動備份。

### Q: RLS 政策是什麼？
A: Row Level Security (RLS) 是 Supabase 的安全機制，確保使用者只能存取被授權的資料。我們的設定確保：
- 住戶只能查看進行中的投票
- 住戶只能投票一次
- 管理員可以查看所有資料

## 需要協助？

如有任何問題，請參考 [Supabase 官方文件](https://supabase.com/docs) 或聯繫技術支援。
