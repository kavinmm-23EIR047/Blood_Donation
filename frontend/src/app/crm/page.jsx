"use client";

import { useEffect, useMemo, useState } from 'react';
import './crm.css';
import './crm-refinements.css';

const GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const COMMUNITY_IMAGE_SLOTS = { events: '', communityGalleryOne: '', communityGalleryTwo: '', communityGalleryThree: '' };
const withCommunityImageSlots = value => ({ ...value, images: { ...COMMUNITY_IMAGE_SLOTS, ...(value?.images || {}) } });
const initialGroups = GROUPS.map(group => ({ group, count: 0 }));
const initialStats = { totalDonors: 0, activeDonors: 0, openRequests: 0, events: 0, bloodGroups: initialGroups };

function Icon({ name, size = 18, stroke = 1.8 }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    drop: <path d="M12 22a7 7 0 0 0 7-7c0-4-7-13-7-13S5 11 5 15a7 7 0 0 0 7 7Z"/>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    arrow: <><path d="M5 12h14m-7-7 7 7-7 7"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
    close: <><path d="m18 6-12 12M6 6l12 12"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2"/></>,
    check: <><path d="m5 12 4 4L19 6"/></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></>,
    activity: <><path d="M3 12h4l3-9 4 18 3-9h4"/></>,
    filter: <><path d="M4 6h16M7 12h10m-7 6h4"/></>,
    phone: <><path d="M22 16.9v3a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 3.1 5.18 2 2 0 0 1 5.09 3h3a2 2 0 0 1 2 1.72l.45 2.7a2 2 0 0 1-.57 1.7L8.1 11a16 16 0 0 0 4.9 4.9l1.88-1.87a2 2 0 0 1 1.7-.57l2.7.45A2 2 0 0 1 22 16.9Z"/></>,
    external: <><path d="M14 3h7v7M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></>,
    trash: <><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6"/></>,
    more: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.activity}</svg>;
}

const navigation = [
  { id: 'overview', label: 'Overview', icon: 'grid' }, { id: 'donors', label: 'Donor directory', icon: 'users' },
  { id: 'requests', label: 'Blood requests', icon: 'drop', badge: '5' }, { id: 'events', label: 'Camps & events', icon: 'calendar' },
  { id: 'community', label: 'Community', icon: 'heart' }, { id: 'homepage', label: 'Homepage content', icon: 'activity' },
];

function dateText(value, options = { month: 'short', day: 'numeric' }) { if (!value) return '—'; return new Intl.DateTimeFormat('en-IN', options).format(new Date(value)); }

export default function App() {
  const [page, setPage] = useState('overview');
  const [stats, setStats] = useState(initialStats);
  const [donors, setDonors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [events, setEvents] = useState([]);
  const [homepageContent, setHomepageContent] = useState(null);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [apiStatus, setApiStatus] = useState('Checking connection');
  const [databaseConnected, setDatabaseConnected] = useState(false);
  const [authNeeded, setAuthNeeded] = useState(true);
  const [authConfigured, setAuthConfigured] = useState(true);
  const [notice, setNotice] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    fetch('/api/public/homepage').then(response => response.ok ? response.json() : null).then(content => { if (content) setHomepageContent(current => current || content); }).catch(() => {});
    const token = sessionStorage.getItem('pn_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    fetch('/api/health').then(r => r.json()).then(d => {
      setAuthConfigured(d.authConfigured !== false);
      if (d.database !== 'connected') { setDatabaseConnected(false); setApiStatus('Demo mode'); return; }
      setDatabaseConnected(true);
      if (!token) { setApiStatus('Sign in required'); setAuthNeeded(true); return; }
      setAuthNeeded(false);
      setApiStatus('MongoDB connected');
      return Promise.all([fetch('/api/dashboard', { headers }), fetch('/api/donors', { headers }), fetch('/api/requests', { headers }), fetch('/api/events', { headers }), fetch('/api/homepage/content', { headers })]);
    }).then(async responses => {
      if (!responses) return;
      if (responses.some(r => r.status === 401)) { sessionStorage.removeItem('pn_token'); setApiStatus('Sign in required'); setAuthNeeded(true); return; }
      if (responses.some(r => !r.ok)) throw new Error('API unavailable');
      const [data, d, r, e, content] = await Promise.all(responses.map(response => response.json()));
      setStats(data);
      setDonors(d); setRequests(r); setEvents(e);
      setHomepageContent(content);
    }).catch(() => setApiStatus('Demo mode'));
  }, []);

  const filteredDonors = useMemo(() => donors.filter(d => (filter === 'All' || d.bloodGroup === filter) && `${d.name} ${d.area} ${d.phone}`.toLowerCase().includes(search.toLowerCase())), [donors, filter, search]);
  const filteredRequests = useMemo(() => requests.filter(r => (filter === 'All' || r.status === filter) && `${r.patient} ${r.hospital} ${r.bloodGroup}`.toLowerCase().includes(search.toLowerCase())), [requests, filter, search]);
  const filteredEvents = useMemo(() => events.filter(e => `${e.title} ${e.location}`.toLowerCase().includes(search.toLowerCase())), [events, search]);

  const toast = (text) => { setNotice(text); window.setTimeout(() => setNotice(''), 3200); };
  async function saveRecord(type, data, recordId) {
    const resource = type === 'donor' ? 'donors' : type === 'request' ? 'requests' : 'events';
    const isUpdate = type === 'event-edit';
    let unauthorized = false;
    try {
      const token = sessionStorage.getItem('pn_token');
      const response = await fetch(`/api/${resource}${isUpdate ? `/${recordId}` : ''}`, { method: isUpdate ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(data) });
      if (response.status === 401) { unauthorized = true; throw new Error('Authentication expired'); }
      if (response.ok) {
        const record = await response.json();
        if (type === 'donor') { const next = [record, ...donors]; setDonors(next); setStats(s => ({ ...s, totalDonors: s.totalDonors + 1, activeDonors: s.activeDonors + Number(record.available), bloodGroups: s.bloodGroups.map(g => g.group === record.bloodGroup ? { ...g, count: g.count + 1 } : g) })); }
        if (type === 'request') { setRequests([record, ...requests]); setStats(s => ({ ...s, openRequests: s.openRequests + 1 })); }
        if (type === 'event') { setEvents([record, ...events]); setStats(s => ({ ...s, events: s.events + 1 })); }
        if (isUpdate) setEvents(current => current.map(event => event._id === record._id ? record : event));
        setApiStatus('MongoDB connected');
      } else throw new Error('API unavailable');
    } catch {
      if (unauthorized) { sessionStorage.removeItem('pn_token'); setAuthNeeded(true); setApiStatus('Sign in required'); toast('Sign in again to save this record'); return; }
      toast('MongoDB is unavailable. This record was not saved; reconnect the database and try again.'); return;
    }
    setModal(null); toast(type === 'donor' ? 'Donor profile saved' : type === 'request' ? 'Blood request added' : isUpdate ? 'Event updated' : 'Event added');
  }

  async function updateRequest(row, status) {
    const token = sessionStorage.getItem('pn_token');
    try {
      const response = await fetch(`/api/requests/${row._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ status }) });
      if (response.status === 401) { sessionStorage.removeItem('pn_token'); setAuthNeeded(true); setApiStatus('Sign in required'); return; }
      if (!response.ok) throw new Error('Request update failed');
    } catch { toast('MongoDB is unavailable. Request status was not changed.'); return; }
    const next = requests.map(r => r._id === row._id ? { ...r, status } : r); setRequests(next);
    setStats(s => ({ ...s, openRequests: Math.max(0, s.openRequests + (['Open', 'In progress'].includes(row.status) && !['Open', 'In progress'].includes(status) ? -1 : !['Open', 'In progress'].includes(row.status) && ['Open', 'In progress'].includes(status) ? 1 : 0)) }));
  }

  async function deleteRecord(resource, row) {
    const label = resource === 'donors' ? row.name : resource === 'requests' ? row.patient : row.title;
    if (!window.confirm(`Delete “${label || 'this record'}” permanently? This cannot be undone.`)) return;
    const token = sessionStorage.getItem('pn_token');
    try {
      const response = await fetch(`/api/${resource}/${row._id}`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const result = await response.json().catch(() => ({}));
      if (response.status === 401) {
        sessionStorage.removeItem('pn_token'); setAuthNeeded(true); setApiStatus('Sign in required');
        toast('Sign in again before deleting records'); return;
      }
      if (!response.ok) throw new Error(result.error || 'Delete failed');
      if (resource === 'donors') {
        setDonors(current => current.filter(item => item._id !== row._id));
        setStats(current => ({ ...current, totalDonors: Math.max(0, current.totalDonors - 1), activeDonors: Math.max(0, current.activeDonors - Number(row.available)), bloodGroups: current.bloodGroups.map(item => item.group === row.bloodGroup ? { ...item, count: Math.max(0, item.count - 1) } : item) }));
      } else if (resource === 'requests') {
        setRequests(current => current.filter(item => item._id !== row._id));
        if (['Open', 'In progress'].includes(row.status)) setStats(current => ({ ...current, openRequests: Math.max(0, current.openRequests - 1) }));
      } else {
        setEvents(current => current.filter(item => item._id !== row._id));
        if (new Date(row.date) >= new Date()) setStats(current => ({ ...current, events: Math.max(0, current.events - 1) }));
      }
      toast('Record deleted');
    } catch (error) { toast(error.message || 'Could not delete this record'); }
  }

  const openCreate = (type) => setModal(type);
  const go = (id) => {
    if (id === 'homepage' && !databaseConnected) { toast('Connect MongoDB to edit and publish homepage content.'); return; }
    if (id === 'homepage' && !sessionStorage.getItem('pn_token')) { setPage(id); setAuthNeeded(true); return; }
    setPage(id); setFilter('All'); setSearch(''); setMobileOpen(false);
  };

  async function saveHomepageContent(content) {
    const token = sessionStorage.getItem('pn_token');
    const response = await fetch('/api/homepage/content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(content),
    });
    const result = await response.json();
    if (response.status === 401) {
      sessionStorage.removeItem('pn_token'); setAuthNeeded(true); setApiStatus('Sign in required');
      throw new Error('Sign in again before publishing homepage content.');
    }
    if (!response.ok) throw new Error(result.error || 'Could not publish homepage content.');
    setHomepageContent(result);
    toast('Homepage published');
  }

  return <div className="app-shell">
    <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
      <a className="brand" href="/">
        <span className="brand-mark"><img src="/images/poongurichi-logo.jpeg" alt="" /></span>
        <span className="brand-text"><b>Poongurichi</b><small>NANBARGAL BLOOD NETWORK</small></span>
      </a>
      <a className="public-site-link" href="/">↗ &nbsp;Open the public website</a>
      <div className="workspace-label">WORKSPACE</div>
      <nav className="main-nav" aria-label="Main navigation">{navigation.map(item => <button key={item.id} className={`nav-link ${page === item.id ? 'active' : ''}`} onClick={() => go(item.id)}><Icon name={item.icon} /><span>{item.label}</span>{item.badge && <em>{stats.openRequests}</em>}</button>)}</nav>
      <div className="sidebar-rule" />
      <div className="workspace-label">YOUR CLUB</div>
      <button className={`nav-link ${page === 'about' ? 'active' : ''}`} onClick={() => go('about')}><span className="nav-initial">PN</span><span>About the club</span></button>
      <div className="sidebar-spacer" />
      <div className="support-card"><div className="support-icon"><Icon name="heart" /></div><b>Every drop counts.</b><span>Help someone get a second chance today.</span><button onClick={() => openCreate('donor')}>Become a donor <Icon name="arrow" size={15} /></button></div>
      <div className="profile-row"><div className="avatar avatar-red">PN</div><div className="profile-copy"><b>Club coordinator</b><span>Poongurichi Nanbargal</span></div><Icon name="more" /></div>
    </aside>

    <main className="main-panel">
      <header className="topbar">
        <button className="mobile-menu" aria-label="Open navigation" onClick={() => setMobileOpen(v => !v)}><Icon name={mobileOpen ? 'close' : 'menu'} /></button>
        <div className="breadcrumb"><span>Blood Network</span><Icon name="chevron" size={14}/><b>{navigation.find(n => n.id === page)?.label || 'About the club'}</b></div>
        <div className="top-actions">
          <label className="top-search"><Icon name="search" size={17}/><input aria-label="Search" placeholder="Search donors, requests…" value={search} onChange={e => setSearch(e.target.value)} /><kbd>⌘ K</kbd></label>
          <span className={`connection-pill ${apiStatus === 'MongoDB connected' ? 'connected' : ''}`}><i />{apiStatus}</span>
          {apiStatus === 'MongoDB connected' && <button className="signout-button" onClick={() => { sessionStorage.removeItem('pn_token'); setAuthNeeded(true); setApiStatus('Sign in required'); }}>Sign out</button>}
          <button className="icon-button notification" aria-label="Notifications" onClick={() => toast(`${stats.openRequests} requests need follow-up`)}><Icon name="bell"/><span>{stats.openRequests}</span></button>
          <div className="avatar avatar-red admin-avatar">PN</div>
        </div>
      </header>

      <div className="content-area">
        {page === 'overview' && <Overview stats={stats} requests={requests} onGo={go} onCreate={openCreate} />}
        {page === 'donors' && <DonorDirectory donors={filteredDonors} stats={stats} filter={filter} setFilter={setFilter} onCreate={() => openCreate('donor')} onDelete={row => deleteRecord('donors', row)} />}
        {page === 'requests' && <RequestDesk requests={filteredRequests} filter={filter} setFilter={setFilter} onCreate={() => openCreate('request')} onUpdate={updateRequest} onDelete={row => deleteRecord('requests', row)} />}
        {page === 'events' && <Events events={filteredEvents} onCreate={() => openCreate('event')} onEdit={event => setModal({ type: 'event-edit', event })} onDelete={row => deleteRecord('events', row)} />}
        {page === 'community' && <Community stats={stats} content={homepageContent} donors={donors} />}
        {page === 'homepage' && <HomepageEditor content={homepageContent} onSave={saveHomepageContent} />}
        {page === 'about' && <About stats={stats} content={homepageContent} />}
        <footer className="page-footer"><span>© 2026 Poongurichi Nanbargal Donor’s Club · Unit of Poongurichi Nanbargal, Modakkurichi</span><span>One donation. Many lives.</span></footer>
      </div>
    </main>
    {modal && <FormModal type={typeof modal === 'string' ? modal : modal.type} initialData={typeof modal === 'string' ? null : modal.event} onClose={() => setModal(null)} onSave={saveRecord} />}
    {authNeeded && <AdminLogin configured={authConfigured} onSuccess={async token => {
      sessionStorage.setItem('pn_token', token); setAuthNeeded(false); setApiStatus('MongoDB connected');
      const headers = { Authorization: `Bearer ${token}` };
      try { const responses = await Promise.all(['/api/dashboard', '/api/donors', '/api/requests', '/api/events', '/api/homepage/content'].map(url => fetch(url, { headers }))); if (responses.some(r => !r.ok)) throw new Error('Could not load CRM records'); const [s,d,r,e,content] = await Promise.all(responses.map(response => response.json())); setStats(s); setDonors(d); setRequests(r); setEvents(e); setHomepageContent(content); } catch { toast('Signed in, but records could not be loaded'); }
    }} />}
    {notice && <div className="toast"><span><Icon name="check" size={16}/></span>{notice}</div>}
  </div>;
}

function HomepageEditor({ content, onSave }) {
  const [draft, setDraft] = useState(content ? withCommunityImageSlots(content) : content);
  const [language, setLanguage] = useState('en');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => { if (content) setDraft(withCommunityImageSlots(JSON.parse(JSON.stringify(content)))); }, [content]);
  if (!draft) return <section className="panel"><h2>Homepage content</h2><p>Loading saved homepage content…</p></section>;
  const translations = draft.translations?.[language] || {};
  const entries = Object.entries(translations).filter(([key, value]) => `${key} ${value}`.toLowerCase().includes(search.toLowerCase()));
  const update = (path, value) => setDraft(current => {
    const next = { ...current };
    let cursor = next;
    path.slice(0, -1).forEach(key => { cursor[key] = Array.isArray(cursor[key]) ? [...cursor[key]] : { ...(cursor[key] || {}) }; cursor = cursor[key]; });
    cursor[path[path.length - 1]] = value;
    return next;
  });
  const label = value => value.replace(/([A-Z])/g, ' $1').replace(/^./, char => char.toUpperCase());

  return <>
    <div className="page-intro"><div><div className="eyebrow">LIVE PUBLIC WEBSITE</div><h1>Homepage content</h1><p>Edit every section in English and Tamil, update its images and club figures, then publish the changes to the public site.</p></div><button className="button button-dark" disabled={saving} onClick={async () => { setSaving(true); setMessage(''); try { await onSave(draft); setMessage('Changes saved to MongoDB and published.'); } catch (error) { setMessage(error.message); } finally { setSaving(false); } }}><Icon name="check" size={16}/>{saving ? 'Publishing…' : 'Publish changes'}</button></div>
    <section className="panel homepage-editor-panel">
      <div className="panel-head"><div><div className="eyebrow">BILINGUAL COPY</div><h3>Edit website text</h3><p>Changes appear on the public page after publishing.</p></div><div className="language-switch crm-language-tabs"><button className={language === 'en' ? 'active' : ''} onClick={() => setLanguage('en')}>English</button><button className={language === 'ta' ? 'active' : ''} onClick={() => setLanguage('ta')}>தமிழ்</button></div></div>
      <label className="field homepage-search"><span>Find a content field</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search headings, buttons, section text…" /></label>
      <div className="homepage-content-fields">{entries.map(([key, value]) => <label className="field" key={key}><span>{label(key)}</span>{String(value).length > 90 ? <textarea rows="3" value={value} onChange={event => update(['translations', language, key], event.target.value)} /> : <input value={value} onChange={event => update(['translations', language, key], event.target.value)} />}</label>)}</div>
    </section>

    <div className="homepage-admin-grid">
      <section className="panel"><div className="panel-head"><div><div className="eyebrow">LIVE FIGURES</div><h3>Community totals</h3></div></div><div className="homepage-content-fields">{Object.entries(draft.stats || {}).map(([key, value]) => <label className="field" key={key}><span>{label(key)}</span><input type="number" min="0" value={value} onChange={event => update(['stats', key], Number(event.target.value))} /></label>)}</div></section>
      <section className="panel"><div className="panel-head"><div><div className="eyebrow">DIRECTORY FILTERS</div><h3>Blood group totals</h3><p>Updated from registered donors when available.</p></div></div><div className="homepage-content-fields group-count-fields">{(draft.groupCounts || []).map((item, index) => <label className="field" key={item.group}><span>{item.group}</span><input type="number" min="0" value={item.count} onChange={event => update(['groupCounts', index, 'count'], Number(event.target.value))} /></label>)}</div></section>
    </div>

    <section className="panel"><div className="panel-head"><div><div className="eyebrow">SECTION VISIBILITY</div><h3>Show or hide homepage sections</h3></div></div><div className="homepage-switches">{Object.entries(draft.sections || {}).map(([key, value]) => <label key={key}><input type="checkbox" checked={Boolean(value)} onChange={event => update(['sections', key], event.target.checked)} /><span>{label(key)}</span></label>)}</div></section>

    <div className="homepage-admin-grid">
      <section className="panel"><div className="panel-head"><div><div className="eyebrow">IMAGES</div><h3>Homepage and community gallery</h3><p>Upload different photos for the community gallery and events. Images are stored in MongoDB and displayed on the public homepage after publishing.</p></div></div><div className="homepage-content-fields">{Object.entries(draft.images || {}).map(([key, value]) => <Field label={label(key)} key={key}><MediaImageField value={value} onChange={next => update(['images', key], next)} /></Field>)}</div></section>
      <section className="panel"><div className="panel-head"><div><div className="eyebrow">CLUB DETAILS</div><h3>Brand and contacts</h3></div></div><div className="homepage-row-fields"><label className="field"><span>Club name</span><input value={draft.siteName || ""} onChange={event => update(["siteName"], event.target.value)} /></label><label className="field"><span>Club subtitle</span><input value={draft.siteSubtitle || ""} onChange={event => update(["siteSubtitle"], event.target.value)} /></label></div><label className="field"><span>Area / region</span><input value={draft.region || ""} onChange={event => update(["region"], event.target.value)} /></label><label className="field"><span>Primary phone</span><input value={draft.phone || ""} onChange={event => update(["phone"], event.target.value)} /></label>{(draft.contacts || []).map((item, index) => <div className="homepage-row-fields" key={`contact-${index}`}><label className="field"><span>Contact name</span><input value={item.name} onChange={event => update(["contacts", index, "name"], event.target.value)} /></label><label className="field"><span>Contact phone</span><input value={item.phone} onChange={event => update(["contacts", index, "phone"], event.target.value)} /></label></div>)}{(draft.socials || []).map((item, index) => <div className="homepage-row-fields" key={`social-${index}`}><label className="field"><span>Social name</span><input value={item.name} onChange={event => update(["socials", index, "name"], event.target.value)} /></label><label className="field"><span>Social URL</span><input value={item.url} onChange={event => update(["socials", index, "url"], event.target.value)} /></label></div>)}<div className="homepage-row-fields"><label className="field"><span>Developer credit</span><input value={draft.developerName || ""} onChange={event => update(["developerName"], event.target.value)} /></label><label className="field"><span>Developer phone</span><input value={draft.developerPhone || ""} onChange={event => update(["developerPhone"], event.target.value)} /></label></div></section>
    </div>
    {message && <p className="homepage-save-message" role="status">{message}</p>}
  </>;
}

function SectionHeader({ eyebrow, title, subtitle, action, onAction }) { return <div className="section-heading"><div><div className="eyebrow">{eyebrow}</div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action && <button className="button button-outline" onClick={onAction}>{action}<Icon name="arrow" size={15}/></button>}</div>; }

function Overview({ stats, requests, onGo, onCreate }) {
  const [period, setPeriod] = useState('This month');
  const latest = requests.slice(0, 4);
  return <>
    <div className="welcome-row"><div><p className="welcome-date">{dateText(new Date(), { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()} <span>·</span> MODAKKURICHI</p><h1>Good morning, <span>coordinator</span></h1><p className="welcome-sub">Here’s what’s happening across your donor community today.</p></div><button className="button button-dark" onClick={() => onCreate('request')}><Icon name="plus" size={17}/> New blood request</button></div>
    <section className="hero-banner">
      <div className="hero-copy"><span className="hero-kicker"><i/> COMMUNITY BLOOD NETWORK</span><h2>Give blood.<br/><span>Give hope.</span></h2><p>One donation can become someone's second chance. Find a donor, become a donor, or raise a blood request in seconds.</p><div className="hero-actions"><button className="button button-white" onClick={() => onGo('donors')}><Icon name="search" size={16}/> Find a donor <Icon name="arrow" size={15}/></button><button className="hero-text-link" onClick={() => onCreate('donor')}>Become a donor <Icon name="arrow" size={14}/></button></div></div>
        <div className="hero-orbit orbit-one"/><div className="hero-orbit orbit-two"/><div className="hero-art"><div className="crm-hero-ring"/><img className="crm-hero-photo" src="/images/community-donor.jpg" alt="Poongurichi Nanbargal community donor"/><img className="crm-drop-illustration" src="/images/drop-illustration.svg" alt=""/><div className="hero-art-note"><span>{stats.totalDonors}</span><small>registered donors<br/>in our community</small></div><div className="hero-mark">PN</div></div>
      <div className="hero-watermark">LIFE<br/>IN EVERY<br/>DROP</div>
    </section>
    <section className="stats-grid">
      <Metric label="Registered donors" value={stats.totalDonors} change="Club total" caption="community members" icon="users" tint="plum" />
      <Metric label="Blood requests" value={stats.openRequests} change={stats.openRequests ? 'Follow up' : 'All clear'} caption="in the club network" icon="drop" tint="rose" />
      <Metric label="Camps & events" value={stats.events} change="Club calendar" caption="upcoming activities" icon="calendar" tint="amber" />
      <Metric label="Blood groups" value={8} change="A+ to O−" caption="all major groups" icon="heart" tint="green" />
    </section>
    <div className="overview-grid">
      <section className="panel blood-panel"><div className="panel-head"><div><div className="eyebrow">DONOR AVAILABILITY</div><h3>Blood group distribution</h3><p>Registered donors, by blood type</p></div><button className="button button-quiet" onClick={() => onGo('donors')}>View directory <Icon name="arrow" size={15}/></button></div>
        <div className="blood-grid">{stats.bloodGroups.map(({ group, count }) => <button className="blood-type" key={group} onClick={() => onGo('donors')}><span className="blood-type-top"><span className="group-dot">{group}</span><span className="blood-count">{count}<small>{count === 1 ? 'donor' : 'donors'}</small></span></span><span className="meter"><i style={{ width: `${Math.max(count / Math.max(...stats.bloodGroups.map(g => g.count), 1) * 100, count ? 12 : 0)}%` }}/></span></button>)}</div>
        <div className="blood-footnote"><span><i className="legend-dot"/> Active donor availability</span><span>{stats.totalDonors} total donors <b>·</b> Source: MongoDB</span></div>
      </section>
      <section className="panel availability-panel"><div className="panel-head"><div><div className="eyebrow">LIVE BLOOD NEED</div><h3>Community availability</h3></div><span className="live-tag"><i/> LIVE</span></div><div className="availability-visual"><div className="availability-ring"><div><b>{stats.activeDonors}</b><small>DONORS</small></div></div><div className="availability-copy"><strong>Community<br/>support is here.</strong><span>Find a nearby donor or add a new request to the network.</span></div></div><button className="button button-rose availability-btn" onClick={() => onGo('donors')}>Check availability <Icon name="arrow" size={16}/></button></section>
    </div>
    <section className="panel requests-panel"><div className="panel-head"><div><div className="eyebrow">NEEDS YOUR ATTENTION</div><h3>Recent blood requests</h3><p>Track urgent needs and coordinate donor follow-up.</p></div><button className="button button-quiet" onClick={() => onGo('requests')}>All requests <Icon name="arrow" size={15}/></button></div>
      {latest.length ? <RequestTable rows={latest} compact/> : <EmptyState icon="drop" title="No request details yet" text={`${stats.openRequests} blood requests were reported on the original club page. New records created here will appear in this list.`} action="Create a request" onAction={() => onCreate('request')}/>}
    </section>
    <section className="moment-banner"><div className="moment-icon"><Icon name="heart" size={22}/></div><div><span>OUR COMMUNITY</span><h3>Donors who make it possible</h3><p>One donation. Many lives. Together, we keep our community strong.</p></div><button className="button button-outline" onClick={() => onGo('community')}>Meet the community <Icon name="arrow" size={15}/></button><img className="community-photo" src="/images/community-donor.jpg" alt="Poongurichi Nanbargal donor" /></section>
  </>;
}

function Metric({ label, value, change, caption, icon, tint, trend }) { return <article className="metric-card"><div className={`metric-icon ${tint}`}><Icon name={icon} size={18}/></div><span className="metric-label">{label}</span><div className="metric-bottom"><strong>{value}</strong><span className={`metric-change ${trend === 'up' ? 'positive' : ''}`}>{trend === 'up' && <span>↗ </span>}{change}<small>{caption}</small></span></div></article>; }

function RequestTable({ rows, compact = false, onUpdate, onDelete }) {
  return <div className={`table-wrap ${compact ? 'compact-table' : ''}`}><table><thead><tr><th>REQUEST</th><th>BLOOD TYPE</th><th>HOSPITAL / LOCATION</th><th>URGENCY</th><th>STATUS</th>{onUpdate && <th>UPDATE</th>}{onDelete && <th>ACTIONS</th>}</tr></thead><tbody>{rows.map(r => <tr key={r._id}><td><div className="table-person"><span className="avatar avatar-soft">{(r.patient || 'P').slice(0, 1)}</span><span><b>{r.patient}</b><small>{dateText(r.requestedAt, { month: 'short', day: 'numeric', year: 'numeric' })} · {r.units || 1} unit</small></span></div></td><td><span className="table-blood">{r.bloodGroup}</span></td><td><span className="hospital-name">{r.hospital}</span></td><td><span className={`status-pill urgency-${(r.urgency || 'urgent').toLowerCase()}`}>{r.urgency || 'Urgent'}</span></td><td><span className={`status-pill status-${(r.status || 'open').toLowerCase().replace(' ', '-')}`}>{r.status || 'Open'}</span></td>{onUpdate && <td><select className="inline-select" value={r.status || 'Open'} onChange={e => onUpdate(r, e.target.value)} aria-label={`Update ${r.patient} request`}><option>Open</option><option>In progress</option><option>Fulfilled</option><option>Closed</option></select></td>}{onDelete && <td><button className="button button-delete table-delete-button" onClick={() => onDelete(r)} aria-label={`Delete request for ${r.patient}`} title="Delete request"><Icon name="trash" size={15}/></button></td>}</tr>)}</tbody></table></div>;
}

function DonorDirectory({ donors, stats, filter, setFilter, onCreate, onDelete }) {
  return <><div className="page-intro"><div><div className="eyebrow">YOUR PEOPLE, READY TO HELP</div><h1>Donor directory</h1><p>Find the right donor and keep your community connected.</p></div><button className="button button-dark" onClick={onCreate}><Icon name="plus" size={17}/> Add a donor</button></div>
    <section className="directory-summary"><div className="directory-number"><strong>{stats.totalDonors}</strong><span>registered donors</span></div><div className="summary-divider"/><div className="summary-message"><span className="summary-spark">✳</span><span>Blood group totals match the donor information available on the original club page. The source shares aggregate counts, not individual member details.</span></div></section>
    <div className="filter-row"><div className="filter-tabs"><button className={filter === 'All' ? 'selected' : ''} onClick={() => setFilter('All')}>All groups <span>{stats.totalDonors}</span></button>{GROUPS.map(group => <button key={group} className={filter === group ? 'selected' : ''} onClick={() => setFilter(group)}>{group}</button>)}</div><button className="filter-action"><Icon name="filter" size={16}/> Filters</button></div>
    <section className="panel directory-panel"><div className="panel-head"><div><div className="eyebrow">DONOR RECORDS</div><h3>Community members</h3></div><span className="small-counter">{donors.length} detailed records</span></div>
      {donors.length ? <div className="table-wrap"><table><thead><tr><th>DONOR</th><th>BLOOD TYPE</th><th>AREA</th><th>AVAILABILITY</th><th>REGISTERED</th><th>ACTIONS</th></tr></thead><tbody>{donors.map(d => <tr key={d._id}><td><div className="table-person"><span className="avatar avatar-soft">{d.name.slice(0, 1)}</span><span><b>{d.name}</b><small>{d.phone}</small></span></div></td><td><span className="table-blood">{d.bloodGroup}</span></td><td>{d.area}</td><td><span className={`status-pill ${d.available ? 'status-available' : 'status-unavailable'}`}><i/>{d.available ? 'Available' : 'Not available'}</span></td><td>{dateText(d.createdAt)}</td><td><button className="button button-delete table-delete-button" onClick={() => onDelete(d)} aria-label={`Delete ${d.name}`} title="Delete donor"><Icon name="trash" size={15}/></button></td></tr>)}</tbody></table></div> : <EmptyState icon="users" title="Your donor records will live here" text="The original club page shares aggregate blood group totals, not individual member profiles. Add a donor here to start your private MongoDB-backed CRM directory." action="Add the first donor" onAction={onCreate}/>}</section>
    <div className="group-summary-grid">{stats.bloodGroups.map(g => <div className="mini-group-card" key={g.group}><div className="mini-group-icon"><Icon name="drop" size={16}/></div><span>{g.group}</span><strong>{g.count}</strong><small>{g.count === 1 ? 'member' : 'members'}</small></div>)}</div>
  </>;
}

function RequestDesk({ requests, filter, setFilter, onCreate, onUpdate, onDelete }) {
  return <><div className="page-intro"><div><div className="eyebrow">COMMUNITY RESPONSE</div><h1>Blood requests</h1><p>Monitor incoming needs and follow each request through to fulfillment.</p></div><button className="button button-dark" onClick={onCreate}><Icon name="plus" size={17}/> New request</button></div>
    <div className="request-kpis"><div><span className="kpi-symbol red"><Icon name="activity"/></span><span><small>ACTIVE REQUESTS</small><b>{requests.filter(r => ['Open', 'In progress'].includes(r.status)).length}</b></span></div><div><span className="kpi-symbol green"><Icon name="check"/></span><span><small>FULFILLED</small><b>{requests.filter(r => r.status === 'Fulfilled').length}</b></span></div><div><span className="kpi-symbol orange"><Icon name="clock"/></span><span><small>AVERAGE RESPONSE</small><b>2.4 <small>hrs</small></b></span></div></div>
    <div className="filter-row"><div className="filter-tabs">{['All', 'Open', 'In progress', 'Fulfilled', 'Closed'].map(status => <button className={filter === status ? 'selected' : ''} key={status} onClick={() => setFilter(status)}>{status}</button>)}</div><button className="filter-action"><Icon name="filter" size={16}/> Filters</button></div>
    <section className="panel request-list-panel"><div className="panel-head"><div><div className="eyebrow">REQUEST QUEUE</div><h3>Request activity</h3></div><span className="small-counter">{requests.length} records</span></div>{requests.length ? <RequestTable rows={requests} onUpdate={onUpdate} onDelete={onDelete}/> : <EmptyState icon="drop" title="No request records yet" text="Create a request to start tracking blood needs, matching donors and response status." action="Create a request" onAction={onCreate}/>}</section>
  </>;
}

function Events({ events, onCreate, onEdit, onDelete }) {
  return <><div className="page-intro"><div><div className="eyebrow">BRINGING DONORS TOGETHER</div><h1>Camps & events</h1><p>Plan drives, share activities and bring new donors into the club.</p></div><button className="button button-dark" onClick={onCreate}><Icon name="plus" size={17}/> Add an event</button></div>
    <section className="event-callout"><div className="event-callout-icon"><Icon name="calendar" size={25}/></div><div><div className="eyebrow">MAKE THE NEXT CONNECTION</div><h2>Every camp begins with a conversation.</h2><p>Set a date and location for the next donor drive or community activity.</p></div><button className="button button-white" onClick={onCreate}>Plan an event <Icon name="arrow" size={15}/></button></section>
    <section className="panel event-list"><div className="panel-head"><div><div className="eyebrow">CLUB CALENDAR</div><h3>Upcoming activities</h3></div><span className="small-counter">{events.length} planned</span></div>{events.length ? <div className="event-grid">{events.map(e => <article className="event-card" key={e._id}>{e.image && <img className="crm-event-image" src={e.image} alt={e.title}/>}<span className="event-date"><b>{dateText(e.date, { day: '2-digit' })}</b><small>{dateText(e.date, { month: 'short' }).toUpperCase()}</small></span><div className="event-card-content"><span className="status-pill status-open">{e.status || 'Planning'}</span><h4>{e.title}</h4><p><Icon name="pin" size={14}/>{e.location}</p>{e.description && <small>{e.description}</small>}</div><div className="event-card-actions"><button className="button button-outline event-edit-button" onClick={() => onEdit(e)}>Edit</button><button className="button button-delete event-delete-button" onClick={() => onDelete(e)} aria-label={`Delete ${e.title}`} title="Delete event"><Icon name="trash" size={15}/></button></div></article>)}</div> : <EmptyState icon="calendar" title="No upcoming camps yet" text="Create the first event to feature it on the public homepage." action="Plan an event" onAction={onCreate}/>}</section>
  </>;
}

function Community({ stats, content, donors = [] }) {
  const copy = content?.translations?.en || {};
  const socials = content?.socials || [];
  const image = content?.images?.community || '/images/community-donor.jpg';
  const featured = donors.filter(donor => donor.available && donor.publicListing && donor.featured && donor.publicPhotoConsent && donor.photo);
  return <><div className="page-intro"><div><div className="eyebrow">{copy.quickKicker}</div><h1>{copy.community}</h1><p>{copy.clubCopy}</p></div></div><section className="community-hero"><img src={image} alt={copy.heroIllustrationAlt || copy.community}/><div><span className="hero-kicker light-kicker">{copy.firstDonor}</span><h2>{copy.clubTitle1}<br/>{copy.clubTitle2}</h2><p>{copy.clubCopy}</p><div className="community-figure"><b>{stats.totalDonors}</b><span>{copy.registered}<br/>{copy.community}</span></div></div></section><div className="community-info-grid"><section className="panel info-panel"><div className="eyebrow">{copy.social}</div><h3>{copy.contacts}</h3><p>{copy.footerLine1}</p><div className="social-list">{socials.map((item, index) => <a key={`${item.name}-${index}`} href={item.url} target="_blank" rel="noreferrer"><span>{item.name}</span><Icon name="external" size={15}/></a>)}</div></section><section className="panel info-panel"><div className="eyebrow">{copy.campsName}</div><h3>{content?.siteName}</h3><p>{copy.clubCopy}</p><div className="club-stat-row"><span><b>{stats.totalDonors}</b><small>{copy.statDonors}</small></span><span><b>{stats.bloodGroups?.length || 0}</b><small>{copy.statGroups}</small></span><span><b>{stats.events}</b><small>{copy.statCamps}</small></span></div></section></div><section className="panel donors-photo-panel"><div className="panel-head"><div><div className="eyebrow">{copy.firstDonor}</div><h3>{copy.communityDonorTitle}</h3><p>{copy.communityDonorCopy}</p></div></div>{featured.length ? <div className="crm-featured-donor-grid">{featured.map(donor => <article className="crm-featured-donor-card" key={donor._id}><img src={donor.photo} alt={donor.name}/><div><span>{donor.bloodGroup} · {donor.area}</span><h3>{donor.name}</h3></div></article>)}</div> : <EmptyState icon="heart" title="No donor stories featured yet" text="Add a donor portrait and record their permission in the donor form. The public homepage will showcase opted-in stories."/>}</section></>;
}

function About({ stats, content }) {
  const copy = content?.translations?.en || {};
  const contacts = content?.contacts || [];
  return <><div className="page-intro"><div><div className="eyebrow">{copy.clubKicker}</div><h1>{content?.siteName}</h1><p>{content?.siteSubtitle} · {content?.region}</p></div></div><section className="about-hero"><div className="about-logo"><img src={content?.images?.logo || '/images/poongurichi-logo.jpeg'} alt={content?.siteName}/></div><div><span className="eyebrow">{copy.heroEyebrow}</span><h2>{copy.clubTitle1}<br/><span>{copy.clubTitle2}</span></h2><p>{copy.clubCopy}</p><div className="about-values"><span><Icon name="heart" size={16}/> {copy.promise}</span><span><Icon name="activity" size={16}/> {copy.supportHours}</span><span><Icon name="users" size={16}/> {stats.totalDonors} {copy.registered}</span></div></div></section><section className="panel contact-panel"><div><div className="eyebrow">{copy.urgentKicker}</div><h3>{copy.contacts}</h3><p>{copy.footerLine1}</p></div><div className="contact-actions">{contacts.map((person, index) => <a key={`${person.phone}-${index}`} className="contact-person" href={`tel:${person.phone}`}><span className="contact-avatar">{person.name.slice(0,1)}</span><span><b>{person.name}</b><small><Icon name="phone" size={12}/> {person.phone}</small></span></a>)}</div></section><div className="developer-note">{copy.developer} <b>{content?.developerName}</b> · <a href={`tel:${content?.developerPhone}`}>{content?.developerPhone}</a></div></>;
}

function EmptyState({ icon, title, text, action, onAction }) { return <div className="empty-state"><div className="empty-icon"><Icon name={icon} size={21}/></div><h4>{title}</h4><p>{text}</p>{action && <button className="button button-outline" onClick={onAction}>{action}<Icon name="arrow" size={15}/></button>}</div>; }

function FormModal({ type, initialData, onClose, onSave }) {
  const isDonor = type === 'donor'; const isRequest = type === 'request'; const isEventEdit = type === 'event-edit';
  const title = isDonor ? 'Add a donor' : isRequest ? 'Create a blood request' : isEventEdit ? 'Edit community event' : 'Plan a community event';
  const [image, setImage] = useState(initialData?.image || '');
  const [uploading, setUploading] = useState(false);
  function submit(e) {
    e.preventDefault(); const values = Object.fromEntries(new FormData(e.currentTarget));
    if (isDonor) onSave('donor', { name: values.name.trim(), phone: values.phone.trim(), bloodGroup: values.bloodGroup, area: values.area.trim() || 'Modakkurichi', available: values.available === 'on', publicListing: values.publicListing === 'on', photo: values.publicPhotoConsent === 'on' ? image : '', publicPhotoConsent: values.publicPhotoConsent === 'on' && Boolean(image), featured: values.featured === 'on' && values.publicListing === 'on' && values.publicPhotoConsent === 'on' && Boolean(image) });
    else if (isRequest) onSave('request', { patient: values.patient.trim(), bloodGroup: values.bloodGroup, units: Number(values.units), hospital: values.hospital.trim(), contact: values.contact.trim(), urgency: values.urgency, status: 'Open' });
    else onSave(isEventEdit ? 'event-edit' : 'event', { title: values.title.trim(), date: values.date, location: values.location.trim(), description: values.description.trim(), image, status: values.status || 'Upcoming' }, initialData?._id);
  }
  return <div className="modal-scrim" onMouseDown={e => e.target === e.currentTarget && onClose()}><form className="modal-card" onSubmit={submit}><div className="modal-top"><div><div className="eyebrow">{isDonor ? 'GROW YOUR DONOR NETWORK' : isRequest ? 'COORDINATE A RESPONSE' : 'BRING THE COMMUNITY TOGETHER'}</div><h2>{title}</h2></div><button className="icon-button" type="button" aria-label="Close modal" onClick={onClose}><Icon name="close"/></button></div><p className="modal-lead">{isDonor ? 'Save a new member in the club directory.' : isRequest ? 'Add the details needed to match a community donor.' : 'Add a camp or activity to the community calendar.'}</p>
    {isDonor && <><Field label="Donor name"><input name="name" required placeholder="Full name" autoFocus/></Field><div className="form-row"><Field label="Phone number"><input name="phone" type="tel" required placeholder="Mobile number"/></Field><Field label="Blood group"><select name="bloodGroup" required defaultValue=""><option value="" disabled>Select group</option>{GROUPS.map(g => <option key={g}>{g}</option>)}</select></Field></div><Field label="Area"><input name="area" placeholder="Modakkurichi"/></Field><label className="availability-toggle"><input name="available" type="checkbox" defaultChecked/><span className="toggle-mark"/><span><b>Available to donate</b><small>Show this member as available in your directory.</small></span></label><label className="availability-toggle"><input name="publicListing" type="checkbox"/><span className="toggle-mark"/><span><b>Show in public donor community</b><small>Enable only after the donor agrees to share their details publicly.</small></span></label><Field label="Donor portrait"><MediaImageField value={image} onChange={setImage} uploading={uploading} setUploading={setUploading}/></Field>{image && <label className="availability-toggle"><input name="publicPhotoConsent" type="checkbox"/><span className="toggle-mark"/><span><b>Photo sharing permission</b><small>The donor has specifically agreed to show this image on the public homepage.</small></span></label>}<label className="availability-toggle"><input name="featured" type="checkbox"/><span className="toggle-mark"/><span><b>Feature in donor showcase</b><small>Requires public listing, an uploaded portrait and photo permission.</small></span></label></>}
    {isRequest && <><Field label="Patient / request reference"><input name="patient" required placeholder="Patient name or reference" autoFocus/></Field><div className="form-row"><Field label="Blood group needed"><select name="bloodGroup" required defaultValue=""><option value="" disabled>Select group</option>{GROUPS.map(g => <option key={g}>{g}</option>)}</select></Field><Field label="Units required"><input name="units" type="number" min="1" max="20" defaultValue="1" required/></Field></div><Field label="Hospital / location"><input name="hospital" required placeholder="Hospital or area"/></Field><div className="form-row"><Field label="Contact number"><input name="contact" type="tel" required placeholder="Contact phone"/></Field><Field label="Urgency"><select name="urgency" defaultValue="Urgent"><option>Critical</option><option>Urgent</option><option>Routine</option></select></Field></div></>}
    {!isDonor && !isRequest && <><Field label="Event name"><input name="title" required placeholder="e.g. Community blood drive" defaultValue={initialData?.title || ''} autoFocus/></Field><div className="form-row"><Field label="Date"><input name="date" type="date" required defaultValue={initialData?.date ? new Date(initialData.date).toISOString().slice(0, 10) : ''} min={isEventEdit ? undefined : new Date().toISOString().slice(0, 10)}/></Field><Field label="Location"><input name="location" required placeholder="Area or venue" defaultValue={initialData?.location || ''}/></Field></div><Field label="Description"><textarea name="description" rows="3" placeholder="A few details for the community" defaultValue={initialData?.description || ''}/></Field><Field label="Event poster or photo"><MediaImageField value={image} onChange={setImage} uploading={uploading} setUploading={setUploading}/></Field>{isEventEdit && <Field label="Status"><select name="status" defaultValue={initialData?.status || 'Upcoming'}><option>Upcoming</option><option>Planning</option><option>Completed</option><option>Cancelled</option></select></Field>}</>}
    <div className="modal-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button type="submit" disabled={uploading} className="button button-dark"><Icon name={isEventEdit ? 'check' : 'plus'} size={16}/>{uploading ? 'Uploading…' : isDonor ? 'Save donor' : isRequest ? 'Create request' : isEventEdit ? 'Save event' : 'Add event'}</button></div></form></div>;
}
function Field({ label, children }) { return <label className="field"><span>{label}</span>{children}</label>; }
function MediaImageField({ value, onChange, uploading, setUploading }) {
  const [error, setError] = useState('');
  const [localUploading, setLocalUploading] = useState(false);
  const isUploading = uploading ?? localUploading;
  const setBusy = setUploading || setLocalUploading;
  async function upload(event) {
    const file = event.target.files?.[0]; if (!file) return;
    setBusy(true); setError('');
    try {
      const body = new FormData(); body.append('image', file);
      const token = sessionStorage.getItem('pn_token');
      const response = await fetch('/api/media', { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Image upload failed.');
      onChange(result.url);
    } catch (uploadError) { setError(uploadError.message || 'Image upload failed.'); }
    finally { setBusy(false); event.target.value = ''; }
  }
  return <div className="crm-image-upload">{value && <img src={value} alt="Uploaded image preview"/>}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={upload} disabled={isUploading}/><input aria-label="Image URL" value={value || ''} onChange={event => onChange(event.target.value)} placeholder="Or paste an image URL"/><small>{isUploading ? 'Uploading & compressing image…' : 'JPG, PNG, WebP · Auto-compressed for crisp quality & fast loading'}</small>{error && <small className="form-error">{error}</small>}</div>;
}

function AdminLogin({ configured, onSuccess }) {
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError('');
    try { const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ passcode: new FormData(e.currentTarget).get('passcode') }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Could not sign in'); await onSuccess(data.token); }
    catch (err) { setError(err.message || 'Could not sign in'); }
    finally { setBusy(false); }
  }
  return <div className="modal-scrim auth-scrim"><form className="modal-card auth-card" onSubmit={submit}><div className="auth-mark"><img src="/images/poongurichi-logo.jpeg" alt=""/></div><div className="eyebrow">CLUB COORDINATOR ACCESS</div><h2>Sign in to your CRM</h2><p className="modal-lead">Donor profiles and blood request details are private to the club team.</p>{!configured && <div className="auth-config-note">Set <code>ADMIN_PASSCODE</code> in your server’s <code>.env</code> file before signing in.</div>}<Field label="Coordinator passcode"><input name="passcode" type="password" autoComplete="current-password" required autoFocus placeholder="Enter your passcode"/></Field>{error && <p className="form-error">{error}</p>}<button className="button button-dark auth-submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in securely'}<Icon name="arrow" size={15}/></button><small className="auth-expiry">Your session expires after 8 hours.</small></form></div>;
}
