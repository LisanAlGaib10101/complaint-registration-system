const LS_KEY = 'complaints';

const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

const getComplaints = () => JSON.parse(localStorage.getItem(LS_KEY) || '[]');
const saveComplaints = (data) => localStorage.setItem(LS_KEY, JSON.stringify(data));

const toast = (msg) => {
  let t = $('#toast');
  if(!t){ t = document.createElement('div'); t.id='toast'; Object.assign(t.style,{position:'fixed',bottom:'16px',right:'16px',background:'#263238',color:'#fff',padding:'10px 14px',borderRadius:'8px'}); document.body.appendChild(t); }
  t.textContent = msg; t.style.opacity='1'; setTimeout(()=> t.style.opacity='0', 2000);
};

const deptFilter = $('#deptFilter');
const statusFilter = $('#statusFilter');
const searchInput = $('#searchInput');
const tbody = $('#complaintsTable tbody');
const cards = $('#complaintCards');

const buildDeptOptions = () => {
  const depts = Array.from(new Set(getComplaints().map(c => c.department))).sort();
  deptFilter.innerHTML = `<option value="all">All departments</option>` + depts.map(d=>`<option value="${d}">${d}</option>`).join('');
};

const filters = () => ({
  q: (searchInput.value || '').toLowerCase(),
  dept: deptFilter?.value || 'all',
  status: statusFilter?.value || 'all'
});

const applyFilters = (list) => {
  const f = filters();
  return list.filter(c => {
    const matchesQ = [c.name, c.department, c.title].some(v => (v||'').toLowerCase().includes(f.q));
    const matchesDept = f.dept === 'all' || c.department === f.dept;
    const matchesStatus = f.status === 'all' || c.status === f.status;
    return matchesQ && matchesDept && matchesStatus;
  });
};

function render(){
  const data = applyFilters(getComplaints());
  // Table
  tbody.innerHTML = data.map((c, idx) => `
    <tr>
      <td>${c.name}</td>
      <td>${c.department}</td>
      <td>${c.title}</td>
      <td>${c.description.length>120? c.description.slice(0,120)+'…' : c.description}</td>
      <td style="font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace">${c.time || ''}</td>
      <td><span class="badge ${c.status}">${c.status==='pending'?'• Pending':'✓ Resolved'}</span></td>
      <td>
        <button class="btn btn-ghost" data-act="toggle" data-idx="${idx}">${c.status==='pending'?'Mark resolved':'Mark pending'}</button>
        <button class="btn btn-danger" data-act="delete" data-idx="${idx}">Delete</button>
      </td>
    </tr>`).join('');

  // Cards (mobile)
  cards.innerHTML = data.map((c, idx) => `
    <div class="complaint-card">
      <div class="title">${c.title}</div>
      <div class="row"><span>${c.name}</span><span>${c.department}</span></div>
      <div>${c.description}</div>
      <div class="row"><span>${c.time || ''}</span><span class="badge ${c.status}">${c.status==='pending'?'• Pending':'✓ Resolved'}</span></div>
      <div class="card-actions">
        <button class="btn btn-ghost" data-act="toggle" data-idx="${idx}">${c.status==='pending'?'Resolve':'Reopen'}</button>
        <button class="btn btn-danger" data-act="delete" data-idx="${idx}">Delete</button>
      </div>
    </div>`).join('');
}

document.getElementById("complaintForm").addEventListener('submit', (e)=>{
  e.preventDefault();
  const name = $('#name').value.trim();
  const department = $('#department').value.trim();
  const title = $('#title').value.trim();
  const description = $('#description').value.trim();
  const time = new Date().toLocaleString();

  const list = getComplaints();
  list.push({name, department, title, description, time, status:'pending'});
  saveComplaints(list);
  e.target.reset();
  buildDeptOptions();
  render();
  toast('Complaint submitted');
});

document.addEventListener('click', (e)=>{
  const btn = e.target.closest('button[data-act]');
  if(!btn) return;
  const idx = +btn.dataset.idx;
  const act = btn.dataset.act;
  const list = getComplaints();
  if(act==='toggle'){
    list[idx].status = list[idx].status==='pending' ? 'resolved':'pending';
    saveComplaints(list); render();
  } else if(act==='delete'){
    if(confirm('Delete this complaint?')){ list.splice(idx,1); saveComplaints(list); buildDeptOptions(); render(); toast('Deleted'); }
  }
});

const debounce = (fn, ms=250) => { let t; return (...args)=>{ clearTimeout(t); t=setTimeout(()=>fn(...args), ms); } };
[searchInput, statusFilter, deptFilter].forEach(el => el && el.addEventListener('input', debounce(render, 250)));

buildDeptOptions();
render();
