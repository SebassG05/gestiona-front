import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowDownUp,
  BadgeEuro,
  Building2,
  CalendarDays,
  CheckSquare,
  ChevronDown,
  CircleUserRound,
  ExternalLink,
  FileText,
  FilePlus2,
  Filter,
  Link as LinkIcon,
  Mail,
  Plus,
  Search,
  SquarePen,
  X,
} from 'lucide-react';
import PortalSidebar from './PortalSidebar.jsx';
import { getPortalProposals } from '../services/proposalService.js';

const sheets = ['Propuestas activas', 'Borradores', 'Enviadas'];

const statusStyles = {
  'En preparacion': 'bg-amber-50 text-amber-700 border-amber-200',
  Enviada: 'bg-sky-50 text-sky-700 border-sky-200',
  'En revision': 'bg-violet-50 text-violet-700 border-violet-200',
  Ganada: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Archivada: 'bg-slate-100 text-slate-600 border-slate-200',
};

const priorityStyles = {
  Alta: 'bg-rose-50 text-rose-600 border-rose-200',
  Media: 'bg-amber-50 text-amber-700 border-amber-200',
  Baja: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const menuButtons = [
  { label: 'Anadir propuesta', icon: Plus, primary: true },
  { label: 'Editar campo', icon: SquarePen, primary: false },
  { label: 'Anadir hoja', icon: FilePlus2, primary: false },
];

const PortalProposalsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { portalId } = useParams();
  const [proposals, setProposals] = useState([]);
  const [selectedProposalId, setSelectedProposalId] = useState(location.state?.selectedProposalId || null);
  const [activeSheet, setActiveSheet] = useState(location.state?.activeSheet || sheets[0]);
  const [searchValue, setSearchValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [notice, setNotice] = useState(location.state?.notice || '');

  useEffect(() => {
    let isMounted = true;

    const loadProposals = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const response = await getPortalProposals(portalId);
        if (isMounted) {
          setProposals(response.data || []);
        }
      } catch (error) {
        if (isMounted) {
          setProposals([]);
          setErrorMessage(error.response?.data?.message || 'No se pudieron cargar las propuestas.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadProposals();

    return () => {
      isMounted = false;
    };
  }, [portalId]);

  useEffect(() => {
    if (!notice) return undefined;
    const timeout = window.setTimeout(() => setNotice(''), 3500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const selectedProposal = useMemo(
    () => proposals.find((proposal) => proposal._id === selectedProposalId) || null,
    [proposals, selectedProposalId]
  );

  const filteredProposals = proposals.filter((proposal) => {
    const lifecycleStatus = proposal.lifecycleStatus || 'active';
    const belongsToSheet =
      (activeSheet === 'Propuestas activas' && lifecycleStatus === 'active') ||
      (activeSheet === 'Borradores' && lifecycleStatus === 'draft') ||
      (activeSheet === 'Enviadas' && lifecycleStatus === 'sent');

    if (!belongsToSheet) return false;

    const normalizedSearch = searchValue.trim().toLowerCase();

    if (!normalizedSearch) return true;

    return [
      proposal.nombre,
      proposal.estado,
      proposal.prioridad,
      proposal.tipo,
      proposal.acronimo,
      proposal.programa,
      proposal.responsable?.username,
      proposal.responsable?.email,
    ].some((field) => String(field || '').toLowerCase().includes(normalizedSearch));
  });

  const formatDate = (value) => {
    if (!value) return '-';
    return new Intl.DateTimeFormat('es-ES').format(new Date(value));
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const handleSheetChange = (sheet) => {
    setActiveSheet(sheet);
    setSelectedProposalId(null);
  };

  return (
    <PortalSidebar>
      <div className="relative min-h-screen overflow-hidden bg-[#fafafa] px-3 py-4 sm:px-4 lg:px-6 xl:px-8">
        <motion.svg
          className="pointer-events-none absolute inset-0 z-0 h-full w-full select-none"
          viewBox="0 0 1440 980"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <motion.path
            d="M-120 140 C 180 40, 470 280, 760 170 S 1120 50, 1560 180"
            fill="none"
            stroke="#fb923c"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.14"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.14 }}
            transition={{ duration: 1.8, ease: 'easeInOut' }}
          />
          <motion.path
            d="M-100 820 C 200 700, 520 910, 810 770 S 1120 560, 1560 710"
            fill="none"
            stroke="#fb7185"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.14"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.14 }}
            transition={{ duration: 2.15, ease: 'easeInOut', delay: 0.18 }}
          />
        </motion.svg>

        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          className="relative z-10 w-full"
        >
          <AnimatePresence>
            {notice && (
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="mb-4 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 shadow-sm"
              >
                <CheckSquare size={18} />
                {notice}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col items-start gap-5 xl:flex-row">
            <motion.section
              layout
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="w-full self-start overflow-hidden rounded-[30px] border border-orange-100 bg-white/92 shadow-[0_24px_80px_rgba(249,115,22,0.08)] backdrop-blur"
            >
              <div className="border-b border-orange-100 px-5 py-5 sm:px-6">
                <p className="text-sm font-semibold uppercase tracking-wide text-rose-400">Propuestas</p>
                <h1
                  style={{ fontFamily: "'AlfaSlabOne', serif" }}
                  className="mt-3 text-3xl leading-tight text-orange-950 sm:text-4xl"
                >
                  Gestion de propuestas
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-black-500 sm:text-base">
                  Centraliza, organiza y da seguimiento a las propuestas activas de tu organizacion en una vista tipo
                  hoja con campos editables y detalle lateral.
                </p>
              </div>

              <div className="border-b border-orange-100 px-3 py-3 sm:px-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex flex-wrap gap-3">
                    {menuButtons.map((button) => {
                      const Icon = button.icon;

                      return (
                        <button
                          key={button.label}
                          type="button"
                          onClick={() => {
                            if (button.primary) {
                              navigate(`/dashboard/portal/${portalId}/proposals/create`);
                            }
                          }}
                          className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                            button.primary
                              ? 'border-orange-500 bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-sm hover:from-orange-600 hover:to-red-600'
                              : 'border-orange-100 bg-white text-orange-900 hover:bg-orange-50'
                          }`}
                        >
                          <Icon size={16} strokeWidth={2.2} />
                          {button.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                    <label className="flex min-w-[240px] items-center gap-3 rounded-xl border border-orange-100 bg-white px-4 py-3 text-sm text-orange-400">
                      <Search size={16} strokeWidth={2.2} className="text-orange-300" />
                      <input
                        value={searchValue}
                        onChange={(event) => setSearchValue(event.target.value)}
                        placeholder="Buscar propuestas..."
                        className="w-full bg-transparent text-sm text-orange-950 outline-none placeholder:text-orange-300"
                      />
                    </label>

                    <button
                      type="button"
                      className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-orange-100 bg-white px-4 py-3 text-sm font-semibold text-orange-900 transition hover:bg-orange-50"
                    >
                      <Filter size={16} strokeWidth={2.1} />
                      Filtrar
                    </button>
                    <button
                      type="button"
                      className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-orange-100 bg-white px-4 py-3 text-sm font-semibold text-orange-900 transition hover:bg-orange-50"
                    >
                      <ArrowDownUp size={16} strokeWidth={2.1} />
                      Ordenar
                    </button>
                    <button
                      type="button"
                      className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-orange-100 bg-white px-4 py-3 text-sm font-semibold text-orange-900 transition hover:bg-orange-50"
                    >
                      Vista
                      <ChevronDown size={16} strokeWidth={2.1} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <div className="min-w-[1240px]">
                  <div className="grid grid-cols-[56px_1.7fr_1fr_1fr_0.9fr_1fr_1.15fr_1fr_1.15fr_0.9fr_1fr] items-center border-b border-orange-100 bg-orange-50/60 px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-wide text-neutral-700 sm:px-6">
                    <div />
                    <div>Nombre de la propuesta</div>
                    <div>Estado</div>
                    <div>Prioridad</div>
                    <div>Tipo</div>
                    <div>Acronimo</div>
                    <div>Programa</div>
                    <div>Deadline</div>
                    <div>Responsable</div>
                    <div>Contactos</div>
                    <div>Entidades clave</div>
                  </div>

                  {isLoading ? (
                    <div className="flex min-h-52 items-center justify-center border-b border-orange-100 bg-white px-6 py-10 text-sm font-semibold text-orange-500">
                      Cargando propuestas...
                    </div>
                  ) : errorMessage ? (
                    <div className="flex min-h-52 items-center justify-center border-b border-red-100 bg-red-50 px-6 py-10 text-center text-sm font-semibold text-red-600">
                      {errorMessage}
                    </div>
                  ) : filteredProposals.length > 0 ? (
                    filteredProposals.map((proposal) => {
                      const isSelected = proposal._id === selectedProposalId;

                      return (
                        <button
                          key={proposal._id}
                          type="button"
                          onClick={() =>
                            setSelectedProposalId((current) => (current === proposal._id ? null : proposal._id))
                          }
                          className={`grid min-h-[76px] w-full cursor-pointer grid-cols-[56px_1.7fr_1fr_1fr_0.9fr_1fr_1.15fr_1fr_1.15fr_0.9fr_1fr] items-center border-b border-orange-100 px-4 text-center transition duration-200 sm:px-6 ${
                            isSelected ? 'bg-orange-50/80' : 'bg-white hover:bg-orange-50/45'
                          }`}
                        >
                          <div className="flex items-center justify-center py-4">
                            <span
                              className={`grid h-5 w-5 place-items-center rounded-md border ${
                                isSelected
                                  ? 'border-orange-400 bg-orange-500 text-white'
                                  : 'border-orange-200 bg-white text-transparent'
                              }`}
                            >
                              <CheckSquare size={14} strokeWidth={2.4} />
                            </span>
                          </div>
                          <div className="flex items-center justify-center px-3 py-4 text-sm font-semibold leading-5 text-orange-950">
                            {proposal.nombre}
                          </div>
                          <div className="flex items-center justify-center px-2 py-4">
                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[proposal.estado] || 'border-neutral-200 bg-neutral-50 text-neutral-500'}`}>
                              {proposal.estado || 'Sin estado'}
                            </span>
                          </div>
                          <div className="flex items-center justify-center px-2 py-4">
                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${priorityStyles[proposal.prioridad] || 'border-neutral-200 bg-neutral-50 text-neutral-500'}`}>
                              {proposal.prioridad || 'Sin prioridad'}
                            </span>
                          </div>
                          <div className="flex items-center justify-center px-3 py-4 text-sm leading-5 text-orange-700">{proposal.tipo || '-'}</div>
                          <div className="flex items-center justify-center px-3 py-4 text-sm leading-5 text-orange-700">{proposal.acronimo || '-'}</div>
                          <div className="flex items-center justify-center px-3 py-4 text-sm leading-5 text-orange-700">{proposal.programa || '-'}</div>
                          <div className="flex items-center justify-center px-3 py-4 text-sm leading-5 text-orange-700">{formatDate(proposal.deadlineApertura)}</div>
                          <div className="flex items-center justify-center px-3 py-4 text-sm leading-5 text-orange-700">
                            {proposal.responsable?.username || proposal.responsable?.email || '-'}
                          </div>
                          <div className="flex items-center justify-center px-3 py-4 text-sm text-orange-700">-</div>
                          <div className="flex items-center justify-center px-3 py-4 text-sm leading-5 text-orange-700">{proposal.coordinadorLead || '-'}</div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="flex min-h-52 items-center justify-center border-b border-orange-100 bg-white px-6 py-10 text-center">
                      <div>
                        <p className="text-lg font-semibold text-orange-950">Todavia no hay propuestas</p>
                        <p className="mt-2 text-sm text-orange-500">
                          {activeSheet === 'Borradores'
                            ? 'Los borradores que guardes para mas tarde apareceran aqui.'
                            : activeSheet === 'Enviadas'
                              ? 'Las propuestas enviadas apareceran aqui.'
                              : 'Crea una nueva propuesta y aparecera aqui automaticamente.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t border-orange-100 px-3 py-3 sm:px-5">
                {sheets.map((sheet) => (
                  <button
                    key={sheet}
                    type="button"
                    onClick={() => handleSheetChange(sheet)}
                    className={`cursor-pointer rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                      activeSheet === sheet
                        ? 'border-orange-200 bg-orange-50 text-orange-600'
                        : 'border-transparent bg-white text-orange-400 hover:border-orange-100 hover:bg-orange-50/70'
                    }`}
                  >
                    {sheet}
                  </button>
                ))}
                <button
                  type="button"
                  className="ml-1 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-orange-100 bg-white text-orange-500 transition hover:bg-orange-50"
                >
                  <Plus size={18} strokeWidth={2.2} />
                </button>
              </div>
            </motion.section>

            <AnimatePresence initial={false}>
              {selectedProposal && (
                <motion.aside
                  layout
                  initial={{ opacity: 0, x: 24, width: 0 }}
                  animate={{ opacity: 1, x: 0, width: 340 }}
                  exit={{ opacity: 0, x: 24, width: 0 }}
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                  className="w-full shrink-0 self-start overflow-hidden xl:w-[340px]"
                >
                  <div className="w-[340px] overflow-hidden rounded-[28px] border border-orange-100 bg-white shadow-[0_24px_80px_rgba(249,115,22,0.10)]">
                    <div className="flex items-start justify-between border-b border-orange-100 bg-gradient-to-br from-orange-50 to-rose-50 px-5 py-5">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-orange-500">Detalle de propuesta</p>
                        <h2 className="mt-2 truncate text-xl font-semibold text-orange-950">{selectedProposal.nombre}</h2>
                        <p className="mt-1 text-xs text-orange-500">
                          {selectedProposal.proposalId || selectedProposal.acronimo || 'Sin identificador'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedProposalId(null)}
                        className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-xl text-orange-500 transition hover:bg-white"
                        aria-label="Cerrar detalle"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="space-y-3 p-4">
                      {selectedProposal.lifecycleStatus === 'draft' && (
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/dashboard/portal/${portalId}/proposals/${selectedProposal._id}/edit`
                            )
                          }
                          className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-orange-500 bg-gradient-to-r from-orange-500 to-red-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-orange-600 hover:to-red-600"
                        >
                          <SquarePen size={17} strokeWidth={2.2} />
                          Continuar editando
                        </button>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <DetailCard label="Estado" value={selectedProposal.estado || 'Sin estado'} />
                        <DetailCard label="Prioridad" value={selectedProposal.prioridad || 'Sin prioridad'} />
                        <DetailCard label="Programa" value={selectedProposal.programa || '-'} />
                        <DetailCard label="Deadline" value={formatDate(selectedProposal.deadlineApertura)} />
                      </div>

                      <DetailSection icon={CircleUserRound} title="Responsable">
                        {selectedProposal.responsable?.username || selectedProposal.responsable?.email || 'Sin asignar'}
                      </DetailSection>
                      <DetailSection icon={Mail} title="Contactos y mails">
                        {selectedProposal.responsable?.email || 'Sin contactos registrados'}
                      </DetailSection>
                      <DetailSection icon={Building2} title="Coordinador / Lead">
                        {selectedProposal.coordinadorLead || 'Sin definir'}
                      </DetailSection>
                      <DetailSection icon={CalendarDays} title="Proxima accion">
                        {selectedProposal.proximaAccion || 'Sin acciones pendientes'}
                      </DetailSection>
                      <DetailSection icon={BadgeEuro} title="Datos economicos">
                        <div className="space-y-1">
                          <p>Presupuesto total: {formatCurrency(selectedProposal.presupuestoTotal)}</p>
                          <p>Presupuesto EVENOR: {formatCurrency(selectedProposal.presupuestoEvenor)}</p>
                          <p>Balance pendiente: {formatCurrency(selectedProposal.balancePendiente)}</p>
                        </div>
                      </DetailSection>
                      <DetailSection icon={FileText} title="Notas">
                        {selectedProposal.notas || 'Sin notas adicionales'}
                      </DetailSection>
                      {selectedProposal.fuenteUrl && (
                        <a
                          href={selectedProposal.fuenteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex cursor-pointer items-center justify-between rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-700 transition hover:bg-orange-100"
                        >
                          <span className="inline-flex items-center gap-2">
                            <LinkIcon size={16} />
                            Abrir fuente
                          </span>
                          <ExternalLink size={15} />
                        </a>
                      )}
                    </div>
                  </div>
                </motion.aside>
              )}
            </AnimatePresence>
          </div>
        </motion.main>
      </div>
    </PortalSidebar>
  );
};

const DetailCard = ({ label, value }) => (
  <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-3">
    <p className="text-[11px] font-semibold uppercase tracking-wide text-orange-500">{label}</p>
    <p className="mt-2 break-words text-sm font-semibold text-orange-950">{value}</p>
  </div>
);

const DetailSection = ({ icon: Icon, title, children }) => (
  <section className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm">
    <div className="flex items-center gap-3">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-orange-50 text-orange-500">
        <Icon size={17} strokeWidth={2.1} />
      </span>
      <h3 className="text-sm font-semibold text-orange-950">{title}</h3>
    </div>
    <div className="mt-3 break-words text-sm leading-6 text-orange-700">{children}</div>
  </section>
);

export default PortalProposalsPage;
