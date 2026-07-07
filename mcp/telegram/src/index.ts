import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import TelegramBot from "node-telegram-bot-api";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TOKEN) {
  console.error("TELEGRAM_BOT_TOKEN environment variable is required");
  process.exit(1);
}

const STATE_PATH = join(homedir(), ".opencode-telegram-state.json");

interface State {
  lastUpdateId: number;
  allowedChatIds: number[];
}

async function loadState(): Promise<State> {
  try {
    if (existsSync(STATE_PATH)) {
      const data = await readFile(STATE_PATH, "utf-8");
      return JSON.parse(data);
    }
  } catch { /* ignore */ }
  return { lastUpdateId: 0, allowedChatIds: [] };
}

async function saveState(state: State): Promise<void> {
  await writeFile(STATE_PATH, JSON.stringify(state, null, 2));
}

const bot = new TelegramBot(TOKEN, { polling: false });
const state = await loadState();

function isAllowed(chatId: number): boolean {
  if (state.allowedChatIds.length === 0) return true;
  return state.allowedChatIds.includes(chatId);
}

const server = new McpServer({
  name: "mcp-telegram",
  version: "1.0.0",
});

server.tool(
  "telegram_send_message",
  { chatId: z.number().describe("Telegram chat ID"), text: z.string().describe("Message text"), parseMode: z.enum(["Markdown", "HTML"]).optional().describe("Parse mode for formatting") },
  async ({ chatId, text, parseMode }) => {
    try {
      const msg = await bot.sendMessage(chatId, text, parseMode ? { parse_mode: parseMode } : {});
      return { content: [{ type: "text", text: JSON.stringify({ ok: true, messageId: msg.message_id, chatId: msg.chat.id }) }] };
    } catch (err) {
      return { content: [{ type: "text", text: JSON.stringify({ ok: false, error: String(err) }) }], isError: true };
    }
  }
);

server.tool(
  "telegram_send_photo",
  { chatId: z.number().describe("Telegram chat ID"), photo: z.string().describe("File path, URL, or base64 data"), caption: z.string().optional().describe("Photo caption") },
  async ({ chatId, photo, caption }) => {
    try {
      const msg = await bot.sendPhoto(chatId, photo, caption ? { caption } : {});
      return { content: [{ type: "text", text: JSON.stringify({ ok: true, messageId: msg.message_id }) }] };
    } catch (err) {
      return { content: [{ type: "text", text: JSON.stringify({ ok: false, error: String(err) }) }], isError: true };
    }
  }
);

server.tool(
  "telegram_send_document",
  { chatId: z.number().describe("Telegram chat ID"), document: z.string().describe("File path, URL, or base64 data"), filename: z.string().optional().describe("Filename"), caption: z.string().optional().describe("Document caption") },
  async ({ chatId, document, filename, caption }) => {
    try {
      const opts: Record<string, unknown> = {};
      if (filename) opts.filename = filename;
      if (caption) opts.caption = caption;
      const msg = await bot.sendDocument(chatId, document, opts as TelegramBot.SendDocumentOptions);
      return { content: [{ type: "text", text: JSON.stringify({ ok: true, messageId: msg.message_id }) }] };
    } catch (err) {
      return { content: [{ type: "text", text: JSON.stringify({ ok: false, error: String(err) }) }], isError: true };
    }
  }
);

server.tool(
  "telegram_get_updates",
  { limit: z.number().min(1).max(100).optional().default(10).describe("Max updates to fetch"), timeout: z.number().optional().default(30).describe("Long polling timeout in seconds") },
  async ({ limit, timeout }) => {
    try {
      const updates = await bot.getUpdates({ offset: state.lastUpdateId + 1, limit, timeout });
      if (updates.length > 0) {
        state.lastUpdateId = updates[updates.length - 1].update_id;
        await saveState(state);
      }
      const messages = updates
        .filter(u => u.message && isAllowed(u.message.chat.id))
        .map(u => ({
          updateId: u.update_id,
          chatId: u.message!.chat.id,
          chatType: u.message!.chat.type,
          from: u.message!.from ? { id: u.message!.from.id, firstName: u.message!.from.first_name, username: u.message!.from.username } : null,
          text: u.message!.text || null,
          caption: u.message!.caption || null,
          date: u.message!.date,
          messageId: u.message!.message_id,
        }));
      return { content: [{ type: "text", text: JSON.stringify({ ok: true, messages }) }] };
    } catch (err) {
      return { content: [{ type: "text", text: JSON.stringify({ ok: false, error: String(err) }) }], isError: true };
    }
  }
);

server.tool(
  "telegram_get_chat",
  { chatId: z.number().describe("Telegram chat ID") },
  async ({ chatId }) => {
    try {
      const chat = await bot.getChat(chatId);
      return { content: [{ type: "text", text: JSON.stringify({ ok: true, chat: { id: chat.id, type: chat.type, title: chat.title, username: chat.username, firstName: chat.first_name, lastName: chat.last_name } }) }] };
    } catch (err) {
      return { content: [{ type: "text", text: JSON.stringify({ ok: false, error: String(err) }) }], isError: true };
    }
  }
);

server.tool(
  "telegram_authorize_chat",
  { chatId: z.number().describe("Telegram chat ID to authorize") },
  async ({ chatId }) => {
    if (!state.allowedChatIds.includes(chatId)) {
      state.allowedChatIds.push(chatId);
      await saveState(state);
    }
    return { content: [{ type: "text", text: JSON.stringify({ ok: true, chatId, message: "Chat authorized" }) }] };
  }
);

server.tool(
  "telegram_list_chats",
  {},
  async () => {
    const chats: { chatId: number; info: string }[] = [];
    for (const chatId of state.allowedChatIds) {
      try {
        const chat = await bot.getChat(chatId);
        chats.push({ chatId, info: chat.title || chat.first_name || String(chatId) });
      } catch {
        chats.push({ chatId, info: "unknown" });
      }
    }
    return { content: [{ type: "text", text: JSON.stringify({ ok: true, chats, isOpenToAll: state.allowedChatIds.length === 0 }) }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
