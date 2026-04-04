let transactions = JSON.parse(localStorage.getItem("data")) || [];

const form = document.getElementById("finance-form");
const list = document.getElementById("list");

function render() {
  list.innerHTML = "";

  transactions.forEach((t) => {
    const li = document.createElement("li");
    li.textContent = `${t.type.toUpperCase()}: ${t.desc} - ₹${t.amount}`;
    list.appendChild(li);
  });
}

form.addEventListener("submit", function (e) {
  e.preventDefault();

  const desc = document.getElementById("desc").value;
  const amount = document.getElementById("amount").value;
  const type = document.getElementById("type").value;

  const newTransaction = { desc, amount, type };

  transactions.push(newTransaction);

  localStorage.setItem("data", JSON.stringify(transactions));

  render();
  form.reset();
});

render();