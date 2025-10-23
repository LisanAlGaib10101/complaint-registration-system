const LS_KEY = 'complaints';

const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

const getComplaints = () => JSON.parse(localStorage.getItem(LS_KEY) || '[]');
const saveComplaints = (data) => localStorage.setItem(LS_KEY, JSON.stringify(data));

// Enhanced toast with slide animation
const toast = (msg, type = 'info') => {
  let t = $('#toast');
  if(!t){ 
    t = document.createElement('div'); 
    t.id='toast'; 
    document.body.appendChild(t); 
  }
  
  t.classList.remove('hiding');
  
  const colors = {
    success: 'var(--success)',
    error: 'var(--danger)',
    info: 'var(--primary)'
  };
  t.style.background = colors[type] || colors.info;
  t.style.color = 'white';
  
  t.textContent = msg; 
  t.style.opacity = '1';
  
  setTimeout(() => {
    t.classList.add('hiding');
    setTimeout(() => {
      t.style.opacity = '0';
      t.classList.remove('hiding');
    }, 300);
  }, 2500);
};

// Loading skeleton generator
const showLoadingSkeleton = (container, rows = 3) => {
  const skeletons = Array.from({length: rows}, () => 
    '<div class="skeleton skeleton-row"></div>'
  ).join('');
  container.innerHTML = skeletons;
};

// Animate number count-up
const animateCounter = (element, target, duration = 800) => {
  const start = parseInt(element.textContent) || 0;
  const increment = (target - start) / (duration / 16);
  let current = start;
  
  const timer = setInterval(() => {
    current += increment;
    if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
      element.textContent = target;
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(current);
    }
  }, 16);
};

// Add status change animation
const animateStatusChange = (badge) => {
  badge.classList.add('status-changed');
  setTimeout(() => badge.classList.remove('status-changed'), 500);
};

// Theme management
const themeManager = {
  key: 'app-theme',
  
  init() {
    const saved = localStorage.getItem(this.key);
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (systemDark ? 'dark' : 'light');
    this.apply(theme);
    this.setupListeners();
  },
  
  apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(this.key, theme);
    
    // Update active state in menu
    document.querySelectorAll('.theme-option').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === theme);
    });
  },
  
  setupListeners() {
    const toggleBtn = $('#themeToggle');
    const menu = $('#themeMenu');
    
    if (!toggleBtn || !menu) return;
    
    // Toggle menu
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('active');
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.theme-switcher')) {
        menu.classList.remove('active');
      }
    });
    
    // Theme selection
    document.querySelectorAll('.theme-option').forEach(btn => {
      btn.addEventListener('click', () => {
        this.apply(btn.dataset.theme);
        menu.classList.remove('active');
        toast(`Switched to ${btn.textContent.trim().split(' ')[1]} theme`, 'success');
      });
    });
  }
};

// Initialize after DOM is ready
function init() {
  const deptFilter = $('#deptFilter');
  const statusFilter = $('#statusFilter');
  const searchInput = $('#searchInput');
  const tbody = $('#complaintsTable tbody');
  const cards = $('#complaintCards');
  const form = $('#complaintForm');
  const filterChipsContainer = $('#filterChips');

  if (!tbody || !cards || !form) {
    console.error('Required DOM elements not found');
    return;
  }

  // Form progress indicator
  const updateFormProgress = () => {
    const fields = ['#name', '#department', '#title', '#description'];
    const filled = fields.filter(sel => $(sel)?.value.trim()).length;
    const progress = (filled / fields.length) * 100;
    
    const progressBar = $('.progress-fill');
    if (progressBar) progressBar.style.width = `${progress}%`;
  };

  // Character counter for description
  const updateCharCount = () => {
    const desc = $('#description');
    const counter = $('#charCounter');
    if (!desc || !counter) return;
    
    const length = desc.value.length;
    const max = 500;
    counter.textContent = `${length}/${max}`;
    
    if (length > max * 0.9) counter.style.color = 'var(--danger)';
    else if (length > max * 0.7) counter.style.color = 'var(--pending)';
    else counter.style.color = 'var(--muted)';
  };

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

  // Show active filter chips
  const updateFilterChips = () => {
    if (!filterChipsContainer) return;
    
    const chips = [];
    const f = filters();
    
    if (f.q) chips.push({type: 'search', label: `Search: "${f.q}"`});
    if (f.dept !== 'all') chips.push({type: 'dept', label: `Dept: ${f.dept}`});
    if (f.status !== 'all') chips.push({type: 'status', label: `Status: ${f.status}`});
    
    filterChipsContainer.innerHTML = chips.map(chip => `
      <span class="filter-chip">
        ${chip.label}
        <span class="remove" onclick="clearFilter('${chip.type}')">×</span>
      </span>
    `).join('');
  };

  window.clearFilter = (type) => {
    if (type === 'search') searchInput.value = '';
    if (type === 'dept') deptFilter.value = 'all';
    if (type === 'status') statusFilter.value = 'all';
    render();
  };

  // Update stats with animation
  const updateStats = () => {
    const all = getComplaints();
    const pending = all.filter(c => c.status === 'pending').length;
    const resolved = all.filter(c => c.status === 'resolved').length;
    
    if ($('#totalCount')) animateCounter($('#totalCount'), all.length);
    if ($('#pendingCount')) animateCounter($('#pendingCount'), pending);
    if ($('#resolvedCount')) animateCounter($('#resolvedCount'), resolved);
  };

  function render() {
    const allData = getComplaints();
    const data = applyFilters(allData);
    
    // Render table
    tbody.innerHTML = data.length ? data.map((c, idx) => {
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
          <td><span class="badge ${c.status}" data-idx="${realIdx}">${c.status === 'pending' ? '• Pending' : '✓ Resolved'}</span></td>
          <td>
            <button class="btn btn-ghost" data-act="toggle" data-idx="${realIdx}">${c.status === 'pending' ? 'Resolve' : 'Reopen'}</button>
            <button class="btn btn-danger" data-act="delete" data-idx="${realIdx}" style="margin-left: 8px;">Delete</button>
          </td>
        </tr>`;
    }).join('') : '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--muted);">No complaints found</td></tr>';

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
          <div class="row"><span style="font-size: 12px;">${c.time || ''}</span><span class="badge ${c.status}" data-idx="${realIdx}">${c.status === 'pending' ? '• Pending' : '✓ Resolved'}</span></div>
          <div class="card-actions">
            <button class="btn btn-ghost" data-act="toggle" data-idx="${realIdx}">${c.status === 'pending' ? 'Mark resolved' : 'Reopen'}</button>
            <button class="btn btn-danger" data-act="delete" data-idx="${realIdx}">Delete</button>
          </div>
        </div>`;
    }).join('') : '<div style="text-align:center;padding:24px;color:var(--muted);">No complaints to display</div>';

    updateStats();
    updateFilterChips();
  }

  // Form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#name')?.value.trim();
    const department = $('#department')?.value.trim();
    const title = $('#title')?.value.trim();
    const description = $('#description')?.value.trim();
    
    if (!name || !department || !title || !description) {
      toast('Please fill all fields', 'error');
      return;
    }

    const time = new Date().toLocaleString();
    const list = getComplaints();
    list.push({ name, department, title, description, time, status: 'pending' });
    saveComplaints(list);
    
    form.reset();
    updateFormProgress();
    updateCharCount();
    buildDeptOptions();
    render();
    toast('Complaint submitted successfully', 'success');
  });

  // Action buttons (toggle/delete) and badge clicks
  document.addEventListener('click', (e) => {
    // Handle badge clicks
    const badge = e.target.closest('.badge');
    if (badge && badge.dataset.idx !== undefined) {
      const btn = badge.closest('tr, .complaint-card')?.querySelector('[data-act="toggle"]');
      if (btn) {
        btn.click();
        return;
      }
    }

    // Handle button clicks
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    
    const idx = +btn.dataset.idx;
    const act = btn.dataset.act;
    const list = getComplaints();
    
    if (act === 'toggle') {
      list[idx].status = list[idx].status === 'pending' ? 'resolved' : 'pending';
      saveComplaints(list);
      render();
      
      // Animate the badge after render
      setTimeout(() => {
        const updatedBadge = document.querySelector(`.badge[data-idx="${idx}"]`);
        if (updatedBadge) animateStatusChange(updatedBadge);
      }, 50);
      
      toast(`Complaint marked as ${list[idx].status}`, 'success');
    } else if (act === 'delete') {
      if (confirm('Delete this complaint? This action cannot be undone.')) {
        list.splice(idx, 1);
        saveComplaints(list);
        buildDeptOptions();
        render();
        toast('Complaint deleted', 'info');
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

  // Wire up form progress and char counter
  ['#name', '#department', '#title', '#description'].forEach(sel => {
    $(sel)?.addEventListener('input', updateFormProgress);
  });

  $('#description')?.addEventListener('input', updateCharCount);

  // Initial render
  buildDeptOptions();
  render();
}

// Execute when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    themeManager.init();
    init();
  });
} else {
  themeManager.init();
  init();
}
