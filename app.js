const CONFIG = {
  names: "Ahmed & Hader",
  dateISO: "2026-12-30T19:00:00+02:00",
  venue: "Le Ciel Hotel - Lailaty Hall",
  mapUrl: "https://www.google.com/maps/search/?api=1&query=Le+Ciel+Hotel+Lailaty+Hall",
  autoScroll: true,
  autoScrollStartDelay: 4200,
  autoScrollPixelsPerSecond: 158,
  autoScrollResumeDelay: 780,
  autoScrollLoopDuration: 900
};

const intro = document.getElementById('intro');
const openInvite = document.getElementById('openInvite');
const site = document.getElementById('site');
const player = document.getElementById('player');
const weddingAudio = document.getElementById('weddingAudio');
const audioToggle = document.getElementById('audioToggle');
const scrollProgress = document.getElementById('scrollProgress');
const toast = document.getElementById('toast');
const mapBtn = document.getElementById('mapBtn');
const calendarBtn = document.getElementById('calendarBtn');
const wishForm = document.getElementById('wishForm');
const wishName = document.getElementById('wishName');
const wishMessage = document.getElementById('wishMessage');

let opened = false;
let autoScrollEnabled = CONFIG.autoScroll;
let autoScrollActive = false;
let autoScrollLooping = false;
let autoScrollRAF = null;
let autoScrollLastTs = 0;
let autoScrollCarry = 0;
let autoScrollResumeTimer = null;
let userCanInterrupt = false;
let toastTimer = null;

function showToast(message){
  if(!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

// Local wedding audio — user supplied file, so it can start directly from the opening click.
function syncAudioUI(){
  if(!weddingAudio || !player) return;
  player.classList.toggle('playing', !weddingAudio.paused);
  player.classList.toggle('needs-tap', weddingAudio.paused && opened);
}

function startWeddingAudio(){
  if(!weddingAudio) return;
  weddingAudio.volume = 0.9;
  const playPromise = weddingAudio.play();
  if(playPromise && typeof playPromise.catch === 'function'){
    playPromise.catch(() => {
      player?.classList.add('needs-tap');
      syncAudioUI();
    });
  }
  syncAudioUI();
}

audioToggle?.addEventListener('click', () => {
  if(weddingAudio.paused) weddingAudio.play().then(()=>player?.classList.remove('needs-tap')).catch(()=>{});
  else weddingAudio.pause();
  setTimeout(syncAudioUI, 0);
});


weddingAudio?.addEventListener('canplay', () => player.classList.remove('needs-tap'));
weddingAudio?.addEventListener('play', () => { player.classList.remove('needs-tap'); syncAudioUI(); });
weddingAudio?.addEventListener('pause', syncAudioUI);


function cancelAutoRAF(){
  if(autoScrollRAF) cancelAnimationFrame(autoScrollRAF);
  autoScrollRAF = null;
}

function startAutoScroll(){
  if(!opened || !autoScrollEnabled || autoScrollLooping || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  clearTimeout(autoScrollResumeTimer);
  cancelAutoRAF();
  autoScrollActive = true;
  autoScrollLastTs = performance.now();
  autoScrollCarry = 0;

  const tick = (ts) => {
    if(!autoScrollActive || !autoScrollEnabled) return;

    const max = document.documentElement.scrollHeight - window.innerHeight;
    if(max > 0 && window.scrollY >= max - 4){
      restartFromTop();
      return;
    }

    const dt = Math.min(50, Math.max(0, ts - autoScrollLastTs));
    autoScrollLastTs = ts;
    autoScrollCarry += (CONFIG.autoScrollPixelsPerSecond * dt) / 1000;

    const step = Math.floor(autoScrollCarry);
    if(step >= 1){
      window.scrollBy(0, step);
      autoScrollCarry -= step;
    }

    autoScrollRAF = requestAnimationFrame(tick);
  };

  autoScrollRAF = requestAnimationFrame(tick);
}

function pauseAutoScrollForUser(delay = CONFIG.autoScrollResumeDelay){
  if(!autoScrollEnabled || autoScrollLooping) return;
  autoScrollActive = false;
  cancelAutoRAF();
  clearTimeout(autoScrollResumeTimer);

  autoScrollResumeTimer = setTimeout(() => {
    if(autoScrollEnabled && opened && !document.querySelector('.wish-form :focus')) startAutoScroll();
  }, delay);
}

function easeInOutCubic(t){
  return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3)/2;
}

function restartFromTop(){
  if(autoScrollLooping || !autoScrollEnabled) return;
  autoScrollLooping = true;
  autoScrollActive = false;
  cancelAutoRAF();

  const startY = window.scrollY;
  const duration = CONFIG.autoScrollLoopDuration;
  const startedAt = performance.now();

  const rewind = (ts) => {
    if(!autoScrollEnabled){
      autoScrollLooping = false;
      return;
    }
    const p = Math.min(1, (ts - startedAt) / duration);
    const eased = easeInOutCubic(p);
    window.scrollTo(0, Math.round(startY * (1 - eased)));
    if(p < 1){
      autoScrollRAF = requestAnimationFrame(rewind);
    }else{
      autoScrollRAF = null;
      autoScrollLooping = false;
      window.scrollTo(0, 0);
      setTimeout(() => {
        if(autoScrollEnabled) startAutoScroll();
      }, 350);
    }
  };

  autoScrollRAF = requestAnimationFrame(rewind);
}

openInvite.addEventListener('click', () => {
  if(opened) return;
  opened = true;

  intro.classList.add('opening');
  // Start the local song inside the user gesture so browsers allow sound.
  startWeddingAudio();

  setTimeout(() => {
    document.body.classList.remove('locked');
    site.setAttribute('aria-hidden','false');
    site.classList.add('ready');
    player.classList.add('show');
    intro.classList.add('hide');
    window.scrollTo(0, 0);

    // Give the cover a proper moment on screen before the cinematic scroll begins.
    // Music is already playing from the opening click during this hold.
    setTimeout(() => {
      if(CONFIG.autoScroll) startAutoScroll();
      setTimeout(() => { userCanInterrupt = true; }, 420);
    }, CONFIG.autoScrollStartDelay);
  }, 520);
});
// Any manual navigation only pauses the cinematic scroll temporarily.
// As soon as the guest stops interacting, the invitation carries on by itself.
let interactionResumeTimer = null;
function registerManualInteraction(delay = CONFIG.autoScrollResumeDelay){
  if(!userCanInterrupt || !autoScrollEnabled || autoScrollLooping) return;
  autoScrollActive = false;
  cancelAutoRAF();
  clearTimeout(autoScrollResumeTimer);
  clearTimeout(interactionResumeTimer);
  interactionResumeTimer = setTimeout(() => {
    if(opened && autoScrollEnabled && !wishForm.contains(document.activeElement)) startAutoScroll();
  }, delay);
}

['wheel','touchstart','touchmove'].forEach(evt => {
  window.addEventListener(evt, e => {
    if(e.target.closest && e.target.closest('#player')) return;
    if(e.target.closest && e.target.closest('.wish-form')){
      registerManualInteraction(2800);
      return;
    }
    registerManualInteraction();
  }, {passive:true});
});

window.addEventListener('keydown', e => {
  if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(e.key)) registerManualInteraction();
});

wishForm.addEventListener('focusin', () => {
  if(!autoScrollEnabled) return;
  clearTimeout(autoScrollResumeTimer);
  clearTimeout(interactionResumeTimer);
  autoScrollActive = false;
  cancelAutoRAF();
});

wishForm.addEventListener('focusout', () => {
  if(!autoScrollEnabled) return;
  clearTimeout(autoScrollResumeTimer);
  autoScrollResumeTimer = setTimeout(() => {
    if(!wishForm.contains(document.activeElement)) startAutoScroll();
  }, 2300);
});

// Reveal animations
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if(entry.isIntersecting) entry.target.classList.add('in-view');
  });
},{threshold:.12});
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// Page progress
window.addEventListener('scroll', () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
  scrollProgress.style.width = `${Math.min(100,pct)}%`;
},{passive:true});

// Countdown
function updateCountdown(){
  const target = new Date(CONFIG.dateISO).getTime();
  let diff = Math.max(0,target-Date.now());
  const d = Math.floor(diff/86400000); diff%=86400000;
  const h = Math.floor(diff/3600000); diff%=3600000;
  const m = Math.floor(diff/60000); diff%=60000;
  const s = Math.floor(diff/1000);
  document.getElementById('days').textContent = String(d).padStart(2,'0');
  document.getElementById('hours').textContent = String(h).padStart(2,'0');
  document.getElementById('minutes').textContent = String(m).padStart(2,'0');
  document.getElementById('seconds').textContent = String(s).padStart(2,'0');
}
updateCountdown();
setInterval(updateCountdown,1000);

// Map
mapBtn.href = CONFIG.mapUrl;

calendarBtn.addEventListener('click', () => {
  const start = new Date(CONFIG.dateISO);
  const end = new Date(start.getTime()+4*60*60*1000);
  const fmt = d => d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
  const ics = [
    'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//AhmedHaderWedding//EN','BEGIN:VEVENT',
    `UID:${Date.now()}@ahmed-Hader-wedding`,`DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,`DTEND:${fmt(end)}`,`SUMMARY:Wedding of ${CONFIG.names}`,
    `LOCATION:${CONFIG.venue}`,'DESCRIPTION:Can\'t wait to celebrate this day together.','END:VEVENT','END:VCALENDAR'
  ].join('\r\n');
  const blob = new Blob([ics],{type:'text/calendar;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download='Ahmed-Hader-Wedding.ics';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
});

// Wishes slider — real slider, no marquee.
const wishesTrack = document.getElementById('wishesTrack');
const wishesSlider = document.getElementById('wishesSlider');
let wishSlides = Array.from(wishesTrack.querySelectorAll('.wish-card'));
const wishPrev = document.getElementById('wishPrev');
const wishNext = document.getElementById('wishNext');
const wishCurrent = document.getElementById('wishCurrent');
const wishTotal = document.getElementById('wishTotal');
let wishIndex = 0;
let wishSliderTimer = null;

function refreshWishSlides(){
  wishSlides = Array.from(wishesTrack.querySelectorAll('.wish-card'));
  const hasWishes = wishSlides.length > 0;
  wishesSlider.classList.toggle('empty', !hasWishes);
  wishPrev.disabled = !hasWishes || wishSlides.length < 2;
  wishNext.disabled = !hasWishes || wishSlides.length < 2;
  if(!hasWishes){
    wishIndex = 0;
    wishCurrent.textContent = '00';
    wishTotal.textContent = '00';
    wishesTrack.style.transform = 'translate3d(0,0,0)';
    return;
  }
  wishIndex = Math.min(wishIndex, wishSlides.length - 1);
}

function appendWishSlide(wish, { jumpTo = false } = {}){
  const card = document.createElement('article');
  card.className = 'wish-card user-wish-card';

  const name = document.createElement('strong');
  name.className = 'wish-name';
  name.textContent = wish.name;

  const message = document.createElement('p');
  message.textContent = wish.message;

  card.append(name, message);
  wishesTrack.appendChild(card);
  refreshWishSlides();

  if(jumpTo) wishIndex = wishSlides.length - 1;
  updateWishesSlider();
}

function updateWishesSlider(){
  refreshWishSlides();
  if(!wishSlides.length) return;
  wishesTrack.style.transform = `translate3d(-${wishIndex * 100}%,0,0)`;
  wishCurrent.textContent = String(wishIndex + 1).padStart(2,'0');
  wishTotal.textContent = String(wishSlides.length).padStart(2,'0');
}

function scheduleWishesSlider(){
  clearInterval(wishSliderTimer);
  if(wishSlides.length < 2) return;
  wishSliderTimer = setInterval(() => {
    wishIndex = (wishIndex + 1) % wishSlides.length;
    updateWishesSlider();
  }, 5200);
}

wishPrev.addEventListener('click', () => {
  if(!wishSlides.length) return;
  wishIndex = (wishIndex - 1 + wishSlides.length) % wishSlides.length;
  updateWishesSlider();
  scheduleWishesSlider();
});

wishNext.addEventListener('click', () => {
  if(!wishSlides.length) return;
  wishIndex = (wishIndex + 1) % wishSlides.length;
  updateWishesSlider();
  scheduleWishesSlider();
});

let sliderTouchStartX = null;
wishesTrack.addEventListener('touchstart', e => {
  sliderTouchStartX = e.touches[0]?.clientX ?? null;
}, {passive:true});
wishesTrack.addEventListener('touchend', e => {
  if(sliderTouchStartX === null) return;
  const endX = e.changedTouches[0]?.clientX ?? sliderTouchStartX;
  const delta = endX - sliderTouchStartX;
  sliderTouchStartX = null;
  if(Math.abs(delta) < 45 || !wishSlides.length) return;
  if(delta < 0) wishIndex = (wishIndex + 1) % wishSlides.length;
  else wishIndex = (wishIndex - 1 + wishSlides.length) % wishSlides.length;
  updateWishesSlider();
  scheduleWishesSlider();
}, {passive:true});


// Guestbook stays local for now. Every submitted word becomes a real slide
// in the SAME slider above, so the page never grows into a long stack of cards.
const STORAGE_KEY = 'ahmed-Hader-wishes-v13';
try{
  localStorage.removeItem('ahmed-Hader-wishes-v3');
  localStorage.removeItem('ahmed-Hader-wishes-v4');
  localStorage.removeItem('ahmed-Hader-wishes-v5');
  localStorage.removeItem('ahmed-Hader-wishes-v6');
  localStorage.removeItem('ahmed-Hader-wishes-v7');
  localStorage.removeItem('ahmed-Hader-wishes-v8');
  localStorage.removeItem('ahmed-Hader-wishes-v9');
  localStorage.removeItem('ahmed-Hader-wishes-v10');
  localStorage.removeItem('ahmed-Hader-wishes-v11');
  localStorage.removeItem('ahmed-Hader-wishes-v12');
}catch(_){ }

function getWishes(){
  try{
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(data) ? data : [];
  }catch(_){
    return [];
  }
}

// Restore saved local messages directly into the slider.
getWishes().forEach(wish => appendWishSlide(wish));
refreshWishSlides();
updateWishesSlider();
scheduleWishesSlider();

wishForm.addEventListener('submit', e => {
  e.preventDefault();
  const name = wishName.value.trim();
  const message = wishMessage.value.trim();
  if(!name || !message) return;

  const wishes = getWishes();
  const wish = { name, message, createdAt: Date.now() };
  wishes.push(wish);
  // Local-only for now; keep enough entries without letting storage grow forever.
  localStorage.setItem(STORAGE_KEY, JSON.stringify(wishes.slice(-60)));

  wishForm.reset();
  appendWishSlide(wish, { jumpTo: true });
  scheduleWishesSlider();
  showToast('كلمتك اتضافت للسلايدر 🤎');

  // Let the guest see their own message before cinematic auto-scroll resumes.
  registerManualInteraction(3600);
});

// Route-safe image fallback: if the deployed WebP is stale/missing, fall back to JPEG.
document.querySelectorAll('.cover-frame img').forEach(img => {
  img.addEventListener('error', () => {
    if(!img.dataset.fallbackTried){
      img.dataset.fallbackTried = '1';
      const source = img.parentElement?.querySelector('source');
      if(source) source.remove();
      img.src = '/assets/invitation-cover.jpeg?v=17';
    }
  });
});
