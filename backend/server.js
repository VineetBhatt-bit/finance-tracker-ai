const express = require("express");

const app = express();
const PORT = 5000;

app.use(express.json());

// Temporary storage (we’ll replace with DB later)
let transactions = [];

// GET all transactions
app.get("/transactions", (req, res) => {
  res.json(transactions);
});

// POST new transaction
app.post("/transactions", (req, res) => {
  const newTransaction = req.body;
  transactions.push(newTransaction);
  res.json({ message: "Transaction added" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});