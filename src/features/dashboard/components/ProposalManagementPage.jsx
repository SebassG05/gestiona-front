import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Filter,
  Loader2,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  SquarePen,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import PortalSidebar from './PortalSidebar.jsx';
import { getPortalMembers } from '../services/portalService.js';
import { getPortalProposals } from '../services/proposalService.js';
import { getProposalControl, saveProposalControl } from '../services/proposalControlService.js';

const STATUSES = ['No iniciado', 'En progreso', 'En revision', 'Listo', 'No aplica'];
const VERSIONS = Array.from({ length: 9 }, (_, index) => index + 1);
const statusStyles = {
  'No iniciado': 'border-slate-200 bg-slate-50 text-slate-600',
  'En progreso': 'border-amber-200 bg-amber-50 text-amber-700',
  'En revision': 'border-sky-200 bg-sky-50 text-sky-700',
  Listo: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  'No aplica': 'border-zinc-200 bg-zinc-50 text-zinc-500',
};

const unwrapProposals = (response) => response?.data?.items || response?.data || [];
const unwrapMembers = (response) => response?.data || response?.members || [];
const dateValue = (value) => (value ? String(value).slice(0, 10) : '');
const versionAverage = (versions = []) => {
  const values = versions.filter((value) => value !== null && value !== '' && value !== undefined);
  return values.length ? values.reduce((total, value) => total + Number(value), 0) / values.length : null;
};
const currentQuality = (versions = []) => [...versions].reverse().find((value) => value !== null && value !== '' && value !== undefined);

const Metric = ({ label, value, detail, accent }) => (
  <div className="min-w-0 border-l-2 pl-4" style={{ borderColor: accent }}>
    <p className="text-xs font-black uppercase text-[#a64729]">{label}</p>
    <p className="mt-1 text-3xl font-black text-[#3b1208]">{value}</p>
    <p className="mt-1 truncate text-xs font-semibold text-[#bd5a39]">{detail}</p>
  </div>
);

const ProposalManagementPage = () => {
  const { portalId } = useParams();
  const [proposals, setProposals] = useState([]);
  const [members, setMembers] = useState([]);
  const [proposalId, setProposalId] = useState('');
  const [items, setItems] = useState([]);
  const [savedItems, setSavedItems] = useState([]);
  const [activeVersion, setActiveVersion] = useState(1);
  const [sectionFilter, setSectionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isTableDragging, setIsTableDragging] = useState(false);
  const tableScrollerRef = useRef(null);
  const tableDragRef = useRef({ startX: 0, scrollLeft: 0 });

  useEffect(() => {
    let active = true;
    Promise.all([getPortalProposals(portalId, { page: 1, limit: 100 }), getPortalMembers(portalId)])
      .then(([proposalResponse, memberResponse]) => {
        if (!active) return;
        const nextProposals = unwrapProposals(proposalResponse);
        setProposals(nextProposals);
        setMembers(unwrapMembers(memberResponse));
        setProposalId((current) => current || nextProposals[0]?._id || nextProposals[0]?.id || '');
        if (!nextProposals.length) setIsLoading(false);
      })
      .catch((requestError) => {
        if (!active) return;
        setError(requestError.response?.data?.message || 'No se pudieron cargar las propuestas.');
        setIsLoading(false);
      });
    return () => { active = false; };
  }, [portalId]);

  useEffect(() => {
    if (!proposalId) return;
    let active = true;
    setIsLoading(true);
    setError('');
    setMessage('');
    setIsEditing(false);
    getProposalControl({ portalId, proposalId })
      .then((response) => {
        if (!active) return;
        const nextItems = response.data?.control?.items || [];
        setItems(nextItems);
        setSavedItems(nextItems);
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || 'No se pudo cargar el control de la propuesta.');
      })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [portalId, proposalId]);

  const selectedProposal = proposals.find((proposal) => (proposal._id || proposal.id) === proposalId);
  const sections = useMemo(() => [...new Set(items.map((item) => item.section))], [items]);
  const hasChanges = JSON.stringify(items) !== JSON.stringify(savedItems);
  const filteredItems = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('es');
    return items.filter((item) => {
      if (sectionFilter !== 'all' && item.section !== sectionFilter) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      return !query || `${item.section} ${item.indicator} ${item.pendingAction} ${item.responsible}`.toLocaleLowerCase('es').includes(query);
    });
  }, [items, search, sectionFilter, statusFilter]);

  const ready = items.filter((item) => item.status === 'Listo').length;
  const applicable = items.filter((item) => item.status !== 'No aplica');
  const averageProgress = applicable.length
    ? Math.round(applicable.reduce((total, item) => total + Number(item.progress || 0), 0) / applicable.length)
    : 0;
  const scored = items.map((item) => currentQuality(item.versions)).filter((value) => value !== undefined);
  const averageQuality = scored.length
    ? (scored.reduce((total, value) => total + Number(value), 0) / scored.length).toFixed(1)
    : '-';

  const updateItem = (itemId, field, value) => {
    setItems((current) => current.map((item) => (item._id === itemId ? { ...item, [field]: value } : item)));
    setMessage('');
  };

  const updateVersion = (itemId, value) => {
    setItems((current) => current.map((item) => {
      if (item._id !== itemId) return item;
      const versions = Array.from({ length: 9 }, (_, index) => item.versions?.[index] ?? null);
      versions[activeVersion - 1] = value === '' ? null : Number(value);
      return { ...item, versions };
    }));
    setMessage('');
  };

  const handleSave = async (closeAfterSave = false) => {
    if (!proposalId || !hasChanges) return;
    setIsSaving(true);
    setError('');
    try {
      const response = await saveProposalControl({ portalId, proposalId, items });
      const nextItems = response.data?.items || items;
      setItems(nextItems);
      setSavedItems(nextItems);
      setMessage('Cambios guardados correctamente.');
      if (closeAfterSave) setIsEditing(false);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No se pudieron guardar los cambios.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTableDragStart = (event) => {
    if (event.button !== 0 || event.target.closest('input, textarea, select, button, a')) return;
    tableDragRef.current = {
      startX: event.clientX,
      scrollLeft: tableScrollerRef.current?.scrollLeft || 0,
    };
    setIsTableDragging(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handleTableDragMove = (event) => {
    if (!isTableDragging || !tableScrollerRef.current) return;
    event.preventDefault();
    tableScrollerRef.current.scrollLeft =
      tableDragRef.current.scrollLeft - (event.clientX - tableDragRef.current.startX);
  };

  const handleTableDragEnd = (event) => {
    if (!isTableDragging) return;
    setIsTableDragging(false);
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  return (
    <PortalSidebar>
      <main className="min-h-screen bg-[#fafafa] px-5 py-7 text-[#3b1208] md:px-8">
        <div className="mx-auto max-w-[1800px]">
          <header className="border-b border-orange-200 pb-7">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="flex items-center gap-2 text-sm font-black uppercase text-[#ff3f6c]">
                  <ClipboardCheck size={17} /> Gestion de propuestas
                </p>
                <h1 className="mt-3 font-display text-4xl text-[#4b1406] md:text-5xl">Control de calidad</h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-[#bd4b27]">
                  Sigue el avance, asigna acciones y compara la calidad de cada version de la propuesta.
                </p>
              </div>
              <label className="min-w-0 xl:w-[440px]">
                <span className="text-xs font-black uppercase text-[#9b3f22]">Propuesta activa</span>
                <div className="relative mt-2">
                  <select value={proposalId} onChange={(event) => setProposalId(event.target.value)} className="w-full appearance-none rounded-xl border border-orange-200 bg-white px-4 py-3 pr-10 font-bold outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100">
                    {!proposals.length && <option value="">No hay propuestas disponibles</option>}
                    {proposals.map((proposal) => <option key={proposal._id || proposal.id} value={proposal._id || proposal.id}>{proposal.acronimo ? `${proposal.acronimo} - ` : ''}{proposal.nombre}</option>)}
                  </select>
                  <ChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-orange-600" />
                </div>
              </label>
            </div>
          </header>

          {!proposalId && !isLoading && (
            <section className="grid min-h-[420px] place-items-center border-b border-orange-100 text-center">
              <div>
                <ClipboardCheck size={38} className="mx-auto text-orange-500" />
                <h2 className="mt-4 text-2xl font-black">Todavia no hay propuestas</h2>
                <p className="mt-2 text-sm text-[#bd5a39]">
                  Crea una propuesta para activar su tabla de control de calidad.
                </p>
              </div>
            </section>
          )}

          {proposalId && (
            <>
              <section className="grid gap-5 border-b border-orange-100 py-6 sm:grid-cols-2 xl:grid-cols-5">
                <Metric label="Controles" value={items.length} detail={selectedProposal?.acronimo || selectedProposal?.nombre} accent="#ff5a1f" />
                <Metric label="Listos" value={ready} detail={`${items.length ? Math.round((ready / items.length) * 100) : 0}% completado`} accent="#10b981" />
                <Metric label="Avance medio" value={`${averageProgress}%`} detail="Controles aplicables" accent="#f59e0b" />
                <Metric label="Calidad actual" value={averageQuality} detail="Escala de 0 a 5" accent="#0ea5e9" />
                <Metric label="Version activa" value={`V${activeVersion}`} detail={`${scored.length} evaluaciones`} accent="#ff3f6c" />
              </section>

              <section className="flex flex-col gap-4 border-b border-orange-100 py-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-1 flex-wrap items-center gap-3">
                  <div className="relative min-w-[240px] flex-1 xl:max-w-sm">
                    <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500" />
                    <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar control o accion..." className="w-full rounded-xl border border-orange-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100" />
                  </div>
                  <Filter size={17} className="text-orange-500" />
                  <select value={sectionFilter} onChange={(event) => setSectionFilter(event.target.value)} className="max-w-xs rounded-xl border border-orange-200 bg-white px-3 py-2.5 text-sm font-semibold outline-none"><option value="all">Todas las secciones</option>{sections.map((section) => <option key={section}>{section}</option>)}</select>
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-orange-200 bg-white px-3 py-2.5 text-sm font-semibold outline-none"><option value="all">Todos los estados</option>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex rounded-xl border border-orange-200 bg-white p-1" aria-label="Version evaluada">
                    {VERSIONS.map((version) => <button key={version} type="button" onClick={() => setActiveVersion(version)} className={`h-8 min-w-8 cursor-pointer rounded-lg text-xs font-black transition ${activeVersion === version ? 'bg-[#ff5a1f] text-white shadow-sm' : 'text-[#8b2f12] hover:bg-orange-50'}`}>V{version}</button>)}
                  </div>
                  {isEditing && <button type="button" onClick={() => setItems(savedItems)} disabled={!hasChanges || isSaving} title="Descartar cambios" className="grid h-10 w-10 cursor-pointer place-items-center rounded-xl border border-orange-200 bg-white text-orange-700 disabled:cursor-not-allowed disabled:opacity-40"><RotateCcw size={17} /></button>}
                  <button
                    type="button"
                    onClick={() => isEditing ? (hasChanges ? handleSave(true) : setIsEditing(false)) : setIsEditing(true)}
                    disabled={isSaving}
                    className={`inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl px-5 text-sm font-black shadow-sm transition disabled:cursor-wait disabled:opacity-60 ${isEditing ? 'border border-orange-200 bg-white text-orange-800 hover:bg-orange-50' : 'bg-gradient-to-r from-orange-500 to-rose-500 text-white'}`}
                  >
                    {isSaving ? <Loader2 size={17} className="animate-spin" /> : isEditing ? <Save size={17} /> : <SquarePen size={17} />}
                    {isEditing ? (hasChanges ? 'Guardar y finalizar' : 'Finalizar edicion') : 'Editar tabla'}
                  </button>
                  {isEditing && <button type="button" onClick={() => handleSave(false)} disabled={!hasChanges || isSaving} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 px-5 text-sm font-black text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50">{isSaving ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />} Guardar</button>}
                </div>
              </section>

              <AnimatePresence>{(message || error) && <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className={`my-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold ${error ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{error ? <Sparkles size={17} /> : <CheckCircle2 size={17} />}{error || message}</motion.div>}</AnimatePresence>

              <section className="overflow-hidden border border-orange-200 bg-white shadow-sm">
                {isLoading ? <div className="grid min-h-80 place-items-center text-orange-600"><Loader2 className="animate-spin" /></div> : (
                  <div
                    ref={tableScrollerRef}
                    onPointerDown={handleTableDragStart}
                    onPointerMove={handleTableDragMove}
                    onPointerUp={handleTableDragEnd}
                    onPointerCancel={handleTableDragEnd}
                    className={`overflow-x-auto touch-pan-y [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${isTableDragging ? 'cursor-grabbing select-none' : 'cursor-grab'}`}
                  >
                    <table className="w-full min-w-[1780px] border-collapse text-left text-sm">
                      <thead className="sticky top-0 z-10 bg-[#fff6ed] text-xs font-black uppercase text-[#8b2f12]">
                        <tr className="[&>th]:text-center"><th className="w-14 px-3 py-4">N.</th><th className="w-56 px-3 py-4">Area / seccion</th><th className="min-w-[340px] px-3 py-4">Indicador</th><th className="w-24 px-3 py-4">Peso %</th><th className="min-w-[165px] px-3 py-4">Estado</th><th className="min-w-[165px] px-3 py-4">Avance</th><th className="min-w-[205px] px-3 py-4">Responsable</th><th className="min-w-[230px] px-3 py-4">Accion pendiente</th><th className="w-36 px-3 py-4">Revision</th><th className="w-24 border-x border-sky-100 bg-sky-50 px-3 py-4 text-sky-700">V{activeVersion}</th><th className="w-20 px-3 py-4">Actual</th><th className="w-20 px-3 py-4">Media</th><th className="min-w-[220px] px-3 py-4">Observaciones</th></tr>
                      </thead>
                      <tbody>
                        {filteredItems.map((item) => {
                          const quality = currentQuality(item.versions);
                          const average = versionAverage(item.versions);
                          return <tr key={item._id} className="border-t border-orange-100 align-top transition hover:bg-orange-50/30">
                            <td className="px-3 py-3 text-center font-black text-orange-600">{item.order}</td>
                            <td className="px-3 py-3 text-justify font-bold leading-5">{item.section}</td>
                            <td className="px-3 py-3 text-justify leading-5 text-[#61200e]">{isEditing ? <textarea rows="2" value={item.indicator || ''} onChange={(event) => updateItem(item._id, 'indicator', event.target.value)} className="w-full resize-y rounded-lg border border-orange-200 px-2 py-2 text-justify outline-none focus:border-orange-400" placeholder="Que debe hacerse" /> : (item.indicator || <span className="text-slate-400">Sin completar</span>)}</td>
                            <td className="px-3 py-3"><input disabled={!isEditing} type="number" min="0" max="100" value={item.weight ?? ''} onChange={(event) => updateItem(item._id, 'weight', event.target.value)} className="w-20 rounded-lg border border-orange-100 px-2 py-2 outline-none focus:border-orange-400 disabled:border-transparent disabled:bg-transparent" /></td>
                            <td className="px-4 py-4"><select disabled={!isEditing} value={item.status} onChange={(event) => updateItem(item._id, 'status', event.target.value)} className={`min-h-11 w-full min-w-[150px] rounded-xl border px-3 py-2.5 font-bold outline-none disabled:appearance-none ${statusStyles[item.status]}`}>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select></td>
                            <td className="px-4 py-4"><div className="min-w-[150px] px-1"><input disabled={!isEditing} type="range" min="0" max="100" step="5" value={item.progress} onChange={(event) => updateItem(item._id, 'progress', Number(event.target.value))} className="w-full accent-orange-500 disabled:opacity-50" /><span className="mt-1 block text-center text-xs font-black text-orange-700">{item.progress}%</span></div></td>
                            <td className="px-4 py-4"><select disabled={!isEditing} value={item.responsible || ''} onChange={(event) => updateItem(item._id, 'responsible', event.target.value)} className="min-h-11 w-full min-w-[210px] rounded-xl border border-orange-100 bg-white px-3 py-2.5 outline-none disabled:appearance-none disabled:border-transparent disabled:bg-transparent"><option value="">Sin asignar</option>{members.map((entry) => { const member = entry.user || entry; const label = member.username || member.name || member.email; return <option key={member._id || member.id || label} value={label}>{label}</option>; })}</select></td>
                            <td className="px-3 py-3"><textarea disabled={!isEditing} rows="2" value={item.pendingAction || ''} onChange={(event) => updateItem(item._id, 'pendingAction', event.target.value)} className="w-full resize-none rounded-lg border border-orange-100 px-2 py-2 outline-none focus:border-orange-400 disabled:border-transparent disabled:bg-transparent" placeholder={isEditing ? 'Siguiente cambio verificable' : ''} /></td>
                            <td className="px-3 py-3"><input disabled={!isEditing} type="date" value={dateValue(item.lastReview)} onChange={(event) => updateItem(item._id, 'lastReview', event.target.value)} className="w-full rounded-lg border border-orange-100 px-2 py-2 outline-none disabled:border-transparent disabled:bg-transparent" /></td>
                            <td className="border-x border-sky-100 bg-sky-50/70 px-3 py-3"><select disabled={!isEditing} value={item.versions?.[activeVersion - 1] ?? ''} onChange={(event) => updateVersion(item._id, event.target.value)} className="w-full rounded-lg border border-sky-200 bg-sky-50 px-2 py-2 text-center font-black text-sky-700 outline-none disabled:appearance-none"><option value="">-</option>{Array.from({ length: 11 }, (_, index) => index * 0.5).map((score) => <option key={score}>{score}</option>)}</select></td>
                            <td className="px-3 py-4 text-center text-base font-black text-sky-700">{quality ?? '-'}</td>
                            <td className="px-3 py-4 text-center font-black">{average === null ? '-' : average.toFixed(1)}</td>
                            <td className="px-3 py-3"><textarea disabled={!isEditing} rows="2" value={item.notes || ''} onChange={(event) => updateItem(item._id, 'notes', event.target.value)} className="w-full resize-none rounded-lg border border-orange-100 px-2 py-2 outline-none focus:border-orange-400 disabled:border-transparent disabled:bg-transparent" /></td>
                          </tr>;
                        })}
                      </tbody>
                    </table>
                    {!filteredItems.length && <div className="py-16 text-center font-bold text-orange-700">No hay controles que coincidan con los filtros.</div>}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>
    </PortalSidebar>
  );
};

export default ProposalManagementPage;
