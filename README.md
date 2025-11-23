# Smart Community 智慧社區管理系統

一個基於 React + TypeScript + Vite + Supabase 的智慧社區管理系統。

## 功能特色

- 🏘️ 社區住戶管理
- 🗳️ 投票系統
- 📱 QR Code 門禁管理
- 👥 住戶資訊管理

## 技術棧

- **前端框架**: React 18 + TypeScript
- **建置工具**: Vite
- **UI 框架**: TailwindCSS + Radix UI
- **後端服務**: Supabase
- **路由**: React Router
- **認證**: JWT (jose)

## 本地開發

### 1. 安裝依賴

```bash
npm install
```

### 2. 設定環境變數

複製 `.env.example` 為 `.env` 並填入你的配置:

```bash
cp .env.example .env
```

編輯 `.env` 檔案:

```env
VITE_SUPABASE_URL=你的-supabase-url
VITE_SUPABASE_ANON_KEY=你的-supabase-anon-key
VITE_JWT_SECRET=你的-jwt-secret-key
```

### 3. 啟動開發服務器

```bash
npm run dev
```

訪問 http://localhost:5173

### 4. 建置生產版本

```bash
npm run build
```

## 部署到 GitHub Pages

本專案已配置自動部署到 GitHub Pages。

### 設定步驟:

1. **在 GitHub Repository 設定 Secrets**
   
   前往 `Settings` → `Secrets and variables` → `Actions` → `New repository secret`
   
   新增以下 secrets:
   - `VITE_SUPABASE_URL`: 你的 Supabase 專案 URL
   - `VITE_SUPABASE_ANON_KEY`: 你的 Supabase Anonymous Key
   - `VITE_JWT_SECRET`: 你的 JWT 密鑰

2. **啟用 GitHub Pages**
   
   前往 `Settings` → `Pages`
   - Source: 選擇 `GitHub Actions`

3. **推送程式碼**
   
   ```bash
   git add .
   git commit -m "Initial commit"
   git push -u origin main
   ```

4. **自動部署**
   
   推送後,GitHub Actions 會自動建置並部署到:
   
   🌐 **https://ref45638.github.io/smart-community/**

### 手動觸發部署

在 GitHub Repository 頁面:
`Actions` → `Deploy to GitHub Pages` → `Run workflow`

## 專案結構

```
smart-community/
├── src/
│   ├── components/     # 共用元件
│   ├── lib/           # 工具函式和配置
│   │   ├── auth.ts    # JWT 認證
│   │   ├── supabase.ts # Supabase 客戶端
│   │   └── polls.ts   # 投票邏輯
│   ├── pages/         # 頁面元件
│   │   ├── admin/     # 管理員頁面
│   │   └── resident/  # 住戶頁面
│   └── types/         # TypeScript 類型定義
├── .github/
│   └── workflows/
│       └── deploy.yml # GitHub Actions 部署配置
└── vite.config.ts     # Vite 配置
```

## 開發指令

- `npm run dev` - 啟動開發服務器
- `npm run build` - 建置生產版本
- `npm run preview` - 預覽生產版本
- `npm run lint` - 執行 ESLint 檢查

## License

MIT
