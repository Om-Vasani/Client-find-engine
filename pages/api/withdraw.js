// pages/api/withdraw.js (FINAL LinkedIn System)
import fs from "fs";
import path from "path";

const LOG_DIR = path.join(process.cwd(), "data");
const WITHDRAW_LOG_FILE = path.join(LOG_DIR, "withdraws.json");
const INCOME_FILE = path.join(LOG_DIR, "income.json"); // Income ફાઇલનો ઉપયોગ કરો

function ensure() {
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
if (!fs.existsSync(WITHDRAW_LOG_FILE)) fs.writeFileSync(WITHDRAW_LOG_FILE, "[]");
// income file existence is handled in generate.js, but check here too
}

function readIncome() {
    // આ ફંક્શન readIncome ને generate.js માંથી કોપી કરો
    // ... (generate.js માંથી readIncome નો લોજિક અહીં) ...
    // આને જનરેટ ફાઇલમાં રહેવા દઈએ અને અહીં માત્ર લખવાનો કોડ રાખીએ
    try {
        return JSON.parse(fs.readFileSync(INCOME_FILE, "utf8"));
    } catch {
        return { wallet: 0 };
    }
}

function writeIncome(obj) {
    fs.writeFileSync(INCOME_FILE, JSON.stringify(obj, null, 2));
}

export default async function handler(req, res) {
try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });
    const { amount, upi, name } = req.body;
    if (!amount || !upi) return res.status(400).json({ error: "Amount and UPI required" });

    ensure(); 
    
    // 1. Wallet Balance ચેક કરો
    const income = readIncome();
    const withdrawAmount = Number(amount);

    if (withdrawAmount <= 0) return res.status(400).json({ error: "Withdraw amount must be positive." });
    if (withdrawAmount > income.wallet) return res.status(400).json({ error: `Insufficient balance. Available: ₹${income.wallet.toLocaleString('en-IN')}` });

    // 2. લોગમાં એન્ટ્રી
    const raw = fs.readFileSync(WITHDRAW_LOG_FILE, "utf8"); 
    const logs = JSON.parse(raw || "[]"); 
    const entry = { 
        id: `wd_${Date.now()}`, 
        name: name || "Owner", 
        amount: withdrawAmount, 
        upi, 
        status: "requested", 
        createdAt: new Date().toISOString(), 
    }; 
    logs.push(entry); 
    fs.writeFileSync(WITHDRAW_LOG_FILE, JSON.stringify(logs, null, 2)); 

    // 3. Wallet માંથી રકમ બાદ કરો
    income.wallet -= withdrawAmount;
    writeIncome(income);

    return res.json({ 
        status: "ok", 
        message: `Withdraw request of ₹${withdrawAmount.toLocaleString('en-IN')} saved. Please transfer manually via UPI.`, 
        request: entry 
    }); 

} catch (err) {
    return res.status(500).json({ error: err.message || err.toString() });
}
}
