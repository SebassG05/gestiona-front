import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion as Motion, useIsPresent, useReducedMotion } from 'framer-motion';
import { AlertCircle, ArrowLeftRight, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, ClipboardList, Clock3, FolderOpen, ListChecks, LoaderCircle, Pencil, Plus, Search, SlidersHorizontal, Trash2, X } from 'lucide-react';
import { useParams } from 'react-router-dom';
import PortalSidebar from './PortalSidebar.jsx';
import { deleteValuation, getValuations, saveValuation } from '../services/proposalValuationService.js';
import './PortalValuationsPage.css';

const primaryButton = 'inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:from-orange-700 hover:to-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 disabled:cursor-not-allowed disabled:opacity-50';
const secondaryButton = 'inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-orange-200 bg-white px-4 py-2.5 text-sm font-semibold text-orange-800 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-40';
const inputClass = 'min-w-0 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-orange-950 outline-none transition placeholder:text-stone-400 hover:border-orange-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100';
const numberFormat = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 });
const formatScore = (value) => value === null || value === undefined ? '—' : numberFormat.format(value);
const normalize = (value) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const emptyForm = () => ({ proposal: '', year: new Date().getFullYear(), summary: '', excellence: '', impact: '', quality: '', expectedEvaluation: '', call: '', folder: '', notes: '' });
const ease = [0.22, 1, 0.36, 1];

function TextDisclosure({ children, preview = false, label = 'Leer más', closeLabel = 'Mostrar menos' }) {
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();
  const reducedMotion = useReducedMotion();

  return (
    <div className="valuation-disclosure" data-expanded={expanded}>
      <Motion.div id={contentId} initial={false} animate={{ height: expanded ? 'auto' : preview ? 48 : 0, opacity: expanded || preview ? 1 : 0 }} transition={{ duration: reducedMotion ? 0 : 0.28, ease }} className={`overflow-hidden ${preview && !expanded ? 'valuation-text-preview' : ''}`} aria-hidden={!preview && !expanded}>
        {children}
      </Motion.div>
      <button type="button" aria-expanded={expanded} aria-controls={contentId} onClick={() => setExpanded((value) => !value)} className="mt-1 inline-flex cursor-pointer items-center gap-1.5 rounded-lg py-1 text-left text-xs font-semibold text-orange-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400">
        {expanded ? closeLabel : label}<ChevronDown size={14} className="valuation-disclosure-chevron shrink-0" />
      </button>
    </div>
  );
}

function LongText({ text }) {
  if (!text) return <span className="text-stone-400">—</span>;
  if (text.length < 115) return <p className="whitespace-pre-wrap break-words leading-6">{text}</p>;
  return (
    <TextDisclosure preview><p className="whitespace-pre-wrap break-words leading-6">{text}</p></TextDisclosure>
  );
}

function ScoreBadge({ row, field }) {
  const value = row[field];
  const isTotal = field === 'total';
  const criteriaCount = ['excellence', 'impact', 'quality'].filter((criterion) => row[criterion] != null).length;
  return (
    <div className="inline-flex min-w-14 flex-col items-center gap-1.5">
      <span className={`inline-flex min-w-12 justify-center rounded-lg px-2 py-1.5 font-semibold tabular-nums ${value == null ? 'text-stone-400' : isTotal ? 'bg-orange-100 text-orange-900 ring-1 ring-inset ring-orange-200/60' : 'text-stone-700'}`} aria-label={value == null ? 'Sin puntuación' : undefined}>{formatScore(value)}</span>
      {value != null && (isTotal ? <span className="whitespace-nowrap text-[10px] text-stone-500">{criteriaCount} {criteriaCount === 1 ? 'criterio' : 'criterios'}</span> : <span aria-hidden="true" className="h-1 w-10 overflow-hidden rounded-full bg-stone-100"><span className="block h-full rounded-full bg-orange-400" style={{ width: `${Math.max(0, Math.min(100, Number(value) * 20))}%` }} /></span>)}
    </div>
  );
}

function ValuationDialog({ children, titleId, onClose, busy, className = '' }) {
  const dialogRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const isPresent = useIsPresent();

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  return (
    <Motion.dialog ref={dialogRef} aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }} initial={{ opacity: 0, y: reducedMotion ? 0 : 20, scale: reducedMotion ? 1 : 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: reducedMotion ? 0 : 12, scale: reducedMotion ? 1 : 0.98 }} transition={{ duration: reducedMotion ? 0 : 0.22, ease }} data-closing={!isPresent} className={`valuation-dialog fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-3xl border border-orange-100 bg-white p-0 text-orange-950 shadow-2xl backdrop:bg-orange-950/35 backdrop:backdrop-blur-sm ${className}`}>
      <div inert={!isPresent}>{children}</div>
    </Motion.dialog>
  );
}

function ValuationForm({ row, portalId, folders, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({ ...emptyForm(), ...row }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const scores = ['excellence', 'impact', 'quality'].map((field) => form[field]).filter((value) => value !== '' && value !== null && value !== undefined);
  const total = scores.length ? Math.round(scores.reduce((sum, value) => sum + Number(value), 0) * 100) / 100 : null;

  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;
    setError('');
    setSaving(true);
    try {
      const saved = await saveValuation(portalId, form, row?.id);
      onSaved(saved);
    } catch (saveError) {
      setError(saveError.response?.data?.message || 'No se ha podido guardar. Tus datos siguen aquí; vuelve a intentarlo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ValuationDialog titleId="valuation-form-title" onClose={onClose} busy={saving} className="max-w-3xl">
      <form onSubmit={submit}>
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-orange-100 bg-orange-50 px-6 py-5">
          <div>
            <h2 id="valuation-form-title" className="text-xl font-bold">{row?.id ? 'Editar valoración' : 'Nueva valoración'}</h2>
            <p className="mt-1 text-sm text-stone-600">Añade los datos de la propuesta y sus puntuaciones.</p>
            <p className="mt-2 text-xs text-orange-800">Los campos con * son obligatorios.</p>
          </div>
          <button type="button" aria-label="Cerrar formulario" disabled={saving} onClick={onClose} className="rounded-lg p-2 text-stone-500 hover:bg-orange-50 disabled:opacity-40"><X size={20} /></button>
        </div>
        <fieldset disabled={saving} className="grid gap-5 p-6 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-semibold">Propuesta <span className="text-orange-600">*</span><input autoFocus required maxLength={250} name="proposal" value={form.proposal} onChange={change} placeholder="Nombre o acrónimo" className={inputClass} /></label>
          <label className="space-y-2 text-sm font-semibold">Año de la convocatoria <span className="text-orange-600">*</span><input required type="number" min="1900" max="2100" step="1" name="year" value={form.year} onChange={change} className={inputClass} /></label>
          <label className="space-y-2 text-sm font-semibold sm:col-span-2">Resumen de objetivos (ES)<textarea rows={3} maxLength={10000} name="summary" value={form.summary} onChange={change} placeholder="Describe los objetivos principales de la propuesta…" className={inputClass} /></label>
          <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4 sm:col-span-2">
            <p className="mb-3 text-sm font-bold">Puntuaciones de evaluación</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[['excellence', 'Excellence'], ['impact', 'Impact'], ['quality', 'Calidad']].map(([field, label]) => (
                <label key={field} className="space-y-2 text-xs font-semibold">{label}<input type="number" min="0" max="5" step="0.01" name={field} value={form[field] ?? ''} onChange={change} placeholder="Sin puntuar" className={inputClass} /></label>
              ))}
              <div className="space-y-2 text-xs font-semibold"><span>Total automático</span><output aria-live="polite" className="flex min-h-11 items-center rounded-xl bg-orange-100 px-3 text-lg font-bold text-orange-700">{formatScore(total)}</output></div>
            </div>
            <p className="mt-3 text-xs leading-5 text-orange-800/75">De 0 a 5 por criterio. Deja vacíos los criterios sin evaluar. En la primera etapa, Calidad puede quedar vacía.</p>
          </div>
          <label className="space-y-2 text-sm font-semibold sm:col-span-2">Evaluación esperada <span className="font-normal text-stone-500">(opcional)</span><textarea rows={2} name="expectedEvaluation" maxLength={1000} value={form.expectedEvaluation ?? ''} onChange={change} placeholder="Fecha prevista, puntuación estimada o previsión de resultados…" className={inputClass} /></label>
          <label className="space-y-2 text-sm font-semibold">Convocatoria (código)<input name="call" maxLength={500} value={form.call} onChange={change} placeholder="HORIZON-…" className={inputClass} /></label>
          <label className="space-y-2 text-sm font-semibold">Carpeta<input name="folder" maxLength={250} list="valuation-folders" value={form.folder} onChange={change} placeholder="Ej. CL6, Misión Suelo…" className={inputClass} /><datalist id="valuation-folders">{folders.map((folder) => <option key={folder} value={folder} />)}</datalist></label>
          <label className="space-y-2 text-sm font-semibold sm:col-span-2">Notas<textarea rows={3} name="notes" maxLength={10000} value={form.notes} onChange={change} placeholder="Observaciones, etapa de evaluación o información pendiente…" className={inputClass} /></label>
        </fieldset>
        {error && <p role="alert" className="mx-6 mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="sticky bottom-0 flex flex-wrap justify-end gap-3 border-t border-orange-100 bg-white px-6 py-4">
          <button type="button" onClick={onClose} disabled={saving} className={secondaryButton}>Cancelar</button>
          <button type="submit" disabled={saving} className={primaryButton}>{saving ? <LoaderCircle size={17} className="animate-spin" /> : row?.id ? <CheckCircle2 size={17} /> : <Plus size={17} />}{saving ? 'Guardando…' : row?.id ? 'Guardar cambios' : 'Añadir valoración'}</button>
        </div>
      </form>
    </ValuationDialog>
  );
}

function ValuationsContent({ portalId }) {
  const reducedMotion = useReducedMotion();
  const [data, setData] = useState({ rows: [], notes: [] });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [retry, setRetry] = useState(0);
  const [search, setSearch] = useState('');
  const [year, setYear] = useState('');
  const [folder, setFolder] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('original');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [success, setSuccess] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const tableScrollRef = useRef(null);
  const dragState = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    getValuations(portalId, controller.signal).then((payload) => {
      if (!controller.signal.aborted) { setData(payload); setLoading(false); }
    }).catch((error) => {
      if (!controller.signal.aborted) { setLoadError(error.response?.data?.message || 'No se pudieron cargar las valoraciones.'); setLoading(false); }
    });
    return () => controller.abort();
  }, [portalId, retry]);

  const folders = [...new Set(data.rows.map((row) => row.folder).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
  const years = [...new Set(data.rows.map((row) => row.year))].sort((a, b) => b - a);
  const evaluated = data.rows.filter((row) => row.total !== null).length;
  const activeFilters = [
    search.trim() && { label: `Búsqueda: ${search.trim()}`, clear: () => setSearch('') },
    year && { label: `Año: ${year}`, clear: () => setYear('') },
    folder && { label: `Carpeta: ${folder}`, clear: () => setFolder('') },
    status && { label: status === 'pending' ? 'Sin puntuación' : 'Con puntuación', clear: () => setStatus('') },
  ].filter(Boolean);
  const filtered = useMemo(() => {
    const term = normalize(search.trim());
    const rows = data.rows.filter((row) => (!year || String(row.year) === year)
      && (!folder || row.folder === folder)
      && (!status || (status === 'pending' ? row.total === null : row.total !== null))
      && (!term || [row.proposal, row.summary, row.expectedEvaluation, row.call, row.folder, row.notes, row.year].some((value) => normalize(value).includes(term))));
    if (sort === 'name') rows.sort((a, b) => a.proposal.localeCompare(b.proposal, 'es'));
    if (sort === 'year') rows.sort((a, b) => b.year - a.year);
    if (sort === 'score') rows.sort((a, b) => (b.total ?? -1) - (a.total ?? -1));
    return rows;
  }, [data.rows, search, year, folder, status, sort]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / 15));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * 15, currentPage * 15);
  const resetFilters = () => { setSearch(''); setYear(''); setFolder(''); setStatus(''); setPage(1); };
  const filterChange = (setter) => (event) => { setter(event.target.value); setPage(1); };
  const openForm = (row = {}) => { setSuccess(''); setEditing(row); };
  const saved = (row) => {
    const isEdit = Boolean(editing?.id);
    setData((current) => ({ ...current, rows: isEdit ? current.rows.map((item) => item.id === row.id ? row : item) : [row, ...current.rows] }));
    setEditing(null);
    if (!isEdit) { resetFilters(); setSort('original'); }
    setSuccess(isEdit ? 'Valoración actualizada correctamente.' : `La propuesta ${row.proposal} se ha añadido y guardado en el portal.`);
  };
  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteValuation(portalId, deleteTarget.id);
      setData((current) => ({ ...current, rows: current.rows.filter((item) => item.id !== deleteTarget.id) }));
      setDeleteTarget(null);
      setSuccess(`La fila de ${deleteTarget.proposal} se ha eliminado.`);
      setPage(1);
    } catch (requestError) {
      setDeleteError(requestError.response?.data?.message || 'No se ha podido eliminar la fila. Vuelve a intentarlo.');
    } finally {
      setDeleting(false);
    }
  };
  const handleTablePointerDown = useCallback((event) => {
    // Touch devices use native scrolling, including gestures over expanded text.
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    if (event.target.closest('button, input, select, textarea, a, summary, details, .valuation-disclosure')) return;
    const element = tableScrollRef.current;
    if (!element || element.scrollWidth <= element.clientWidth) return;
    dragState.current = { pointerId: event.pointerId, startX: event.clientX, startScrollLeft: element.scrollLeft, moved: false };
    element.setPointerCapture?.(event.pointerId);
  }, []);
  const handleTablePointerMove = useCallback((event) => {
    const drag = dragState.current;
    const element = tableScrollRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !element) return;
    const distance = event.clientX - drag.startX;
    if (Math.abs(distance) > 3) drag.moved = true;
    element.scrollLeft = drag.startScrollLeft - distance;
    if (drag.moved) event.preventDefault();
  }, []);
  const finishTablePointer = useCallback((event) => {
    if (dragState.current?.pointerId === event.pointerId) {
      tableScrollRef.current?.releasePointerCapture?.(event.pointerId);
      dragState.current = null;
    }
  }, []);

  return (
    <main className="valuations-page min-h-screen bg-stone-50/70 px-4 pb-8 pt-20 text-orange-950 sm:px-6 lg:py-8">
      <div className="mx-auto flex max-w-[1700px] flex-col gap-6">
        <header className="valuation-enter relative overflow-hidden rounded-[26px] border border-orange-100 bg-white p-6 shadow-[0_18px_45px_rgba(255,96,26,0.06)] sm:p-8">
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-32 h-80 w-80 rounded-full border-[45px] border-orange-50/70" />
          <div className="relative flex flex-col justify-between gap-6 xl:flex-row xl:items-center">
            <div className="max-w-2xl">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-orange-600"><ListChecks size={17} /> Seguimiento de propuestas</p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Valoraciones</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-stone-600">Consulta los resultados de tus propuestas, compara los criterios de evaluación y conserva lo aprendido para la próxima convocatoria.</p>
            </div>
            <button type="button" disabled={loading || Boolean(loadError)} onClick={() => openForm()} className={`${primaryButton} shrink-0 self-start xl:self-center`}><Plus size={18} /> Nueva valoración</button>
          </div>
          <div className="relative mt-7 grid grid-cols-2 gap-3 xl:grid-cols-4">
            {[
              { label: 'Propuestas registradas', value: data.rows.length, icon: ClipboardList, tone: 'orange', hint: 'Histórico del portal' },
              { label: 'Con puntuación', value: evaluated, icon: ListChecks, tone: 'green', hint: 'Al menos un criterio evaluado' },
              { label: 'Sin puntuación', value: data.rows.length - evaluated, icon: Clock3, tone: 'amber', hint: 'Sin criterios evaluados' },
              { label: 'Carpetas', value: folders.length, icon: FolderOpen, tone: 'violet', hint: 'Organización de propuestas' },
            ].map(({ label, value, icon: Icon, tone, hint }) => (
              <div key={label} data-tone={tone} className="valuation-stat min-w-0 rounded-2xl border p-3 sm:p-4">
                <div className="flex items-center justify-between gap-2"><p className="text-xs font-semibold leading-5 text-stone-600">{label}</p><span className="valuation-stat-icon shrink-0 rounded-lg p-2"><Icon size={17} aria-hidden="true" /></span></div>
                <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">{loading || loadError ? '—' : value}</p>
                <p className="mt-1 text-[11px] leading-5 text-stone-500">{hint}</p>
              </div>
            ))}
          </div>
        </header>

        <AnimatePresence initial={false}>
          {success && <Motion.div key={success} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: reducedMotion ? 0 : 0.2 }} className="overflow-hidden"><div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><CheckCircle2 size={19} aria-hidden="true" className="mt-0.5 shrink-0" /><p role="status" className="flex-1 leading-6">{success}</p><button type="button" aria-label="Cerrar aviso" onClick={() => setSuccess('')} className="rounded-lg p-1 hover:bg-emerald-100"><X size={17} /></button></div></Motion.div>}
        </AnimatePresence>

        <section aria-labelledby="valuations-table-title" className="valuation-enter valuation-register min-w-0 overflow-hidden rounded-[26px] border border-orange-100 bg-white shadow-[0_16px_40px_rgba(255,96,26,0.05)]">
          <div className="border-b border-orange-100 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h2 id="valuations-table-title" className="text-xl font-bold">Registro de valoraciones <span className="ml-2 rounded-lg bg-orange-50 px-2 py-1 text-sm text-orange-600">{loading || loadError ? '—' : data.rows.length}</span></h2><p className="mt-2 text-sm text-stone-500">Objetivos, convocatorias y resultados en un mismo lugar.</p></div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-medium text-stone-600"><FolderOpen size={14} aria-hidden="true" /> Registro compartido</span>
            </div>
            <div className="mt-5 rounded-2xl border border-stone-100 bg-stone-50/80 p-3 sm:p-4">
              <label className="relative block"><span className="sr-only">Buscar valoraciones</span><Search size={18} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-3 text-stone-400" /><input type="search" value={search} onChange={filterChange(setSearch)} placeholder="Buscar propuesta, convocatoria u objetivos…" className={`${inputClass} pl-11`} /></label>
              <div className="valuation-filters mt-3 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <label><span>Año</span><select aria-label="Filtrar por año" value={year} onChange={filterChange(setYear)} className={inputClass}><option value="">Todos los años</option>{years.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
                <label><span>Carpeta</span><select aria-label="Filtrar por carpeta" value={folder} onChange={filterChange(setFolder)} className={inputClass}><option value="">Todas las carpetas</option>{folders.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
                <label><span>Evaluación</span><select aria-label="Filtrar por evaluación" value={status} onChange={filterChange(setStatus)} className={inputClass}><option value="">Todas las evaluaciones</option><option value="evaluated">Con puntuación</option><option value="pending">Sin puntuación</option></select></label>
                <label><span>Ordenar por</span><select aria-label="Ordenar valoraciones" value={sort} onChange={filterChange(setSort)} className={inputClass}><option value="original">Orden del registro</option><option value="name">Propuesta A–Z</option><option value="year">Año más reciente</option><option value="score">Mayor total</option></select></label>
              </div>
            </div>
            {activeFilters.length > 0 && <div className="mt-3 flex flex-wrap items-center gap-2"><SlidersHorizontal size={15} aria-hidden="true" className="text-orange-600" /><span className="sr-only">Filtros activos</span>{activeFilters.map(({ label, clear }) => <button key={label} type="button" aria-label={`Quitar filtro: ${label}`} onClick={() => { clear(); setPage(1); }} className="inline-flex max-w-full items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1.5 text-xs font-medium text-orange-800 hover:bg-orange-100"><span className="truncate">{label}</span><X size={13} className="shrink-0" /></button>)}<button type="button" onClick={resetFilters} className="rounded-lg px-2 py-1.5 text-xs font-semibold text-stone-600 underline decoration-stone-300 underline-offset-4 hover:text-orange-700">Limpiar filtros</button></div>}
          </div>
          {loading ? <div role="status" className="p-6"><p className="mb-5 flex items-center gap-2 text-sm text-stone-600"><LoaderCircle size={18} className="animate-spin text-orange-500" /> Cargando valoraciones…</p><div aria-hidden="true" className="space-y-3">{[0, 1, 2, 3].map((row) => <div key={row} className="grid animate-pulse grid-cols-[1fr_2fr_1fr] gap-4 rounded-xl border border-stone-100 p-4"><span className="h-4 rounded bg-orange-100/70" /><span className="h-4 rounded bg-stone-100" /><span className="h-4 rounded bg-stone-100" /></div>)}</div></div>
            : loadError ? <div role="alert" className="space-y-4 px-6 py-12 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-red-500"><AlertCircle size={26} /></span><h3 className="font-bold">No se pudo abrir el registro</h3><p className="text-sm text-stone-600">{loadError}</p><button type="button" className={secondaryButton} onClick={() => { setLoading(true); setLoadError(''); setRetry((value) => value + 1); }}>Volver a intentar</button></div>
              : filtered.length === 0 ? <div className="px-6 py-12 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-orange-100 bg-orange-50 text-orange-500">{data.rows.length ? <Search size={26} /> : <ClipboardList size={26} />}</span><h3 className="mt-4 text-lg font-bold">{data.rows.length ? 'No encontramos coincidencias' : 'Tu primera valoración empieza aquí'}</h3><p className="mx-auto mb-5 mt-2 max-w-md text-sm leading-6 text-stone-600">{data.rows.length ? 'Prueba con otro término o elimina algún filtro para ampliar los resultados.' : 'Añade una propuesta y completa sus puntuaciones cuando recibas la evaluación.'}</p><button type="button" className={data.rows.length ? secondaryButton : primaryButton} onClick={data.rows.length ? resetFilters : () => openForm()}>{data.rows.length ? 'Limpiar filtros' : 'Añadir primera valoración'}</button></div>
                : <>
                  <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 sm:px-6"><p className="text-xs font-semibold text-stone-600" aria-live="polite">{filtered.length} {filtered.length === 1 ? 'valoración' : 'valoraciones'}{activeFilters.length > 0 ? ` de ${data.rows.length}` : ''}</p><p id="valuation-scroll-hint" className="flex items-center gap-2 text-xs text-stone-500"><ArrowLeftRight size={15} aria-hidden="true" className="shrink-0 text-orange-500" /> Desliza o arrastra para ver todas las columnas.</p></div>
                  <div ref={tableScrollRef} tabIndex={0} role="region" aria-label="Tabla de valoraciones" aria-describedby="valuation-scroll-hint" onPointerDown={handleTablePointerDown} onPointerMove={handleTablePointerMove} onPointerUp={finishTablePointer} onPointerCancel={finishTablePointer} className="gestiona-scrollbar max-h-[680px] cursor-grab touch-auto overflow-auto select-none focus-visible:outline-2 focus-visible:outline-orange-400 active:cursor-grabbing">
                    <table className="valuation-table w-full min-w-[1900px] border-separate border-spacing-0 text-left text-sm">
                      <caption className="sr-only">Valoraciones de propuestas, evaluación esperada y acciones para editar.</caption>
                      <thead className="sticky top-0 z-20"><tr>{['Propuesta', 'Año de la convocatoria', 'Resumen de objetivos (ES)', 'Excellence', 'Impact', 'Calidad', 'Total', 'Evaluación esperada', 'Convocatoria (código)', 'Carpeta', 'Notas', ''].map((label, index) => <th scope="col" key={label || 'actions'} className={`border-y border-orange-100 bg-orange-50 px-4 py-4 text-xs font-bold text-orange-900 ${index === 0 ? 'sticky left-0 z-30 min-w-44' : ''} ${!label ? 'sticky right-0 z-30 w-[112px] min-w-[112px]' : ''} ${index >= 3 && index <= 6 ? 'text-center' : ''}`}>{label || <span className="sr-only">Acciones</span>}</th>)}</tr></thead>
                      <tbody key={currentPage}>{visible.map((row, index) => <tr key={row.id} style={{ '--valuation-delay': `${Math.min(index, 7) * 25}ms` }} className="valuation-row group align-top">
                        <th scope="row" className="sticky left-0 z-10 w-48 border-b border-orange-100/70 bg-white px-4 py-5 text-sm font-bold text-orange-950 group-hover:bg-orange-50">{row.proposal}{row.total === null && <span className="mt-2 block w-fit rounded-md bg-stone-100 px-2 py-1 text-[10px] font-medium text-stone-500">Sin puntuación</span>}</th>
                        <td className="border-b border-orange-100/70 px-4 py-5 tabular-nums text-stone-500 group-hover:bg-orange-50/40">{row.year}</td>
                        <td className="w-[340px] min-w-[300px] border-b border-orange-100/70 px-4 py-4 text-stone-600 group-hover:bg-orange-50/40"><LongText text={row.summary} /></td>
                        {['excellence', 'impact', 'quality', 'total'].map((field) => <td key={field} className="border-b border-orange-100/70 px-3 py-5 text-center group-hover:bg-orange-50/40"><ScoreBadge row={row} field={field} /></td>)}
                        <td className="w-56 min-w-52 border-b border-orange-100/70 px-4 py-4 text-xs text-stone-600 group-hover:bg-orange-50/40"><LongText text={row.expectedEvaluation} /></td>
                        <td className="min-w-52 max-w-60 break-words border-b border-orange-100/70 px-4 py-5 text-xs leading-6 text-stone-500 group-hover:bg-orange-50/40">{row.call || '—'}</td>
                        <td className="min-w-32 border-b border-orange-100/70 px-4 py-5 group-hover:bg-orange-50/40"><span className="inline-block rounded-lg border border-orange-100 bg-orange-50/50 px-2.5 py-1 text-xs font-medium text-orange-700">{row.folder || '—'}</span></td>
                        <td className="w-64 min-w-56 border-b border-orange-100/70 px-4 py-4 text-xs text-stone-500 group-hover:bg-orange-50/40"><LongText text={row.notes} /></td>
                        <td className="sticky right-0 z-10 w-[112px] min-w-[112px] border-b border-orange-100/70 bg-white px-3 py-4 group-hover:bg-orange-50"><div className="flex items-center justify-end gap-2"><button type="button" aria-label={`Editar ${row.proposal}`} title="Editar valoración" onClick={() => openForm(row)} className="cursor-pointer rounded-xl border border-orange-100 p-2.5 text-orange-500 transition hover:bg-orange-100"><Pencil size={16} /></button><button type="button" aria-label={`Eliminar ${row.proposal}`} title="Eliminar valoración" onClick={() => { setDeleteError(''); setDeleteTarget(row); }} className="cursor-pointer rounded-xl border border-red-100 p-2.5 text-red-500 transition hover:bg-red-50"><Trash2 size={16} /></button></div></td>
                      </tr>)}</tbody>
                    </table>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
                    <p className="text-xs text-stone-500" aria-live="polite">Mostrando {(currentPage - 1) * 15 + 1}–{Math.min(currentPage * 15, filtered.length)} de {filtered.length} valoraciones</p>
                    <div className="flex items-center gap-3"><button type="button" aria-label="Página anterior" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} className={`${secondaryButton} !p-2`}><ChevronLeft size={17} /></button><span className="text-xs text-stone-500">{currentPage} / {pageCount}</span><button type="button" aria-label="Página siguiente" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)} className={`${secondaryButton} !p-2`}><ChevronRight size={17} /></button></div>
                  </div>
                </>}
          <button type="button" disabled={loading || Boolean(loadError)} onClick={() => openForm()} className="flex w-full cursor-pointer items-center justify-center gap-2 border-t border-dashed border-orange-200 bg-orange-50/40 px-6 py-4 text-sm font-semibold text-orange-600 transition hover:bg-orange-100/60 disabled:cursor-not-allowed disabled:opacity-40"><Plus size={18} /> Añadir una nueva fila</button>
        </section>

        <section className="valuation-enter valuation-help grid items-start gap-4 xl:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl border border-orange-100 bg-white p-6">
            <h2 className="flex items-center gap-2 text-base font-bold"><span className="rounded-xl bg-orange-50 p-2 text-orange-600"><CircleHelp size={19} /></span> Cómo leer las puntuaciones</h2>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">{['Excellence', 'Impact', 'Calidad'].map((criterion) => <div key={criterion} className="rounded-xl border border-stone-100 bg-stone-50 px-3 py-3"><p className="text-xs font-semibold text-stone-600">{criterion}</p><p className="mt-1 text-lg font-bold tabular-nums">0–5 <span className="text-xs font-normal text-stone-500">puntos</span></p></div>)}</div>
            <p className="mt-4 text-sm leading-6 text-stone-600">El total suma las puntuaciones disponibles; en la primera etapa puede incluir solo Excellence e Impact. Un guion indica un criterio sin puntuación, no un cero.</p>
            <p className="mt-3 rounded-xl border border-orange-100 bg-orange-50/60 px-3 py-2.5 text-xs leading-6 text-orange-800">Compara propuestas con los mismos criterios evaluados. Debajo de cada total puedes ver cuántos criterios incluye.</p>
            {data.notes.length > 0 && <div className="mt-4 border-t border-orange-100 pt-3"><TextDisclosure label="Ver criterios y notas del Excel original" closeLabel="Ocultar criterios y notas"><ul className="space-y-2 pb-3 text-xs leading-6 text-stone-500">{data.notes.map((note) => <li key={note}>{note}</li>)}</ul></TextDisclosure></div>}
          </div>
          <aside aria-labelledby="valuation-guide-title" className="overflow-hidden rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-rose-50">
            <div className="p-6">
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-orange-600"><ClipboardList size={16} aria-hidden="true" /> Guía del registro</p>
              <h2 id="valuation-guide-title" className="mt-3 text-xl font-bold tracking-tight">De la propuesta al resultado</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">Reúne lo que presentaste, la evaluación recibida y las ideas que pueden ayudarte en la próxima convocatoria.</p>

              <ol className="mt-5 space-y-4">
                {[
                  { title: 'Registra la propuesta', text: 'Añade el nombre, el año y el código de la convocatoria. Incluye un resumen de los objetivos y una carpeta para encontrarla fácilmente.' },
                  { title: 'Completa la evaluación', text: 'Cuando recibas los resultados, abre el lápiz de la fila e introduce las puntuaciones. Deja vacíos los criterios que todavía no se hayan evaluado.' },
                  { title: 'Conserva lo aprendido', text: 'Utiliza las notas para recoger comentarios del informe, puntos fuertes y aspectos que conviene mejorar antes de volver a presentar la propuesta.' },
                ].map(({ title, text }, index) => (
                  <li key={title} className="flex items-start gap-3">
                    <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-orange-200/80 bg-white/80 text-xs font-bold text-orange-600">{index + 1}</span>
                    <div className="min-w-0 pt-0.5"><h3 className="text-sm font-bold">{title}</h3><p className="mt-1 text-xs leading-6 text-stone-600">{text}</p></div>
                  </li>
                ))}
              </ol>

              <div className="mt-5 rounded-xl border border-white bg-white/70 p-4">
                <p className="flex items-center gap-2 text-xs font-bold text-orange-800"><Search size={15} aria-hidden="true" /> Encuentra referencias para tu próxima propuesta</p>
                <p className="mt-2 text-xs leading-6 text-stone-600">Filtra por año o carpeta y ordena por total para revisar resultados anteriores. Consulta también los objetivos y las notas para entender el contexto de cada evaluación.</p>
              </div>
            </div>
            <div className="border-t border-orange-100 bg-white/50 px-6 py-5">
              <button type="button" disabled={loading || Boolean(loadError)} onClick={() => openForm()} className={`${primaryButton} w-full`}><Plus size={17} aria-hidden="true" /> Añadir una valoración<ChevronRight size={16} aria-hidden="true" className="ml-auto" /></button>
              <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-orange-800/80"><ListChecks size={15} aria-hidden="true" className="mt-0.5 shrink-0" /> Los cambios guardados quedan disponibles para los miembros de este portal.</p>
            </div>
          </aside>
        </section>
      </div>
      <AnimatePresence>
        {editing !== null && <ValuationForm key="valuation-form" row={editing} portalId={portalId} folders={folders} onClose={() => setEditing(null)} onSaved={saved} />}
      </AnimatePresence>
      <AnimatePresence>
        {deleteTarget && (
          <ValuationDialog key="valuation-delete" titleId="delete-valuation-title" onClose={() => setDeleteTarget(null)} busy={deleting} className="max-w-md">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <span className="rounded-2xl bg-red-50 p-3 text-red-500"><Trash2 size={21} /></span>
                <div><h2 id="delete-valuation-title" className="text-lg font-bold">¿Eliminar esta fila?</h2><p className="mt-2 text-sm leading-6 text-stone-600">Se eliminará <strong className="text-orange-900">{deleteTarget.proposal}</strong> de las valoraciones de este portal. Esta acción no se puede deshacer.</p></div>
              </div>
              {deleteError && <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700"><AlertCircle size={17} className="mt-0.5 shrink-0" />{deleteError}</p>}
              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <button type="button" disabled={deleting} onClick={() => setDeleteTarget(null)} className={secondaryButton}>Cancelar</button>
                <button type="button" disabled={deleting} onClick={confirmDelete} className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50">{deleting ? <LoaderCircle size={17} className="animate-spin" /> : <Trash2 size={17} />}{deleting ? 'Eliminando…' : 'Eliminar fila'}</button>
              </div>
            </div>
          </ValuationDialog>
        )}
      </AnimatePresence>
    </main>
  );
}

export default function PortalValuationsPage() {
  const { portalId } = useParams();
  return <PortalSidebar><ValuationsContent key={portalId} portalId={portalId} /></PortalSidebar>;
}
