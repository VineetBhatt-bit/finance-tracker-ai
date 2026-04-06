const mongoose = require("mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/financeDB")
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.log(err));
  const transactionSchema = new mongoose.Schema({
  desc: String,
  amount: String,
  type: String,
  category: String
});

const Transaction = mongoose.model("Transaction", transactionSchema);
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3001;

app.use(cors());          // ✅ only once
app.use(express.json());

// ✅ ROOT ROUTE
app.get("/", (req, res) => {
  console.log("ROOT HIT");
  res.send("Server is working 🚀");
});

// ✅ GET
app.get("/transactions", async (req, res) => {
  const data = await Transaction.find();
  res.json(data);
});

// ✅ POST
app.get("/transactions", async (req, res) => {
  const data = await Transaction.find();
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});