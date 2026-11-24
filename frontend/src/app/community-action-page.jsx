"use client";

import { useEffect, useMemo, useState } from 'react';
import './public.css';
import './public-refinements.css';
import './community-pages.css';

const GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const PAGE_INFO = {
  donor: { title: 'Become a donor', tamil: 'குருதிக் கொடையாளராகுங்கள்', intro: 'Join local volunteers. Your details appear in the directory only when you choose to share them.', route: '/become-donor', icon: '♥' },
  find: { title: 'Find a blood donor', tamil: 'இரத்தக் கொடையாளரைத் தேடுங்கள்', intro: 'Browse available community donors by blood group or location.', route: '/find-blood', icon: '⌕' },
  request: { title: 'Request blood', tamil: 'இரத்தம் கோருங்கள்', intro: 'Share the blood group and hospital details so the club can coordinate support.', route: '/request-blood', icon: '✚' },
  events: { title: 'Camps & events', tamil: 'முகாம்கள் மற்றும் நிகழ்வுகள்', intro: 'See upcoming blood donation camps and community activities.', route: '/events', icon: '▦' },
};

const copy = {
  en: { home: 'Home', admin: 'Admin', name: 'Full name', phone: 'Phone number', blood: 'Blood group', area: 'Village / area', share: 'I agree to appear in the public donor directory.', add: 'Join the donor community', send: 'Send blood request', patient: 'Patient name or reference', hospital: 'Hospital', units: 'Units needed', urgency: 'Urgency', urgent: 'Urgent', critical: 'Critical', routine: 'Routine', search: 'Search by name or area', all: 'All blood groups', available: 'Available donors', open: 'Open requests', noDonors: 'No matching donors yet', noEvents: 'No upcoming events have been published yet.', noRequests: 'No open requests right now.', submitted: 'Your details were saved.', requested: 'Your request was sent to the club.', private: 'Request details are handled privately by the club. Contact numbers are not shown here.', listing: 'Only donors who opt in are shown.', empty: 'Select a blood group', loading: 'Loading community details…', error: 'Could not load this page right now.', details: 'View details', call: 'Call donor', date: 'Date', location: 'Location', donor: 'Donor', status: 'Status', joined: 'Joined', availableStatus: 'Available', unavailableStatus: 'Unavailable', newRequest: 'New blood request', requestTitle: 'Request blood support', cancel: 'Cancel', close: 'Close', selectGroup: 'Select a group', donorCount: 'donors listed' },
  ta: { home: 'முகப்பு', admin: 'நிர்வாகம்', name: 'முழுப் பெயர்', phone: 'தொலைபேசி எண்', blood: 'இரத்த வகை', area: 'ஊர் / பகுதி', share: 'பொது கொடையாளர் பட்டியலில் தோன்ற ஒப்புக்கொள்கிறேன்.', add: 'கொடையாளர் சமூகத்தில் இணையுங்கள்', send: 'இரத்தக் கோரிக்கையை அனுப்புங்கள்', patient: 'நோயாளி பெயர் அல்லது குறிப்பு', hospital: 'மருத்துவமனை', units: 'தேவையான அலகுகள்', urgency: 'அவசரநிலை', urgent: 'அவசரம்', critical: 'மிக அவசரம்', routine: 'சாதாரணம்', search: 'பெயர் அல்லது பகுதியைத் தேடுங்கள்', all: 'அனைத்து இரத்த வகைகள்', available: 'கிடைக்கும் கொடையாளர்கள்', open: 'திறந்த கோரிக்கைகள்', noDonors: 'பொருந்தும் கொடையாளர்கள் இல்லை', noEvents: 'வரவிருக்கும் நிகழ்வுகள் இன்னும் வெளியிடப்படவில்லை.', noRequests: 'இப்போது திறந்த கோரிக்கைகள் இல்லை.', submitted: 'உங்கள் விவரங்கள் சேமிக்கப்பட்டன.', requested: 'உங்கள் கோரிக்கை கிளப்பிற்கு அனுப்பப்பட்டது.', private: 'கோரிக்கை விவரங்களை கிளப் தனிப்பட்ட முறையில் கையாளும். தொடர்பு எண்கள் இங்கு காட்டப்படாது.', listing: 'ஒப்புதல் அளித்த கொடையாளர்கள் மட்டுமே இங்கு காட்டப்படுவர்.', empty: 'இரத்த வகையைத் தேர்ந்தெடுக்கவும்', loading: 'சமூக விவரங்கள் ஏற்றப்படுகின்றன…', error: 'இந்தப் பக்கத்தை இப்போது ஏற்ற முடியவில்லை.', details: 'விவரங்கள்', call: 'கொடையாளரை அழைக்க', date: 'தேதி', location: 'இடம்', donor: 'கொடையாளர்', status: 'நிலை', joined: 'இணைந்த தேதி', availableStatus: 'கிடைக்கிறார்', unavailableStatus: 'தற்போது கிடைக்கவில்லை', newRequest: 'புதிய இரத்தக் கோரிக்கை', requestTitle: 'இரத்த உதவி கோருங்கள்', cancel: 'ரத்துசெய்', close: 'மூடு', selectGroup: 'இரத்த வகையைத் தேர்ந்தெடுக்கவும்', donorCount: 'கொடையாளர்கள்' },
};

function Icon({ children }) { return <span className="community-page-icon" aria-hidden="true">{children}</span>; }

export default function CommunityActionPage({ kind }) {
  const info = PAGE_INFO[kind];
  const [language, setLanguage] = useState('en');
  const [home, setHome] = useState(null);
  const [donors, setDonors] = useState([]);
  const [events, setEvents] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const t = copy[language];
  const c = home?.translations?.[language] || {};

  useEffect(() => {
    const saved = localStorage.getItem('pn_language');
    if (saved === 'en' || saved === 'ta') setLanguage(saved);
    Promise.all([
      fetch('/api/public/homepage').then(r => r.ok ? r.json() : null),
      fetch('/api/public/donors').then(r => r.ok ? r.json() : []),
      fetch('/api/public/events').then(r => r.ok ? r.json() : []),
      fetch('/api/public/requests').then(r => r.ok ? r.json() : []),
    ]).then(([content, donorData, eventData, requestData]) => {
      setHome(content);
      setDonors(Array.isArray(donorData) ? donorData : []);
      setEvents(Array.isArray(eventData) ? eventData : []);
      setRequests(Array.isArray(requestData) ? requestData : []);
      setLoading(false);
    }).catch(() => { setError(t.error); setLoading(false); });
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem('pn_language', language);
  }, [language]);

  const visibleDonors = useMemo(() => donors.filter(donor =>
    (!group || donor.bloodGroup === group) &&
    (!search || `${donor.name || ''} ${donor.area || ''}`.toLowerCase().includes(search.toLowerCase()))
  ), [donors, group, search]);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError(''); setNotice('');
    const form = Object.fromEntries(new FormData(e.currentTarget));
    const isDonor = kind === 'donor';
    const body = isDonor
      ? { name: form.name.trim(), phone: form.phone.trim(), bloodGroup: form.bloodGroup, area: form.area.trim() || home?.region || '', available: true, publicListing: true }
      : { patient: form.patient.trim(), bloodGroup: form.bloodGroup, units: Number(form.units), hospital: form.hospital.trim(), contact: form.contact.trim(), urgency: form.urgency };
    try {
      const response = await fetch(isDonor ? '/api/public/donors' : '/api/public/requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || t.error);
      if (isDonor) setDonors(current => [result, ...current]);
      if (!isDonor) setRequests(current => [result, ...current]);
      e.currentTarget.reset();
      setNotice(isDonor ? t.submitted : t.requested);
      if (!isDonor) setRequestOpen(false);
    } catch (err) { setError(err.message || t.error); }
    finally { setBusy(false); }
  }

  if (!info) return null;
  const title = language === 'ta' ? info.tamil : (kind === 'donor' ? c.quickDonorTitle || info.title : kind === 'find' ? c.findTitle || info.title : kind === 'request' ? c.quickRequestTitle || info.title : c.eventsTitle || info.title);
  const intro = kind === 'find' ? (c.findCopy || info.intro) : kind === 'events' ? (c.eventsCopy || info.intro) : info.intro;

  return <main className="public-site community-page" lang={language}>
    <header className="community-page-header">
      <a className="community-page-brand" href="/"><img src={home?.images?.logo || '/images/poongurichi-logo.jpeg'} alt=""/><span><b>{home?.siteName || 'Poongurichi Nanbargal'}</b><small>{home?.siteSubtitle || 'BLOOD DONORS CLUB'}</small></span></a>
      <nav aria-label="Community pages">{Object.entries(PAGE_INFO).map(([key, item]) => <a className={key === kind ? 'current' : ''} key={key} href={item.route}>{language === 'ta' ? item.tamil : item.title}</a>)}</nav>
      <div className="community-page-header-actions"><div className="community-page-language"><button type="button" aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>EN</button><button type="button" aria-pressed={language === 'ta'} onClick={() => setLanguage('ta')}>தமிழ்</button></div><a href="/admin">{t.admin}</a></div>
    </header>

    <section className="community-page-hero">
      <div><a className="community-back-link" href="/">← {t.home}</a><span className="section-kicker">{language === 'ta' ? 'பூங்குறிச்சி நண்பர்கள்' : 'POONGURICHI NANBARGAL'}</span><h1>{title}</h1><p>{intro}</p></div>
      <div className={`community-hero-art tone-${kind}`}><Icon>{info.icon}</Icon><b>{kind === 'donor' ? 'One donation.' : kind === 'find' ? 'Here for you.' : kind === 'request' ? 'Help is close.' : 'Together, locally.'}</b><small>{kind === 'donor' ? 'Many lives.' : kind === 'find' ? 'Find your community.' : kind === 'request' ? 'Every minute matters.' : 'Join the next camp.'}</small></div>
    </section>

    <section className="community-page-content">
      {kind === 'donor' && <article className="community-form-card"><div className="community-card-heading"><span className="section-kicker">{language === 'ta' ? 'சமூகத்தில் இணையுங்கள்' : 'JOIN THE COMMUNITY'}</span><h2>{language === 'ta' ? 'கொடையாளர் விவரங்களைச் சேர்க்கவும்' : 'Add your donor details'}</h2><p>{t.listing}</p></div><form className="community-data-form" onSubmit={submit}><label>{t.name}<input required maxLength="100" name="name" autoComplete="name" /></label><div className="community-form-row"><label>{t.blood}<select required defaultValue="" name="bloodGroup"><option value="" disabled>{t.empty}</option>{GROUPS.map(item => <option key={item}>{item}</option>)}</select></label><label>{t.phone}<input required name="phone" type="tel" autoComplete="tel" maxLength="30" /></label></div><label>{t.area}<input name="area" defaultValue={home?.region || ''} maxLength="120" /></label><label className="community-consent"><input required name="consent" type="checkbox"/><span>{t.share}</span></label><button className="public-button primary" disabled={busy}>{busy ? '…' : t.add} <span>→</span></button></form></article>}

      {kind === 'request' && <><div className="community-request-callout"><div><span className="section-kicker">{language === 'ta' ? 'தனிப்பட்ட அவசர கோரிக்கை' : 'PRIVATE REQUEST'}</span><h2>{language === 'ta' ? 'இரத்த உதவி கோருங்கள்' : 'Tell us what is needed'}</h2><p>{t.private}</p></div><button className="public-button primary" onClick={() => { setError(''); setRequestOpen(true); }}>{t.newRequest} <span>→</span></button></div></>}

      {kind === 'find' && <><div className="community-list-tools"><label><span>{t.search}</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder={home?.region || 'Modakkurichi'} /></label><label><span>{t.blood}</span><select value={group} onChange={e => setGroup(e.target.value)}><option value="">{t.all}</option>{(home?.groupCounts?.map(item => item.group) || GROUPS).map(item => <option key={item}>{item}</option>)}</select></label></div><div className="community-group-totals">{home?.groupCounts?.map(item => <button type="button" key={item.group} className={group === item.group ? 'active' : ''} aria-pressed={group === item.group} onClick={() => setGroup(group === item.group ? '' : item.group)}><b>{item.group}</b><span>{item.count}</span></button>)}</div><div className="community-result-heading"><div><h2>{t.available}</h2><p>{visibleDonors.length} {t.donorCount}</p></div><span>{visibleDonors.length}</span></div>{visibleDonors.length ? <div className="community-directory-table-wrap"><table className="community-directory-table"><thead><tr><th>{t.donor}</th><th>{t.blood}</th><th>{t.area}</th><th>{t.phone}</th><th>{t.status}</th><th>{t.joined}</th></tr></thead><tbody>{visibleDonors.map((donor, index) => <tr key={donor._id || index}><td><span className="directory-person"><i>{(donor.name || 'D').slice(0, 1).toUpperCase()}</i><b>{donor.name}</b></span></td><td><span className="community-group-badge">{donor.bloodGroup}</span></td><td>{donor.area || home?.region || '—'}</td><td>{donor.phone ? <a className="directory-phone" href={`tel:${donor.phone}`}>{donor.phone}</a> : '—'}</td><td><span className="directory-availability"><i/> {donor.available ? t.availableStatus : t.unavailableStatus}</span></td><td>{donor.createdAt ? new Intl.DateTimeFormat(language === 'ta' ? 'ta-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(donor.createdAt)) : '—'}</td></tr>)}</tbody></table></div> : <div className="community-empty-state"><b>{t.noDonors}</b><p>{t.listing}</p><a className="public-button primary" href="/become-donor">{t.add} →</a></div>}</>}

      {kind === 'events' && <><div className="community-result-heading"><div><h2>{t.date} · {t.location}</h2><p>{home?.region || ''}</p></div><span>{events.length}</span></div>{events.length ? <div className="community-event-grid">{events.map(event => <article className="community-event-card" key={event._id}>{event.image ? <img src={event.image} alt={event.title} /> : <div className="community-event-placeholder"><Icon>▦</Icon></div>}<div><span className="section-kicker">{new Intl.DateTimeFormat(language === 'ta' ? 'ta-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(event.date))}</span><h3>{event.title}</h3><p>{event.location}</p>{event.description && <small>{event.description}</small>}</div></article>)}</div> : <div className="community-empty-state"><b>{t.noEvents}</b><p>{language === 'ta' ? 'புதிய நிகழ்வுகளை நிர்வாகப் பக்கத்தில் வெளியிடலாம்.' : 'New camps and activities will appear here when the club publishes them.'}</p></div>}</>}

      {kind === 'request' && <div className="community-public-list"><div className="community-result-heading"><h2>{t.open}</h2><span>{requests.length}</span></div>{requests.length ? <div className="community-request-list">{requests.map((request, index) => <article key={request._id || index}><span className="community-group-badge">{request.bloodGroup}</span><div><b>{request.hospital}</b><small>{request.units} {language === 'ta' ? 'அலகுகள் தேவை' : 'unit(s) needed'} · {request.urgency}</small></div><span className="community-request-status">{request.status || 'Open'}</span></article>)}</div> : <div className="community-empty-state compact"><p>{t.noRequests}</p></div>}</div>}
      {notice && <p className="community-feedback success" role="status">✓ {notice}</p>}{error && !(kind === 'request' && requestOpen) && <p className="community-feedback error" role="alert">{error}</p>}
      {loading && !error && <p className="community-loading" role="status">{t.loading}</p>}
    </section>

    {kind === 'request' && requestOpen && <div className="community-request-scrim" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setRequestOpen(false); }}><section className="community-request-popup" role="dialog" aria-modal="true" aria-labelledby="community-request-popup-title"><div className="community-popup-heading"><Icon>♥</Icon><div><span className="section-kicker">{language === 'ta' ? 'இரத்த உதவி' : 'NEED BLOOD RIGHT NOW?'}</span><h2 id="community-request-popup-title">{t.requestTitle}</h2></div><button type="button" aria-label={t.close} onClick={() => setRequestOpen(false)}>×</button></div><p className="community-popup-lead">{t.private}</p><form className="community-data-form community-request-form" onSubmit={submit}><label>{t.patient}<input required autoFocus name="patient" maxLength="100" placeholder={language === 'ta' ? 'நோயாளி பெயர் அல்லது வழக்கு குறிப்பு' : 'Patient name or case reference'} /></label><div className="community-form-row"><label>{t.blood}<select required defaultValue="" name="bloodGroup"><option value="" disabled>{t.selectGroup}</option>{GROUPS.map(item => <option key={item}>{item}</option>)}</select></label><label>{t.units}<input required name="units" type="number" min="1" max="20" defaultValue="1" /></label></div><label>{t.hospital}<input required name="hospital" maxLength="140" placeholder={language === 'ta' ? 'மருத்துவமனை மற்றும் ஊர்' : 'Hospital name and town'} /></label><div className="community-form-row"><label>{t.phone}<input required name="contact" type="tel" maxLength="30" placeholder={language === 'ta' ? 'கைபேசி எண்' : 'Mobile number'} /></label><label>{t.urgency}<select name="urgency"><option value="Urgent">{t.urgent}</option><option value="Critical">{t.critical}</option><option value="Routine">{t.routine}</option></select></label></div>{error && <p className="community-feedback error" role="alert">{error}</p>}<div className="community-request-popup-actions"><button className="community-popup-cancel" type="button" onClick={() => setRequestOpen(false)}>{t.cancel}</button><button className="public-button primary" disabled={busy}>{busy ? '…' : t.send} <span>→</span></button></div><small className="community-popup-privacy">{t.private}</small></form></section></div>}

    <footer className="community-page-footer"><a href="/">Poongurichi Nanbargal</a><a href="/admin">{t.admin}</a><span>{home?.region || 'Community blood network'}</span></footer>
  </main>;
}
