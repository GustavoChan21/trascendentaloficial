import React, { useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'guiaTuristicoCMS.v1'
const BOOKINGS_KEY = 'guiaTuristicoBookings.v1'

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
const money = (value, currency = 'MXN') => new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(Number(value || 0))
const dt = value => new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
const todayISO = () => new Date().toISOString().slice(0, 10)

const initialConfig = {
  brand: {
    name: 'Camino Maya Tours',
    tagline: 'Historias, sabores y rincones que sólo un guía local puede mostrarte.',
    description: 'Recorridos privados y experiencias auténticas para descubrir la región con contexto, seguridad y atención personalizada.',
    heroImage: 'https://images.unsplash.com/photo-1518638150340-f706e86654de?auto=format&fit=crop&w=1800&q=80',
    logoText: 'CM',
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
    instructions: 'Realiza la transferencia dentro de la vigencia indicada y sube tu comprobante. El lugar queda apartado temporalmente hasta validar el pago.'
  },
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
  const [bookings, setBookings] = useState(() => readJson(BOOKINGS_KEY, []))
  const [view, setView] = useState('public')
  const [bookingService, setBookingService] = useState(null)
  const [toast, setToast] = useState('')

  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(config)), [config])
  useEffect(() => localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings)), [bookings])
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 2600)
    return () => clearTimeout(timer)
  }, [toast])

  const cssVars = { '--primary': config.brand.primaryColor, '--accent': config.brand.accentColor }

  return (
    <div style={cssVars}>
      {view === 'public' ? (
        <PublicSite config={config} bookings={bookings} onAdmin={() => setView('admin')} onBook={setBookingService} />
      ) : (
        <Admin config={config} setConfig={setConfig} bookings={bookings} setBookings={setBookings} onPublic={() => setView('public')} notify={setToast} />
      )}
      {bookingService && <BookingModal service={bookingService} config={config} bookings={bookings} setBookings={setBookings} onClose={() => setBookingService(null)} notify={setToast} />}
      {toast && <div className="toast"><Icon name="check" /> {toast}</div>}
    </div>
  )
}

function PublicSite({ config, bookings, onAdmin, onBook }) {
  const activeServices = config.services.filter(s => s.active)
  return <main className="public-site">
    <header className="site-header">
      <a className="brand" href="#inicio"><span className="brand-mark">{config.brand.logoText}</span><span>{config.brand.name}</span></a>
      <nav className="nav-links"><a href="#experiencias">Experiencias</a><a href="#como-reservar">Cómo reservar</a><a href="#contacto">Contacto</a></nav>
      <button className="btn btn-ghost btn-sm" onClick={onAdmin}>Panel admin</button>
    </header>

    <section id="inicio" className="hero">
      <img src={config.brand.heroImage} alt="Destino turístico" className="hero-bg" />
      <div className="hero-overlay" />
      <div className="hero-content">
        <span className="eyebrow"><Icon name="map" /> {config.brand.city}</span>
        <h1>{config.brand.tagline}</h1>
        <p>{config.brand.description}</p>
        <div className="hero-actions"><a className="btn btn-primary" href="#experiencias">Ver experiencias <Icon name="arrow" /></a><a className="btn btn-glass" href={`https://wa.me/${config.brand.whatsapp}`} target="_blank" rel="noreferrer">Hablar por WhatsApp</a></div>
      </div>
      <div className="hero-statbar">
        <div><strong>{activeServices.length}</strong><span>experiencias activas</span></div>
        <div><strong>Local</strong><span>atención personalizada</span></div>
        <div><strong>Seguro</strong><span>aparta con transferencia</span></div>
      </div>
    </section>

    <section id="experiencias" className="section wrap">
      <div className="section-head"><div><span className="kicker">EXPERIENCIAS</span><h2>Descubre a tu ritmo</h2></div><p>Elige un recorrido, revisa disponibilidad y aparta tu lugar en pocos pasos.</p></div>
      <div className="cards-grid">
        {activeServices.map(service => <article className="service-card" key={service.id}>
          <div className="service-image-wrap"><img src={service.image} alt={service.name} className="service-image" /><span className="card-chip">{service.category}</span></div>
          <div className="service-body"><h3>{service.name}</h3><p>{service.short}</p><div className="meta-row"><span><Icon name="clock" />{service.duration}</span><span><Icon name="users" />Hasta {service.capacity}</span></div><div className="highlights">{service.highlights}</div><div className="card-footer"><div><small>Desde</small><strong>{money(service.price, service.currency)}</strong></div><button className="btn btn-dark" onClick={() => onBook(service)}>Reservar</button></div></div>
        </article>)}
      </div>
    </section>

    <section id="como-reservar" className="steps-section"><div className="wrap"><span className="kicker kicker-light">RESERVA SIN COMPLICACIONES</span><h2>Tu lugar queda apartado mientras realizas la transferencia</h2><div className="steps-grid">
      <Step n="01" title="Elige fecha y personas" text="El sistema valida el cupo disponible antes de crear la pre-reserva." />
      <Step n="02" title="Recibe datos de transferencia" text={`Se genera un folio y una vigencia de ${config.transfer.holdHours} horas para completar el anticipo.`} />
      <Step n="03" title="Sube tu comprobante" text="El administrador valida el pago y cambia la reserva a confirmada." />
      <Step n="04" title="Recibe la confirmación" text="Obtienes indicaciones finales, punto de encuentro y recomendaciones." />
    </div></div></section>

    <section id="contacto" className="section wrap contact-section"><div><span className="kicker">ATENCIÓN DIRECTA</span><h2>¿Necesitas una experiencia a medida?</h2><p>Escríbeme y armamos un recorrido privado de acuerdo con tus tiempos, intereses y número de viajeros.</p></div><a className="btn btn-primary" href={`https://wa.me/${config.brand.whatsapp}`} target="_blank" rel="noreferrer">Cotizar por WhatsApp <Icon name="external" /></a></section>

    <footer className="footer"><div className="wrap footer-inner"><div><div className="brand footer-brand"><span className="brand-mark">{config.brand.logoText}</span><span>{config.brand.name}</span></div><p>{config.brand.city}</p></div><div className="footer-links">{config.links.filter(l => l.active).map(l => <a key={l.id} href={l.url} target="_blank" rel="noreferrer">{l.label}</a>)}</div><div className="footer-copy">© {new Date().getFullYear()} · Sitio administrable</div></div></footer>
  </main>
}

function Step({ n, title, text }) { return <div className="step"><span>{n}</span><h3>{title}</h3><p>{text}</p></div> }

function BookingModal({ service, config, bookings, setBookings, onClose, notify }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ date: todayISO(), time: '09:00', adults: 2, name: '', phone: '', email: '', notes: '' })
  const [created, setCreated] = useState(null)
  const [proofName, setProofName] = useState('')

  const activeSeats = useMemo(() => bookings.filter(b => b.serviceId === service.id && b.date === form.date && (b.status === 'confirmed' || (['awaiting_transfer','proof_uploaded'].includes(b.status) && new Date(b.expiresAt) > new Date()))).reduce((sum, b) => sum + Number(b.people || 0), 0), [bookings, service.id, form.date])
  const available = Math.max(0, service.capacity - activeSeats)
  const people = Math.max(1, Number(form.adults || 1))
  const total = service.price * people
  const deposit = Math.round(total * (service.depositPercent / 100) * 100) / 100

  function createBooking() {
    if (!form.name.trim() || !form.phone.trim() || !form.email.trim()) return notify('Completa nombre, teléfono y correo.')
    if (people > available) return notify(`Sólo hay ${available} lugares disponibles.`)
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

  function attachProof() {
    if (!proofName) return notify('Selecciona un comprobante primero.')
    const updated = { ...created, proofName, status: 'proof_uploaded' }
    setBookings(prev => prev.map(b => b.id === created.id ? updated : b))
    setCreated(updated)
    notify('Comprobante registrado. La reserva quedó en validación.')
  }

  const expired = created && new Date(created.expiresAt) < new Date()

  return <div className="modal-backdrop" role="dialog" aria-modal="true"><div className="booking-modal"><button className="icon-btn close-btn" onClick={onClose}><Icon name="close" /></button>
    <div className="modal-service"><img src={service.image} alt=""/><div><span>{service.category}</span><h2>{service.name}</h2><p>{money(service.price, service.currency)} por persona · anticipo {service.depositPercent}%</p></div></div>
    <div className="stepper"><span className={step >= 1 ? 'active' : ''}>1. Fecha</span><i></i><span className={step >= 2 ? 'active' : ''}>2. Datos</span><i></i><span className={step >= 3 ? 'active' : ''}>3. Apartado</span></div>

    {step === 1 && <div className="modal-content"><h3>Selecciona fecha y cupo</h3><div className="form-grid"><Field label="Fecha"><input type="date" min={todayISO()} value={form.date} onChange={e => setForm({...form, date:e.target.value})}/></Field><Field label="Hora"><input type="time" value={form.time} onChange={e => setForm({...form, time:e.target.value})}/></Field><Field label="Personas"><input type="number" min="1" max={Math.max(1, available)} value={form.adults} onChange={e => setForm({...form, adults:e.target.value})}/></Field><div className="availability-box"><strong>{available}</strong><span>lugares disponibles</span></div></div><div className="price-summary"><span>Total estimado <b>{money(total, service.currency)}</b></span><span>Anticipo para apartar <b>{money(deposit, service.currency)}</b></span></div><button className="btn btn-primary btn-full" disabled={available < 1} onClick={() => setStep(2)}>Continuar <Icon name="arrow" /></button></div>}

    {step === 2 && <div className="modal-content"><h3>Datos de contacto</h3><div className="form-grid"><Field label="Nombre completo"><input value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="Nombre del responsable"/></Field><Field label="WhatsApp"><input value={form.phone} onChange={e => setForm({...form,phone:e.target.value})} placeholder="+52..."/></Field><Field label="Correo"><input type="email" value={form.email} onChange={e => setForm({...form,email:e.target.value})} placeholder="correo@ejemplo.com"/></Field><Field label="Notas"><input value={form.notes} onChange={e => setForm({...form,notes:e.target.value})} placeholder="Niños, accesibilidad, preferencias..."/></Field></div><div className="modal-actions"><button className="btn btn-ghost" onClick={() => setStep(1)}>Atrás</button><button className="btn btn-primary" onClick={createBooking}>Generar apartado</button></div></div>}

    {step === 3 && created && <div className="modal-content"><div className={`status-banner ${expired ? 'danger' : ''}`}><Icon name="clock" /><div><strong>{expired ? 'La pre-reserva venció' : 'Cupo apartado temporalmente'}</strong><span>{expired ? 'El lugar debe volver a validarse.' : `Vigente hasta ${dt(created.expiresAt)}`}</span></div></div><div className="transfer-layout"><div className="bank-card"><span>TRANSFERENCIA BANCARIA</span><h3>{config.transfer.bank}</h3><dl><div><dt>Beneficiario</dt><dd>{config.transfer.beneficiary}</dd></div><div><dt>CLABE</dt><dd>{config.transfer.clabe}</dd></div><div><dt>Cuenta</dt><dd>{config.transfer.account}</dd></div><div><dt>Concepto / referencia</dt><dd>{created.folio}</dd></div><div><dt>Importe a transferir</dt><dd className="amount">{money(created.deposit, created.currency)}</dd></div></dl></div><div className="transfer-help"><h3>Siguiente paso</h3><p>{config.transfer.instructions}</p><label className="upload-box"><Icon name="upload" size={24}/><strong>{proofName || 'Adjuntar comprobante'}</strong><span>Imagen o PDF · demo local</span><input type="file" accept="image/*,.pdf" onChange={e => setProofName(e.target.files?.[0]?.name || '')}/></label><button className="btn btn-primary btn-full" onClick={attachProof} disabled={!proofName || expired}>Enviar comprobante</button>{created.status === 'proof_uploaded' && <div className="proof-ok"><Icon name="check" /> Comprobante enviado. Pendiente de validación.</div>}</div></div></div>}
  </div></div>
}

function Field({ label, children }) { return <label className="field"><span>{label}</span>{children}</label> }

function Admin({ config, setConfig, bookings, setBookings, onPublic, notify }) {
  const [tab, setTab] = useState('dashboard')
  const [selectedService, setSelectedService] = useState(null)
  const activeBookings = bookings.filter(b => !['cancelled','rejected','expired'].includes(b.status))
  const pending = bookings.filter(b => ['awaiting_transfer','proof_uploaded'].includes(b.status)).length
  const confirmed = bookings.filter(b => b.status === 'confirmed').length

  return <div className="admin-shell">
    <aside className="admin-sidebar"><div className="admin-logo"><span className="brand-mark">{config.brand.logoText}</span><div><strong>{config.brand.name}</strong><small>Administración</small></div></div><nav>
      <AdminNav id="dashboard" tab={tab} setTab={setTab} icon="calendar" label="Resumen" />
      <AdminNav id="content" tab={tab} setTab={setTab} icon="edit" label="Contenido" />
      <AdminNav id="services" tab={tab} setTab={setTab} icon="map" label="Servicios" />
      <AdminNav id="bookings" tab={tab} setTab={setTab} icon="users" label="Reservas" badge={pending || null} />
      <AdminNav id="payments" tab={tab} setTab={setTab} icon="card" label="Transferencias" />
      <AdminNav id="links" tab={tab} setTab={setTab} icon="external" label="Links" />
    </nav><div className="sidebar-bottom"><button className="btn btn-sidebar" onClick={onPublic}><Icon name="eye" /> Ver sitio público</button><small>Demo frontend · localStorage</small></div></aside>

    <section className="admin-main"><header className="admin-topbar"><div><span className="admin-kicker">PANEL ADMINISTRATIVO</span><h1>{adminTitle(tab)}</h1></div><button className="btn btn-primary" onClick={onPublic}><Icon name="eye"/> Vista pública</button></header>
      <div className="admin-content">
        {tab === 'dashboard' && <Dashboard config={config} bookings={bookings} pending={pending} confirmed={confirmed} />}
        {tab === 'content' && <ContentEditor config={config} setConfig={setConfig} notify={notify} />}
        {tab === 'services' && <ServicesEditor config={config} setConfig={setConfig} selectedService={selectedService} setSelectedService={setSelectedService} notify={notify} />}
        {tab === 'bookings' && <Bookings bookings={bookings} setBookings={setBookings} notify={notify} />}
        {tab === 'payments' && <TransferEditor config={config} setConfig={setConfig} notify={notify} />}
        {tab === 'links' && <LinksEditor config={config} setConfig={setConfig} notify={notify} />}
      </div>
    </section>
  </div>
}

function adminTitle(tab) { return ({dashboard:'Resumen general', content:'Contenido del sitio', services:'Servicios y recorridos', bookings:'Reservas y cupos', payments:'Transferencias y apartados', links:'Links y redes'})[tab] }
function AdminNav({ id, tab, setTab, icon, label, badge }) { return <button className={tab===id?'active':''} onClick={() => setTab(id)}><Icon name={icon}/><span>{label}</span>{badge ? <b>{badge}</b> : null}</button> }

function Dashboard({ config, bookings, pending, confirmed }) {
  const revenue = bookings.filter(b => b.status === 'confirmed').reduce((s,b) => s + b.deposit, 0)
  const recent = bookings.slice(0, 5)
  return <><div className="stats-grid"><Stat label="Servicios activos" value={config.services.filter(s=>s.active).length} helper={`${config.services.length} configurados`} /><Stat label="Por validar" value={pending} helper="Transferencias / comprobantes" /><Stat label="Confirmadas" value={confirmed} helper="Reservas activas" /><Stat label="Anticipos confirmados" value={money(revenue)} helper="Acumulado en esta demo" /></div><Panel title="Actividad reciente" subtitle="Últimas solicitudes creadas desde la landing.">{recent.length ? <div className="table-wrap"><table><thead><tr><th>Folio</th><th>Cliente</th><th>Experiencia</th><th>Fecha</th><th>Estatus</th></tr></thead><tbody>{recent.map(b=><tr key={b.id}><td><b>{b.folio}</b></td><td>{b.customer.name}</td><td>{b.serviceName}</td><td>{b.date}</td><td><Status status={['awaiting_transfer','proof_uploaded'].includes(b.status) && new Date(b.expiresAt) < new Date() ? 'expired' : b.status}/></td></tr>)}</tbody></table></div> : <Empty text="Aún no hay reservas. Abre la vista pública y genera una para probar el flujo." />}</Panel></>
}
function Stat({ label, value, helper }) { return <div className="stat-card"><span>{label}</span><strong>{value}</strong><small>{helper}</small></div> }
function Panel({ title, subtitle, actions, children }) { return <section className="panel"><div className="panel-head"><div><h2>{title}</h2>{subtitle&&<p>{subtitle}</p>}</div>{actions}</div>{children}</section> }
function Empty({ text }) { return <div className="empty"><span>—</span><p>{text}</p></div> }

function ContentEditor({ config, setConfig, notify }) {
  const brand = config.brand
  const update = (field, value) => setConfig({...config, brand:{...brand,[field]:value}})
  return <Panel title="Landing pública" subtitle="Edita los textos, datos de contacto e imagen principal. Los cambios se reflejan de inmediato." actions={<button className="btn btn-primary" onClick={()=>notify('Cambios guardados en este navegador.')}>Guardar cambios</button>}><div className="editor-grid"><div className="form-stack"><Field label="Nombre comercial"><input value={brand.name} onChange={e=>update('name',e.target.value)}/></Field><Field label="Título principal"><textarea rows="3" value={brand.tagline} onChange={e=>update('tagline',e.target.value)}/></Field><Field label="Descripción"><textarea rows="4" value={brand.description} onChange={e=>update('description',e.target.value)}/></Field><Field label="URL de imagen principal"><input value={brand.heroImage} onChange={e=>update('heroImage',e.target.value)}/></Field><div className="form-grid"><Field label="Ciudad / región"><input value={brand.city} onChange={e=>update('city',e.target.value)}/></Field><Field label="WhatsApp (con lada país)"><input value={brand.whatsapp} onChange={e=>update('whatsapp',e.target.value)}/></Field><Field label="Correo"><input value={brand.email} onChange={e=>update('email',e.target.value)}/></Field><Field label="Teléfono"><input value={brand.phone} onChange={e=>update('phone',e.target.value)}/></Field></div><div className="form-grid"><Field label="Color principal"><input type="color" value={brand.primaryColor} onChange={e=>update('primaryColor',e.target.value)}/></Field><Field label="Color acento"><input type="color" value={brand.accentColor} onChange={e=>update('accentColor',e.target.value)}/></Field></div></div><div className="preview-card"><span>Vista previa</span><img src={brand.heroImage} alt="Vista previa"/><h3>{brand.tagline}</h3><p>{brand.description}</p></div></div></Panel>
}

function ServicesEditor({ config, setConfig, selectedService, setSelectedService, notify }) {
  const services = config.services
  const saveServices = next => setConfig({...config, services:next})
  function addService(){ const item={id:uid(),name:'Nueva experiencia',category:'Recorrido guiado',short:'Describe brevemente esta experiencia.',image:config.brand.heroImage,duration:'2 horas',price:500,currency:'MXN',capacity:10,depositPercent:50,active:false,highlights:'Guía local · Experiencia personalizada'}; saveServices([item,...services]); setSelectedService(item.id) }
  function updateService(id, field, value){ saveServices(services.map(s=>s.id===id?{...s,[field]:value}:s)) }
  function removeService(id){ saveServices(services.filter(s=>s.id!==id)); if(selectedService===id)setSelectedService(null); notify('Servicio eliminado.') }
  const editing = services.find(s=>s.id===selectedService)
  return <Panel title="Catálogo de servicios" subtitle="Configura recorridos, experiencias, precios, anticipos y cupo máximo." actions={<button className="btn btn-primary" onClick={addService}><Icon name="plus"/> Nuevo servicio</button>}><div className="service-admin-list">{services.map(s=><div className="service-admin-row" key={s.id}><img src={s.image} alt=""/><div className="grow"><div className="row-title"><strong>{s.name}</strong><Status status={s.active?'active':'inactive'}/></div><span>{s.category} · {money(s.price,s.currency)} · cupo {s.capacity}</span></div><button className="icon-btn" onClick={()=>setSelectedService(s.id)} title="Editar"><Icon name="edit"/></button><button className="icon-btn danger" onClick={()=>removeService(s.id)} title="Eliminar"><Icon name="trash"/></button></div>)}</div>{editing&&<div className="drawer"><div className="drawer-head"><div><span>EDITANDO SERVICIO</span><h3>{editing.name}</h3></div><button className="icon-btn" onClick={()=>setSelectedService(null)}><Icon name="close"/></button></div><div className="form-grid"><Field label="Nombre"><input value={editing.name} onChange={e=>updateService(editing.id,'name',e.target.value)}/></Field><Field label="Categoría"><input value={editing.category} onChange={e=>updateService(editing.id,'category',e.target.value)}/></Field><Field label="Precio por persona"><input type="number" min="0" value={editing.price} onChange={e=>updateService(editing.id,'price',Number(e.target.value))}/></Field><Field label="Cupo máximo"><input type="number" min="1" value={editing.capacity} onChange={e=>updateService(editing.id,'capacity',Number(e.target.value))}/></Field><Field label="Anticipo %"><input type="number" min="0" max="100" value={editing.depositPercent} onChange={e=>updateService(editing.id,'depositPercent',Number(e.target.value))}/></Field><Field label="Duración"><input value={editing.duration} onChange={e=>updateService(editing.id,'duration',e.target.value)}/></Field></div><Field label="Descripción corta"><textarea rows="3" value={editing.short} onChange={e=>updateService(editing.id,'short',e.target.value)}/></Field><Field label="URL de imagen"><input value={editing.image} onChange={e=>updateService(editing.id,'image',e.target.value)}/></Field><Field label="Highlights"><input value={editing.highlights} onChange={e=>updateService(editing.id,'highlights',e.target.value)}/></Field><label className="toggle-row"><input type="checkbox" checked={editing.active} onChange={e=>updateService(editing.id,'active',e.target.checked)}/><span>Publicar este servicio en la landing</span></label><button className="btn btn-primary btn-full" onClick={()=>{notify('Servicio actualizado.');setSelectedService(null)}}>Guardar servicio</button></div>}</Panel>
}

function Bookings({ bookings, setBookings, notify }) {
  const [filter, setFilter] = useState('all')
  const visible = bookings.filter(b => filter==='all' ? true : b.status===filter)
  function status(id, value){ setBookings(bookings.map(b=>b.id===id?{...b,status:value}:b)); notify('Estatus actualizado.') }
  return <Panel title="Reservas y apartados" subtitle="Gestiona comprobantes, confirmaciones y liberación de cupos." actions={<select className="select" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">Todos</option><option value="awaiting_transfer">Esperando transferencia</option><option value="proof_uploaded">Comprobante enviado</option><option value="confirmed">Confirmadas</option><option value="rejected">Rechazadas</option><option value="cancelled">Canceladas</option></select>}>{visible.length?<div className="booking-list">{visible.map(b=><article className="booking-row" key={b.id}><div className="folio-col"><b>{b.folio}</b><Status status={['awaiting_transfer','proof_uploaded'].includes(b.status) && new Date(b.expiresAt) < new Date() ? 'expired' : b.status}/></div><div><strong>{b.customer.name}</strong><span>{b.customer.phone} · {b.customer.email}</span></div><div><strong>{b.serviceName}</strong><span>{b.date} · {b.time} · {b.people} persona(s)</span></div><div><strong>{money(b.deposit,b.currency)}</strong><span>Anticipo · total {money(b.total,b.currency)}</span></div><div className="booking-actions"><select value={b.status} onChange={e=>status(b.id,e.target.value)}><option value="awaiting_transfer">Esperando transferencia</option><option value="proof_uploaded">Comprobante enviado</option><option value="confirmed">Confirmada</option><option value="rejected">Rechazada</option><option value="cancelled">Cancelada</option></select>{b.proofName&&<small>📎 {b.proofName}</small>}</div></article>)}</div>:<Empty text="No hay reservas con este filtro."/>}</Panel>
}

function TransferEditor({ config, setConfig, notify }) {
  const transfer = config.transfer
  const update=(field,value)=>setConfig({...config,transfer:{...transfer,[field]:value}})
  return <><Panel title="Reglas para apartar cupo" subtitle="Una pre-reserva bloquea lugares durante la vigencia; al vencer o rechazarse, el cupo se libera."><div className="flow-diagram"><FlowNode n="1" title="Pre-reserva" text="Valida disponibilidad"/><span>→</span><FlowNode n="2" title="Bloqueo temporal" text={`${transfer.holdHours} horas`}/><span>→</span><FlowNode n="3" title="Comprobante" text="Pendiente de validar"/><span>→</span><FlowNode n="4" title="Confirmación" text="Cupo definitivo"/></div></Panel><Panel title="Datos bancarios" subtitle="Información que verá el viajero al generar su apartado." actions={<button className="btn btn-primary" onClick={()=>notify('Configuración de transferencia guardada.')}>Guardar</button>}><div className="form-grid"><Field label="Banco"><input value={transfer.bank} onChange={e=>update('bank',e.target.value)}/></Field><Field label="Beneficiario"><input value={transfer.beneficiary} onChange={e=>update('beneficiary',e.target.value)}/></Field><Field label="CLABE"><input value={transfer.clabe} onChange={e=>update('clabe',e.target.value)}/></Field><Field label="Cuenta"><input value={transfer.account} onChange={e=>update('account',e.target.value)}/></Field><Field label="Horas de bloqueo"><input type="number" min="1" max="72" value={transfer.holdHours} onChange={e=>update('holdHours',Number(e.target.value))}/></Field><Field label="Prefijo de folio"><input value={transfer.referencePrefix} onChange={e=>update('referencePrefix',e.target.value.toUpperCase())}/></Field></div><Field label="Instrucciones"><textarea rows="4" value={transfer.instructions} onChange={e=>update('instructions',e.target.value)}/></Field></Panel></>
}
function FlowNode({n,title,text}){return <div className="flow-node"><b>{n}</b><div><strong>{title}</strong><span>{text}</span></div></div>}

function LinksEditor({ config, setConfig, notify }) {
  const links=config.links
  const save=next=>setConfig({...config,links:next})
  const add=()=>save([...links,{id:uid(),label:'Nuevo link',url:'https://',active:true}])
  return <Panel title="Links y redes" subtitle="Se muestran en el pie de página y pueden reutilizarse en botones de la landing." actions={<button className="btn btn-primary" onClick={add}><Icon name="plus"/> Agregar link</button>}><div className="links-editor">{links.map(l=><div className="link-row" key={l.id}><input value={l.label} onChange={e=>save(links.map(x=>x.id===l.id?{...x,label:e.target.value}:x))}/><input value={l.url} onChange={e=>save(links.map(x=>x.id===l.id?{...x,url:e.target.value}:x))}/><label className="switch"><input type="checkbox" checked={l.active} onChange={e=>save(links.map(x=>x.id===l.id?{...x,active:e.target.checked}:x))}/><span></span></label><button className="icon-btn danger" onClick={()=>save(links.filter(x=>x.id!==l.id))}><Icon name="trash"/></button></div>)}</div><div className="panel-save"><button className="btn btn-primary" onClick={()=>notify('Links guardados.')}>Guardar cambios</button></div></Panel>
}

function Status({ status }) {
  const map={active:['Publicado','green'],inactive:['Borrador','gray'],awaiting_transfer:['Esperando transferencia','amber'],proof_uploaded:['Comprobante enviado','blue'],confirmed:['Confirmada','green'],rejected:['Rechazada','red'],cancelled:['Cancelada','gray'],expired:['Vencida','red']}
  const [label,tone]=map[status]||[status,'gray']
  return <span className={`status ${tone}`}>{label}</span>
}
