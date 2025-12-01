// lib/db.js (FINAL File System Storage - WARNING: Vercel Data is Ephemeral)
import fs from "fs";
import path from "path";

const LOG_DIR = path.join(process.cwd(), "data");
const LOG_FILE = path.join(LOG_DIR, "sends_logs.json");
const INCOME_FILE = path.join(LOG_DIR, "income.json");
const WITHDRAW_LOG_FILE = path.join(LOG_DIR, "withdraws.json");

export function ensureFiles() {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
    if (!fs.existsSync(LOG_FILE)) fs.writeFileSync(LOG_FILE, "[]");
    if (!fs.existsSync(WITHDRAW_LOG_FILE)) fs.writeFileSync(WITHDRAW_LOG_FILE, "[]");
    if (!fs.existsSync(INCOME_FILE)) fs.writeFileSync(INCOME_FILE, JSON.stringify({
        today: 0,
        total: 0,
        wallet: 0,
        lastResetDate: new Date().toISOString().slice(0,10)
    }, null, 2));
}

// *** મુખ્ય I/O ફંક્શન્સ ***
export function readLogs() {
    ensureFiles();
    try {
        return JSON.parse(fs.readFileSync(LOG_FILE, "utf8") || "[]");
    } catch { return []; }
}
export function writeLogs(logs) {
    ensureFiles();
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
}
export function readIncome() {
    ensureFiles();
    try {
        const raw = JSON.parse(fs.readFileSync(INCOME_FILE, "utf8") || "{}");
        // Reset today if new day
        const todayStr = new Date().toISOString().slice(0,10);
        if (raw.lastResetDate !== todayStr) {
            raw.today = 0;
            raw.lastResetDate = todayStr;
        }
        return raw;
    } catch {
        return { today:0, total:0, wallet:0, lastResetDate: new Date().toISOString().slice(0,10) };
    }
}
export function writeIncome(obj) {
    ensureFiles();
    fs.writeFileSync(INCOME_FILE, JSON.stringify(obj, null, 2));
}
export function readWithdrawLogs() {
    ensureFiles();
    try {
        return JSON.parse(fs.readFileSync(WITHDRAW_LOG_FILE, "utf8") || "[]");
    } catch { return []; }
}
export function writeWithdrawLogs(logs) {
    ensureFiles();
    fs.writeFileSync(WITHDRAW_LOG_FILE, JSON.stringify(logs, null, 2));
}
