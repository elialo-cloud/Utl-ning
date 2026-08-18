/* =========================================================
   BODEN — LÅNESYSTEM
   Version 1.0
   ========================================================= */

const STORAGE_KEY = "boden-loans-v1";

/* ---------------------------------------------------------
   DATA
--------------------------------------------------------- */

const initialData = {
  classes: [
    {
      id: "1A",
      name: "1A",
      students: ["Alma", "Elias", "Hugo", "Liam", "Maja", "Noah", "Olivia", "William"]
    },
    {
      id: "1B",
      name: "1B",
      students: ["Alice", "Axel", "Elsa", "Isak", "Leo", "Nora", "Sofia", "Vera"]
    },
    {
      id: "2A",
      name: "2A",
      students: ["Adam", "Ella", "Felix", "Freja", "Loke", "Milo", "Saga", "Wilma"]
    },
    {
      id: "2B",
      name: "2B",
      students: ["Albin", "Ebba", "Harry", "Ida", "Kalle", "Lilly", "Nils", "Tilde"]
    }
  ],

  items: [
    {
      id: "boll",
      name: "Boll",
      icon: "⚽",
      category: "Bollar",
      total: 10,
      available: 10
    },
    {
      id: "innebandy",
      name: "Innebandyklubba",
      icon: "🏑",
      category: "Sport",
      total: 12,
      available: 12
    },
    {
      id: "kon",
      name: "Kon",
      icon: "🔶",
      category: "Lek",
      total: 20,
      available: 20
    },
    {
      id: "hopprep",
      name: "Hopprep",
      icon: "〰️",
      category: "Lek",
      total: 8,
      available: 8
    },
    {
      id: "pingisrack",
      name: "Pingisrack",
      icon: "🏓",
      category: "Sport",
      total: 6,
      available: 6
    },
    {
      id: "rockring",
      name: "Rockring",
      icon: "⭕",
      category: "Lek",
      total: 6,
      available: 6
    },
    {
      id: "fotbollsvast",
      name: "Fotbollsväst",
      icon: "🦺",
      category: "Sport",
      total: 15,
      available: 15
    },
    {
      id: "frisbee",
      name: "Frisbee",
      icon: "🥏",
      category: "Lek",
      total: 5,
      available: 5
    }
  ],

  loans: []
};


/* ---------------------------------------------------------
   STATE
--------------------------------------------------------- */

let data = loadData();

let selectedClass = null;
let selectedStudent = null;
let selectedItem = null;


/* ---------------------------------------------------------
   DOM
--------------------------------------------------------- */

const classGrid = document.getElementById("classGrid");
const studentGrid = document.getElementById("studentGrid");
const itemGrid = document.getElementById("itemGrid");

const classesView = document.getElementById("classesView");
const studentsView = document.getElementById("studentsView");
const itemsView = document.getElementById("itemsView");
const loansView = document.getElementById("loansView");

const classTitle = document.getElementById("classTitle");
const studentTitle = document.getElementById("studentTitle");
const studentSubtitle = document.getElementById("studentSubtitle");

const studentSearch = document.getElementById("studentSearch");

const loanList = document.getElementById("loanList");
const loanCount = document.getElementById("loanCount");

const loansBtn = document.getElementById("loansBtn");
const resetBtn = document.getElementById("resetBtn");

const toast = document.getElementById("toast");

const confirmModal = document.getElementById("confirmModal");
const modalTitle = document.getElementById("modalTitle");
const modalText = document.getElementById("modalText");

const cancelModal = document.getElementById("cancelModal");
const confirmLoan = document.getElementById("confirmLoan");


/* ---------------------------------------------------------
   INIT
--------------------------------------------------------- */

renderClasses();
updateLoanCount();


/* ---------------------------------------------------------
   STORAGE
--------------------------------------------------------- */

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return structuredClone(initialData);
    }

    return JSON.parse(saved);

  } catch (error) {
    console.error("Kunde inte läsa sparad data:", error);
    return structuredClone(initialData);
  }
}


function saveData() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(data)
  );
}


/* ---------------------------------------------------------
   VIEWS
--------------------------------------------------------- */

function showView(view) {

  classesView.classList.add("hidden");
  studentsView.classList.add("hidden");
  itemsView.classList.add("hidden");
  loansView.classList.add("hidden");

  view.classList.remove("hidden");

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


/* ---------------------------------------------------------
   KLASSER
--------------------------------------------------------- */

function renderClasses() {

  classGrid.innerHTML = "";

  data.classes.forEach(cls => {

    const button = document.createElement("button");

    button.className = "class-card";

    button.innerHTML = `
      <div class="class-icon">🏫</div>
      <div>
        <strong>${escapeHTML(cls.name)}</strong>
        <span>${cls.students.length} elever</span>
      </div>
      <div class="arrow">→</div>
    `;

    button.addEventListener("click", () => {
      selectClass(cls);
    });

    classGrid.appendChild(button);
  });
}


function selectClass(cls) {

  selectedClass = cls;
  selectedStudent = null;

  classTitle.textContent = `Klass ${cls.name}`;

  studentSearch.value = "";

  renderStudents();

  showView(studentsView);
}


/* ---------------------------------------------------------
   ELEVER
--------------------------------------------------------- */

function renderStudents() {

  if (!selectedClass) return;

  const search = studentSearch.value
    .trim()
    .toLowerCase();

  const students = selectedClass.students.filter(student =>
    student.toLowerCase().includes(search)
  );

  studentGrid.innerHTML = "";

  if (students.length === 0) {

    studentGrid.innerHTML = `
      <div class="empty-state">
        <div>🔎</div>
        <strong>Ingen elev hittades</strong>
        <span>Testa ett annat namn.</span>
      </div>
    `;

    return;
  }

  students.forEach(student => {

    const button = document.createElement("button");

    button.className = "student-card";

    const studentLoans = data.loans.filter(
      loan =>
        loan.classId === selectedClass.id &&
        loan.student === student &&
        !loan.returned
    );

    button.innerHTML = `
      <div class="avatar">
        ${getInitials(student)}
      </div>

      <div class="student-info">
        <strong>${escapeHTML(student)}</strong>
        <span>
          ${
            studentLoans.length
              ? `${studentLoans.length} aktivt lån`
              : "Inga aktiva lån"
          }
        </span>
      </div>

      <div class="arrow">→</div>
    `;

    button.addEventListener("click", () => {
      selectStudent(student);
    });

    studentGrid.appendChild(button);
  });
}


studentSearch.addEventListener("input", renderStudents);


function selectStudent(student) {

  selectedStudent = student;

  studentTitle.textContent = student;

  studentSubtitle.textContent =
    `Klass ${selectedClass.name} · Välj vad som ska lånas`;

  renderItems();

  showView(itemsView);
}


/* ---------------------------------------------------------
   SAKER
--------------------------------------------------------- */

function renderItems() {

  itemGrid.innerHTML = "";

  data.items.forEach(item => {

    const disabled = item.available <= 0;

    const button = document.createElement("button");

    button.className =
      `item-card ${disabled ? "item-disabled" : ""}`;

    button.disabled = disabled;

    button.innerHTML = `
      <div class="item-icon">
        ${item.icon}
      </div>

      <div class="item-info">
        <strong>${escapeHTML(item.name)}</strong>

        <span>${escapeHTML(item.category)}</span>

        <small class="${
          item.available <= 2
            ? "low-stock"
            : ""
        }">
          ${
            disabled
              ? "Slut"
              : `${item.available} av ${item.total} lediga`
          }
        </small>
      </div>

      <div class="arrow">
        ${disabled ? "—" : "→"}
      </div>
    `;

    if (!disabled) {

      button.addEventListener("click", () => {
        openLoanModal(item);
      });

    }

    itemGrid.appendChild(button);
  });
}


/* ---------------------------------------------------------
   LÅNA
--------------------------------------------------------- */

function openLoanModal(item) {

  selectedItem = item;

  modalTitle.textContent = "Låna ut";

  modalText.innerHTML = `
    <strong>${escapeHTML(selectedStudent)}</strong>
    i klass <strong>${escapeHTML(selectedClass.name)}</strong>
    vill låna <strong>${escapeHTML(item.name)}</strong>.
  `;

  confirmModal.classList.remove("hidden");
}


cancelModal.addEventListener("click", closeModal);


function closeModal() {

  confirmModal.classList.add("hidden");

  selectedItem = null;
}


confirmLoan.addEventListener("click", () => {

  if (
    !selectedClass ||
    !selectedStudent ||
    !selectedItem
  ) {
    return;
  }

  const item = data.items.find(
    x => x.id === selectedItem.id
  );

  if (!item || item.available <= 0) {

    showToast("Saken är slut.");

    closeModal();

    renderItems();

    return;
  }

  const loan = {

    id:
      Date.now().toString() +
      Math.random().toString(36).substring(2),

    classId: selectedClass.id,

    className: selectedClass.name,

    student: selectedStudent,

    itemId: item.id,

    itemName: item.name,

    icon: item.icon,

    borrowedAt: new Date().toISOString(),

    returned: false,

    returnedAt: null
  };

  data.loans.push(loan);

  item.available--;

  saveData();

  updateLoanCount();

  closeModal();

  renderItems();

  renderStudents();

  showToast(
    `${item.name} utlånad till ${selectedStudent}`
  );
});


/* ---------------------------------------------------------
   AKTIVA LÅN
--------------------------------------------------------- */

loansBtn.addEventListener("click", () => {

  renderLoans();

  showView(loansView);
});


function renderLoans() {

  const activeLoans = data.loans.filter(
    loan => !loan.returned
  );

  loanList.innerHTML = "";

  if (activeLoans.length === 0) {

    loanList.innerHTML = `
      <div class="empty-state">
        <div>📦</div>
        <strong>Inga aktiva lån</strong>
        <span>Alla saker finns i boden.</span>
      </div>
    `;

    return;
  }

  activeLoans
    .sort(
      (a, b) =>
        new Date(b.borrowedAt) -
        new Date(a.borrowedAt)
    )
    .forEach(loan => {

      const article = document.createElement("article");

      article.className = "loan-card";

      article.innerHTML = `

        <div class="loan-item-icon">
          ${loan.icon}
        </div>

        <div class="loan-info">

          <strong>
            ${escapeHTML(loan.itemName)}
          </strong>

          <span>
            ${escapeHTML(loan.student)}
            · Klass ${escapeHTML(loan.className)}
          </span>

          <small>
            Utlånad ${formatDate(loan.borrowedAt)}
          </small>

        </div>

        <button
          class="return-btn"
          data-id="${loan.id}"
        >
          Lämna tillbaka
        </button>
      `;

      article
        .querySelector(".return-btn")
        .addEventListener("click", () => {
          returnLoan(loan.id);
        });

      loanList.appendChild(article);
    });
}


/* ---------------------------------------------------------
   ÅTERLÄMNING
--------------------------------------------------------- */

function returnLoan(loanId) {

  const loan = data.loans.find(
    x => x.id === loanId
  );

  if (!loan || loan.returned) {
    return;
  }

  loan.returned = true;

  loan.returnedAt =
    new Date().toISOString();

  const item = data.items.find(
    x => x.id === loan.itemId
  );

  if (item) {
    item.available = Math.min(
      item.available + 1,
      item.total
    );
  }

  saveData();

  updateLoanCount();

  renderLoans();

  showToast(
    `${loan.itemName} är tillbaka i boden`
  );
}


/* ---------------------------------------------------------
   LÅNEANTAL
--------------------------------------------------------- */

function updateLoanCount() {

  const count = data.loans.filter(
    loan => !loan.returned
  ).length;

  loanCount.textContent = count;
}


/* ---------------------------------------------------------
   RESET
--------------------------------------------------------- */

resetBtn.addEventListener("click", () => {

  const confirmed = confirm(
    "Vill du verkligen återställa hela demosystemet?"
  );

  if (!confirmed) return;

  data = structuredClone(initialData);

  saveData();

  selectedClass = null;
  selectedStudent = null;
  selectedItem = null;

  updateLoanCount();

  renderClasses();

  showView(classesView);

  showToast("Demosystemet är återställt.");
});


/* ---------------------------------------------------------
   BACK-KNAPPAR
--------------------------------------------------------- */

document
  .querySelectorAll("[data-back]")
  .forEach(button => {

    button.addEventListener("click", () => {

      const target = button.dataset.back;

      if (target === "classes") {

        selectedClass = null;
        selectedStudent = null;

        showView(classesView);

      }

      if (target === "students") {

        selectedStudent = null;

        renderStudents();

        showView(studentsView);
      }

    });
  });


/* ---------------------------------------------------------
   TOAST
--------------------------------------------------------- */

let toastTimer;

function showToast(message) {

  toast.textContent = message;

  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {

    toast.classList.remove("show");

  }, 3000);
}


/* ---------------------------------------------------------
   HJÄLPFUNKTIONER
--------------------------------------------------------- */

function getInitials(name) {

  return name
    .split(" ")
    .map(word => word[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}


function formatDate(dateString) {

  const date = new Date(dateString);

  return date.toLocaleString("sv-SE", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}


function escapeHTML(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* ---------------------------------------------------------
   ESCAPE STÄNGER MODAL
--------------------------------------------------------- */

document.addEventListener("keydown", event => {

  if (event.key === "Escape") {

    if (!confirmModal.classList.contains("hidden")) {
      closeModal();
    }

  }

});


/* ---------------------------------------------------------
   KLICK UTANFÖR MODAL
--------------------------------------------------------- */

confirmModal.addEventListener("click", event => {

  if (event.target === confirmModal) {
    closeModal();
  }

});
