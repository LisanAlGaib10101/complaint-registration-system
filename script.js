const LS_KEY = 'complaints';

const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

const getComplaints = () => JSON.parse(localStorage.getItem(LS_KEY) || '[]');
const saveComplaints = (data) => localStorage.setItem(LS_KEY, JSON.stringify(data));

const toast = (msg) => {
  let t = $('#toast');
  if(!t){ 
    t = document.createElement('div'); 
    t.id='toast'; 
    document.body.appendChild(t); 
  }
  t.textContent = msg; 
  t.style.opacity='1'; 
  setTimeout(()=> t.style.opacity='0', 2500);
};

// Initialize after DOM is ready
function init() {
  const deptFilter = $('#deptFilter');
  const statusFilter = $('#statusFilter');
  const searchInput = $('#searchInput');
  const tbody = $('#complaintsTable tbody');
  const cards = $('#complaintCards');
  const form = $('#complaintForm');

  // Guard against missing elements
  if (!tbody || !cards || !form) {
    console.error('Required DOM elements not found');
    return;
  }

  const buildDeptOptions = () => {
    if (!deptFilter) return;
    const depts = Array.from(new Set(getComplaints().map(c => c.department))).sort();
    deptFilter.innerHTML = `<option value="all">All departments</option>` + 
      depts.map(d => `<option value="${d}">${d}</option>`).join('');
  };

  const filters = () => ({
    q: (searchInput?.value || '').toLowerCase(),
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

  function render() {
    const allData = getComplaints();
    const data = applyFilters(allData);
    
    // Render table
    tbody.innerHTML = data.length ? data.map((c, idx) => {
      // Find real index in unfiltered array for actions
      const realIdx = allData.findIndex(item => 
        item.name === c.name && 
        item.department === c.department && 
        item.time === c.time
      );
      
      return `
        <tr>
          <td>${c.name}</td>
          <td>${c.department}</td>
          <td>${c.title}</td>
          <td>${c.description.length > 100 ? c.description.slice(0, 100) + '…' : c.description}</td>
          <td style="font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 13px;">${c.time || ''}</td>
          <td><span class="badge ${c.status}">${c.status === 'pending' ? '• Pending' : '✓ Resolved'}</span></td>
          <td>
            <button class="btn btn-ghost" data-act="toggle" data-idx="${realIdx}">${c.status === 'pending' ? 'Resolve' : 'Reopen'}</button>
            <button class="btn btn-danger" data-act="delete" data-idx="${realIdx}" style="margin-left: 8px;">Delete</button>
          </td>
        </tr>`;
    }).join('') : '<tr><td colspan="7" style="text-align:center;padding:24px;color:#90a4ae;">No complaints found</td></tr>';

    // Render mobile cards
    cards.innerHTML = data.length ? data.map((c, idx) => {
      const realIdx = allData.findIndex(item => 
        item.name === c.name && 
        item.department === c.department && 
        item.time === c.time
      );
      
      return `
        <div class="complaint-card">
          <div class="title">${c.title}</div>
          <div class="row"><span><strong>${c.name}</strong></span><span>${c.department}</span></div>
          <div style="margin: 12px 0; color: var(--text);">${c.description}</div>
          <div class="row"><span style="font-size: 12px;">${c.time || ''}</span><span class="badge ${c.status}">${c.status === 'pending' ? '• Pending' : '✓ Resolved'}</span></div>
          <div class="card-actions">
            <button class="btn btn-ghost" data-act="toggle" data-idx="${realIdx}">${c.status === 'pending' ? 'Mark resolved' : 'Reopen'}</button>
            <button class="btn btn-danger" data-act="delete" data-idx="${realIdx}">Delete</button>
          </div>
        </div>`;
    }).join('') : '<div style="text-align:center;padding:24px;color:#90a4ae;">No complaints to display</div>';
  }

  // Form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#name')?.value.trim();
    const department = $('#department')?.value.trim();
    const title = $('#title')?.value.trim();
    const description = $('#description')?.value.trim();
    
    if (!name || !department || !title || !description) {
      toast('Please fill all fields');
      return;
    }

    const time = new Date().toLocaleString();
    const list = getComplaints();
    list.push({ name, department, title, description, time, status: 'pending' });
    saveComplaints(list);
    
    form.reset();
    buildDeptOptions();
    render();
    toast('Complaint submitted successfully');
  });

  // Action buttons (toggle/delete)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    
    const idx = +btn.dataset.idx;
    const act = btn.dataset.act;
    const list = getComplaints();
    
    if (act === 'toggle') {
      list[idx].status = list[idx].status === 'pending' ? 'resolved' : 'pending';
      saveComplaints(list);
      render();
      toast(`Complaint marked as ${list[idx].status}`);
    } else if (act === 'delete') {
      if (confirm('Delete this complaint? This action cannot be undone.')) {
        list.splice(idx, 1);
        saveComplaints(list);
        buildDeptOptions();
        render();
        toast('Complaint deleted');
      }
    }
  });

  // Debounced search/filter
  const debounce = (fn, ms = 250) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
  };

  [searchInput, statusFilter, deptFilter].forEach(el => {
    if (el) el.addEventListener('input', debounce(render, 250));
  });

  // Initial render
  buildDeptOptions();
  render();
}

// Execute when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
