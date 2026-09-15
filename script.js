/**
 * TENDER ROOTS BEYOND BORDERS INC. - ADVANCED MULTI-PAGE CONTROLLER
 * GPU Parallax Scrolling, 3D Card Hover Tilt, Lightbox Gallery Slider & Modal Engine
 */

/* ==========================================================================
   PAGE LOADER — init runs immediately (before DOMContentLoaded) so the
   overlay is visible the instant the parser reaches this script tag.
   ========================================================================== */
(function initPageLoader() {
  const loader   = document.getElementById('page-loader');
  const bar      = loader ? loader.querySelector('.loader-progress-bar') : null;

  if (!loader) return;

  // Lock scroll
  document.body.classList.add('is-loading');

  // Animate progress bar in two phases:
  //   0 → 75 % while DOM is loading (fast)
  //   75 → 100 % once window fully loads (instant complete + dismiss)
  let progress  = 0;
  const FPS     = 60;
  const TICK    = 1000 / FPS;
  const RATE    = 1.4;   // % per frame during DOM phase — reaches ~75 % in ≈ 900 ms

  const tickProgress = () => {
    if (progress >= 75) return;            // pause at 75 until window.load
    progress = Math.min(progress + RATE, 75);
    if (bar) bar.style.width = progress + '%';
    if (progress < 75) setTimeout(tickProgress, TICK);
  };

  setTimeout(tickProgress, 80);            // short delay so the card entry anim plays first

  // Dismiss helper — fills bar to 100 then fades the overlay out
  const dismissLoader = () => {
    progress = 100;
    if (bar) bar.style.width = '100%';

    // Small pause so the completed bar is visible for a beat
    setTimeout(() => {
      loader.classList.add('loader-hidden');
      document.body.classList.remove('is-loading');

      // Remove from DOM entirely after the CSS transition ends (0.65 s)
      loader.addEventListener('transitionend', () => {
        if (loader.parentNode) loader.parentNode.removeChild(loader);
      }, { once: true });
    }, 320);
  };

  // Ideal case — wait for every asset (images, fonts, etc.)
  if (document.readyState === 'complete') {
    dismissLoader();
  } else {
    window.addEventListener('load', dismissLoader, { once: true });

    // Hard safety net — never leave the loader visible beyond 4 seconds
    setTimeout(dismissLoader, 4000);
  }
}());

/* ==========================================================================
   MAIN CONTROLLER — initialises all page features after DOM is ready
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  initParallaxEngine();
  init3DTiltCards();
  initScrollNavbar();
  initScrollReveal();
  initStatsCounter();
  initProgramAndTeamModals();
  initContactForm();
  initMobileMenu();
  initTeamFilters();
  initMediaFilters();
  initLightboxGallery();
  initFaqAccordion();
  initCopyPills();
  initKeyboardNav();
  initFlutterwaveDonations();
  initCookieConsent();

  /* ── Motion layer ── */
  initMidPageParallax();
  initSectionInView();
  initMagneticButtons();
  initHeroParticles();
  initImageRevealTilt();
  initStaggeredReveal();
  initCursorGlow();
});

/* Helper to detect if script is loaded from inside a subfolder */
const isSubfolder = document.querySelector('script[src*="../script.js"]') !== null;
const fixAssetPath = (path) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  if (isSubfolder && !path.startsWith('../')) {
    return '../' + path.replace(/^\.\//, '');
  }
  return path;
};

/* ==========================================================================
   1. MULTI-LAYER & MID-PAGE PARALLAX SCROLLING ENGINE
   ========================================================================== */
function initParallaxEngine() {
  const homeParallaxBg = document.querySelector('.hero .parallax-bg');
  
  let latestKnownScrollY = 0;
  let ticking = false;

  window.addEventListener('scroll', () => {
    latestKnownScrollY = window.scrollY;
    requestTick();
  }, { passive: true });

  function requestTick() {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
    }
    ticking = true;
  }

  function updateParallax() {
    ticking = false;
    const currentScroll = latestKnownScrollY;

    if (homeParallaxBg) {
      homeParallaxBg.style.transform = `translate3d(0, ${currentScroll * 0.35}px, 0)`;
    }
  }
}

/* ==========================================================================
   2. 3D GLASSMOPHISM CARD TILT
   ========================================================================== */
function init3DTiltCards() {
  const cards = document.querySelectorAll('.card-glass, .program-card, .team-card');
  
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = (y - centerY) / 25;
      const rotateY = (centerX - x) / 25;
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(8px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
    });
  });
}

/* ==========================================================================
   3. STICKY NAVBAR BACKDROP SHADOW
   ========================================================================== */
function initScrollNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }, { passive: true });
}

/* ==========================================================================
   4. SCROLL REVEAL ANIMATION (INTERSECTION OBSERVER)
   ========================================================================== */
function initScrollReveal() {
  const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, {
    root: null,
    threshold: 0.12,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));
}

/* ==========================================================================
   5. ANIMATED IMPACT COUNTERS
   ========================================================================== */
function initStatsCounter() {
  const statNumbers = document.querySelectorAll('.stat-number');
  let animated = false;

  const statsSection = document.querySelector('.stats-banner');
  if (!statsSection) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !animated) {
        animated = true;
        statNumbers.forEach(stat => {
          const target = parseInt(stat.getAttribute('data-target'), 10);
          animateCount(stat, target);
        });
      }
    });
  }, { threshold: 0.3 });

  observer.observe(statsSection);

  function animateCount(element, target) {
    const duration = 2000;
    const startTime = performance.now();

    function updateCount(currentTime) {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentCount = Math.floor(easeOut * target);

      element.textContent = currentCount;

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      } else {
        element.textContent = target;
      }
    }

    requestAnimationFrame(updateCount);
  }
}

/* ==========================================================================
   6. PROGRAM & TEAM DETAILS MODAL DATA & CONTROLLER
   ========================================================================== */
const programData = {
  blossom: {
    title: "New Hope To-Blossom",
    tag: "Socio-Economic Intervention Pillar",
    image: "images/program_blossom.webp",
    description: "New Hope-To-Blossom is a socio-economic intervention program of TRBB that caters for the needs of vulnerable youths and adults whose demographics are growing rapidly in a global environment of insecurity and uncertainty. Most of the work of TRBB is predominantly focused on United States of America and Sub-Sahara Africa while we intend to expand our work to other mission-critical countries that mostly need our services.",
    outcomes: [
      "Educational supplies, textbooks, uniforms, and tuition sponsorship for orphans",
      "Emergency food relief and daily care commodities for single mothers & widows",
      "Mentorship networks connecting vulnerable youths with seasoned community leaders",
      "Financial literacy and personal empowerment guidance"
    ]
  },
  thrive: {
    title: "Sprouting To-Thrive",
    tag: "Empowerment & Wellbeing Pillar",
    image: "images/program_thrive.webp",
    description: "Sprouting-To-Thrive is the empowerment and total wellbeing program of TRBB that encompasses vocational and career training, girl child education, healthcare, therapy, health education, and nutritional education endeavors in the fulfillment of our strategic objectives.",
    outcomes: [
      "Certified vocational technical workshops and micro-entrepreneurship grants",
      "Girl child educational protection & career development mentorship programs",
      "Health, hygiene, therapy, and nutritional education workshops in underserved cities",
      "Small business starter kits and ongoing mentoring"
    ]
  },
  haven: {
    title: "Haven of New Hope",
    tag: "Respite & Shelter Pillar",
    image: "images/program_haven.webp",
    description: "Haven of New Hope is the provision of respite to the hurting, vulnerable, and homeless individuals to cater for their transitional room and board; while they are being counseled for proper placement into programs that will enable them to blossom and thrive again in their pursuits of happiness and prosperity in life.",
    outcomes: [
      "Safe, secure transitional room and board with wholesome daily nutritional meals",
      "Professional counseling, physical health checkups, and emotional therapy",
      "Supportive community environment for holistic recovery",
      "Structured transitional guidance for permanent independent living"
    ]
  }
};

const teamData = {
  aderoju: {
    title: "Pastor Aderoju Ajibade",
    tag: "President / CEO — Board of Trustees",
    image: "images/aderoju_ajibade.webp",
    description: `Pastor Aderoju Ajibade is the President/CEO of Tender Roots Beyond Borders Inc (TRBB). She is a visionary leader with a wealth of leadership experience, skill sets, and competences, which puts TRBB on the leading-edge of nonprofits in the human service sector.<br><br>She is an ordained Pastor, Registered Nurse, and Entrepreneur. As the business owner and CEO of Continental Home Health Inc., she oversees a sizable workforce of healthcare professionals that are making a great impact in healthcare delivery in the State of Colorado, USA. She is also the State Coordinator of Women Aflame International – a global network of praying women from all walks of life who are set apart by their good works in community service and the total wellbeing of humankind.<br><br>The ministry works of Pastor Aderoju Ajibade spans over two and half decades, which enabled her to serve in various leadership capacities and discovered the call of God for her life while serving. Through the passion that she has for women and children going through distress and the challenges of life, Job 14:7 was impressed in her spirit in the year 2018 by the Holy Spirit <i>(“For there is hope for a tree, if it is cut down, that it will sprout again and that its tender shoots will not cease” Job 14:7-9)</i>. This led her to establish Tender Roots as an organization that caters for women going through marital challenges, widows, widowers, orphans, children, and youths who are vulnerable. Today, Tender Roots has its presence in four cities in Nigeria – Ogbomosho, Ibadan, Benin, and Lagos. Tender Roots is also located in the city of Blantyre, in Malawi and working to break new frontiers beyond the borders of the United States of America.`
  },
  jemima: {
    title: "Praise Jemima Ajibade",
    tag: "Executive Secretary — Board of Trustees",
    image: "images/jemima_ajibade.webp",
    description: `Jemima Ajibade was born in Nigeria and raised in Denver, Colorado. She holds a master's degree in public policy from the esteemed University of Houston, building upon the strong foundation laid during her undergraduate studies at Southern University in Baton Rouge, Louisiana.<br><br>Her academic background, coupled with her deep passion for helping others and unwavering faith in God, has propelled her into a fulfilling career supporting the efficient operation of healthcare facilities.<br><br>Along her path, she has immersed herself in diverse cultures, both domestically and across the globe, participating in a myriad of outreach programs. These experiences have enriched her perspective and influenced her commitment to advocating for equitable policies, ensuring the delivery of compassionate and effective care solutions. Her deep appreciation for humanity is intertwined with her aptitude for forging connections with others who share a common mission. Her life stands as a testament to her dedication to fostering positive change.`
  },
  eledan: {
    title: "Rev. Grace Eledan",
    tag: "Director — Board of Trustees",
    image: "images/grace_eledan.webp",
    description: `Rev. Grace Eledan is the President and Founder of Women Aflame International and Vice-President/Co-Founder of Grace Relief Initiative International. The gathering of Women for prayers and fellowship which she started in 1989 was culminated by a clarion call she received on Nov. 25, 2000 through which God gave her a marching order and said, “Mobilize women to evangelize.” The call gave birth to Women Aflame International (WAI).<br><br>She also planted People of Faith Church in Brooklyn, New York. She is a prolific writer and an Evangelist by calling, who operates in the prophetic and healing gifts. She is a Co-Pastor with her husband at Leaders Church International in Atlanta, USA. Her journey into the ministry started on September 21, 1989 when she received a word through a vision from the Lord who said to her, “I will use you to preach.” God backed up the Word with the scripture-Isaiah 61:1-3 in another subsequent revelation.<br><br>She is a Theologian and English tutor by training. She graduated from Ahmadu Bello University, Zaria; Nigeria (1980) with Advanced Diploma in Education and earned her Bachelor of Theology from Lighthouse Christian College & Seminary Beebe, Arkansas, USA. She is a seasoned administrator and Executive Director, Apostlegate Group LLC.`
  },
  stella: {
    title: "Pastor Stella Fowowe",
    tag: "Co-ordinator, Malawi — Regional Leadership",
    image: "images/Stella_fowowe.webp",
    description: `Pastor Stella Fowowe is a wife, mother, pastor, fellow in counselling, consultant, lecturer, motivational speaker, and a life coach with great passion for empowering the less-privileged, youth, and working with children.<br><br>She leads Tender Roots' international outreach operations in Blantyre, Malawi, coordinating essential room, board, and educational support programs at Maoni Orphanage Home.`
  },
  grace_jerry: {
    title: "Grace Jerry Udabor",
    tag: "Co-ordinator, Edo State, Nigeria — Regional Leadership",
    image: "images/Grace_jerry.webp",
    description: `Grace Jerry Udabor holds a Master’s degree in Business Administration (MBA). She works with the Nigerian Tourism Development Authority and is married with two sons.<br><br>Based in Benin City, Edo State, Nigeria, she coordinates Tender Roots' welfare visits and care packages to orphanages including Oge Iyebosa Orphanage Home and Cole Home in Benin City.`
  },
  favour: {
    title: "Mrs. Favour Shoyombo",
    tag: "Co-ordinator, Abuja - Nigeria — Regional Leadership",
    image: "images/favour_shoyombo.webp",
    description: `Mrs. Favour Shoyombo is a remarkable individual who wears multiple hats with grace and dedication. As a loving wife and devoted mother, she exemplifies the values of family, care, and compassion.<br><br>A true role model, demonstrating that one can successfully balance the roles of a wife, mother, and administrator while still making a significant difference in the lives of those less fortunate. Her journey serves as a testament to the power of compassion and the profound impact that a single individual can have on their community.`
  },
  mobolaji: {
    title: "Mobolaji Olajumoke Alade",
    tag: "Co-ordinator, Oyo State, Nigeria — Regional Leadership",
    image: "images/Mobolaji_olajumoke.webp",
    description: `Mobolaji Olajumoke Alade holds a Bachelor of Arts degree and is an accomplished businesswoman living in Ibadan, Oyo State, Nigeria. Married with three children, she leads Tender Roots' outreach operations in Oyo State, including support for Kersey Homes in Ogbomoso and local community welfare programs.`
  },
  folake: {
    title: "Olorunda Folake Adefolahan",
    tag: "Co-ordinator, Ogijo - Ogun State, Nigeria — Regional Leadership",
    image: "images/Olorunda_folake.webp",
    description: `Olorunda Folake Adefolahan is a mother of three and a businesswoman living in Ogun State. She is deeply passionate about helping less-privileged mothers and children.<br><br>Through Tender Roots Beyond Borders, she organizes outreaches for single mothers and widows in Ogijo, Ogun State, providing food relief and empowering families with tools to thrive.`
  },
  temitayo: {
    title: "Temitayo Ifetogun",
    tag: "Co-ordinator, Ogun State, Nigeria — Regional Leadership",
    image: "images/temitayo_ifetogun-1.webp",
    description: `Temitayo Ifetogun is an event planner and vendor who has been in the cake, decoration, confectionery, and event industry for over 24 years. She is the CEO of Cakes’n GoodThings and convener of Gathering Of Deborahs. She attended College of Education, Ila Orangun, and Obafemi Awolowo University (OAU).<br><br>Temitayo has provided decoration services for Ekiti State Governor’s house and Corporate Affairs Commission in Lagos State. In her career, she has trained over 200 entrepreneurs. She is an avid lover of God who sees her organization as a value-providing and impact-making outlet.`
  }
};

function initProgramAndTeamModals() {
  const modalOverlay = document.getElementById('program-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalTag = document.getElementById('modal-tag');
  const modalImg = document.getElementById('modal-img');
  const modalDesc = document.getElementById('modal-desc');
  const modalExtra = document.getElementById('modal-extra');
  const closeBtn = document.querySelector('.modal-close');

  if (!modalOverlay) return;

  document.querySelectorAll('[data-program]').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const programKey = trigger.getAttribute('data-program');
      const data = programData[programKey];

      if (data) {
        modalTitle.textContent = data.title;
        modalTag.textContent = data.tag;
        modalImg.src = fixAssetPath(data.image);
        modalDesc.innerHTML = data.description;
        
        modalExtra.innerHTML = `
          <h4 style="font-size: 1rem; color: #FFF; margin-bottom: 0.75rem;">Key Outcomes & Deliverables:</h4>
          <ul style="list-style: none; padding: 0; color: var(--text-muted); font-size: 0.9rem;">
            ${data.outcomes.map(item => 
              `<li style="margin-bottom: 0.5rem; display: flex; align-items: flex-start; gap: 0.5rem;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="3" style="flex-shrink:0; margin-top:2px;"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>${item}</span>
              </li>`
            ).join('')}
          </ul>
        `;

        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  document.querySelectorAll('[data-member]').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const memberKey = trigger.getAttribute('data-member');
      const data = teamData[memberKey];

      if (data) {
        modalTitle.textContent = data.title;
        modalTag.textContent = data.tag;
        modalImg.src = fixAssetPath(data.image);
        modalDesc.innerHTML = data.description;
        modalExtra.innerHTML = '';

        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  const closeModal = () => {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
  };

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });
}

/* ==========================================================================
   7. TEAM & MEDIA FILTERS
   ========================================================================== */
function initTeamFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn[data-category]');
  const teamCards = document.querySelectorAll('.team-card[data-category]');

  if (!filterBtns.length || !teamCards.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const category = btn.getAttribute('data-category');

      teamCards.forEach(card => {
        const cardCategory = card.getAttribute('data-category');
        if (category === 'all' || cardCategory === category) {
          card.style.display = 'flex';
          setTimeout(() => card.style.opacity = '1', 50);
        } else {
          card.style.opacity = '0';
          setTimeout(() => card.style.display = 'none', 300);
        }
      });
    });
  });
}

function initMediaFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn[data-media-cat]');
  const mediaCards = document.querySelectorAll('.outreach-card[data-media-cat]');

  if (!filterBtns.length || !mediaCards.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const category = btn.getAttribute('data-media-cat');

      mediaCards.forEach(card => {
        const cardCategory = card.getAttribute('data-media-cat');
        if (category === 'all' || cardCategory === category) {
          card.style.display = 'block';
          setTimeout(() => card.style.opacity = '1', 50);
        } else {
          card.style.opacity = '0';
          setTimeout(() => card.style.display = 'none', 300);
        }
      });
    });
  });
}

/* ==========================================================================
   8. LIGHTBOX & MULTI-IMAGE MISSION GALLERY SLIDER
   ========================================================================== */
const missionGalleries = {
  ogijo: {
    title: "Ogijo Single Mothers & Widows Outreach",
    location: "Ogijo, Ogun State, Nigeria",
    images: [
      "images/WhatsApp-Image-2024-01-03-at-7.01.09-AM.webp",
      "images/WhatsApp-Image-2024-01-03-at-7.01.09-AM-1.webp",
      "images/WhatsApp-Image-2024-01-03-at-7.01.09-AM-2.webp",
      "images/WhatsApp-Image-2024-01-03-at-7.01.09-AM-3.webp",
      "images/WhatsApp-Image-2024-01-03-at-7.01.09-AM-4.webp",
      "images/WhatsApp-Image-2024-01-03-at-7.01.09-AM-5.webp",
      "images/WhatsApp-Image-2024-01-03-at-7.01.09-AM-6.webp"
    ]
  },
  kersey: {
    title: "Visit to Kersey Homes at Ogbomoso",
    location: "Ogbomoso, Oyo State, Nigeria",
    images: [
      "images/kersey_cover-1.webp",
      "images/WhatsApp-Image-2024-01-03-at-7.01.31-AM.webp",
      "images/WhatsApp-Image-2024-01-03-at-7.01.31-AM-1.webp",
      "images/WhatsApp-Image-2024-01-03-at-7.01.31-AM-2.webp",
      "images/WhatsApp-Image-2024-01-03-at-7.01.32-AM.webp",
      "images/WhatsApp-Image-2024-01-03-at-7.01.32-AM-1.webp",
      "images/WhatsApp-Image-2024-01-03-at-7.01.32-AM-2.webp",
      "images/WhatsApp-Image-2024-01-03-at-7.01.32-AM-3.webp",
      "images/WhatsApp-Image-2024-01-03-at-7.01.32-AM-4.webp"
    ]
  },
  maoni: {
    title: "Maoni Orphanage Home Mission",
    location: "Blantyre, Malawi",
    images: [
      "images/FB_IMG_1733439727867.webp",
      "images/FB_IMG_1733439721676.webp",
      "images/FB_IMG_1733439725697.webp",
      "images/FB_IMG_1733439732435.webp",
      "images/FB_IMG_1733439734820.webp",
      "images/FB_IMG_1733439743407.webp",
      "images/FB_IMG_1733439751399.webp",
      "images/FB_IMG_1733439768145.webp"
    ]
  },
  school_fees: {
    title: "Payments of Orphans School Fees & Educational Support",
    location: "Nigeria & Malawi Missions",
    images: [
      "images/sf_1.webp",
      "images/sf_2.webp",
      "images/sf_3.webp",
      "images/receipt.webp"
    ]
  },
  akute: {
    title: "Community Outreach in Akute",
    location: "Akute, Ogun State, Nigeria",
    images: [
      "images/akute-cover.webp",
      "images/WhatsApp-Image-2024-01-03-at-7.01.33-AM.webp",
      "images/WhatsApp-Image-2024-01-03-at-7.01.33-AM-1.webp",
      "images/WhatsApp-Image-2024-01-03-at-7.01.33-AM-2.webp",
      "images/WhatsApp-Image-2024-01-03-at-7.01.33-AM-3-rotated.webp",
      "images/WhatsApp-Image-2024-01-03-at-7.01.33-AM-4.webp",
      "images/WhatsApp-Image-2024-01-03-at-7.01.33-AM-5.webp"
    ]
  },
  oge: {
    title: "Visit to Oge Iyebosa Orphanage Home",
    location: "Benin City, Edo State, Nigeria",
    images: [
      "images/oge-cover.webp",
      "images/FB_IMG_1733439610978.webp",
      "images/FB_IMG_1733439615364.webp",
      "images/FB_IMG_1733439617794.webp",
      "images/FB_IMG_1733439621400.webp",
      "images/FB_IMG_1733439625381.webp",
      "images/FB_IMG_1733439627932.webp",
      "images/FB_IMG_1733439630742.webp",
      "images/FB_IMG_1733439633329.webp"
    ]
  },
  hecareth: {
    title: "Visit to Hecareth Orphanage Home & Cole Home",
    location: "Ibadan & Benin City, Nigeria",
    images: [
      "images/WhatsApp-Image-2024-01-03-at-7.03.05-AM-4.webp",
      "images/WhatsApp-Image-2024-01-03-at-7.03.05-AM.webp",
      "images/WhatsApp-Image-2024-01-03-at-7.03.05-AM-1.webp",
      "images/WhatsApp-Image-2024-01-03-at-7.03.05-AM-2.webp",
      "images/WhatsApp-Image-2024-01-03-at-7.03.05-AM-3.webp"
    ]
  },
  epe: {
    title: "Epe Outreach Missions",
    location: "Epe, Lagos State, Nigeria",
    images: [
      "images/epe_7.webp",
      "images/epe_1.webp",
      "images/epe_2.webp",
      "images/epe_3.webp",
      "images/epe_4.webp",
      "images/epe_5.webp",
      "images/epe_6.webp",
      "images/epe_8.webp"
    ]
  },
  malawi_general: {
    title: "Malawi Outreach - Blantyre Missions",
    location: "Blantyre, Malawi",
    images: [
      "images/malawi-cover.webp",
      "images/mlw_7.webp",
      "images/FB_IMG_1733438863686.webp",
      "images/FB_IMG_1733438884117.webp",
      "images/FB_IMG_1733439159357.webp",
      "images/FB_IMG_1733439168124.webp",
      "images/FB_IMG_1733439228088.webp"
    ]
  },
  birthday: {
    title: "Birthday Celebration Outreach at Shining Star Home",
    location: "Shining Star Home, Abuja, Nigeria",
    images: [
      "images/birthday-cover.webp",
      "images/IMG-20241207-WA0010.webp",
      "images/IMG-20241207-WA0012.webp",
      "images/IMG-20241207-WA0013.webp",
      "images/IMG-20241207-WA0014.webp",
      "images/IMG-20241207-WA0015.webp",
      "images/IMG-20241207-WA0016.webp",
      "images/IMG-20241207-WA0017.webp",
      "images/IMG-20241207-WA0018.webp",
      "images/IMG-20241207-WA0019.webp"
    ]
  },
  nail_malawi: {
    title: "Nail Making & Care Vocational Class",
    location: "Blantyre, Malawi",
    images: [
      "images/nail_malawi_1.webp",
      "images/nail_malawi_2.webp",
      "images/nail_malawi_3.webp",
      "images/nail_malawi_4.webp",
      "images/nail_malawi_5.webp",
      "images/nail_malawi_6.webp",
      "images/nail_malawi_7.webp",
      "images/nail_malawi_8.webp",
      "images/nail_malawi_9.webp"
    ]
  },
  hair_malawi: {
    title: "Hair Styling & Care Vocational Class",
    location: "Blantyre, Malawi",
    images: [
      "images/hair_malawi_1.webp",
      "images/hair_malawi_2.webp",
      "images/hair_malawi_3.webp",
      "images/hair_malawi_4.webp",
      "images/hair_malawi_5.webp",
      "images/hair_malawi_6.webp",
      "images/hair_malawi_7.webp"
    ]
  },
  soap_malawi: {
    title: "Soap Making & Production Vocational Class",
    location: "Blantyre, Malawi",
    images: [
      "images/soap_malawi_1.webp",
      "images/soap_malawi_2.webp",
      "images/soap_malawi_3.webp",
      "images/soap_malawi_4.webp",
      "images/soap_malawi_5.webp",
      "images/soap_malawi_6.webp",
      "images/soap_malawi_7.webp",
      "images/soap_malawi_8.webp",
      "images/soap_malawi_9.webp",
      "images/soap_malawi_10.webp",
      "images/soap_malawi_11.webp",
      "images/soap_malawi_12.webp",
      "images/soap_malawi_13.webp",
      "images/soap_malawi_14.webp",
      "images/soap_malawi_15.webp"
    ]
  }
};

function initLightboxGallery() {
  const lightbox = document.getElementById('lightbox-viewer');
  if (!lightbox) return;

  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const closeBtn = document.querySelector('.lightbox-close');

  let currentGallery = [];
  let currentIndex = 0;
  let currentTitle = '';

  const showImage = (index) => {
    if (!currentGallery.length) return;
    if (index < 0) index = currentGallery.length - 1;
    if (index >= currentGallery.length) index = 0;
    currentIndex = index;

    lightboxImg.src = fixAssetPath(currentGallery[currentIndex]);
    lightboxCaption.textContent = `${currentTitle} — Photo ${currentIndex + 1} of ${currentGallery.length}`;
  };

  document.querySelectorAll('.outreach-card').forEach(card => {
    card.addEventListener('click', () => {
      const missionKey = card.getAttribute('data-mission');
      
      if (missionKey && missionGalleries[missionKey]) {
        const mission = missionGalleries[missionKey];
        currentGallery = mission.images;
        currentIndex = 0;
        currentTitle = `${mission.title} (${mission.location})`;
        showImage(0);
      } else {
        const img = card.querySelector('img');
        const title = card.querySelector('h4');
        const desc = card.querySelector('p');

        if (img) {
          currentGallery = [img.getAttribute('src')];
          currentIndex = 0;
          currentTitle = title ? title.textContent + (desc ? ` (${desc.textContent})` : '') : '';
          lightboxImg.src = fixAssetPath(img.getAttribute('src'));
          lightboxCaption.textContent = currentTitle;
        }
      }

      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  const closeLightbox = () => {
    lightbox.classList.remove('active');
    document.body.style.overflow = 'auto';
  };

  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  // Next / Prev button handling if present or via keyboard arrows
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'ArrowRight') showImage(currentIndex + 1);
    if (e.key === 'ArrowLeft') showImage(currentIndex - 1);
  });
}

/* ==========================================================================
   9. FAQ ACCORDION TOGGLE
   ========================================================================== */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (question) {
      question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');

        faqItems.forEach(i => i.classList.remove('active'));

        if (!isActive) {
          item.classList.add('active');
        }
      });
    }
  });
}

/* ==========================================================================
   10. INTERACTIVE COPY TO CLIPBOARD PILLS
   ========================================================================== */
function initCopyPills() {
  const copyPills = document.querySelectorAll('.copy-pill');
  const toast = document.getElementById('toast-notification');

  copyPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const textToCopy = pill.getAttribute('data-copy') || pill.textContent.trim();
      navigator.clipboard.writeText(textToCopy).then(() => {
        if (toast) {
          toast.querySelector('span').textContent = `Copied "${textToCopy}" to clipboard!`;
          toast.classList.add('show');
          setTimeout(() => toast.classList.remove('show'), 3000);
        }
      });
    });
  });
}

/* ==========================================================================
   11. CONTACT FORM & TOAST NOTIFICATION
   ========================================================================== */
function initContactForm() {
  const form = document.getElementById('trbb-contact-form');
  const toast = document.getElementById('toast-notification');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;">
        <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="10"></circle>
      </svg>
      Sending Message...
    `;

    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
      form.reset();

      if (toast) {
        toast.querySelector('span').textContent = 'Thank you! Your message has been received.';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 4000);
      }
    }, 1200);
  });
}

/* ==========================================================================
   12. MOBILE MENU TOGGLE
   ========================================================================== */
function initMobileMenu() {
  const toggle = document.querySelector('.mobile-toggle');
  const menu = document.querySelector('.nav-menu');
  const closeBtn = document.querySelector('.nav-drawer-close');

  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      menu.classList.toggle('active');
    });

    // Close button inside drawer
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        menu.classList.remove('active');
      });
    }

    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        menu.classList.remove('active');
      });
    });
  }
}

/* ==========================================================================
   13. KEYBOARD NAVIGATION (ESC to close modals)
   ========================================================================== */
function initKeyboardNav() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('program-modal');
      const lightbox = document.getElementById('lightbox-viewer');
      if (modal && modal.classList.contains('active')) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
      }
      if (lightbox && lightbox.classList.contains('active')) {
        lightbox.classList.remove('active');
        document.body.style.overflow = 'auto';
      }
    }
  });
}

/* ==========================================================================
   14. MID-PAGE PARALLAX — breakout sections & page hero background layers
   ========================================================================== */
function initMidPageParallax() {
  const breakoutLayers = document.querySelectorAll('.parallax-bg-layer');
  const pageHeroBg     = document.querySelector('.page-parallax-bg');

  if (!breakoutLayers.length && !pageHeroBg) return;

  let raf = false;
  let lastScroll = window.scrollY;

  window.addEventListener('scroll', () => {
    lastScroll = window.scrollY;
    if (!raf) {
      raf = true;
      requestAnimationFrame(() => {
        breakoutLayers.forEach(layer => {
          const rect   = layer.parentElement.getBoundingClientRect();
          const center = rect.top + rect.height / 2;
          const offset = (window.innerHeight / 2 - center) * 0.22;
          layer.style.transform = `translate3d(0, ${offset}px, 0)`;
        });

        if (pageHeroBg) {
          pageHeroBg.style.transform = `translate3d(0, ${lastScroll * 0.28}px, 0)`;
        }

        raf = false;
      });
    }
  }, { passive: true });
}

/* ==========================================================================
   15. SECTION IN-VIEW MARKER — adds .in-view for CSS divider lines etc.
   ========================================================================== */
function initSectionInView() {
  const sections = document.querySelectorAll('.section');
  if (!sections.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add('in-view');
    });
  }, { threshold: 0.08 });

  sections.forEach(s => obs.observe(s));
}

/* ==========================================================================
   16. MAGNETIC BUTTONS — subtle cursor-attraction on primary CTAs
   ========================================================================== */
function initMagneticButtons() {
  /* Skip on touch devices */
  if (window.matchMedia('(hover: none)').matches) return;

  const magnets = document.querySelectorAll('.btn-primary, .btn-glass');

  magnets.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width  / 2);
      const dy = e.clientY - (rect.top  + rect.height / 2);
      btn.style.transform = `translate(${dx * 0.18}px, ${dy * 0.22}px) scale(1.04)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
      btn.style.transition = 'transform 0.45s cubic-bezier(0.16,1,0.3,1)';
      setTimeout(() => { btn.style.transition = ''; }, 460);
    });
  });
}

/* ==========================================================================
   17. HERO FLOATING PARTICLES — tiny emerald sparks that drift upward
   ========================================================================== */
function initHeroParticles() {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const PARTICLE_COUNT = 22;
  const canvas = document.createElement('canvas');
  canvas.style.cssText = `
    position:absolute; inset:0; width:100%; height:100%;
    pointer-events:none; z-index:2; opacity:0.55;
  `;
  hero.style.position = 'relative';
  hero.appendChild(canvas);

  const ctx  = canvas.getContext('2d');
  const DPR  = Math.min(window.devicePixelRatio || 1, 2);

  const resize = () => {
    canvas.width  = hero.offsetWidth  * DPR;
    canvas.height = hero.offsetHeight * DPR;
    ctx.scale(DPR, DPR);
  };
  resize();
  window.addEventListener('resize', resize, { passive: true });

  const W = () => canvas.width  / DPR;
  const H = () => canvas.height / DPR;

  const COLORS = ['rgba(16,185,129,', 'rgba(167,243,208,', 'rgba(245,158,11,'];

  const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
    x     : Math.random() * W(),
    y     : Math.random() * H(),
    r     : Math.random() * 2.2 + 0.6,
    vx    : (Math.random() - 0.5) * 0.3,
    vy    : -(Math.random() * 0.55 + 0.2),
    alpha : Math.random() * 0.55 + 0.15,
    color : COLORS[Math.floor(Math.random() * COLORS.length)],
  }));

  const draw = () => {
    ctx.clearRect(0, 0, W(), H());
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color + p.alpha + ')';
      ctx.fill();

      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.0012;

      if (p.y < -10 || p.alpha <= 0) {
        p.x     = Math.random() * W();
        p.y     = H() + 10;
        p.alpha = Math.random() * 0.55 + 0.15;
        p.vy    = -(Math.random() * 0.55 + 0.2);
        p.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      }
    });
    requestAnimationFrame(draw);
  };
  draw();
}

/* ==========================================================================
   18. IMAGE REVEAL TILT — subtle perspective tilt on all content images
       as the mouse moves over their containing section.
   ========================================================================== */
function initImageRevealTilt() {
  if (window.matchMedia('(hover: none)').matches) return;

  const wrappers = document.querySelectorAll('.about-image-wrapper, .program-thumb, .outreach-img-wrap');

  wrappers.forEach(wrap => {
    wrap.addEventListener('mousemove', (e) => {
      const rect  = wrap.getBoundingClientRect();
      const x     = (e.clientX - rect.left) / rect.width  - 0.5;
      const y     = (e.clientY - rect.top)  / rect.height - 0.5;
      wrap.style.transform = `perspective(700px) rotateY(${x * 7}deg) rotateX(${-y * 6}deg) scale3d(1.02,1.02,1.02)`;
    });

    wrap.addEventListener('mouseleave', () => {
      wrap.style.transform = '';
      wrap.style.transition = 'transform 0.55s cubic-bezier(0.16,1,0.3,1)';
      setTimeout(() => { wrap.style.transition = ''; }, 560);
    });
  });
}

/* ==========================================================================
   19. STAGGERED REVEAL — adds per-child transition-delay so grid items
       cascade in one-by-one instead of all at once.
       NOTE: we only set transitionDelay here — never add .reveal late
       since the IntersectionObserver has already catalogued elements.
   ========================================================================== */
function initStaggeredReveal() {
  const grids = document.querySelectorAll(
    '.programs-grid, .team-grid, [style*="grid-template-columns"]'
  );

  grids.forEach(grid => {
    const children = Array.from(grid.querySelectorAll('.reveal, .card-glass'));
    children.forEach((child, i) => {
      if (!child.style.animationDelay && !child.style.transitionDelay) {
        child.style.transitionDelay = `${i * 0.08}s`;
      }
    });
  });
}

/* ==========================================================================
   20. CURSOR GLOW — a soft emerald spotlight that follows the cursor
       only on desktop, stays subtle so it doesn't distract.
   ========================================================================== */
function initCursorGlow() {
  if (window.matchMedia('(hover: none)').matches) return;

  const glow = document.createElement('div');
  glow.style.cssText = `
    position: fixed;
    top: 0; left: 0;
    width: 340px; height: 340px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%);
    pointer-events: none;
    z-index: 1;
    transform: translate(-50%, -50%);
    transition: opacity 0.4s ease;
    will-change: transform;
  `;
  document.body.appendChild(glow);

  let mx = 0, my = 0, cx = 0, cy = 0;
  let running = false;

  document.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
    if (!running) {
      running = true;
      requestAnimationFrame(function loop() {
        cx += (mx - cx) * 0.09;
        cy += (my - cy) * 0.09;
        glow.style.transform = `translate3d(${cx - 170}px, ${cy - 170}px, 0)`;
        if (Math.abs(mx - cx) > 0.5 || Math.abs(my - cy) > 0.5) {
          requestAnimationFrame(loop);
        } else {
          running = false;
        }
      });
    }
  }, { passive: true });

  /* Hide glow when cursor leaves the window */
  document.addEventListener('mouseleave', () => { glow.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { glow.style.opacity = '1'; });
}

/* ==========================================================================
   21. FLUTTERWAVE DONATION GATEWAY CONTROLLER
   ========================================================================== */
function initFlutterwaveDonations() {
  const modal = document.getElementById('donation-modal');
  if (!modal) return;

  const closeBtn = modal.querySelector('.donation-modal-close');
  const amountChips = modal.querySelectorAll('.amount-chip');
  const customAmountWrap = document.getElementById('custom-amount-wrap');
  const customAmountInput = document.getElementById('donation-custom-amount');
  const currencyPills = modal.querySelectorAll('.currency-pill');
  const submitBtn = document.getElementById('flutterwave-submit-btn');
  const programSelect = document.getElementById('donation-program-select');
  const donorNameInput = document.getElementById('donation-donor-name');
  const donorEmailInput = document.getElementById('donation-donor-email');

  let selectedCurrency = 'USD';
  let selectedAmount = '50';
  
  const currencyPresets = {
    USD: { symbol: '$', presets: [10, 25, 50, 100, 250] },
    GBP: { symbol: '£', presets: [10, 25, 50, 100, 250] },
    EUR: { symbol: '€', presets: [10, 25, 50, 100, 250] },
    NGN: { symbol: '₦', presets: [5000, 15000, 30000, 75000, 150000] },
    MWK: { symbol: 'MK ', presets: [10000, 25000, 50000, 100000, 250000] }
  };

  // Open Modal trigger for any .open-donate-modal or [href="#donate"] button
  document.querySelectorAll('.open-donate-modal, a[href="#donate"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  // Close modal
  const closeModal = () => {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
  };
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Function to update preset amount chips when currency changes
  function updateAmountChips(curr) {
    const config = currencyPresets[curr] || currencyPresets.USD;
    const nonCustomChips = Array.from(amountChips).filter(c => c.getAttribute('data-amount') !== 'custom');

    nonCustomChips.forEach((chip, index) => {
      if (config.presets[index] !== undefined) {
        const val = config.presets[index];
        chip.setAttribute('data-amount', val);
        chip.textContent = `${config.symbol}${val.toLocaleString()}`;
      }
    });

    const activeChip = Array.from(amountChips).find(c => c.classList.contains('active'));
    if (activeChip) {
      const amt = activeChip.getAttribute('data-amount');
      if (amt === 'custom') {
        selectedAmount = customAmountInput ? customAmountInput.value : '';
      } else {
        selectedAmount = amt;
      }
    }
    updateSubmitBtnText();
  }

  // Currency selection
  currencyPills.forEach(pill => {
    pill.addEventListener('click', () => {
      currencyPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      selectedCurrency = pill.getAttribute('data-currency');
      updateAmountChips(selectedCurrency);
    });
  });

  // Amount chip selection
  amountChips.forEach(chip => {
    chip.addEventListener('click', () => {
      amountChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const amt = chip.getAttribute('data-amount');
      if (amt === 'custom') {
        if (customAmountWrap) customAmountWrap.style.display = 'block';
        if (customAmountInput) customAmountInput.focus();
        selectedAmount = customAmountInput ? customAmountInput.value : '';
      } else {
        if (customAmountWrap) customAmountWrap.style.display = 'none';
        selectedAmount = amt;
      }
      updateSubmitBtnText();
    });
  });

  if (customAmountInput) {
    customAmountInput.addEventListener('input', () => {
      selectedAmount = customAmountInput.value;
      updateSubmitBtnText();
    });
  }

  function updateSubmitBtnText() {
    if (!submitBtn) return;
    const config = currencyPresets[selectedCurrency] || currencyPresets.USD;
    const num = parseFloat(selectedAmount);
    const formattedAmt = selectedAmount && !isNaN(num) ? `${config.symbol}${num.toLocaleString()}` : (selectedAmount ? `${config.symbol}${selectedAmount}` : '');
    submitBtn.innerHTML = `<span>Proceed to Pay ${formattedAmt} with Flutterwave</span> <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
  }

  function resetSubmitBtn() {
    if (!submitBtn) return;
    submitBtn.disabled = false;
    submitBtn.style.opacity = '1';
    updateSubmitBtnText();
  }

  // Submit payment to Flutterwave SDK
  if (submitBtn) {
    submitBtn.addEventListener('click', (e) => {
      e.preventDefault();

      const name = donorNameInput ? donorNameInput.value.trim() : '';
      const email = donorEmailInput ? donorEmailInput.value.trim() : '';
      const program = programSelect ? programSelect.value : 'General Mission Fund';

      if (!name) {
        alert('Please enter your full name.');
        if (donorNameInput) donorNameInput.focus();
        return;
      }
      if (!email || !email.includes('@')) {
        alert('Please enter a valid email address.');
        if (donorEmailInput) donorEmailInput.focus();
        return;
      }

      const numericAmount = parseFloat(selectedAmount);
      if (!numericAmount || numericAmount <= 0) {
        alert('Please select or enter a valid donation amount.');
        return;
      }

      if (typeof FlutterwaveCheckout !== 'function') {
        alert('Flutterwave payment gateway is loading. Please check your internet connection and try again.');
        return;
      }

      // Immediate visual loading feedback & disable double submission
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.8';
      submitBtn.innerHTML = `<span>Opening Secure Gateway...</span> <svg class="spin-loader" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>`;

      // Safety reset timer (unlocks button after 6 seconds)
      const loadSafetyTimer = setTimeout(resetSubmitBtn, 6000);

      const currentTxRef = 'TRBB-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

      // Record INITIATED transaction in CMS API / Local Log
      const initPayload = {
        tx_ref: currentTxRef,
        name: name,
        email: email,
        amount: numericAmount,
        currency: selectedCurrency,
        program: program,
        status: 'initiated'
      };

      try {
        fetch(fixAssetPath('api/transactions/initiate'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(initPayload)
        }).catch(() => {});

        // Local storage backup for offline dev
        const localLog = JSON.parse(localStorage.getItem('trbb_transactions_log') || '[]');
        localLog.unshift({ ...initPayload, createdAt: new Date().toISOString() });
        localStorage.setItem('trbb_transactions_log', JSON.stringify(localLog));
      } catch (e) {}

      // Trigger Flutterwave Payment Modal
      FlutterwaveCheckout({
        public_key: 'FLWPUBK_TEST-7dd02dc60a4a28b80ba3d0ca27ec3887-X', // Flutterwave Test Public Key
        tx_ref: currentTxRef,
        amount: numericAmount,
        currency: selectedCurrency,
        payment_options: 'card, mobilemoney, ussd, banktransfer',
        customer: {
          email: email,
          name: name
        },
        customizations: {
          title: 'Tender Roots Beyond Borders Inc.',
          description: `Donation: ${program}`,
          logo: fixAssetPath('images/tr_logo.webp')
        },
        callback: function (data) {
          clearTimeout(loadSafetyTimer);
          resetSubmitBtn();
          console.log('Payment complete', data);

          // Record SUCCESS status in CMS API / Local Log
          const flwRef = data.transaction_id || data.flw_ref || data.tx_ref;
          try {
            fetch(fixAssetPath('api/transactions/update'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tx_ref: currentTxRef, status: 'success', flw_ref: flwRef })
            }).catch(() => {});

            const localLog = JSON.parse(localStorage.getItem('trbb_transactions_log') || '[]');
            const item = localLog.find(t => t.tx_ref === currentTxRef);
            if (item) { item.status = 'success'; item.flw_ref = flwRef; }
            else { localLog.unshift({ ...initPayload, status: 'success', flw_ref: flwRef, createdAt: new Date().toISOString() }); }
            localStorage.setItem('trbb_transactions_log', JSON.stringify(localLog));
          } catch (e) {}

          closeModal();
          alert(`Thank you, ${name}! Your donation of ${selectedCurrency} ${numericAmount} to Tender Roots Beyond Borders Inc. was successful.\nTransaction Ref: ${flwRef}`);
        },
        onclose: function() {
          clearTimeout(loadSafetyTimer);
          resetSubmitBtn();
          console.log('Payment modal closed');
        }
      });
    });
  }
}

/* ==========================================================================
   22. COOKIE CONSENT BANNER CONTROLLER
   ========================================================================== */
function initCookieConsent() {
  const existingConsent = localStorage.getItem('trbb_cookie_consent');

  // Inject Cookie Banner HTML if not present
  let banner = document.getElementById('cookie-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.className = 'cookie-banner-wrap';
    banner.innerHTML = `
      <div class="cookie-banner-card">
        <div class="cookie-text-wrap">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2" style="flex-shrink: 0;"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5 10 10 0 0 0 0 0z"></path><path d="M8.5 8.5v.01"></path><path d="M16 15.5v.01"></path><path d="M12 12v.01"></path><path d="M11 17v.01"></path><path d="M7 14v.01"></path></svg>
          <p>We use essential cookies and payment security technologies to ensure an optimal experience. Learn more in our <a href="${fixAssetPath('privacy/')}">Privacy &amp; Cookie Policy</a>.</p>
        </div>
        <div class="cookie-actions">
          <button type="button" id="cookie-accept-btn" class="cookie-btn cookie-btn-primary">Accept All</button>
          <button type="button" id="cookie-decline-btn" class="cookie-btn cookie-btn-outline">Essential Only</button>
        </div>
      </div>
    `;
    document.body.appendChild(banner);
  }

  const showBanner = () => banner.classList.add('show');
  const hideBanner = () => banner.classList.remove('show');

  if (!existingConsent) {
    setTimeout(showBanner, 1500);
  }

  document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'cookie-accept-btn') {
      localStorage.setItem('trbb_cookie_consent', 'accepted');
      hideBanner();
    }
    if (e.target && e.target.id === 'cookie-decline-btn') {
      localStorage.setItem('trbb_cookie_consent', 'essential');
      hideBanner();
    }
    if (e.target && (e.target.classList.contains('open-cookie-settings') || e.target.getAttribute('href') === '#cookies')) {
      e.preventDefault();
      showBanner();
    }
  });
}


