// pages/api/withdraw.js (FINAL File System Storage)
import { 
    readWithdrawLogs, writeWithdrawLogs, 
    readIncome, writeIncome 
} from '../lib/db'; 

export default async function handler(req, res) {
    try {
        if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });
        const { amount, upi, name } = req.body;
        if (!amount || !upi) return res.status(400).json({ error: "Amount and UPI required" });

        let income = readIncome(); 
        const withdrawAmount = Number(amount);
        if (withdrawAmount <= 0) return res.status(400).json({ error: "Withdraw amount must be positive." });
        
        // Wallet Check
        if (withdrawAmount > income.wallet) return res.status(400).json({ error: `Insufficient balance. Available: ₹${income.wallet.toLocaleString('en-IN')}` }); 

        // Log the request
        const logs = readWithdrawLogs(); 
        const entry = { id: `wd_${Date.now()}`, name: name || "Owner", amount: withdrawAmount, upi, status: "requested", createdAt: new Date().toISOString() }; 
        logs.push(entry); 
        writeWithdrawLogs(logs); 

        // Update Income
        income.wallet -= withdrawAmount;
        writeIncome(income);
        
        return res.json({ 
            status: "ok", 
            message: `Withdraw request of ₹${withdrawAmount.toLocaleString('en-IN')} saved. Please transfer manually via UPI.`, 
            request: entry,
            income: income // Updated income for UI refresh
        }); 

    } catch (err) {
        return res.status(500).json({ error: "Server Error", details: err.message || err.toString() });
    }
}
