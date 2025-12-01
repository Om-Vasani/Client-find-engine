// pages/api/withdraw.js
import fs from "fs";
import path from "path";

const LOG_DIR = path.join(process.cwd(), "data");
const LOG_FILE = path.join(LOG_DIR, "withdraws.json");

function ensure() {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
  if (!fs.existsSync(LOG_FILE)) fs.writeFileSync(LOG_FILE, "[]");
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });
    const { amount, upi, name } = req.body;
    if (!amount || !upi) return res.status(400).json({ error: "Amount and UPI required" });

    ensure();
    const raw = fs.readFileSync(LOG_FILE, "utf8");
    const logs = JSON.parse(raw || "[]");

    const entry = {
      id: `wd_${Date.now()}`,
      name: name || "Owner",
      amount: Number(amount),
      upi,
      status: "requested",
      createdAt: new Date().toISOString(),
    };

    logs.push(entry);
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));

    // Note: Real transfer is manual. Admin will perform UPI transfer and update status later.
    return res.json({ status: "ok", message: "Withdraw request saved. Please transfer manually via UPI.", request: entry });
  } catch (err) {
    return res.status(500).json({ error: err.message || err.toString() });
  }
      }
