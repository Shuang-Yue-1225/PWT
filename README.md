# Prompt 生成工具

一个面向新手用户的 Web 原型。用户输入简单请求后，系统会识别任务类型，通过少量选择题补齐细节，并生成可复制给其他 AI agent 使用的结构化 prompt。

## 整体设计

- `src/data/taskConfigs.ts`：任务类型、关键词、默认角色、追问问题和默认策略配置。
- `src/utils/analyzeTask.ts`：基于关键词和简单规则识别任务类型，后续可替换为真实大模型分类。
- `src/utils/questionFlow.ts`：控制每轮最多 3 个问题、最多 4 轮，并为未回答项生成“由 AI 自主决定”的答案。
- `src/utils/promptGenerator.ts`：把任务配置和用户答案转换成结构化 prompt，不做简单字符串堆叠。
- `src/components/`：输入、任务分析、问答、摘要确认、结果复制等界面组件。

## 运行方式

```bash
npm install
npm run dev
```

浏览器打开 Vite 输出的本地地址即可。

## 构建

```bash
npm run build
```

构建产物会生成在 `dist/` 目录，可以部署到任何支持静态网站托管的平台。

## 长期在线部署

如果希望别人访问时不依赖你的电脑，需要把网站部署到云端静态托管平台。这个项目是纯前端 Vite 应用，不需要后端，推荐配置如下：

| 平台 | Build command | Output / Publish directory |
| --- | --- | --- |
| Vercel | `npm run build` | `dist` |
| Netlify | `npm run build` | `dist` |
| Cloudflare Pages | `npm run build` | `dist` |

### 方式一：Vercel

1. 把项目上传到 GitHub。
2. 在 Vercel 新建项目并导入该仓库。
3. Framework 选择 Vite，或保持自动识别。
4. 确认 Build Command 是 `npm run build`，Output Directory 是 `dist`。
5. 部署完成后，Vercel 会给出一个长期可访问链接。

也可以在登录 Vercel CLI 后运行：

```bash
npm run deploy:vercel
```

### 方式二：Netlify

1. 把项目上传到 GitHub。
2. 在 Netlify 新建站点并导入该仓库。
3. Build command 填 `npm run build`。
4. Publish directory 填 `dist`。
5. 部署完成后，Netlify 会给出一个长期可访问链接。

也可以在登录 Netlify CLI 后运行：

```bash
npm run deploy:netlify
```

### 方式三：Cloudflare Pages

1. 把项目上传到 GitHub。
2. 在 Cloudflare Pages 新建项目并导入该仓库。
3. Build command 填 `npm run build`。
4. Build output directory 填 `dist`。
5. 部署完成后，Cloudflare Pages 会给出一个长期可访问链接。

也可以在登录 Wrangler 后运行：

```bash
npm run deploy:cloudflare
```

## 后续接入真实大模型 API

当前 agent 逻辑在前端模拟，方便快速验证交互流程。后续可以将这些位置替换为 API 调用：

- 任务识别：替换 `analyzeTask`。
- 问题生成：在 `taskConfigs` 的静态问题基础上，加入模型动态生成问题。
- Prompt 质量优化：在 `generatePrompt` 后增加一次模型润色或评分。

## TODO

- 增加 prompt 版本历史。
- 支持导出为 `.txt` 或 Markdown 文件。
- 增加更多细分任务类型，例如翻译、数据分析、产品设计。
