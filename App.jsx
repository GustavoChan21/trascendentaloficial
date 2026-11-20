import React, { useEffect, useMemo, useRef, useState } from 'react'
import { supabase, hasCloud, loadSite, saveSite, loadBookings, setBookingStatus, checkAvailability, createBookingCloud, registerProofCloud } from './supabase.js'

const STORAGE_KEY = 'guiaTuristicoCMS.v1'
const BOOKINGS_KEY = 'guiaTuristicoBookings.v1'
const CONTENT_DEFAULT = { experiencesTitle:'Experiencias para recordar', experiencesSubtitle:'Rutas seleccionadas, historias auténticas y encuentros que se quedan contigo.', stepsTitle:'Tu próxima aventura, sin complicaciones', contactTitle:'Cada viaje merece una historia extraordinaria', contactDescription:'Diseñamos juntos una experiencia privada, a tu ritmo y con atención personal.', trustLine:'Experiencias locales · Grupos reducidos · Atención personalizada', footerNote:'Explora más allá de lo esperado', heroPrimaryCTA:'Explorar experiencias', heroSecondaryCTA:'Hablar por WhatsApp', contactCTA:'Cotizar experiencia', experiencesEyebrow:'DESTINOS & EXPERIENCIAS', steps:[{title:'Elige tu aventura',text:'Selecciona fecha y número de viajeros para consultar disponibilidad.'},{title:'Aparta tus lugares',text:'Recibe tu folio y la información bancaria para el anticipo.'},{title:'Envía tu comprobante',text:'Comparte la referencia y envía el comprobante por WhatsApp.'},{title:'Prepara tu viaje',text:'Nuestro equipo valida el pago y confirma los últimos detalles.'}] }
function currentSection(){return /\/admin(?:\/|$)/.test(window.location.pathname)?'admin':'public'}
function goSection(section){const root=import.meta.env.BASE_URL.replace(/\/$/,''); window.history.pushState({},'',root+'/'+section);window.dispatchEvent(new PopStateEvent('popstate'));window.scrollTo(0,0)}

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
const money = (value, currency = 'MXN') => new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(Number(value || 0))
const dt = value => new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
const todayISO = () => new Date().toISOString().slice(0, 10)

const initialConfig = {
  brand: {
    name: 'Trascendental Oficial',
    tagline: 'Experiencias que trascienden cada destino.',
    description: 'Explora cultura, naturaleza e historia con experiencias guiadas y atención personalizada.',
    heroImage: 'https://images.unsplash.com/photo-1518638150340-f706e86654de?auto=format&fit=crop&w=1800&q=80',
    logoText: 'TO',
    city: 'Campeche, México',
    phone: '+52 999 000 0000',
    whatsapp: '529990000000',
    email: 'hola@caminomayatours.mx',
    primaryColor: '#18392b',
    accentColor: '#d59d55'
  },
  links: [
    { id: uid(), label: 'WhatsApp', url: 'https://wa.me/529990000000', active: true },
    { id: uid(), label: 'Instagram', url: 'https://instagram.com/', active: true },
    { id: uid(), label: 'Facebook', url: 'https://facebook.com/', active: true }
  ],
  services: [
    {
      id: 'tour-centro-historico',
      name: 'Centro histórico y leyendas',
      category: 'Recorrido guiado',
      short: 'Arquitectura, historias locales y rincones emblemáticos en un paseo guiado.',
      image: 'https://images.unsplash.com/photo-1568402102990-bc541580b59f?auto=format&fit=crop&w=1000&q=80',
      duration: '2 horas',
      price: 650,
      currency: 'MXN',
      capacity: 12,
      depositPercent: 40,
      active: true,
      highlights: 'Guía local · Paradas fotográficas · Recomendaciones gastronómicas'
    },
    {
      id: 'ruta-arqueologica',
      name: 'Ruta arqueológica privada',
      category: 'Experiencia privada',
      short: 'Traslado coordinado y recorrido interpretativo para grupos pequeños.',
      image: 'https://images.unsplash.com/photo-1561571994-3c61c5541815?auto=format&fit=crop&w=1000&q=80',
      duration: '6 horas',
      price: 2100,
      currency: 'MXN',
      capacity: 8,
      depositPercent: 50,
      active: true,
      highlights: 'Privado · Horario flexible · Asistencia antes del viaje'
    },
    {
      id: 'asesoria-viajero',
      name: 'Asesoría de itinerario',
      category: 'Servicio',
      short: 'Diseño personalizado de ruta, tiempos, restaurantes y recomendaciones.',
      image: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1000&q=80',
      duration: '60 min',
      price: 450,
      currency: 'MXN',
      capacity: 1,
      depositPercent: 100,
      active: true,
      highlights: 'Videollamada · PDF de recomendaciones · Ruta personalizada'
    }
  ],
  transfer: {
    enabled: true,
    bank: 'BBVA',
    beneficiary: 'Nombre del guía o empresa',
    clabe: '012 345 678901234567',
    account: '1234567890',
    holdHours: 2,
    referencePrefix: 'GUIA',
    instructions: 'Realiza la transferencia dentro de la vigencia indicada y envía el comprobante por WhatsApp. El lugar queda apartado temporalmente hasta validar el pago.'
  },
  content: CONTENT_DEFAULT,
  policies: {
    cancellation: 'Cancelación sin penalización hasta 48 horas antes. Después de ese plazo el anticipo no es reembolsable.',
    meetingPoint: 'El punto exacto de encuentro se confirma por WhatsApp al validar la reserva.'
  }
}

const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function Icon({ name, size = 18 }) {
  const paths = {
    menu: 'M4 6h16M4 12h16M4 18h16',
    close: 'M6 6l12 12M18 6L6 18',
    map: 'M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3zM9 3v15M15 6v15',
    clock: 'M12 8v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
    users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
    arrow: 'M5 12h14M13 6l6 6-6 6',
    check: 'M20 6L9 17l-5-5',
    card: 'M3 6h18v12H3zM3 10h18',
    calendar: 'M3 5h18v16H3zM7 3v4M17 3v4M3 9h18',
    settings: 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.1 2.1-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.02 1.56V20h-3v-.08A1.7 1.7 0 0 0 9.7 18.36a1.7 1.7 0 0 0-1.88.34l-.06.06-2.1-2.1.06-.06A1.7 1.7 0 0 0 6.06 15a1.7 1.7 0 0 0-1.56-1.02H4v-3h.08A1.7 1.7 0 0 0 5.64 9.9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.1-2.1.06.06a1.7 1.7 0 0 0 1.88.34A1.7 1.7 0 0 0 10.3 4.7V4h3v.08a1.7 1.7 0 0 0 1.02 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.1 2.1-.06.06a1.7 1.7 0 0 0-.34 1.88A1.7 1.7 0 0 0 19.5 10.3H20v3h-.08A1.7 1.7 0 0 0 19.4 15z',
    trash: 'M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 10v7M14 10v7',
    plus: 'M12 5v14M5 12h14',
    edit: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z',
    eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    upload: 'M12 16V4M7 9l5-5 5 5M4 16v4h16v-4',
    copy: 'M8 8h11v11H8zM5 16H4V5h11v1',
    external: 'M14 3h7v7M10 14L21 3M21 14v7H3V3h7'
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] || paths.check} /></svg>
}

export default function App() {
  const [config, setConfig] = useState(() => readJson(STORAGE_KEY, initialConfig))
  const [bookings, setBookings] = useState(() => hasCloud ? [] : readJson(BOOKINGS_KEY, []))
  const [view, setView] = useState(currentSection)
  useEffect(()=>{const change=()=>setView(currentSection());window.addEventListener('popstate',change);return ()=>window.removeEventListener('popstate',change)},[])
  const [bookingService, setBookingService] = useState(null)
  const [toast, setToast] = useState('')
  const [cloudReady, setCloudReady] = useState(!hasCloud)
  const [admin, setAdmin] = useState(false)
  const [authReady, setAuthReady] = useState(!hasCloud)
  const saved = useRef('')
  const [syncError, setSyncError] = useState('')

  useEffect(() => {
    if (!hasCloud) return
    let alive = true
    async function start() {
      try {
        const remote = await loadSite()
        if (!alive) return
        if (remote?.brand && Array.isArray(remote?.services)) {
          saved.current = JSON.stringify(remote)
          setConfig(remote)
        } else {
          saved.current = JSON.stringify(initialConfig)
          setConfig(initialConfig)
        }
        setCloudReady(true)
        const {data:{user}} = await supabase.auth.getUser()
        if (user) {
          const {data} = await supabase.from('admin_users').select('user_id').eq('user_id',user.id).maybeSingle()
          if (alive && data) { setAdmin(true); setBookings(await loadBookings()) }
        }
        if(alive) setAuthReady(true)
      } catch (err) {
        if (alive) { setSyncError(err.message); setCloudReady(true); setAuthReady(true) }
      }
    }
    start()
    const {data:{subscription}} = supabase.auth.onAuthStateChange(() => {
      // Login se procesa desde AdminLogin para evitar lecturas desordenadas.
    })
    return () => { alive=false;subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    if (!hasCloud || !admin || !cloudReady) return
    const signature = JSON.stringify(config)
    if(signature===saved.current) return
    const timer = setTimeout(async()=>{
      try { await saveSite(config); saved.current=signature; setSyncError('') }
      catch(e){ setSyncError('No se guardaron los cambios en Supabase: '+e.message) }
    },900)
    return ()=>clearTimeout(timer)
  }, [config,admin,cloudReady])
  useEffect(() => { if(!hasCloud) localStorage.setItem(BOOKINGS_KEY,JSON.stringify(bookings)) }, [bookings])
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 2600)
    return () => clearTimeout(timer)
  }, [toast])

  async function signedIn(){
    const {data:{user}}=await supabase.auth.getUser()
    if(!user) throw new Error('No se encontró la sesión')
    const {data,error}=await supabase.from('admin_users').select('user_id').eq('user_id',user.id).maybeSingle()
    if(error) throw error
    if(!data) {await supabase.auth.signOut();throw new Error('Tu usuario no tiene permisos de administrador')}
    setBookings(await loadBookings());setAdmin(true);setSyncError('')
  }
  async function signOut(){if(hasCloud)await supabase.auth.signOut();setAdmin(false);setBookings([]);goSection('public')}
  const cssVars = { '--primary': config.brand.primaryColor, '--accent': config.brand.accentColor }
  return <div style={cssVars}>
    {syncError && <div className="cloud-error" role="alert">{syncError}</div>}
    {!cloudReady || !authReady ? <div className="site-loader">Cargando sitio...</div> : view==='public' ? (
      <PublicSite config={config} bookings={bookings} onBook={setBookingService} />
    ) : hasCloud && !admin ? (
      <AdminLogin onSuccess={signedIn} onPublic={()=>goSection('public')} />
    ) : (
      <Admin config={config} setConfig={setConfig} bookings={bookings} setBookings={setBookings}
      onPublic={() => goSection('public')} onLogout={signOut} notify={setToast} />
    )}
    {bookingService && <BookingModal service={bookingService} config={config} bookings={bookings} setBookings={setBookings} onClose={() => setBookingService(null)} notify={setToast} />}
    {toast && <div className="toast"><Icon name="check" /> {toast}</div>}
  </div>
}

function AdminLogin({onSuccess,onPublic}){
  const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('')
  async function login(e){e.preventDefault();setBusy(true);setError('')
    try{const {error}=await supabase.auth.signInWithPassword({email,password});if(error)throw error;await onSuccess()}
    catch(e){setError(e.message)}finally{setBusy(false)}
  }
  return <div className="login-page"><form className="login-panel" onSubmit={login}>
    <span className="kicker">ACCESO PRIVADO</span><h1>Administración</h1><p>Inicia sesión con una cuenta autorizada en Supabase.</p>
    <Field label="Correo electrónico"><input type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)}/></Field>
    <Field label="Contraseña"><input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/></Field>
    {error && <p role="alert" className="login-error">{error}</p>}
    <button className="btn btn-primary btn-full" disabled={busy}>{busy?'Validando...':'Iniciar sesión'}</button>
    <button type="button" className="btn btn-ghost btn-full" onClick={onPublic}>Volver al sitio</button>
  </form></div>
}

function PublicSite({ config, bookings, onBook }) {
  const content = {...CONTENT_DEFAULT,...config.content}
  const activeServices = config.services.filter(s => s.active)
  return <main className="public-site">
    <header className="site-header">
      <a className="brand" href="#inicio"><span className="brand-mark">{config.brand.logoText}</span><span>{config.brand.name}</span></a>
      <nav className="nav-links"><a href="#experiencias">Experiencias</a><a href="#como-reservar">Cómo reservar</a><a href="#contacto">Contacto</a></nav>
      <a className="btn btn-outline-light btn-sm" href="#experiencias">Explorar experiencias <Icon name="arrow" size={15}/></a>
    </header>

    <section id="inicio" className="hero">
      <img src={config.brand.heroImage} alt="Destino turístico" className="hero-bg" />
      <div className="hero-overlay" />
      <div className="hero-content"><div className="hero-topline"><span className="hero-line"/> THE ART OF TRAVEL · EXPERIENCIAS CURADAS</div>
        <span className="eyebrow"><Icon name="map" /> {config.brand.city}</span>
        <h1>{config.brand.tagline}</h1>
        <p>{config.brand.description}</p>
        <div className="hero-actions"><a className="btn btn-primary" href="#experiencias">{content.heroPrimaryCTA} <Icon name="arrow" /></a><a className="btn btn-glass" href={`https://wa.me/${config.brand.whatsapp}`} target="_blank" rel="noreferrer">{content.heroSecondaryCTA}</a></div>
      </div>
      <div className="hero-statbar">
        <div><strong>{activeServices.length}</strong><span>experiencias activas</span></div>
        <div><strong>Auténtico</strong><span>{content.trustLine}</span></div>
        <div><strong>Seguro</strong><span>aparta con transferencia</span></div>
      </div>
    </section>

    <section id="experiencias" className="section wrap">
      <div className="section-head"><div><span className="kicker">{content.experiencesEyebrow}</span><h2>{content.experiencesTitle}</h2></div><p>{content.experiencesSubtitle}</p></div>
      <div className="cards-grid">
        {activeServices.map(service => <article className="service-card" key={service.id}>
          <div className="service-image-wrap"><img src={service.image} alt={service.name} className="service-image" /><span className="card-chip">{service.category}</span></div>
          <div className="service-body"><h3>{service.name}</h3><p>{service.short}</p><div className="meta-row"><span><Icon name="clock" />{service.duration}</span><span><Icon name="users" />Hasta {service.capacity}</span></div><div className="highlights">{service.highlights}</div><div className="card-footer"><div><small>Desde</small><strong>{money(service.price, service.currency)}</strong></div><button className="btn btn-dark" onClick={() => onBook(service)}>Reservar</button></div></div>
        </article>)}
      </div>
    </section>

    <section id="como-reservar" className="steps-section"><div className="wrap"><span className="kicker kicker-light">RESERVA SIN COMPLICACIONES</span><h2>{content.stepsTitle}</h2><div className="steps-grid">
      {(Array.isArray(content.steps)?content.steps:CONTENT_DEFAULT.steps).map((item,i)=><Step key={i} n={String(i+1).padStart(2,'0')} title={item.title} text={item.text}/>)}
    </div></div></section>

    <section id="contacto" className="section wrap contact-section"><div><span className="kicker">ATENCIÓN DIRECTA</span><h2>{content.contactTitle}</h2><p>{content.contactDescription}</p></div><a className="btn btn-primary" href={`https://wa.me/${config.brand.whatsapp}`} target="_blank" rel="noreferrer">{content.contactCTA} <Icon name="external" /></a></section>

    <section className="public-policy"><div className="wrap"><span className="kicker">ANTES DE TU VIAJE</span><h2>Información para una experiencia perfecta</h2><div className="public-policy-grid"><div><strong>Cancelaciones</strong><p>{config.policies?.cancellation}</p></div><div><strong>Punto de encuentro</strong><p>{config.policies?.meetingPoint}</p></div></div></div></section>

    <footer className="footer"><div className="wrap footer-inner"><div><div className="brand footer-brand"><span className="brand-mark">{config.brand.logoText}</span><span>{config.brand.name}</span></div><p>{content.footerNote} · {config.brand.city}</p></div><div className="footer-links">{config.links.filter(l => l.active).map(l => <a key={l.id} href={l.url} target="_blank" rel="noreferrer">{l.label}</a>)}</div><div className="footer-copy">© {new Date().getFullYear()} · Sitio administrable</div></div></footer>
  </main>
}

function Step({ n, title, text }) { return <div className="step"><span>{n}</span><h3>{title}</h3><p>{text}</p></div> }

function BookingModal({ service, config, bookings, setBookings, onClose, notify }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ date: todayISO(), time: '09:00', adults: 2, name: '', phone: '', email: '', notes: '' })
  const [created, setCreated] = useState(null)
  const [proofName, setProofName] = useState('')
  const [remoteSeats,setRemoteSeats]=useState(null)
  const [busy,setBusy]=useState(false)

  const activeSeats = useMemo(() => bookings.filter(b => b.serviceId === service.id && b.date === form.date && (b.status === 'confirmed' || (['awaiting_transfer','proof_uploaded'].includes(b.status) && new Date(b.expiresAt) > new Date()))).reduce((sum, b) => sum + Number(b.people || 0), 0), [bookings, service.id, form.date])
  const available = hasCloud ? (remoteSeats ?? 0) : Math.max(0, service.capacity - activeSeats)
  useEffect(()=>{if(!hasCloud)return;let mounted=true;setRemoteSeats(null);checkAvailability(service.id,form.date,form.time).then(n=>{if(mounted)setRemoteSeats(n)}).catch(e=>{if(mounted){setRemoteSeats(0);notify('No se pudo consultar disponibilidad: '+e.message)}});return()=>{mounted=false}},[service.id,form.date,form.time])
  const people = Math.max(1, Number(form.adults || 1))
  const total = service.price * people
  const deposit = Math.round(total * (service.depositPercent / 100) * 100) / 100

  async function createBooking() {
    if (!form.name.trim() || !form.phone.trim() || !form.email.trim()) return notify('Completa nombre, teléfono y correo.')
    if (people > available) return notify(`Sólo hay ${available} lugares disponibles.`)
    if(hasCloud){setBusy(true);try{const booking=await createBookingCloud(service,form);setCreated(booking);setBookings(prev=>[booking,...prev]);setRemoteSeats(n=>Math.max(0,(n||0)-people));setStep(3)}catch(e){notify('No se pudo reservar: '+e.message)}finally{setBusy(false)};return}
    const now = Date.now()
    const booking = {
      id: uid(),
      folio: `${config.transfer.referencePrefix}-${String(now).slice(-6)}`,
      serviceId: service.id,
      serviceName: service.name,
      date: form.date,
      time: form.time,
      people,
      customer: { name: form.name, phone: form.phone, email: form.email },
      notes: form.notes,
      total,
      deposit,
      currency: service.currency,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + config.transfer.holdHours * 60 * 60 * 1000).toISOString(),
      status: 'awaiting_transfer',
      proofName: ''
    }
    setBookings(prev => [booking, ...prev])
    setCreated(booking)
    setStep(3)
  }

  async function attachProof() {
    if (!proofName) return notify('Selecciona un comprobante primero.')
    if(hasCloud){setBusy(true);try{await registerProofCloud(created,proofName)}catch(e){notify(e.message);setBusy(false);return}finally{setBusy(false)}}
    const updated = { ...created, proofName, status: 'proof_uploaded' }
    setBookings(prev => prev.map(b => b.id === created.id ? updated : b))
    setCreated(updated)
    notify('Referencia registrada. Envía el archivo por WhatsApp para su validación.')
  }

  const expired = created && new Date(created.expiresAt) < new Date()

  return <div className="modal-backdrop" role="dialog" aria-modal="true"><div className="booking-modal"><button className="icon-btn close-btn" onClick={onClose}><Icon name="close" /></button>
    <div className="modal-service"><img src={service.image} alt=""/><div><span>{service.category}</span><h2>{service.name}</h2><p>{money(service.price, service.currency)} por persona · anticipo {service.depositPercent}%</p></div></div>
    <div className="stepper"><span className={step >= 1 ? 'active' : ''}>1. Fecha</span><i></i><span className={step >= 2 ? 'active' : ''}>2. Datos</span><i></i><span className={step >= 3 ? 'active' : ''}>3. Apartado</span></div>

    {step === 1 && <div className="modal-content"><h3>Selecciona fecha y cupo</h3><div className="form-grid"><Field label="Fecha"><input type="date" min={todayISO()} value={form.date} onChange={e => setForm({...form, date:e.target.value})}/></Field><Field label="Hora"><input type="time" value={form.time} onChange={e => setForm({...form, time:e.target.value})}/></Field><Field label="Personas"><input type="number" min="1" max={Math.max(1, available)} value={form.adults} onChange={e => setForm({...form, adults:e.target.value})}/></Field><div className="availability-box"><strong>{available}</strong><span>lugares disponibles</span></div></div><div className="price-summary"><span>Total estimado <b>{money(total, service.currency)}</b></span><span>Anticipo para apartar <b>{money(deposit, service.currency)}</b></span></div><button className="btn btn-primary btn-full" disabled={available < 1} onClick={() => setStep(2)}>Continuar <Icon name="arrow" /></button></div>}

    {step === 2 && <div className="modal-content"><h3>Datos de contacto</h3><div className="form-grid"><Field label="Nombre completo"><input value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="Nombre del responsable"/></Field><Field label="WhatsApp"><input value={form.phone} onChange={e => setForm({...form,phone:e.target.value})} placeholder="+52..."/></Field><Field label="Correo"><input type="email" value={form.email} onChange={e => setForm({...form,email:e.target.value})} placeholder="correo@ejemplo.com"/></Field><Field label="Notas"><input value={form.notes} onChange={e => setForm({...form,notes:e.target.value})} placeholder="Niños, accesibilidad, preferencias..."/></Field></div><div className="modal-actions"><button className="btn btn-ghost" onClick={() => setStep(1)}>Atrás</button><button className="btn btn-primary" onClick={createBooking} disabled={busy || (hasCloud && remoteSeats===null)}>{busy?'Apartando...':'Generar apartado'}</button></div></div>}

    {step === 3 && created && <div className="modal-content"><div className={`status-banner ${expired ? 'danger' : ''}`}><Icon name="clock" /><div><strong>{expired ? 'La pre-reserva venció' : 'Cupo apartado temporalmente'}</strong><span>{expired ? 'El lugar debe volver a validarse.' : `Vigente hasta ${dt(created.expiresAt)}`}</span></div></div><div className="transfer-layout"><div className="bank-card"><span>TRANSFERENCIA BANCARIA</span><h3>{config.transfer.bank}</h3><dl><div><dt>Beneficiario</dt><dd>{config.transfer.beneficiary}</dd></div><div><dt>CLABE</dt><dd>{config.transfer.clabe}</dd></div><div><dt>Cuenta</dt><dd>{config.transfer.account}</dd></div><div><dt>Concepto / referencia</dt><dd>{created.folio}</dd></div><div><dt>Importe a transferir</dt><dd className="amount">{money(created.deposit, created.currency)}</dd></div></dl></div><div className="transfer-help"><h3>Siguiente paso</h3><p>{config.transfer.instructions}</p><label className="upload-box"><Icon name="upload" size={24}/><strong>{proofName || 'Elegir referencia del comprobante'}</strong><span>{hasCloud ? 'Esta versión registra el nombre, no almacena el archivo. Envíalo por WhatsApp.' : 'Imagen o PDF · demo local'}</span><input type="file" accept="image/*,.pdf" onChange={e => setProofName(e.target.files?.[0]?.name || '')}/></label><button className="btn btn-primary btn-full" onClick={attachProof} disabled={!proofName || expired || busy}>Registrar referencia del comprobante</button>{created.status === 'proof_uploaded' && <div className="proof-ok"><Icon name="check" /> Referencia registrada. Envía el archivo al guía para validación.</div>}</div></div></div>}
  </div></div>
}

function Field({ label, children }) { return <label className="field"><span>{label}</span>{children}</label> }

function Admin({ config, setConfig, bookings, setBookings, onPublic, onLogout, notify }) {
  const [tab,setTab]=useState('dashboard')
  const [dialog,setDialog]=useState(null)
  const [mobile,setMobile]=useState(false)
  const [saving,setSaving]=useState(false)
  const [search,setSearch]=useState('')
  const pending=bookings.filter(b=>['awaiting_transfer','proof_uploaded'].includes(b.status)).length
  const confirmed=bookings.filter(b=>b.status==='confirmed').length
  async function commit(next){setSaving(true);try{if(hasCloud)await saveSite(next);setConfig(next);notify('Cambios guardados y publicados correctamente.');setDialog(null)}catch(e){notify('No se pudieron guardar los cambios: '+e.message)}finally{setSaving(false)}}
  const tabs=[['dashboard','Resumen','calendar'],['content','Contenido web','edit'],['services','Experiencias','map'],['bookings','Reservaciones','users'],['payments','Transferencias','card'],['links','Redes y enlaces','external'],['policies','Políticas','settings']]
  const selectTab=t=>{setTab(t);setMobile(false)}
  const edit=(type,data)=>setDialog({type,data})
  return <div className="admin-shell luxe-admin">
    <aside className={'admin-sidebar '+(mobile?'mobile-open':'')}>
      <div className="admin-logo"><span className="brand-mark">{config.brand.logoText}</span><div><strong>{config.brand.name}</strong><small>Content & Experience Studio</small></div></div>
      <div className="nav-group-label">ESPACIO DE TRABAJO</div>
      <nav>{tabs.map(([id,label,icon])=><button key={id} className={tab===id?'active':''} onClick={()=>selectTab(id)}><Icon name={icon} size={18}/><span>{label}</span>{id==='bookings'&&pending>0?<b>{pending}</b>:null}</button>)}</nav>
      <div className="sidebar-bottom"><span className="side-caption">ESTADO DEL SITIO</span><div className="online-state"><i/> Sitio público activo</div><button className="btn btn-sidebar" onClick={onPublic}><Icon name="external"/> Abrir sitio web</button>{hasCloud&&<button className="btn btn-sidebar logout-btn" onClick={onLogout}>Cerrar sesión</button>}</div>
    </aside>
    {mobile&&<button aria-label="Cerrar menú" className="mobile-scrim" onClick={()=>setMobile(false)}/>}
    <section className="admin-main">
      <header className="admin-topbar"><div className="topbar-left"><button className="mobile-toggle icon-btn" aria-label="Menú" onClick={()=>setMobile(true)}><Icon name="menu"/></button><span className="breadcrumb">TRASCENDENTAL / <b>{adminTitle(tab)}</b></span></div><div className="topbar-right"><span className="topbar-live"><i/> Conectado</span><button className="btn btn-ghost btn-sm" onClick={onPublic}><Icon name="external" size={15}/> Vista pública</button><span className="user-avatar">AD</span></div></header>
      <div className="admin-content">
        <div className="admin-heading"><div><span className="admin-kicker">GESTIÓN DEL SITIO · {new Date().toLocaleDateString('es-MX',{month:'long',year:'numeric'}).toUpperCase()}</span><h1>{adminTitle(tab)}</h1><p>{adminDescriptions[tab]}</p></div>{tab==='content'?<button className="btn btn-primary" onClick={()=>edit('brand',config.brand)}><Icon name="edit"/> Editar identidad</button>:tab==='services'?<button className="btn btn-primary" onClick={()=>edit('service',null)}><Icon name="plus"/> Nueva experiencia</button>:tab==='payments'?<button className="btn btn-primary" onClick={()=>edit('transfer',config.transfer)}><Icon name="edit"/> Editar transferencias</button>:tab==='links'?<button className="btn btn-primary" onClick={()=>edit('link',null)}><Icon name="plus"/> Nuevo enlace</button>:tab==='policies'?<button className="btn btn-primary" onClick={()=>edit('policies',config.policies)}><Icon name="edit"/> Editar políticas</button>:null}</div>
        {tab==='dashboard'&&<><div className="welcome-banner"><div><span className="kicker">TU CENTRO DE OPERACIONES</span><h2>Las mejores experiencias comienzan aquí.</h2><p>Controla tus servicios, publicaciones y reservas desde un solo lugar.</p><button className="btn btn-white" onClick={()=>selectTab('content')}>Administrar landing <Icon name="arrow" size={16}/></button></div><img src={config.brand.heroImage} alt="Paisaje del destino"/></div><Dashboard config={config} bookings={bookings} pending={pending} confirmed={confirmed}/></>}
        {tab==='content'&&<><div className="section-label-admin">PRESENTACIÓN DE MARCA</div><div className="cms-feature-grid"><article className="cms-feature" onClick={()=>edit('brand',config.brand)} role="button" tabIndex={0} onKeyDown={e=>e.key==='Enter'&&edit('brand',config.brand)}><div className="cms-feature-image"><img src={config.brand.heroImage} alt="Portada actual"/><span>HERO PRINCIPAL</span></div><div className="cms-feature-text"><div><h3>Identidad y portada</h3><p>Logo, colores, fotografía, contacto, titular y descripción.</p></div><button className="btn btn-soft" onClick={e=>{e.stopPropagation();edit('brand',config.brand)}}>Editar <Icon name="edit" size={15}/></button></div></article><article className="cms-feature cms-copy"><div className="cms-copy-preview"><span>PUBLICACIÓN EN VIVO</span><h2>{config.content?.experiencesTitle||CONTENT_DEFAULT.experiencesTitle}</h2><p>{config.content?.experiencesSubtitle||CONTENT_DEFAULT.experiencesSubtitle}</p><span className="mini-rule"/></div><div className="cms-feature-text"><div><h3>Secciones y mensajes</h3><p>Edita encabezados, introducciones y llamadas a la acción.</p></div><button className="btn btn-soft" onClick={()=>edit('content',{...CONTENT_DEFAULT,...config.content})}>Editar <Icon name="edit" size={15}/></button></div></article></div><div className="section-label-admin">VISTA DEL SITIO</div><Panel title="Vista previa de publicación" subtitle="El contenido se actualiza en la landing pública cuando guardas los cambios." actions={<button className="btn btn-soft" onClick={onPublic}>Abrir vista <Icon name="external" size={15}/></button>}><div className="preview-strip"><img src={config.brand.heroImage} alt="Vista previa"/><div><span>{config.brand.city}</span><h3>{config.brand.tagline}</h3><p>{config.brand.description}</p></div></div></Panel></>}
        {tab==='services'&&<><div className="overview-pills"><span><i className="dot green-dot"/> {config.services.filter(s=>s.active).length} publicadas</span><span>{config.services.length} experiencias en catálogo</span></div><div className="catalog-grid">{config.services.map(s=><article className="catalog-card" key={s.id}><div className="catalog-cover"><img src={s.image} alt={s.name}/><span className="catalog-category">{s.category}</span></div><div className="catalog-info"><div className="row-title"><h3>{s.name}</h3><Status status={s.active?'active':'inactive'}/></div><p>{s.short}</p><div className="catalog-meta"><span><Icon name="clock" size={15}/> {s.duration}</span><span><Icon name="users" size={15}/> {s.capacity} personas</span></div><div className="catalog-bottom"><div><small>Desde</small><strong>{money(s.price,s.currency)}</strong></div><button className="btn btn-soft" onClick={()=>edit('service',s)}><Icon name="edit" size={15}/> Editar</button></div></div></article>)}</div></>}
        {tab==='bookings'&&<><div className="overview-pills"><span>{bookings.length} reservaciones</span><span>{pending} pendientes</span></div><Bookings bookings={bookings} setBookings={setBookings} notify={notify}/></>}
        {tab==='payments'&&<><div className="payment-summary"><div className="payment-icon"><Icon name="card" size={24}/></div><div><span>TRANSFERENCIA CONFIGURADA</span><h2>{config.transfer.bank}</h2><p>Beneficiario: {config.transfer.beneficiary}</p><p>CLABE: {config.transfer.clabe}</p></div><div className="payment-timer"><b>{config.transfer.holdHours} h</b><small>vigencia de apartado</small></div></div><Panel title="Flujo de confirmación" subtitle="Los cupos se bloquean temporalmente mientras se recibe el comprobante de transferencia."><div className="flow-diagram"><FlowNode n="1" title="Pre-reserva" text="Validación de cupo"/><span>→</span><FlowNode n="2" title="Apartado" text={`${config.transfer.holdHours} horas`}/><span>→</span><FlowNode n="3" title="Pago" text="Verificación manual"/><span>→</span><FlowNode n="4" title="Confirmada" text="Cupo definitivo"/></div></Panel></>}
        {tab==='links'&&<Panel title="Redes sociales y enlaces" subtitle="Gestiona qué enlaces aparecen en el pie de página de tu landing."><div className="link-list">{config.links.map(l=><div className="link-card" key={l.id}><span className="link-icon"><Icon name="external"/></span><div><strong>{l.label}</strong><p>{l.url}</p></div><Status status={l.active?'active':'inactive'}/><button className="btn btn-soft" onClick={()=>edit('link',l)}>Editar</button></div>)}</div></Panel>}
        {tab==='policies'&&<div className="cms-feature-grid">{[['cancellation','Cancelaciones'],['meetingPoint','Punto de encuentro']].map(([key,label])=><article className="policy-card" key={key}><span className="kicker">POLÍTICAS DE SERVICIO</span><h3>{label}</h3><p>{config.policies?.[key]}</p><button className="btn btn-soft" onClick={()=>edit('policies',config.policies)}>Editar <Icon name="edit" size={15}/></button></article>)}</div>}
      </div>
    </section>
    {dialog&&<EditorModal key={dialog.type+'-'+(dialog.data?.id||'new')} dialog={dialog} config={config} saving={saving} onClose={()=>setDialog(null)} onSave={commit} notify={notify}/>}</div>
}
const adminDescriptions={dashboard:'Un resumen claro de todo lo que sucede con tus experiencias.',content:'Personaliza cada detalle de tu presencia digital.',services:'Diseña y administra tus recorridos, precios y disponibilidad.',bookings:'Da seguimiento a cada visitante y confirma sus apartados.',payments:'Controla la información bancaria y los tiempos de reserva.',links:'Mantén tus canales de contacto y redes siempre actualizados.',policies:'Comunica las condiciones de tus servicios con claridad.'}
function adminTitle(tab){return ({dashboard:'Visión general',content:'Contenido del sitio',services:'Experiencias y servicios',bookings:'Reservaciones',payments:'Transferencias y apartados',links:'Redes y enlaces',policies:'Políticas de servicio'})[tab]}
function Dashboard({ config, bookings, pending, confirmed }) {
 const revenue=bookings.filter(b=>b.status==='confirmed').reduce((s,b)=>s+Number(b.deposit||0),0)
 return <><div className="stats-grid"><Stat label="Experiencias publicadas" value={config.services.filter(s=>s.active).length} helper="Servicios disponibles en tu sitio" icon="map"/><Stat label="Pendientes de validar" value={pending} helper="Apartados en proceso" icon="clock"/><Stat label="Reservas confirmadas" value={confirmed} helper="Experiencias aseguradas" icon="check"/><Stat label="Anticipos confirmados" value={money(revenue)} helper="Importes reportados" icon="card"/></div><Panel title="Reservaciones recientes" subtitle="Últimos movimientos registrados en tu sitio.">{bookings.length?<div className="table-wrap"><table><thead><tr><th>Referencia</th><th>Cliente</th><th>Experiencia</th><th>Fecha</th><th>Estado</th></tr></thead><tbody>{bookings.slice(0,6).map(b=><tr key={b.id}><td><b>{b.folio}</b></td><td>{b.customer?.name}</td><td>{b.serviceName}</td><td>{b.date}</td><td><Status status={b.status}/></td></tr>)}</tbody></table></div>:<Empty text="Todavía no hay reservas. Tu siguiente aventura está por comenzar."/>}</Panel></>
}
function Stat({label,value,helper,icon}){return <div className="stat-card"><div className="stat-top"><span>{label}</span><span className="stat-icon"><Icon name={icon} size={18}/></span></div><strong>{value}</strong><small>{helper}</small></div>}
function Panel({title,subtitle,actions,children}){return <section className="panel"><div className="panel-head"><div><h2>{title}</h2>{subtitle&&<p>{subtitle}</p>}</div>{actions}</div>{children}</section>}
function Empty({text}){return <div className="empty"><Icon name="calendar" size={28}/><p>{text}</p></div>}
function FlowNode({n,title,text}){return <div className="flow-node"><b>{n}</b><div><strong>{title}</strong><span>{text}</span></div></div>}
function Bookings({bookings,setBookings,notify}){
 const [filter,setFilter]=useState('all');const [busy,setBusy]=useState('')
 const visible=bookings.filter(b=>filter==='all'||b.status===filter)
 async function update(id,value){setBusy(id);try{if(hasCloud)await setBookingStatus(id,value);setBookings(prev=>prev.map(b=>b.id===id?{...b,status:value}:b));notify('Estado actualizado')}catch(e){notify(e.message)}finally{setBusy('')}}
 return <Panel title="Listado de reservaciones" subtitle="Consulta clientes, recorridos e importes." actions={<select className="select" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">Todos los estados</option><option value="awaiting_transfer">Esperando transferencia</option><option value="proof_uploaded">Comprobante reportado</option><option value="confirmed">Confirmadas</option><option value="rejected">Rechazadas</option><option value="cancelled">Canceladas</option></select>}>{visible.length?<div className="table-wrap"><table><thead><tr><th>Reserva</th><th>Visitante</th><th>Recorrido</th><th>Anticipo</th><th>Estado / Acción</th></tr></thead><tbody>{visible.map(b=><tr key={b.id}><td><b>{b.folio}</b><small className="table-sub">{b.date} · {b.time}</small></td><td>{b.customer?.name}<small className="table-sub">{b.customer?.email}</small></td><td>{b.serviceName}<small className="table-sub">{b.people} personas</small></td><td><b>{money(b.deposit,b.currency)}</b><small className="table-sub">Total {money(b.total,b.currency)}</small></td><td><select disabled={busy===b.id} value={b.status} onChange={e=>update(b.id,e.target.value)}><option value="awaiting_transfer">Esperando transferencia</option><option value="proof_uploaded">Comprobante reportado</option><option value="confirmed">Confirmada</option><option value="rejected">Rechazada</option><option value="cancelled">Cancelada</option></select></td></tr>)}</tbody></table></div>:<Empty text="No se encontraron reservas con este filtro."/>}</Panel>
}
function EditorModal({dialog,config,onClose,onSave,saving,notify}){
 const {type}=dialog
 const draftDefault=type==='service'?{id:uid(),name:'',category:'Recorrido guiado',short:'',image:'',duration:'2 horas',price:500,currency:'MXN',capacity:10,depositPercent:40,active:false,highlights:''}:type==='link'?{id:uid(),label:'',url:'https://',active:true}:{}
 const [draft,setDraft]=useState(()=>structuredClone(dialog.data||draftDefault))
 const [uploading,setUploading]=useState(false)
 const [uploadError,setUploadError]=useState('')
 const update=(key,value)=>setDraft(d=>({...d,[key]:value}))
 async function uploadPhoto(file,key){if(!file)return;setUploadError('');if(!file.type.startsWith('image/'))return setUploadError('Selecciona una imagen válida.');if(file.size>8*1024*1024)return setUploadError('La imagen no debe exceder 8 MB.');setUploading(true);try{
  if(hasCloud){const extension=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'');const path=`site/${crypto.randomUUID()}.${extension}`;const {error}=await supabase.storage.from('site-media').upload(path,file,{contentType:file.type,upsert:false});if(error)throw error;const {data}=supabase.storage.from('site-media').getPublicUrl(path);update(key,data.publicUrl)}
  else {const reader=new FileReader();reader.onload=()=>update(key,reader.result);reader.readAsDataURL(file)}
 }catch(e){setUploadError(e.message+' · Verifica el bucket site-media y las políticas RLS.')}finally{setUploading(false)}}
 const photo=(key,label)=><div className="image-control"><div className="image-control-preview">{draft[key]?<img src={draft[key]} alt="Imagen seleccionada"/>:<div className="image-placeholder"><Icon name="upload" size={32}/>Sin imagen</div>}</div><div className="image-control-body"><strong>{label}</strong><p>JPG, PNG o WebP · máximo 8 MB. Las imágenes se guardan en Supabase Storage.</p><label className="btn btn-soft file-button"><Icon name="upload" size={16}/>{uploading?'Subiendo...':'Seleccionar imagen'}<input disabled={uploading} type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>uploadPhoto(e.target.files?.[0],key)}/></label><Field label="O pegar URL pública"><input type="url" value={draft[key]||''} onChange={e=>update(key,e.target.value)} placeholder="https://..."/></Field>{uploadError&&<small role="alert" className="upload-error">{uploadError}</small>}</div></div>
 const inp=(label,key,kind='text',extra={})=><Field label={label}>{kind==='textarea'?<textarea rows={extra.rows||3} value={draft[key]??''} onChange={e=>update(key,e.target.value)}/>:<input type={kind} min={extra.min} max={extra.max} value={draft[key]??''} onChange={e=>update(key,kind==='number'?Number(e.target.value):e.target.value)}/>}</Field>
 const sections={brand:['Identidad y portada','Actualiza tu marca, fotografía principal y datos de contacto.'],content:['Secciones de la landing','Todos los mensajes editoriales de la página pública.'],service:[dialog.data?'Editar experiencia':'Nueva experiencia','Personaliza cómo se presenta esta actividad a tus visitantes.'],transfer:['Configuración bancaria','Datos mostrados al cliente cuando genera un apartado.'],link:['Editar enlace','Controla los enlaces visibles en tu sitio público.'],policies:['Políticas de servicio','Información que deben conocer tus viajeros.']}
 const submit=e=>{e.preventDefault();if(uploading)return;const next=structuredClone(config);if(type==='service'){if(!draft.name.trim())return;next.services=next.services.some(s=>s.id===draft.id)?next.services.map(s=>s.id===draft.id?draft:s):[...next.services,draft]}else if(type==='link'){if(!draft.label.trim()||!/^https:\/\//i.test(draft.url))return notify('Ingresa una URL https válida.');next.links=next.links.some(l=>l.id===draft.id)?next.links.map(l=>l.id===draft.id?draft:l):[...next.links,draft]}else next[type]=draft;onSave(next)}
 const remove=()=>{if(!window.confirm('¿Eliminar definitivamente este elemento?'))return;const next=structuredClone(config);if(type==='service')next.services=next.services.filter(s=>s.id!==draft.id);if(type==='link')next.links=next.links.filter(l=>l.id!==draft.id);onSave(next)}
 useEffect(()=>{const fn=e=>{if(e.key==='Escape'&&!saving)onClose()};window.addEventListener('keydown',fn);return()=>window.removeEventListener('keydown',fn)},[onClose,saving]);
 return <div className="modal-backdrop cms-modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&!saving&&onClose()} role="presentation"><section className="editor-modal" role="dialog" aria-modal="true" aria-labelledby="editor-title"><div className="editor-modal-head"><div><span className="kicker">EDITOR DE CONTENIDO</span><h2 id="editor-title">{sections[type][0]}</h2><p>{sections[type][1]}</p></div><button className="icon-btn" aria-label="Cerrar" onClick={onClose}><Icon name="close"/></button></div><form onSubmit={submit}><div className="editor-modal-body">
 {type==='brand'&&<>{photo('heroImage','Fotografía de portada')}<div className="form-grid">{inp('Nombre comercial','name')}{inp('Siglas / logo','logoText')}{inp('Ciudad / región','city')}{inp('Correo de contacto','email','email')}{inp('WhatsApp con lada país','whatsapp')}{inp('Teléfono','phone')}</div>{inp('Titular principal','tagline','textarea',{rows:3})}{inp('Descripción principal','description','textarea',{rows:4})}<div className="form-grid">{inp('Color principal','primaryColor','color')}{inp('Color acento','accentColor','color')}</div></>}
 {type==='content'&&<>{inp('Etiqueta de experiencias','experiencesEyebrow')}{inp('Título de experiencias','experiencesTitle')}{inp('Subtítulo de experiencias','experiencesSubtitle','textarea')}{inp('Texto de botón principal','heroPrimaryCTA')}{inp('Texto botón WhatsApp','heroSecondaryCTA')}{inp('Título del proceso de reserva','stepsTitle')}{(draft.steps||CONTENT_DEFAULT.steps).map((item,i)=><div className="edit-step-pair" key={i}><span className="kicker">PASO {i+1}</span><Field label="Título del paso"><input value={item.title} onChange={e=>setDraft(d=>({...d,steps:(d.steps||CONTENT_DEFAULT.steps).map((x,n)=>n===i?{...x,title:e.target.value}:x)}))}/></Field><Field label="Descripción del paso"><textarea value={item.text} rows="2" onChange={e=>setDraft(d=>({...d,steps:(d.steps||CONTENT_DEFAULT.steps).map((x,n)=>n===i?{...x,text:e.target.value}:x)}))}/></Field></div>)}{inp('Título de contacto','contactTitle')}{inp('Descripción de contacto','contactDescription','textarea')}{inp('Botón de contacto','contactCTA')}{inp('Mensaje de confianza','trustLine')}{inp('Texto al pie','footerNote')}</>}
 {type==='service'&&<>{photo('image','Imagen principal de la experiencia')}<div className="form-grid">{inp('Nombre de la experiencia','name')}{inp('Categoría','category')}{inp('Precio por persona (MXN)','price','number',{min:0})}{inp('Duración','duration')}{inp('Cupo máximo','capacity','number',{min:1})}{inp('Anticipo (%)','depositPercent','number',{min:0,max:100})}</div>{inp('Descripción','short','textarea')}{inp('Aspectos destacados (separa con ·)','highlights','textarea')}<label className="editor-toggle"><input type="checkbox" checked={Boolean(draft.active)} onChange={e=>update('active',e.target.checked)}/><div><strong>Publicar experiencia</strong><small>Los viajeros podrán verla y reservarla desde tu landing.</small></div></label></>}
 {type==='transfer'&&<><div className="form-grid">{inp('Banco','bank')}{inp('Beneficiario','beneficiary')}{inp('CLABE','clabe')}{inp('Cuenta','account')}{inp('Duración del apartado (horas)','holdHours','number',{min:1,max:24})}{inp('Prefijo de folio','referencePrefix')}</div>{inp('Instrucciones de transferencia','instructions','textarea',{rows:4})}</>}
 {type==='link'&&<>{inp('Nombre visible','label')}{inp('URL del enlace','url','url')}<label className="editor-toggle"><input type="checkbox" checked={Boolean(draft.active)} onChange={e=>update('active',e.target.checked)}/><div><strong>Mostrar en landing</strong><small>Los visitantes podrán abrir este enlace.</small></div></label></>}
 {type==='policies'&&<>{inp('Política de cancelación','cancellation','textarea',{rows:4})}{inp('Punto de encuentro','meetingPoint','textarea',{rows:4})}</>}
 </div><div className="editor-modal-footer"><div>{dialog.data?.id&&(type==='service'||type==='link')&&<button type="button" className="btn btn-danger-soft" disabled={saving} onClick={remove}><Icon name="trash" size={15}/> Eliminar</button>}</div><div className="footer-buttons"><button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button><button type="submit" className="btn btn-primary" disabled={saving||uploading}><Icon name="check" size={16}/>{saving?'Guardando...':'Guardar cambios'}</button></div></div></form></section></div>
}
function Status({ status }) {
  const map={active:['Publicado','green'],inactive:['Borrador','gray'],awaiting_transfer:['Esperando transferencia','amber'],proof_uploaded:['Referencia registrada','blue'],confirmed:['Confirmada','green'],rejected:['Rechazada','red'],cancelled:['Cancelada','gray'],expired:['Vencida','red']}
  const [label,tone]=map[status]||[status,'gray']
  return <span className={`status ${tone}`}>{label}</span>
}
