/**
 * RoadMapVenture — Shared Navigation
 * Edit NAV_LINKS to update the nav across every page.
 * Includes mobile hamburger menu for Safari/iPhone.
 */

(function() {

  // ── NAV STRUCTURE ── edit links/labels here ──────────────────────────────
  const NAV_LINKS = [
    { href: 'resume.html',          label: 'Resume' },
    { href: 'nigp-marketing.html',  label: 'Procurement Intelligence' },
    { href: 'playbook.html',        label: 'The Product Playbook' },
    { href: 'about.html',           label: 'About' },
  ];

  // ── CONTACT DATA (base64 encoded — never plain text) ─────────────────────
  const PHONE_B64 = 'NTEyLjU4NS44NTEz';
  const EMAIL_B64 = 'amxlb25hQHlhaG9vLmNvbQ==';

  // ── INJECT STYLES ─────────────────────────────────────────────────────────
  function injectStyles() {
    const css = `
      /* ── NAV BASE ── */
      nav {
        position: fixed; top: 0; left: 0; right: 0; z-index: 200;
        display: flex; align-items: center; justify-content: space-between;
        padding: 0 56px; height: 68px;
        background: rgba(250,248,245,.95);
        backdrop-filter: blur(12px);
        border-bottom: 1px solid rgba(200,169,110,.25);
        font-family: 'DM Sans', sans-serif;
      }
      .nav-logo {
        font-family: 'Cormorant Garamond', serif;
        font-size: 20px; font-weight: 400; letter-spacing: .04em;
        color: #1a1814; text-decoration: none; flex-shrink: 0;
      }
      .nav-logo span { color: #c8a96e; }

      /* ── DESKTOP LINKS ── */
      .nav-links {
        display: flex; gap: 40px; list-style: none;
        align-items: center;
      }
      .nav-links a {
        font-size: 11px; letter-spacing: .18em; text-transform: uppercase;
        color: #6b6057; text-decoration: none;
        transition: color .2s; position: relative;
      }
      .nav-links a::after {
        content: ''; position: absolute; left: 0; bottom: -3px;
        width: 0; height: 1px; background: #c8a96e; transition: width .25s;
      }
      .nav-links a:hover, .nav-links a.active { color: #1a1814; }
      .nav-links a:hover::after, .nav-links a.active::after { width: 100%; }

      /* ── DESKTOP CTA ── */
      .nav-cta {
        font-family: 'DM Sans', sans-serif;
        font-size: 11px; letter-spacing: .15em; text-transform: uppercase;
        color: #1a1814; background: transparent;
        border: 1px solid #1a1814; padding: 9px 20px;
        cursor: pointer; transition: all .22s; flex-shrink: 0;
      }
      .nav-cta:hover { background: #1a1814; color: #faf8f5; }

      /* ── HAMBURGER BUTTON ── */
      .nav-hamburger {
        display: none;
        flex-direction: column; justify-content: center;
        gap: 5px; background: none; border: none;
        cursor: pointer; padding: 8px; margin-left: 8px;
        width: 40px; height: 40px;
      }
      .nav-hamburger span {
        display: block; width: 22px; height: 1.5px;
        background: #1a1814; transition: all .25s;
        transform-origin: center;
      }
      .nav-hamburger.open span:nth-child(1) { transform: translateY(6.5px) rotate(45deg); }
      .nav-hamburger.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
      .nav-hamburger.open span:nth-child(3) { transform: translateY(-6.5px) rotate(-45deg); }

      /* ── MOBILE DRAWER ── */
      .nav-drawer {
        display: none;
        position: fixed; top: 68px; left: 0; right: 0; bottom: 0;
        background: #faf8f5; z-index: 199;
        flex-direction: column;
        padding: 32px 28px 40px;
        overflow-y: auto;
        border-top: 1px solid rgba(200,169,110,.25);
        animation: drawerIn .22s ease both;
      }
      .nav-drawer.open { display: flex; }

      @keyframes drawerIn {
        from { opacity: 0; transform: translateY(-8px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      .nav-drawer-links {
        list-style: none; display: flex; flex-direction: column;
        gap: 0; flex: 1;
      }
      .nav-drawer-links li {
        border-bottom: 1px solid rgba(200,169,110,.2);
      }
      .nav-drawer-links a {
        display: block; padding: 18px 0;
        font-family: 'Cormorant Garamond', serif;
        font-size: 26px; font-weight: 300;
        color: #1a1814; text-decoration: none;
        transition: color .2s;
      }
      .nav-drawer-links a.active { color: #c8a96e; }
      .nav-drawer-links a:hover { color: #c8a96e; }

      .nav-drawer-cta {
        margin-top: 32px;
        font-family: 'DM Sans', sans-serif;
        font-size: 11px; letter-spacing: .18em; text-transform: uppercase;
        color: #faf8f5; background: #1a1814;
        border: none; padding: 16px 28px;
        cursor: pointer; text-align: center; width: 100%;
        transition: background .22s;
      }
      .nav-drawer-cta:hover { background: #3a342c; }

      /* ── MOBILE BREAKPOINT ── */
      @media (max-width: 768px) {
        nav { padding: 0 20px; }
        .nav-links { display: none !important; }
        .nav-cta { display: none !important; }
        .nav-hamburger { display: flex; }
      }
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ── BUILD NAV ─────────────────────────────────────────────────────────────
  function buildNav(activePage) {
    const desktopLinks = NAV_LINKS.map(link => {
      const isActive = link.href === activePage;
      return `<li><a href="${link.href}"${isActive ? ' class="active"' : ''}>${link.label}</a></li>`;
    }).join('\n    ');

    const drawerLinks = NAV_LINKS.map(link => {
      const isActive = link.href === activePage;
      return `<li><a href="${link.href}"${isActive ? ' class="active"' : ''}>${link.label}</a></li>`;
    }).join('\n      ');

    const navHTML = `<nav id="siteNav">
  <a class="nav-logo" href="index.html">RoadMap<span>Venture</span></a>
  <ul class="nav-links">
    ${desktopLinks}
  </ul>
  <button class="nav-cta" onclick="openContactModal()">Get in Touch</button>
  <button class="nav-hamburger" id="navHamburger" onclick="toggleMobileNav()" aria-label="Menu">
    <span></span><span></span><span></span>
  </button>
</nav>
<div class="nav-drawer" id="navDrawer">
  <ul class="nav-drawer-links">
    ${drawerLinks}
  </ul>
  <button class="nav-drawer-cta" onclick="openContactModal();closeMobileNav();">Get in Touch</button>
</div>`;

    const existing = document.querySelector('nav');
    if (existing) {
      existing.outerHTML = navHTML;
    } else {
      document.body.insertAdjacentHTML('afterbegin', navHTML);
    }
  }

  // ── MOBILE NAV TOGGLE ─────────────────────────────────────────────────────
  window.toggleMobileNav = function() {
    const drawer = document.getElementById('navDrawer');
    const burger = document.getElementById('navHamburger');
    const isOpen = drawer.classList.contains('open');
    if (isOpen) {
      drawer.classList.remove('open');
      burger.classList.remove('open');
      document.body.style.overflow = '';
    } else {
      drawer.classList.add('open');
      burger.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  };

  window.closeMobileNav = function() {
    const drawer = document.getElementById('navDrawer');
    const burger = document.getElementById('navHamburger');
    drawer.classList.remove('open');
    burger.classList.remove('open');
    document.body.style.overflow = '';
  };

  // ── CONTACT MODAL ─────────────────────────────────────────────────────────
  function buildModal() {
    const modalHTML = `
<div id="siteContactModal" style="display:none;position:fixed;inset:0;z-index:9999;background:rgba(26,24,20,.72);backdrop-filter:blur(6px);align-items:center;justify-content:center;" onclick="if(event.target===this)closeContactModal()">
  <div style="background:#faf8f5;border:1px solid rgba(200,169,110,.25);padding:40px 44px;max-width:440px;width:90%;position:relative;">
    <div style="font-size:10px;letter-spacing:.28em;text-transform:uppercase;color:#c8a96e;margin-bottom:20px;display:flex;align-items:center;gap:10px;">
      <span style="display:block;width:20px;height:1px;background:#c8a96e;"></span>Get in Touch
    </div>
    <div style="font-family:'Cormorant Garamond',serif;font-size:30px;font-weight:300;color:#1a1814;margin-bottom:28px;line-height:1.15;">
      Let's build something<br><em style="color:#c8a96e">worth shipping.</em>
    </div>
    <div id="navModalPhone" style="padding:14px 0;border-bottom:1px solid rgba(200,169,110,.25);cursor:pointer;" onclick="revealModalContact('phone')" title="Click to reveal">
      <div style="font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#c8a96e;margin-bottom:4px;">Phone</div>
      <div id="navModalPhoneVal" style="font-family:'Cormorant Garamond',serif;font-size:20px;color:#1a1814;" data-val="${PHONE_B64}">
        <span style="font-size:12px;color:#c8a96e;letter-spacing:.1em;">↗ Tap to reveal</span>
      </div>
    </div>
    <div id="navModalEmail" style="padding:14px 0;border-bottom:1px solid rgba(200,169,110,.25);cursor:pointer;" onclick="revealModalContact('email')" title="Click to reveal">
      <div style="font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#c8a96e;margin-bottom:4px;">Email</div>
      <div id="navModalEmailVal" style="font-family:'Cormorant Garamond',serif;font-size:20px;color:#1a1814;" data-val="${EMAIL_B64}">
        <span style="font-size:12px;color:#c8a96e;letter-spacing:.1em;">↗ Tap to reveal</span>
      </div>
    </div>
    <div style="padding:14px 0;border-bottom:1px solid rgba(200,169,110,.25);">
      <div style="font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#c8a96e;margin-bottom:4px;">LinkedIn</div>
      <div style="font-family:'Cormorant Garamond',serif;font-size:20px;">
        <a href="https://www.linkedin.com/in/leonardjohn/" target="_blank" style="color:#1a1814;text-decoration:none;">linkedin.com/in/leonardjohn ↗</a>
      </div>
    </div>
    <div style="padding:14px 0;">
      <div style="font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#c8a96e;margin-bottom:4px;">Location</div>
      <div style="font-family:'Cormorant Garamond',serif;font-size:20px;color:#1a1814;">Austin, Texas</div>
    </div>
    <button onclick="closeContactModal()" style="position:absolute;top:20px;right:24px;background:none;border:none;font-size:24px;color:#6b6057;cursor:pointer;line-height:1;">×</button>
  </div>
</div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  // ── MODAL FUNCTIONS ───────────────────────────────────────────────────────
  window.openContactModal = function() {
    document.getElementById('siteContactModal').style.display = 'flex';
  };

  window.closeContactModal = function() {
    document.getElementById('siteContactModal').style.display = 'none';
    var pEl = document.getElementById('navModalPhoneVal');
    var eEl = document.getElementById('navModalEmailVal');
    pEl.innerHTML = '<span style="font-size:12px;color:#c8a96e;letter-spacing:.1em;">↗ Tap to reveal</span>';
    eEl.innerHTML = '<span style="font-size:12px;color:#c8a96e;letter-spacing:.1em;">↗ Tap to reveal</span>';
    document.getElementById('navModalPhone').style.cursor = 'pointer';
    document.getElementById('navModalEmail').style.cursor = 'pointer';
  };

  window.revealModalContact = function(type) {
    if (type === 'phone') {
      var el = document.getElementById('navModalPhoneVal');
      var val = atob(el.dataset.val);
      el.innerHTML = '<a href="tel:+1' + val.replace(/\./g, '') + '" style="color:#1a1814;text-decoration:none;">' + val + '</a>';
      document.getElementById('navModalPhone').style.cursor = 'default';
    } else {
      var el = document.getElementById('navModalEmailVal');
      var val = atob(el.dataset.val);
      el.innerHTML = '<a href="mailto:' + val + '" style="color:#1a1814;text-decoration:none;">' + val + '</a>';
      document.getElementById('navModalEmail').style.cursor = 'default';
    }
  };

  // Close on Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      window.closeContactModal();
      window.closeMobileNav();
    }
  });

  // ── PUBLIC INIT ───────────────────────────────────────────────────────────
  window.initNav = function(activePage) {
    injectStyles();
    buildNav(activePage || '');
    buildModal();
  };

})();
