const CONFIG = {
  names: "Ahmed & Hadder",
  dateISO: "2026-12-30T19:00:00+02:00",
  venue: "Le Ciel Hotel - Lailaty Hall",
  mapUrl: "https://www.google.com/maps/search/?api=1&query=Le+Ciel+Hotel+Lailaty+Hall",
  autoScroll: true,
  autoScrollStartDelay: 4200,
  autoScrollPixelsPerSecond: 148,
  autoScrollResumeDelay: 950,
  autoScrollLoopDuration: 900
};

const SUPABASE_CONFIG = {
  url: "https://clkgajwnhppwnkzemxgi.supabase.co",
  key: "sb_publishable_5Mcd8Aj5t376Uu1A9E0whQ_c_dTrbR7",
  table: "wedding_wishes",
  eventSlug: "ahmed-hadder",
  pollMs: 3000,
  maxRows: 100
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
const petalRain = document.getElementById('petalRain');
const celebrationFx = document.getElementById('celebrationFx');
const twinkleStars = document.getElementById('twinkleStars');
const fallingStars = document.getElementById('fallingStars');
const fallingHearts = document.getElementById('fallingHearts');
const sparkLeft = document.getElementById('sparkLeft');
const sparkRight = document.getElementById('sparkRight');

let opened = false;
let autoScrollEnabled = CONFIG.autoScroll;
let autoScrollActive = false;
let autoScrollLooping = false;
let autoScrollRAF = null;
let autoScrollLastTs = 0;
let autoScrollPosition = 0;
let autoScrollMax = 0;
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

function setAutoScrollingClass(active){
  document.documentElement.classList.toggle('cinematic-auto-scroll', !!active);
  document.body.classList.toggle('cinematic-auto-scroll', !!active);
}

function getScrollElement(){
  return document.scrollingElement || document.documentElement;
}

function syncAutoScrollMetrics(){
  const scroller = getScrollElement();
  autoScrollPosition = scroller.scrollTop;
  autoScrollMax = Math.max(0, scroller.scrollHeight - window.innerHeight);
}

function startAutoScroll(){
  if(
    !opened ||
    !autoScrollEnabled ||
    autoScrollLooping ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) return;

  clearTimeout(autoScrollResumeTimer);
  cancelAutoRAF();

  const scroller = getScrollElement();
  syncAutoScrollMetrics();

  autoScrollActive = true;
  setAutoScrollingClass(true);
  autoScrollLastTs = performance.now();

  const tick = (ts) => {
    if(!autoScrollActive || !autoScrollEnabled){
      setAutoScrollingClass(false);
      return;
    }

    // Clamp long frames so a busy frame never creates a visible jump.
    const dt = Math.min(32, Math.max(0, ts - autoScrollLastTs));
    autoScrollLastTs = ts;

    // Keep our own floating-point position. This avoids the old 2px/3px
    // alternating integer steps that looked like a small shake.
    autoScrollPosition += (CONFIG.autoScrollPixelsPerSecond * dt) / 1000;

    // Re-measure occasionally because comments/content may change page height.
    if(ts % 700 < 35){
      autoScrollMax = Math.max(0, scroller.scrollHeight - window.innerHeight);
    }

    if(autoScrollMax > 0 && autoScrollPosition >= autoScrollMax - 1){
      scroller.scrollTop = autoScrollMax;
      restartFromTop();
      return;
    }

    scroller.scrollTop = autoScrollPosition;
    autoScrollRAF = requestAnimationFrame(tick);
  };

  autoScrollRAF = requestAnimationFrame(tick);
}

function pauseAutoScrollForUser(delay = CONFIG.autoScrollResumeDelay){
  if(!autoScrollEnabled || autoScrollLooping) return;
  autoScrollActive = false;
  setAutoScrollingClass(false);
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
  setAutoScrollingClass(true);

  const scroller = getScrollElement();
  const startY = scroller.scrollTop;
  const duration = Math.max(1050, CONFIG.autoScrollLoopDuration);
  const startedAt = performance.now();

  const rewind = (ts) => {
    if(!autoScrollEnabled){
      autoScrollLooping = false;
      setAutoScrollingClass(false);
      return;
    }

    const p = Math.min(1, (ts - startedAt) / duration);
    const eased = easeInOutCubic(p);

    // Direct scrollTop avoids fighting html{scroll-behavior:smooth}.
    scroller.scrollTop = startY * (1 - eased);

    if(p < 1){
      autoScrollRAF = requestAnimationFrame(rewind);
    }else{
      autoScrollRAF = null;
      autoScrollLooping = false;
      scroller.scrollTop = 0;
      autoScrollPosition = 0;

      setTimeout(() => {
        if(autoScrollEnabled) startAutoScroll();
      }, 650);
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
  startPetalRain();
  startCelebrationFx();

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
  setAutoScrollingClass(false);
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
  setAutoScrollingClass(false);
  cancelAutoRAF();
});

wishForm.addEventListener('focusout', () => {
  if(!autoScrollEnabled) return;
  clearTimeout(autoScrollResumeTimer);
  autoScrollResumeTimer = setTimeout(() => {
    if(!wishForm.contains(document.activeElement)) startAutoScroll();
  }, 2300);
});

// Decorative stars + side sparklers.
// Built with transform-only animation so the cinematic scroll stays smooth.
function createTwinkleStars(){
  if(!twinkleStars || twinkleStars.childElementCount) return;

  const count = window.matchMedia('(max-width: 760px)').matches ? 8 : 13;

  for(let i = 0; i < count; i += 1){
    const star = document.createElement('i');
    const x = 7 + Math.random() * 86;
    const y = 5 + Math.random() * 45;
    const size = 8 + Math.random() * 11;
    const delay = Math.random() * 4.2;
    const duration = 2.3 + Math.random() * 2.4;
    const drift = -7 + Math.random() * 14;

    star.className = 'twinkle-star';
    star.style.setProperty('--x', `${x}vw`);
    star.style.setProperty('--y', `${y}vh`);
    star.style.setProperty('--size', `${size}px`);
    star.style.setProperty('--delay', `${delay}s`);
    star.style.setProperty('--duration', `${duration}s`);
    star.style.setProperty('--drift', `${drift}px`);
    twinkleStars.appendChild(star);
  }
}

function createFallingStars(){
  if(!fallingStars || fallingStars.childElementCount) return;

  const count = window.matchMedia('(max-width: 760px)').matches ? 5 : 8;

  for(let i = 0; i < count; i += 1){
    const star = document.createElement('i');
    const x = 8 + Math.random() * 84;
    const drift = -34 + Math.random() * 68;
    const duration = 10 + Math.random() * 5;
    const delay = -(Math.random() * duration);
    const size = 9 + Math.random() * 9;
    const spin = -20 + Math.random() * 40;

    star.className = i % 3 === 0 ? 'falling-star warm' : 'falling-star gold';
    star.style.setProperty('--x', `${x}vw`);
    star.style.setProperty('--drift', `${drift}px`);
    star.style.setProperty('--drift-35', `${drift * .35}px`);
    star.style.setProperty('--drift-neg-20', `${drift * -.20}px`);
    star.style.setProperty('--duration', `${duration}s`);
    star.style.setProperty('--delay', `${delay}s`);
    star.style.setProperty('--star-size', `${size}px`);
    star.style.setProperty('--spin', `${spin}deg`);
    fallingStars.appendChild(star);
  }
}

function createFallingHearts(){
  if(!fallingHearts || fallingHearts.childElementCount) return;

  const count = window.matchMedia('(max-width: 760px)').matches ? 6 : 5;

  for(let i = 0; i < count; i += 1){
    const heart = document.createElement('i');
    const x = 8 + Math.random() * 84;
    const drift = -38 + Math.random() * 76;
    const duration = 9.5 + Math.random() * 5.5;
    const delay = -(Math.random() * duration);
    const size = 10 + Math.random() * 9;
    const spin = -24 + Math.random() * 48;

    heart.className = i % 4 === 0 ? 'falling-heart gold' : 'falling-heart wine';
    heart.style.setProperty('--x', `${x}vw`);
    heart.style.setProperty('--drift', `${drift}px`);
    heart.style.setProperty('--drift-35', `${drift * .35}px`);
    heart.style.setProperty('--drift-neg-20', `${drift * -.20}px`);
    heart.style.setProperty('--duration', `${duration}s`);
    heart.style.setProperty('--delay', `${delay}s`);
    heart.style.setProperty('--heart-size', `${size}px`);
    heart.style.setProperty('--spin', `${spin}deg`);
    fallingHearts.appendChild(heart);
  }
}

function seedSparkEmitter(emitter, side = 'left'){
  if(!emitter || emitter.childElementCount) return;

  const isMobile = window.matchMedia('(max-width: 760px)').matches;
  // A richer spark density, but still light enough for phones.
  const count = isMobile ? 42 : 38;
  const sparkTypes = ['spark--dot','spark--streak','spark--dot','spark--star','spark--streak','spark--dot'];

  for(let i = 0; i < count; i += 1){
    const spark = document.createElement('i');
    const duration = (isMobile ? 1.05 : .96) + Math.random() * (isMobile ? 1.05 : 1.12);
    // Negative delay means the fountain is already alive the instant the invitation opens.
    const delay = -(Math.random() * duration);
    // Stronger vertical lift, so the shower clearly rises from under the viewport like sparklers.
    const rise = (isMobile ? 175 : 225) + Math.random() * (isMobile ? 150 : 185);
    // Narrower spread than before, so the motion reads more upward and less diagonal.
    const spread = (isMobile ? 10 : 12) + Math.random() * (isMobile ? 68 : 95);
    const size = 2.2 + Math.random() * (isMobile ? 4.6 : 5.8);
    const rotate = -19 + Math.random() * 38;
    const originOffset = Math.random() * (isMobile ? 25 : 46);
    const trail = 8 + Math.random() * 20;
    const type = sparkTypes[i % sparkTypes.length];

    spark.className = `spark ${side} ${type}`;
    spark.style.setProperty('--delay', `${delay}s`);
    spark.style.setProperty('--duration', `${duration}s`);
    spark.style.setProperty('--rise-neg-62', `${rise * -.62}px`);
    spark.style.setProperty('--rise-neg-100', `${rise * -1}px`);
    spark.style.setProperty('--rise-neg-112', `${rise * -1.12}px`);
    spark.style.setProperty('--spread-55', `${spread * .55}px`);
    spark.style.setProperty('--spread-100', `${spread}px`);
    spark.style.setProperty('--spread-110', `${spread * 1.10}px`);
    spark.style.setProperty('--spread-neg-55', `${spread * -.55}px`);
    spark.style.setProperty('--spread-neg-100', `${spread * -1}px`);
    spark.style.setProperty('--spread-neg-110', `${spread * -1.10}px`);
    spark.style.setProperty('--size', `${size}px`);
    spark.style.setProperty('--rotate', `${rotate}deg`);
    spark.style.setProperty('--origin-offset', `${originOffset}px`);
    spark.style.setProperty('--trail', `${trail}px`);
    spark.style.setProperty('--trail-short', `${trail * .55}px`);
    spark.style.setProperty('--streak-w', `${Math.max(2, size * .42)}px`);
    spark.style.setProperty('--streak-h', `${size * 2.05}px`);
    spark.style.setProperty('--star-size', `${size * 1.35}px`);
    emitter.appendChild(spark);
  }
}

function createCelebrationFx(){
  createTwinkleStars();
  createFallingStars();
  createFallingHearts();
  seedSparkEmitter(sparkLeft, 'left');
  seedSparkEmitter(sparkRight, 'right');
}

function startCelebrationFx(){
  createCelebrationFx();
  celebrationFx?.classList.add('active');
}

// Premium falling petals — lightweight transform-only animation.
// Created once after opening, so the landing screen stays fast.
function createPetalRain(){
  if(!petalRain || petalRain.childElementCount) return;

  const count = window.matchMedia('(max-width: 760px)').matches ? 5 : 8;
  const palettes = ['wine','blush','ivory'];

  for(let i = 0; i < count; i += 1){
    const petal = document.createElement('i');
    const x = 3 + Math.random() * 94;
    const drift = -70 + Math.random() * 140;
    const duration = 8.5 + Math.random() * 7;
    const delay = -(Math.random() * duration);
    const size = 0.65 + Math.random() * 0.95;
    const spin = 180 + Math.random() * 540;

    petal.className = `falling-petal ${palettes[i % palettes.length]}`;
    petal.style.setProperty('--x', `${x}vw`);
    petal.style.setProperty('--drift', `${drift}px`);
    petal.style.setProperty('--drift-30', `${drift * 0.30}px`);
    petal.style.setProperty('--drift-neg-18', `${drift * -0.18}px`);
    petal.style.setProperty('--drift-72', `${drift * 0.72}px`);
    petal.style.setProperty('--duration', `${duration}s`);
    petal.style.setProperty('--delay', `${delay}s`);
    petal.style.setProperty('--scale', size.toFixed(2));
    petal.style.setProperty('--spin', `${spin}deg`);
    petalRain.appendChild(petal);
  }
}

function startPetalRain(){
  createPetalRain();
  petalRain?.classList.add('active');
}

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
    'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//AhmedHadderWedding//EN','BEGIN:VEVENT',
    `UID:${Date.now()}@ahmed-Hadder-wedding`,`DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,`DTEND:${fmt(end)}`,`SUMMARY:Wedding of ${CONFIG.names}`,
    `LOCATION:${CONFIG.venue}`,'DESCRIPTION:Can\'t wait to celebrate this day together.','END:VEVENT','END:VCALENDAR'
  ].join('\r\n');
  const blob = new Blob([ics],{type:'text/calendar;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download='Ahmed-Hadder-Wedding.ics';
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


// Supabase guestbook — shared by every guest.
// Uses the publishable key in the browser and relies on RLS in Supabase.
// No localStorage is used for wishes anymore.
const wishSubmitBtn = wishForm?.querySelector('button[type="submit"]');
const renderedWishIds = new Set();
let lastWishId = 0;
let wishesLoaded = false;
let wishesRequestBusy = false;
let wishesPollTimer = null;

function supabaseHeaders(extra = {}){
  return {
    apikey: SUPABASE_CONFIG.key,
    ...extra
  };
}

function buildWishesUrl({ afterId = 0, limit = SUPABASE_CONFIG.maxRows } = {}){
  const base = `${SUPABASE_CONFIG.url}/rest/v1/${SUPABASE_CONFIG.table}`;
  const params = new URLSearchParams();
  params.set('select', 'id,name,message,created_at');
  params.set('event_slug', `eq.${SUPABASE_CONFIG.eventSlug}`);
  if(afterId > 0) params.set('id', `gt.${afterId}`);
  params.set('order', 'id.asc');
  params.set('limit', String(limit));
  return `${base}?${params.toString()}`;
}

function clearWishSlides(){
  wishesTrack.replaceChildren();
  renderedWishIds.clear();
  wishIndex = 0;
  lastWishId = 0;
  refreshWishSlides();
  updateWishesSlider();
}

function appendSupabaseWish(wish, { jumpTo = false, deferUpdate = false } = {}){
  if(!wish || wish.id == null) return false;
  const id = String(wish.id);
  if(renderedWishIds.has(id)) return false;

  renderedWishIds.add(id);
  lastWishId = Math.max(lastWishId, Number(wish.id) || 0);

  const card = document.createElement('article');
  card.className = 'wish-card user-wish-card';
  card.dataset.wishId = id;

  const name = document.createElement('strong');
  name.className = 'wish-name';
  name.textContent = String(wish.name || '').trim();

  const message = document.createElement('p');
  message.textContent = String(wish.message || '').trim();

  card.append(name, message);
  wishesTrack.appendChild(card);

  if(!deferUpdate){
    refreshWishSlides();
    if(jumpTo) wishIndex = Math.max(0, wishSlides.length - 1);
    updateWishesSlider();
  }
  return true;
}

async function loadAllWishesFromSupabase(){
  if(wishesRequestBusy) return;
  wishesRequestBusy = true;

  try{
    const response = await fetch(buildWishesUrl(), {
      method: 'GET',
      headers: supabaseHeaders(),
      cache: 'no-store'
    });

    if(!response.ok){
      throw new Error(`Supabase load failed: ${response.status}`);
    }

    const rows = await response.json();
    clearWishSlides();

    if(Array.isArray(rows)){
      rows.forEach(row => appendSupabaseWish(row, { deferUpdate: true }));
    }

    refreshWishSlides();
    updateWishesSlider();
    scheduleWishesSlider();
    wishesLoaded = true;
  }catch(error){
    console.error(error);
    showToast('التعليقات هتظهر أول ما الاتصال يرجع 🤎');
  }finally{
    wishesRequestBusy = false;
  }
}

async function syncNewWishesFromSupabase(){
  if(document.visibilityState === 'hidden' || wishesRequestBusy) return;
  if(!wishesLoaded){
    await loadAllWishesFromSupabase();
    return;
  }

  wishesRequestBusy = true;
  try{
    const response = await fetch(buildWishesUrl({ afterId: lastWishId, limit: 50 }), {
      method: 'GET',
      headers: supabaseHeaders(),
      cache: 'no-store'
    });

    if(!response.ok){
      throw new Error(`Supabase sync failed: ${response.status}`);
    }

    const rows = await response.json();
    let added = 0;

    if(Array.isArray(rows)){
      rows.forEach(row => {
        if(appendSupabaseWish(row, { deferUpdate: true })) added += 1;
      });
    }

    if(added){
      refreshWishSlides();
      updateWishesSlider();
      scheduleWishesSlider();
    }
  }catch(error){
    console.error(error);
  }finally{
    wishesRequestBusy = false;
  }
}

function startWishesSync(){
  clearInterval(wishesPollTimer);
  wishesPollTimer = setInterval(syncNewWishesFromSupabase, SUPABASE_CONFIG.pollMs);
}

async function saveWishToSupabase(name, message){
  const endpoint = `${SUPABASE_CONFIG.url}/rest/v1/${SUPABASE_CONFIG.table}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: supabaseHeaders({
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }),
    body: JSON.stringify({
      event_slug: SUPABASE_CONFIG.eventSlug,
      name,
      message
    })
  });

  if(!response.ok){
    const detail = await response.text().catch(() => '');
    throw new Error(`Supabase insert failed: ${response.status} ${detail}`);
  }

  const rows = await response.json();
  return Array.isArray(rows) ? rows[0] : rows;
}

// Load in the background immediately so the slider is ready before auto-scroll reaches it.
loadAllWishesFromSupabase();
startWishesSync();

document.addEventListener('visibilitychange', () => {
  if(document.visibilityState === 'visible') syncNewWishesFromSupabase();
});

wishForm.addEventListener('submit', async e => {
  e.preventDefault();

  const name = wishName.value.trim();
  const message = wishMessage.value.trim();
  if(!name || !message) return;

  const oldBtnText = wishSubmitBtn?.textContent || '';
  if(wishSubmitBtn){
    wishSubmitBtn.disabled = true;
    wishSubmitBtn.textContent = 'بنضيف كلمتك…';
  }

  registerManualInteraction(4500);

  try{
    const savedWish = await saveWishToSupabase(name, message);

    wishForm.reset();

    if(savedWish){
      appendSupabaseWish(savedWish, { jumpTo: true });
      refreshWishSlides();
      wishIndex = Math.max(0, wishSlides.length - 1);
      updateWishesSlider();
      scheduleWishesSlider();
    }else{
      await syncNewWishesFromSupabase();
    }

    showToast('كلمتك وصلت واتضافت لكل الناس 🤎');
  }catch(error){
    console.error(error);
    showToast('مقدرتش أحفظ الكلمة دلوقتي… جرّب تاني');
  }finally{
    if(wishSubmitBtn){
      wishSubmitBtn.disabled = false;
      wishSubmitBtn.textContent = oldBtnText;
    }
  }
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

window.addEventListener('resize', () => { if(opened) syncAutoScrollMetrics(); }, {passive:true});
