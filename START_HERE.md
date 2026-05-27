# 🚀 Start Here

## 📖 Documentation Navigation

### 🔧 Installation

- **INSTALLATION.md** - Installation Guide (Required for first use)

### 🎯 Quick Start

- **TEST_STEPS.md** - Complete Test Steps (Recommended)

### 📚 Detailed Documentation

- **ARCHITECTURE.md** - System Architecture
- **README.md** / **README_zh-CN.md** - Project Overview & Supported Platforms

---

## ⚡ Setup Steps (6 Steps)

**First time? Read INSTALLATION.md to complete installation!**

```bash
# 1. Build
npm install
npm run build
pnpm ui:build   # Build Web UI

# 2. Open browser debug
./start-chrome-debug.sh

# 3. Log into websites (Qwen, Kimi, etc., excluding DeepSeek, log in via Chrome)

# 4. Configure onboard
./onboard.sh webauth

# 5. Log into DeepSeek (select deepseek-web in onboard to complete auth)

# 6. Start server
./server.sh start
```

> **Key rule:** Only the platforms configured in `./onboard.sh webauth` will be written into `openclaw.json` and appear in the `/models` list.

If the terminal does not return to the prompt after the webauth wizard finishes, press **Ctrl+C** to exit (credentials are usually saved by then).

Then visit: http://127.0.0.1:3001/#token=62b791625fa441be036acd3c206b7e14e2bb13c803355823

---

## 📋 Platforms Requiring Login

**Step 3** (excluding DeepSeek): Qwen International, Qwen CN, Kimi, Claude, Doubao, ChatGPT, Gemini, Grok, GLM Web (Zhipu Qingyan), GLM International  
**Step 5** (DeepSeek only): https://chat.deepseek.com

**Manus API** (tested): Configure API Key in onboard, no browser login required

---

## ✅ Test Status

| Platform | Status |
| --------------------------------------------------------------------------------------------------------------------------- | ------------- |
| DeepSeek, Qwen International, Qwen CN, Kimi, Claude Web, Doubao, ChatGPT Web, Gemini Web, Grok Web, GLM Web, GLM International, Manus API | ✅ Tested working |

---

## 🎯 Expected Results

After testing, you will have:

- ✅ 12 available platforms (11 Web platforms + Manus API)
- ✅ 28+ selectable AI models
- ✅ Completely free AI conversation service
- ✅ Unified browser solution

---

## 📞 Need Help?

See **TEST_STEPS.md** for detailed testing steps and troubleshooting guide.

---

Start testing! 🎉
