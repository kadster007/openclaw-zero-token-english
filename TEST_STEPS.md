# Test Steps (Full Version)

## 🎯 Setup Steps

### Step 1: Build

**Purpose**: Compile TypeScript code into executable JavaScript

```bash
npm install
npm run build
```

**Verification**:

```bash
ls dist/index.mjs
# Should see the compiled file
```

**Note**: If you modify the source code, you need to rebuild

---

### Step 2: Open Browser Debug Mode

**Purpose**: Provide a browser environment (port 9222)

```bash
./start-chrome-debug.sh
```

**Verification**:

```bash
ps aux | grep "chrome.*9222" | grep -v grep
# Should see Chrome process
```

---

### Step 3: Login to Websites (Excluding DeepSeek)

**Purpose**: Establish login sessions in the Chrome debug browser

**Important**: Must login in Chrome launched by `start-chrome-debug` (not your regular browser). **DeepSeek is handled separately in Step 5**

Open and login to the following platforms in Chrome:

1. **Qwen International**: https://chat.qwen.ai
2. **Qwen CN**: https://www.qianwen.com
3. **Kimi**: https://kimi.moonshot.cn
4. **Claude**: https://claude.ai
5. **Doubao**: https://www.doubao.com/chat/
6. **ChatGPT**: https://chatgpt.com
7. **Gemini**: https://gemini.google.com/app
8. **Grok**: https://grok.com
9. **GLM Web (Zhipu Qingyan)**: https://chatglm.cn
10. **GLM International**: https://chat.z.ai

**Note**: Manus uses API Key authentication, no browser login required. API Key acquisition URL: https://open.manus.im

---

### Step 4: Configure Onboard

**Purpose**: Configure authentication information for each platform

```bash
./onboard.sh webauth
```

**Action**: Select a platform (e.g. `deepseek-web`), follow prompts to complete authentication

---

### Step 5: Login DeepSeek

**Purpose**: Login to DeepSeek in Chrome and capture authentication via onboard

1. Visit https://chat.deepseek.com in Chrome and login
2. Run `./onboard.sh webauth`, select **deepseek-web** to complete credential capture

---

### Step 6: Start Server

**Purpose**: Start the Web UI service (port 3001)

```bash
./server.sh start
```

**Verification**:

```bash
./server.sh status
# Should show: Gateway service running
```

---

### Access Web UI

**Access URL**:

```
http://127.0.0.1:3001/#token=62b791625fa441be036acd3c206b7e14e2bb13c803355823
```

The browser should open automatically. If not, manually visit the URL above.

---

### Step 7: View All Models

**Key Rule (Please Note)**:

- The `/models` list shows only the model collection for platforms that have **completed onboard configuration**.
- Only the platforms you actually selected and completed authentication for in `./onboard.sh webauth` will be written into `openclaw.json` and appear in the final model list.
- Platforms that you only logged into in the browser but did not complete onboard will **not** appear in `/models`.

Type the following in the Web UI chat box:

```
/models
```

**Expected Results**: You should see the following models

```
claude-web/claude-sonnet-4-6
claude-web/claude-opus-4-6
claude-web/claude-haiku-4-6
doubao-web/doubao-seed-2.0
doubao-web/doubao-pro
chatgpt-web/gpt-4
chatgpt-web/gpt-4-turbo
chatgpt-web/gpt-3.5-turbo
qwen-web/qwen-max
qwen-web/qwen-plus
qwen-web/qwen-turbo
kimi-web/moonshot-v1-8k
kimi-web/moonshot-v1-32k
kimi-web/moonshot-v1-128k
gemini-web/gemini-pro
gemini-web/gemini-ultra
grok-web/grok-2
grok-web/grok-1
glm-web/glm-4-plus (GLM)
glm-web/glm-4-think (GLM)
manus-api/manus-1.6
manus-api/manus-1.6-lite
```

---

### Step 8: Test Conversation

**Action**:

1. Select a model in the Web UI (e.g. `claude-web/claude-sonnet-4-6`)
2. Send a test message: "Hello, please introduce yourself"
3. Check if you receive a reply normally

**Repeat testing for each platform**:

- ✅ claude-web
- ✅ doubao-web
- ✅ chatgpt-web
- ✅ qwen-web
- ✅ kimi-web
- ✅ gemini-web
- ✅ grok-web
- ✅ deepseek-web
- ✅ glm-web (GLM)
- ✅ manus-api (requires API Key)

---

## 📊 Configuration Flowchart

```text
┌─────────────────────────────────────┐
│ 1. Build                            │
│    npm install && npm run build     │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 2. Open browser debug               │
│    ./start-chrome-debug.sh          │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 3. Log into websites (no DeepSeek)  │
│    (Qwen, Kimi, etc., DeepSeek step 5)│
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 4. Configure onboard                │
│    ./onboard.sh webauth             │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 5. Log into DeepSeek                │
│    (Chrome login + onboard capture) │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 6. Start server                     │
│    ./server.sh start                │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ Open Web UI → http://127.0.0.1:3001 │
│ Type /models → test conversation    │
└─────────────────────────────────────┘
```

---

## 🔧 Troubleshooting

### Issue 1: Port Conflict

**Symptoms**: Gateway fails to start, port is occupied

**Resolution**:

```bash
# Find process occupying port 3001
lsof -i :3001

# Kill process
kill <PID>

# Or force stop
./server.sh stop
```

### Issue 2: Chrome Debug Browser Not Starting

**Symptoms**: Onboard reports cannot connect to browser

**Resolution**:

```bash
# Check if Chrome is running
ps aux | grep "chrome.*9222"

# Restart
./start-chrome-debug.sh
```

### Issue 3: Authentication Failure

**Symptoms**: Authentication error when testing conversation

**Resolution**:

1. Ensure you are logged in within the Chrome debug browser
2. Re-run `./onboard.sh webauth` to configure authentication
3. Check if cookies are correct

### Issue 4: Model List is Empty

**Symptoms**: `/models` command shows no models

**Resolution**:

```bash
# Restart Gateway
./server.sh restart

# Check config file
cat .openclaw-zero-state/openclaw.json | jq '.models.providers | keys'

# View logs
tail -f /tmp/openclaw-zero-gateway.log
```

### Issue 5: glm-intl-web Authentication or API Error

**Symptoms**: `glm-intl-web` returns `Authentication expired`, `API 500/401` and similar errors.

**Explanation**:

- The request chain for the international version `https://chat.z.ai/` differs from `glm-web(chatglm.cn)`, and the API may change with frontend version updates.
- The current implementation has switched to prioritizing browser page reuse (UI-driven) for improved stability.

**Troubleshooting suggestions**:

```bash
# 1) Ensure debug browser is logged in
./start-chrome-debug.sh

# 2) Re-authorize glm-intl-web
./onboard.sh webauth

# 3) Use capture script to analyze actual requests (script migrated to test/)
node test/fix-glm-intl-api.js
```

---

## 📝 Quick Command Reference

```bash
# First time: Install dependencies and build
npm install
npm run build

# Stop system Gateway
openclaw gateway stop

# Start Chrome debug
./start-chrome-debug.sh

# Configure auth
./onboard.sh webauth

# Start local Gateway
./server.sh start

# Check status
./server.sh status

# Restart Gateway
./server.sh restart

# Stop Gateway
./server.sh stop

# View logs
tail -f /tmp/openclaw-zero-gateway.log

# Check config
cat .openclaw-zero-state/openclaw.json | jq '.models.providers | keys'

# Check auth
cat .openclaw-zero-state/agents/main/agent/auth-profiles.json | jq '.profiles | keys'
```

---

## 🧪 Debug Script Locations

GLM debug scripts under the root directory have been consolidated into `test/`:

- `test/fix-glm-intl-api.js` - Automatically send test messages and capture requests/responses
- `test/debug-glm-intl-api.js` - Continuously monitor intl API requests
- `test/debug-glm-requests.js` - Intercept and print POST requests
- `test/capture-glm-api.js` - CDP/Fetch level packet capture
- `test/quick-debug-glm.js` - Quick connectivity debugging
- `test/direct-capture.js` - WebSocket direct connection capture

---

## ✅ Test Completion Criteria

- ✅ All 10 platforms visible in `/models`
- ✅ Each platform can successfully send messages and receive replies
- ✅ Streaming responses work correctly (character-by-character display)
- ✅ No authentication errors or API errors

---

Happy testing! 🚀
