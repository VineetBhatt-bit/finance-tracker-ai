import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar as NativeStatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { API_BASE_URL, API_SETUP_NOTE } from "./src/config";

const monthKey = new Date().toISOString().slice(0, 7);
const dateKey = new Date().toISOString().slice(0, 10);

const baseForm = {
  desc: "",
  amount: "",
  type: "expense",
  category: "food",
  accountName: "primary",
  counterparty: "",
  paymentMethod: "bank",
  approvalStatus: "pending",
  taxCategory: "standard",
  receiptUrl: "",
  sourceSystem: "manual",
  transactionDate: dateKey,
  tags: "",
  isRecurring: false,
  flaggedForReview: false,
  notes: "",
};

const budgetFormBase = {
  category: "food",
  limit: "",
};

const typeOptions = ["expense", "income"];
const categoryOptions = [
  "salary",
  "freelance",
  "food",
  "travel",
  "shopping",
  "housing",
  "utilities",
  "health",
  "entertainment",
  "investment",
  "education",
  "other",
];
const approvalOptions = ["pending", "approved", "rejected"];
const paymentOptions = ["bank", "credit-card", "debit-card", "cash", "upi", "wallet"];
const taxOptions = ["standard", "tax-deductible", "gst-input", "zero-rated", "non-taxable"];
const sourceOptions = ["manual", "bank-feed", "erp-import", "card-sync", "api"];

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatPercent(value) {
  return `${(Number(value) || 0).toFixed(1)}%`;
}

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let message = "Request failed";

    try {
      const payload = await response.json();
      message = payload.error || message;
    } catch (error) {
      message = response.statusText || message;
    }

    throw new Error(message);
  }

  return response.json();
}

function TabButton({ label, icon, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.tabButton, active && styles.tabButtonActive]}>
      <MaterialCommunityIcons
        name={icon}
        size={18}
        color={active ? "#04131f" : "#dbeafe"}
      />
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

function MetricCard({ label, value, accent, icon }) {
  return (
    <View style={styles.metricCard}>
      <View style={[styles.metricIconWrap, { backgroundColor: accent }]}>
        <MaterialCommunityIcons name={icon} size={18} color="#03111d" />
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function SectionHeader({ eyebrow, title, actionLabel, onPress }) {
  return (
    <View style={styles.sectionHeader}>
      <View>
        <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {actionLabel ? (
        <Pressable onPress={onPress} style={styles.sectionAction}>
          <Text style={styles.sectionActionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function InsightCard({ icon, text }) {
  return (
    <View style={styles.insightCard}>
      <MaterialCommunityIcons name={icon} size={20} color="#7dd3fc" />
      <Text style={styles.insightText}>{text}</Text>
    </View>
  );
}

function BudgetCard({ item }) {
  const width = `${Math.min(100, Math.max(6, (item.ratio || 0) * 100))}%`;
  const barStyle =
    item.ratio >= 1
      ? styles.barOver
      : item.ratio >= 0.8
        ? styles.barWarning
        : styles.barHealthy;

  return (
    <View style={styles.surfaceCard}>
      <View style={styles.rowBetween}>
        <Text style={styles.surfaceTitle}>{item.category}</Text>
        <Text style={styles.surfaceValue}>{formatCurrency(item.limit)}</Text>
      </View>
      <Text style={styles.mutedText}>
        Spent {formatCurrency(item.spent)} • Remaining {formatCurrency(item.remaining)}
      </Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, barStyle, { width }]} />
      </View>
    </View>
  );
}

function TransactionCard({ item, onEdit, onDelete }) {
  const badgeTone =
    item.approvalStatus === "approved"
      ? styles.badgeApproved
      : item.approvalStatus === "rejected"
        ? styles.badgeRejected
        : styles.badgePending;

  return (
    <View style={styles.transactionCard}>
      <View style={styles.rowBetween}>
        <View style={styles.transactionTitleWrap}>
          <Text style={styles.transactionTitle}>{item.desc}</Text>
          <Text style={styles.transactionMeta}>
            {item.category} • {item.accountName || "primary"} • {item.counterparty || "No counterparty"}
          </Text>
        </View>
        <Text style={styles.transactionAmount}>{formatCurrency(item.amount)}</Text>
      </View>

      <View style={styles.pillRow}>
        <View style={[styles.badge, badgeTone]}>
          <Text style={styles.badgeText}>{item.approvalStatus}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.type}</Text>
        </View>
        {item.flaggedForReview ? (
          <View style={[styles.badge, styles.badgeRejected]}>
            <Text style={styles.badgeText}>review</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.transactionMeta}>
        {item.paymentMethod} • {item.taxCategory} • {item.sourceSystem}
      </Text>
      {item.notes ? <Text style={styles.notesText}>{item.notes}</Text> : null}

      <View style={styles.rowBetween}>
        <Text style={styles.auditText}>
          Audit entries: {Array.isArray(item.auditTrail) ? item.auditTrail.length : 0}
        </Text>
        <View style={styles.actionRow}>
          <Pressable onPress={onEdit} style={styles.smallButton}>
            <Text style={styles.smallButtonText}>Edit</Text>
          </Pressable>
          <Pressable onPress={onDelete} style={[styles.smallButton, styles.smallDanger]}>
            <Text style={styles.smallButtonText}>Delete</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function Input({ label, value, onChangeText, placeholder, keyboardType = "default", multiline = false }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#7c93ae"
        keyboardType={keyboardType}
        multiline={multiline}
        style={[styles.input, multiline && styles.textArea]}
      />
    </View>
  );
}

function ChipSelect({ label, options, value, onChange }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroller}>
        {options.map((option) => (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            style={[styles.optionChip, value === option && styles.optionChipActive]}
          >
            <Text style={[styles.optionChipText, value === option && styles.optionChipTextActive]}>
              {option}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [status, setStatus] = useState(API_SETUP_NOTE);
  const [month, setMonth] = useState(monthKey);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [form, setForm] = useState(baseForm);
  const [budgetForm, setBudgetForm] = useState(budgetFormBase);
  const [editingId, setEditingId] = useState(null);

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(18)).current;
  const pulse = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.96,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fade, slide, pulse]);

  useEffect(() => {
    refreshAll(true);
  }, [month]);

  async function refreshAll(isInitial = false) {
    try {
      if (isInitial) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const [transactionData, budgetData, dashboardData] = await Promise.all([
        api("/transactions?sortBy=transactionDate&sortDir=desc"),
        api(`/budgets?month=${encodeURIComponent(month)}`),
        api(`/dashboard?month=${encodeURIComponent(month)}`),
      ]);

      setTransactions(transactionData);
      setBudgets(budgetData);
      setDashboard(dashboardData);
      setStatus("Mobile dashboard synced with your finance backend.");
    } catch (error) {
      setStatus(error.message || API_SETUP_NOTE);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm({
      ...baseForm,
      transactionDate: dateKey,
    });
    setShowTransactionModal(true);
  }

  function openEdit(item) {
    setEditingId(item._id);
    setForm({
      desc: item.desc || "",
      amount: String(item.amount || ""),
      type: item.type || "expense",
      category: item.category || "food",
      accountName: item.accountName || "primary",
      counterparty: item.counterparty || "",
      paymentMethod: item.paymentMethod || "bank",
      approvalStatus: item.approvalStatus || "pending",
      taxCategory: item.taxCategory || "standard",
      receiptUrl: item.receiptUrl || "",
      sourceSystem: item.sourceSystem || "manual",
      transactionDate: item.transactionDate ? new Date(item.transactionDate).toISOString().slice(0, 10) : dateKey,
      tags: Array.isArray(item.tags) ? item.tags.join(", ") : "",
      isRecurring: Boolean(item.isRecurring),
      flaggedForReview: Boolean(item.flaggedForReview),
      notes: item.notes || "",
    });
    setShowTransactionModal(true);
  }

  async function saveTransaction() {
    try {
      setStatus(editingId ? "Updating transaction..." : "Creating transaction...");

      await api(editingId ? `/transactions/${editingId}` : "/transactions", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount),
        }),
      });

      setShowTransactionModal(false);
      setEditingId(null);
      setForm(baseForm);
      await refreshAll();
    } catch (error) {
      setStatus(error.message || "Unable to save transaction.");
    }
  }

  async function deleteTransaction(id) {
    try {
      setStatus("Deleting transaction...");
      await api(`/transactions/${id}`, { method: "DELETE" });
      await refreshAll();
    } catch (error) {
      setStatus(error.message || "Unable to delete transaction.");
    }
  }

  async function saveBudget() {
    try {
      setStatus("Saving budget...");
      await api(`/budgets/${encodeURIComponent(budgetForm.category)}`, {
        method: "PUT",
        body: JSON.stringify({
          month,
          limit: Number(budgetForm.limit),
        }),
      });

      setShowBudgetModal(false);
      setBudgetForm(budgetFormBase);
      await refreshAll();
    } catch (error) {
      setStatus(error.message || "Unable to save budget.");
    }
  }

  const summary = dashboard?.summary || {};
  const insights = [
    `Pending approvals: ${summary.pendingApprovalCount || 0}`,
    `Flagged review items: ${summary.flaggedCount || 0}`,
    `Approved expense: ${formatCurrency(summary.approvedExpense)}`,
    `Savings rate: ${formatPercent(summary.savingsRate)}`,
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <NativeStatusBar barStyle="light-content" />

      <LinearGradient colors={["#06111d", "#10243a", "#07131f"]} style={styles.background}>
        <Animated.ScrollView
          contentContainerStyle={styles.scroll}
          style={{ opacity: fade, transform: [{ translateY: slide }] }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroEyebrow}>Competitive mobile finance app</Text>
                <Text style={styles.heroTitle}>Finance Tracker AI Mobile</Text>
                <Text style={styles.heroCopy}>
                  Enterprise-ready finance workflows with premium mobile polish for iOS and Android.
                </Text>
              </View>
              <Animated.View style={{ transform: [{ scale: pulse }] }}>
                <LinearGradient colors={["#7dd3fc", "#34d399"]} style={styles.heroOrb}>
                  <MaterialCommunityIcons name="finance" size={28} color="#06111d" />
                </LinearGradient>
              </Animated.View>
            </View>

            <View style={styles.rowBetween}>
              <Text style={styles.statusText}>{status}</Text>
              <Pressable onPress={() => refreshAll()} style={styles.refreshButton}>
                {refreshing ? (
                  <ActivityIndicator color="#04131f" />
                ) : (
                  <MaterialCommunityIcons name="refresh" size={18} color="#04131f" />
                )}
              </Pressable>
            </View>
          </View>

          <View style={styles.tabRow}>
            <TabButton label="Overview" icon="view-dashboard-outline" active={activeTab === "overview"} onPress={() => setActiveTab("overview")} />
            <TabButton label="Transactions" icon="swap-horizontal-bold" active={activeTab === "transactions"} onPress={() => setActiveTab("transactions")} />
            <TabButton label="Budgets" icon="wallet-outline" active={activeTab === "budgets"} onPress={() => setActiveTab("budgets")} />
          </View>

          {loading ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator size="large" color="#7dd3fc" />
            </View>
          ) : (
            <>
              {activeTab === "overview" ? (
                <>
                  <SectionHeader eyebrow="Performance" title={`Month ${month}`} />
                  <View style={styles.metricGrid}>
                    <MetricCard label="Balance" value={formatCurrency(summary.balance)} accent="#7dd3fc" icon="scale-balance" />
                    <MetricCard label="Income" value={formatCurrency(summary.income)} accent="#34d399" icon="arrow-bottom-left" />
                    <MetricCard label="Expense" value={formatCurrency(summary.expense)} accent="#fb7185" icon="arrow-top-right" />
                    <MetricCard label="Savings" value={formatPercent(summary.savingsRate)} accent="#fbbf24" icon="chart-donut" />
                    <MetricCard label="Pending" value={String(summary.pendingApprovalCount || 0)} accent="#c084fc" icon="clock-outline" />
                    <MetricCard label="Flagged" value={String(summary.flaggedCount || 0)} accent="#f97316" icon="alert-rhombus-outline" />
                  </View>

                  <SectionHeader eyebrow="Insights" title="What needs attention" />
                  <View style={styles.stack}>
                    {insights.map((item, index) => (
                      <InsightCard key={item} icon={index % 2 === 0 ? "sparkles" : "shield-check-outline"} text={item} />
                    ))}
                  </View>

                  <SectionHeader eyebrow="Top spending" title="Category breakdown" />
                  <View style={styles.stack}>
                    {(dashboard?.categoryBreakdown || []).slice(0, 4).map((item) => (
                      <View key={item.category} style={styles.surfaceCard}>
                        <View style={styles.rowBetween}>
                          <Text style={styles.surfaceTitle}>{item.category}</Text>
                          <Text style={styles.surfaceValue}>{formatCurrency(item.total)}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </>
              ) : null}

              {activeTab === "transactions" ? (
                <>
                  <SectionHeader eyebrow="Operations" title="Transaction center" actionLabel="Add New" onPress={openCreate} />
                  <View style={styles.stack}>
                    {transactions.slice(0, 8).map((item) => (
                      <TransactionCard
                        key={item._id}
                        item={item}
                        onEdit={() => openEdit(item)}
                        onDelete={() => deleteTransaction(item._id)}
                      />
                    ))}
                  </View>
                </>
              ) : null}

              {activeTab === "budgets" ? (
                <>
                  <SectionHeader eyebrow="Controls" title="Budget monitor" actionLabel="Set Budget" onPress={() => setShowBudgetModal(true)} />
                  <View style={styles.stack}>
                    {budgets.map((item) => (
                      <BudgetCard key={`${item.category}-${item.month}`} item={item} />
                    ))}
                    {!budgets.length ? (
                      <View style={styles.surfaceCard}>
                        <Text style={styles.mutedText}>No mobile budgets yet for this month.</Text>
                      </View>
                    ) : null}
                  </View>
                </>
              ) : null}
            </>
          )}
        </Animated.ScrollView>

        <Pressable style={styles.fab} onPress={openCreate}>
          <MaterialCommunityIcons name="plus" size={28} color="#04131f" />
        </Pressable>

        <Modal visible={showTransactionModal} animationType="slide" onRequestClose={() => setShowTransactionModal(false)}>
          <SafeAreaView style={styles.modalSafe}>
            <LinearGradient colors={["#08121d", "#10243a"]} style={styles.modalBackground}>
              <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
                <SectionHeader
                  eyebrow="Transaction studio"
                  title={editingId ? "Edit transaction" : "Create transaction"}
                  actionLabel="Close"
                  onPress={() => setShowTransactionModal(false)}
                />

                <Input label="Description" value={form.desc} onChangeText={(value) => setForm({ ...form, desc: value })} placeholder="Office rent, salary payout, vendor invoice" />
                <Input label="Amount" value={form.amount} onChangeText={(value) => setForm({ ...form, amount: value })} placeholder="0" keyboardType="numeric" />
                <ChipSelect label="Type" options={typeOptions} value={form.type} onChange={(value) => setForm({ ...form, type: value })} />
                <ChipSelect label="Category" options={categoryOptions} value={form.category} onChange={(value) => setForm({ ...form, category: value })} />
                <Input label="Account" value={form.accountName} onChangeText={(value) => setForm({ ...form, accountName: value })} placeholder="Primary treasury" />
                <Input label="Counterparty" value={form.counterparty} onChangeText={(value) => setForm({ ...form, counterparty: value })} placeholder="Vendor, employee, client" />
                <ChipSelect label="Approval" options={approvalOptions} value={form.approvalStatus} onChange={(value) => setForm({ ...form, approvalStatus: value })} />
                <ChipSelect label="Payment Method" options={paymentOptions} value={form.paymentMethod} onChange={(value) => setForm({ ...form, paymentMethod: value })} />
                <ChipSelect label="Tax Category" options={taxOptions} value={form.taxCategory} onChange={(value) => setForm({ ...form, taxCategory: value })} />
                <ChipSelect label="Source" options={sourceOptions} value={form.sourceSystem} onChange={(value) => setForm({ ...form, sourceSystem: value })} />
                <Input label="Date" value={form.transactionDate} onChangeText={(value) => setForm({ ...form, transactionDate: value })} placeholder="YYYY-MM-DD" />
                <Input label="Receipt URL" value={form.receiptUrl} onChangeText={(value) => setForm({ ...form, receiptUrl: value })} placeholder="https://example.com/receipt.pdf" />
                <Input label="Tags" value={form.tags} onChangeText={(value) => setForm({ ...form, tags: value })} placeholder="travel, urgent, invoice" />
                <Input label="Notes" value={form.notes} onChangeText={(value) => setForm({ ...form, notes: value })} placeholder="Add context for your finance team" multiline />

                <View style={styles.switchRow}>
                  <Text style={styles.fieldLabel}>Recurring transaction</Text>
                  <Switch value={form.isRecurring} onValueChange={(value) => setForm({ ...form, isRecurring: value })} />
                </View>
                <View style={styles.switchRow}>
                  <Text style={styles.fieldLabel}>Flag for finance review</Text>
                  <Switch value={form.flaggedForReview} onValueChange={(value) => setForm({ ...form, flaggedForReview: value })} />
                </View>

                <Pressable onPress={saveTransaction} style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>{editingId ? "Update transaction" : "Save transaction"}</Text>
                </Pressable>
              </ScrollView>
            </LinearGradient>
          </SafeAreaView>
        </Modal>

        <Modal visible={showBudgetModal} animationType="slide" onRequestClose={() => setShowBudgetModal(false)}>
          <SafeAreaView style={styles.modalSafe}>
            <LinearGradient colors={["#08121d", "#10243a"]} style={styles.modalBackground}>
              <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
                <SectionHeader eyebrow="Budget control" title="Set category budget" actionLabel="Close" onPress={() => setShowBudgetModal(false)} />
                <ChipSelect label="Category" options={categoryOptions.filter((item) => item !== "salary" && item !== "freelance")} value={budgetForm.category} onChange={(value) => setBudgetForm({ ...budgetForm, category: value })} />
                <Input label="Monthly limit" value={budgetForm.limit} onChangeText={(value) => setBudgetForm({ ...budgetForm, limit: value })} placeholder="0" keyboardType="numeric" />
                <Pressable onPress={saveBudget} style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>Save budget</Text>
                </Pressable>
              </ScrollView>
            </LinearGradient>
          </SafeAreaView>
        </Modal>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#06111d",
  },
  background: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 120,
  },
  heroCard: {
    padding: 20,
    borderRadius: 28,
    backgroundColor: "rgba(8, 22, 37, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(125, 211, 252, 0.14)",
    marginBottom: 18,
  },
  heroEyebrow: {
    color: "#7dd3fc",
    textTransform: "uppercase",
    letterSpacing: 1.8,
    fontSize: 11,
    marginBottom: 10,
  },
  heroTitle: {
    color: "#eff6ff",
    fontSize: 30,
    fontWeight: "800",
    marginBottom: 8,
  },
  heroCopy: {
    color: "#a5b9cf",
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 250,
  },
  heroOrb: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  statusText: {
    color: "#b7c8dc",
    fontSize: 13,
    flex: 1,
    marginTop: 18,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#7dd3fc",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },
  tabRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 18,
  },
  tabButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(11, 28, 45, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(125, 211, 252, 0.08)",
  },
  tabButtonActive: {
    backgroundColor: "#7dd3fc",
  },
  tabText: {
    color: "#dbeafe",
    fontSize: 12,
    fontWeight: "700",
  },
  tabTextActive: {
    color: "#04131f",
  },
  loaderWrap: {
    paddingVertical: 80,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  sectionEyebrow: {
    color: "#7dd3fc",
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  sectionTitle: {
    color: "#eff6ff",
    fontSize: 22,
    fontWeight: "800",
  },
  sectionAction: {
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "rgba(17, 40, 62, 0.9)",
  },
  sectionActionText: {
    color: "#eff6ff",
    fontWeight: "700",
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    width: "48%",
    backgroundColor: "rgba(10, 26, 42, 0.92)",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(125, 211, 252, 0.08)",
  },
  metricIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  metricLabel: {
    color: "#9cb4cb",
    fontSize: 12,
    marginBottom: 8,
  },
  metricValue: {
    color: "#eff6ff",
    fontSize: 20,
    fontWeight: "800",
  },
  stack: {
    gap: 12,
    marginBottom: 20,
  },
  insightCard: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: "rgba(10, 26, 42, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(125, 211, 252, 0.08)",
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  insightText: {
    color: "#d7e6f5",
    flex: 1,
    lineHeight: 20,
  },
  surfaceCard: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: "rgba(10, 26, 42, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(125, 211, 252, 0.08)",
  },
  surfaceTitle: {
    color: "#eff6ff",
    fontSize: 16,
    fontWeight: "700",
  },
  surfaceValue: {
    color: "#7dd3fc",
    fontWeight: "800",
  },
  mutedText: {
    color: "#9cb4cb",
    marginTop: 6,
  },
  progressTrack: {
    height: 10,
    borderRadius: 99,
    overflow: "hidden",
    backgroundColor: "rgba(148, 163, 184, 0.12)",
    marginTop: 12,
  },
  progressFill: {
    height: "100%",
    borderRadius: 99,
  },
  barHealthy: {
    backgroundColor: "#34d399",
  },
  barWarning: {
    backgroundColor: "#fbbf24",
  },
  barOver: {
    backgroundColor: "#fb7185",
  },
  transactionCard: {
    borderRadius: 22,
    padding: 16,
    backgroundColor: "rgba(10, 26, 42, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(125, 211, 252, 0.08)",
    gap: 10,
  },
  transactionTitleWrap: {
    flex: 1,
    paddingRight: 10,
  },
  transactionTitle: {
    color: "#eff6ff",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 6,
  },
  transactionAmount: {
    color: "#eff6ff",
    fontSize: 18,
    fontWeight: "800",
  },
  transactionMeta: {
    color: "#9cb4cb",
    fontSize: 12,
    lineHeight: 18,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 99,
    backgroundColor: "rgba(125, 211, 252, 0.12)",
  },
  badgeApproved: {
    backgroundColor: "rgba(52, 211, 153, 0.18)",
  },
  badgeRejected: {
    backgroundColor: "rgba(251, 113, 133, 0.18)",
  },
  badgePending: {
    backgroundColor: "rgba(251, 191, 36, 0.18)",
  },
  badgeText: {
    color: "#eff6ff",
    textTransform: "capitalize",
    fontSize: 11,
    fontWeight: "700",
  },
  notesText: {
    color: "#cfdef0",
    lineHeight: 20,
  },
  auditText: {
    color: "#8ca5c0",
    fontSize: 12,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
  },
  smallButton: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "#173149",
  },
  smallDanger: {
    backgroundColor: "#4d1e2d",
  },
  smallButtonText: {
    color: "#eff6ff",
    fontWeight: "700",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 26,
    width: 62,
    height: 62,
    borderRadius: 24,
    backgroundColor: "#7dd3fc",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7dd3fc",
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  modalSafe: {
    flex: 1,
    backgroundColor: "#06111d",
  },
  modalBackground: {
    flex: 1,
  },
  modalScroll: {
    padding: 18,
    paddingBottom: 56,
  },
  field: {
    marginBottom: 16,
  },
  fieldLabel: {
    color: "#dbeafe",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "rgba(10, 26, 42, 0.92)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(125, 211, 252, 0.08)",
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: "#eff6ff",
  },
  textArea: {
    minHeight: 110,
    textAlignVertical: "top",
  },
  chipScroller: {
    gap: 10,
    paddingRight: 12,
  },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 99,
    backgroundColor: "rgba(10, 26, 42, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(125, 211, 252, 0.08)",
  },
  optionChipActive: {
    backgroundColor: "#7dd3fc",
  },
  optionChipText: {
    color: "#dbeafe",
    textTransform: "capitalize",
    fontWeight: "700",
  },
  optionChipTextActive: {
    color: "#04131f",
  },
  switchRow: {
    marginBottom: 16,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "rgba(10, 26, 42, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(125, 211, 252, 0.08)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  primaryButton: {
    marginTop: 12,
    borderRadius: 18,
    backgroundColor: "#7dd3fc",
    paddingVertical: 15,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#04131f",
    fontWeight: "800",
    fontSize: 16,
  },
});
