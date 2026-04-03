# OpenLecture

Free, open-source, local-first lecture transcription and translation for
international students.

[English](#english) | [中文](#中文)

---

<a name="english"></a>

## What OpenLecture Is

OpenLecture is the free edition in the EasyPine product family. It keeps the
core lecture workflow simple:

- real-time transcription
- real-time translation
- manual notes
- local course and lecture storage

It does not include hosted AI notes, grounded chat, review, billing, uploads,
or cloud sync. The edition boundary is documented in
[`docs/edition-matrix.md`](docs/edition-matrix.md).

## Download

**macOS (Apple Silicon):**
[Download the latest release](https://github.com/kyusongy/OpenLecture/releases/latest)

On first launch, paste a DashScope API key. The app now shows the local data
directory and the selected DashScope region in Settings so users can verify
where files live.

> If macOS reports that the app is damaged because it is unsigned:
>
> ```bash
> xattr -cr /Applications/OpenLecture.app
> ```

## Features

- Real-time speech-to-text transcription
- Real-time translation
- Course and lecture organization
- Markdown notes alongside the transcript
- Local-only file storage
- DashScope region selection for China or international usage
- Bilingual interface (English and Chinese)

## Get A DashScope API Key

1. Open [Alibaba Cloud Model Studio](https://modelstudio.console.aliyun.com/ap-southeast-1?tab=dashboard#/api-key)
2. Create or sign in to your Alibaba Cloud account
3. Generate an API key
4. Paste it into the setup screen

## Development

Python baseline: `3.10.13`

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

### Desktop Build

```bash
./scripts/build.sh
```

## Looking For More?

[EasyPine](https://easypine-ai.com) adds AI note generation, grounded lecture
chat, spaced review, uploads, billing, and cloud sync.

## Contributor Notes

- Edition boundary and feature split: [`docs/edition-matrix.md`](docs/edition-matrix.md)
- Contributor guide and source-of-truth notes: [`docs/contributor-guide.md`](docs/contributor-guide.md)

---

<a name="中文"></a>

## OpenLecture 是什么

OpenLecture 是 EasyPine 产品体系里的免费开源版，聚焦最核心的课堂流程：

- 实时转录
- 实时翻译
- 手动笔记
- 本地课程与讲座管理

它不包含托管式 AI 笔记、课堂问答、复习、计费、资料上传或云同步。版本边界写在
[`docs/edition-matrix.md`](docs/edition-matrix.md)。

## 下载

**macOS（Apple Silicon）**
[下载最新版本](https://github.com/kyusongy/OpenLecture/releases/latest)

首次启动时输入 DashScope API 密钥即可。设置页会显示当前 DashScope 区域和本地数据目录，方便确认数据确实保存在本机。

> 如果 macOS 因未签名提示“应用已损坏”：
>
> ```bash
> xattr -cr /Applications/OpenLecture.app
> ```

## 功能

- 实时语音转文字
- 实时翻译
- 课程与讲座管理
- 转录旁 Markdown 笔记
- 全部文件本地存储
- 中国区/国际区 DashScope 切换
- 中英文界面

## 获取 DashScope API 密钥

1. 打开[阿里云百炼控制台](https://modelstudio.console.aliyun.com/ap-southeast-1?tab=dashboard#/api-key)
2. 登录或创建阿里云账号
3. 生成 API 密钥
4. 粘贴到应用启动页

## 开发

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

### 桌面构建

```bash
./scripts/build.sh
```

## 想要更完整的版本？

[EasyPine](https://easypine-ai.com) 提供 AI 笔记生成、可溯源问答、间隔复习、资料上传、计费和多设备云同步。
