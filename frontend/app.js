const state = {
  transactions: [],
  budgets: [],
  dashboard: null,
  selectedMonth: new Date().toISOString().slice(0, 7),
  editingId: null,
  filters: {
    q: "",
    type: "all",
    category: "all",
    approvalStatus: "all",
    sortBy: "transactionDate",
    sortDir: "desc",
    startDate: "",
    endDate: "",
  },
};

const elements = {
  status: document.getElementById("status"),
  monthPicker: document.getElementById("month-picker"),
  balance: document.getElementById("balance"),
  income: document.getElementById("income"),
  expense: document.getElementById("expense"),
  savingsRate: document.getElementById("savings-rate"),
  pendingApprovals: document.getElementById("pending-approvals"),
  flaggedCount: document.getElementById("flagged-count"),
  transactionCount: document.getElementById("transaction-count"),
  recurringCount: document.getElementById("recurring-count"),
  avgExpense: document.getElementById("avg-expense"),
  topCategory: document.getElementById("top-category"),
  approvedExpense: document.getElementById("approved-expense"),
  reviewCount: document.getElementById("review-count"),
  categoryBreakdown: document.getElementById("category-breakdown"),
  trendList: document.getElementById("trend-list"),
  insightList: document.getElementById("insight-list"),
  budgetList: document.getElementById("budget-list"),
  transactionList: document.getElementById("transaction-list"),
  transactionForm: document.getElementById("finance-form"),
  budgetForm: document.getElementById("budget-form"),
  formTitle: document.getElementById("form-title"),
  cancelEdit: document.getElementById("cancel-edit"),
  submitButton: document.getElementById("submit-button"),
  transactionId: document.getElementById("transaction-id"),
  desc: document.getElementById("desc"),
  amount: document.getElementById("amount"),
  type: document.getElementById("type"),
  category: document.getElementById("category"),
  accountName: document.getElementById("account-name"),
  counterparty: document.getElementById("counterparty"),
  paymentMethod: document.getElementById("payment-method"),
  approvalStatus: document.getElementById("approval-status"),
  taxCategory: document.getElementById("tax-category"),
  receiptUrl: document.getElementById("receipt-url"),
  sourceSystem: document.getElementById("source-system"),
  transactionDate: document.getElementById("transaction-date"),
  tags: document.getElementById("tags"),
  isRecurring: document.getElementById("is-recurring"),
  flaggedForReview: document.getElementById("flagged-for-review"),
  notes: document.getElementById("notes"),
  budgetCategory: document.getElementById("budget-category"),
  budgetLimit: document.getElementById("budget-limit"),
  search: document.getElementById("search"),
  filter: document.getElementById("filter"),
  categoryFilter: document.getElementById("category-filter"),
  approvalFilter: document.getElementById("approval-filter"),
  sortBy: document.getElementById("sort-by"),
  sortDir: document.getElementById("sort-dir"),
  startDate: document.getElementById("start-date"),
  endDate: document.getElementById("end-date"),
  clearFilters: document.getElementById("clear-filters"),
};

elements.monthPicker.value = state.selectedMonth;
elements.transactionDate.value = new Date().toISOString().slice(0, 10);

function setStatus(message, type = "") {
  elements.status.textContent = message;
  elements.status.className = type ? `status ${type}` : "status";
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatPercent(value) {
  return `${(Number(value) || 0).toFixed(1)}%`;
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let errorMessage = "Request failed";

    try {
      const payload = await response.json();
      errorMessage = payload.error || errorMessage;
    } catch (error) {
      errorMessage = response.statusText || errorMessage;
    }

    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function buildTransactionQuery() {
  const query = new URLSearchParams();

  Object.entries(state.filters).forEach(([key, value]) => {
    if (value) {
      query.set(key, value);
    }
  });

  return query.toString();
}

function resetTransactionForm() {
  state.editingId = null;
  elements.transactionForm.reset();
  elements.transactionId.value = "";
  elements.transactionDate.value = new Date().toISOString().slice(0, 10);
  elements.formTitle.textContent = "Add transaction";
  elements.submitButton.textContent = "Save transaction";
  elements.cancelEdit.classList.add("hidden");
}

function getTransactionPayload() {
  return {
    desc: elements.desc.value.trim(),
    amount: Number(elements.amount.value),
    type: elements.type.value,
    category: elements.category.value,
    accountName: elements.accountName.value.trim(),
    counterparty: elements.counterparty.value.trim(),
    paymentMethod: elements.paymentMethod.value,
    approvalStatus: elements.approvalStatus.value,
    taxCategory: elements.taxCategory.value,
    receiptUrl: elements.receiptUrl.value.trim(),
    sourceSystem: elements.sourceSystem.value,
    transactionDate: elements.transactionDate.value,
    tags: elements.tags.value,
    isRecurring: elements.isRecurring.checked,
    flaggedForReview: elements.flaggedForReview.checked,
    notes: elements.notes.value.trim(),
  };
}

function populateTransactionForm(transaction) {
  state.editingId = transaction._id;
  elements.transactionId.value = transaction._id;
  elements.desc.value = transaction.desc || "";
  elements.amount.value = transaction.amount || "";
  elements.type.value = transaction.type || "expense";
  elements.category.value = transaction.category || "other";
  elements.accountName.value = transaction.accountName || "";
  elements.counterparty.value = transaction.counterparty || "";
  elements.paymentMethod.value = transaction.paymentMethod || "bank";
  elements.approvalStatus.value = transaction.approvalStatus || "pending";
  elements.taxCategory.value = transaction.taxCategory || "standard";
  elements.receiptUrl.value = transaction.receiptUrl || "";
  elements.sourceSystem.value = transaction.sourceSystem || "manual";
  elements.transactionDate.value = transaction.transactionDate
    ? new Date(transaction.transactionDate).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  elements.tags.value = Array.isArray(transaction.tags) ? transaction.tags.join(", ") : "";
  elements.isRecurring.checked = Boolean(transaction.isRecurring);
  elements.flaggedForReview.checked = Boolean(transaction.flaggedForReview);
  elements.notes.value = transaction.notes || "";
  elements.formTitle.textContent = "Edit transaction";
  elements.submitButton.textContent = "Update transaction";
  elements.cancelEdit.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderDashboard() {
  const summary = state.dashboard?.summary || {};

  elements.balance.textContent = formatCurrency(summary.balance);
  elements.income.textContent = formatCurrency(summary.income);
  elements.expense.textContent = formatCurrency(summary.expense);
  elements.savingsRate.textContent = formatPercent(summary.savingsRate);
  elements.pendingApprovals.textContent = String(summary.pendingApprovalCount || 0);
  elements.flaggedCount.textContent = String(summary.flaggedCount || 0);
  elements.transactionCount.textContent = String(summary.transactionCount || 0);
  elements.recurringCount.textContent = String(summary.recurringCount || 0);
  elements.avgExpense.textContent = formatCurrency(summary.avgExpense);
  elements.topCategory.textContent = summary.topCategory || "-";
  elements.approvedExpense.textContent = formatCurrency(summary.approvedExpense);
  elements.reviewCount.textContent = String(summary.flaggedCount || 0);

  renderCategoryBreakdown();
  renderTrend();
  renderInsights();
}

function renderCategoryBreakdown() {
  const items = state.dashboard?.categoryBreakdown || [];
  const maxValue = items[0]?.total || 0;

  if (!items.length) {
    elements.categoryBreakdown.innerHTML = '<div class="empty-state">No expense categories yet for this month.</div>';
    return;
  }

  elements.categoryBreakdown.innerHTML = items
    .map((item) => {
      const width = maxValue ? Math.max(8, (item.total / maxValue) * 100) : 0;

      return `
        <article class="breakdown-item">
          <div class="breakdown-row">
            <strong>${escapeHtml(item.category)}</strong>
            <span>${formatCurrency(item.total)}</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="width: ${width}%"></div>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderTrend() {
  const items = state.dashboard?.trend || [];

  if (!items.length) {
    elements.trendList.innerHTML = '<div class="empty-state">Monthly trend will appear once you have transaction history.</div>';
    return;
  }

  elements.trendList.innerHTML = items
    .map(
      (item) => `
        <article class="trend-item">
          <div class="trend-row">
            <strong>${escapeHtml(item.month)}</strong>
            <span>${formatCurrency(item.balance)}</span>
          </div>
          <div class="transaction-meta">
            <span>Income ${formatCurrency(item.income)}</span>
            <span>Expense ${formatCurrency(item.expense)}</span>
          </div>
        </article>
      `
    )
    .join("");
}

function buildInsights() {
  const summary = state.dashboard?.summary || {};
  const budgets = state.dashboard?.budgetProgress || [];
  const topCategory = state.dashboard?.categoryBreakdown?.[0];
  const insights = [];

  if ((summary.savingsRate || 0) < 20 && (summary.income || 0) > 0) {
    insights.push(`Savings rate is ${formatPercent(summary.savingsRate)}. Aim for 20% or more if you want a healthier monthly buffer.`);
  }

  if (topCategory) {
    insights.push(`${topCategory.category} is your biggest spending category this month at ${formatCurrency(topCategory.total)}.`);
  }

  const stressedBudget = budgets.find((item) => item.ratio >= 1);
  if (stressedBudget) {
    insights.push(`Budget alert: ${stressedBudget.category} is over budget by ${formatCurrency(Math.abs(stressedBudget.remaining))}.`);
  }

  const warningBudget = budgets.find((item) => item.ratio >= 0.8 && item.ratio < 1);
  if (warningBudget) {
    insights.push(`${warningBudget.category} has used ${formatPercent(warningBudget.ratio * 100)} of its budget. It may need attention soon.`);
  }

  if ((summary.recurringCount || 0) > 0) {
    insights.push(`${summary.recurringCount} recurring transaction(s) were logged this month. Review them regularly to keep fixed costs under control.`);
  }

  if (!insights.length) {
    insights.push("The dashboard is healthy right now. Add more data or budgets to unlock deeper guidance.");
  }

  return insights.slice(0, 4);
}

function renderInsights() {
  elements.insightList.innerHTML = buildInsights()
    .map((insight) => `<article class="insight-item">${escapeHtml(insight)}</article>`)
    .join("");
}

function renderBudgets() {
  if (!state.budgets.length) {
    elements.budgetList.innerHTML = '<div class="empty-state">No budgets saved for this month yet.</div>';
    return;
  }

  elements.budgetList.innerHTML = state.budgets
    .map((budget) => {
      const ratioPercent = Math.min(100, Math.max(0, budget.ratio * 100));
      const statusClass = budget.ratio >= 1 ? "over" : budget.ratio >= 0.8 ? "warning" : "healthy";

      return `
        <article class="budget-item ${statusClass}">
          <div class="budget-meta">
            <strong>${escapeHtml(budget.category)}</strong>
            <span>${formatCurrency(budget.spent)} / ${formatCurrency(budget.limit)}</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="width: ${ratioPercent}%"></div>
          </div>
          <div class="transaction-meta">
            <span>${escapeHtml(budget.month)}</span>
            <span>Remaining ${formatCurrency(budget.remaining)}</span>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderTransactions() {
  if (!state.transactions.length) {
    elements.transactionList.innerHTML = '<div class="empty-state">No transactions match the current filters.</div>';
    return;
  }

  elements.transactionList.innerHTML = state.transactions
    .map((transaction) => {
      const tags = Array.isArray(transaction.tags) ? transaction.tags : [];
      const amountClass = transaction.type === "expense" ? "pill expense" : "pill";

      return `
        <article class="transaction-card" data-id="${escapeHtml(transaction._id)}">
          <div class="transaction-top">
            <div>
              <strong>${escapeHtml(transaction.desc)}</strong>
              <div class="transaction-meta">
                <span>${escapeHtml(transaction.category)}</span>
                <span>${escapeHtml(transaction.accountName || "primary")}</span>
                ${transaction.counterparty ? `<span>${escapeHtml(transaction.counterparty)}</span>` : ""}
                <span>${escapeHtml(transaction.paymentMethod || "bank")}</span>
                <span>${formatDate(transaction.transactionDate)}</span>
              </div>
            </div>
            <span class="amount">${formatCurrency(transaction.amount)}</span>
          </div>

          <div class="pill-row">
            <span class="${amountClass}">${escapeHtml(transaction.type)}</span>
            <span class="pill tag">${escapeHtml(transaction.approvalStatus || "pending")}</span>
            <span class="pill tag">${escapeHtml(transaction.taxCategory || "standard")}</span>
            <span class="pill tag">${escapeHtml(transaction.sourceSystem || "manual")}</span>
            ${transaction.isRecurring ? '<span class="pill">Recurring</span>' : ""}
            ${transaction.flaggedForReview ? '<span class="pill expense">Needs review</span>' : ""}
            ${tags.map((tag) => `<span class="pill tag">${escapeHtml(tag)}</span>`).join("")}
          </div>

          ${transaction.receiptUrl ? `<p class="transaction-notes">Receipt: <a href="${escapeHtml(transaction.receiptUrl)}" target="_blank" rel="noreferrer">Open document</a></p>` : ""}
          ${transaction.notes ? `<p class="transaction-notes">${escapeHtml(transaction.notes)}</p>` : ""}
          <p class="transaction-notes">Audit trail entries: ${Array.isArray(transaction.auditTrail) ? transaction.auditTrail.length : 0}</p>

          <div class="transaction-actions">
            <button type="button" data-action="edit">Edit</button>
            <button type="button" data-action="delete" class="delete-button">Delete</button>
          </div>
        </article>
      `;
    })
    .join("");
}

async function loadTransactions() {
  const query = buildTransactionQuery();
  const path = query ? `/transactions?${query}` : "/transactions";
  state.transactions = await api(path);
  renderTransactions();
}

async function loadDashboard() {
  state.dashboard = await api(`/dashboard?month=${encodeURIComponent(state.selectedMonth)}`);
  renderDashboard();
}

async function loadBudgets() {
  state.budgets = await api(`/budgets?month=${encodeURIComponent(state.selectedMonth)}`);
  renderBudgets();
}

async function refreshAll(statusMessage = "Refreshing finance dashboard...") {
  setStatus(statusMessage);

  try {
    await Promise.all([loadTransactions(), loadDashboard(), loadBudgets()]);
    setStatus("Dashboard is up to date.", "success");
  } catch (error) {
    setStatus(error.message || "Unable to refresh data right now.", "error");
  }
}

async function handleTransactionSubmit(event) {
  event.preventDefault();

  try {
    const payload = getTransactionPayload();
    const isEditing = Boolean(state.editingId);
    const method = state.editingId ? "PUT" : "POST";
    const path = state.editingId ? `/transactions/${state.editingId}` : "/transactions";

    setStatus(isEditing ? "Updating transaction..." : "Saving transaction...");

    await api(path, {
      method,
      body: JSON.stringify(payload),
    });

    resetTransactionForm();
    await refreshAll(isEditing ? "Transaction updated." : "Transaction saved.");
  } catch (error) {
    setStatus(error.message || "Unable to save transaction.", "error");
  }
}

async function handleBudgetSubmit(event) {
  event.preventDefault();

  try {
    setStatus("Saving budget...");

    await api(`/budgets/${encodeURIComponent(elements.budgetCategory.value)}`, {
      method: "PUT",
      body: JSON.stringify({
        month: state.selectedMonth,
        limit: Number(elements.budgetLimit.value),
      }),
    });

    elements.budgetForm.reset();
    await Promise.all([loadBudgets(), loadDashboard()]);
    setStatus("Budget saved.", "success");
  } catch (error) {
    setStatus(error.message || "Unable to save budget.", "error");
  }
}

async function handleTransactionListClick(event) {
  const button = event.target.closest("button[data-action]");

  if (!button) {
    return;
  }

  const card = event.target.closest(".transaction-card");
  const transactionId = card?.dataset.id;
  const transaction = state.transactions.find((item) => item._id === transactionId);

  if (!transaction) {
    return;
  }

  if (button.dataset.action === "edit") {
    populateTransactionForm(transaction);
    return;
  }

  if (button.dataset.action === "delete") {
    try {
      setStatus("Deleting transaction...");
      await api(`/transactions/${transactionId}`, { method: "DELETE" });
      await refreshAll("Transaction deleted.");
    } catch (error) {
      setStatus(error.message || "Unable to delete transaction.", "error");
    }
  }
}

function updateFiltersFromInputs() {
  state.filters.q = elements.search.value.trim();
  state.filters.type = elements.filter.value;
  state.filters.category = elements.categoryFilter.value;
  state.filters.approvalStatus = elements.approvalFilter.value;
  state.filters.sortBy = elements.sortBy.value;
  state.filters.sortDir = elements.sortDir.value;
  state.filters.startDate = elements.startDate.value;
  state.filters.endDate = elements.endDate.value;
}

async function handleFilterChange() {
  updateFiltersFromInputs();

  try {
    setStatus("Applying filters...");
    await loadTransactions();
    setStatus("Transactions filtered.", "success");
  } catch (error) {
    setStatus(error.message || "Unable to apply filters.", "error");
  }
}

function clearFilters() {
  state.filters = {
    q: "",
    type: "all",
    category: "all",
    approvalStatus: "all",
    sortBy: "transactionDate",
    sortDir: "desc",
    startDate: "",
    endDate: "",
  };

  elements.search.value = "";
  elements.filter.value = "all";
  elements.categoryFilter.value = "all";
  elements.approvalFilter.value = "all";
  elements.sortBy.value = "transactionDate";
  elements.sortDir.value = "desc";
  elements.startDate.value = "";
  elements.endDate.value = "";
}

elements.transactionForm.addEventListener("submit", handleTransactionSubmit);
elements.budgetForm.addEventListener("submit", handleBudgetSubmit);
elements.transactionList.addEventListener("click", handleTransactionListClick);
elements.cancelEdit.addEventListener("click", resetTransactionForm);
elements.clearFilters.addEventListener("click", async () => {
  clearFilters();
  await handleFilterChange();
});
elements.monthPicker.addEventListener("change", async () => {
  state.selectedMonth = elements.monthPicker.value;
  await refreshAll("Loading selected month...");
});

[
  elements.search,
  elements.filter,
  elements.categoryFilter,
  elements.approvalFilter,
  elements.sortBy,
  elements.sortDir,
  elements.startDate,
  elements.endDate,
].forEach((element) => {
  element.addEventListener("change", handleFilterChange);
  if (element === elements.search) {
    element.addEventListener("input", handleFilterChange);
  }
});

resetTransactionForm();
refreshAll();
