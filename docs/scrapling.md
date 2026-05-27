# Scrapling MCP Integration

This project integrates [Scrapling](https://github.com/D4Vinci/Scrapling) to provide OpenClaw with powerful web scraping capabilities, including Cloudflare bypass and adaptive parsing.

## Why Scrapling?

OpenClaw already has `web_fetch` and `web_search` tools, but they have limitations in the following scenarios:

| Scenario                 | Existing Tool Limitations | Scrapling Advantages       |
| ------------------------ | ------------------------- | --------------------------- |
| Cloudflare protection    | Cannot bypass             | Automatically solves Turnstile challenges |
| Site structure changes   | Selectors break           | Adaptive element tracking   |
| Requires JS rendering    | Limited support           | Full browser automation     |
| High-protection sites    | Easily blocked            | Browser fingerprint spoofing |

## Features

- **Anti-detection**: Automatically bypasses Cloudflare Turnstile and other anti-bot mechanisms
- **Adaptive parsing**: Element fingerprint tracking, auto-fixes selectors after site redesigns
- **Multiple scraping modes**:
  - `get`: Basic HTTP request (for low/medium protection sites)
  - `fetch`: Playwright browser scraping (requires JS rendering)
  - `stealthy_fetch`: Stealth browser scraping (for high-protection sites)

## Use Cases

1. **Data Collection**: Batch scrape product info, news articles, social media content
2. **Competitor Monitoring**: Regularly monitor competitor website prices and updates
3. **Content Aggregation**: Aggregate content from multiple sources into a knowledge base
4. **Automated Testing**: Verify web page functionality and content display
5. **Bypass Protection**: Access Cloudflare-protected internal systems or public pages

## Comparison

### Before (web_fetch)

```
User: "Get the content of this tweet from x.com"
Result: Cannot access, requires login or blocked
```

### After (scrapling)

```
User: "Use scrapling to get x.com/sitinme/status/2032315717224169723"
Result: ✅ Successfully retrieved full tweet content including text and interaction data
```

## Quick Start

### Automatic Installation

```bash
# Run in the project directory
./scripts/setup-scrapling.sh
```

### Manual Installation

> Scrapling is a Python package, automatically downloaded and installed from [PyPI](https://pypi.org/project/scrapling/) via `pip3 install` - no need to manually clone the GitHub repository.

1. **Install Python Dependencies**:

   ```bash
   pip3 install scrapling mcp curl_cffi browserforge msgspec patchright markdownify
   ```

   This command automatically downloads and installs Scrapling and all dependencies from PyPI.

2. **Install acpx Dependencies**:

   ```bash
   cd extensions/acpx
   pnpm install
   cd ../..
   ```

3. **Configure OpenClaw**:

   Add to `~/.openclaw/openclaw.json`:

   ```json
   {
     "plugins": {
       "entries": {
         "acpx": {
           "enabled": true,
           "config": {
             "mcpServers": {
               "scrapling": {
                 "command": "scrapling",
                 "args": ["mcp"]
               }
             }
           }
         }
       }
     },
     "browser": {
       "profiles": {
         "chrome": {
           "color": "007AFF"
         }
       }
     }
   }
   ```

4. **Restart Gateway**:
   ```bash
   pnpm openclaw gateway run --bind loopback --port 18789 --force
   ```

## Usage

Invoke through natural language in OpenClaw:

```plaintext
"Use scrapling to fetch the content of https://example.com"
"Use scrapling to bypass Cloudflare and scrape https://x.com/..."
"Use scrapling to extract all links from the page"
```

## Available Tools

| Tool                  | Functionality                         | Use Case                       |
| --------------------- | ------------------------------------- | ------------------------------ |
| `get`                 | HTTP request + content extraction     | Low/medium protection sites    |
| `bulk_get`            | Batch HTTP requests                   | Batch scraping                 |
| `fetch`               | Playwright browser scraping           | Requires JS rendering          |
| `bulk_fetch`          | Batch browser scraping                | Batch JS pages                 |
| `stealthy_fetch`      | Stealth browser scraping              | High-protection sites (Cloudflare) |
| `bulk_stealthy_fetch` | Batch stealth scraping                | Batch high-protection sites    |

## Advanced Options

### HTTP Mode

To access the MCP Server via HTTP (instead of stdio), modify the config:

```json
"scrapling": {
  "command": "scrapling",
  "args": ["mcp", "--http", "--port", "8765"]
}
```

### Proxy Configuration

Specify a proxy when calling the tool:

```python
result = await session.call_tool("stealthy_fetch", {
    "url": "https://example.com",
    "proxy": "http://username:password@localhost:8030"
})
```

## Related Links

- [Scrapling GitHub](https://github.com/D4Vinci/Scrapling)
- [Scrapling Documentation](https://scrapling.readthedocs.io/)
- [Scrapling PyPI](https://pypi.org/project/scrapling/)
