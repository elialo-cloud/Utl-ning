const KEY = "boden-v4";
const PIN = "1234";

const seed = {
  classes: [
    { id: "1A", name: "1A", students: ["Alma", "Elias", "Hugo", "Liam", "Maja", "Noah", "Olivia", "William"] },
    { id: "1B", name: "1B", students: ["Alice", "Axel", "Elsa", "Isak", "Leo", "Nora", "Sofia", "Vera"] },
    { id: "2A", name: "2A", students: ["Adam", "Ella", "Felix", "Freja", "Loke", "Milo", "Saga", "Wilma"] },
    { id: "2B", name: "2B", students: ["Albin", "Ebba", "Harry", "Ida", "Kalle", "Lilly", "Nils", "Tilde"] }
  ],
  items: [
    { id: "boll", name: "Boll", icon: "⚽", category: "Bollar", total: 10 },
    { id: "innebandy", name: "Innebandyklubba", icon: "🏑", category: "Sport", total: 12 },
    { id: "kon", name: "Kon", icon: "🔶", category: "Lek", total: 20 },
    { id: "hopprep", name: "Hopprep", icon: "〰️", category: "Lek", total: 8 },
    { id: "pingisrack", name: "Pingisrack", icon: "🏓", category: "Sport", total: 6 },
    { id: "rockring", name: "Rockring", icon: "⭕", category: "Lek", total: 6 },
    { id: "vast", name: "Fotbollsväst", icon: "🦺", category: "Sport", total: 15 },
    { id: "frisbee", name: "Frisbee", icon: "🥏", category: "Lek", total: 5 }
  ],
  loans: []
};

let data = load();
let selectedClass = null;
let selectedStudent = null;
let selectedItem = null;
let category = "Alla";
let adminTab = "dashboard";

const $ = id => document.getElementById(id);

function cloneSeed() {
  return JSON.parse(JSON.stringify(seed));
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && Array.isArray(saved.classes) && Array.isArray(saved.items) && Array.isArray(saved.loans)) return saved;
  } catch (_) {}
  return cloneSeed();
}

function save() {
  localStorage.setItem(KEY, JSON.stringify(data));
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>\"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;" }[ch]));
}

function attr(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

function initials(name) {
  return String(name).trim().split(/\s+/).map(x => x[0]).join("").slice(0, 2).toUpperCase();
}

function activeLoans() {
  return data.loans.filter(loan => !loan.returned);
}

function available(item) {
  return Math.max(0, Number(item.total || 0) - activeLoans().filter(loan => loan.itemId === item.id).length);
}

function date(value) {
  return new Intl.DateTimeFormat("sv-SE", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" }).format(new Date(value));
}

function empty(icon, title, text) {
  return `<div class="empty"><span>${icon}</span><strong>${escapeHtml(title)}</strong><small>${escapeHtml(text || "")}</small></div>`;
}

function toast(message) {
  const el = $("toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 2200);
}

function show(id) {
  document.querySelectorAll(".view").forEach(view => view.classList.add("hidden"));
  const target = $(id);
  if (target) target.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateCount() {
  $("loanCount").textContent = activeLoans().length;
}

function renderClasses() {
  $("classGrid").innerHTML = data.classes.length
    ? data.classes.map(c => `<button class="class-card" data-id="${attr(c.id)}"><span class="class-icon">🏫</span><span><strong>${escapeHtml(c.name)}</strong><small>${c.students.length} elever</small></span><b>→</b></button>`).join("")
    : empty("🏫", "Inga klasser", "Lägg till en klass i lärarläget.");

  document.querySelectorAll(".class-card[data-id]").forEach(button => {
    button.onclick = () => selectClass(data.classes.find(c => c.id === button.dataset.id));
  });
}

function selectClass(cls) {
  if (!cls) return;
  selectedClass = cls;
  selectedStudent = null;
  $("classTitle").textContent = `Klass ${cls.name}`;
  $("studentSearch").value = "";
  renderStudents();
  show("studentsView");
}

function renderStudents() {
  if (!selectedClass) return;
  const query = $("studentSearch").value.toLowerCase().trim();
  const students = selectedClass.students.filter(student => student.toLowerCase().includes(query));

  $("studentGrid").innerHTML = students.length
    ? students.map(student => {
        const count = activeLoans().filter(loan => loan.classId === selectedClass.id && loan.student === student).length;
        return `<button class="student-card" data-name="${attr(student)}"><span class="avatar">${initials(student)}</span><span class="student-info"><strong>${escapeHtml(student)}</strong><small>${count ? `${count} aktiv${count === 1 ? "t" : "a"} lån` : "Inga aktiva lån"}</small></span><b>→</b></button>`;
      }).join("")
    : empty("🔎", "Ingen elev hittades", "Testa ett annat namn.");

  document.querySelectorAll(".student-card[data-name]").forEach(button => {
    button.onclick = () => selectStudent(button.dataset.name);
  });
}

function selectStudent(student) {
  selectedStudent = student;
  $("studentTitle").textContent = student;
  $("studentSubtitle").textContent = `Klass ${selectedClass.name}`;
  category = "Alla";
  renderCategories();
  renderStudentLoans();
  renderItems();
  show("itemsView");
}

function renderStudentLoans() {
  const loans = selectedClass && selectedStudent
    ? activeLoans().filter(loan => loan.classId === selectedClass.id && loan.student === selectedStudent)
    : [];

  $("studentLoans").innerHTML = loans.length
    ? `<div class="mini-title">${loans.length} aktivt lån</div>${loans.map(loan => `<button class="mini-loan" data-return="${attr(loan.id)}">${loan.icon}<span><strong>${escapeHtml(loan.itemName)}</strong><small>${date(loan.borrowedAt)}</small></span><b>↩</b></button>`).join("")}`
    : "";

  document.querySelectorAll("#studentLoans [data-return]").forEach(button => {
    button.onclick = () => returnLoan(button.dataset.return);
  });
}

function renderCategories() {
  const categories = ["Alla", ...new Set(data.items.map(item => item.category).filter(Boolean))];
  $("categoryRow").innerHTML = categories.map(cat => `<button class="category ${category === cat ? "active" : ""}" data-cat="${attr(cat)}">${escapeHtml(cat)}</button>`).join("");
  document.querySelectorAll(".category").forEach(button => {
    button.onclick = () => {
      category = button.dataset.cat;
      renderCategories();
      renderItems();
    };
  });
}

function renderItems() {
  const items = data.items.filter(item => category === "Alla" || item.category === category);
  $("itemGrid").innerHTML = items.length
    ? items.map(item => {
        const free = available(item);
        const out = free === 0;
        const low = free <= 2 && !out;
        return `<button class="item-card ${out ? "out" : ""}" data-item="${attr(item.id)}" ${out ? "disabled" : ""}><span class="item-icon">${item.icon}</span><span class="item-info"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.category)}</small><em class="stock ${low ? "low" : ""}">${out ? "Slut" : `${free} lediga av ${item.total}`}</em></span><b>${out ? "—" : "→"}</b></button>`;
      }).join("")
    : empty("📦", "Inga saker", "Lägg till saker i lärarläget.");

  document.querySelectorAll(".item-card[data-item]:not(:disabled)").forEach(button => {
    button.onclick = () => openLoan(data.items.find(item => item.id === button.dataset.item));
  });
}

function openLoan(item) {
  if (!item || !selectedStudent || !selectedClass || available(item) <= 0) return;
  selectedItem = item;
  $("modalText").innerHTML = `<strong>${escapeHtml(selectedStudent)}</strong> · ${escapeHtml(selectedClass.name)}<br><br><span class="confirm-item">${item.icon} ${escapeHtml(item.name)}</span><br><small>${available(item) - 1} kvar efter detta lån.</small>`;
  $("confirmModal").classList.remove("hidden");
}

function closeModal() {
  $("confirmModal").classList.add("hidden");
  selectedItem = null;
}

function confirmLoan() {
  if (!selectedItem || !selectedClass || !selectedStudent) return;
  const item = data.items.find(x => x.id === selectedItem.id);
  if (!item || available(item) <= 0) return closeModal();

  data.loans.push({
    id: globalThis.crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    classId: selectedClass.id,
    className: selectedClass.name,
    student: selectedStudent,
    itemId: item.id,
    itemName: item.name,
    icon: item.icon,
    borrowedAt: new Date().toISOString(),
    returned: false,
    returnedAt: null
  });

  save();
  closeModal();
  toast(`${item.icon} ${item.name} utlånad till ${selectedStudent}`);
  renderItems();
  renderStudentLoans();
  renderStudents();
  updateCount();
  setTimeout(() => show("homeView"), 700);
}

function returnLoan(id) {
  const loan = data.loans.find(x => x.id === id);
  if (!loan || loan.returned) return;
  loan.returned = true;
  loan.returnedAt = new Date().toISOString();
  save();
  toast(`${loan.icon} ${loan.itemName} är tillbaka`);
  renderStudentLoans();
  renderItems();
  renderLoans();
  renderAdmin();
  updateCount();
}

function renderLoans() {
  const query = $("loanSearch").value.toLowerCase().trim();
  const loans = activeLoans().filter(loan => `${loan.student} ${loan.className} ${loan.itemName}`.toLowerCase().includes(query)).sort((a, b) => new Date(b.borrowedAt) - new Date(a.borrowedAt));
  $("activeTotal").textContent = activeLoans().length;
  $("loanList").innerHTML = loans.length
    ? loans.map(loan => `<article class="loan-card"><span class="loan-item-icon">${loan.icon}</span><span class="loan-info"><strong>${escapeHtml(loan.itemName)}</strong><small>${escapeHtml(loan.student)} · ${escapeHtml(loan.className)}</small><em>${date(loan.borrowedAt)}</em></span><button class="return-btn" data-return="${attr(loan.id)}">Lämna tillbaka</button></article>`).join("")
    : empty("📦", "Inga aktiva lån", query ? "Inget matchade sökningen." : "Allt finns i boden.");

  document.querySelectorAll("#loanList [data-return]").forEach(button => {
    button.onclick = () => returnLoan(button.dataset.return);
  });
}

function renderStats() {
  const active = activeLoans();
  $("statsGrid").innerHTML = `<div class="stat-card"><small>Aktiva lån</small><strong>${active.length}</strong></div><div class="stat-card"><small>Utlånade enheter</small><strong>${data.items.reduce((sum, item) => sum + (item.total - available(item)), 0)}</strong></div><div class="stat-card"><small>Totalt i boden</small><strong>${data.items.reduce((sum, item) => sum + Number(item.total || 0), 0)}</strong></div><div class="stat-card"><small>Elever</small><strong>${data.classes.reduce((sum, cls) => sum + cls.students.length, 0)}</strong></div>`;
}

function adminRow(loan) {
  return `<div class="admin-row"><span>${loan.icon}<strong>${escapeHtml(loan.itemName)}</strong><small>${escapeHtml(loan.student)} · ${escapeHtml(loan.className)} · ${date(loan.borrowedAt)}</small></span><button class="return-btn" data-return="${attr(loan.id)}">Tillbaka</button></div>`;
}

function renderAdmin() {
  if (!$('teacherView') || $('teacherView').classList.contains('hidden')) return;
  renderStats();
  const panel = $("adminPanel");
  const active = activeLoans();

  if (adminTab === "dashboard") {
    panel.innerHTML = `<div class="admin-card"><div class="admin-head"><div><h3>Aktiva lån</h3><p>Snabb återlämning.</p></div></div>${active.length ? active.map(adminRow).join("") : empty("✅", "Allt är inne", "Inga aktiva lån just nu.")}</div>`;
  } else if (adminTab === "items") {
    renderAdminItems(panel);
  } else if (adminTab === "classes") {
    renderAdminClasses(panel);
  } else {
    renderHistory(panel);
  }

  panel.querySelectorAll("[data-return]").forEach(button => {
    button.onclick = () => returnLoan(button.dataset.return);
  });
}

function renderAdminItems(panel) {
  panel.innerHTML = `<div class="admin-card"><div class="admin-head"><div><h3>Saker</h3><p>Antal, status och namn.</p></div><button class="primary-btn" id="addItem">+ Lägg till</button></div>${data.items.length ? data.items.map(item => `<div class="admin-row"><span>${item.icon}<strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.category)} · ${available(item)}/${item.total} lediga</small></span><span class="row-actions"><button class="ghost-btn" data-edit="${attr(item.id)}">Redigera</button><button class="danger-btn" data-del="${attr(item.id)}">Ta bort</button></span></div>`).join("") : empty("📦", "Inga saker", "Lägg till den första saken.")}</div>`;
  $("addItem").onclick = () => adminModal("Ny sak", "item");
  panel.querySelectorAll("[data-edit]").forEach(button => button.onclick = () => adminModal("Redigera sak", "item", button.dataset.edit));
  panel.querySelectorAll("[data-del]").forEach(button => button.onclick = () => deleteItem(button.dataset.del));
}

function renderAdminClasses(panel) {
  panel.innerHTML = `<div class="admin-card"><div class="admin-head"><div><h3>Klasser & elever</h3><p>Ändra listan som används vid utlåning.</p></div><button class="primary-btn" id="addClass">+ Klass</button></div>${data.classes.map(cls => `<div class="class-admin"><div class="admin-head"><strong>Klass ${escapeHtml(cls.name)}</strong><button class="ghost-btn" data-add="${attr(cls.id)}">+ Elev</button></div><div class="chips">${cls.students.map((student, index) => `<span>${escapeHtml(student)} <button data-remove="${attr(cls.id)}|${index}">×</button></span>`).join("")}</div></div>`).join("")}</div>`;
  $("addClass").onclick = () => adminModal("Ny klass", "class");
  panel.querySelectorAll("[data-add]").forEach(button => button.onclick = () => adminModal("Ny elev", "student", button.dataset.add));
  panel.querySelectorAll("[data-remove]").forEach(button => button.onclick = () => {
    const [classId, index] = button.dataset.remove.split("|");
    const cls = data.classes.find(c => c.id === classId);
    if (cls) cls.students.splice(Number(index), 1);
    save();
    renderClasses();
    renderAdmin();
  });
}

function renderHistory(panel) {
  const history = [...data.loans].sort((a, b) => new Date(b.borrowedAt) - new Date(a.borrowedAt));
  panel.innerHTML = `<div class="admin-card"><div class="admin-head"><div><h3>Historik</h3><p>Alla utlåningar på denna enhet.</p></div><button class="ghost-btn" id="clearHistory">Rensa historik</button></div>${history.length ? history.map(loan => `<div class="admin-row"><span>${loan.icon}<strong>${escapeHtml(loan.itemName)}</strong><small>${escapeHtml(loan.student)} · ${escapeHtml(loan.className)} · ${date(loan.borrowedAt)}</small></span><span class="status ${loan.returned ? "returned" : "active"}">${loan.returned ? "Återlämnad" : "Ute"}</span></div>`).join("") : empty("📜", "Ingen historik", "")}</div>`;
  $("clearHistory").onclick = () => {
    if (!data.loans.length) return;
    if (confirm("Rensa all historik?")) {
      data.loans = [];
      save();
      renderAdmin();
      updateCount();
      toast("Historiken är rensad");
    }
  };
}

function adminModal(title, type, id = "") {
  const body = $("adminModalBody");
  $("adminModalTitle").textContent = title;
  body.dataset.type = type;
  body.dataset.id = id;

  if (type === "item") {
    const item = id ? data.items.find(x => x.id === id) : null;
    body.innerHTML = `<div class="form-grid"><label>Namn<input id="fName" class="admin-input" value="${attr(item?.name || "")}" placeholder="Fotboll"></label><label>Kategori<input id="fCat" class="admin-input" value="${attr(item?.category || "Sport")}"></label><label>Ikon<input id="fIcon" class="admin-input" value="${attr(item?.icon || "📦")}" maxlength="4"></label><label>Antal<input id="fTotal" class="admin-input" type="number" min="0" value="${item?.total ?? 1}"></label></div>`;
  } else if (type === "class") {
    body.innerHTML = `<label>Klass<input id="fClass" class="admin-input" placeholder="3A"></label>`;
  } else {
    body.innerHTML = `<label>Namn<input id="fStudent" class="admin-input" placeholder="Elevens namn"></label>`;
  }

  $("adminModal").classList.remove("hidden");
  setTimeout(() => body.querySelector("input")?.focus(), 50);
}

function saveAdmin() {
  const body = $("adminModalBody");
  const type = body.dataset.type;
  const id = body.dataset.id;

  if (type === "item") {
    const name = $("fName").value.trim();
    const cat = $("fCat").value.trim() || "Övrigt";
    const icon = $("fIcon").value.trim() || "📦";
    const total = Math.max(0, Number($("fTotal").value));
    if (!name || !Number.isFinite(total)) return toast("Fyll i namn och antal.");

    if (id) {
      const item = data.items.find(x => x.id === id);
      if (!item) return;
      const used = item.total - available(item);
      if (total < used) return toast(`Minst ${used} måste finnas eftersom ${used} är utlånade.`);
      Object.assign(item, { name, category: cat, icon, total });
    } else {
      data.items.push({ id: `item-${Date.now()}`, name, category: cat, icon, total });
    }
  } else if (type === "class") {
    const name = $("fClass").value.trim();
    if (!name || data.classes.some(cls => cls.name.toLowerCase() === name.toLowerCase())) return toast("Klassen finns redan eller är tom.");
    data.classes.push({ id: `${name.replace(/\s+/g, "-")}-${Date.now()}`, name, students: [] });
  } else if (type === "student") {
    const cls = data.classes.find(x => x.id === id);
    const name = $("fStudent").value.trim();
    if (!cls || !name || cls.students.some(s => s.toLowerCase() === name.toLowerCase())) return toast("Eleven finns redan eller är tom.");
    cls.students.push(name);
  }

  save();
  $("adminModal").classList.add("hidden");
  renderClasses();
  renderAdmin();
  toast("Sparat");
}

function deleteItem(id) {
  const item = data.items.find(x => x.id === id);
  if (!item) return;
  if (activeLoans().some(loan => loan.itemId === id)) return toast("Saken är utlånad och kan inte tas bort.");
  if (!confirm(`Ta bort ${item.name}?`)) return;
  data.items = data.items.filter(x => x.id !== id);
  save();
  renderAdmin();
  renderItems();
  toast("Saken är borttagen");
}

function globalSearch() {
  const query = $("globalSearch").value.toLowerCase().trim();
  const results = $("searchResults");
  if (!query) {
    results.classList.add("hidden");
    results.innerHTML = "";
    return;
  }

  const students = data.classes.flatMap(cls => cls.students.map(student => ({ student, cls }))).filter(x => x.student.toLowerCase().includes(query)).slice(0, 6);
  const items = data.items.filter(item => `${item.name} ${item.category}`.toLowerCase().includes(query)).slice(0, 6);
  const html = [];

  students.forEach(x => html.push(`<button class="search-item" data-search-student="${attr(x.student)}" data-search-class="${attr(x.cls.id)}"><span class="avatar small">${initials(x.student)}</span><span><strong>${escapeHtml(x.student)}</strong><small>Klass ${escapeHtml(x.cls.name)}</small></span><b>→</b></button>`));
  items.forEach(item => html.push(`<button class="search-item" data-search-item="${attr(item.id)}"><span class="item-icon">${item.icon}</span><span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.category)} · ${available(item)} lediga</small></span><b>→</b></button>`));

  results.innerHTML = html.length ? html.join("") : empty("🔎", "Inget hittades", "Prova ett annat namn eller en annan sak.");
  results.classList.remove("hidden");

  results.querySelectorAll("[data-search-student]").forEach(button => {
    button.onclick = () => {
      selectedClass = data.classes.find(c => c.id === button.dataset.searchClass);
      selectedStudent = button.dataset.searchStudent;
      if (!selectedClass) return;
      $("searchResults").classList.add("hidden");
      $("globalSearch").value = "";
      $("studentTitle").textContent = selectedStudent;
      $("studentSubtitle").textContent = `Klass ${selectedClass.name}`;
      category = "Alla";
      renderCategories();
      renderStudentLoans();
      renderItems();
      show("itemsView");
    };
  });

  results.querySelectorAll("[data-search-item]").forEach(button => {
    button.onclick = () => {
      const item = data.items.find(x => x.id === button.dataset.searchItem);
      if (!item || available(item) <= 0) return toast("Den saken är slut.");
      results.classList.add("hidden");
      $("globalSearch").value = "";
      toast("Välj klass och elev först för att låna ut saken.");
    };
  });
}

function openTeacher() {
  $("pinInput").value = "";
  $("pinError").textContent = "";
  $("pinModal").classList.remove("hidden");
  setTimeout(() => $("pinInput").focus(), 50);
}

function confirmPin() {
  if ($("pinInput").value !== PIN) {
    $("pinError").textContent = "Fel PIN-kod.";
    return;
  }
  $("pinModal").classList.add("hidden");
  adminTab = "dashboard";
  renderAdmin();
  show("teacherView");
}

function closePin() {
  $("pinModal").classList.add("hidden");
}

function closeAdminModal() {
  $("adminModal").classList.add("hidden");
}

function goHome() {
  $("searchResults").classList.add("hidden");
  $("globalSearch").value = "";
  show("homeView");
}

function init() {
  renderClasses();
  updateCount();

  $("homeBtn").onclick = goHome;
  $("activeBtn").onclick = () => { renderLoans(); show("activeView"); };
  $("teacherBtn").onclick = openTeacher;
  $("teacherLogout").onclick = goHome;
  $("confirmLoan").onclick = confirmLoan;
  $("cancelModal").onclick = closeModal;
  $("confirmPin").onclick = confirmPin;
  $("cancelPin").onclick = closePin;
  $("cancelAdminModal").onclick = closeAdminModal;
  $("saveAdminModal").onclick = saveAdmin;
  $("activeBack").onclick = goHome;

  $("studentSearch").addEventListener("input", renderStudents);
  $("loanSearch").addEventListener("input", renderLoans);
  $("globalSearch").addEventListener("input", globalSearch);
  $("globalSearch").addEventListener("keydown", event => { if (event.key === "Escape") { $("globalSearch").value = ""; globalSearch(); } });
  $("pinInput").addEventListener("keydown", event => { if (event.key === "Enter") confirmPin(); });

  document.querySelectorAll("[data-back]").forEach(button => {
    button.onclick = () => {
      if (button.dataset.back === "home") show("homeView");
      if (button.dataset.back === "students") { if (selectedClass) { renderStudents(); show("studentsView"); } }
    };
  });

  document.querySelectorAll(".admin-tab").forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll(".admin-tab").forEach(x => x.classList.remove("active"));
      tab.classList.add("active");
      adminTab = tab.dataset.tab;
      renderAdmin();
    };
  });
}

document.addEventListener("DOMContentLoaded", init);
