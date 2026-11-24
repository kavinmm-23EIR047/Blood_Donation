"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import './public.css';
import './public-refinements.css';

function PIcon({ name, size = 20 }) {
  const paths = {
    home: <><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>,
    arrow: <><path d="M4 12h16m-7-7 7 7-7 7"/></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2"/></>,
    drop: <path d="M12 22a7 7 0 0 0 7-7c0-4-7-13-7-13S5 11 5 15a7 7 0 0 0 7 7Z"/>,
    people: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    phone: <><path d="M22 16.9v3a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 3.1 5.18 2 2 0 0 1 5.09 3h3a2 2 0 0 1 2 1.72l.45 2.7a2 2 0 0 1-.57 1.7L8.1 11a16 16 0 0 0 4.9 4.9l1.88-1.87a2 2 0 0 1 1.7-.57l2.7.45A2 2 0 0 1 22 16.9Z"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    sparkle: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2-4.5-4.4 6.2-.9L12 3Z"/>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
    close: <><path d="m18 6-12 12M6 6l12 12"/></>,
    chevronLeft: <path d="m15 18-6-6 6-6"/>,
    chevronRight: <path d="m9 6 6 6-6 6"/>
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name] || paths.drop}
    </svg>
  );
}

function useCarousel(count, interval = 4000) {
  const containerRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [interacting, setInteracting] = useState(false);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el || !el.children.length) return;
    const center = el.scrollLeft + el.clientWidth / 2;
    let closestIndex = 0;
    let minDiff = Infinity;
    for (let i = 0; i < el.children.length; i++) {
      const child = el.children[i];
      const childCenter = child.offsetLeft + child.offsetWidth / 2;
      const diff = Math.abs(center - childCenter);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    }
    setIndex(closestIndex);
  };

  const goTo = (idx) => {
    const el = containerRef.current;
    if (!el || !el.children[idx]) return;
    const child = el.children[idx];
    const targetLeft = child.offsetLeft - (el.clientWidth - child.offsetWidth) / 2;
    el.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
    setIndex(idx);
  };

  const next = () => goTo((index + 1) % count);
  const prev = () => goTo((index - 1 + count) % count);

  useEffect(() => {
    if (interacting) return;
    const timer = setInterval(() => {
      const el = containerRef.current;
      if (!el || el.scrollWidth <= el.clientWidth + 15) return;
      setIndex(current => {
        const nextIdx = (current + 1) % count;
        if (el.children[nextIdx]) {
          const child = el.children[nextIdx];
          const targetLeft = child.offsetLeft - (el.clientWidth - child.offsetWidth) / 2;
          el.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
        }
        return nextIdx;
      });
    }, interval);
    return () => clearInterval(timer);
  }, [interacting, count, interval]);

  const bindEvents = {
    ref: containerRef,
    onScroll: handleScroll,
    onMouseEnter: () => setInteracting(true),
    onMouseLeave: () => setInteracting(false),
    onTouchStart: () => setInteracting(true),
    onTouchEnd: () => {
      setTimeout(() => setInteracting(false), 2200);
    },
  };

  return { index, goTo, next, prev, bindEvents };
}

function SwiperControls({ carousel, count, label = 'Cards' }) {
  if (count <= 1) return null;
  return (
    <div className="swiper-controls-wrap" aria-label={`${label} pagination and controls`}>
      <button
        type="button"
        className="swiper-arrow-btn prev"
        onClick={carousel.prev}
        aria-label={`Previous ${label.toLowerCase()}`}
      >
        <PIcon name="chevronLeft" size={15} />
      </button>

      <div className="swiper-dots-bar" role="tablist" aria-label={`${label} slides`}>
        {Array.from({ length: count }).map((_, idx) => (
          <button
            key={idx}
            type="button"
            role="tab"
            aria-selected={carousel.index === idx}
            className={`swiper-dot ${carousel.index === idx ? 'active' : ''}`}
            onClick={() => carousel.goTo(idx)}
            aria-label={`Go to ${label.toLowerCase()} slide ${idx + 1}`}
          />
        ))}
      </div>

      <button
        type="button"
        className="swiper-arrow-btn next"
        onClick={carousel.next}
        aria-label={`Next ${label.toLowerCase()}`}
      >
        <PIcon name="chevronRight" size={15} />
      </button>
    </div>
  );
}

function BloodMark({ light = false, src = '/images/poongurichi-logo.jpeg' }) {
  return (
    <span className={`public-mark ${light ? 'light' : ''}`}>
      <img src={src} alt="" />
    </span>
  );
}

function FooterSocialIcon({ name }) {
  const n = (name || '').toLowerCase();
  if (n.includes('instagram')) {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
      </svg>
    );
  }
  if (n.includes('facebook')) {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
      </svg>
    );
  }
  if (n.includes('youtube')) {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/>
        <polygon points="10 15 15 12 10 9 10 15" fill="currentColor"/>
      </svg>
    );
  }
  return <PIcon name="arrow" size={13} />;
}

function CommunityDonorCard({ donor, language }) {
  const [imgError, setImgError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const hasPhoto = Boolean(donor.photo && donor.photo.trim()) && !imgError;

  return (
    <article className={`featured-donor-card ${!hasPhoto ? 'is-skeleton-card' : ''}`}>
      {hasPhoto ? (
        <div className="featured-donor-img-wrap">
          {!loaded && <div className="donor-img-skeleton-pulse" />}
          <img
            src={donor.photo}
            alt={donor.name}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            onError={() => setImgError(true)}
            className={loaded ? 'is-loaded' : 'is-loading'}
          />
        </div>
      ) : (
        <div className="donor-skeleton-wrap">
          <div className="donor-skeleton-shimmer" />
          <div className="donor-skeleton-avatar">
            <span className="donor-skeleton-drop"><PIcon name="drop" size={26} /></span>
            <span className="donor-skeleton-group">{donor.bloodGroup}</span>
          </div>
          <div className="donor-skeleton-badge">
            <PIcon name="check" size={12} />
            <span>{language === 'ta' ? 'சரிபார்க்கப்பட்ட நன்கொடையாளர்' : 'Verified Community Donor'}</span>
          </div>
        </div>
      )}
      <div className="featured-donor-meta">
        <span>{donor.bloodGroup} · {donor.area || 'Modakkurichi'}</span>
        <h3>{donor.name}</h3>
        <small>{language === 'ta' ? 'சமூக நன்கொடையாளர்' : 'Community donor'}</small>
      </div>
    </article>
  );
}

function PublicEventCard({ event, language }) {
  const [imgError, setImgError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const hasImage = Boolean(event.image && event.image.trim()) && !imgError;

  return (
    <article className={`public-event-card ${!hasImage ? 'is-skeleton-event' : ''}`}>
      {hasImage ? (
        <div className="public-event-img-wrap">
          {!loaded && <div className="event-img-skeleton-pulse" />}
          <img
            className={`public-event-image ${loaded ? 'is-loaded' : 'is-loading'}`}
            src={event.image}
            alt={event.title || (language === 'ta' ? 'சமூக நிகழ்வு' : 'Community event')}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            onError={() => setImgError(true)}
          />
        </div>
      ) : (
        <div className="public-event-skeleton">
          <div className="event-skeleton-shimmer" />
          <div className="event-skeleton-center">
            <span className="event-skeleton-icon"><PIcon name="calendar" size={32} /></span>
            <span className="event-skeleton-tag">
              <PIcon name="drop" size={14} />
              {language === 'ta' ? 'இரத்ததான முகாம்' : 'Blood Donation Camp'}
            </span>
          </div>
        </div>
      )}
      <span className="public-event-date">
        <PIcon name="calendar" size={16} />
        {new Intl.DateTimeFormat(language === 'ta' ? 'ta-IN' : 'en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }).format(new Date(event.date))}
      </span>
      <h3>{event.title}</h3>
      <p className="public-event-location">
        <PIcon name="pin" size={15} />
        {event.location}
      </p>
      {event.description && <p className="public-event-description">{event.description}</p>}
    </article>
  );
}

const DEFAULT_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function PublicHome() {
  const [language, setLanguage] = useState('en');
  const [homepage, setHomepage] = useState(null);
  const [homepageError, setHomepageError] = useState(false);
  const [donors, setDonors] = useState([]);
  const [featuredDonors, setFeaturedDonors] = useState([]);
  const [events, setEvents] = useState([]);
  const [requests, setRequests] = useState([]);
  const [group, setGroup] = useState('All groups');
  const [area, setArea] = useState('');
  const [dialog, setDialog] = useState('');
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [toast, setToast] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Interactive Eligibility Quiz State
  const [eligibility, setEligibility] = useState({ age: true, weight: true, interval: true });
  // Interactive Impact Calculator State
  const [calcUnits, setCalcUnits] = useState(1);

  // Responsive Carousel & Auto-Slide Controls
  const capsuleCarousel = useCarousel(3, 3800);
  const servicesCarousel = useCarousel(6, 4200);

  const home = homepage || {};
  const c = home.translations?.[language] || {};
  const sourceCounts = home.groupCounts || [];
  const groups = sourceCounts.map(item => item.group);
  const stats = home.stats || {};
  const images = home.images || {};
  const phone = home.phone || '';

  const usedHomepageImages = new Set();
  const uniqueHomepageImage = (preferred, fallbacks = []) => {
    for (const candidate of [preferred, ...fallbacks]) {
      if (!candidate) continue;
      const key = String(candidate).trim().split('?')[0].toLowerCase();
      if (key && !usedHomepageImages.has(key)) {
        usedHomepageImages.add(key);
        return candidate;
      }
    }
    return '';
  };
  const heroImage = uniqueHomepageImage(images.hero, ['/images/hero-editorial-drawing.png', '/images/hand-blood-drop.png']);
  const eventImages = events.map(event => uniqueHomepageImage(event.image || images.events, [
    '/images/custom-community-clinic.png', '/images/custom-donation-vial.png', '/images/step-connect.svg', '/images/blood-donor-illustration.jpg',
  ]));
  const communityImage = uniqueHomepageImage(images.community, ['/images/community-donor.jpg', '/images/custom-impact-heart.png', '/images/custom-community-clinic.png']);
  const communityGalleryImages = [
    uniqueHomepageImage(images.communityGalleryOne, ['/images/custom-community-clinic.png', '/images/blood-donor-illustration.jpg', '/images/custom-impact-heart.png']),
    uniqueHomepageImage(images.communityGalleryTwo, ['/images/blood-donor-illustration.jpg', '/images/custom-impact-heart.png', '/images/donor-arm-bag.png']),
    uniqueHomepageImage(images.communityGalleryThree, ['/images/custom-impact-heart.png', '/images/donor-arm-bag.png', '/images/hand-blood-drop.svg']),
  ];

  const activeRequest = requests[0] || home.latestRequest || null;
  const activeEvent = events[0] || home.latestEvent || null;

  useEffect(() => {
    const saved = localStorage.getItem('pn_language');
    if (saved === 'ta' || saved === 'en') setLanguage(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === 'ta' ? 'ta' : 'en';
    localStorage.setItem('pn_language', language);
  }, [language]);

  useEffect(() => {
    fetch('/api/public/homepage')
      .then(response => {
        if (!response.ok) throw new Error('Homepage content is unavailable');
        return response.json();
      })
      .then(setHomepage)
      .catch(() => setHomepageError(true));
    fetch('/api/public/events')
      .then(response => response.ok ? response.json() : [])
      .then(data => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]));
    fetch('/api/public/requests')
      .then(response => response.ok ? response.json() : [])
      .then(data => setRequests(Array.isArray(data) ? data : []))
      .catch(() => setRequests([]));
  }, []);

  useEffect(() => {
    fetch('/api/public/donors')
      .then(r => {
        if (!r.ok) throw new Error('Directory unavailable');
        return r.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setDonors(data);
        }
      })
      .catch(() => {});
    fetch('/api/public/featured-donors')
      .then(response => response.ok ? response.json() : [])
      .then(data => { if (Array.isArray(data)) setFeaturedDonors(data); })
      .catch(() => {});
  }, []);

  const visibleDonors = useMemo(() => {
    return donors.filter(d => 
      (group === 'All groups' || d.bloodGroup === group) &&
      (!area || `${d.area} ${d.name}`.toLowerCase().includes(area.toLowerCase()))
    );
  }, [donors, group, area]);

  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(''), 3400);
  }

  async function addDonor(form) {
    const response = await fetch('/api/public/donors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Could not save your details');
    const record = result;
    const next = [record, ...donors];
    setDonors(next);
    setDialog('');
    showToast(c.savedDonor);
  }

  async function addRequest(form) {
    const response = await fetch('/api/public/requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Could not send your request');
    setDialog('');
    showToast(c.sentRequest);
  }

  const isEligible = eligibility.age && eligibility.weight && eligibility.interval;
  const quickAccessCards = [
    { icon: 'drop', title: c.quickDonorTitle, text: c.quickDonorCopy, href: '/become-donor', tone: 'rose' },
    { icon: 'search', title: c.quickFindTitle, text: c.quickFindCopy, href: '/find-blood', tone: 'blue' },
    { icon: 'phone', title: c.quickRequestTitle, text: c.quickRequestCopy, href: '/request-blood', tone: 'amber' },
    { icon: 'calendar', title: c.quickEventsTitle, text: c.quickEventsCopy, href: '/events', tone: 'plum' },
  ];

  if (!homepage) return <main className="public-site" aria-live="polite"><div className="homepage-load-state">{homepageError ? 'Homepage content is unavailable. Connect the content API and reload.' : 'Loading homepage content…'}</div></main>;

  return (
    <main className="public-site" lang={language}>
      {/* Background Vector Swirl Curves (matches reference landing page) */}
      <div className="bg-swirl-wires" aria-hidden="true">
        <svg viewBox="0 0 1440 800" fill="none" preserveAspectRatio="none">
          <path d="M-100 200 C 300 120, 600 450, 950 250 C 1200 100, 1400 400, 1600 280" stroke="rgba(225, 29, 72, 0.12)" strokeWidth="2.5" />
          <path d="M-50 480 C 250 360, 500 680, 850 500 C 1150 340, 1350 620, 1550 480" stroke="rgba(23, 105, 224, 0.08)" strokeWidth="2" strokeDasharray="6 8" />
          <circle cx="180" cy="120" r="140" fill="rgba(254, 226, 226, 0.45)" filter="blur(60px)" />
          <circle cx="1200" cy="300" r="220" fill="rgba(219, 234, 254, 0.5)" filter="blur(80px)" />
        </svg>
      </div>

      {/* Floating 3D Red Blood Cells (Bokeh Depth - reference aesthetic) */}
      <div className="erythrocyte-layer" aria-hidden="true">
        <div className="floating-erythrocyte rbc-1" />
        <div className="floating-erythrocyte rbc-2" />
        <div className="floating-erythrocyte rbc-3" />
        <div className="floating-erythrocyte rbc-4" />
      </div>

      {/* Modern Sticky Header */}
      <header className="public-header" data-cms-enabled={home.sections?.navigation !== false}>
        <div className={`public-nav-wrap ${mobileMenuOpen ? 'mobile-menu-open' : ''}`}>
          <a className="public-brand" href="#top">
            <BloodMark src={images.logo} />
            <span>
              <b>{home.siteName}</b>
              <small>{home.siteSubtitle}</small>
            </span>
          </a>

          <button className="public-menu-toggle" type="button" aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={mobileMenuOpen} aria-controls="public-site-navigation" onClick={() => setMobileMenuOpen(open => !open)}>
            <PIcon name={mobileMenuOpen ? 'close' : 'menu'} size={21} />
          </button>

          <nav className={`public-nav ${mobileMenuOpen ? 'is-open' : ''}`} id="public-site-navigation" aria-label={c.mainNavigation}>
            <a href="#quick-access" data-cms-enabled={home.sections?.quickAccess !== false} onClick={() => setMobileMenuOpen(false)}>{c.quickAccessTitle}</a>
            <a href="#find" onClick={() => setMobileMenuOpen(false)}>{c.find}</a>
            <a href="#eligibility" onClick={() => setMobileMenuOpen(false)}>{c.eligibilityNav}</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>{c.how}</a>
            <a href="#community" onClick={() => setMobileMenuOpen(false)}>{c.community}</a>
          </nav>

          <div className="public-nav-actions">
            <div className="language-switch" role="group" aria-label="Language">
              <button
                type="button"
                className={language === 'en' ? 'active' : ''}
                onClick={() => setLanguage('en')}
              >
                EN
              </button>
              <button
                type="button"
                className={language === 'ta' ? 'active' : ''}
                onClick={() => setLanguage('ta')}
              >
                தமிழ்
              </button>
            </div>

            <button
              className="public-button primary small"
              onClick={() => { setMobileMenuOpen(false); setDialog('donor'); }}
            >
              <span className="nav-donor-label">{c.become}</span>
              <span className="nav-donor-short">{c.becomeShort}</span>
              <PIcon name="arrow" size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section: Vector Illustrator Art + Clean Landing Page Design */}
      <section className="public-hero" id="top" data-cms-enabled={home.sections?.hero !== false}>
        <div className="hero-inner">
          <div className="hero-message">
            <span className="eyebrow-pill">
              <i /> {c.heroEyebrow}
            </span>
            <h1>
              {c.heroTitle}
              <em>{c.heroEm}</em>
            </h1>
            <p>{c.heroCopy}</p>

            <div className="hero-buttons">
              <a className="public-button primary" href="#find">
                <PIcon name="search" size={17} /> {c.find}
              </a>
              <a className="public-button outline" href="#eligibility">
                <PIcon name="drop" size={16} /> {c.eligibilityNav}
              </a>
            </div>

            <div className="hero-reassurance">
              <span className="check-mini">✓</span>
              <span>{c.reassurance}</span>
            </div>
            {activeEvent && <a className="hero-event-highlight" href="#events">
              <span className="hero-event-icon"><PIcon name="calendar" size={18} /></span>
              <span><small>{language === 'ta' ? 'வரவிருக்கும் சமூக நிகழ்வு' : 'UPCOMING COMMUNITY EVENT'}</small><b>{activeEvent.title}</b><em>{new Intl.DateTimeFormat(language === 'ta' ? 'ta-IN' : 'en-IN', { day: 'numeric', month: 'short' }).format(new Date(activeEvent.date))} · {activeEvent.location}</em></span>
              <PIcon name="arrow" size={16} />
            </a>}
          </div>

          <div className="hero-visual">
            <div className="hero-art-showcase hero-puzzle-frame">
              <div className="hero-art-backdrop" />
              {/* Minimalist Editorial Drawing: Line-art hands placing blood group puzzle piece */}
              <img
                className="hero-puzzle-vector"
                src={heroImage}
                alt="Community blood group puzzle illustration with minimalist line hands"
              />

              {/* Floating interactive status pills */}
              <div className="floating-pill pill-top-right">
                <span className="pill-dot" />
                <div>
                  <b>{stats.registeredDonors ?? 0} {c.statDonors}</b>
                  <small>{home.region}</small>
                </div>
              </div>

              <div className="floating-pill pill-bottom-left">
                <span className="pill-heart">❤️</span>
                <div>
                  <b>{c.impactPillTitle}</b>
                  <small>{c.impactPillCopy}</small>
                </div>
              </div>
            </div>
          </div>

          <div className="hero-bottom-line">
            <span>{c.brandSlogan}</span>
            <span><i /> {c.available}</span>
          </div>
        </div>
      </section>

      {/* Editorial Capsule Cards Showcase (matching reference layout) */}
      <section className="capsule-showcase" aria-label="Quick Highlights" data-cms-enabled={home.sections?.highlights !== false}>
        <div className="capsule-container" {...capsuleCarousel.bindEvents}>
          {/* Card 1: Next Donation */}
          <div className="capsule-card capsule-donation">
            <div className="capsule-card-content">
              <span className="capsule-kicker">{c.capsuleDonationKicker || (language === 'ta' ? 'அடுத்த முகாம்' : 'NEXT DONATION')}</span>
              <h3 className="capsule-title">
                {activeEvent ? activeEvent.title : (c.capsuleDonationCenter || (language === 'ta' ? 'சமூக இரத்ததான மையம்' : 'Community Donation Center'))}
              </h3>
              <p className="capsule-meta">
                <PIcon name="calendar" size={14} />{' '}
                {activeEvent
                  ? new Intl.DateTimeFormat(language === 'ta' ? 'ta-IN' : 'en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    }).format(new Date(activeEvent.date))
                  : (c.capsuleDonationDate || (language === 'ta' ? '24/7 தயார் நிலை' : '24/7 Active Support'))}
              </p>
              <div className="capsule-badge-row">
                <span className="capsule-sub-pill">
                  {activeEvent ? activeEvent.location : (c.capsuleDonationLocation || home.region || 'Modakkurichi')}
                </span>
                <a href={phone ? `tel:${phone}` : undefined} className="capsule-call-btn">
                  <PIcon name="phone" size={12} /> {c.callBtn || (language === 'ta' ? 'அழைக்க' : 'Call')}
                </a>
              </div>
            </div>
            <div className="capsule-card-art">
              <img
                src={images.donation || ''}
                alt="Hand with blood drop illustration"
                className="capsule-hand-icon"
              />
            </div>
          </div>

          {/* Card 2: Hospital Requests */}
          <div className="capsule-card capsule-request">
            <div className="capsule-card-header">
              <span className="capsule-kicker">
                {c.capsuleRequestsKicker || (language === 'ta' ? 'அவசரத் தேவை' : 'REQUESTS')}
              </span>
              <a href="#find" className="capsule-link">
                {c.capsuleRequestsViewAll || (language === 'ta' ? 'அனைத்தும்' : 'View all')} →
              </a>
            </div>
            <div className="capsule-request-body">
              {activeRequest ? (
                <>
                  <div>
                    <h3 className="capsule-title">{activeRequest.hospital || activeRequest.patient}</h3>
                    <p className="capsule-meta-sub">
                      {language === 'ta' ? 'இரத்த வகை: ' : 'Blood Type: '}
                      <b>{activeRequest.bloodGroup}</b>
                      {activeRequest.units ? ` · ${activeRequest.units} ${language === 'ta' ? 'அலகு' : 'Unit(s)'}` : ''}
                    </p>
                  </div>
                  <span className={`capsule-urgent-tag ${activeRequest.urgency === 'Critical' ? 'critical' : ''}`}>
                    {activeRequest.urgency || (language === 'ta' ? 'அவசரம்' : 'Urgent')}
                  </span>
                </>
              ) : (
                <>
                  <div>
                    <h3 className="capsule-title">
                      {language === 'ta' ? 'அவசரத் தேவைகள் இல்லை' : 'All Requests Fulfilled'}
                    </h3>
                    <p className="capsule-meta-sub">
                      {language === 'ta'
                        ? 'உடனடி உதவி தேவைப்பட்டால் கோரிக்கை அனுப்பலாம்'
                        : 'Our local donor registry is on 24/7 standby'}
                    </p>
                  </div>
                  <span className="capsule-urgent-tag standby">
                    {language === 'ta' ? 'தயார் நிலை' : 'Standby'}
                  </span>
                </>
              )}
            </div>
            <div className="capsule-request-actions">
              <button
                type="button"
                className="capsule-action-btn primary"
                onClick={() => setDialog('request')}
                title={c.sendRequest}
              >
                <PIcon name="drop" size={13} /> {c.sendRequest || (language === 'ta' ? 'கோரிக்கை' : 'Send request')}
              </button>
              <a
                href={phone ? `tel:${phone}` : undefined}
                className="capsule-action-btn outline"
                title={c.callClub}
              >
                <PIcon name="phone" size={13} /> {c.callClub || (language === 'ta' ? 'அழைக்க' : 'Call')}
              </a>
            </div>
          </div>

          {/* Card 3: Blood Donation Drive */}
          <div className="capsule-card capsule-drive">
            <div className="capsule-drive-left">
              <span className="capsule-drive-kicker">{c.capsuleDriveKicker}</span>
              <h3 className="capsule-drive-title">{c.capsuleDriveTitle}</h3>
              <p className="capsule-drive-subtitle">{c.capsuleDriveSubtitle}</p>
              <span className="capsule-drive-pill">{c.capsuleDriveBadge}</span>
            </div>
            <div className="capsule-drive-right">
              <img
                src={images.donorEmpty || ''}
                alt="Blood donation vial drive"
                className="capsule-drive-img"
              />
            </div>
          </div>
        </div>
        <SwiperControls carousel={capsuleCarousel} count={3} label="Highlights" />
      </section>

      {/* Live Community Numbers Bar */}
      <section className="community-stats" aria-label="Club statistics" data-cms-enabled={home.sections?.stats !== false}>
        <div className="stat-item">
          <span className="stat-icon plum"><PIcon name="people" size={20} /></span>
          <div>
            <b>{stats.registeredDonors ?? 0}</b>
            <small>{c.statDonors}</small>
          </div>
        </div>
        <div className="stat-item">
          <span className="stat-icon rose"><PIcon name="drop" size={20} /></span>
          <div>
            <b>{stats.requestsServed ?? 0}</b>
            <small>{c.statRequests}</small>
          </div>
        </div>
        <div className="stat-item">
          <span className="stat-icon blue"><PIcon name="heart" size={20} /></span>
          <div>
            <b>{stats.bloodGroupsCovered ?? sourceCounts.length}</b>
            <small>{c.statGroups}</small>
          </div>
        </div>
        <div className="stat-item">
          <span className="stat-icon green"><PIcon name="calendar" size={20} /></span>
          <div>
            <b>{stats.eventsOrganized ?? 0}</b>
            <small>{c.statCamps}</small>
          </div>
        </div>
        <div className="stats-tagline">
          <span className="tagline-star"><PIcon name="drop" size={15} /></span>
          <span>
            {c.tagline} <b>{c.taglineBold}</b>
          </span>
        </div>
      </section>

      <section className="quick-access-section public-section" id="quick-access" data-cms-enabled={home.sections?.quickAccess !== false}>
        <div className="quick-access-heading">
          <div><span className="section-kicker">{c.quickAccessKicker}</span><h2>{c.quickAccessTitle}</h2><p>{c.quickAccessCopy}</p></div>
          <span className="quick-access-spark quick-access-blood-badge" aria-hidden="true">
            <PIcon name="drop" size={26} />
          </span>
        </div>
        <div className="quick-access-grid">
          {quickAccessCards.map(card => (
            <a className="quick-access-card" key={card.title} href={card.href}>
              <span className={`quick-access-icon ${card.tone}`}><PIcon name={card.icon} size={22}/></span>
              <b>{card.title}</b><small>{card.text}</small><span className="quick-access-arrow" aria-hidden="true">→</span>
            </a>
          ))}
        </div>
      </section>

      {/* Services / Feature Grid (3x2 clean cards from reference landing page) */}
      <section className="services-section public-section" id="services" data-cms-enabled={home.sections?.services !== false}>
        <div className="section-topline center-topline">
          <div>
            <span className="section-kicker">{c.quickKicker}</span>
            <h2>{c.quickTitle}</h2>
            <p>{c.quickCopy}</p>
          </div>
        </div>

        <div className="services-grid" {...servicesCarousel.bindEvents}>
          <div className="service-card" onClick={() => { window.location.hash = '#find'; }}>
            <div className="service-icon-wrap rose">
              <PIcon name="search" size={22} />
            </div>
            <h3>{c.service1Title}</h3>
            <p>{c.service1Desc}</p>
            <span className="service-link">{c.find} →</span>
          </div>

          <div className="service-card" onClick={() => setDialog('donor')}>
            <div className="service-icon-wrap plum">
              <PIcon name="drop" size={22} />
            </div>
            <h3>{c.service2Title}</h3>
            <p>{c.service2Desc}</p>
            <span className="service-link">{c.become} →</span>
          </div>

          <div className="service-card" onClick={() => setDialog('request')}>
            <div className="service-icon-wrap amber">
              <PIcon name="phone" size={22} />
            </div>
            <h3>{c.service3Title}</h3>
            <p>{c.service3Desc}</p>
            <span className="service-link">{c.sendRequest} →</span>
          </div>

          <div className="service-card" onClick={() => { if (phone) window.location.href = `tel:${phone}`; }}>
            <div className="service-icon-wrap green">
              <PIcon name="calendar" size={22} />
            </div>
            <h3>{c.service4Title}</h3>
            <p>{c.service4Desc}</p>
            <span className="service-link">{c.campsName} →</span>
          </div>

          <div className="service-card">
            <div className="service-icon-wrap blue">
              <PIcon name="shield" size={22} />
            </div>
            <h3>{c.service5Title}</h3>
            <p>{c.service5Desc}</p>
            <span className="service-link">{c.reassurance} ✓</span>
          </div>

          <div className="service-card" onClick={() => { if (phone) window.location.href = `tel:${phone}`; }}>
            <div className="service-icon-wrap rose">
              <PIcon name="heart" size={22} />
            </div>
            <h3>{c.service6Title}</h3>
            <p>{c.service6Desc}</p>
            <span className="service-link">{c.callClub} →</span>
          </div>
        </div>
        <SwiperControls carousel={servicesCarousel} count={6} label="Services" />
      </section>

      {/* Interactive Feature 1: Live Blood Group Filter & Directory */}
      <section className="find-section public-section" id="find" data-cms-enabled={home.sections?.donors !== false}>
        <div className="section-topline">
          <div>
            <span className="section-kicker">{c.findKicker}</span>
            <h2>{c.findTitle}</h2>
            <p>{c.findCopy}</p>
          </div>
          <a className="available-note find-all-donors-link" href="/find-blood" aria-label={language === 'ta' ? 'அனைத்து கொடையாளர்களையும் பட்டியலில் காண்க' : 'View all donors in the full directory'}>
            <span className="pulse-dot" /> {c.directory} <b>{language === 'ta' ? 'அனைவரையும் காண்க' : 'View all donors'}</b><PIcon name="arrow" size={12}/>
          </a>
        </div>

        {/* Interactive Blood Groups Tabs Strip */}
        <div className="interactive-groups-bar">
          <span className="groups-bar-title">{c.totals}:</span>
          <div className="groups-chips-list">
            <button
              type="button"
              className={`group-chip ${group === 'All groups' ? 'active' : ''}`}
              onClick={() => setGroup('All groups')}
            >
              <b>{c.allGroups}</b>
              <small>({donors.length})</small>
            </button>
            {sourceCounts.map(item => (
              <button
                type="button"
                key={item.group}
                className={`group-chip ${group === item.group ? 'active' : ''}`}
                onClick={() => setGroup(group === item.group ? 'All groups' : item.group)}
              >
                <b>{item.group}</b>
                <small>{item.count}</small>
                {item.count === 0 && <span className="chip-alert">!</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Search Control Box */}
        <div className="donor-search-box">
          <div className="search-intro">
            <span className="search-icon"><PIcon name="search" size={20} /></span>
            <div>
              <b>{c.who}</b>
              <small>{c.searchHint}</small>
            </div>
          </div>
          <label className="search-control">
            <span>{c.group}</span>
            <select value={group} onChange={e => setGroup(e.target.value)}>
              <option value="All groups">{c.allGroups}</option>
              {groups.map(g => <option key={g}>{g}</option>)}
            </select>
          </label>
          <label className="search-control area-control">
            <span>{c.location}</span>
            <input
              value={area}
              onChange={e => setArea(e.target.value)}
              placeholder={c.locationPlaceholder}
            />
          </label>
          <div className="search-result-count">
            <b>{visibleDonors.length}</b>
            <small>{c.listed}</small>
          </div>
        </div>

        {/* Directory Results Grid */}
        <div className="directory-results">
          {visibleDonors.length ? (
            visibleDonors.map((donor, index) => (
              <article key={donor._id || index} className="public-donor-card">
                <div className="donor-card-top">
                  <span className="donor-avatar">{(donor.name || 'D').slice(0, 1).toUpperCase()}</span>
                  <span className="group-badge">{donor.bloodGroup}</span>
                </div>
                <h3>{donor.name}</h3>
                <p><PIcon name="pin" size={14} /> {donor.area || home.region}</p>
                <div className="donor-card-bottom">
                  <span><i /> {c.availableToDonate}</span>
                  <button onClick={() => setSelectedDonor(donor)}>
                    {c.viewDetails} <PIcon name="arrow" size={13} />
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="directory-empty">
              <div className="empty-art">
              <img src={images.donorEmpty || ''} alt="Blood donation illustration" />
              </div>
              <div>
                <b>{donors.length ? c.noMatch : c.emptyTitle}</b>
                <p>{c.emptyCopy}</p>
                <button className="text-action" onClick={() => setDialog('donor')}>
                  {c.addMe} <PIcon name="arrow" size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
        <aside className="donor-community-strip">
          <div className="donor-community-avatars" aria-hidden="true">
            {donors.slice(0, 4).map((donor, index) => <span key={donor._id || index}>{(donor.name || 'D').slice(0, 1).toUpperCase()}</span>)}
          </div>
          <div className="donor-community-copy"><b>{c.communityDonorTitle}</b><small>{donors.length} · {c.communityDonorCopy}</small></div>
          <a href="/find-blood">{language === 'ta' ? 'அனைத்து கொடையாளர்களையும் காண்க' : 'View all donors'} <PIcon name="arrow" size={14} /></a>
        </aside>
      </section>

      <section className="public-events-section public-section" id="events" data-cms-enabled={home.sections?.events !== false}>
        <div className="section-topline">
          <div><span className="section-kicker">{c.eventsKicker}</span><h2>{c.eventsTitle}</h2><p>{c.eventsCopy}</p></div>
          <span className="event-count-pill">{events.length}</span>
        </div>
        {events.length ? (
          <div className="public-events-grid">
            {events.map(event => (
              <PublicEventCard key={event._id || event.title} event={event} language={language} />
            ))}
          </div>
        ) : (
          <div className="public-events-empty">
            <span className="service-icon-wrap green"><PIcon name="calendar" size={22}/></span>
            <p>{c.eventsEmpty}</p>
          </div>
        )}
      </section>

      {/* Interactive Feature 2: "Can I Donate?" Self-Assessment Checker */}
      <section className="checker-section public-section" id="eligibility" data-cms-enabled={home.sections?.eligibility !== false}>
        <div className="checker-card-wrap">
          <div className="checker-copy">
            <span className="section-kicker">{c.checkerKicker}</span>
            <h2>{c.checkerTitle}</h2>
            <p>{c.checkerCopy}</p>

            <div className="checker-questions">
              <div className="checker-q-row">
                <span>{c.qAge}</span>
                <div className="q-toggle">
                  <button
                    type="button"
                    className={eligibility.age ? 'active' : ''}
                    onClick={() => setEligibility(prev => ({ ...prev, age: true }))}
                  >
                    {c.yes}
                  </button>
                  <button
                    type="button"
                    className={!eligibility.age ? 'active' : ''}
                    onClick={() => setEligibility(prev => ({ ...prev, age: false }))}
                  >
                    {c.no}
                  </button>
                </div>
              </div>

              <div className="checker-q-row">
                <span>{c.qWeight}</span>
                <div className="q-toggle">
                  <button
                    type="button"
                    className={eligibility.weight ? 'active' : ''}
                    onClick={() => setEligibility(prev => ({ ...prev, weight: true }))}
                  >
                    {c.yes}
                  </button>
                  <button
                    type="button"
                    className={!eligibility.weight ? 'active' : ''}
                    onClick={() => setEligibility(prev => ({ ...prev, weight: false }))}
                  >
                    {c.no}
                  </button>
                </div>
              </div>

              <div className="checker-q-row">
                <span>{c.qInterval}</span>
                <div className="q-toggle">
                  <button
                    type="button"
                    className={eligibility.interval ? 'active' : ''}
                    onClick={() => setEligibility(prev => ({ ...prev, interval: true }))}
                  >
                    {c.yes}
                  </button>
                  <button
                    type="button"
                    className={!eligibility.interval ? 'active' : ''}
                    onClick={() => setEligibility(prev => ({ ...prev, interval: false }))}
                  >
                    {c.no}
                  </button>
                </div>
              </div>
            </div>

            {/* Instant Result Callout */}
            <div className={`checker-verdict ${isEligible ? 'pass' : 'hold'}`}>
              <div className="verdict-icon">
                {isEligible ? <PIcon name="check" size={24} /> : <span>!</span>}
              </div>
              <div className="verdict-text">
                <b>{isEligible ? c.eligibleYes : c.eligibleNo}</b>
                <small>{isEligible ? c.eligibleYesSub : c.eligibleNoSub}</small>
              </div>
              {isEligible && (
                <button
                  type="button"
                  className="public-button primary small verdict-cta"
                  onClick={() => setDialog('donor')}
                >
                  {c.become} <PIcon name="arrow" size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="checker-visual">
            <img
              src={images.eligibility || ''}
              alt="Blood donation eligibility mascot"
              className="checker-mascot-img"
            />
          </div>
        </div>
      </section>

      {/* Interactive Feature 3: Impact Calculator */}
      <section className="impact-section public-section" data-cms-enabled={home.sections?.impact !== false}>
        <div className="impact-box">
          <div className="impact-left">
            <span className="section-kicker">{c.calcKicker}</span>
            <h2>{c.calcTitle}</h2>
            <p>{c.calcCopy}</p>

            <div className="impact-units-picker">
              <span>{c.calcUnits}</span>
              <div className="units-buttons">
                {[1, 2, 3, 4].map(num => (
                  <button
                    key={num}
                    type="button"
                    className={`unit-btn ${calcUnits === num ? 'selected' : ''}`}
                    onClick={() => setCalcUnits(num)}
                  >
                    {num} {language === 'ta' ? (num === 1 ? 'அலகு' : 'அலகுகள்') : (num === 1 ? 'Unit' : 'Units')}
                  </button>
                ))}
              </div>
            </div>

            <div className="impact-metrics-row">
              <div className="impact-metric-pill">
                <strong>{calcUnits * 3}</strong>
                <span>{c.calcLives}</span>
              </div>
              <div className="impact-metric-pill">
                <strong>{calcUnits * 450}</strong>
                <span>{c.calcVolume}</span>
              </div>
            </div>
            <p className="impact-note">✓ {c.calcSupport}</p>
          </div>

          <div className="impact-right">
            <img
              src={images.impact || ''}
              alt="Save life blood donation heart"
              className="impact-art-img"
            />
          </div>
        </div>
      </section>

      {/* 3 Steps Section (Illustrated vector cards) */}
      <section className="steps-section public-section" id="how-it-works" data-cms-enabled={home.sections?.steps !== false}>
        <div className="section-topline center-topline">
          <div>
            <span className="section-kicker">{c.stepsKicker}</span>
            <h2>{c.stepsTitle}</h2>
            <p>{c.stepsCopy}</p>
          </div>
        </div>

        <div className="steps-grid">
          <article className="step-card">
            <span className="step-number">01</span>
            <div className="step-graphic-wrap">
              <img src={images.stepJoin || ''} alt="Join blood network" />
            </div>
            <span className="step-label">{c.joinLabel}</span>
            <h3>{c.joinTitle}</h3>
            <p>{c.joinCopy}</p>
          </article>

          <article className="step-card">
            <span className="step-number">02</span>
            <div className="step-graphic-wrap">
              <img src={images.stepMatch || ''} alt="Search and match blood" />
            </div>
            <span className="step-label">{c.matchLabel}</span>
            <h3>{c.matchTitle}</h3>
            <p>{c.matchCopy}</p>
          </article>

          <article className="step-card">
            <span className="step-number">03</span>
            <div className="step-graphic-wrap">
              <img src={images.stepConnect || ''} alt="Connect and save life" />
            </div>
            <span className="step-label">{c.connectLabel}</span>
            <h3>{c.connectTitle}</h3>
            <p>{c.connectCopy}</p>
          </article>
        </div>
      </section>

      {/* Community Story Section */}
      <section className="community-feature public-section" id="community" data-cms-enabled={home.sections?.community !== false}>
        <div className="feature-image-wrap">
          <img src={images.community || ''} alt="Community Blood Donation Clinic Volunteer" />
          <span className="image-ribbon">
            <PIcon name="heart" size={14} /> {c.firstDonor.toUpperCase()}
          </span>
        </div>
        <div className="feature-copy">
          <span className="section-kicker">{c.clubKicker}</span>
          <h2>
            {c.clubTitle1} <em>{c.clubTitle2}</em>
          </h2>
          <p>{c.clubCopy}</p>
          <div className="feature-callout">
            <span className="quote-mark">“</span>
            <div>
              <b>{c.promise}</b>
              <small>{c.promiseCopy}</small>
            </div>
          </div>
          <div className="feature-actions">
            <a className="public-button outline" href="#contact">
              {c.talk} <PIcon name="arrow" size={14} />
            </a>
            <button className="text-action" onClick={() => setDialog('donor')}>
              {c.joinFamily} <PIcon name="arrow" size={14} />
            </button>
          </div>
        </div>
      </section>

      <section className="featured-community public-section" aria-labelledby="featured-community-title" data-cms-enabled={home.sections?.community !== false}>
        <div className="section-topline"><div><span className="section-kicker">{c.community}</span><h2 id="featured-community-title">{c.communityDonorTitle}</h2><p>{c.communityDonorCopy}</p></div><a className="community-showcase-link" href="/find-blood">{c.directory} <PIcon name="arrow" size={14}/></a></div>
        <div className="community-showcase-layout">
          <article className="community-showcase-feature">
            <img src={communityImage} alt={c.communityDonorTitle || c.community}/>
            <span className="community-showcase-overlay"><small>{language === 'ta' ? 'நமது சமூகத்தின் ஒரு பார்வை' : 'A LOOK INTO OUR COMMUNITY'}</small><b>{home.siteName || 'Poongurichi Nanbargal'}</b></span>
          </article>
          <div className="community-showcase-side">
            <div className="community-showcase-message"><span className="section-kicker">{language === 'ta' ? 'ஒன்றாக இணைவோம்' : 'STRONGER TOGETHER'}</span><h3>{c.communityDonorTitle}</h3><p>{c.communityDonorCopy}</p><div className="community-showcase-stats"><span><b>{stats.registeredDonors ?? donors.length}</b><small>{c.statDonors}</small></span><span><b>{stats.bloodGroupsCovered ?? groups.length}</b><small>{c.statGroups}</small></span><span><b>{events.length}</b><small>{c.statCamps}</small></span></div></div>
            <a className="community-showcase-cta" href="/become-donor">{c.joinFamily} <PIcon name="arrow" size={14}/></a>
          </div>
        </div>
        <div className="community-gallery-heading"><span className="section-kicker">{language === 'ta' ? 'சமூகக் காட்சிகள்' : 'COMMUNITY GALLERY'}</span><span>{featuredDonors.length ? `${featuredDonors.length} ${language === 'ta' ? 'புகைப்படங்கள்' : 'photos'}` : (language === 'ta' ? 'புகைப்படங்கள் சேர்க்கப்படும்போது இங்கே தோன்றும்' : 'Photos will appear here as they are added')}</span></div>
        {featuredDonors.length ? (
          <div className="featured-donor-grid">
            {featuredDonors.map(donor => (
              <CommunityDonorCard key={donor._id || donor.name} donor={donor} language={language} />
            ))}
          </div>
        ) : ( <div className="community-gallery-placeholders" aria-label={language === 'ta' ? 'சமூகப் புகைப்பட முன்னோட்டங்கள்' : 'Community photo placeholders'}>
          <article className="community-placeholder-card"><img src={communityGalleryImages[0]} alt=""/><span><small>{language === 'ta' ? 'முன்னோட்டப் படம்' : 'IMAGE PREVIEW'}</small><b>{c.quickEventsTitle}</b></span></article>
          <article className="community-placeholder-card"><img src={communityGalleryImages[1]} alt=""/><span><small>{language === 'ta' ? 'முன்னோட்டப் படம்' : 'IMAGE PREVIEW'}</small><b>{c.quickDonorTitle}</b></span></article>
          <article className="community-placeholder-card"><img src={communityGalleryImages[2]} alt=""/><span><small>{language === 'ta' ? 'முன்னோட்டப் படம்' : 'IMAGE PREVIEW'}</small><b>{c.community}</b></span></article>
        </div>)}
      </section>

      {/* Urgent Emergency Banner (Matches reference landing page CTA) */}
      <section className="urgent-banner" data-cms-enabled={home.sections?.emergency !== false}>
        <div className="urgent-icon">
          <PIcon name="phone" size={24} />
        </div>
        <div className="urgent-copy-wrap">
          <span className="urgent-kicker">{c.urgentKicker}</span>
          <h2>{c.urgentTitle}</h2>
          <p>{c.urgentCopy}</p>
        </div>
        <div className="urgent-actions-wrap">
          <button type="button" className="urgent-secondary" onClick={() => setDialog('request')}>
            {c.sendRequest}
          </button>
          <a className="public-button urgent-button" href={phone ? `tel:${phone}` : undefined}>
            <PIcon name="phone" size={15} /> {c.callClub}
          </a>
        </div>
      </section>

      {/* Black, Red & White Based Modern Footer */}
      <footer className="public-footer" id="contact" data-cms-enabled={home.sections?.footer !== false}>
        <div className="footer-top-glow" aria-hidden="true" />
        <div className="footer-main">
          {/* Column 1: Brand & Slogan */}
          <div className="footer-brand">
            <a className="public-brand" href="#top">
              <BloodMark light src={images.logo} />
              <span>
                <b className="footer-brand-name">{home.siteName || 'Poongurichi Nanbargal'}</b>
                <small className="footer-brand-badge">{home.siteSubtitle || 'BLOOD DONORS CLUB'}</small>
              </span>
            </a>
            <p className="footer-mission-text">
              {c.footerLine1 || 'One donation can become someone’s second chance.'}
            </p>
            <div className="footer-brand-pill">
              <span className="footer-pulse-dot" />
              <span>{c.brandSlogan || 'One donation. Many lives.'}</span>
            </div>
            <div className="footer-trust-tag">
              <PIcon name="shield" size={13} />
              <span>{language === 'ta' ? '100% இலவச தன்னார்வ சேவை' : '100% Free & Voluntary Service'}</span>
            </div>
          </div>

          {/* Column 2: 24/7 Coordinators */}
          <div className="footer-column footer-coordinators-col">
            <span className="footer-col-kicker">
              <PIcon name="phone" size={13} /> {c.contacts || (language === 'ta' ? 'ஒருங்கிணைப்பாளர்கள்' : 'COORDINATORS')}
            </span>
            <small className="footer-col-sub">{language === 'ta' ? '24/7 உடனடி அவசர உதவி எண்கள்' : '24/7 Emergency Helpline'}</small>
            <div className="footer-coordinator-list">
              {(home.contacts || []).map((contact, index) => (
                <a
                  key={`${contact.phone}-${index}`}
                  href={`tel:${contact.phone}`}
                  className="footer-coordinator-card"
                  title={`${contact.name}: ${contact.phone}`}
                >
                  <span className="footer-phone-icon">
                    <PIcon name="phone" size={13} />
                  </span>
                  <div className="footer-contact-info">
                    <span className="footer-contact-name">{contact.name}</span>
                    <b className="footer-contact-number">{contact.phone}</b>
                  </div>
                  <span className="footer-call-pill">{language === 'ta' ? 'அழைக்க' : 'Call'}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Column 3: Follow Community & Social Links */}
          <div className="footer-column footer-social-col">
            <span className="footer-col-kicker">
              <PIcon name="people" size={13} /> {c.social || (language === 'ta' ? 'பின்தொடருங்கள்' : 'FOLLOW COMMUNITY')}
            </span>
            <small className="footer-col-sub">{language === 'ta' ? 'சமூக ஊடகங்களில் இணையுங்கள்' : 'Stay connected with our club'}</small>
            <div className="footer-social-list">
              {(home.socials || []).map((social, index) => (
                <a
                  key={`${social.name}-${index}`}
                  href={social.url}
                  target="_blank"
                  rel="noreferrer"
                  className="footer-social-card"
                >
                  <span className="footer-social-icon">
                    <FooterSocialIcon name={social.name} />
                  </span>
                  <span className="footer-social-name">{social.name}</span>
                  <b className="footer-social-arrow">↗</b>
                </a>
              ))}
            </div>
          </div>

          {/* Column 4: Club Headquarters & Location */}
          <div className="footer-club footer-location-col">
            <span className="footer-col-kicker">
              <PIcon name="pin" size={13} /> {c.based || (language === 'ta' ? 'இருப்பிடம்' : 'LOCATION')}
            </span>
            <div className="footer-location-box">
              <div className="footer-location-header">
                <span className="footer-pin-badge">
                  <PIcon name="pin" size={15} />
                </span>
                <div>
                  <b className="footer-region-name">{home.region || 'Modakkurichi'}</b>
                  <span className="footer-district-tag">{language === 'ta' ? 'ஈரோடு மாவட்டம்' : 'Erode District, TN'}</span>
                </div>
              </div>
              <p className="footer-unit-desc">{c.unit || 'Unit of Poongurichi Nanbargal'}</p>
              <div className="footer-location-footer">
                <span className="footer-check-mark">✓</span>
                <span>{language === 'ta' ? 'மொடக்குறிச்சி & சுற்றுவட்டாரப் பகுதிகள்' : 'Serving Modakkurichi & surrounding areas'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Developer Credit */}
        <div className="footer-bottom">
          <span className="footer-copyright">
            © {new Date().getFullYear()} {c.copyright || 'Poongurichi Nanbargal Donor’s Club. All rights reserved.'}
          </span>
          <span className="footer-developer">
            <span className="footer-dev-label">{c.developer || 'Developed by'}</span>{' '}
            <b className="footer-dev-name">{home.developerName || 'Bothishankar.Natarajan'}</b>
            {home.developerPhone && (
              <a href={`tel:${home.developerPhone}`} className="footer-dev-phone">
                <PIcon name="phone" size={11} /> {home.developerPhone}
              </a>
            )}
          </span>
        </div>
      </footer>

      {/* Human-Centric Mobile Bottom Navigation Dock */}
      <nav className="mobile-bottom-bar" aria-label="Mobile Navigation">
        <a href="#top" className="mobile-bar-item" onClick={() => setMobileMenuOpen(false)}>
          <PIcon name="home" size={20} />
          <span>{language === 'ta' ? 'முகப்பு' : 'Home'}</span>
        </a>

        <a href="#find" className="mobile-bar-item" onClick={() => setMobileMenuOpen(false)}>
          <PIcon name="search" size={20} />
          <span>{language === 'ta' ? 'தேடுங்கள்' : 'Find'}</span>
        </a>

        <button
          type="button"
          className="mobile-bar-hero-btn"
          onClick={() => { setMobileMenuOpen(false); setDialog('request'); }}
          aria-label={language === 'ta' ? 'அவசர இரத்தக் கோரிக்கை' : 'Emergency Blood Request'}
        >
          <span className="mobile-hero-icon-wrap">
            <PIcon name="drop" size={22} />
          </span>
          <span className="mobile-hero-label">{language === 'ta' ? 'கோரிக்கை' : 'Request'}</span>
        </button>

        <a href="#eligibility" className="mobile-bar-item" onClick={() => setMobileMenuOpen(false)}>
          <PIcon name="check" size={20} />
          <span>{language === 'ta' ? 'தகுதி' : 'Eligibility'}</span>
        </a>

        <a
          href={phone ? `tel:${phone}` : '#contact'}
          className="mobile-bar-item mobile-bar-call"
          onClick={() => setMobileMenuOpen(false)}
        >
          <PIcon name="phone" size={20} />
          <span>{language === 'ta' ? 'அழைக்க' : 'Call 24/7'}</span>
        </a>
      </nav>

      {/* Interactive Modals */}
      {dialog === 'donor' && (
        <DonorDialog
          language={language}
          content={c}
          groups={groups?.length ? groups : DEFAULT_GROUPS}
          onClose={() => setDialog('')}
          onSave={addDonor}
        />
      )}
      {dialog === 'request' && (
        <RequestDialog
          language={language}
          content={c}
          groups={groups?.length ? groups : DEFAULT_GROUPS}
          onClose={() => setDialog('')}
          onSave={addRequest}
        />
      )}
      {selectedDonor && <DonorDetails language={language} content={c} donor={selectedDonor} onClose={() => setSelectedDonor(null)} />}
      {toast && <div className="public-toast"><span>✓</span>{toast}</div>}
    </main>
  );
}

function DonorDialog({ language, content: c, groups = DEFAULT_GROUPS, onClose, onSave }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const d = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await onSave({
        name: d.name.trim(),
        phone: d.phone.trim(),
        bloodGroup: d.bloodGroup,
        area: d.area.trim() || c.regionName,
        available: true,
        publicListing: true
      });
    } catch (err) {
      setError(err.message || 'Could not save your details.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <DialogFrame title={c.donorDialogTitle} kicker={c.become} onClose={onClose}>
      <p className="dialog-lead">{c.donorDialogCopy}</p>
      <form onSubmit={submit}>
        <FormField title={c.yourName}>
          <input required autoFocus name="name" placeholder={language === 'en' ? 'Full name' : 'முழுப் பெயர்'} />
        </FormField>
        <div className="dialog-row">
          <FormField title={c.bloodGroup}>
            <select name="bloodGroup" required defaultValue="">
              <option value="" disabled>{c.selectGroup}</option>
              {groups.map(g => <option key={g}>{g}</option>)}
            </select>
          </FormField>
          <FormField title={c.area}>
            <input name="area" placeholder={c.regionName} />
          </FormField>
        </div>
        <FormField title={c.phone}>
          <input name="phone" type="tel" required placeholder={c.mobile} />
        </FormField>
        <label className="consent-row">
          <input type="checkbox" name="consent" required />
          <span>{c.consent}</span>
        </label>
        {error && <p className="form-error">{error}</p>}
        <div className="dialog-actions">
          <button type="button" className="public-button outline" onClick={onClose}>{c.cancel}</button>
          <button className="public-button primary" disabled={busy}>
            {busy ? c.saving : c.joinDirectory} <PIcon name="arrow" size={14} />
          </button>
        </div>
      </form>
      <p className="privacy-note">
        <PIcon name="shield" size={14} /> {c.privacyDonor}
      </p>
    </DialogFrame>
  );
}

function RequestDialog({ language, content: c, groups = DEFAULT_GROUPS, onClose, onSave }) {
  const [error, setError] = useState('');
  async function submit(e) {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await onSave({
        patient: d.patient.trim(),
        bloodGroup: d.bloodGroup,
        units: Number(d.units),
        hospital: d.hospital.trim(),
        contact: d.contact.trim(),
        urgency: d.urgency
      });
    } catch (err) {
      setError(err.message || 'Could not submit your request.');
    }
  }

  return (
    <DialogFrame title={c.requestTitle} kicker={c.urgentKicker} onClose={onClose}>
      <p className="dialog-lead">{c.requestCopy}</p>
      <form onSubmit={submit}>
        <FormField title={c.patient}>
          <input name="patient" required autoFocus placeholder={c.patientPlaceholder} />
        </FormField>
        <div className="dialog-row">
          <FormField title={c.bloodGroup}>
            <select name="bloodGroup" required defaultValue="">
              <option value="" disabled>{c.selectGroup}</option>
              {groups.map(g => <option key={g}>{g}</option>)}
            </select>
          </FormField>
          <FormField title={c.units}>
            <input name="units" type="number" min="1" max="20" defaultValue="1" />
          </FormField>
        </div>
        <FormField title={c.hospital}>
          <input name="hospital" required placeholder={c.hospitalPlaceholder} />
        </FormField>
        <div className="dialog-row">
          <FormField title={c.contactPhone}>
            <input name="contact" required type="tel" placeholder={c.mobile} />
          </FormField>
          <FormField title={c.urgency}>
            <select name="urgency">
              <option value="Urgent">{c.urgent}</option>
              <option value="Critical">{c.critical}</option>
              <option value="Routine">{c.routine}</option>
            </select>
          </FormField>
        </div>
        {error && <p className="form-error">{error}</p>}
        <div className="dialog-actions">
          <button type="button" className="public-button outline" onClick={onClose}>{c.cancel}</button>
          <button className="public-button primary">{c.sendPrivate} <PIcon name="arrow" size={14} /></button>
        </div>
      </form>
      <p className="privacy-note">
        <PIcon name="shield" size={14} /> {c.privacyRequest}
      </p>
    </DialogFrame>
  );
}

function FormField({ title, children }) {
  return (
    <label className="public-field">
      <span>{title}</span>
      {children}
    </label>
  );
}

function DialogFrame({ title, kicker, onClose, children }) {
  return (
    <div className="dialog-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <section className="public-dialog">
        <div className="dialog-head">
          <span className="dialog-symbol"><PIcon name="drop" size={18} /></span>
          <button aria-label="Close dialog" className="dialog-close" onClick={onClose}>×</button>
          <span className="section-kicker">{kicker}</span>
          <h2>{title}</h2>
        </div>
        {children}
      </section>
    </div>
  );
}

function DonorDetails({ language, content: c, donor, onClose }) {
  return (
    <div className="dialog-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <section className="public-dialog detail-dialog">
        <button aria-label={language === 'en' ? 'Close donor details' : 'நன்கொடையாளர் விவரங்களை மூடு'} className="dialog-close" onClick={onClose}>×</button>
        <div className="detail-blood">{donor.bloodGroup}</div>
        <span className="section-kicker">{c.donorDetails}</span>
        <h2>{donor.name}</h2>
        <p className="donor-location"><PIcon name="pin" size={14} /> {donor.area || c.regionName}</p>
        <div className="detail-availability"><i /> {c.availableToDonate}</div>
        <a className="public-button primary full-button" href={`tel:${donor.phone}`}>
          <PIcon name="phone" size={15} /> {c.callName} {donor.name.split(' ')[0]} <PIcon name="arrow" size={14} />
        </a>
        <p className="privacy-note"><PIcon name="shield" size={14} /> {c.donorPrivacy}</p>
      </section>
    </div>
  );
}

