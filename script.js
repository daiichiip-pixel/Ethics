// script.js — fixes for robust shop rendering + mini-cart + hero behavior
// - Waits a short time for window.VAST_PRODUCTS then renders Featured/Shop
// - Ensures hero Play/Pause and Watch Full Video work reliably (single wiring)
// - Keeps mini-cart anchored; styles handled in CSS
// - Defensive: only acts on elements that exist (won't break other pages)

(function () {
  const $ = (s, ctx = document) => (ctx || document).querySelector(s);
  const $$ = (s, ctx = document) => Array.from((ctx || document).querySelectorAll(s));

  // Remove extra skip links, keep the first
  (function dedupeSkipLinks() {
    const nodes = Array.from(document.querySelectorAll('.skip-link'));
    if (nodes.length <= 1) return;
    nodes.slice(1).forEach(n => n.remove());
  })();

  // Mini-cart: single anchored popover, hidden by default
  function setupMiniCart() {
    const cartBtn = document.getElementById('cartToggle') || document.querySelector('.cart-toggle');
    const miniCart = document.getElementById('miniCart');
    if (!miniCart) return;
    if (!miniCart.hasAttribute('aria-hidden')) miniCart.setAttribute('aria-hidden', 'true');

    function openCart() { miniCart.setAttribute('aria-hidden', 'false'); if (cartBtn) cartBtn.setAttribute('aria-expanded', 'true'); if (window.innerWidth < 720) document.body.style.overflow = 'hidden'; }
    function closeCart() { miniCart.setAttribute('aria-hidden', 'true'); if (cartBtn) cartBtn.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; }

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
    const count = cart.reduce((s, i) => s + (i.qty||0), 0);
    $$('#cartCount').forEach(n => { if (n) n.textContent = count; });

    $$('.mini-cart__items').forEach(container => {
      container.innerHTML = '';
      if (!cart.length) { container.innerHTML = '<div style="color:rgba(255,255,255,0.6)">Your cart is empty</div>'; return; }
      cart.forEach(it => {
        const p = products.find(x => x.id === it.id) || { title: it.id, images: [''], price: 0 };
        const row = document.createElement('div');
        row.className = 'mini-item';
        row.innerHTML = `<img src="${p.images?.[0]||''}" alt="${p.title}" onerror="this.src='';this.style.background='#111'"><div style="flex:1"><strong>${p.title}</strong><div style="font-size:13px;color:rgba(255,255,255,0.6)">${it.qty} × $${(p.price||0).toFixed(2)}</div></div>`;
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

  // Hero behavior (autoplay/fallback/play toggle/modal)
  function initHeroBehavior() {
    const heroVideo = $('#heroVideo');
    if (!heroVideo) return;

    const toggleBtn = $('#togglePlay');
    const toggleIcon = $('#toggleIcon');
    const autoplayFallback = $('#autoplayFallback');
    const watchBtn = $('#watchFull');
    const modal = $('#videoModal');
    const modalVideo = $('#modalVideo');
    const modalClose = $('#modalClose');
    const modalBackdrop = modal ? modal.querySelector('.modal__backdrop') : null;

    function setToggleState(paused) {
      if (!toggleBtn || !toggleIcon) return;
      if (paused) { toggleIcon.textContent = '▶'; toggleBtn.setAttribute('aria-pressed', 'true'); toggleBtn.setAttribute('aria-label','Play background video'); }
      else { toggleIcon.textContent = '❚❚'; toggleBtn.setAttribute('aria-pressed','false'); toggleBtn.setAttribute('aria-label','Pause background video'); }
    }

    // defensive: remove native controls if present
    if (heroVideo.hasAttribute('controls')) heroVideo.removeAttribute('controls');

    async function tryAutoplay() {
      heroVideo.muted = true;
      try { heroVideo.playsInline = true; } catch (e) {}
      try {
        await heroVideo.play();
        setToggleState(false);
        if (autoplayFallback) autoplayFallback.hidden = true;
      } catch (err) {
        if (autoplayFallback) {
          autoplayFallback.hidden = false;
          autoplayFallback.addEventListener('click', () => {
            heroVideo.muted = true;
            heroVideo.play().then(()=>autoplayFallback.hidden=true).catch(()=>{});
          }, { once: true });
        }
        setToggleState(true);
      }
    }

    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (heroVideo.paused) heroVideo.play().catch(()=>{});
        else heroVideo.pause();
      });
      heroVideo.addEventListener('play', () => setToggleState(false));
      heroVideo.addEventListener('pause', () => setToggleState(true));
      setToggleState(heroVideo.paused);
    }

    // modal population (deferred)
    function populateModalVideo() {
      if (!modalVideo) return;
      if (modalVideo.querySelector('source')) return;
      const s = document.createElement('source');
      s.src = 'hero-full-1080.mp4';
      s.type = 'video/mp4';
      modalVideo.appendChild(s);
      modalVideo.load();
    }
    function openModal() {
      if (!modal) return;
      populateModalVideo();
      if (!heroVideo.paused) heroVideo.pause();
      modal.setAttribute('aria-hidden','false');
      document.body.style.overflow = 'hidden';
      modalVideo.currentTime = 0;
      modalVideo.play().catch(()=>{});
      modalClose && modalClose.focus && modalClose.focus();
    }
    function closeModal() {
      if (!modal) return;
      modal.setAttribute('aria-hidden','true');
      document.body.style.overflow = '';
      modalVideo && modalVideo.pause();
      if (heroVideo && toggleBtn && toggleBtn.getAttribute('aria-pressed') === 'false') heroVideo.play().catch(()=>{});
    }

    if (watchBtn) watchBtn.addEventListener('click', (e) => { e.preventDefault(); openModal(); });
    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);
    if (modal) modal.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

    // keyboard toggles
    document.addEventListener('keydown', (e) => {
      const tag = document.activeElement && document.activeElement.tagName && document.activeElement.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || document.activeElement?.isContentEditable) return;
      if (modal && modal.getAttribute('aria-hidden') === 'false') {
        if (e.key === 'Escape') { e.preventDefault(); closeModal(); }
        return;
      }
      if ((e.key === ' ' || e.key.toLowerCase() === 'k') && heroVideo) {
        e.preventDefault();
        if (heroVideo.paused) heroVideo.play().catch(()=>{});
        else heroVideo.pause();
      }
    });

    // hero-fit to avoid clipping
    (function heroFit() {
      const title = $('#heroTitle');
      const heroEl = $('#hero');
      const header = $('.site-header');
      if (!title || !heroEl) return;
      const original = parseFloat(window.getComputedStyle(title).fontSize);
      const minFont = Math.max(28, Math.round(original*0.45));
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
      function restoreThenFit() { title.style.fontSize=''; requestAnimationFrame(()=>{ if (!fits()) shrink(); }); }
      window.addEventListener('resize', restoreThenFit);
      window.addEventListener('load', () => setTimeout(restoreThenFit, 60));
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(()=>setTimeout(restoreThenFit,30)).catch(()=>{});
    })();

    tryAutoplay();
  }

  // Render products for Featured (home) and Shop — wait for VAST_PRODUCTS if needed
  function renderProductsWhenAvailable(timeoutMs = 2000) {
    const start = Date.now();

    function tryRender() {
      if (Array.isArray(window.VAST_PRODUCTS)) {
        // Featured (home)
        const featured = $('#productGrid');
        if (featured) {
          featured.innerHTML = '';
          window.VAST_PRODUCTS.slice(0,4).forEach(p => {
            const el = document.createElement('div'); el.className='card';
            el.innerHTML = `<img src="${p.images?.[0]||''}" alt="${p.title}" onerror="this.src='';this.style.background='#111'"><h3>${p.title}</h3><div class="price">$${p.price.toFixed(2)}</div><p style="color:rgba(255,255,255,0.6)">${p.description}</p><div style="margin-top:auto"><a class="btn btn--ghost" href="product.html?id=${encodeURIComponent(p.id)}">View</a> <button class="btn btn--primary add-to-cart" data-id="${p.id}">Add to cart</button></div>`;
            featured.appendChild(el);
          });
        }

        // Shop grid
        const shopGrid = $('#shopGrid');
        if (shopGrid) {
          shopGrid.innerHTML = '';
          window.VAST_PRODUCTS.forEach(p => {
            const el = document.createElement('div'); el.className='card';
            el.innerHTML = `<img src="${p.images?.[0]||''}" alt="${p.title}" onerror="this.src='';this.style.background='#111'"><h3>${p.title}</h3><div class="price">$${p.price.toFixed(2)}</div><p style="color:rgba(255,255,255,0.6)">${p.description}</p><div style="margin-top:auto"><a class="btn btn--ghost" href="product.html?id=${encodeURIComponent(p.id)}">View</a> <button class="btn btn--primary add-to-cart" data-id="${p.id}">Add to cart</button></div>`;
            shopGrid.appendChild(el);
          });
        }

        return true;
      } else {
        if (Date.now() - start < timeoutMs) {
          setTimeout(tryRender, 60);
          return false;
        } else {
          // timed out — show friendly message if grids present
          const shopGrid = $('#shopGrid'); if (shopGrid) shopGrid.innerHTML = '<div class="no-products">No products available.</div>';
          const featured = $('#productGrid'); if (featured && featured.children.length === 0) featured.innerHTML = '<div class="no-products">No featured products available.</div>';
          return false;
        }
      }
    }
    tryRender();
  }

  // bootstrap
  function bootstrap() {
    setupMiniCart();
    updateMiniCartUI(window.VAST_PRODUCTS || []);
    initHeroBehavior();
    renderProductsWhenAvailable(2500); // wait up to 2.5s for products.js

    // nav highlight
    const links = $$('.main-nav a');
    const current = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    links.forEach(a => {
      const href = (a.getAttribute('href')||'').split('/').pop().toLowerCase();
      if (href === current || (href === 'index.html' && current === '')) { a.classList.add('active'); a.setAttribute('aria-current','page'); } else { a.classList.remove('active'); a.removeAttribute('aria-current'); }
    });

    // add-to-cart delegator
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
    }, { passive: true });
  }

  document.addEventListener('DOMContentLoaded', bootstrap);

  window.__vast = { setupMiniCart, updateMiniCartUI, renderProductsWhenAvailable };
})();