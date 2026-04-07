const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

const app = express();
const PORT = 3001;
const frontendPath = path.join(__dirname, "..", "frontend");
const DEFAULT_MONTH = new Date().toISOString().slice(0, 7);

mongoose
  .connect("mongodb://127.0.0.1:27017/financeDB")
  .then(() => console.log("MongoDB Connected ✅"))
  .catch((err) => console.log("MongoDB connection failed:", err.message));

const transactionSchema = new mongoose.Schema(
  {
    desc: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: String,
      enum: ["income", "expense"],
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    accountName: {
      type: String,
      default: "primary",
      trim: true,
    },
    counterparty: {
      type: String,
      default: "",
      trim: true,
    },
    paymentMethod: {
      type: String,
      default: "bank",
      trim: true,
    },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    taxCategory: {
      type: String,
      default: "standard",
      trim: true,
    },
    receiptUrl: {
      type: String,
      default: "",
      trim: true,
    },
    sourceSystem: {
      type: String,
      default: "manual",
      trim: true,
    },
    transactionDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
    tags: {
      type: [String],
      default: [],
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    flaggedForReview: {
      type: Boolean,
      default: false,
    },
    auditTrail: {
      type: [
        {
          action: String,
          actor: String,
          at: Date,
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

const budgetSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      trim: true,
    },
    month: {
      type: String,
      required: true,
      trim: true,
    },
    limit: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

budgetSchema.index({ category: 1, month: 1 }, { unique: true });

const Transaction = mongoose.model("Transaction", transactionSchema);
const Budget = mongoose.model("Budget", budgetSchema);

app.use(cors());
app.use(express.json());
app.use(express.static(frontendPath));

function getMonthBounds(month = DEFAULT_MONTH) {
  const [year, rawMonth] = month.split("-").map(Number);

  if (!year || !rawMonth) {
    return null;
  }

  const start = new Date(Date.UTC(year, rawMonth - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, rawMonth, 1, 0, 0, 0, 0));

  return { start, end };
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) {
    return tags
      .map((tag) => String(tag).trim().toLowerCase())
      .filter(Boolean);
  }

  if (typeof tags === "string") {
    return tags
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean);
  }

  return [];
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeTransactionPayload(body) {
  return {
    desc: String(body.desc || "").trim(),
    amount: Number(body.amount),
    type: body.type,
    category: String(body.category || "").trim(),
    accountName: String(body.accountName || "primary").trim(),
    counterparty: String(body.counterparty || "").trim(),
    paymentMethod: String(body.paymentMethod || "bank").trim(),
    approvalStatus: String(body.approvalStatus || "pending").trim(),
    taxCategory: String(body.taxCategory || "standard").trim(),
    receiptUrl: String(body.receiptUrl || "").trim(),
    sourceSystem: String(body.sourceSystem || "manual").trim(),
    transactionDate: body.transactionDate ? new Date(body.transactionDate) : new Date(),
    notes: String(body.notes || "").trim(),
    tags: normalizeTags(body.tags),
    isRecurring: Boolean(body.isRecurring),
    flaggedForReview: Boolean(body.flaggedForReview),
  };
}

function validateTransactionPayload(payload) {
  if (!payload.desc) {
    return "Description is required.";
  }

  if (!Number.isFinite(payload.amount) || payload.amount < 0) {
    return "Amount must be a valid positive number.";
  }

  if (!["income", "expense"].includes(payload.type)) {
    return "Type must be income or expense.";
  }

  if (!payload.category) {
    return "Category is required.";
  }

  if (!["pending", "approved", "rejected"].includes(payload.approvalStatus)) {
    return "Approval status must be pending, approved, or rejected.";
  }

  if (Number.isNaN(payload.transactionDate.getTime())) {
    return "Transaction date is invalid.";
  }

  if (payload.receiptUrl && !/^https?:\/\//i.test(payload.receiptUrl)) {
    return "Receipt URL must start with http:// or https://";
  }

  return null;
}

function buildTransactionFilters(query) {
  const filters = {};

  if (query.type && query.type !== "all") {
    filters.type = query.type;
  }

  if (query.category && query.category !== "all") {
    filters.category = query.category;
  }

  if (query.approvalStatus && query.approvalStatus !== "all") {
    filters.approvalStatus = query.approvalStatus;
  }

  if (query.startDate || query.endDate) {
    filters.transactionDate = {};

    if (query.startDate) {
      filters.transactionDate.$gte = new Date(query.startDate);
    }

    if (query.endDate) {
      const inclusiveEndDate = new Date(query.endDate);
      inclusiveEndDate.setHours(23, 59, 59, 999);
      filters.transactionDate.$lte = inclusiveEndDate;
    }
  }

  if (query.q) {
    const searchRegex = new RegExp(escapeRegex(query.q.trim()), "i");
    filters.$or = [
      { desc: searchRegex },
      { notes: searchRegex },
      { category: searchRegex },
      { accountName: searchRegex },
      { counterparty: searchRegex },
      { paymentMethod: searchRegex },
      { taxCategory: searchRegex },
      { sourceSystem: searchRegex },
      { tags: searchRegex },
    ];
  }

  return filters;
}

function buildSortOptions(query) {
  const allowedFields = new Set(["transactionDate", "amount", "category", "createdAt", "approvalStatus"]);
  const sortBy = allowedFields.has(query.sortBy) ? query.sortBy : "transactionDate";
  const direction = query.sortDir === "asc" ? 1 : -1;

  return { [sortBy]: direction, createdAt: -1 };
}

function calculateDashboardMetrics(transactions, budgets) {
  let income = 0;
  let expense = 0;
  let recurringCount = 0;
  let pendingApprovalCount = 0;
  let flaggedCount = 0;
  let approvedExpense = 0;

  const categoryMap = new Map();
  const monthlyTrendMap = new Map();

  transactions.forEach((transaction) => {
    const amount = Number(transaction.amount) || 0;
    const monthKey = new Date(transaction.transactionDate).toISOString().slice(0, 7);

    if (transaction.type === "income") {
      income += amount;
    } else {
      expense += amount;
      const currentCategory = categoryMap.get(transaction.category) || 0;
      categoryMap.set(transaction.category, currentCategory + amount);

      if (transaction.approvalStatus === "approved") {
        approvedExpense += amount;
      }
    }

    if (transaction.isRecurring) {
      recurringCount += 1;
    }

    if (transaction.approvalStatus === "pending") {
      pendingApprovalCount += 1;
    }

    if (transaction.flaggedForReview) {
      flaggedCount += 1;
    }

    const trendEntry = monthlyTrendMap.get(monthKey) || { income: 0, expense: 0 };
    trendEntry[transaction.type] += amount;
    monthlyTrendMap.set(monthKey, trendEntry);
  });

  const balance = income - expense;
  const savingsRate = income > 0 ? (balance / income) * 100 : 0;
  const avgExpense = transactions.length ? expense / Math.max(1, transactions.filter((item) => item.type === "expense").length) : 0;

  const categoryBreakdown = [...categoryMap.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((left, right) => right.total - left.total);

  const trend = [...monthlyTrendMap.entries()]
    .sort((left, right) => left[0].localeCompare(right[0]))
    .slice(-6)
    .map(([month, values]) => ({
      month,
      income: values.income,
      expense: values.expense,
      balance: values.income - values.expense,
    }));

  const budgetProgress = budgets
    .map((budget) => {
      const spent = categoryBreakdown.find((item) => item.category === budget.category)?.total || 0;
      const remaining = budget.limit - spent;
      const ratio = budget.limit > 0 ? spent / budget.limit : 0;

      return {
        category: budget.category,
        month: budget.month,
        limit: budget.limit,
        spent,
        remaining,
        ratio,
        status: ratio >= 1 ? "over" : ratio >= 0.8 ? "warning" : "healthy",
      };
    })
    .sort((left, right) => right.ratio - left.ratio);

  const topCategory = categoryBreakdown[0]?.category || "No spend yet";

  return {
    summary: {
      income,
      expense,
      balance,
      savingsRate,
      avgExpense,
      transactionCount: transactions.length,
      recurringCount,
      topCategory,
      pendingApprovalCount,
      flaggedCount,
      approvedExpense,
    },
    categoryBreakdown,
    trend,
    budgetProgress,
    recentTransactions: transactions.slice(0, 5),
  };
}

app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.get("/transactions", async (req, res) => {
  try {
    const filters = buildTransactionFilters(req.query);
    const sort = buildSortOptions(req.query);
    const data = await Transaction.find(filters).sort(sort);

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

app.post("/transactions", async (req, res) => {
  try {
    const payload = normalizeTransactionPayload(req.body);
    const validationError = validateTransactionPayload(payload);

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const transaction = await Transaction.create(payload);
    transaction.auditTrail = [
      {
        action: "created",
        actor: "system",
        at: new Date(),
      },
    ];
    await transaction.save();
    res.status(201).json(transaction);
  } catch (error) {
    res.status(400).json({ error: "Failed to create transaction" });
  }
});

app.put("/transactions/:id", async (req, res) => {
  try {
    const payload = normalizeTransactionPayload(req.body);
    const validationError = validateTransactionPayload(payload);

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const existingTransaction = await Transaction.findById(req.params.id);

    if (!existingTransaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    Object.assign(existingTransaction, payload);
    existingTransaction.auditTrail.push({
      action: "updated",
      actor: "system",
      at: new Date(),
    });

    const transaction = await existingTransaction.save();

    res.json(transaction);
  } catch (error) {
    res.status(400).json({ error: "Failed to update transaction" });
  }
});

app.delete("/transactions/:id", async (req, res) => {
  try {
    const deletedTransaction = await Transaction.findByIdAndDelete(req.params.id);

    if (!deletedTransaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.json({ message: "Transaction deleted" });
  } catch (error) {
    res.status(400).json({ error: "Failed to delete transaction" });
  }
});

app.get("/budgets", async (req, res) => {
  try {
    const month = req.query.month || DEFAULT_MONTH;
    const monthBounds = getMonthBounds(month);

    if (!monthBounds) {
      return res.status(400).json({ error: "Month must use YYYY-MM format" });
    }

    const [budgets, expenseTransactions] = await Promise.all([
      Budget.find({ month }).sort({ category: 1 }),
      Transaction.find({
        type: "expense",
        transactionDate: {
          $gte: monthBounds.start,
          $lt: monthBounds.end,
        },
      }),
    ]);

    const spentByCategory = expenseTransactions.reduce((accumulator, transaction) => {
      const currentSpent = accumulator[transaction.category] || 0;
      accumulator[transaction.category] = currentSpent + Number(transaction.amount || 0);
      return accumulator;
    }, {});

    const budgetProgress = budgets.map((budget) => {
      const spent = spentByCategory[budget.category] || 0;
      const remaining = budget.limit - spent;

      return {
        _id: budget._id,
        category: budget.category,
        month: budget.month,
        limit: budget.limit,
        spent,
        remaining,
        ratio: budget.limit > 0 ? spent / budget.limit : 0,
      };
    });

    res.json(budgetProgress);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch budgets" });
  }
});

app.put("/budgets/:category", async (req, res) => {
  try {
    const category = String(req.params.category || "").trim();
    const month = String(req.body.month || DEFAULT_MONTH).trim();
    const limit = Number(req.body.limit);

    if (!category) {
      return res.status(400).json({ error: "Category is required" });
    }

    if (!month.match(/^\d{4}-\d{2}$/)) {
      return res.status(400).json({ error: "Month must use YYYY-MM format" });
    }

    if (!Number.isFinite(limit) || limit < 0) {
      return res.status(400).json({ error: "Budget limit must be a valid positive number" });
    }

    const budget = await Budget.findOneAndUpdate(
      { category, month },
      { category, month, limit },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    res.json(budget);
  } catch (error) {
    res.status(400).json({ error: "Failed to save budget" });
  }
});

app.get("/dashboard", async (req, res) => {
  try {
    const month = req.query.month || DEFAULT_MONTH;
    const monthBounds = getMonthBounds(month);

    if (!monthBounds) {
      return res.status(400).json({ error: "Month must use YYYY-MM format" });
    }

    const trendStart = new Date(monthBounds.start);
    trendStart.setUTCMonth(trendStart.getUTCMonth() - 5);

    const [monthTransactions, budgets] = await Promise.all([
      Transaction.find({
        transactionDate: {
          $gte: monthBounds.start,
          $lt: monthBounds.end,
        },
      }).sort({ transactionDate: -1, createdAt: -1 }),
      Budget.find({ month }).sort({ category: 1 }),
    ]);

    const trendTransactions = await Transaction.find({
      transactionDate: {
        $gte: trendStart,
        $lt: monthBounds.end,
      },
    }).sort({ transactionDate: 1, createdAt: 1 });

    const dashboard = calculateDashboardMetrics(monthTransactions, budgets);
    dashboard.trend = calculateDashboardMetrics(trendTransactions, []).trend;

    res.json({
      month,
      ...dashboard,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to load dashboard" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
