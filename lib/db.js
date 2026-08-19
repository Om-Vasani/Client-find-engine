// lib/db.js
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const LOGS_FILE = path.join(DATA_DIR, "logs.json");
const INCOME_FILE = path.join(DATA_DIR, "income.json");

export function ensureFiles() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
  if (!fs.existsSync(LOGS_FILE)) fs.writeFileSync(LOGS_FILE, "[]", "utf8");
  if (!fs.existsSync(INCOME_FILE)) {
    const init = { today: 0, total: 0, wallet: 0, lastReset: Date.now() };
    fs.writeFileSync(INCOME_FILE, JSON.stringify(init, null, 2), "utf8");
  }
}

export function readLogs() {
  try {
    ensureFiles();
    const txt = fs.readFileSync(LOGS_FILE, "utf8");
    return JSON.parse(txt || "[]");
  } catch (e) {
    console.error("readLogs error", e);
    return [];
  }
}

export function writeLogs(logs = []) {
  try {
    ensureFiles();
    fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2), "utf8");
    return true;
  } catch (e) {
    console.error("writeLogs error", e);
    return false;
  }
}

export function readIncome() {
  try {
    ensureFiles();
    const txt = fs.readFileSync(INCOME_FILE, "utf8");
    const data = JSON.parse(txt || "{}");
    return data;
  } catch (e) {
    console.error("readIncome error", e);
    return { today: 0, total: 0, wallet: 0 };
  }
}

export function writeIncome(obj) {
  try {
    ensureFiles();
    fs.writeFileSync(INCOME_FILE, JSON.stringify(obj || {}, null, 2), "utf8");
    return true;
  } catch (e) {
    console.error("writeIncome error", e);
    return false;
  }
        }
