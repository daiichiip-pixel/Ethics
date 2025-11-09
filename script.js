// script.js (finalized, safe)
// - single header + mini-cart anchor
// - shop renderer (safe: waits for VAST_PRODUCTS)
// - hero autoplay + fallback + modal + hero-fit
// - no injected placeholders; no duplicate elements

(function () {
  const $ = (s, ctx = document) => (ctx || document).querySelector(s);
  const $$ = (s, ctx = document) => Array.from((ctx || document).querySelectorAll(s));

  // Keep a single skip-link; remove extras if present
  (function dedupeSkips() {
    const nodes = Array.from(document.querySelectorAll('.skip-link'));
    if (nodes.length <= 1) return;
    nodes.slice(1).forEach(n => n.remove());
  })();

  // Mini-cart setup (single anchored instance)
  function setupMiniCart() {
    const cartBtn = document.getElementById('cartToggle') || document.querySelector('.cart-toggle');
    const miniCart = document.getElementById('miniCart');
    if (!miniCart) return;
    if (!miniCart.hasAttribute('aria-hidden')) miniCart.setAttribute('aria-hidden', 'true');

    function openCart() {
      miniCart.setAttribute('aria-hidden', 'false');
      if (cartBtn) cartBtn.setAttribute('aria-expanded', 'true');
      if (window.innerWidth < 720) document.body.style.overflow = 'hidden';
    }
    function closeCart() {
      miniCart.setAttribute('aria-hidden', 'true');
      if (cartBtn) cartBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    if (cartBtn) {
      cartBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = miniCart.getAttribute('aria-hidden') === 'false';
        if (isOpen) closeCart(); else openCart();
      });
    }

    document.addEventListener('click', (e) => {
      if (!miniCart.contains(e.target) && !(cartBtn && cartBtn.contains(e.target))) closeCart();
    });

    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCart(); });
  }

  // Update mini-cart UI
  function updateMiniCartUI(products = window.VAST_PRODUCTS || []) {
    const key = 'vast_cart_v1';
    let cart = [];
    try { cart = JSON.parse(localStorage.getItem(key) || '[]'); } catch (e) { cart = []; }
    const count = cart.reduce((s,i) => s + (i.qty||0), 0);
    $$('#cartCount').forEach(n => { if (n) n.textContent = count; });

    $$('.mini-cart__items').forEach(container => {
      container.innerHTML = '';
      if (!cart.length) { container.innerHTML = '<div style="color:rgba(255,255,255,0.6)">Your cart is empty</div>'; return; }
      cart.forEach(it => {
        const p = products.find(x => x.id === it.id) || { title: it.id, images: [''], price: 0 };
        const row = document.createElement('div');
        row.className = 'mini-item';
        row.innerHTML = `<img src="${p.images?.[0] || ''}" alt="${p.title}" onerror="this.src='';this.style.background='#111'"><div style="flex:1"><strong>${p.title}</strong><div style="font-size:13px;color:rgba(255,255,255,0.6)">${it.qty} × $${(p.price||0).toFixed(2)}</div></div>`;
        container.appendChild(row);
      });
    });

    const subtotal = cart.reduce((s,it) => {
      const p = products.find(x => x.id === it.id);
      return s + ((p?.price || 0) * (it.qty || 1));
    }, 0);
    const shipping = subtotal > 150 ? 0 : (subtotal > 0 ? 9.99 : 0);
    const total = subtotal + shipping;
    $$('#miniCartTotal').forEach(n => { if (n) n.textContent = `$${total.toFixed(2)}`; });
  }

  // Hero autoplay/fallback/modal + hero-fit to prevent clipping
  function initHero() {
    const heroVideo = $('#heroVideo');
    const autoplayFallback = $('#autoplayFallback');
    const watchFull = $('#watchFull');
    const modal = $('#videoModal');
    const modalVideo = $('#modalVideo');
    const modalClose = $('#modalClose');
    const modalBackdrop = modal ? modal.querySelector('.modal__backdrop') : null;

    if (!heroVideo) return;

    async function tryAutoplay() {
      heroVideo.muted = true;
      try { heroVideo.playsInline = true; } catch (e) {}
      try { await heroVideo.play(); if (autoplayFallback) autoplayFallback.hidden = true; }
      catch (err) {
        if (autoplayFallback) {
          autoplayFallback.hidden = false;
          autoplayFallback.addEventListener('click', () => { heroVideo.muted = true; heroVideo.play().then(()=>autoplayFallback.hidden=true).catch(()=>{}); }, { once: true });
        }
      }
    }
    tryAutoplay();

    if (watchFull && modal) {
      watchFull.addEventListener('click', (e) => {
        e.preventDefault();
        // ensure modalVideo is only populated once and modal is the existing element
        if (modalVideo && modalVideo.querySelectorAll('source').length === 0) {
          const s = document.createElement('source'); s.src = 'hero-full-1080.mp4'; s.type = 'video/mp4';
          modalVideo.appendChild(s); modalVideo.load();
        }
        heroVideo.pause();
        modal.setAttribute('aria-hidden','false');
        modalVideo.currentTime = 0;
        modalVideo.play().catch(()=>{});
      });
    }

    if (modalClose) modalClose.addEventListener('click', () => { modal.setAttribute('aria-hidden','true'); if (modalVideo) modalVideo.pause(); heroVideo.play().catch(()=>{}); });
    if (modalBackdrop) modalBackdrop.addEventListener('click', () => { modal.setAttribute('aria-hidden','true'); if (modalVideo) modalVideo.pause(); heroVideo.play().catch(()=>{}); });

    // hero-fit: reduce inline font-size until title fits inside hero
    (function heroFit() {
      const title = $('#heroTitle');
      const heroEl = $('#hero');
      const header = $('.site-header');
      if (!title || !heroEl) return;
      const base = parseFloat(window.getComputedStyle(title).fontSize);
      const minFont = Math.max(28, Math.round(base * 0.45));
      const step = 2;
      function fits() {
        const hr = heroEl.getBoundingClientRect();
        const hh = header ? header.getBoundingClientRect().height : 0;
        const avail = hr.height - hh - 8;
        const tr = title.getBoundingClientRect();
        const top = tr.top - hr.top;
        const bottom = top + tr.height;
        return top >= 0 && bottom <= avail;
      }
      function shrink() {
        let cur = parseFloat(window.getComputedStyle(title).fontSize);
        if (fits()) return;
        while (cur > minFont && !fits()) {
          cur = Math.max(minFont, cur - step);
          title.style.fontSize = cur + 'px';
        }
      }
      function restoreAndFit() { title.style.fontSize = ''; requestAnimationFrame(() => { if (!fits()) shrink(); }); }
      window.addEventListener('resize', restoreAndFit);
      window.addEventListener('load', () => setTimeout(restoreAndFit, 60));
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => setTimeout(restoreAndFit, 30)).catch(()=>{});
    })();
  }

  // Shop renderer: safe (waits for products array) and builds grid
  function renderShop() {
    const grid = $('#shopGrid');
    if (!grid) return;
    const products = window.VAST_PRODUCTS || [];
    grid.innerHTML = '';
    if (!Array.isArray(products) || products.length === 0) {
      // show a simple "no products" message (not intrusive)
      grid.innerHTML = '<div class="no-products">No products available.</div>';
      return;
    }
    products.forEach(p => {
      const el = document.createElement('div');
      el.className = 'card';
      el.innerHTML = `<img src="${p.images?.[0] || ''}" alt="${p.title}" onerror="this.src='';this.style.background='#111'"><h3>${p.title}</h3><div class="price">$${p.price.toFixed(2)}</div><p style="color:rgba(255,255,255,0.6)">${p.description}</p><div style="margin-top:auto"><a class="btn btn--ghost" href="product.html?id=${encodeURIComponent(p.id)}">View</a> <button class="btn btn--primary add-to-cart" data-id="${p.id}">Add to cart</button></div>`;
      grid.appendChild(el);
    });
  }

  // bootstrap
  function bootstrap() {
    setupMiniCart();
    updateMiniCartUI(window.VAST_PRODUCTS || []);
    initHeroAndModal && initHeroAndModal();
    renderShop();

    // nav highlight
    const links = $$('.main-nav a');
    const current = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    links.forEach(a => {
      const href = (a.getAttribute('href')||'').split('/').pop().toLowerCase();
      if (href === current || (href === 'index.html' && current === '')) { a.classList.add('active'); a.setAttribute('aria-current','page'); } else { a.classList.remove('active'); a.removeAttribute('aria-current'); }
    });

    // add-to-cart handler
    document.body.addEventListener('click', (e) => {
      if (e.target.matches('.add-to-cart')) {
        const id = e.target.dataset.id || 'pl-'+Math.random().toString(36).slice(2,8);
        const key = 'vast_cart_v1';
        let cart = [];
        try { cart = JSON.parse(localStorage.getItem(key) || '[]'); } catch (err) { cart = []; }
        const idx = cart.findIndex(it => it.id === id);
        if (idx >= 0) cart[idx].qty += 1; else cart.push({ id, qty: 1 });
        localStorage.setItem(key, JSON.stringify(cart));
        updateMiniCartUI(window.VAST_PRODUCTS || []);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', bootstrap);

  // Expose debug helpers
  window.__vast = { updateMiniCartUI, renderShop, setupMiniCart };
})();