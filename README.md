# OpenLecture

**Free, open-source real-time lecture transcription & translation for international students.**

[English](#english) | [中文](#中文)

---

<a name="english"></a>

## Download

**macOS (Apple Silicon):** [Download the latest release](https://github.com/kyusongy/OpenLecture/releases/latest)

Just download the `.dmg`, drag to Applications, and launch. No developer tools needed. On first launch, you'll be prompted to enter a free DashScope API key.

> **First launch:** macOS may show "app is damaged" because it's unsigned. Open Terminal and run:
> ```bash
> xattr -cr /Applications/OpenLecture.app
> ```
> Then launch normally. You only need to do this once.

## Features

- Real-time speech-to-text transcription (25+ languages)
- Live translation to 10 target languages
- Course & lecture organization
- Markdown notes alongside your transcript
- Fully local — your data stays on your machine
- Single API key setup (DashScope)
- Bilingual interface (English & Chinese)

## Getting a DashScope API Key

1. Go to [Alibaba Cloud Model Studio — API Keys](https://modelstudio.console.aliyun.com/ap-southeast-1?tab=dashboard#/api-key) (Singapore region)
2. Create an Alibaba Cloud account or sign in
3. Generate a new API key
4. Paste it into the setup screen when you launch OpenLecture

DashScope offers a free tier with generous usage limits.

## Development

If you want to run from source or contribute:

### Backend

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

> **Docker alternative:** `docker compose up` runs both services — frontend at [http://localhost:3000](http://localhost:3000).

### Building the Desktop App

Prerequisites: Rust, Node.js, Python 3.11+, [uv](https://docs.astral.sh/uv/), [Tauri CLI](https://tauri.app/start/)

```bash
./scripts/build.sh
```

The `.dmg` is output to `src-tauri/target/release/bundle/dmg/`.

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
| `DASHSCOPE_ENDPOINT` | `international` | `international` (Singapore) or `china` (Beijing) |
| `DATA_DIR` | `./data` | Where lecture data is stored |
| `CORS_ORIGINS` | `*` | Allowed frontend origins |

## Tech Stack

- **Desktop:** Tauri v2 (Rust + native webview)
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS
- **Backend:** Python, FastAPI, Uvicorn
- **Transcription:** Qwen3 ASR Flash Realtime (DashScope)
- **Translation:** Qwen MT Lite (DashScope)
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

## 下载

**macOS (Apple Silicon):** [下载最新版本](https://github.com/kyusongy/OpenLecture/releases/latest)

下载 `.dmg` 文件，拖入"应用程序"文件夹，启动即可。无需安装开发工具。首次启动时会提示输入免费的 DashScope API 密钥。

> **首次启动：** macOS 可能提示"应用已损坏"，因为应用未签名。请打开终端运行：
> ```bash
> xattr -cr /Applications/OpenLecture.app
> ```
> 然后正常启动即可。此操作只需执行一次。

## 功能特点

- 实时语音转文字（支持 25+ 种语言）
- 实时翻译至 10 种目标语言
- 课程与讲座管理
- 转录旁同步 Markdown 笔记
- 完全本地运行 — 数据不离开你的电脑
- 仅需一个 API 密钥（DashScope）
- 双语界面（中文 & 英文）

## 获取 DashScope API 密钥

1. 前往 [阿里云百炼 — API 密钥](https://modelstudio.console.aliyun.com/ap-southeast-1?tab=dashboard#/api-key)（新加坡节点）
2. 创建阿里云账号或登录
3. 生成新的 API 密钥
4. 在 OpenLecture 启动时的设置界面中粘贴密钥

DashScope 提供免费额度，用量十分充裕。

## 开发

如果你想从源码运行或参与贡献：

### 后端

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload
```

### 前端

```bash
cd frontend
npm install
npm run dev
```

打开 [http://localhost:5173](http://localhost:5173)

> **Docker 方式：** 运行 `docker compose up` 即可同时启动前后端 — 前端地址 [http://localhost:3000](http://localhost:3000)。

### 构建桌面应用

前置要求：Rust、Node.js、Python 3.11+、[uv](https://docs.astral.sh/uv/)、[Tauri CLI](https://tauri.app/start/)

```bash
./scripts/build.sh
```

`.dmg` 文件输出到 `src-tauri/target/release/bundle/dmg/`。

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
| `DASHSCOPE_ENDPOINT` | `international` | `international`（新加坡）或 `china`（北京） |
| `DATA_DIR` | `./data` | 讲座数据存储位置 |
| `CORS_ORIGINS` | `*` | 允许的前端来源地址 |

## 技术栈

- **桌面端：** Tauri v2（Rust + 原生 WebView）
- **前端：** React 19、TypeScript、Vite、Tailwind CSS
- **后端：** Python、FastAPI、Uvicorn
- **转录：** Qwen3 ASR Flash Realtime（DashScope）
- **翻译：** Qwen MT Lite（DashScope）
- **存储：** 本地文件系统（JSON + Markdown）

## 许可证

本项目采用 [AGPL-3.0](LICENSE) 许可证。你可以自由地将本软件用于个人和教育用途，也可以修改和分发。如果你将本软件作为服务部署，则必须公开源代码。

## 想要更多功能？

[EasyPine](https://easypine-ai.com) 包含 OpenLecture 的全部功能，还提供 AI 智能笔记生成、智能问答聊天、间隔重复复习以及多设备云同步。
