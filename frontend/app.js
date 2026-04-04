let transactions = JSON.parse(localStorage.getItem("data")) || [];

const form = document.getElementById("finance-form");
const list = document.getElementById("list");
const filter = document.getElementById("filter");

const balanceEl = document.getElementById("balance");
const incomeEl = document.getElementById("income");
const expenseEl = document.getElementById("expense");

function render() {
  list.innerHTML = "";

  let income = 0;
  let expense = 0;

  const filtered = transactions.filter(t => {
    if (filter.value === "all") return true;
    return t.type === filter.value;
  });

  filtered.forEach((t, index) => {
    const li = document.createElement("li");

    li.innerHTML = `
      ${t.type.toUpperCase()} | ${t.category} | ${t.desc} - ₹${t.amount} <br>
      <small>${t.date}</small>
      <button onclick="deleteItem(${index})">X</button>
    `;

    list.appendChild(li);

    if (t.type === "income") income += Number(t.amount);
    else expense += Number(t.amount);
  });

  balanceEl.textContent = income - expense;
  incomeEl.textContent = income;
  expenseEl.textContent = expense;
}

function deleteItem(index) {
  transactions.splice(index, 1);
  localStorage.setItem("data", JSON.stringify(transactions));
  render();
}

form.addEventListener("submit", function (e) {
  e.preventDefault();

  const desc = document.getElementById("desc").value;
  const amount = document.getElementById("amount").value;
  const type = document.getElementById("type").value;
  const category = document.getElementById("category").value;

  const date = new Date().toLocaleDateString();

  const newTransaction = { desc, amount, type, category, date };

  transactions.push(newTransaction);
  localStorage.setItem("data", JSON.stringify(transactions));

  render();
  form.reset();
});

filter.addEventListener("change", render);

render();