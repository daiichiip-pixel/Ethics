// hero-fit.js
// Small helper that ensures the hero headline does not overflow/clipped
// - Measures header and hero area and reduces font-size (in small steps) until the headline fits.
// - Restores original max font-size on larger viewports.
// Usage: include <script src="hero-fit.js"></script> after your main script.js in the page.

(function () {
  const title = document.getElementById('heroTitle');
  const hero = document.querySelector('.hero');
  const header = document.querySelector('.site-header');

  if (!title || !hero || !header) return;

  // Keep the original CSS computed font-size to restore when possible
  const style = window.getComputedStyle(title);
  const originalFontSize = parseFloat(style.fontSize);
  const minFontSize = Math.max(28, Math.floor(originalFontSize * 0.45)); // don't shrink below this
  const step = 2; // px decrement step

  function titleFits() {
    const heroRect = hero.getBoundingClientRect();
    const headerRect = header.getBoundingClientRect();
    const availableHeight = heroRect.height - headerRect.height - 12; // give small padding
    const titleRect = title.getBoundingClientRect();
    // We check if title top is visible and bottom is within available area from top of hero
    const titleTopRelative = titleRect.top - heroRect.top;
    const titleBottomRelative = titleTopRelative + titleRect.height;
    // Title should be fully visible within availableHeight
    return (titleTopRelative >= 0) && (titleBottomRelative <= availableHeight);
  }

  function fitTitleOnce() {
    // Recompute and reduce font-size until it fits or reaches min
    let computed = parseFloat(window.getComputedStyle(title).fontSize);
    // If it already fits, nothing to do
    if (titleFits()) return;
    // otherwise shrink until it fits
    while (computed > minFontSize && !titleFits()) {
      computed = Math.max(minFontSize, computed - step);
      title.style.fontSize = computed + 'px';
    }
  }

  // On resize/orientation change we try to restore original size then fit again
  function recompute() {
    // start by restoring CSS default (remove inline font-size) so clamp & responsive rules apply
    title.style.fontSize = '';
    // wait a tick for layout (use requestAnimationFrame)
    requestAnimationFrame(() => {
      // if title fits with default rules, done; otherwise shrink until fits
      if (!titleFits()) fitTitleOnce();
    });
  }

  // Run on load and on resize/orientationchange and also when fonts/images load
  window.addEventListener('resize', recompute);
  window.addEventListener('orientationchange', () => setTimeout(recompute, 160));
  window.addEventListener('load', () => setTimeout(recompute, 50));
  // When webfonts load (if Inter), recompute
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => setTimeout(recompute, 30)).catch(()=>{});
  }

  // expose for debugging
  window.__heroFit = { recompute, titleFits };
})();