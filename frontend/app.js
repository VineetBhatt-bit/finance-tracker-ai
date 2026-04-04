const form = document.getElementById("finance-form");
const list = document.getElementById("list");

form.addEventListener("submit", function(e) {
  e.preventDefault();

  const desc = document.getElementById("desc").value;
  const amount = document.getElementById("amount").value;
  const type = document.getElementById("type").value;

  const li = document.createElement("li");

  li.textContent = `${type.toUpperCase()}: ${desc} - ₹${amount}`;

  list.appendChild(li);

  form.reset();
});