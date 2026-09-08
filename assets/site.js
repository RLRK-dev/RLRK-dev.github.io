(() => {
  'use strict';
  const menu = document.querySelector('#menu-button');
  const nav = document.querySelector('#site-nav');
  const closeMenu = (returnFocus = false) => {
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', menu.dataset.openLabel);
    nav.classList.remove('is-open');
    if (returnFocus) menu.focus();
  };
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? menu.dataset.closeLabel : menu.dataset.openLabel);
    nav.classList.toggle('is-open', open);
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && nav.classList.contains('is-open')) closeMenu(true); });
  document.addEventListener('click', event => { if (!nav.contains(event.target) && !menu.contains(event.target)) closeMenu(); });
  const narrow = window.matchMedia('(max-width: 800px)');
  narrow.addEventListener('change', event => { if (!event.matches) closeMenu(); });

  const video = document.querySelector('#ur15-concept-film-video');
  const source = video.querySelector('source');
  const toggle = document.querySelector('#film-toggle');
  const label = toggle.querySelector('.play-label');
  const icon = toggle.querySelector('.play-icon');
  const seek = document.querySelector('#film-seek');
  const clock = document.querySelector('#film-clock');
  const status = document.querySelector('#film-status');
  const chapters = [...document.querySelectorAll('.chapter')];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const saveData = Boolean(navigator.connection && navigator.connection.saveData);
  let userPaused = reduceMotion.matches || saveData;
  let visible = false;
  let hasSource = false;
  let pendingTime = null;
  let seeking = false;
  let playRequest = 0;
  const loadSource = () => {
    if (hasSource) return;
    source.src = source.dataset.src;
    video.preload = 'metadata';
    hasSource = true;
    video.load();
  };
  const timeText = seconds => {
    const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
    return String(Math.floor(safe / 60)).padStart(2, '0') + ':' + String(Math.floor(safe % 60)).padStart(2, '0');
  };
  const sync = () => {
    const paused = video.paused;
    label.textContent = paused ? toggle.dataset.play : toggle.dataset.pause;
    icon.textContent = paused ? '▶' : 'Ⅱ';
    toggle.setAttribute('aria-label', label.textContent);
    toggle.setAttribute('aria-pressed', String(!paused));
    const duration = Number.isFinite(video.duration) ? video.duration : 26.267;
    seek.max = String(duration);
    if (!seeking) seek.value = String(video.currentTime || 0);
    seek.setAttribute('aria-valuetext', timeText(video.currentTime) + ' / ' + timeText(duration));
    clock.textContent = timeText(video.currentTime) + ' / ' + timeText(duration);
    let selected = chapters[0];
    chapters.forEach(chapter => { if (video.currentTime >= Number(chapter.dataset.time) - .1) selected = chapter; });
    chapters.forEach(chapter => chapter.setAttribute('aria-pressed', String(chapter === selected)));
  };
  const play = async (explicit = false) => {
    if (!explicit && (userPaused || !visible || document.hidden || reduceMotion.matches || saveData)) return;
    const request = ++playRequest;
    loadSource();
    try {
      await video.play();
      if (request !== playRequest || document.hidden || (!explicit && !visible)) video.pause();
      else status.textContent = '';
    } catch (_) {
      if (request === playRequest) status.textContent = toggle.dataset.playHint;
    }
    sync();
  };
  const pause = () => { playRequest++; video.pause(); sync(); };
  toggle.addEventListener('click', () => {
    if (video.paused) { userPaused = false; play(true); }
    else { userPaused = true; pause(); }
  });
  const setTime = value => {
    pendingTime = value;
    loadSource();
    if (video.readyState >= 1) {
      video.currentTime = Math.min(value, Math.max(0, video.duration - .05));
      pendingTime = null;
    }
  };
  chapters.forEach(chapter => chapter.addEventListener('click', () => {
    setTime(Number(chapter.dataset.time));
    userPaused = false;
    play(true);
  }));
  seek.addEventListener('input', () => {
    seeking = true;
    clock.textContent = timeText(Number(seek.value)) + ' / ' + timeText(video.duration);
    seek.setAttribute('aria-valuetext', timeText(Number(seek.value)));
  });
  seek.addEventListener('change', () => { setTime(Number(seek.value)); seeking = false; sync(); });
  video.addEventListener('loadedmetadata', () => {
    if (pendingTime !== null) { video.currentTime = Math.min(pendingTime, video.duration - .05); pendingTime = null; }
    sync();
  });
  ['play', 'pause', 'timeupdate', 'durationchange', 'seeked'].forEach(event => video.addEventListener(event, sync));
  const fail = () => { status.textContent = toggle.dataset.error; sync(); };
  video.addEventListener('error', fail);
  source.addEventListener('error', fail);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) play(); else pause();
    }, { threshold: .12 });
    observer.observe(video);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause(); else if (visible && !userPaused) play();
  });
  reduceMotion.addEventListener('change', event => { if (event.matches) { userPaused = true; pause(); } });
  video.controls = false;
  document.querySelectorAll('[data-player-controls]').forEach(element => element.hidden = false);
  sync();
})();
