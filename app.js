const STORAGE_KEY = "boden-loans-v3";
const TEACHER_PIN = "1234";

const initialData = {
  classes: [
    { id: "1A", name: "1A", students: ["Alma", "Elias", "Hugo", "Liam", "Maja", "Noah", "Olivia", "William"] },
    { id: "1B", name: "1B", students: ["Alice", "Axel", "Elsa", "Isak", "Leo", "Nora", "Sofia", "Vera"] },
    { id: "2A", name: "2A", students: ["Adam", "Ella", "Felix", "Freja", "Loke", "Milo", "Saga", "Wilma"] },
    { id: "2B", name: "2B", students: ["Albin", "Ebba", "Harry", "Ida", "Kalle", "Lilly", "Nils", "Tilde"] }
  ],
  items: [
    { id: "boll", name: "Boll", icon: "⚽", category: "Bollar", total: 10, available: 10 },
    { id: "innebandy", name: "Innebandyklubba", icon: "🏑", category: "Sport", total: 12, available: 12 },
    { id: "kon", name: "Kon", icon: "🔶", category: "Lek", total: 20, available: 20 },
    { id: "hopprep", name: "Hopprep", icon: "〰️", category: "Lek", total: 8, available: 8 },
    { id: "pingisrack", name: "Pingisrack", icon: "🏓", category: "Sport", total: 6, available: 6 },
    { id: "rockring", name: "Rockring", icon: "⭕", category: "Lek", total: 6, available: 6 },
    { id: "fotbollsvast", name: "Fotbollsväst", icon: "🦺", category: "Sport", total: 15, available: 15 },
    { id: "frisbee", name: "Frisbee", icon: "🥏", category: "Lek", total: 5, available: 5 }
  ],
  loans: []
};

let data = loadData();
let selectedClass = null;
let selectedStudent = null;
let selectedItem = null;
let adminTab = "dashboard";

const $ = id => document.getElementById(id);
const classesView = $("classesView");
const studentsView = $("studentsView");
const itemsView = $("itemsView");
const loansView = $("loansView");
const teacherView = $("teacherView");
const classGrid = $("classGrid");
const studentGrid = $("studentGrid");
const itemGrid = $("itemGrid");
const studentSearch = $("studentSearch");
const loanList = $("loanList");
const loanCount = $("loanCount");
const toast = $("toast");

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : structuredClone(initialData);
  } catch {
    return structuredClone(initialData);
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function showView(view) {
  [classesView, studentsView, itemsView, loansView, teacherView].forEach(v => v.classList.add("hidden"));
  view.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderClasses() {
  classGrid.innerHTML = data.classes.map(cls => `
    <button class="class-card" data-class="${escapeHTML(cls.id)}">
      <div class="class-icon">🏫</div>
      <div><strong>${escapeHTML(cls.name)}</strong><span>${cls.students.length} elever</span></div>
    </button>
  `).join("");
  classGrid.querySelectorAll(".class-card").forEach(btn => {
    btn.onclick = () => selectClass(data.classes.find(c => c.id === btn.dataset.class));
  });
}

function selectClass(cls) {
  selectedClass = cls;
  selectedStudent = null;
  $("classTitle").textContent = `Klass ${cls.name}`;
  studentSearch.value = "";
  renderStudents();
  showView(studentsView);
}

function renderStudents() {
  if (!selectedClass) return;
  const query = studentSearch.value.trim().toLowerCase();
  const students = selectedClass.students.filter(s => s.toLowerCase().includes(query));
  studentGrid.innerHTML = students.length ? students.map(student => {
    const count = data.loans.filter(l => !l.returned && l.classId === selectedClass.id && l.student === student).length;
    return `<button class="student-card" data-student="${escapeHTML(student)}"><div class="avatar">${getInitials(student)}</div><div class="student-info"><strong>${escapeHTML(student)}</strong><span>${count ? `${count} aktivt lån` : "Inga aktiva lån"}</span></div><div class="arrow">→</div></button>`;
  }).join("") : `<div class="empty-state"><div>🔎</div><strong>Ingen elev hittades</strong><span>Testa ett annat namn.</span></div>`;
  studentGrid.querySelectorAll(".student-card").forEach(btn => btn.onclick = () => selectStudent(btn.dataset.student));
}

function selectStudent(student) {
  selectedStudent = student;
  $("studentTitle").textContent = student;
  $("studentSubtitle").textContent = `Klass ${selectedClass.name} · Välj sak`;
  renderItems();
  showView(itemsView);
}

function renderItems() {
  itemGrid.innerHTML = data.items.map(item => {
    const unavailable = item.available <= 0;
    return `<button class="item-card ${unavailable ? "unavailable" : ""}" data-item="${item.id}" ${unavailable ? "disabled" : ""}>
      <div class="item-icon">${item.icon}</div>
      <div class="item-info"><strong>${escapeHTML(item.name)}</strong><span>${escapeHTML(item.category)}</span><small class="${item.available <= 2 ? "low-stock" : ""}">${unavailable ? "Slut" : `${item.available} lediga`}</small></div>
      <div class="arrow">${unavailable ? "—" : "→"}</div>
    </button>`;
  }).join("");
  itemGrid.querySelectorAll(".item-card:not(:disabled)").forEach(btn => btn.onclick = () => openLoanModal(data.items.find(i => i.id === btn.dataset.item)));
}

function openLoanModal(item) {
  selectedItem = item;
  $("modalTitle").textContent = "Låna ut";
  $("modalText").innerHTML = `<strong>${escapeHTML(selectedStudent)}</strong> · klass <strong>${escapeHTML(selectedClass.name)}</strong><br><br>${item.icon} <strong>${escapeHTML(item.name)}</strong>`;
  $("confirmModal").classList.remove("hidden");
}

function closeLoanModal() {
  $("confirmModal").classList.add("hidden");
  selectedItem = null;
}

$("cancelModal").onclick = closeLoanModal;
$("confirmLoan").onclick = () => {
  if (!selectedClass || !selectedStudent || !selectedItem) return;
  const item = data.items.find(i => i.id === selectedItem.id);
  if (!item || item.available <= 0) return closeLoanModal();
  data.loans.push({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
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
  item.available--;
  saveData();
  closeLoanModal();
  updateLoanCount();
  showToast(`${item.icon} ${item.name} utlånad till ${selectedStudent}`);
  renderItems();
  showView(classesView);
};

function renderLoans() {
  const active = data.loans.filter(l => !l.returned).sort((a,b) => new Date(b.borrowedAt) - new Date(a.borrowedAt));
  loanList.innerHTML = active.length ? active.map(loan => `
    <article class="loan-card"><div class="loan-item-icon">${loan.icon}</div><div class="loan-info"><strong>${escapeHTML(loan.itemName)}</strong><span>${escapeHTML(loan.student)} · Klass ${escapeHTML(loan.className)}</span><small>Utlånad ${formatDate(loan.borrowedAt)}</small></div><button class="return-btn" data-return="${loan.id}">Lämna tillbaka</button></article>
  `).join("") : `<div class="empty-state"><div>📦</div><strong>Inga aktiva lån</strong><span>Alla saker finns i boden.</span></div>`;
  loanList.querySelectorAll("[data-return]").forEach(btn => btn.onclick = () => returnLoan(btn.dataset.return));
}

function returnLoan(id) {
  const loan = data.loans.find(l => l.id === id);
  if (!loan || loan.returned) return;
  loan.returned = true;
  loan.returnedAt = new Date().toISOString();
  const item = data.items.find(i => i.id === loan.itemId);
  if (item) item.available = Math.min(item.total, item.available + 1);
  saveData();
  updateLoanCount();
  renderLoans();
  renderAdmin();
  showToast(`${loan.icon} ${loan.itemName} är tillbaka`);
}

function updateLoanCount() {
  loanCount.textContent = data.loans.filter(l => !l.returned).length;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2800);
}

$("loansBtn").onclick = () => { renderLoans(); showView(loansView); };
studentSearch.oninput = renderStudents;

document.querySelectorAll("[data-back]").forEach(btn => btn.onclick = () => {
  if (btn.dataset.back === "classes") showView(classesView);
  if (btn.dataset.back === "students") { renderStudents(); showView(studentsView); }
});

/* =========================
   LÄRARLÄGE / ADMIN
========================= */

$("teacherBtn").onclick = () => {
  $("pinInput").value = "";
  $("pinError").textContent = "";
  $("pinModal").classList.remove("hidden");
  setTimeout(() => $("pinInput").focus(), 50);
};

$("cancelPin").onclick = () => $("pinModal").classList.add("hidden");
$("confirmPin").onclick = loginTeacher;
$("pinInput").onkeydown = e => { if (e.key === "Enter") loginTeacher(); };

function loginTeacher() {
  if ($("pinInput").value !== TEACHER_PIN) {
    $("pinError").textContent = "Fel PIN-kod.";
    return;
  }
  $("pinModal").classList.add("hidden");
  renderAdmin();
  showView(teacherView);
}

$("teacherLogout").onclick = () => showView(classesView);

document.querySelectorAll(".admin-tab").forEach(tab => tab.onclick = () => {
  adminTab = tab.dataset.tab;
  document.querySelectorAll(".admin-tab").forEach(t => t.classList.toggle("active", t === tab));
  renderAdmin();
});

function renderAdmin() {
  const active = data.loans.filter(l => !l.returned);
  const borrowedUnits = data.items.reduce((n, i) => n + (i.total - i.available), 0);
  $("statsGrid").innerHTML = `
    <div class="stat-card"><span>📋 Aktiva lån</span><strong>${active.length}</strong></div>
    <div class="stat-card"><span>📦 Utlånade saker</span><strong>${borrowedUnits}</strong></div>
    <div class="stat-card"><span>🎒 Saker totalt</span><strong>${data.items.reduce((n,i)=>n+i.total,0)}</strong></div>
    <div class="stat-card"><span>👥 Elever</span><strong>${data.classes.reduce((n,c)=>n+c.students.length,0)}</strong></div>`;

  ["adminDashboard","adminItems","adminClasses","adminHistory"].forEach(id => $(id).classList.add("hidden"));
  const panel = $(adminTab === "dashboard" ? "adminDashboard" : adminTab === "items" ? "adminItems" : adminTab === "classes" ? "adminClasses" : "adminHistory");
  panel.classList.remove("hidden");

  if (adminTab === "dashboard") renderAdminDashboard(panel);
  if (adminTab === "items") renderAdminItems(panel);
  if (adminTab === "classes") renderAdminClasses(panel);
  if (adminTab === "history") renderAdminHistory(panel);
}

function renderAdminDashboard(panel) {
  const active = data.loans.filter(l => !l.returned);
  panel.innerHTML = `<div class="admin-section"><div class="admin-section-head"><div><h3>Aktiva lån</h3><p>Snabb överblick över vad som är ute.</p></div></div>${active.length ? active.map(l => `<div class="admin-list-row"><span>${l.icon} <strong>${escapeHTML(l.itemName)}</strong><small>${escapeHTML(l.student)} · ${escapeHTML(l.className)}</small></span><button class="return-btn" data-return="${l.id}">Tillbaka</button></div>`).join("") : `<div class="empty-state"><div>✅</div><strong>Inga aktiva lån</strong></div>`}</div>`;
  panel.querySelectorAll("[data-return]").forEach(b => b.onclick = () => returnLoan(b.dataset.return));
}

function renderAdminItems(panel) {
  panel.innerHTML = `<div class="admin-section"><div class="admin-section-head"><div><h3>Saker i boden</h3><p>Ändra namn, antal eller ta bort saker.</p></div><button class="primary-btn" id="addItem">+ Lägg till sak</button></div><div class="admin-table">${data.items.map(i => `<div class="admin-list-row"><span><b>${i.icon} ${escapeHTML(i.name)}</b><small>${escapeHTML(i.category)} · ${i.available}/${i.total} lediga</small></span><span class="admin-row-actions"><button class="ghost-btn" data-edit-item="${i.id}">Redigera</button><button class="danger-btn" data-delete-item="${i.id}">Ta bort</button></span></div>`).join("")}</div></div>`;
  $("addItem").onclick = () => openAdminModal("Lägg till sak", "item");
  panel.querySelectorAll("[data-edit-item]").forEach(b => b.onclick = () => openAdminModal("Redigera sak", "item", b.dataset.editItem));
  panel.querySelectorAll("[data-delete-item]").forEach(b => b.onclick = () => deleteItem(b.dataset.deleteItem));
}

function renderAdminClasses(panel) {
  panel.innerHTML = `<div class="admin-section"><div class="admin-section-head"><div><h3>Klasser och elever</h3><p>Hantera vilka elever som kan väljas vid utlåning.</p></div><button class="primary-btn" id="addClass">+ Lägg till klass</button></div>${data.classes.map(c => `<div class="class-admin-card"><div><strong>Klass ${escapeHTML(c.name)}</strong><span>${c.students.length} elever</span></div><div class="admin-student-list">${c.students.map((s,i)=>`<span>${escapeHTML(s)} <button title="Ta bort elev" data-delete-student="${c.id}|${i}">×</button></span>`).join("")}<button class="add-student-chip" data-add-student="${c.id}">+ Elev</button></div></div>`).join("")}</div>`;
  $("addClass").onclick = () => openAdminModal("Lägg till klass", "class");
  panel.querySelectorAll("[data-add-student]").forEach(b => b.onclick = () => openAdminModal("Lägg till elev", "student", b.dataset.addStudent));
  panel.querySelectorAll("[data-delete-student]").forEach(b => b.onclick = () => { const [cid, idx] = b.dataset.deleteStudent.split("|"); data.classes.find(c=>c.id===cid).students.splice(Number(idx),1); saveData(); renderClasses(); renderAdmin(); });
}

function renderAdminHistory(panel) {
  const history = [...data.loans].sort((a,b) => new Date(b.borrowedAt)-new Date(a.borrowedAt));
  panel.innerHTML = `<div class="admin-section"><div class="admin-section-head"><div><h3>Lånehistorik</h3><p>Alla registrerade lån på den här paddan.</p></div></div>${history.length ? history.map(l => `<div class="admin-list-row"><span>${l.icon} <strong>${escapeHTML(l.itemName)}</strong><small>${escapeHTML(l.student)} · ${escapeHTML(l.className)} · ${formatDate(l.borrowedAt)}</small></span><span class="status-pill ${l.returned ? "returned" : "active"}">${l.returned ? "Återlämnad" : "Utlånad"}</span></div>`).join("") : `<div class="empty-state"><div>📜</div><strong>Ingen historik ännu</strong></div>`}</div>`;
}

function openAdminModal(title, type, id = "") {
  $("adminModalTitle").textContent = title;
  const body = $("adminModalBody");
  body.dataset.type = type;
  body.dataset.id = id;
  if (type === "item") {
    const item = id ? data.items.find(i=>i.id===id) : null;
    body.innerHTML = `<div class="form-grid"><label>Namn<input id="formName" class="admin-input" value="${escapeAttr(item?.name || "")}" placeholder="Ex. Fotboll"></label><label>Kategori<input id="formCategory" class="admin-input" value="${escapeAttr(item?.category || "Sport")}"></label><label>Ikon<input id="formIcon" class="admin-input" value="${escapeAttr(item?.icon || "📦")}" maxlength="4"></label><label>Antal<input id="formTotal" class="admin-input" type="number" min="0" value="${item?.total ?? 1}"></label></div>`;
  } else if (type === "class") {
    body.innerHTML = `<label>Klass<input id="formClassName" class="admin-input" placeholder="Ex. 3A"></label>`;
  } else {
    body.innerHTML = `<label>Elevens namn<input id="formStudentName" class="admin-input" placeholder="Ex. Elias"></label>`;
  }
  $("adminModal").classList.remove("hidden");
  setTimeout(() => body.querySelector("input")?.focus(), 50);
}

$("cancelAdminModal").onclick = () => $("adminModal").classList.add("hidden");
$("saveAdminModal").onclick = saveAdminModal;

function saveAdminModal() {
  const body = $("adminModalBody");
  const type = body.dataset.type;
  const id = body.dataset.id;
  if (type === "item") {
    const name = $("formName").value.trim();
    const category = $("formCategory").value.trim() || "Övrigt";
    const icon = $("formIcon").value.trim() || "📦";
    const total = Math.max(0, Number($("formTotal").value));
    if (!name) return;
    if (id) {
      const item = data.items.find(i=>i.id===id);
      const borrowed = item.total - item.available;
      item.name = name; item.category = category; item.icon = icon; item.total = Math.max(total, borrowed); item.available = item.total - borrowed;
    } else {
      data.items.push({ id: "item-" + Date.now(), name, icon, category, total, available: total });
    }
  } else if (type === "class") {
    const name = $("formClassName").value.trim();
    if (!name || data.classes.some(c=>c.name.toLowerCase()===name.toLowerCase())) return;
    data.classes.push({ id: name.replace(/\s+/g,"-").toUpperCase() + "-" + Date.now(), name, students: [] });
  } else {
    const name = $("formStudentName").value.trim();
    const cls = data.classes.find(c=>c.id===id);
    if (!name || !cls || cls.students.includes(name)) return;
    cls.students.push(name);
  }
  saveData();
  $("adminModal").classList.add("hidden");
  renderClasses(); renderAdmin();
  showToast("Sparat!");
}

function deleteItem(id) {
  const item = data.items.find(i=>i.id===id);
  if (!item) return;
  if (data.loans.some(l => !l.returned && l.itemId === id)) return showToast("Saken är utlånad och kan inte tas bort.");
  if (!confirm(`Ta bort ${item.name}?`)) return;
  data.items = data.items.filter(i=>i.id!==id);
  saveData(); renderAdmin(); showToast("Saken är borttagen.");
}

function getInitials(name) {
  return name.split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase();
}

function formatDate(value) {
  return new Date(value).toLocaleString("sv-SE", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" });
}

function escapeHTML(value) {
  return String(value).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
}

function escapeAttr(value) { return escapeHTML(value); }

document.addEventListener("keydown", e => {
  if (e.key === "Escape") ["confirmModal","pinModal","adminModal"].forEach(id => $(id).classList.add("hidden"));
});

document.querySelectorAll(".modal").forEach(modal => modal.addEventListener("click", e => { if (e.target === modal) modal.classList.add("hidden"); }));

renderClasses();
updateLoanCount();