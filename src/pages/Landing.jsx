
import React, { useEffect } from 'react';
import './Landing.css';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/config.js';
import { doc, getDoc } from 'firebase/firestore';

export default function Landing() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // 1. Load interactions script
    const script = document.createElement('script');
    script.src = '/landing-interactions.js';
    script.async = true;
    document.body.appendChild(script);

    // 2. Overlay menu logic
    const menuToggle = document.getElementById('menuToggle');
    const fullMenu = document.getElementById('fullMenu');
    const fullMenuClose = document.getElementById('fullMenuClose');

    function openFullMenu() {
      if (!fullMenu) return;
      fullMenu.classList.add('is-open');
      fullMenu.setAttribute('aria-hidden', 'false');
      if (menuToggle) menuToggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('fullmenu-open');
      if (fullMenuClose) fullMenuClose.focus();
    }

    function closeFullMenu() {
      if (!fullMenu) return;
      fullMenu.classList.remove('is-open');
      fullMenu.setAttribute('aria-hidden', 'true');
      if (menuToggle) {
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.focus();
      }
      document.body.classList.remove('fullmenu-open');
    }

    if (menuToggle) menuToggle.addEventListener('click', openFullMenu);
    if (fullMenuClose) fullMenuClose.addEventListener('click', closeFullMenu);

    const handleKeydown = (e) => {
      if (e.key === 'Escape' && fullMenu && fullMenu.classList.contains('is-open')) {
        closeFullMenu();
      }
    };
    document.addEventListener('keydown', handleKeydown);

    if (fullMenu) {
      fullMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeFullMenu);
      });
    }

    // 3. Firebase stats logic
    function animateCount(el, target, decimals = 0) {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const suffix = el.dataset.suffix || '';
      const format = (val) => {
        const s = decimals ? val.toFixed(decimals) : String(Math.round(val));
        return s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      };
      if (reduced) { el.textContent = format(target) + suffix; return; }
      const dur = 1800;
      let start = null;
      const tick = (now) => {
        if (!start) start = now;
        const p = Math.min((now - start) / dur, 1);
        el.textContent = format(target * (1 - Math.pow(1 - p, 4))) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }

    function updateStat(id, value, decimals = 0) {
      document.querySelectorAll(`[data-firebase="${id}"]`).forEach(el => {
        el.dataset.count = value;
        animateCount(el, value, decimals);
      });
    }

    async function loadStats() {
      try {
        const snap = await getDoc(doc(db, 'stats', 'global'));
        if (!snap.exists()) return;
        const s = snap.data();

        updateStat('books', s.totalBooks ?? 0);
        updateStat('users', s.totalUsers ?? 0);
        updateStat('minutes', s.totalMinutes ?? 0);
        updateStat('borrowings', s.totalBorrowings ?? 0);

        const updatedAt = s.updatedAt?.toDate?.() ?? new Date();
        const formatted = updatedAt.toLocaleString('kk-KZ', {
          year: 'numeric', month: 'long', day: 'numeric',
          hour: '2-digit', minute: '2-digit'
        });
        document.querySelectorAll('[data-firebase-updated]').forEach(el => {
          el.textContent = formatted;
        });
      } catch (err) {
        console.warn('Firebase stats жүктелмеді:', err);
      }
    }

    loadStats();

    return () => {
      document.body.removeChild(script);
      document.removeEventListener('keydown', handleKeydown);
      if (menuToggle) menuToggle.removeEventListener('click', openFullMenu);
      if (fullMenuClose) fullMenuClose.removeEventListener('click', closeFullMenu);
    };
  }, []);

  return (
    <div className="landing-page-container">
      
<div className="grain" aria-hidden="true"></div>

<a className="skip" href="#hero">Негізгі мазмұнға өту</a>

{/* ══════════════════ NAV (PLATONUS-STYLE 3-PART HEADER) ══════════════════ */}
<header className="nav" id="nav">
  <div className="wrap nav__in">
    {/* Left: Brand Logo */}
    <div className="nav__left">
      <a className="brand" href="#hero" aria-label="OquNet басты бет">
        <span className="brand__mark" aria-hidden="true">
          <img src="icon.svg" alt="" width="38" height="38" style={{"display": "block", "borderRadius": "10px"}} />
        </span>
        <span className="brand__word">OquNet</span>
      </a>
    </div>

    {/* Center: Iconic Center Toggle Button */}
    <div className="nav__center">
      <button className="nav__center-btn" id="menuToggle" aria-label="Мәзірді ашу" aria-expanded="false" aria-controls="fullMenu">
        <span className="nav__center-icon" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>
    </div>

    {/* Right: Social Circle Buttons & Language Switcher */}
    <div className="nav__right">
      <div className="nav__socials" aria-label="Әлеуметтік желілер">
        <a href="https://instagram.com/oqunetapp" target="_blank" rel="noopener" aria-label="Instagram" className="social-circle">
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5.4" fill="none" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="4.1" fill="none" stroke="currentColor" strokeWidth="1.8"/><circle cx="17.2" cy="6.8" r="1.2" fill="currentColor"/></svg>
        </a>
        <a href="https://t.me/oqunetapp" target="_blank" rel="noopener" aria-label="Telegram" className="social-circle">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 4.5 2.8 11.4c-.9.3-.9 1.6.1 1.8l4.6 1.2 1.7 5.2c.3.8 1.3 1 1.9.4l2.5-2.5 4.6 3.4c.7.5 1.7.1 1.9-.7L22.6 5.7c.2-.9-.7-1.6-1.6-1.2z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><path d="m7.5 14.4 10.6-7.2-6.9 8.3" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>
        </a>
        <a href="https://wa.me/77719333111" target="_blank" rel="noopener" aria-label="WhatsApp" className="social-circle">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.979-.276-.1-.476-.15-.677.15-.2.301-.777.979-.953 1.18-.175.2-.351.226-.652.075-.301-.15-1.27-.468-2.42-1.493-.894-.799-1.498-1.786-1.674-2.087-.176-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.175.2-.3.301-.501.101-.2.05-.376-.025-.526-.075-.15-.677-1.631-.928-2.234-.244-.587-.492-.507-.677-.517l-.577-.01c-.2 0-.527.075-.802.376-.276.301-1.053 1.029-1.053 2.509 0 1.48 1.079 2.91 1.229 3.111.15.2 2.124 3.243 5.145 4.549.719.311 1.28.497 1.718.636.722.23 1.379.197 1.9.12.58-.088 1.78-.727 2.03-1.43.25-.702.25-1.303.175-1.43-.075-.126-.276-.201-.577-.351z" fill="currentColor"/><path d="M12 2C6.48 2 2 6.48 2 12c0 1.82.49 3.53 1.35 5L2 22l5.16-1.32c1.42.79 3.05 1.32 4.84 1.32 5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18.2c-1.57 0-3.04-.43-4.31-1.19l-.31-.18-3.2.82.85-3.11-.2-.32C4.01 15.11 3.6 13.6 3.6 12c0-4.63 3.77-8.4 8.4-8.4 4.63 0 8.4 3.77 8.4 8.4 0 4.63-3.77 8.4-8.4 8.4z" fill="currentColor"/></svg>
        </a>
        <a href="https://www.tiktok.com/@oqunetapp" target="_blank" rel="noopener" aria-label="TikTok" className="social-circle">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.2 3v10.6a3.1 3.1 0 1 1-2.6-3.06" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M14.2 3c.4 2.4 1.9 3.9 4.4 4.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </a>
      </div>
      <button className="lang-switch" type="button" aria-label="Тіл таңдау">
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
        <span>KZ</span>
      </button>
    </div>
  </div>
</header>

{/* ══════════════════ FULLSCREEN OVERLAY MENU (PLATONUS STYLE) ══════════════════ */}
<div className="fullmenu" id="fullMenu" aria-hidden="true" role="dialog" aria-modal="true" aria-label="Негізгі мәзір">
  {/* Top Bar inside full-screen menu: Exact same 3-part layout with red close button */}
  <div className="fullmenu__head">
    <div className="fullmenu__left">
      <a className="brand" href="#hero" aria-label="OquNet басты бет">
        <span className="brand__mark" aria-hidden="true">
          <img src="icon.svg" alt="" width="38" height="38" style={{"display": "block", "borderRadius": "10px"}} />
        </span>
        <span className="brand__word">OquNet</span>
      </a>
    </div>

    <div className="fullmenu__center">
      <button className="fullmenu__close-btn" id="fullMenuClose" aria-label="Мәзірді жабу">
        <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
          <path d="M6 6l12 12M6 18L18 6" stroke="#E4572E" strokeWidth="2.4" strokeLinecap="round"/>
        </svg>
      </button>
    </div>

    <div className="fullmenu__right">
      <div className="nav__socials" aria-label="Әлеуметтік желілер">
        <a href="https://instagram.com/oqunetapp" target="_blank" rel="noopener" aria-label="Instagram" className="social-circle">
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5.4" fill="none" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="4.1" fill="none" stroke="currentColor" strokeWidth="1.8"/><circle cx="17.2" cy="6.8" r="1.2" fill="currentColor"/></svg>
        </a>
        <a href="https://t.me/oqunetapp" target="_blank" rel="noopener" aria-label="Telegram" className="social-circle">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 4.5 2.8 11.4c-.9.3-.9 1.6.1 1.8l4.6 1.2 1.7 5.2c.3.8 1.3 1 1.9.4l2.5-2.5 4.6 3.4c.7.5 1.7.1 1.9-.7L22.6 5.7c.2-.9-.7-1.6-1.6-1.2z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><path d="m7.5 14.4 10.6-7.2-6.9 8.3" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>
        </a>
        <a href="https://wa.me/77719333111" target="_blank" rel="noopener" aria-label="WhatsApp" className="social-circle">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.979-.276-.1-.476-.15-.677.15-.2.301-.777.979-.953 1.18-.175.2-.351.226-.652.075-.301-.15-1.27-.468-2.42-1.493-.894-.799-1.498-1.786-1.674-2.087-.176-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.175.2-.3.301-.501.101-.2.05-.376-.025-.526-.075-.15-.677-1.631-.928-2.234-.244-.587-.492-.507-.677-.517l-.577-.01c-.2 0-.527.075-.802.376-.276.301-1.053 1.029-1.053 2.509 0 1.48 1.079 2.91 1.229 3.111.15.2 2.124 3.243 5.145 4.549.719.311 1.28.497 1.718.636.722.23 1.379.197 1.9.12.58-.088 1.78-.727 2.03-1.43.25-.702.25-1.303.175-1.43-.075-.126-.276-.201-.577-.351z" fill="currentColor"/><path d="M12 2C6.48 2 2 6.48 2 12c0 1.82.49 3.53 1.35 5L2 22l5.16-1.32c1.42.79 3.05 1.32 4.84 1.32 5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18.2c-1.57 0-3.04-.43-4.31-1.19l-.31-.18-3.2.82.85-3.11-.2-.32C4.01 15.11 3.6 13.6 3.6 12c0-4.63 3.77-8.4 8.4-8.4 4.63 0 8.4 3.77 8.4 8.4 0 4.63-3.77 8.4-8.4 8.4z" fill="currentColor"/></svg>
        </a>
        <a href="https://www.tiktok.com/@oqunetapp" target="_blank" rel="noopener" aria-label="TikTok" className="social-circle">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.2 3v10.6a3.1 3.1 0 1 1-2.6-3.06" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M14.2 3c.4 2.4 1.9 3.9 4.4 4.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </a>
      </div>
      <button className="lang-switch" type="button" aria-label="Тіл таңдау">
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
        <span>KZ</span>
      </button>
    </div>
  </div>

  {/* Body: Clean Centered Links & Contact Information */}
  <div className="fullmenu__body">
    <nav className="fullmenu__nav" aria-label="Мәзір сілтемелері">
      <a href="#hero">«OquNet» туралы</a>
      <a href="#problem">Мәселе</a>
      <a href="#goal">Мақсат</a>
      <a href="#how">Қалай жұмыс істейді</a>
      <a href="#quality">Оқырман сапасы</a>
      <a href="#numbers">Сандар мен нәтижелер</a>
      <a href="#team">Команда</a>
      <a href="#faq">Жиі қойылатын сұрақтар</a>
    </nav>

    <div className="fullmenu__contacts">
      <a className="fullmenu__address" href="https://2gis.kz" target="_blank" rel="noopener">
        Астана қаласы, Есіл ауданы · OquNet қауымдастығы
      </a>
      <div className="fullmenu__phones">
        <a href="tel:+77172472525">+7 (7172) 47–25–25</a>
        <a href="tel:+77719333111">+7 771 933 31 11</a>
      </div>

      <div className="fullmenu__socials-row">
        <a href="https://instagram.com/oqunetapp" target="_blank" rel="noopener" aria-label="Instagram" className="social-circle social-circle--lg">
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5.4" fill="none" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="4.1" fill="none" stroke="currentColor" strokeWidth="1.8"/><circle cx="17.2" cy="6.8" r="1.2" fill="currentColor"/></svg>
        </a>
        <a href="https://t.me/oqunetapp" target="_blank" rel="noopener" aria-label="Telegram" className="social-circle social-circle--lg">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 4.5 2.8 11.4c-.9.3-.9 1.6.1 1.8l4.6 1.2 1.7 5.2c.3.8 1.3 1 1.9.4l2.5-2.5 4.6 3.4c.7.5 1.7.1 1.9-.7L22.6 5.7c.2-.9-.7-1.6-1.6-1.2z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><path d="m7.5 14.4 10.6-7.2-6.9 8.3" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>
        </a>
        <a href="https://wa.me/77719333111" target="_blank" rel="noopener" aria-label="WhatsApp" className="social-circle social-circle--lg">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.979-.276-.1-.476-.15-.677.15-.2.301-.777.979-.953 1.18-.175.2-.351.226-.652.075-.301-.15-1.27-.468-2.42-1.493-.894-.799-1.498-1.786-1.674-2.087-.176-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.175.2-.3.301-.501.101-.2.05-.376-.025-.526-.075-.15-.677-1.631-.928-2.234-.244-.587-.492-.507-.677-.517l-.577-.01c-.2 0-.527.075-.802.376-.276.301-1.053 1.029-1.053 2.509 0 1.48 1.079 2.91 1.229 3.111.15.2 2.124 3.243 5.145 4.549.719.311 1.28.497 1.718.636.722.23 1.379.197 1.9.12.58-.088 1.78-.727 2.03-1.43.25-.702.25-1.303.175-1.43-.075-.126-.276-.201-.577-.351z" fill="currentColor"/><path d="M12 2C6.48 2 2 6.48 2 12c0 1.82.49 3.53 1.35 5L2 22l5.16-1.32c1.42.79 3.05 1.32 4.84 1.32 5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18.2c-1.57 0-3.04-.43-4.31-1.19l-.31-.18-3.2.82.85-3.11-.2-.32C4.01 15.11 3.6 13.6 3.6 12c0-4.63 3.77-8.4 8.4-8.4 4.63 0 8.4 3.77 8.4 8.4 0 4.63-3.77 8.4-8.4 8.4z" fill="currentColor"/></svg>
        </a>
        <a href="https://www.tiktok.com/@oqunetapp" target="_blank" rel="noopener" aria-label="TikTok" className="social-circle social-circle--lg">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.2 3v10.6a3.1 3.1 0 1 1-2.6-3.06" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M14.2 3c.4 2.4 1.9 3.9 4.4 4.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </a>
      </div>

      <div className="fullmenu__buttons">
        <a className="btn-platonus-primary" href="#cta">Қосымшаны ашу</a>
        <a className="btn-platonus-outline" href="/auth/login">Кіру / Сұрақ қою</a>
      </div>
    </div>
  </div>
</div>

{/* ══════════════════ STACKED DOWNLOAD BUTTONS (BOTTOM-RIGHT) ══════════════════ */}
<aside className="download-stack" aria-label="Қосымшаны жүктеу">
  <a className="download-stack__btn" href="https://apps.apple.com/app/oqunetapp" target="_blank" rel="noopener" aria-label="App Store-дан жүктеу">
    <img src="assets/img/AppStore.svg" alt="Download on the App Store" width="140" height="42" loading="lazy" />
  </a>
  <a className="download-stack__btn" href="https://play.google.com/store/apps/details?id=app.oqunetapp" target="_blank" rel="noopener" aria-label="Google Play-ден жүктеу">
    <img src="assets/img/GooglePlay.svg" alt="Get it on Google Play" width="140" height="42" loading="lazy" />
  </a>
</aside>

<main>

{/* ══════════════════ HERO ══════════════════ */}
<section className="hero" id="hero">
  <div className="hero__glow" aria-hidden="true"></div>
  <div className="wrap hero__in">

    <div className="hero__copy">
      <p className="eyebrow" data-reveal>
        <span className="dot"></span> Қазақстандағы кітап алмасу қауымдастығы
      </p>

      <h1 className="display" data-reveal>
        Кітаптарды
        <span className="hl hl--shimmer">тегін оқы!</span>
      </h1>

      <p className="lead" data-reveal>
        OquNet - қағаз кітаптарды алмасып, ортақ пайдалануға көмек беруге арналған қосымша.
      </p>

      <div className="hero__actions" data-reveal>
        <a className="btn btn--primary btn--lg" href="#cta">
          Қауымдастыққа қосылу
          <svg viewBox="0 0 20 20" className="btn__i" aria-hidden="true"><path d="M4 10h11M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </a>
        <a className="btn btn--outline btn--lg" href="#how">
          <svg viewBox="0 0 20 20" className="btn__i" aria-hidden="true"><circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.6" fill="none"/><path d="M8.4 7.2 13 10l-4.6 2.8z" fill="currentColor"/></svg>
          Қалай жұмыс істейді
        </a>
      </div>

      <ul className="hero__proof" data-reveal>
        <li>
          <span className="hero__proof-num" data-count="1240" data-suffix="+" data-firebase="books">0</span>
          <span className="hero__proof-lbl">қосымшадағы кітап</span>
        </li>
        <li>
          <span className="hero__proof-num" data-count="86400" data-suffix="" data-firebase="minutes">0</span>
          <span className="hero__proof-lbl">оқылған минут</span>
        </li>
        <li>
          <span className="hero__proof-num" data-count="2100" data-suffix="+" data-firebase="users">0</span>
          <span className="hero__proof-lbl">оқырман</span>
        </li>
      </ul>
    </div>

    {/* Hero visual: shelf + floating app cards */}
    <div className="hero__art" data-reveal>
      <div className="shelf" aria-hidden="true">
        <div className="shelf__books">
          <span className="bk bk--1"><i>Абай жолы</i></span>
          <span className="bk bk--2"><i>Атомдық әдеттер</i></span>
          <span className="bk bk--3"><i>Көшпенділер</i></span>
          <span className="bk bk--4"><i>Sapiens</i></span>
          <span className="bk bk--5"><i>Ой түбінде</i></span>
          <span className="bk bk--6"><i>Дала уәлаяты</i></span>
        </div>
        <div className="shelf__plank"></div>
        <div className="shelf__books shelf__books--2">
          <span className="bk bk--7"><i>Мұнар күн</i></span>
          <span className="bk bk--8"><i>Ұлы дала</i></span>
          <span className="bk bk--9"><i>Flow</i></span>
          <span className="bk bk--10"><i>Қаламгер</i></span>
        </div>
        <div className="shelf__plank"></div>
      </div>

      <div className="float float--a">
        <div className="float__ava" style={{"--a": "#032081", "--b": "#2A4BAE"}}>АС</div>
        <div>
          <b>Айсұлтан</b>
          <small>«Абай жолы» кітабын алды</small>
        </div>
      </div>

      <div className="float float--b">
        <svg viewBox="0 0 24 24" className="float__ic" aria-hidden="true"><path d="M12 21s-7.5-4.6-7.5-9.6A4.4 4.4 0 0 1 12 8.4a4.4 4.4 0 0 1 7.5 3c0 5-7.5 9.6-7.5 9.6z" fill="#E4572E"/></svg>
        <div><b>+128 оқырман</b><small>Астана · Есіл ауданы</small></div>
      </div>

      <div className="float float--c">
        <div className="ring" style={{"--p": "72"}}>
          <svg viewBox="0 0 40 40" aria-hidden="true">
            <circle cx="20" cy="20" r="16" className="ring__bg"/>
            <circle cx="20" cy="20" r="16" className="ring__fg"/>
          </svg>
          <span>72%</span>
        </div>
        <div><b>Оқу прогресі</b><small>бүгін 42 минут</small></div>
      </div>
    </div>

  </div>
</section>

{/* ══════════════════ MARQUEE ══════════════════ */}
<div className="marquee" aria-hidden="true">
  <div className="marquee__track" id="marqueeTrack">
    <span>Қауымдастыққа қосыл</span><i>✦</i>
    <span>Кітабыңды қос</span><i>✦</i>
    <span>Қалағаныңды ал</span><i>✦</i>
    <span>Оқы</span><i>✦</i>
    <span>Қайтар</span><i>✦</i>
    <span>Кітаптың жолы жалғасады</span><i>✦</i>
  </div>
</div>

<div className="wave-divider" aria-hidden="true">
  <svg viewBox="0 0 1440 56" preserveAspectRatio="none" fill="var(--paper-2)">
    <path d="M0,28 C360,56 1080,0 1440,28 L1440,56 L0,56 Z"/>
  </svg>
</div>

{/* ══════════════════ PROBLEM ══════════════════ */}
<section className="sec sec--problem" id="problem">
  <div className="wrap">
    <div className="sec__head">
      <p className="eyebrow eyebrow--warm" data-reveal><span className="dot"></span> Мәселе</p>
      <h2 className="display display--2" data-reveal>
        Кітап көп. Ал оқылған кітап<br />
        <span className="hl hl--warm">бір адамда қалып қояды.</span>
      </h2>
      <p className="sec__sub" data-reveal>
        Үй сөресіндегі кітаптардың басым бөлігі бір рет оқылып, содан кейін
        жылдар бойы ашылмайды. Ал сол кітапты оқығысы келетін ондаған адам
        дәл сол ауданда, дәл сол көшеде тұрады.
      </p>
    </div>

    <div className="statgrid">
      <article className="stat stat--big" data-reveal>
        <div className="stat__num"><span data-count="2.4" data-decimals="1">0</span></div>
        <h3>Жылына оқылатын кітап</h3>
        <p>Орта есеппен бір оқырманға шаққанда. Себебі — қолжетімділік пен баға, ынта емес.</p>
        <div className="stat__viz" aria-hidden="true">
          <span className="tick on"></span><span className="tick on"></span><span className="tick"></span><span className="tick"></span>
          <span className="tick"></span><span className="tick"></span><span className="tick"></span><span className="tick"></span>
          <span className="tick"></span><span className="tick"></span><span className="tick"></span><span className="tick"></span>
        </div>
      </article>

      <article className="stat" data-reveal>
        <div className="stat__num"><span data-count="73">0</span>%</div>
        <h3>Бір реттен кейін ашылмайды</h3>
        <p>Оқылып болған кітап сөреде «мұражай экспонатына» айналады.</p>
      </article>

      <article className="stat" data-reveal>
        <div className="stat__num"><span data-count="5000">0</span> ₸</div>
        <h3>Бір жаңа кітаптың бағасы</h3>
        <p>Айына 2 кітап — студент бюджеті үшін көтерімсіз шығын.</p>
      </article>

      <article className="stat stat--wide" data-reveal>
        <div className="stat__split">
          <div>
            <div className="stat__num stat__num--sm">1 : 1</div>
            <h3>Қазіргі модель</h3>
            <p>Бір кітап — бір оқырман. Кітап сатып алынады, оқылады, тоқтайды.</p>
          </div>
          <div className="stat__arrow" aria-hidden="true">
            <svg viewBox="0 0 60 24"><path d="M2 12h52M46 5l8 7-8 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div>
            <div className="stat__num stat__num--sm stat__num--brand">1 : 12</div>
            <h3>OquNet моделі</h3>
            <p>Бір кітап қауымдастықтағы ондаған оқырманға жетеді. Шығын нөл.</p>
          </div>
        </div>
      </article>
    </div>
  </div>
</section>

<div className="wave-divider" aria-hidden="true">
  <svg viewBox="0 0 1440 56" preserveAspectRatio="none" fill="var(--night)">
    <path d="M0,28 C360,0 1080,56 1440,28 L1440,56 L0,56 Z"/>
  </svg>
</div>

{/* ══════════════════ GOAL ══════════════════ */}
<section className="sec sec--goal" id="goal">
  <div className="wrap goal__in">
    <div className="goal__copy">
      <p className="eyebrow eyebrow--light" data-reveal><span className="dot"></span> Мақсат</p>
      <h2 className="display display--2 display--light" data-reveal>
        Бір кітапты <span className="hl hl--gold">он екі оқырманға</span> жеткізу.
      </h2>
      <p className="lead lead--light" data-reveal>
        Біз кітапты сатпаймыз және жалға бермейміз. Біз кітаптың айналымын
        жасаймыз: сен қауымдастыққа бір кітап қосасың — ал орта саған
        өзінің бүкіл сөресін ашады.
      </p>

      <ul className="goal__list">
        <li data-reveal>
          <span className="goal__ic" aria-hidden="true">01</span>
          <div><b>Қолжетімділік</b><p>Кітап оқу ақшаға тәуелді болмауы керек. Қауымдастықтағы кітаптар — тегін.</p></div>
        </li>
        <li data-reveal>
          <span className="goal__ic" aria-hidden="true">02</span>
          <div><b>Айналым</b><p>Әр кітаптың өз жолы бар: кімнен кімге өтті, қанша рет оқылды — бәрі көрінеді.</p></div>
        </li>
        <li data-reveal>
          <span className="goal__ic" aria-hidden="true">03</span>
          <div><b>Қауымдастық</b><p>Оқу жалғыз әрекет емес. Бірге оқу, кездесулер, талқылау — бәрі бір жерде.</p></div>
        </li>
      </ul>
    </div>

    {/* Book journey animation */}
    <figure className="journey" data-reveal>
      <figcaption>Бір кітаптың жолы</figcaption>
      <svg viewBox="0 0 320 320" className="journey__svg" role="img" aria-label="Кітаптың қауымдастық ішінде бір оқырманнан екіншісіне өту жолы">
        <circle cx="160" cy="160" r="118" className="j-orbit"/>
        <circle cx="160" cy="160" r="82" className="j-orbit j-orbit--2"/>
        <path id="jpath" className="j-path" d="M160 42 A118 118 0 0 1 262 219 A118 118 0 0 1 58 219 A118 118 0 0 1 160 42 Z"/>
        <g className="j-node" style={{"--d": "0s"}}><circle cx="160" cy="42" r="20"/><text x="160" y="47">АС</text></g>
        <g className="j-node" style={{"--d": ".6s"}}><circle cx="262" cy="219" r="20"/><text x="262" y="224">ЖК</text></g>
        <g className="j-node" style={{"--d": "1.2s"}}><circle cx="58" cy="219" r="20"/><text x="58" y="224">МБ</text></g>
        <g className="j-core">
          <circle cx="160" cy="160" r="46"/>
          <text x="160" y="152">1 кітап</text>
          <text x="160" y="174" className="j-core__sm">12 оқырман</text>
        </g>
        <circle r="9" className="j-dot">
          <animateMotion dur="6s" repeatCount="indefinite" rotate="auto">
            <mpath href="#jpath"/>
          </animateMotion>
        </circle>
      </svg>
    </figure>
  </div>
</section>

<div className="wave-divider" aria-hidden="true">
  <svg viewBox="0 0 1440 56" preserveAspectRatio="none" fill="var(--paper-2)">
    <path d="M0,28 C360,56 1080,0 1440,28 L1440,56 L0,56 Z"/>
  </svg>
</div>

{/* ══════════════════ HOW IT WORKS ══════════════════ */}
<section className="sec sec--how" id="how">
  <div className="wrap">
    <div className="sec__head sec__head--center">
      <p className="eyebrow" data-reveal><span className="dot"></span> Қалай жұмыс істейді</p>
      <h2 className="display display--2" data-reveal>Бес қадам. <span className="hl">Бес минут.</span></h2>
      <p className="sec__sub sec__sub--center" data-reveal>
        Қадамдардың үстіне бассаң — экран сол қадамды көрсетеді.
        Немесе жай ғана қарап отыр: анимация өзі жүреді.
      </p>
    </div>

    <div className="how" id="how-widget" data-reveal>
      {/* Steps */}
      <ol className="how__steps" role="tablist" aria-label="Қосымша қадамдары">
        <li>
          <button className="step is-active" role="tab" aria-selected="true" data-step="0" id="tab-0" aria-controls="panel-0">
            <span className="step__n">01</span>
            <span className="step__t">
              <b>Қауымдастыққа қосыл</b>
              <small>Өз ауданыңды, университетіңді немесе офисіңді таңда. Шақыру коды бойынша да кіруге болады.</small>
            </span>
            <span className="step__bar"><i></i></span>
          </button>
        </li>
        <li>
          <button className="step" role="tab" aria-selected="false" data-step="1" id="tab-1" aria-controls="panel-1" tabindex="-1">
            <span className="step__n">02</span>
            <span className="step__t">
              <b>Кітабыңды қос</b>
              <small>Мұқабасын түсір, жанрын және күйін белгіле. Осы сәттен бастап кітап қауымдастықтың сөресінде.</small>
            </span>
            <span className="step__bar"><i></i></span>
          </button>
        </li>
        <li>
          <button className="step" role="tab" aria-selected="false" data-step="2" id="tab-2" aria-controls="panel-2" tabindex="-1">
            <span className="step__n">03</span>
            <span className="step__t">
              <b>Кітап тауып, брондап ал</b>
              <small>Іздеу, жанр сөрелері, жаңа түскендер. Брондасаң — қолма-қол беру үшін бір реттік код беріледі.</small>
            </span>
            <span className="step__bar"><i></i></span>
          </button>
        </li>
        <li>
          <button className="step" role="tab" aria-selected="false" data-step="3" id="tab-3" aria-controls="panel-3" tabindex="-1">
            <span className="step__n">04</span>
            <span className="step__t">
              <b>Оқы — таймер санап отырады</b>
              <small>Оқу минуттары, апталық серия, прогресс. Қаласаң — «Бірге оқу» бөлмесінде достарыңмен қатар оқы.</small>
            </span>
            <span className="step__bar"><i></i></span>
          </button>
        </li>
        <li>
          <button className="step" role="tab" aria-selected="false" data-step="4" id="tab-4" aria-controls="panel-4" tabindex="-1">
            <span className="step__n">05</span>
            <span className="step__t">
              <b>Қайтар және баға қой</b>
              <small>Кітап келесі оқырманға кетеді, ал оның жолы профилінде сақталады. Рейтингің өседі.</small>
            </span>
            <span className="step__bar"><i></i></span>
          </button>
        </li>
      </ol>

      {/* Phone */}
      <div className="how__phone">
        <div className="phone" aria-live="polite">
          <div className="phone__notch" aria-hidden="true"></div>
          <div className="phone__screen">

            {/* Screen 1 */}
            <div className="scr is-active" id="panel-0" role="tabpanel" aria-labelledby="tab-0">
              <div className="scr__bar"><span>9:41</span><span className="scr__sig" aria-hidden="true"></span></div>
              <div className="scr__pad">
                <h4 className="scr__h">Қауымдастық таңда</h4>
                <div className="ui-search"><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1.6"/><path d="m11 11 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg><span>Астана, Есіл</span></div>
                <div className="ui-list">
                  <div className="ui-row ui-row--anim" style={{"--i": "0"}}>
                    <div className="ui-ava" style={{"--a": "#032081", "--b": "#254EDB"}}>ЕС</div>
                    <div className="ui-txt"><b>Есіл оқырмандары</b><small>128 мүше · 340 кітап</small></div>
                    <span className="ui-pill ui-pill--join">Қосылу</span>
                  </div>
                  <div className="ui-row ui-row--anim" style={{"--i": "1"}}>
                    <div className="ui-ava" style={{"--a": "#E4572E", "--b": "#F2B441"}}>НУ</div>
                    <div className="ui-txt"><b>NU Book Club</b><small>96 мүше · 210 кітап</small></div>
                    <span className="ui-pill">Қосылу</span>
                  </div>
                  <div className="ui-row ui-row--anim" style={{"--i": "2"}}>
                    <div className="ui-ava" style={{"--a": "#0E9F6E", "--b": "#7BD3A0"}}>АЛ</div>
                    <div className="ui-txt"><b>Алматы · Бостандық</b><small>212 мүше · 512 кітап</small></div>
                    <span className="ui-pill">Қосылу</span>
                  </div>
                </div>
                <div className="ui-toast">Сен «Есіл оқырмандары» қауымдастығына қосылдың</div>
              </div>
            </div>

            {/* Screen 2 */}
            <div className="scr" id="panel-1" role="tabpanel" aria-labelledby="tab-1" hidden>
              <div className="scr__bar"><span>9:41</span><span className="scr__sig" aria-hidden="true"></span></div>
              <div className="scr__pad">
                <h4 className="scr__h">Кітап қосу</h4>
                <div className="ui-add">
                  <div className="ui-cover"><span>Абай<br />жолы</span><i className="ui-cover__flash" aria-hidden="true"></i></div>
                  <div className="ui-fields">
                    <div className="ui-field ui-field--anim" style={{"--i": "0"}}><small>Атауы</small><b>Абай жолы</b></div>
                    <div className="ui-field ui-field--anim" style={{"--i": "1"}}><small>Автор</small><b>М. Әуезов</b></div>
                    <div className="ui-field ui-field--anim" style={{"--i": "2"}}><small>Жанр</small><b>Классика</b></div>
                  </div>
                </div>
                <div className="ui-chips">
                  <span className="ui-chip is-on">Жақсы күйде</span><span className="ui-chip">Орташа</span><span className="ui-chip">Ескі</span>
                </div>
                <button className="ui-btn" type="button">Қауымдастыққа қосу</button>
                <div className="ui-toast">Кітабың сөреге қосылды · +10 ұпай</div>
              </div>
            </div>

            {/* Screen 3 */}
            <div className="scr" id="panel-2" role="tabpanel" aria-labelledby="tab-2" hidden>
              <div className="scr__bar"><span>9:41</span><span className="scr__sig" aria-hidden="true"></span></div>
              <div className="scr__pad">
                <div className="ui-book">
                  <div className="ui-cover ui-cover--sm"><span>Атомдық<br />әдеттер</span></div>
                  <div>
                    <b className="ui-book__t">Атомдық әдеттер</b>
                    <small className="ui-book__a">Джеймс Клир</small>
                    <div className="ui-stars" aria-label="Рейтинг 4.8">★★★★★ <span>4.8</span></div>
                    <div className="ui-owner"><span className="ui-ava ui-ava--xs" style={{"--a": "#032081", "--b": "#254EDB"}}>ЖК</span> Жанель К.</div>
                  </div>
                </div>
                <div className="ui-status"><i></i> Бос — алуға болады</div>
                <button className="ui-btn" type="button">Брондау</button>
                <div className="ui-code">
                  <small>Қолма-қол беру коды</small>
                  <div className="ui-code__digits"><span>4</span><span>7</span><span>2</span><span>9</span></div>
                  <small className="ui-code__hint">Иесі кодты енгізгенде кітап саған өтеді</small>
                </div>
              </div>
            </div>

            {/* Screen 4 */}
            <div className="scr" id="panel-3" role="tabpanel" aria-labelledby="tab-3" hidden>
              <div className="scr__bar"><span>9:41</span><span className="scr__sig" aria-hidden="true"></span></div>
              <div className="scr__pad scr__pad--center">
                <h4 className="scr__h">Оқу таймері</h4>
                <div className="timer">
                  <svg viewBox="0 0 120 120" aria-hidden="true">
                    <circle cx="60" cy="60" r="52" className="timer__bg"/>
                    <circle cx="60" cy="60" r="52" className="timer__fg"/>
                  </svg>
                  <div className="timer__val"><b id="timerVal">00:42</b><small>минут бүгін</small></div>
                </div>
                <div className="ui-week" aria-hidden="true">
                  <span style={{"--h": "40%"}}><i></i>Дс</span>
                  <span style={{"--h": "70%"}}><i></i>Сс</span>
                  <span style={{"--h": "55%"}}><i></i>Ср</span>
                  <span style={{"--h": "90%"}}><i></i>Бс</span>
                  <span style={{"--h": "65%"}}><i></i>Жм</span>
                  <span style={{"--h": "100%"}}><i></i>Сб</span>
                  <span style={{"--h": "35%"}}><i></i>Жк</span>
                </div>
                <div className="ui-toast">🔥 7 күндік серия · 312 минут</div>
              </div>
            </div>

            {/* Screen 5 */}
            <div className="scr" id="panel-4" role="tabpanel" aria-labelledby="tab-4" hidden>
              <div className="scr__bar"><span>9:41</span><span className="scr__sig" aria-hidden="true"></span></div>
              <div className="scr__pad">
                <h4 className="scr__h">Кітапты қайтару</h4>
                <div className="ui-rate">
                  <small>Кітапқа баға қой</small>
                  <div className="ui-stars ui-stars--big"><span className="s">★</span><span className="s">★</span><span className="s">★</span><span className="s">★</span><span className="s">★</span></div>
                </div>
                <div className="ui-journey">
                  <small>Кітаптың жолы</small>
                  <div className="ui-journey__line">
                    <span className="ui-ava ui-ava--xs" style={{"--a": "#E4572E", "--b": "#F2B441"}}>МБ</span>
                    <i></i>
                    <span className="ui-ava ui-ava--xs" style={{"--a": "#032081", "--b": "#254EDB"}}>ЖК</span>
                    <i></i>
                    <span className="ui-ava ui-ava--xs" style={{"--a": "#0E9F6E", "--b": "#7BD3A0"}}>АС</span>
                    <i></i>
                    <span className="ui-ava ui-ava--xs ui-ava--next">?</span>
                  </div>
                  <small className="ui-journey__c">3 оқырман · 41 күн · 4 бөліскен адам</small>
                </div>
                <button className="ui-btn" type="button">Келесі оқырманға беру</button>
                <div className="ui-toast">Рахмет! Рейтингің 4.9-ға көтерілді</div>
              </div>
            </div>

          </div>
        </div>
        <div className="phone__shadow" aria-hidden="true"></div>
      </div>
    </div>
  </div>
</section>

{/* ══════════════════ QUALITY OF READERS ══════════════════ */}
<section className="sec sec--quality" id="quality">
  <div className="wrap">
    <div className="sec__head">
      <p className="eyebrow eyebrow--warm" data-reveal><span className="dot"></span> Оқырман сапасы</p>
      <h2 className="display display--2" data-reveal>
        Кітапты <span className="hl hl--warm">кімге сеніп</span> беріп жатқаныңды білесің.
      </h2>
      <p className="sec__sub" data-reveal>
        Ортақ сөре сенімге сүйенеді. Сондықтан OquNet-те әр оқырманның
        мінез-құлқы ашық: қайтару тәртібі, кітапқа қамқорлығы, қауымдастықтағы белсенділігі.
      </p>
    </div>

    <div className="quality">
      <article className="qcard qcard--score" data-reveal>
        <div className="gauge" style={{"--p": "94"}}>
          <svg viewBox="0 0 140 140" aria-hidden="true">
            <circle cx="70" cy="70" r="60" className="gauge__bg"/>
            <circle cx="70" cy="70" r="60" className="gauge__fg"/>
          </svg>
          <div className="gauge__c">
            <b><span data-count="94">0</span>%</b>
            <small>уақытында қайтарылады</small>
          </div>
        </div>
        <div className="qcard__reader">
          <div className="ui-ava" style={{"--a": "#032081", "--b": "#254EDB"}}>АС</div>
          <div>
            <b>Айсұлтан С. <svg className="verified" viewBox="0 0 16 16" aria-label="расталған"><path d="M8 1l1.9 1.4 2.3-.2.6 2.2 1.9 1.3-1 2.1 1 2.1-1.9 1.3-.6 2.2-2.3-.2L8 15l-1.9-1.4-2.3.2-.6-2.2L1.3 10l1-2.1-1-2.1 1.9-1.3.6-2.2 2.3.2z" fill="#032081"/><path d="m5.4 8.1 1.8 1.8 3.4-3.6" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg></b>
            <small>18 кітап оқыды · 6 кітап бөлісті · 0 кешігу</small>
          </div>
          <span className="qcard__stars">4.9 ★</span>
        </div>
      </article>

      <article className="qcard" data-reveal>
        <span className="qcard__ic" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M12 2 4 5.5v6c0 4.6 3.4 8.8 8 10.5 4.6-1.7 8-5.9 8-10.5v-6z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><path d="m8.6 12 2.4 2.4 4.4-4.8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </span>
        <h3>Бір реттік беру коды</h3>
        <p>Кітап тек қолма-қол, төрт таңбалы кодпен өтеді. «Алдым/алмадым» деген дау болмайды — жүйе әр ауысуды жазып отырады.</p>
      </article>

      <article className="qcard" data-reveal>
        <span className="qcard__ic" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="m12 3 2.6 5.6 6.1.8-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.4l6.1-.8z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>
        </span>
        <h3>Екі жақты рейтинг</h3>
        <p>Оқырман кітапқа, кітап иесі оқырманға баға береді. Рейтингі төмен адам қауымдастықтың сирек кітаптарын ала алмайды.</p>
      </article>

      <article className="qcard" data-reveal>
        <span className="qcard__ic" aria-hidden="true">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.7"/><path d="M12 7v5.4l3.4 2" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </span>
        <h3>Мерзім мен ескерту</h3>
        <p>Әр кітапта оқу мерзімі бар. Мерзім жақындағанда қосымша өзі еске салады, кітап күтіп отырған кезек көрінеді.</p>
      </article>

      <article className="qcard qcard--board" data-reveal>
        <h3>Қауымдастық лидерборды</h3>
        <p>Ең көп бөліскен және ең жауапты оқырмандар бірінші көрінеді.</p>
        <ol className="board">
          <li><span className="board__n">1</span><span className="ui-ava ui-ava--xs" style={{"--a": "#F2B441", "--b": "#E4572E"}}>ЖК</span><b>Жанель К.</b><span className="board__v">872 минут</span></li>
          <li><span className="board__n">2</span><span className="ui-ava ui-ava--xs" style={{"--a": "#032081", "--b": "#254EDB"}}>АС</span><b>Айсұлтан С.</b><span className="board__v">802 минут</span></li>
          <li><span className="board__n">3</span><span className="ui-ava ui-ava--xs" style={{"--a": "#0E9F6E", "--b": "#7BD3A0"}}>МБ</span><b>Мөлдір Б.</b><span className="board__v">784 минут</span></li>
        </ol>
      </article>
    </div>
  </div>
</section>

{/* ══════════════════ NUMBERS ══════════════════ */}
<section className="sec sec--numbers" id="numbers">
  <div className="wrap">
    <div className="sec__head sec__head--center">
      <p className="eyebrow eyebrow--light" data-reveal><span className="dot"></span> Сандар</p>
      <h2 className="display display--2 display--light" data-reveal>Қауымдастық бүгін қандай?</h2>
    </div>

    <div className="numbers">
      <div className="num" data-reveal>
        <b><span data-count="1240" data-suffix="+" data-firebase="books">0</span></b>
        <span>қосымшадағы кітап</span>
        <small>Әр кітап орта есеппен 3 оқырманнан өткен</small>
      </div>
      <div className="num" data-reveal>
        <b><span data-count="86400" data-firebase="minutes">0</span></b>
        <span>оқылған минут</span>
        <small>Бұл — үздіксіз 60 тәуліктен астам оқу</small>
      </div>
      <div className="num" data-reveal>
        <b><span data-count="2100" data-suffix="+" data-firebase="users">0</span></b>
        <span>оқырман</span>
        <small>барлық қауымдастықтарда</small>
      </div>
      <div className="num" data-reveal>
        <b><span data-count="0" data-suffix="+" data-firebase="borrowings">0</span></b>
        <span>кітап айналымда болды</span>
        <small>жалпы borrowings саны</small>
      </div>
    </div>

    <p className="note note--light" data-reveal>
      Деректер тікелей базадан алынады. Соңғы жаңарту: <span data-firebase-updated>жүктелуде…</span>
    </p>
  </div>
</section>

{/* ══════════════════ FEATURES ══════════════════ */}
<section className="sec sec--feat">
  <div className="wrap">
    <div className="sec__head">
      <p className="eyebrow" data-reveal><span className="dot"></span> Қосымша ішінде</p>
      <h2 className="display display--2" data-reveal>Оқуды <span className="hl">жалғыз әрекет</span> болудан шығардық.</h2>
    </div>

    <div className="bento">
      <article className="bt bt--a" data-reveal>
        <h3>Кітаптың жолы</h3>
        <p>Әр кітаптың өз тарихы бар: кімнен кімге өтті, қанша күн болды, қандай баға алды.</p>
        <div className="bt__art" aria-hidden="true">
          <span className="ui-ava ui-ava--xs" style={{"--a": "#E4572E", "--b": "#F2B441"}}>МБ</span><i></i>
          <span className="ui-ava ui-ava--xs" style={{"--a": "#032081", "--b": "#254EDB"}}>ЖК</span><i></i>
          <span className="ui-ava ui-ava--xs" style={{"--a": "#0E9F6E", "--b": "#7BD3A0"}}>АС</span>
        </div>
      </article>

      <article className="bt bt--b" data-reveal>
        <h3>Бірге оқу</h3>
        <p>Онлайн бөлме немесе қаладағы офлайн кездесу. Таймер бәрінде бірге жүреді.</p>
        <div className="bt__art bt__art--room" aria-hidden="true">
          <span className="pulse"></span><span className="pulse"></span><span className="pulse"></span>
        </div>
      </article>

      <article className="bt bt--c" data-reveal>
        <h3>Жанр сөрелері</h3>
        <p>Классика, ғылыми-көпшілік, бизнес, поэзия — қауымдастықтың сөресі жанр бойынша жинақталады.</p>
        <div className="bt__genres" aria-hidden="true">
          <span>Классика</span><span>Психология</span><span>Бизнес</span><span>Поэзия</span><span>Fantasy</span><span>Тарих</span>
        </div>
      </article>

      <article className="bt bt--d" data-reveal>
        <h3>Оқу статистикасы</h3>
        <p>Күнделікті минуттар, апталық серия, аяқталған кітаптар — бәрі профильде.</p>
        <div className="bt__chart" aria-hidden="true">
          <span style={{"--h": "35%"}}></span><span style={{"--h": "62%"}}></span><span style={{"--h": "48%"}}></span>
          <span style={{"--h": "80%"}}></span><span style={{"--h": "58%"}}></span><span style={{"--h": "96%"}}></span><span style={{"--h": "70%"}}></span>
        </div>
      </article>

      <article className="bt bt--e" data-reveal>
        <h3>Хабарламалар мен чат</h3>
        <p>Кітап иесімен қосымша ішінде келіс. Нөмір алмасудың қажеті жоқ.</p>
        <div className="bt__chat" aria-hidden="true">
          <span className="msg msg--in">Кітап бос па?</span>
          <span className="msg msg--out">Иә! Ертең кітапханада берем</span>
        </div>
      </article>
    </div>
  </div>
</section>

{/* ══════════════════ TEAM ══════════════════ */}
<section className="sec sec--team" id="team">
  <div className="wrap">
    <div className="sec__head sec__head--center">
      <p className="eyebrow eyebrow--warm" data-reveal><span className="dot"></span> Команда</p>
      <h2 className="display display--2" data-reveal>Команда <span className="hl hl--warm">мүшелері</span></h2>
    </div>

    <div className="team">
      {/* TODO: аты-жөндер мен сілтемелерді өз командаңның деректерімен ауыстыр */}
      <article className="tcard" data-reveal>
        <div className="tcard__ava" style={{"--a": "#032081", "--b": "#254EDB"}}>МБ</div>
        <b className="tcard__name">Мади Берікқазы</b>
        <span className="tcard__role">Негізін қалаушы · Продукт</span>
        <p>Идеядан бастап интерфейске дейін. Қауымдастықтармен тікелей жұмыс істейді.</p>
        <a className="tcard__link" href="https://t.me/oqunetapp" target="_blank" rel="noopener">Telegram →</a>
      </article>

      <article className="tcard" data-reveal>
        <div className="tcard__ava" style={{"--a": "#E4572E", "--b": "#F2B441"}}>?</div>
        <b className="tcard__name tcard__name--ph">аты-жөні</b>
        <span className="tcard__role">Backend инженері</span>
        <p>Firebase, деректер схемасы, кітап айналымының логикасы және қауіпсіздік ережелері.</p>
        <a className="tcard__link" href="#cta">Орын бос →</a>
      </article>

      <article className="tcard" data-reveal>
        <div className="tcard__ava" style={{"--a": "#0E9F6E", "--b": "#7BD3A0"}}>?</div>
        <b className="tcard__name tcard__name--ph">аты-жөні</b>
        <span className="tcard__role">Дизайнер</span>
        <p>Интерфейс, иллюстрация, бренд. Қосымшаның әр экранының көрінісіне жауапты.</p>
        <a className="tcard__link" href="#cta">Орын бос →</a>
      </article>

      <article className="tcard" data-reveal>
        <div className="tcard__ava" style={{"--a": "#7A5AF8", "--b": "#B9A6FF"}}>?</div>
        <b className="tcard__name tcard__name--ph">аты-жөні</b>
        <span className="tcard__role">Қауымдастық менеджері</span>
        <p>Жаңа қалалар, университеттер мен кітапханалармен серіктестік, офлайн кездесулер.</p>
        <a className="tcard__link" href="#cta">Орын бос →</a>
      </article>

      <article className="tcard tcard--join" data-reveal>
        <b>Бізге қосыласың ба?</b>
        <p>Оқуды қолжетімді ететін команда жинап жатырмыз. Жазып жібер — таныссақ.</p>
        <a className="btn btn--primary btn--sm" href="https://t.me/oqunetapp" target="_blank" rel="noopener">Хат жазу</a>
      </article>
    </div>
  </div>
</section>

{/* ══════════════════ FAQ ══════════════════ */}
<section className="sec sec--faq" id="faq">
  <div className="wrap faq__in">
    <div className="faq__head">
      <p className="eyebrow" data-reveal><span className="dot"></span> Жиі қойылатын сұрақтар</p>
      <h2 className="display display--2" data-reveal>Әлі де сұрақ бар ма?</h2>
      <p className="sec__sub" data-reveal>Жауабын таппасаң — <a href="https://t.me/oqunetapp" target="_blank" rel="noopener">Telegram</a> арқылы жаз.</p>
    </div>

    <div className="faq" id="faq-list">
      <details className="qa" open>
        <summary><span>Бұл тегін бе?</span><i aria-hidden="true"></i></summary>
        <div className="qa__b"><p>Иә. Қауымдастықтағы кітаптарды алу да, өз кітабыңды қосу да тегін. Бір ғана шарт — қауымдастыққа кемінде бір кітап қосу, себебі ортақ сөре сол кітаптардан жиналады.</p></div>
      </details>
      <details className="qa">
        <summary><span>Кітабым жоғалып кетсе ше?</span><i aria-hidden="true"></i></summary>
        <div className="qa__b"><p>Әр ауысу бір реттік кодпен тіркеледі, сондықтан кітаптың дәл қазір кімде екені әрқашан белгілі. Кітапты уақытында қайтармаған оқырманның рейтингі төмендейді және қауымдастықтың сирек кітаптарына қолжетімділігі шектеледі.</p></div>
      </details>
      <details className="qa">
        <summary><span>Қауымдастықты өзім құра аламын ба?</span><i aria-hidden="true"></i></summary>
        <div className="qa__b"><p>Әрине. Ауданың, университетің, мектебің немесе офисің үшін қауымдастық құрып, шақыру сілтемесімен достарыңды шақырасың. Қауымдастықтың сөресі, лидерборды және кездесулері бөлек жүреді.</p></div>
      </details>
      <details className="qa">
        <summary><span>Кітапты қалай беремін — пошта арқылы ма?</span><i aria-hidden="true"></i></summary>
        <div className="qa__b"><p>Жоқ. OquNet — аймақтық қауымдастық: кітап қолма-қол беріледі. Университет кітапханасы, кофехана, метро бекеті — қауымдастық өзіне ыңғайлы жерді таңдайды. Кездесуді қосымша ішіндегі чатта келісесің.</p></div>
      </details>
      <details className="qa">
        <summary><span>Оқу минуттары не үшін керек?</span><i aria-hidden="true"></i></summary>
        <div className="qa__b"><p>Таймер оқу әдетін көрсетеді: күнделікті минуттар, апталық серия, аяқталған кітаптар. Бұл — өз-өзіңмен жарысу тәсілі әрі қауымдастықтың қаншалықты белсенді екенін көрсететін өлшем.</p></div>
      </details>
      <details className="qa">
        <summary><span>Қосымша қай платформаларда бар?</span><i aria-hidden="true"></i></summary>
        <div className="qa__b"><p>OquNet — веб-қосымша және PWA: браузерден ашасың да, телефоныңның негізгі экранына орнатасың. Жеке қолданба сияқты офлайн да жұмыс істейді, App Store немесе Google Play қажет емес.</p></div>
      </details>
    </div>
  </div>
</section>

{/* ══════════════════ CTA ══════════════════ */}
<section className="cta" id="cta">
  <div className="cta__glow" aria-hidden="true"></div>
  <div className="wrap cta__in">
    <p className="eyebrow eyebrow--light" data-reveal><span className="dot"></span> Бастау</p>
    <h2 className="display display--1 display--light" data-reveal>
      Сөреңде оқылып біткен<br />кітап бар ма?
    </h2>
    <p className="lead lead--light" data-reveal>
      Оны қауымдастыққа қос — орнына жүздеген кітап аласың.
    </p>
    <div className="cta__actions" data-reveal>
      <a className="btn btn--gold btn--lg" href="https://t.me/oqunetapp" target="_blank" rel="noopener">
        Қосымшаны ашу
        <svg viewBox="0 0 20 20" className="btn__i" aria-hidden="true"><path d="M4 10h11M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </a>
      <a className="btn btn--onDark btn--lg" href="https://instagram.com/oqunetapp" target="_blank" rel="noopener">Instagram-да көру</a>
    </div>
    <div className="cta__stores" data-reveal style={{"display": "flex", "gap": "12px", "marginTop": "24px", "justifyContent": "center"}}>
      <a href="https://apps.apple.com/app/oqunetapp" target="_blank" rel="noopener" aria-label="App Store-дан жүктеу" style={{"display": "flex", "opacity": ".9", "transition": "opacity .15s,transform .15s"}}><img src="assets/img/AppStore.svg" alt="Download on the App Store" height="44" loading="lazy" /></a>
      <a href="https://play.google.com/store/apps/details?id=app.oqunetapp" target="_blank" rel="noopener" aria-label="Google Play-ден жүктеу" style={{"display": "flex", "opacity": ".9", "transition": "opacity .15s,transform .15s"}}><img src="assets/img/GooglePlay.svg" alt="Get it on Google Play" height="44" loading="lazy" /></a>
    </div>
    <p className="cta__fine" data-reveal><span className="check">✓</span> Тегін <span className="check">✓</span> Тіркелу 30 секунд <span className="check">✓</span> Карта қажет емес</p>
  </div>
</section>

</main>

{/* ══════════════════ FOOTER ══════════════════ */}
<footer className="foot">
  <div className="wrap foot__in">
    <div className="foot__brand">
      <a className="brand brand--foot" href="#hero">
        <span className="brand__mark" aria-hidden="true">
          <img src="icon.svg" alt="" width="40" height="40" style={{"display": "block", "borderRadius": "11px"}} />
        </span>
        <span className="brand__word">OquNet</span>
      </a>
      <p>Қағаз кітаптарды қауымдастықпен бөлісуге арналған веб-қосымша. Кітап сөреде тұрмайды — ол жүреді.</p>
    </div>

    <nav className="foot__col" aria-label="Сайт бөлімдері">
      <h4>Сайт</h4>
      <a href="#problem">Мәселе</a>
      <a href="#goal">Мақсат</a>
      <a href="#how">Қалай жұмыс істейді</a>
      <a href="#quality">Оқырман сапасы</a>
      <a href="#team">Команда</a>
    </nav>

    <nav className="foot__col" aria-label="Әлеуметтік желілер">
      <h4>Байланыс</h4>
      <a href="https://instagram.com/oqunetapp" target="_blank" rel="noopener">Instagram · @oqunetapp</a>
      <a href="https://t.me/oqunetapp" target="_blank" rel="noopener">Telegram · @oqunetapp</a>
      <a href="https://www.tiktok.com/@oqunetapp" target="_blank" rel="noopener">TikTok · @oqunetapp</a>
      <a href="https://www.threads.net/@oqunetapp" target="_blank" rel="noopener">Threads · @oqunetapp</a>
    </nav>

    <div className="foot__col foot__col--social">
      <h4>Бізді бақыла</h4>
      <div className="socials">
        <a href="https://instagram.com/oqunetapp" target="_blank" rel="noopener" aria-label="Instagram">
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5.4" fill="none" stroke="currentColor" strokeWidth="1.7"/><circle cx="12" cy="12" r="4.1" fill="none" stroke="currentColor" strokeWidth="1.7"/><circle cx="17.2" cy="6.8" r="1.2" fill="currentColor"/></svg>
        </a>
        <a href="https://t.me/oqunetapp" target="_blank" rel="noopener" aria-label="Telegram">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 4.5 2.8 11.4c-.9.3-.9 1.6.1 1.8l4.6 1.2 1.7 5.2c.3.8 1.3 1 1.9.4l2.5-2.5 4.6 3.4c.7.5 1.7.1 1.9-.7L22.6 5.7c.2-.9-.7-1.6-1.6-1.2z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="m7.5 14.4 10.6-7.2-6.9 8.3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>
        </a>
        <a href="https://www.tiktok.com/@oqunetapp" target="_blank" rel="noopener" aria-label="TikTok">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.2 3v10.6a3.1 3.1 0 1 1-2.6-3.06" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/><path d="M14.2 3c.4 2.4 1.9 3.9 4.4 4.2" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </a>
        <a href="https://www.threads.net/@oqunetapp" target="_blank" rel="noopener" aria-label="Threads">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.3 11.6c-.2-4.4-6.6-4.5-7.2-1 .6-.4 5.6-1.3 6 3.3.3 3-4.6 4-5.3.7-.3-1.6 1.6-2.3 3.4-2.2 3.6.2 4.9 2 4.6 4.4-.4 3-3.3 4.6-6.2 4.5C7.4 21.1 4 18.2 4 12S7.5 2.9 12 3c3.3 0 5.6 1.3 6.9 3.6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </a>
      </div>
      <p className="foot__hint">Барлық желіде: <b>@oqunetapp</b></p>
    </div>
  </div>

  <div className="wrap foot__bot">
    <span>© <span id="year">2026</span> OquNet. Барлық құқық қорғалған.</span>
    <span className="foot__made">Қазақстанда жасалды 🇰🇿 · оқырмандар үшін</span>
  </div>
</footer>

{/* ══════════════════ BACK TO TOP ══════════════════ */}
<button className="back-top" id="backTop" aria-label="Жоғарыға қайту">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
</button>

{/* ══════════════════ MOBILE CTA BAR ══════════════════ */}
<div className="mobile-cta-bar" id="mobileCta" aria-hidden="true">
  <div className="mobile-cta-bar__text">
    OquNet
    <small>Кітап алмасу қауымдастығы</small>
  </div>
  <a className="btn btn--primary btn--sm" href="#cta">Бастау</a>
</div>

{/* ══════════════════ FIREBASE ══════════════════ */}


{/* Shim: main.js looks for #burger but our toggle is #menuToggle */}
<span id="burger" hidden aria-hidden="true"></span>




    </div>
  );
}
