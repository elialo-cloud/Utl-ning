const data = {
  "1A":["Alma","Leo","William","Maja"],
  "1B":["Ella","Liam","Hugo","Elsa"],
  "2A":["Noah","Olivia","Oscar","Alice"],
  "2B":["Elias","Emma","Lucas","Nora"],
  "3A":["Arvid","Ebba","Isak","Wilma"],
  "3B":["Vera","Theo","Lilly","Axel"]
};

const items = [
  {id:"boll",name:"Fotboll",icon:"⚽",qty:3},
  {id:"basket",name:"Basketboll",icon:"🏀",qty:2},
  {id:"innebandy",name:"Innebandyklubba",icon:"🏑",qty:8},
  {id:"kon",name:"Kon",icon:"🟠",qty:10},
  {id:"hopprep",name:"Hopprep",icon:"🪢",qty:6},
  {id:"vast",name:"Väst",icon:"🦺",qty:12},
  {id:"pingis",name:"Pingisrack",icon:"🏓",qty:4}
];

let loans = JSON.parse(localStorage.getItem("bodenLoans") || "[]");
let selectedClass = null, selectedStudent = null, pendingItem = null;

const $ = s => document.querySelector(s);
const classGrid = $("#classGrid"), studentGrid = $("#studentGrid"), itemGrid = $("#itemGrid");

function save(){ localStorage.setItem("bodenLoans",JSON.stringify(loans)); updateCount(); }
function updateCount(){ $("#loanCount").textContent = loans.length; }

function show(view){
  ["classesView","studentsView","itemsView","loansView"].forEach(id=>$("#"+id).classList.add("hidden"));
  $("#"+view).classList.remove("hidden");
  window.scrollTo({top:0,behavior:"smooth"});
}

function initials(name){return name.split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase()}

function renderClasses(){
  classGrid.innerHTML = Object.entries(data).map(([cls,students])=>`
    <button class="class-card" onclick="chooseClass('${cls}')">
      <div class="class-number">${cls}</div>
      <div class="class-meta">${students.length} elever</div>
    </button>`).join("");
}

window.chooseClass = cls => {
  selectedClass = cls;
  $("#classTitle").textContent = cls;
  renderStudents();
  show("studentsView");
};

function renderStudents(filter=""){
  const students = data[selectedClass].filter(n=>n.toLowerCase().includes(filter.toLowerCase()));
  studentGrid.innerHTML = students.length ? students.map(name=>{
    const count = loans.filter(l=>l.student===name && l.className===selectedClass).length;
    return `<button class="student-card" onclick="chooseStudent('${name.replace(/'/g,"\\'")}')">
      <div class="avatar">${initials(name)}</div>
      <div><div class="student-name">${name}</div><div class="student-loans">${count ? count+" aktivt lån" : "Inga aktiva lån"}</div></div>
    </button>`;
  }).join("") : `<div class="empty" style="grid-column:1/-1">Ingen elev hittades.</div>`;
}

window.chooseStudent = name => {
  selectedStudent = name;
  $("#studentTitle").textContent = name;
  $("#studentSubtitle").textContent = `${selectedClass} · Välj vad eleven lånar`;
  renderItems();
  show("itemsView");
};

function borrowedQty(itemId){
  return loans.filter(l=>l.itemId===itemId).length;
}
function renderItems(){
  itemGrid.innerHTML = items.map(item=>{
    const used=borrowedQty(item.id), available=item.qty-used;
    return `<div class="item-card ${available===0?"unavailable":""}">
      <div class="item-top"><div class="item-icon">${item.icon}</div><span class="step-pill">${available}/${item.qty}</span></div>
      <div class="item-name">${item.name}</div>
      <div class="item-stock">${available===0?"Slut — allt är utlånat":"Tillgängliga just nu"}</div>
      <button class="primary-btn" ${available===0?"disabled":""} onclick="openConfirm('${item.id}')">${available===0?"Ej tillgänglig":"Låna ut"}</button>
    </div>`;
  }).join("");
}

window.openConfirm = itemId => {
  pendingItem = items.find(x=>x.id===itemId);
  $("#modalTitle").textContent = pendingItem.name;
  $("#modalText").textContent = `${selectedStudent} i ${selectedClass} lånar ${pendingItem.name}.`;
  $("#confirmModal").classList.remove("hidden");
};

function closeModal(){$("#confirmModal").classList.add("hidden");pendingItem=null}
$("#cancelModal").onclick=closeModal;
$("#confirmLoan").onclick=()=>{
  loans.push({id:crypto.randomUUID(),itemId:pendingItem.id,itemName:pendingItem.name,icon:pendingItem.icon,student:selectedStudent,className:selectedClass,time:new Date().toISOString()});
  save(); closeModal(); toast(`${pendingItem?.name || "Sak"} utlånad ✓`); renderItems();
};

function renderLoans(){
  const box=$("#loanList");
  if(!loans.length){box.innerHTML=`<div class="empty"><strong>Inga aktiva lån</strong><br>Alla saker är tillbaka i boden.</div>`;return}
  box.innerHTML=loans.slice().reverse().map(l=>`
    <div class="loan-row">
      <div class="loan-info"><div class="loan-dot">${l.icon}</div><div><div class="loan-name">${l.student} · ${l.itemName}</div><div class="loan-meta">${l.className} · ${new Date(l.time).toLocaleString("sv-SE",{hour:"2-digit",minute:"2-digit",day:"numeric",month:"short"})}</div></div></div>
      <button class="return-btn" onclick="returnLoan('${l.id}')">✓ Tillbaka</button>
    </div>`).join("");
}

window.returnLoan=id=>{
  const loan=loans.find(x=>x.id===id);
  loans=loans.filter(x=>x.id!==id); save(); renderLoans(); toast(`${loan.itemName} är tillbaka ✓`);
};

function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),1900)}

$("#loansBtn").onclick=()=>{renderLoans();show("loansView")};
$("#studentSearch").addEventListener("input",e=>renderStudents(e.target.value));
document.querySelectorAll(".back-btn").forEach(b=>b.onclick=()=>show(b.dataset.back==="classes"?"classesView":"studentsView"));
$("#resetBtn").onclick=()=>{if(confirm("Återställa alla demo-lån?")){loans=[];save();renderLoans();toast("Demo återställd")}};
renderClasses();updateCount();
