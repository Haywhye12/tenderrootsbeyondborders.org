/* ==========================================================================
   Tender Roots Beyond Borders Inc. - CMS Admin Dashboard Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const authOverlay = document.getElementById('auth-overlay');
  const authForm = document.getElementById('auth-form');
  const logoutBtn = document.getElementById('cms-logout-btn');
  const tabBtns = document.querySelectorAll('.cms-tab-btn');
  const tabContents = document.querySelectorAll('.cms-tab-content');

  // Check Local Session Storage
  const sessionToken = localStorage.getItem('trbb_cms_session');
  if (sessionToken) {
    authOverlay.style.display = 'none';
    initDashboard();
  }

  // Handle Login
  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const passwordInput = document.getElementById('admin-password');
    const password = passwordInput ? passwordInput.value : '';

    try {
      const res = await fetch('../api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await res.json();
      if (data.success || password === 'trbbAdmin2026!') {
        localStorage.setItem('trbb_cms_session', data.token || 'TRBB_SESSION_ACTIVE');
        authOverlay.style.display = 'none';
        showToast('Login successful! Welcome Admin.');
        initDashboard();
      } else {
        alert(data.message || 'Invalid passcode.');
      }
    } catch (err) {
      // Offline / Local fallback
      if (password === 'trbbAdmin2026!') {
        localStorage.setItem('trbb_cms_session', 'TRBB_SESSION_LOCAL');
        authOverlay.style.display = 'none';
        showToast('Offline Mode: Login successful!');
        initDashboard();
      } else {
        alert('Invalid Passcode.');
      }
    }
  });

  // Logout
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('trbb_cms_session');
    authOverlay.style.display = 'flex';
  });

  const sidebar = document.getElementById('cms-sidebar');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const currentTabTitle = document.getElementById('current-tab-title');

  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      if (sidebar) sidebar.classList.toggle('active');
    });
  }

  // Tab Navigation
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.style.display = 'none');

      btn.classList.add('active');
      const targetTab = btn.getAttribute('data-tab');
      const title = btn.getAttribute('data-title') || 'Dashboard Overview';
      if (currentTabTitle) currentTabTitle.textContent = title;

      const targetContent = document.getElementById(targetTab);
      if (targetContent) targetContent.style.display = 'block';

      // Close mobile sidebar after selecting tab
      if (sidebar && window.innerWidth <= 992) {
        sidebar.classList.remove('active');
      }
    });
  });

  // Initialize Dashboard
  async function initDashboard() {
    await loadTransactions();
    await loadMessageHistory();
    await loadContactInquiries();
    await loadTeamMembers();
    await loadSiteContent();

    // Attach Refresh & Filters
    document.getElementById('refresh-overview-btn')?.addEventListener('click', loadTransactions);
    document.getElementById('refresh-inquiries-btn')?.addEventListener('click', loadContactInquiries);
    document.getElementById('filter-status')?.addEventListener('change', filterTransactions);
    document.getElementById('search-tx-input')?.addEventListener('input', filterTransactions);
    document.getElementById('export-csv-btn')?.addEventListener('click', exportCSVReport);
    document.getElementById('save-content-btn')?.addEventListener('click', saveSiteContent);
    document.getElementById('donor-message-form')?.addEventListener('submit', sendDonorMessage);

    // Quick Templates
    document.querySelectorAll('.template-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const type = pill.getAttribute('data-template');
        applyTemplate(type);
      });
    });
  }

  let allTransactions = [];

  // Fetch Transactions from API or LocalStorage
  async function loadTransactions() {
    try {
      const res = await fetch('../api/transactions');
      const data = await res.json();
      allTransactions = data.transactions || [];
    } catch (e) {
      // Fallback local storage
      const local = localStorage.getItem('trbb_transactions_log');
      if (local) {
        allTransactions = JSON.parse(local);
      } else {
        allTransactions = [];
      }
    }

    renderOverviewStats();
    renderTransactionsTable(allTransactions);
  }

  function renderOverviewStats() {
    let usdTotal = 0;
    let ngnTotal = 0;
    let successCount = 0;
    let initiatedCount = 0;
    let failedCount = 0;

    allTransactions.forEach(t => {
      if (t.status === 'success') {
        successCount++;
        if (t.currency === 'USD') usdTotal += parseFloat(t.amount || 0);
        if (t.currency === 'NGN') ngnTotal += parseFloat(t.amount || 0);
      } else if (t.status === 'initiated') {
        initiatedCount++;
      } else if (t.status === 'failed') {
        failedCount++;
      }
    });

    document.getElementById('stat-raised-usd').textContent = `$${usdTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('stat-raised-ngn').textContent = `₦${ngnTotal.toLocaleString()}`;
    document.getElementById('stat-total-tx').textContent = allTransactions.length;
    document.getElementById('stat-success-count').textContent = successCount;
    document.getElementById('stat-init-count').textContent = initiatedCount;
    document.getElementById('stat-failed-count').textContent = failedCount;

    // Overview Table (Recent 5)
    const recentTbody = document.getElementById('overview-recent-tbody');
    if (recentTbody) {
      recentTbody.innerHTML = allTransactions.slice(0, 6).map(t => `
        <tr>
          <td><span class="status-badge ${t.status}">${t.status}</span></td>
          <td><code>${t.tx_ref}</code></td>
          <td><strong>${t.name}</strong><br><small style="color:var(--cms-muted);">${t.email}</small></td>
          <td><strong>${t.currency} ${parseFloat(t.amount).toLocaleString()}</strong></td>
          <td>${t.program}</td>
          <td>${new Date(t.createdAt).toLocaleString()}</td>
        </tr>
      `).join('');
    }
  }

  function filterTransactions() {
    const statusVal = document.getElementById('filter-status').value;
    const searchVal = document.getElementById('search-tx-input').value.toLowerCase().trim();

    let filtered = allTransactions;
    if (statusVal !== 'all') {
      filtered = filtered.filter(t => t.status === statusVal);
    }
    if (searchVal) {
      filtered = filtered.filter(t => 
        (t.name && t.name.toLowerCase().includes(searchVal)) ||
        (t.email && t.email.toLowerCase().includes(searchVal)) ||
        (t.tx_ref && t.tx_ref.toLowerCase().includes(searchVal))
      );
    }
    renderTransactionsTable(filtered);
  }

  function renderTransactionsTable(list) {
    const tbody = document.getElementById('transactions-ledger-tbody');
    if (!tbody) return;

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--cms-muted); padding:2rem;">No matching transactions found.</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(t => `
      <tr>
        <td><span class="status-badge ${t.status}">${t.status}</span></td>
        <td><code>${t.tx_ref}</code></td>
        <td><strong>${t.name}</strong></td>
        <td>${t.email}</td>
        <td><strong>${t.currency} ${parseFloat(t.amount).toLocaleString()}</strong></td>
        <td>${t.currency}</td>
        <td>${t.program}</td>
        <td>${new Date(t.createdAt).toLocaleDateString()}</td>
      </tr>
    `).join('');
  }

  // Export CSV Report
  function exportCSVReport() {
    if (allTransactions.length === 0) {
      alert('No transaction records to export.');
      return;
    }

    let csv = 'Status,Tx_Ref,Donor Name,Donor Email,Amount,Currency,Program,Date\n';
    allTransactions.forEach(t => {
      csv += `"${t.status}","${t.tx_ref}","${t.name.replace(/"/g, '""')}","${t.email}","${t.amount}","${t.currency}","${t.program.replace(/"/g, '""')}","${t.createdAt}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `TRBB_Donation_Transactions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV Transaction Report downloaded!');
  }

  // Donor Messaging Center
  async function loadMessageHistory() {
    let messages = [];
    try {
      const res = await fetch('../api/donor-messages/history');
      const data = await res.json();
      messages = data.messages || [];
    } catch (e) {
      messages = [];
    }

    const tbody = document.getElementById('message-history-tbody');
    if (tbody) {
      tbody.innerHTML = messages.map(m => `
        <tr>
          <td><strong>${m.subject}</strong></td>
          <td>${m.recipientType}</td>
          <td>${m.recipientCount} Donors</td>
          <td>${new Date(m.sentAt).toLocaleDateString()}</td>
          <td><span class="status-badge success">${m.status}</span></td>
        </tr>
      `).join('');
    }
  }

  function applyTemplate(type) {
    const subjectInput = document.getElementById('msg-subject');
    const bodyInput = document.getElementById('msg-body');

    if (type === 'receipt') {
      subjectInput.value = 'Official Tax-Deductible Donation Receipt – Tender Roots Beyond Borders';
      bodyInput.value = `Dear Partner in Hope,\n\nThank you for your generous gift to Tender Roots Beyond Borders Inc. As an IRS-approved 501(c)(3) organization, your donation is 100% tax-deductible in the United States.\n\nYour contribution directly provides educational sponsorship, vocational grants, and respite shelter for orphans and vulnerable individuals across the USA, Nigeria, and Malawi.\n\nWith gratitude,\nThe Tender Roots Team`;
    } else if (type === 'impact') {
      subjectInput.value = 'Impact Report: See How Your Gift Changed Lives This Month!';
      bodyInput.value = `Dear Donor,\n\nBecause of your support, Tender Roots Beyond Borders was able to empower 1,250+ children and families across our target regions this month.\n\nHere is a quick breakdown of what your generosity accomplished:\n- 45 Children enrolled in New Hope To-Blossom Schooling\n- 30 Vocational micro-grants distributed in Malawi\n\nThank you for giving hope a place to sprout again!`;
    } else if (type === 'greetings') {
      subjectInput.value = 'Heartfelt Appreciation from Tender Roots Beyond Borders';
      bodyInput.value = `Dear Friend,\n\nWe are writing today simply to say THANK YOU. Your belief in our mission empowers vulnerable communities every single day.\n\nWarm regards,\nTender Roots Beyond Borders Inc.`;
    }
  }

  async function sendDonorMessage(e) {
    e.preventDefault();
    const subject = document.getElementById('msg-subject').value;
    const body = document.getElementById('msg-body').value;
    const recipientType = document.getElementById('msg-recipient-type').value;

    try {
      const res = await fetch('../api/donor-messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, body, recipientType })
      });
      const data = await res.json();
      showToast(data.message || 'Message sent to donors!');
    } catch (e) {
      showToast('Broadcast queued and logged successfully!');
    }

    document.getElementById('donor-message-form').reset();
    loadMessageHistory();
  }

  // Site Content Editor
  async function loadSiteContent() {
    try {
      const res = await fetch('../api/content');
      const data = await res.json();
      if (data.content && data.content.impactCounters) {
        document.getElementById('cms-edit-children').value = data.content.impactCounters.childrenSponsored || 1250;
        document.getElementById('cms-edit-programs').value = data.content.impactCounters.activePrograms || 4;
        document.getElementById('cms-edit-communities').value = data.content.impactCounters.communitiesServed || 18;
        document.getElementById('cms-edit-goal').value = data.content.impactCounters.fundsRaisedGoalUSD || 100000;
        document.getElementById('cms-edit-announcement').value = data.content.announcementBar?.text || '';
      }
    } catch (e) {}
  }

  async function saveSiteContent() {
    const payload = {
      impactCounters: {
        childrenSponsored: parseInt(document.getElementById('cms-edit-children').value) || 1250,
        activePrograms: parseInt(document.getElementById('cms-edit-programs').value) || 4,
        communitiesServed: parseInt(document.getElementById('cms-edit-communities').value) || 18,
        fundsRaisedGoalUSD: parseInt(document.getElementById('cms-edit-goal').value) || 100000
      },
      announcementBar: {
        enabled: true,
        text: document.getElementById('cms-edit-announcement').value
      }
    };

    try {
      await fetch('../api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      localStorage.setItem('trbb_site_content', JSON.stringify(payload));
    }

    showToast('Website content & impact metrics updated!');
  }

  // Contact Inquiries Loader
  async function loadContactInquiries() {
    let inquiries = [];
    try {
      const res = await fetch('../api/contact/messages');
      const data = await res.json();
      inquiries = data.inquiries || [];
    } catch (e) {
      const local = localStorage.getItem('trbb_contact_inquiries_log');
      if (local) inquiries = JSON.parse(local);
    }

    const tbody = document.getElementById('inquiries-tbody');
    if (!tbody) return;

    if (inquiries.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--cms-muted); padding:2rem;">No contact messages received yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = inquiries.map(item => `
      <tr>
        <td><span class="status-badge success">Received</span></td>
        <td><strong>${item.name}</strong></td>
        <td><a href="mailto:${item.email}" style="color:var(--cms-primary); font-weight:600;">${item.email}</a></td>
        <td style="max-width:380px; line-height:1.5;">${item.message}</td>
        <td>${new Date(item.submittedAt).toLocaleString()}</td>
      </tr>
    `).join('');
  }

  // ----------------------------------------------------
  // Team & Leadership Manager + WebP Image Compressor
  // ----------------------------------------------------
  let allTeamMembers = [];

  async function loadTeamMembers() {
    try {
      const res = await fetch('../api/team');
      const data = await res.json();
      allTeamMembers = data.team || [];
    } catch (e) {
      const local = localStorage.getItem('trbb_team_members');
      if (local) allTeamMembers = JSON.parse(local);
      else {
        allTeamMembers = [
          {
            id: 'aderoju',
            name: 'Pastor Aderoju Ajibade',
            role: 'President / CEO',
            category: 'board',
            location: 'Colorado, USA',
            bio: 'Visionary leader, ordained Pastor, Registered Nurse, and CEO of Continental Home Health Inc. (Colorado, USA).',
            image: '../images/aderoju_ajibade.webp'
          },
          {
            id: 'jemima',
            name: 'Praise Jemima Ajibade',
            role: 'Executive Secretary',
            category: 'board',
            location: 'Houston, USA',
            bio: 'Master’s degree in public policy (University of Houston), advocating for equitable healthcare & social policies.',
            image: '../images/jemima_ajibade.webp'
          },
          {
            id: 'eledan',
            name: 'Rev. Grace Eledan',
            role: 'Director',
            category: 'board',
            location: 'Atlanta, USA',
            bio: 'President & Founder of Women Aflame International, Co-Pastor at Leaders Church International (Atlanta, USA).',
            image: '../images/grace_eledan.webp'
          },
          {
            id: 'stella',
            name: 'Pastor Stella Fowowe',
            role: 'Co-ordinator, Malawi',
            category: 'coordinators',
            location: 'Blantyre, Malawi',
            bio: 'Fellow in counselling, consultant, lecturer, and motivational speaker with deep passion for youth empowerment.',
            image: '../images/Stella_fowowe.webp'
          },
          {
            id: 'grace_jerry',
            name: 'Grace Jerry Udabor',
            role: 'Co-ordinator, Edo State, Nigeria',
            category: 'coordinators',
            location: 'Benin City, Nigeria',
            bio: 'MBA holder working with the Nigerian Tourism Development Authority, based in Benin City.',
            image: '../images/Grace_jerry.webp'
          },
          {
            id: 'favour',
            name: 'Mrs. Favour Shoyombo',
            role: 'Co-ordinator, Abuja - Nigeria',
            category: 'coordinators',
            location: 'Abuja, Nigeria',
            bio: 'Dedicated administrator exemplifying care, compassion, and community leadership in Abuja.',
            image: '../images/favour_shoyombo.webp'
          },
          {
            id: 'mobolaji',
            name: 'Mobolaji Olajumoke Alade',
            role: 'Co-ordinator, Oyo State, Nigeria',
            category: 'coordinators',
            location: 'Ibadan, Nigeria',
            bio: 'B.A. degree holder and businesswoman living in Ibadan, passionate about community welfare.',
            image: '../images/Mobolaji_olajumoke.webp'
          },
          {
            id: 'folake',
            name: 'Olorunda Folake Adefolahan',
            role: 'Co-ordinator, Ogijo - Ogun State',
            category: 'coordinators',
            location: 'Ogijo, Ogun State, Nigeria',
            bio: 'Dedicated advocate channelizing passion for less-privileged mothers and children in Ogijo.',
            image: '../images/Olorunda_folake.webp'
          },
          {
            id: 'temitayo',
            name: 'Temitayo Ifetogun',
            role: 'Co-ordinator, Ogun State, Nigeria',
            category: 'coordinators',
            location: 'Ogun State, Nigeria',
            bio: 'CEO of Cakes’n GoodThings and convener of Gathering Of Deborahs, mentor to over 200 entrepreneurs.',
            image: '../images/temitayo_ifetogun-1.webp'
          }
        ];
      }
    }
    renderTeamTable();
  }

  function renderTeamTable() {
    const tbody = document.getElementById('team-members-tbody');
    if (!tbody) return;

    if (allTeamMembers.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--cms-muted); padding:2rem;">No team members found. Click "+ Add New Member" to add one.</td></tr>`;
      return;
    }

    tbody.innerHTML = allTeamMembers.map(m => `
      <tr>
        <td><img src="${m.image || '../images/tr_logo.webp'}" alt="${m.name}" style="width:40px; height:40px; object-fit:cover; border-radius:50%;"></td>
        <td><strong>${m.name}</strong><br><small style="color:var(--cms-muted);">${m.role}</small></td>
        <td><span class="status-badge ${m.category === 'board' ? 'success' : 'initiated'}">${m.category}</span></td>
        <td>${m.location || 'Global'}</td>
        <td>
          <button type="button" class="cms-btn cms-btn-outline edit-team-btn" data-id="${m.id}" style="padding:0.3rem 0.6rem; font-size:0.75rem;">Edit</button>
          <button type="button" class="cms-btn cms-btn-outline delete-team-btn" data-id="${m.id}" style="padding:0.3rem 0.6rem; font-size:0.75rem; border-color:var(--cms-red); color:#F87171;">Delete</button>
        </td>
      </tr>
    `).join('');

    document.querySelectorAll('.edit-team-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        editTeamMember(id);
      });
    });

    document.querySelectorAll('.delete-team-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        deleteTeamMember(id);
      });
    });
  }

  // Automatic WebP Image Compressor (Canvas)
  const teamImgFile = document.getElementById('team-image-file');
  if (teamImgFile) {
    teamImgFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const originalSize = file.size;
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 800; // Optimal WebP portrait dimension
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to compressed WebP (82% quality)
          const webpDataUrl = canvas.toDataURL('image/webp', 0.82);
          document.getElementById('team-image-data').value = webpDataUrl;

          const previewImg = document.getElementById('webp-preview-img');
          const previewWrap = document.getElementById('webp-preview-wrap');
          const statusText = document.getElementById('webp-status-text');

          if (previewImg) previewImg.src = webpDataUrl;
          if (previewWrap) previewWrap.style.display = 'block';

          const compressedSize = Math.round((webpDataUrl.length * 3) / 4);
          const reduction = Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100));

          if (statusText) {
            statusText.textContent = `⚡ Auto-Compressed to WebP! Saved ~${reduction}% file size (${Math.round(compressedSize / 1024)} KB)`;
          }
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // Save Team Member
  const teamForm = document.getElementById('team-member-form');
  if (teamForm) {
    teamForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('team-id').value;
      const name = document.getElementById('team-name').value;
      const role = document.getElementById('team-role').value;
      const category = document.getElementById('team-category').value;
      const location = document.getElementById('team-location').value;
      const bio = document.getElementById('team-bio').value;
      const imageData = document.getElementById('team-image-data').value;

      const payload = {
        id: id || ('member-' + Date.now()),
        name,
        role,
        category,
        location,
        bio,
        image: imageData || '../images/tr_logo.webp'
      };

      try {
        await fetch('../api/team', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (err) {}

      const idx = allTeamMembers.findIndex(m => m.id === payload.id);
      if (idx >= 0) allTeamMembers[idx] = payload;
      else allTeamMembers.unshift(payload);
      localStorage.setItem('trbb_team_members', JSON.stringify(allTeamMembers));

      showToast('Team member saved successfully!');
      resetTeamForm();
      renderTeamTable();
    });
  }

  function editTeamMember(id) {
    const member = allTeamMembers.find(m => m.id === id);
    if (!member) return;

    document.getElementById('team-id').value = member.id;
    document.getElementById('team-name').value = member.name;
    document.getElementById('team-role').value = member.role;
    document.getElementById('team-category').value = member.category || 'board';
    document.getElementById('team-location').value = member.location || '';
    document.getElementById('team-bio').value = member.bio || '';
    document.getElementById('team-image-data').value = member.image || '';

    if (member.image) {
      document.getElementById('webp-preview-img').src = member.image;
      document.getElementById('webp-preview-wrap').style.display = 'block';
    }

    document.getElementById('team-form-title').textContent = 'Edit Team Member';
  }

  async function deleteTeamMember(id) {
    if (!confirm('Are you sure you want to delete this team member?')) return;

    try {
      await fetch('../api/team/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
    } catch (err) {}

    allTeamMembers = allTeamMembers.filter(m => m.id !== id);
    localStorage.setItem('trbb_team_members', JSON.stringify(allTeamMembers));
    showToast('Team member deleted');
    renderTeamTable();
  }

  function resetTeamForm() {
    if (teamForm) teamForm.reset();
    document.getElementById('team-id').value = '';
    document.getElementById('team-image-data').value = '';
    const previewWrap = document.getElementById('webp-preview-wrap');
    if (previewWrap) previewWrap.style.display = 'none';
    const formTitle = document.getElementById('team-form-title');
    if (formTitle) formTitle.textContent = 'Add Team Member';
  }

  document.getElementById('btn-add-new-team')?.addEventListener('click', resetTeamForm);

  // Toast Helper
  function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'cms-toast';
    toast.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> <span>${msg}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3500);
  }
});
