import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, CircleHelp, ClipboardList, Clock3, FolderOpen, ListChecks, LoaderCircle, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useParams } from 'react-router-dom';
import PortalSidebar from './PortalSidebar.jsx';
import { deleteValuation, getValuations, saveValuation } from '../services/proposalValuationService.js';

const primaryButton = 'inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:from-orange-600 hover:to-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 disabled:cursor-not-allowed disabled:opacity-50';
const secondaryButton = 'inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-orange-200 bg-white px-4 py-2.5 text-sm font-semibold text-orange-800 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-40';
const inputClass = 'w-full rounded-xl border border-orange-100 bg-white px-3 py-2.5 text-sm text-orange-950 outline-none transition placeholder:text-stone-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100';
const numberFormat = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 });
const formatScore = (value) => value === null || value === undefined ? '—' : numberFormat.format(value);
const normalize = (value) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const emptyForm = () => ({ proposal: '', year: new Date().getFullYear(), summary: '', excellence: '', impact: '', quality: '', call: '', folder: '', notes: '' });

function LongText({ text }) {
  if (!text) return <span className="text-stone-400">—</span>;
  if (text.length < 115) return <p className="whitespace-pre-wrap break-words leading-6">{text}</p>;
  return (
    <details className="group/text">
      <summary className="cursor-pointer list-none rounded-lg focus-visible:outline-2 focus-visible:outline-orange-400">
        <span className="line-clamp-2 leading-6 group-open/text:hidden">{text}</span>
        <span className="mt-1 inline-block text-xs font-semibold text-orange-600 group-open/text:hidden">Leer más</span>
        <span className="hidden text-xs font-semibold text-orange-600 group-open/text:inline">Mostrar menos</span>
      </summary>
      <p className="mt-2 whitespace-pre-wrap break-words leading-6">{text}</p>
    </details>
  );
}

function ValuationForm({ row, portalId, folders, onClose, onSaved }) {
  const dialogRef = useRef(null);
  const [form, setForm] = useState(() => ({ ...emptyForm(), ...row }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const scores = ['excellence', 'impact', 'quality'].map((field) => form[field]).filter((value) => value !== '' && value !== null && value !== undefined);
  const total = scores.length ? Math.round(scores.reduce((sum, value) => sum + Number(value), 0) * 100) / 100 : null;

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
    <dialog ref={dialogRef} aria-labelledby="valuation-form-title" onCancel={(event) => { event.preventDefault(); if (!saving) onClose(); }} className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-3xl border border-orange-100 bg-white p-0 text-orange-950 shadow-2xl backdrop:bg-orange-950/35 backdrop:backdrop-blur-sm">
      <form onSubmit={submit}>
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-orange-100 bg-white px-6 py-5">
          <div>
            <h2 id="valuation-form-title" className="text-xl font-bold">{row?.id ? 'Editar valoración' : 'Nueva valoración'}</h2>
            <p className="mt-1 text-sm text-stone-500">Añade los datos de la propuesta y sus puntuaciones.</p>
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
          <label className="space-y-2 text-sm font-semibold">Convocatoria (código)<input name="call" maxLength={500} value={form.call} onChange={change} placeholder="HORIZON-…" className={inputClass} /></label>
          <label className="space-y-2 text-sm font-semibold">Carpeta<input name="folder" maxLength={250} list="valuation-folders" value={form.folder} onChange={change} placeholder="Ej. CL6, Misión Suelo…" className={inputClass} /><datalist id="valuation-folders">{folders.map((folder) => <option key={folder} value={folder} />)}</datalist></label>
          <label className="space-y-2 text-sm font-semibold sm:col-span-2">Notas<textarea rows={3} name="notes" maxLength={10000} value={form.notes} onChange={change} placeholder="Observaciones, etapa de evaluación o información pendiente…" className={inputClass} /></label>
        </fieldset>
        {error && <p role="alert" className="mx-6 mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-orange-100 bg-white px-6 py-4">
          <button type="button" onClick={onClose} disabled={saving} className={secondaryButton}>Cancelar</button>
          <button type="submit" disabled={saving} className={primaryButton}>{saving ? <LoaderCircle size={17} className="animate-spin" /> : <Plus size={17} />}{saving ? 'Guardando…' : row?.id ? 'Guardar cambios' : 'Añadir fila'}</button>
        </div>
      </form>
    </dialog>
  );
}

function ValuationsContent({ portalId }) {
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
  const filtered = useMemo(() => {
    const term = normalize(search.trim());
    const rows = data.rows.filter((row) => (!year || String(row.year) === year)
      && (!folder || row.folder === folder)
      && (!status || (status === 'pending' ? row.total === null : row.total !== null))
      && (!term || [row.proposal, row.summary, row.call, row.folder, row.notes, row.year].some((value) => normalize(value).includes(term))));
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
    try {
      await deleteValuation(portalId, deleteTarget.id);
      setData((current) => ({ ...current, rows: current.rows.filter((item) => item.id !== deleteTarget.id) }));
      setDeleteTarget(null);
      setSuccess(`La fila de ${deleteTarget.proposal} se ha eliminado.`);
      setPage(1);
    } catch (deleteError) {
      setSuccess(deleteError.response?.data?.message || 'No se ha podido eliminar la fila.');
    } finally {
      setDeleting(false);
    }
  };
  const handleTablePointerDown = useCallback((event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (event.target.closest('button, input, select, textarea, a, summary, details')) return;
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
    <main className="min-h-screen px-4 pb-8 pt-20 text-orange-950 sm:px-6 lg:py-8">
      <div className="mx-auto flex max-w-[1700px] flex-col gap-6">
        <header className="relative overflow-hidden rounded-[26px] border border-orange-100 bg-white p-6 shadow-[0_18px_45px_rgba(255,96,26,0.06)] sm:p-8">
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-32 h-80 w-80 rounded-full border-[45px] border-orange-50/70" />
          <div className="relative flex flex-col justify-between gap-6 xl:flex-row xl:items-center">
            <div className="max-w-2xl">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-orange-600"><ListChecks size={17} /> Seguimiento de propuestas</p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Valoraciones</h1>
              <p className="mt-4 text-sm leading-7 text-stone-500 sm:text-base">Cada evaluación, una oportunidad para mejorar. Consulta los resultados de tus propuestas, compara sus criterios y amplía el registro con nuevas valoraciones.</p>
            </div>
            <button type="button" disabled={loading || Boolean(loadError)} onClick={() => openForm()} className={`${primaryButton} shrink-0 self-start xl:self-center`}><Plus size={18} /> Nueva valoración</button>
          </div>
          <div className="relative mt-7 grid grid-cols-2 gap-3 xl:grid-cols-4">
            {[{ label: 'Propuestas registradas', value: data.rows.length, icon: ClipboardList }, { label: 'Con puntuación', value: evaluated, icon: ListChecks }, { label: 'Sin puntuación', value: data.rows.length - evaluated, icon: Clock3 }, { label: 'Carpetas', value: folders.length, icon: FolderOpen }].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3 rounded-2xl border border-orange-100/80 bg-orange-50/40 p-4">
                <span className="hidden rounded-xl bg-white p-2.5 text-orange-500 shadow-sm sm:block"><Icon size={20} /></span>
                <div><p className="text-2xl font-bold tabular-nums">{loading || loadError ? '—' : value}</p><p className="mt-1 text-xs text-stone-500">{label}</p></div>
              </div>
            ))}
          </div>
        </header>

        {success && <p role="status" className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</p>}

        <section aria-labelledby="valuations-table-title" className="min-w-0 overflow-hidden rounded-[26px] border border-orange-100 bg-white shadow-[0_16px_40px_rgba(255,96,26,0.05)]">
          <div className="border-b border-orange-100 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h2 id="valuations-table-title" className="text-xl font-bold">Registro de valoraciones <span className="ml-2 rounded-lg bg-orange-50 px-2 py-1 text-sm text-orange-600">{loading || loadError ? '—' : data.rows.length}</span></h2><p className="mt-2 text-sm text-stone-500">Objetivos, convocatorias y resultados en un mismo lugar.</p></div>
              <span className="rounded-full border border-orange-100 bg-orange-50/50 px-3 py-1.5 text-xs font-medium text-orange-700">Base: Propuestas_valoraciones.xlsx</span>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <label className="relative min-w-52 flex-1"><span className="sr-only">Buscar valoraciones</span><Search size={17} className="absolute left-3 top-3 text-orange-400" /><input type="search" value={search} onChange={filterChange(setSearch)} placeholder="Buscar propuesta, convocatoria, objetivos…" className={`${inputClass} pl-10`} /></label>
              <select aria-label="Filtrar por año" value={year} onChange={filterChange(setYear)} className={`${inputClass} !w-auto`}><option value="">Todos los años</option>{years.map((value) => <option key={value} value={value}>{value}</option>)}</select>
              <select aria-label="Filtrar por carpeta" value={folder} onChange={filterChange(setFolder)} className={`${inputClass} !w-auto`}><option value="">Todas las carpetas</option>{folders.map((value) => <option key={value} value={value}>{value}</option>)}</select>
              <select aria-label="Filtrar por evaluación" value={status} onChange={filterChange(setStatus)} className={`${inputClass} !w-auto`}><option value="">Todas las evaluaciones</option><option value="evaluated">Con puntuación</option><option value="pending">Sin puntuación</option></select>
              <select aria-label="Ordenar valoraciones" value={sort} onChange={filterChange(setSort)} className={`${inputClass} !w-auto`}><option value="original">Orden del registro</option><option value="name">Propuesta A–Z</option><option value="year">Año más reciente</option><option value="score">Mayor total</option></select>
            </div>
          </div>
          {loading ? <div role="status" className="flex items-center justify-center gap-3 p-16 text-sm text-orange-600"><LoaderCircle size={22} className="animate-spin" /> Cargando valoraciones…</div>
            : loadError ? <div role="alert" className="space-y-4 p-10 text-center"><p className="text-sm text-red-700">{loadError}</p><button type="button" className={secondaryButton} onClick={() => { setLoading(true); setLoadError(''); setRetry((value) => value + 1); }}>Reintentar</button></div>
              : filtered.length === 0 ? <div className="space-y-4 p-14 text-center"><Search className="mx-auto text-orange-300" size={32} /><p className="font-semibold">No hay valoraciones con estos filtros</p><button type="button" className={secondaryButton} onClick={resetFilters}>Limpiar filtros</button></div>
                : <>
                  <p id="valuation-scroll-hint" className="px-6 py-3 text-xs text-stone-400">Clica y arrastra la tabla horizontalmente para ver todas las columnas. Pulsa el lápiz para editar una fila.</p>
                  <div ref={tableScrollRef} tabIndex={0} role="region" aria-label="Tabla de valoraciones" aria-describedby="valuation-scroll-hint" onPointerDown={handleTablePointerDown} onPointerMove={handleTablePointerMove} onPointerUp={finishTablePointer} onPointerCancel={finishTablePointer} className="gestiona-scrollbar max-h-[680px] cursor-grab touch-pan-y overflow-auto select-none focus-visible:outline-2 focus-visible:outline-orange-400 active:cursor-grabbing">
                    <table className="w-full min-w-[1680px] border-separate border-spacing-0 text-left text-sm">
                      <caption className="sr-only">Valoraciones de propuestas: las diez columnas del Excel y acciones para editar.</caption>
                      <thead className="sticky top-0 z-20"><tr>{['Propuesta', 'Año de la convocatoria', 'Resumen de objetivos (ES)', 'Excellence', 'Impact', 'Calidad', 'Total', 'Convocatoria (código)', 'Carpeta', 'Notas', ''].map((label, index) => <th scope="col" key={label || 'actions'} className={`border-y border-orange-100 bg-orange-50 px-4 py-4 text-xs font-bold text-orange-900 ${index === 0 ? 'sticky left-0 z-30 min-w-44' : ''} ${index >= 3 && index <= 6 ? 'text-center' : ''}`}>{label || <span className="sr-only">Acciones</span>}</th>)}</tr></thead>
                      <tbody>{visible.map((row) => <tr key={row.id} className="group align-top">
                        <th scope="row" className="sticky left-0 z-10 w-48 border-b border-orange-100/70 bg-white px-4 py-5 text-sm font-bold text-orange-950 group-hover:bg-orange-50">{row.proposal}{row.total === null && <span className="mt-2 block w-fit rounded-md bg-stone-100 px-2 py-1 text-[10px] font-medium text-stone-500">Sin puntuación</span>}</th>
                        <td className="border-b border-orange-100/70 px-4 py-5 tabular-nums text-stone-500 group-hover:bg-orange-50/40">{row.year}</td>
                        <td className="w-[340px] min-w-[300px] border-b border-orange-100/70 px-4 py-4 text-stone-600 group-hover:bg-orange-50/40"><LongText text={row.summary} /></td>
                        {['excellence', 'impact', 'quality', 'total'].map((field) => <td key={field} className="border-b border-orange-100/70 px-3 py-5 text-center group-hover:bg-orange-50/40"><span className={`inline-flex min-w-12 justify-center rounded-lg px-2 py-1.5 font-semibold tabular-nums ${row[field] === null ? 'bg-stone-50 text-stone-400' : field === 'total' ? 'bg-orange-100 text-orange-800' : 'bg-orange-50/70 text-orange-900'}`} aria-label={row[field] === null ? 'Sin puntuación' : undefined}>{formatScore(row[field])}</span></td>)}
                        <td className="min-w-52 max-w-60 break-words border-b border-orange-100/70 px-4 py-5 text-xs leading-6 text-stone-500 group-hover:bg-orange-50/40">{row.call || '—'}</td>
                        <td className="min-w-32 border-b border-orange-100/70 px-4 py-5 group-hover:bg-orange-50/40"><span className="inline-block rounded-lg border border-orange-100 bg-orange-50/50 px-2.5 py-1 text-xs font-medium text-orange-700">{row.folder || '—'}</span></td>
                        <td className="w-64 min-w-56 border-b border-orange-100/70 px-4 py-4 text-xs text-stone-500 group-hover:bg-orange-50/40"><LongText text={row.notes} /></td>
                        <td className="border-b border-orange-100/70 px-3 py-4 group-hover:bg-orange-50/40"><div className="flex items-center gap-2"><button type="button" aria-label={`Editar ${row.proposal}`} title="Editar valoración" onClick={() => openForm(row)} className="cursor-pointer rounded-xl border border-orange-100 p-2.5 text-orange-500 transition hover:bg-orange-100"><Pencil size={16} /></button><button type="button" aria-label={`Eliminar ${row.proposal}`} title="Eliminar valoración" onClick={() => setDeleteTarget(row)} className="cursor-pointer rounded-xl border border-red-100 p-2.5 text-red-500 transition hover:bg-red-50"><Trash2 size={16} /></button></div></td>
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

        <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl border border-orange-100 bg-white p-6">
            <h2 className="flex items-center gap-2 text-sm font-bold"><CircleHelp size={18} className="text-orange-500" /> Cómo leer las puntuaciones</h2>
            <p className="mt-3 text-sm leading-6 text-stone-500">Cada criterio se valora de 0 a 5. El total suma las puntuaciones disponibles; en la primera etapa puede incluir solo Excellence e Impact. Un guion indica un criterio sin puntuación, no un cero.</p>
            <p className="mt-2 text-xs leading-5 text-orange-700">Para comparar totales, revisa que las propuestas tengan los mismos criterios evaluados.</p>
            {data.notes.length > 0 && <details className="mt-4 border-t border-orange-100 pt-3"><summary className="cursor-pointer text-xs font-semibold text-orange-600">Ver criterios y notas del Excel original</summary><ul className="mt-3 space-y-2 text-xs leading-6 text-stone-500">{data.notes.map((note) => <li key={note}>{note}</li>)}</ul></details>}
          </div>
          <div className="flex flex-col items-start justify-center rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-rose-50 p-6">
            <p className="text-base font-bold">El registro sigue creciendo</p>
            <p className="mt-2 text-sm leading-6 text-stone-500">Añade nuevas propuestas cuando las presentes y completa sus puntuaciones cuando recibas la evaluación.</p>
            <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-orange-700"><ListChecks size={16} /> Los cambios se guardan para los miembros de este portal.</p>
          </div>
        </section>
      </div>
      {editing !== null && <ValuationForm row={editing} portalId={portalId} folders={folders} onClose={() => setEditing(null)} onSaved={saved} />}
      {deleteTarget && <dialog open aria-labelledby="delete-valuation-title" className="fixed inset-0 z-50 m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl border border-red-100 bg-white p-0 text-orange-950 shadow-2xl backdrop:bg-orange-950/35 backdrop:backdrop-blur-sm"><div className="p-6"><div className="flex items-start gap-4"><span className="rounded-2xl bg-red-50 p-3 text-red-500"><Trash2 size={21} /></span><div><h2 id="delete-valuation-title" className="text-lg font-bold">¿Eliminar esta fila?</h2><p className="mt-2 text-sm leading-6 text-stone-500">Se eliminará <strong className="text-orange-900">{deleteTarget.proposal}</strong> de las valoraciones de este portal. Esta acción no se puede deshacer.</p></div></div><div className="mt-6 flex justify-end gap-3"><button type="button" disabled={deleting} onClick={() => setDeleteTarget(null)} className={secondaryButton}>Cancelar</button><button type="button" disabled={deleting} onClick={confirmDelete} className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-600 disabled:opacity-50">{deleting ? <LoaderCircle size={17} className="animate-spin" /> : <Trash2 size={17} />}{deleting ? 'Eliminando…' : 'Eliminar fila'}</button></div></div></dialog>}
    </main>
  );
}

export default function PortalValuationsPage() {
  const { portalId } = useParams();
  return <PortalSidebar><ValuationsContent key={portalId} portalId={portalId} /></PortalSidebar>;
}
