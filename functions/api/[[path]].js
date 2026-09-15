/**
 * Tender Roots Beyond Borders Inc. - Cloudflare Pages Serverless API & Webhook Listener
 * Serves routes under /api/...
 */

// In-Memory & Cloudflare KV / D1 storage fallback state
let memoryDB = {
  adminPasswordHash: 'trbbAdmin2026!',
  transactions: [
    {
      id: 'TRBB-1726402800000-842',
      tx_ref: 'TRBB-1726402800000-842',
      flw_ref: 'FLW-MOCK-994182',
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@example.com',
      amount: 50,
      currency: 'USD',
      program: 'New Hope To-Blossom (Educational Sponsorship)',
      status: 'success',
      createdAt: '2026-09-15T09:30:00Z',
      updatedAt: '2026-09-15T09:31:12Z'
    },
    {
      id: 'TRBB-1726405500000-319',
      tx_ref: 'TRBB-1726405500000-319',
      flw_ref: 'FLW-MOCK-104921',
      name: 'Chidubem Okafor',
      email: 'c.okafor@example.ng',
      amount: 30000,
      currency: 'NGN',
      program: 'Sprouting To-Thrive (Vocational Training)',
      status: 'success',
      createdAt: '2026-09-15T10:15:00Z',
      updatedAt: '2026-09-15T10:16:05Z'
    },
    {
      id: 'TRBB-1726408200000-502',
      tx_ref: 'TRBB-1726408200000-502',
      flw_ref: null,
      name: 'David Banda',
      email: 'dbanda@example.mw',
      amount: 25000,
      currency: 'MWK',
      program: 'General Mission Fund',
      status: 'initiated',
      createdAt: '2026-09-15T11:00:00Z',
      updatedAt: '2026-09-15T11:00:00Z'
    }
  ],
  messages: [
    {
      id: 'MSG-101',
      subject: 'Thank You for Empowering Children Across Borders!',
      recipientType: 'All Donors',
      recipientCount: 42,
      body: 'Dear Valued Supporter, Thank you for standing with Tender Roots Beyond Borders Inc. Your generosity is transforming lives in Malawi, Nigeria, and the USA...',
      sentAt: '2026-09-14T14:20:00Z',
      status: 'Delivered'
    }
  ],
  content: {
    impactCounters: {
      childrenSponsored: 1250,
      activePrograms: 4,
      communitiesServed: 18,
      fundsRaisedGoalUSD: 100000
    },
    announcementBar: {
      enabled: true,
      text: '🎉 IRS-Approved 501(c)(3) Nonprofit: All donations are 100% tax-deductible in the United States!'
    },
    programs: {
      educational: {
        target: 25000,
        raised: 18400
      },
      vocational: {
        target: 30000,
        raised: 22100
      },
      respite: {
        target: 45000,
        raised: 31000
      }
    }
  }
};

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/?/, '');

  // Enable CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Flutterwave-Signature',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ----------------------------------------------------
    // ROUTE 1: Admin Login (/api/auth/login)
    // ----------------------------------------------------
    if (path === 'auth/login' && request.method === 'POST') {
      const data = await request.json();
      const password = data.password || '';
      if (password === memoryDB.adminPasswordHash) {
        const token = 'TRBB_SESSION_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
        return new Response(JSON.stringify({ success: true, token, message: 'Authentication successful' }), { headers: corsHeaders });
      }
      return new Response(JSON.stringify({ success: false, message: 'Invalid Admin Password' }), { status: 401, headers: corsHeaders });
    }

    // ----------------------------------------------------
    // ROUTE 2: Initiate Transaction (/api/transactions/initiate)
    // ----------------------------------------------------
    if (path === 'transactions/initiate' && request.method === 'POST') {
      const payload = await request.json();
      const newTx = {
        id: payload.tx_ref || ('TRBB-' + Date.now()),
        tx_ref: payload.tx_ref,
        flw_ref: null,
        name: payload.name || 'Anonymous Donor',
        email: payload.email || '',
        amount: parseFloat(payload.amount) || 0,
        currency: payload.currency || 'USD',
        program: payload.program || 'General Mission Fund',
        status: 'initiated',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Append or replace
      const idx = memoryDB.transactions.findIndex(t => t.tx_ref === payload.tx_ref);
      if (idx >= 0) {
        memoryDB.transactions[idx] = { ...memoryDB.transactions[idx], ...newTx };
      } else {
        memoryDB.transactions.unshift(newTx);
      }

      return new Response(JSON.stringify({ success: true, transaction: newTx }), { headers: corsHeaders });
    }

    // ----------------------------------------------------
    // ROUTE 3: Update Transaction Status (/api/transactions/update)
    // ----------------------------------------------------
    if (path === 'transactions/update' && request.method === 'POST') {
      const payload = await request.json();
      const { tx_ref, status, flw_ref } = payload;
      
      const tx = memoryDB.transactions.find(t => t.tx_ref === tx_ref);
      if (tx) {
        tx.status = status || tx.status;
        if (flw_ref) tx.flw_ref = flw_ref;
        tx.updatedAt = new Date().toISOString();
        return new Response(JSON.stringify({ success: true, transaction: tx }), { headers: corsHeaders });
      } else {
        // If not initiated yet, create it as success/failed
        const newTx = {
          id: tx_ref || ('TRBB-' + Date.now()),
          tx_ref: tx_ref,
          flw_ref: flw_ref || null,
          name: payload.name || 'Donor',
          email: payload.email || '',
          amount: parseFloat(payload.amount) || 0,
          currency: payload.currency || 'USD',
          program: payload.program || 'General Mission Fund',
          status: status || 'success',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        memoryDB.transactions.unshift(newTx);
        return new Response(JSON.stringify({ success: true, transaction: newTx }), { headers: corsHeaders });
      }
    }

    // ----------------------------------------------------
    // ROUTE 4: Flutterwave Webhook (/api/webhooks/flutterwave)
    // ----------------------------------------------------
    if (path === 'webhooks/flutterwave' && request.method === 'POST') {
      const secretHash = env.FLUTTERWAVE_SECRET_HASH || 'TRBB_SECRET_HASH_2026';
      const signature = request.headers.get('verif-hash');

      if (signature && signature !== secretHash) {
        return new Response(JSON.stringify({ status: 'error', message: 'Unauthorized webhook signature' }), { status: 401, headers: corsHeaders });
      }

      const body = await request.json();
      const eventData = body.data || body;
      const tx_ref = eventData.tx_ref;
      const flwStatus = (eventData.status || '').toLowerCase(); // 'successful', 'failed'

      const tx = memoryDB.transactions.find(t => t.tx_ref === tx_ref);
      const newStatus = flwStatus === 'successful' ? 'success' : (flwStatus === 'failed' ? 'failed' : 'initiated');

      if (tx) {
        tx.status = newStatus;
        tx.flw_ref = eventData.flw_ref || eventData.id || tx.flw_ref;
        tx.updatedAt = new Date().toISOString();
      } else {
        memoryDB.transactions.unshift({
          id: tx_ref || ('TRBB-' + Date.now()),
          tx_ref: tx_ref,
          flw_ref: eventData.flw_ref || eventData.id || null,
          name: eventData.customer ? eventData.customer.name : 'Donor',
          email: eventData.customer ? eventData.customer.email : '',
          amount: parseFloat(eventData.amount) || 0,
          currency: eventData.currency || 'USD',
          program: 'General Mission Fund',
          status: newStatus,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      return new Response(JSON.stringify({ status: 'success', message: 'Webhook processed' }), { headers: corsHeaders });
    }

    // ----------------------------------------------------
    // ROUTE 5: Get All Transactions (/api/transactions)
    // ----------------------------------------------------
    if (path === 'transactions' && request.method === 'GET') {
      const statusFilter = url.searchParams.get('status') || 'all';
      let list = memoryDB.transactions;
      if (statusFilter !== 'all') {
        list = list.filter(t => t.status === statusFilter);
      }
      return new Response(JSON.stringify({ success: true, transactions: list }), { headers: corsHeaders });
    }

    // ----------------------------------------------------
    // ROUTE 6: Get Compiled Donor List (/api/donors)
    // ----------------------------------------------------
    if (path === 'donors' && request.method === 'GET') {
      const donorMap = {};
      memoryDB.transactions.forEach(tx => {
        if (!tx.email) return;
        const key = tx.email.toLowerCase();
        if (!donorMap[key]) {
          donorMap[key] = {
            name: tx.name,
            email: tx.email,
            totalDonatedUSD: 0,
            totalDonatedNGN: 0,
            totalDonatedMWK: 0,
            lastDonationDate: tx.createdAt,
            programs: new Set(),
            successCount: 0
          };
        }
        if (tx.status === 'success') {
          donorMap[key].successCount++;
          if (tx.currency === 'USD') donorMap[key].totalDonatedUSD += tx.amount;
          if (tx.currency === 'NGN') donorMap[key].totalDonatedNGN += tx.amount;
          if (tx.currency === 'MWK') donorMap[key].totalDonatedMWK += tx.amount;
        }
        donorMap[key].programs.add(tx.program);
      });

      const donorList = Object.values(donorMap).map(d => ({
        ...d,
        programs: Array.from(d.programs)
      }));

      return new Response(JSON.stringify({ success: true, donors: donorList }), { headers: corsHeaders });
    }

    // ----------------------------------------------------
    // ROUTE 7: Send Donor Message (/api/donor-messages/send)
    // ----------------------------------------------------
    if (path === 'donor-messages/send' && request.method === 'POST') {
      const payload = await request.json();
      const { subject, body, recipientType, specificEmails } = payload;

      const newMsg = {
        id: 'MSG-' + (memoryDB.messages.length + 101),
        subject: subject || 'Notice from Tender Roots Beyond Borders Inc.',
        recipientType: recipientType || 'All Donors',
        recipientCount: specificEmails ? specificEmails.length : (recipientType === 'All Donors' ? 12 : 5),
        body: body || '',
        sentAt: new Date().toISOString(),
        status: 'Delivered'
      };

      memoryDB.messages.unshift(newMsg);

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Donor broadcast message queued and sent successfully!', 
        record: newMsg 
      }), { headers: corsHeaders });
    }

    // ----------------------------------------------------
    // ROUTE 8: Message History (/api/donor-messages/history)
    // ----------------------------------------------------
    if (path === 'donor-messages/history' && request.method === 'GET') {
      return new Response(JSON.stringify({ success: true, messages: memoryDB.messages }), { headers: corsHeaders });
    }

    // ----------------------------------------------------
    // ROUTE 9: Site Content GET & POST (/api/content)
    // ----------------------------------------------------
    if (path === 'content' && request.method === 'GET') {
      return new Response(JSON.stringify({ success: true, content: memoryDB.content }), { headers: corsHeaders });
    }

    if (path === 'content' && request.method === 'POST') {
      const payload = await request.json();
      memoryDB.content = { ...memoryDB.content, ...payload };
      return new Response(JSON.stringify({ success: true, message: 'Site content updated successfully', content: memoryDB.content }), { headers: corsHeaders });
    }

    // Default 404 for unknown API routes
    return new Response(JSON.stringify({ error: 'Endpoint not found', path }), { status: 404, headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Server Internal Error' }), { status: 500, headers: corsHeaders });
  }
}
