import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowDownUp,
  CheckSquare,
  ChevronDown,
  FilePlus2,
  Filter,
  Plus,
  Search,
  SquarePen,
} from 'lucide-react';
import PortalSidebar from './PortalSidebar.jsx';

const sheets = ['Propuestas activas', 'Borradores', 'Enviadas'];

const proposals = [];

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
  const { portalId } = useParams();
  const [selectedProposalId, setSelectedProposalId] = useState(null);
  const [activeSheet, setActiveSheet] = useState(sheets[0]);
  const [searchValue, setSearchValue] = useState('');
  const selectedProposal = proposals.find((proposal) => proposal.id === selectedProposalId) || null;

  const filteredProposals = proposals.filter((proposal) => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    if (!normalizedSearch) return true;

    return [
      proposal.name,
      proposal.status,
      proposal.priority,
      proposal.topic,
      proposal.keyword,
      proposal.program,
      proposal.owner,
    ].some((field) => field.toLowerCase().includes(normalizedSearch));
  });

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
          className="relative z-10 mx-auto max-w-[1600px]"
        >
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
                <div className="min-w-[1120px]">
                  <div className="grid grid-cols-[48px_1.6fr_1fr_0.8fr_1fr_1.3fr_1fr_0.8fr_1fr_0.7fr_0.9fr] border-b border-orange-100 bg-orange-50/60 px-3 py-2.5 text-[12px] font-semibold uppercase tracking-wide text-black-400 sm:px-5">
                    <div />
                    <div>Nombre de la propuesta</div>
                    <div>Estado</div>
                    <div>Prioridad</div>
                    <div>Tematica</div>
                    <div>Palabra clave</div>
                    <div>Programa</div>
                    <div>Deadline</div>
                    <div>Responsable</div>
                    <div>Contactos</div>
                    <div>Entidades clave</div>
                  </div>

                  {filteredProposals.length > 0 ? (
                    filteredProposals.map((proposal) => {
                      const isSelected = proposal.id === selectedProposalId;

                      return (
                        <button
                          key={proposal.id}
                          type="button"
                          onClick={() =>
                            setSelectedProposalId((current) => (current === proposal.id ? null : proposal.id))
                          }
                          className={`grid w-full cursor-pointer grid-cols-[48px_1.6fr_1fr_0.8fr_1fr_1.3fr_1fr_0.8fr_1fr_0.7fr_0.9fr] items-stretch border-b border-orange-100 px-3 text-left transition sm:px-5 ${
                            isSelected ? 'bg-orange-50/70' : 'bg-white hover:bg-orange-50/40'
                          }`}
                        >
                          <div className="flex items-center justify-center border-r border-orange-100 py-3">
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
                          <div className="flex items-center py-3 pr-4 text-sm font-semibold text-orange-950">
                            {proposal.name}
                          </div>
                          <div className="flex items-center py-3 pr-4">
                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[proposal.status]}`}>
                              {proposal.status}
                            </span>
                          </div>
                          <div className="flex items-center py-3 pr-4">
                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${priorityStyles[proposal.priority]}`}>
                              {proposal.priority}
                            </span>
                          </div>
                          <div className="flex items-center py-3 pr-4 text-sm text-orange-700">{proposal.topic}</div>
                          <div className="flex items-center py-3 pr-4 text-sm text-orange-700">{proposal.keyword}</div>
                          <div className="flex items-center py-3 pr-4 text-sm text-orange-700">{proposal.program}</div>
                          <div className="flex items-center py-3 pr-4 text-sm text-orange-700">{proposal.deadline}</div>
                          <div className="flex items-center py-3 pr-4 text-sm text-orange-700">{proposal.owner}</div>
                          <div className="flex items-center py-3 pr-4 text-sm text-orange-700">{proposal.contacts}</div>
                          <div className="flex items-center py-3 text-sm text-orange-700">{proposal.entities}</div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="flex min-h-52 items-center justify-center border-b border-orange-100 bg-white px-6 py-10 text-center">
                      <div>
                        <p className="text-lg font-semibold text-orange-950">Todavia no hay propuestas</p>
                        <p className="mt-2 text-sm text-orange-500">
                          Cuando conectemos los datos reales o crees una nueva propuesta, apareceran aqui.
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
                    onClick={() => setActiveSheet(sheet)}
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
                  className="w-full shrink-0 self-start space-y-4 overflow-hidden xl:w-[340px]"
                />
              )}
            </AnimatePresence>
          </div>
        </motion.main>
      </div>
    </PortalSidebar>
  );
};

export default PortalProposalsPage;
