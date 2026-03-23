# OpenLecture

**Free, open-source real-time lecture transcription & translation for international students.**

[English](#english) | [中文](#中文)

---

<a name="english"></a>

## Features

- Real-time speech-to-text transcription (25+ languages)
- Live translation to 10 target languages
- Course & lecture organization
- Markdown notes alongside your transcript
- Fully local — your data stays on your machine
- Single API key setup (DashScope)
- Bilingual interface (English & Chinese)

## Quickstart

### 1. Clone & configure

```bash
git clone https://github.com/kyusongy/OpenLecture.git
cd OpenLecture
cp .env.example .env
# Edit .env and add your DashScope API key
```

### 2. Start the backend

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload
```

### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

> **Docker alternative:** `docker compose up` runs both services — frontend at [http://localhost:3000](http://localhost:3000).

## Getting a DashScope API Key

1. Go to [Alibaba Cloud Model Studio — API Keys](https://modelstudio.console.aliyun.com/ap-southeast-1?tab=dashboard#/api-key) (Singapore region)
2. Create an Alibaba Cloud account or sign in
3. Generate a new API key
4. Copy the key and paste it into your `.env` file or the Settings page

DashScope offers a free tier with generous usage limits.

## Supported Languages

### Transcription (Speech-to-Text)

| Language | Code | Language | Code |
|----------|------|----------|------|
| Chinese (Mandarin) | ZH | English | EN |
| Japanese | JA | Korean | KO |
| French | FR | German | DE |
| Spanish | ES | Russian | RU |
| Italian | IT | Portuguese | PT |
| Arabic | AR | Thai | TH |
| Hindi | HI | Indonesian | ID |
| Turkish | TR | Vietnamese | VI |
| Ukrainian | UK | Czech | CS |
| Danish | DA | Finnish | FI |
| Malay | MS | Dutch | NL |
| Norwegian | NO | Polish | PL |
| Swedish | SV | Filipino | TL |
| Cantonese | YUE | Icelandic | IS |

### Translation Targets

Chinese, English, Japanese, Korean, French, German, Spanish, Portuguese, Russian, Arabic

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `DASHSCOPE_API_KEY` | *(required)* | Your DashScope API key |
| `DASHSCOPE_ENDPOINT` | `international` | `international` (Singapore) or `china` (Beijing). Use international for best performance outside mainland China. |
| `DATA_DIR` | `./data` | Where lecture data is stored |
| `CORS_ORIGINS` | `http://localhost:5173` | Allowed frontend origins |

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS
- **Backend:** Python, FastAPI, Uvicorn
- **Transcription:** Qwen3 ASR Flash Realtime
- **Translation:** Qwen MT Lite
- **Storage:** Local filesystem (JSON + Markdown)

## License

This project is licensed under the [AGPL-3.0](LICENSE). You are free to use, modify, and distribute this software for personal and educational purposes. If you deploy this as a service, you must make your source code available.

## Looking for more?

[EasyPine](https://easypine-ai.com) offers everything in OpenLecture plus AI-powered notes generation, intelligent Q&A chat, spaced repetition review, and cloud sync across devices.

---

<a name="中文"></a>

# OpenLecture

**免费、开源的实时课堂转录与翻译工具，专为留学生打造。**

[English](#english) | [中文](#中文)

---

## 功能特点

- 实时语音转文字（支持 25+ 种语言）
- 实时翻译至 10 种目标语言
- 课程与讲座管理
- 转录旁同步 Markdown 笔记
- 完全本地运行 — 数据不离开你的电脑
- 仅需一个 API 密钥（DashScope）
- 双语界面（中文 & 英文）

## 快速开始

### 1. 克隆并配置

```bash
git clone https://github.com/kyusongy/OpenLecture.git
cd OpenLecture
cp .env.example .env
# 编辑 .env 文件，填入你的 DashScope API 密钥
```

### 2. 启动后端

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload
```

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

打开 [http://localhost:5173](http://localhost:5173)

> **Docker 方式：** 运行 `docker compose up` 即可同时启动前后端 — 前端地址 [http://localhost:3000](http://localhost:3000)。

## 获取 DashScope API 密钥

1. 前往 [阿里云百炼 — API 密钥](https://modelstudio.console.aliyun.com/ap-southeast-1?tab=dashboard#/api-key)（新加坡节点）
2. 创建阿里云账号或登录
3. 生成新的 API 密钥
4. 复制密钥，粘贴到 `.env` 文件或设置页面中

DashScope 提供免费额度，用量十分充裕。

## 支持的语言

### 转录（语音转文字）

| 语言 | 代码 | 语言 | 代码 |
|------|------|------|------|
| 中文（普通话） | ZH | 英语 | EN |
| 日语 | JA | 韩语 | KO |
| 法语 | FR | 德语 | DE |
| 西班牙语 | ES | 俄语 | RU |
| 意大利语 | IT | 葡萄牙语 | PT |
| 阿拉伯语 | AR | 泰语 | TH |
| 印地语 | HI | 印尼语 | ID |
| 土耳其语 | TR | 越南语 | VI |
| 乌克兰语 | UK | 捷克语 | CS |
| 丹麦语 | DA | 芬兰语 | FI |
| 马来语 | MS | 荷兰语 | NL |
| 挪威语 | NO | 波兰语 | PL |
| 瑞典语 | SV | 菲律宾语 | TL |
| 粤语 | YUE | 冰岛语 | IS |

### 翻译目标语言

中文、英语、日语、韩语、法语、德语、西班牙语、葡萄牙语、俄语、阿拉伯语

## 配置

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `DASHSCOPE_API_KEY` | *（必填）* | 你的 DashScope API 密钥 |
| `DASHSCOPE_ENDPOINT` | `international` | `international`（新加坡）或 `china`（北京）。中国大陆以外建议使用 international。 |
| `DATA_DIR` | `./data` | 讲座数据存储位置 |
| `CORS_ORIGINS` | `http://localhost:5173` | 允许的前端来源地址 |

## 技术栈

- **前端：** React 19、TypeScript、Vite、Tailwind CSS
- **后端：** Python、FastAPI、Uvicorn
- **转录：** Qwen3 ASR Flash Realtime
- **翻译：** Qwen MT Lite
- **存储：** 本地文件系统（JSON + Markdown）

## 许可证

本项目采用 [AGPL-3.0](LICENSE) 许可证。你可以自由地将本软件用于个人和教育用途，也可以修改和分发。如果你将本软件作为服务部署，则必须公开源代码。

## 想要更多功能？

[EasyPine](https://easypine-ai.com) 包含 OpenLecture 的全部功能，还提供 AI 智能笔记生成、智能问答聊天、间隔重复复习以及多设备云同步。
