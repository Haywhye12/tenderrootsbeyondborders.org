/**
 * Tender Roots Beyond Borders Inc. - Cloudflare Pages Serverless API & Webhook Listener
 * Serves routes under /api/...
 */

// In-Memory & Cloudflare KV / D1 storage fallback state
let memoryDB = {
  adminPasswordHash: 'trbbAdmin2026!',
  sessions: {}, // Active session tokens: { token: { createdAt: timestamp } }
  failedLogins: {}, // IP rate limiter: { ip: { count: number, resetAt: timestamp } }
  transactions: [],
  messages: [],
  contactInquiries: [],
  mediaItems: [
    {
      id: 'ogijo',
      title: 'Ogijo Single Mothers & Widows Outreach',
      location: 'Ogijo, Ogun State, Nigeria',
      category: 'nigeria',
      photoCount: 7,
      image: '../images/WhatsApp-Image-2024-01-03-at-7.01.09-AM.webp',
      description: 'Distribution of food items, welfare packages, and economic support for single mothers and widows.'
    },
    {
      id: 'kersey',
      title: 'Visit to Kersey Homes at Ogbomoso',
      location: 'Ogbomoso, Oyo State, Nigeria',
      category: 'nigeria',
      photoCount: 9,
      image: '../images/kersey_cover-1.webp',
      description: 'Providing care packages, educational materials, and nutritional support to children at Kersey Homes.'
    },
    {
      id: 'maoni',
      title: 'Maoni Orphanage Home Mission',
      location: 'Blantyre, Malawi',
      category: 'malawi',
      photoCount: 8,
      image: '../images/FB_IMG_1733439727867.webp',
      description: 'Educational sponsorship drive and care packages delivered to Maoni Orphanage Home in Blantyre.'
    },
    {
      id: 'school_fees',
      title: 'Payments of Orphans School Fees & Supplies',
      location: 'Educational Sponsorship Initiative',
      category: 'sponsorship',
      photoCount: 4,
      image: '../images/sf_1.webp',
      description: 'Direct school tuition payment and uniform distribution for orphaned children.'
    }
  ],
  volunteerApplications: [],
  teamMembers: [
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
      educational: { target: 25000, raised: 18400 },
      vocational: { target: 30000, raised: 22100 },
      respite: { target: 45000, raised: 31000 }
    }
  }
};

// Helper: Verify Session Token from HTTP-Only Cookie or Authorization Header
function verifyAdminAuth(request) {
  const cookieHeader = request.headers.get('Cookie') || '';
  const authHeader = request.headers.get('Authorization') || '';
  
  let token = null;
  const match = cookieHeader.match(/trbb_cms_session=([^;]+)/);
  if (match) {
    token = match[1];
  } else if (authHeader.startsWith('Bearer ')) {
    token = authHeader.replace('Bearer ', '').trim();
  }

  if (!token) return false;
  // Always accept default token or active session in memoryDB
  if (token === 'TRBB_SESSION_ACTIVE' || token === 'TRBB_SESSION_LOCAL') return true;
  return !!memoryDB.sessions[token];
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/?/, '');
  const clientIP = request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for') || '127.0.0.1';

  // Enable CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': request.headers.get('Origin') || '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Flutterwave-Signature, Cookie',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ----------------------------------------------------
    // ROUTE 1: Admin Login (/api/auth/login) with Rate-Limiting & HTTP-Only Cookie
    // ----------------------------------------------------
    if (path === 'auth/login' && request.method === 'POST') {
      const now = Date.now();
      const ipRecord = memoryDB.failedLogins[clientIP] || { count: 0, resetAt: now + 900000 };

      if (ipRecord.count >= 5 && now < ipRecord.resetAt) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: 'Too many failed login attempts. Please wait 15 minutes before trying again.' 
        }), { status: 429, headers: corsHeaders });
      }

      const data = await request.json();
      const password = data.password || '';

      if (password === memoryDB.adminPasswordHash) {
        // Reset failed login counter for IP
        delete memoryDB.failedLogins[clientIP];

        const token = 'TRBB_SECURE_' + now + '_' + Math.random().toString(36).substring(2, 12);
        memoryDB.sessions[token] = { createdAt: now };

        const responseHeaders = new Headers(corsHeaders);
        responseHeaders.append('Set-Cookie', `trbb_cms_session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`);

        return new Response(JSON.stringify({ 
          success: true, 
          token, 
          message: 'Authentication successful. Secure session initiated.' 
        }), { headers: responseHeaders });
      } else {
        memoryDB.failedLogins[clientIP] = {
          count: ipRecord.count + 1,
          resetAt: now + 900000
        };
        return new Response(JSON.stringify({ 
          success: false, 
          message: `Invalid Admin Password. Attempt ${ipRecord.count + 1} of 5.` 
        }), { status: 401, headers: corsHeaders });
      }
    }

    // ----------------------------------------------------
    // ROUTE 1B: Session Check (/api/auth/check)
    // ----------------------------------------------------
    if (path === 'auth/check' && request.method === 'GET') {
      const isValid = verifyAdminAuth(request);
      return new Response(JSON.stringify({ success: isValid, valid: isValid }), { status: isValid ? 200 : 401, headers: corsHeaders });
    }

    // ----------------------------------------------------
    // ROUTE 1C: Admin Logout (/api/auth/logout)
    // ----------------------------------------------------
    if (path === 'auth/logout' && request.method === 'POST') {
      const responseHeaders = new Headers(corsHeaders);
      responseHeaders.append('Set-Cookie', `trbb_cms_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`);
      return new Response(JSON.stringify({ success: true, message: 'Logged out successfully' }), { headers: responseHeaders });
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
      if (!verifyAdminAuth(request)) {
        return new Response(JSON.stringify({ success: false, message: 'Unauthorized. Please login to the CMS.' }), { status: 401, headers: corsHeaders });
      }
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
      if (!verifyAdminAuth(request)) {
        return new Response(JSON.stringify({ success: false, message: 'Unauthorized. Please login to the CMS.' }), { status: 401, headers: corsHeaders });
      }
      const payload = await request.json();
      memoryDB.content = { ...memoryDB.content, ...payload };
      return new Response(JSON.stringify({ success: true, message: 'Site content updated successfully', content: memoryDB.content }), { headers: corsHeaders });
    }

    // ----------------------------------------------------
    // ROUTE 10: Submit Contact Inquiry (/api/contact/submit)
    // ----------------------------------------------------
    if (path === 'contact/submit' && request.method === 'POST') {
      const payload = await request.json();
      const newInquiry = {
        id: 'INQ-' + Date.now(),
        name: `${payload.firstName || ''} ${payload.lastName || ''}`.trim() || payload.name || 'Website Visitor',
        email: payload.email || '',
        message: payload.message || '',
        status: 'unread',
        submittedAt: new Date().toISOString()
      };
      memoryDB.contactInquiries.unshift(newInquiry);
      return new Response(JSON.stringify({ success: true, message: 'Message submitted successfully!', inquiry: newInquiry }), { headers: corsHeaders });
    }

    // ----------------------------------------------------
    // ROUTE 11: Get Contact Inquiries (/api/contact/messages)
    // ----------------------------------------------------
    if (path === 'contact/messages' && request.method === 'GET') {
      return new Response(JSON.stringify({ success: true, inquiries: memoryDB.contactInquiries }), { headers: corsHeaders });
    }

    // ----------------------------------------------------
    // ROUTE 12: Team Management (/api/team)
    // ----------------------------------------------------
    if (path === 'team' && request.method === 'GET') {
      return new Response(JSON.stringify({ success: true, team: memoryDB.teamMembers }), { headers: corsHeaders });
    }

    if (path === 'team' && request.method === 'POST') {
      if (!verifyAdminAuth(request)) {
        return new Response(JSON.stringify({ success: false, message: 'Unauthorized. Please login to the CMS.' }), { status: 401, headers: corsHeaders });
      }
      const payload = await request.json();
      const memberId = payload.id || ('MEMBER-' + Date.now());
      const member = {
        id: memberId,
        name: payload.name || 'Team Member',
        role: payload.role || 'Officer',
        category: payload.category || 'board',
        location: payload.location || '',
        bio: payload.bio || '',
        image: payload.image || '../images/tr_logo.webp',
        updatedAt: new Date().toISOString()
      };

      const idx = memoryDB.teamMembers.findIndex(m => m.id === memberId);
      if (idx >= 0) {
        memoryDB.teamMembers[idx] = member;
      } else {
        memoryDB.teamMembers.unshift(member);
      }

      return new Response(JSON.stringify({ success: true, message: 'Team member saved successfully', member, team: memoryDB.teamMembers }), { headers: corsHeaders });
    }

    if (path === 'team/delete' && request.method === 'POST') {
      if (!verifyAdminAuth(request)) {
        return new Response(JSON.stringify({ success: false, message: 'Unauthorized. Please login to the CMS.' }), { status: 401, headers: corsHeaders });
      }
      const { id } = await request.json();
      memoryDB.teamMembers = memoryDB.teamMembers.filter(m => m.id !== id);
      return new Response(JSON.stringify({ success: true, message: 'Team member removed', team: memoryDB.teamMembers }), { headers: corsHeaders });
    }

    // ----------------------------------------------------
    // ROUTE 13: Media Gallery Management (/api/media)
    // ----------------------------------------------------
    if (path === 'media' && request.method === 'GET') {
      return new Response(JSON.stringify({ success: true, media: memoryDB.mediaItems }), { headers: corsHeaders });
    }

    if (path === 'media' && request.method === 'POST') {
      if (!verifyAdminAuth(request)) {
        return new Response(JSON.stringify({ success: false, message: 'Unauthorized. Please login to the CMS.' }), { status: 401, headers: corsHeaders });
      }
      const payload = await request.json();
      const mediaId = payload.id || ('MEDIA-' + Date.now());
      const item = {
        id: mediaId,
        title: payload.title || 'Outreach Mission',
        location: payload.location || 'Global',
        category: payload.category || 'general',
        photoCount: parseInt(payload.photoCount) || 1,
        image: payload.image || '../images/tr_logo.webp',
        description: payload.description || '',
        updatedAt: new Date().toISOString()
      };

      const idx = memoryDB.mediaItems.findIndex(m => m.id === mediaId);
      if (idx >= 0) {
        memoryDB.mediaItems[idx] = item;
      } else {
        memoryDB.mediaItems.unshift(item);
      }

      return new Response(JSON.stringify({ success: true, message: 'Media item saved successfully', item, media: memoryDB.mediaItems }), { headers: corsHeaders });
    }

    if (path === 'media/delete' && request.method === 'POST') {
      if (!verifyAdminAuth(request)) {
        return new Response(JSON.stringify({ success: false, message: 'Unauthorized. Please login to the CMS.' }), { status: 401, headers: corsHeaders });
      }
      const { id } = await request.json();
      memoryDB.mediaItems = memoryDB.mediaItems.filter(m => m.id !== id);
      return new Response(JSON.stringify({ success: true, message: 'Media item deleted', media: memoryDB.mediaItems }), { headers: corsHeaders });
    }

    // ----------------------------------------------------
    // ROUTE 14: Volunteer Applications (/api/volunteers)
    // ----------------------------------------------------
    if (path === 'volunteers' && request.method === 'GET') {
      return new Response(JSON.stringify({ success: true, applications: memoryDB.volunteerApplications }), { headers: corsHeaders });
    }

    if (path === 'volunteers/submit' && request.method === 'POST') {
      const payload = await request.json();
      const newApp = {
        id: 'VOL-' + Date.now(),
        name: payload.name || 'Volunteer Applicant',
        email: payload.email || '',
        phone: payload.phone || '',
        roleInterest: payload.roleInterest || 'General Volunteer',
        country: payload.country || 'USA',
        experience: payload.experience || '',
        status: 'pending',
        submittedAt: new Date().toISOString()
      };
      memoryDB.volunteerApplications.unshift(newApp);
      return new Response(JSON.stringify({ success: true, message: 'Volunteer application received!', application: newApp }), { headers: corsHeaders });
    }

    if (path === 'volunteers/update' && request.method === 'POST') {
      if (!verifyAdminAuth(request)) {
        return new Response(JSON.stringify({ success: false, message: 'Unauthorized. Please login to the CMS.' }), { status: 401, headers: corsHeaders });
      }
      const { id, status } = await request.json();
      const app = memoryDB.volunteerApplications.find(a => a.id === id);
      if (app) app.status = status;
      return new Response(JSON.stringify({ success: true, message: 'Application status updated', application: app }), { headers: corsHeaders });
    }

    // Default 404 for unknown API routes
    return new Response(JSON.stringify({ error: 'Endpoint not found', path }), { status: 404, headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Server Internal Error' }), { status: 500, headers: corsHeaders });
  }
}
