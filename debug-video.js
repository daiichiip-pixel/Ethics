// Paste this into DevTools Console on the page to diagnose the video
(function () {
  const v = document.getElementById('heroVideo') || document.querySelector('video');
  if (!v) { console.warn('No <video> found on this page'); return; }
  console.group('video-diagnostic');
  console.log('video element:', v);
  console.log('currentSrc:', v.currentSrc || v.src);
  console.log('paused:', v.paused, 'readyState:', v.readyState);
  Array.from(v.querySelectorAll('source')).forEach((s, i) => {
    console.log('source['+i+'] attr-src:', s.getAttribute('src'), 'resolved:', s.src, 'type:', s.type);
  });
  v.addEventListener('error', (ev) => {
    console.error('Media error event:', ev, 'video.error:', v.error);
    if (v.error) {
      switch (v.error.code) {
        case 1: console.error('MEDIA_ERR_ABORTED'); break;
        case 2: console.error('MEDIA_ERR_NETWORK (check server/CORS)'); break;
        case 3: console.error('MEDIA_ERR_DECODE (codec or corrupted)'); break;
        case 4: console.error('MEDIA_ERR_SRC_NOT_SUPPORTED (mime/unsupported)'); break;
      }
    }
  });
  v.addEventListener('loadedmetadata', () => console.log('loadedmetadata: duration', v.duration, 'size', v.videoWidth, 'x', v.videoHeight));
  v.addEventListener('canplay', () => console.log('canplay event; readyState', v.readyState));
  // Try to play so we can capture promise rejection reasons
  v.play().then(() => console.log('play() succeeded')).catch(err => console.warn('play() rejected:', err));
  console.groupEnd();
})();