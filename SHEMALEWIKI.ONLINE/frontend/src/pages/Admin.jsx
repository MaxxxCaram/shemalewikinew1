// Admin Panel — password NEVER on frontend, only server-side verification
// Login POST /api/admin/login {secret} → returns {token}
// Subsequent requests use: Authorization: Bearer ***

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, XCircle, Trash2, ExternalLink, RefreshCw, LogOut, Pencil } from 'lucide-react';
import PhotoCropModal from '../components/PhotoCropModal';

const API_BASE = typeof window !== 'undefined' ? window.location.origin : 'https://shemalewiki.online';

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
}

export default function Admin() {
  const [profiles, setProfiles] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(!!getToken());
  const [passInput, setPassInput] = useState('');
  const [editing, setEditing] = useState(null); // {profile, photos}
  const [cropSrc, setCropSrc] = useState(null); // foto siendo recortada
  const [token, setToken] = useState(getToken());

  const doFetchProfiles = useCallback(async (tok) => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/admin`, {
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tok}` },
      });
      if (!r.ok) {
        if (r.status === 401 || r.status === 403) {
          localStorage.removeItem('admin_token');
          setToken(null);
          setIsAuthenticated(false);
          setMsg('Sesión expirada. Ingresá tu secret de nuevo.');
        } else {
          const data = await r.json().catch(() => ({}));
          setMsg('❌ Error: ' + (data.error || 'no disponible'));
        }
        return;
      }
      const data = await r.json();
      if (data.profiles) {
        setProfiles(Array.isArray(data.profiles) ? data.profiles : []);
      }
    } catch (err) {
      console.error(err);
      setMsg('❌ Error de conexión');
    } finally {
      setLoading(false);
    }
  }, []);

  // Reclamos pendientes de revisión (colección `claims`, ver api/register.js).
  // No tocan el perfil hasta que un admin aprueba acá.
  const doFetchClaims = useCallback(async (tok) => {
    try {
      const r = await fetch(`${API_BASE}/api/admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` },
        body: JSON.stringify({ action: 'list-claims' }),
      });
      if (!r.ok) return;
      const data = await r.json();
      setClaims(Array.isArray(data.claims) ? data.claims : []);
    } catch (err) {
      console.error('list-claims error:', err);
    }
  }, []);

  const handleClaimAction = async (claim_id, action) => {
    setMsg('');
    try {
      const r = await fetch(`${API_BASE}/api/admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, claim_id }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Failed');
      setMsg(action === 'approve-claim' ? '✅ Reclamo aprobado — owner vinculado' : '❌ Reclamo rechazado');
      doFetchClaims(token);
      if (action === 'approve-claim') doFetchProfiles(token); // el perfil ahora tiene owner
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg('❌ ' + err.message);
    }
  };

  // On mount: if already have token, fetch profiles + claims
  useEffect(() => {
    const t = getToken();
    if (t) {
      setIsAuthenticated(true);
      doFetchProfiles(t);
      doFetchClaims(t);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: passInput }),
      });
      const data = await r.json();
      if (r.ok && data.token) {
        localStorage.setItem('admin_token', data.token);
        setToken(data.token);
        setIsAuthenticated(true);
        setMsg('✅ Acceso concedido');
        // Fetch profiles + claims with the new token
        await doFetchProfiles(data.token);
        doFetchClaims(data.token);
      } else {
        setMsg('❌ Secret incorrecto');
        setLoading(false);
      }
    } catch {
      setMsg('❌ Error de conexión');
      setLoading(false);
    }
  };

  const handleAction = async (profileId, action) => {
    setMsg('');
    try {
      const body = { profileId, action };
      if (action === 'delete') {
        body.secret = document.getElementById('admin-delete-secret')?.value || '';
      }
      const r = await fetch(`${API_BASE}/api/admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Failed');

      const labels = { approve: '✅ Aprobado', reject: '❌ Rechazado', delete: '🗑️ Eliminado' };
      setMsg(labels[action] || 'OK');
      doFetchProfiles(token);
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg('❌ ' + err.message);
    }
  };

  const openEditor = async (pid) => {
    setMsg('');
    try {
      const r = await fetch(`${API_BASE}/api/admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'get-profile', profile_id: pid }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Error');
      setEditing(data);
    } catch (e) { setMsg('❌ ' + e.message); }
  };

  const saveField = async (pid, fields) => {
    try {
      const r = await fetch(`${API_BASE}/api/admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'edit-profile', profile_id: pid, fields }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Error');
      setMsg('✅ Guardado');
      setTimeout(() => setMsg(''), 2500);
      return true;
    } catch (e) { setMsg('❌ ' + e.message); return false; }
  };

  const deletePhoto = async (photo_id) => {
    if (!window.confirm('¿Borrar esta foto permanentemente?')) return;
    try {
      const r = await fetch(`${API_BASE}/api/admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'delete-photo', photo_id }),
      });
      if (!r.ok) throw new Error('Error al borrar');
      setEditing(e => ({ ...e, photos: e.photos.filter(p => p.id !== photo_id) }));
      setMsg('✅ Foto borrada');
      setTimeout(() => setMsg(''), 2500);
    } catch (e) { setMsg('❌ ' + e.message); }
  };

  const setCover = async (photo_id, profile_id) => {
    try {
      const r = await fetch(`${API_BASE}/api/admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'set-cover', photo_id, profile_id }),
      });
      if (!r.ok) throw new Error('Error al poner portada');
      setEditing(e => ({ ...e, photos: e.photos.map(p => ({ ...p, local_path: p.id === photo_id ? 'cover' : '' })) }));
      setMsg('✅ Portada actualizada');
      setTimeout(() => setMsg(''), 2500);
    } catch (e) { setMsg('❌ ' + e.message); }
  };

  const uploadCrop = async (photo_id, blob) => {
    setCropSrc(null);
    try {
      const b = '----H' + Math.random().toString(16).slice(2);
      const fd = (n, v) => `--${b}\r\nContent-Disposition: form-data; name="${n}"\r\n\r\n${v}\r\n`;
      const head = fd('photo_id', photo_id) + fd('token', token);
      const body = new Blob([head, blob, `\r\n--${b}--\r\n`]);
      const r = await fetch(`${API_BASE}/api/admin?action=upload-photo`, {
        method: 'POST',
        headers: { 'Content-Type': `multipart/form-data; boundary=${b}` },
        body,
      });
      if (!r.ok) throw new Error('Error al subir recorte');
      setMsg('✅ Miniatura recortada y guardada');
      setTimeout(() => setMsg(''), 3000);
    } catch (e) { setMsg('❌ ' + e.message); }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
    setIsAuthenticated(false);
    setProfiles([]);
    setClaims([]);
    setPassInput('');
    setMsg('Sesión cerrada');
  };

  // Login form — no password on frontend
  if (!isAuthenticated) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div className="glass-card" style={{ padding: '2.5rem', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          <h1 style={{ marginBottom: '1.5rem' }}>🔐 Admin Panel</h1>
          {msg && <p style={{ color: msg.startsWith('✅') ? '#22c55e' : '#ef4444', marginBottom: '1rem' }}>{msg}</p>}
          <form onSubmit={handleLogin}>
            <input
              type="password"
              className="search-input"
              placeholder="Secret de admin"
              value={passInput}
              onChange={e => setPassInput(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem', marginBottom: '1rem' }}
              autoComplete="current-password"
              autoFocus
            />
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? '...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

  const pending = profiles.filter(p => p.cam_chat !== 'approved' && p.cam_chat !== 'rejected');
  const approved = profiles.filter(p => p.cam_chat === 'approved');
  const rejected = profiles.filter(p => p.cam_chat === 'rejected');
  const pendingClaims = claims.filter(c => c.status === 'pending');
  const resolvedClaims = claims.filter(c => c.status !== 'pending');

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title" style={{ textAlign: 'left' }}>🔧 Admin Panel</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {profiles.length} perfiles · {pending.length} pendientes · {approved.length} aprobados
            {pendingClaims.length > 0 && <> · <strong style={{ color: '#f59e0b' }}>{pendingClaims.length} reclamos sin revisar</strong></>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => { doFetchProfiles(token); doFetchClaims(token); }} className="btn" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)' }}>
            <RefreshCw size={16} style={{ marginRight: '0.5rem' }} /> Refrescar
          </button>
          <button onClick={handleLogout} className="btn" style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
            <LogOut size={16} style={{ marginRight: '0.25rem' }} /> Salir
          </button>
        </div>
      </div>

      {msg && (
        <div style={{ background: msg.startsWith('✅') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: msg.startsWith('✅') ? '#22c55e' : '#ef4444', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
          {msg}
        </div>
      )}

      {/* Reclamos — alguien dice que un perfil ya publicado es suyo. Nadie
          queda vinculada como owner hasta que se apruebe acá. */}
      {pendingClaims.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: '#f59e0b' }}>🏳️‍⚧️ Reclamos pendientes ({pendingClaims.length})</h2>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {pendingClaims.map(c => (
              <ClaimCard key={c.id} claim={c} onAction={handleClaimAction} />
            ))}
          </div>
        </div>
      )}
      {resolvedClaims.length > 0 && (
        <details style={{ marginBottom: '2rem' }}>
          <summary style={{ cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
            Reclamos resueltos ({resolvedClaims.length})
          </summary>
          <div style={{ display: 'grid', gap: '0.75rem', marginTop: '0.75rem', opacity: 0.7 }}>
            {resolvedClaims.map(c => (
              <ClaimCard key={c.id} claim={c} onAction={handleClaimAction} />
            ))}
          </div>
        </details>
      )}

      {/* Pending */}
      {pending.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: '#f59e0b' }}>⏳ Pendientes ({pending.length})</h2>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {pending.map(p => (
              <ProfileCard key={p.id} profile={p} onAction={handleAction} onEdit={openEditor} />
            ))}
          </div>
        </div>
      )}

      {/* Approved */}
      {approved.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: '#22c55e' }}>✅ Aprobados ({approved.length})</h2>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {approved.map(p => (
              <ProfileCard key={p.id} profile={p} onAction={handleAction} onEdit={openEditor} />
            ))}
          </div>
        </div>
      )}

      {/* Rejected */}
      {rejected.length > 0 && (
        <div>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: '#ef4444' }}>❌ Rechazados ({rejected.length})</h2>
          <div style={{ display: 'grid', gap: '0.75rem', opacity: 0.7 }}>
            {rejected.map(p => (
              <ProfileCard key={p.id} profile={p} onAction={handleAction} onEdit={openEditor} />
            ))}
          </div>
        </div>
      )}

      {/* ── Editor de perfil (modal) ── */}
      {editing && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(5,3,15,0.92)', backdropFilter: 'blur(8px)', overflowY: 'auto', padding: '2rem 1rem' }}
             onClick={(e) => { if (e.target === e.currentTarget) setEditing(null); }}>
          <div className="glass-card" style={{ maxWidth: 820, margin: '0 auto', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0 }}>✏️ Editar: {editing.profile.name}</h2>
              <button className="btn" onClick={() => setEditing(null)}>Cerrar</button>
            </div>
            <ProfileEditor profile={editing.profile} photos={editing.photos} token={token} apiBase={API_BASE}
              saveField={saveField} deletePhoto={deletePhoto} setCover={setCover} onCrop={(src) => setCropSrc(src)} />
          </div>
        </div>
      )}
      {cropSrc && (
        <PhotoCropModal
          src={cropSrc.src}
          onApply={(blob) => uploadCrop(cropSrc.photoId, blob)}
          onClose={() => setCropSrc(null)}
        />
      )}
      {profiles.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          No hay perfiles todavía.
        </div>
      )}
    </div>
  );
}

function ProfileCard({ profile, onAction, onEdit }) {
  const s = () => {
    if (profile.cam_chat === 'approved') return { label: '✅', color: '#22c55e' };
    if (profile.cam_chat === 'rejected') return { label: '❌', color: '#ef4444' };
    return { label: '⏳', color: '#f59e0b' };
  };
  const status = s();

  return (
    <div className="glass-card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
      <span style={{ fontSize: '1.5rem' }}>{status.label}</span>
      {onEdit && (
        <button onClick={() => onEdit(profile.id)} className="btn" title="Editar perfil" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)', padding: '0.4rem 0.6rem' }}>
          <Pencil size={15} />
        </button>
      )}
      <div style={{ flex: 1, minWidth: '200px' }}>
        <strong style={{ fontSize: '1.1rem' }}>{profile.name}</strong>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {profile.location || 'Sin ubicación'} · {profile.phone || 'Sin teléfono'} · {profile.email}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          {profile.bio ? profile.bio.slice(0, 120) + (profile.bio.length > 120 ? '...' : '') : 'Sin bio'}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <a href={`/profile/${profile.id}`} target="_blank" rel="noopener noreferrer"
          className="btn" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', padding: '0.4rem 0.8rem', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
          <ExternalLink size={14} /> Ver
        </a>
        {profile.cam_chat !== 'approved'
          ? <button onClick={() => onAction(profile.id, 'approve')} className="btn"
              style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
              <CheckCircle2 size={14} style={{ marginRight: '0.25rem' }} /> Aprobar
            </button>
          : null}
        {profile.cam_chat !== 'rejected'
          ? <button onClick={() => onAction(profile.id, 'reject')} className="btn"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              title="Reject profile">
              <XCircle size={14} style={{ marginRight: '0.25rem' }} /> Rechazar
            </button>
          : null}
        <button onClick={() => {
          if (confirm(`¿Eliminar el perfil "${profile.name}"? Esta acción no se puede deshacer.`)) {
            onAction(profile.id, 'delete');
          }
        }} className="btn"
          style={{ background: 'transparent', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
          title="Delete profile">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// Un reclamo: alguien dice que un perfil ya publicado es suyo. Mostramos el
// perfil reclamado (expand.profile), quién lo reclama (expand.claimant_user)
// y la evidencia que cargó (nombre/email/tel/whatsapp del form). Aprobar
// vincula owner=claimant_user en el perfil (api/admin.js → approve-claim);
// nada se toca hasta ese click.
function ClaimCard({ claim, onAction }) {
  const profile = claim.expand?.profile;
  const claimant = claim.expand?.claimant_user;
  const isPending = claim.status === 'pending';
  const statusLabel = { pending: '⏳ pendiente', approved: '✅ aprobado', rejected: '❌ rechazado' }[claim.status] || claim.status;

  return (
    <div className="glass-card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: '240px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <strong style={{ fontSize: '1.05rem' }}>
            Reclama: {profile?.name || `perfil ${claim.profile}`}
          </strong>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>({statusLabel})</span>
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {profile?.location || ''}{profile ? ' · ' : ''}
          Cuenta nueva: {claimant?.email || claim.claimant_user}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.4rem', whiteSpace: 'pre-wrap', background: 'rgba(255,255,255,0.03)', padding: '0.5rem 0.6rem', borderRadius: '0.4rem' }}>
          {claim.evidence || 'Sin datos adicionales.'}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {claim.profile && (
          <a href={`/profile/${claim.profile}`} target="_blank" rel="noopener noreferrer"
            className="btn" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', padding: '0.4rem 0.8rem', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <ExternalLink size={14} /> Ver perfil
          </a>
        )}
        {isPending && (
          <>
            <button onClick={() => onAction(claim.id, 'approve-claim')} className="btn"
              style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
              <CheckCircle2 size={14} style={{ marginRight: '0.25rem' }} /> Aprobar
            </button>
            <button onClick={() => {
              if (confirm('¿Rechazar este reclamo?')) onAction(claim.id, 'reject-claim');
            }} className="btn"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
              <XCircle size={14} style={{ marginRight: '0.25rem' }} /> Rechazar
            </button>
          </>
        )}
      </div>
    </div>
  );
}


function ProfileEditor({ profile, photos, saveField, deletePhoto, setCover, onCrop }) {
  const [form, setForm] = useState({
    name: profile.name || '',
    bio: profile.bio || '',
    location: profile.location || '',
    phone: profile.phone || '',
    email: profile.email || '',
    age: profile.age || '',
    height: profile.height || '',
    weight: profile.weight || '',
    nationality: profile.nationality || '',
  });
  const [saving, setSaving] = useState(false);
  const upd = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const guardar = async () => {
    setSaving(true);
    await saveField(profile.id, form);
    setSaving(false);
  };

  const fileUrl = (ph) => {
    if (ph.file && ph.profile_id) {
      // Las fotos viven en el API de PocketBase (api.shemalewiki.online), no en el dominio del frontend
      const h = window.location.hostname;
      const apiBase = /shemalewiki\.online$/.test(h) ? 'https://api.shemalewiki.online'
        : /buscatrans\.com$/.test(h) ? 'https://api.shemalewiki.online'
        : `https://api.${h.replace(/^www\./, '')}`;
      return `${apiBase}/api/files/photos/${ph.id}/${ph.file}`;
    }
    return ph.photo_url;
  };

  return (
    <div>
      {/* Campos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
        <label style={{ fontSize: '0.85rem' }}>Nombre
          <input className="search-input" style={{ width: '100%', marginTop: '0.25rem' }} value={form.name} onChange={upd('name')} />
        </label>
        <label style={{ fontSize: '0.85rem' }}>Ubicación (provincia)
          <input className="search-input" style={{ width: '100%', marginTop: '0.25rem' }} value={form.location} onChange={upd('location')} />
        </label>
        <label style={{ fontSize: '0.85rem' }}>Teléfono
          <input className="search-input" style={{ width: '100%', marginTop: '0.25rem' }} value={form.phone} onChange={upd('phone')} />
        </label>
        <label style={{ fontSize: '0.85rem' }}>Email
          <input className="search-input" style={{ width: '100%', marginTop: '0.25rem' }} value={form.email} onChange={upd('email')} />
        </label>
        <label style={{ fontSize: '0.85rem' }}>Edad
          <input className="search-input" style={{ width: '100%', marginTop: '0.25rem' }} value={form.age} onChange={upd('age')} />
        </label>
        <label style={{ fontSize: '0.85rem' }}>Nacionalidad
          <input className="search-input" style={{ width: '100%', marginTop: '0.25rem' }} value={form.nationality} onChange={upd('nationality')} />
        </label>
      </div>
      <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '1rem' }}>Bio
        <textarea className="search-input" rows={4} style={{ width: '100%', marginTop: '0.25rem' }} value={form.bio} onChange={upd('bio')} />
      </label>
      <button className="btn btn-primary" onClick={guardar} disabled={saving} style={{ marginBottom: '1.5rem' }}>
        {saving ? 'Guardando...' : '💾 Guardar cambios'}
      </button>

      {/* Fotos */}
      <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>
        📷 Fotos ({photos.length}) — la que tiene ⭐ es la miniatura del listado
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' }}>
        {photos.map(ph => {
          const isCover = ph.local_path === 'cover';
          const url = fileUrl(ph);
          return (
            <div key={ph.id} style={{
              border: isCover ? '2px solid #f59e0b' : '1px solid var(--glass-border)',
              borderRadius: '0.6rem', overflow: 'hidden', background: 'rgba(255,255,255,0.03)',
            }}>
              <img src={url} alt="" style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }} />
              <div style={{ padding: '0.4rem', display: 'flex', gap: '0.3rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                {isCover && <span style={{ fontSize: '0.7rem', color: '#f59e0b', width: '100%', textAlign: 'center' }}>⭐ PORTADA</span>}
                <button className="btn" title="Recortar miniatura" onClick={() => onCrop({ src: url, photoId: ph.id })}
                        style={{ padding: '0.3rem 0.45rem', fontSize: '0.8rem' }}>✂️</button>
                {!isCover && (
                  <button className="btn" title="Poner como portada" onClick={() => setCover(ph.id, profile.id)}
                          style={{ padding: '0.3rem 0.45rem', fontSize: '0.8rem' }}>⭐</button>
                )}
                <button className="btn" title="Borrar foto" onClick={() => deletePhoto(ph.id)}
                        style={{ padding: '0.3rem 0.45rem', fontSize: '0.8rem', color: '#ef4444' }}>🗑️</button>
              </div>
            </div>
          );
        })}
      </div>
      {photos.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>Este perfil no tiene fotos.</p>}
    </div>
  );
}