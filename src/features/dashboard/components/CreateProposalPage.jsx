import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  FileText,
  Link as LinkIcon,
  Lightbulb,
  RotateCcw,
  Save,
} from 'lucide-react';
import PortalSidebar from './PortalSidebar.jsx';
import { getPortalMembers } from '../services/portalService.js';
import {
  createProposal,
  getProposal,
  updateProposal,
} from '../services/proposalService.js';

const programOptions = [
  'Horizon Europe',
  'EEA',
  'ESA',
  'Cascading Funding',
  'LIFE',
  'Interreg',
  'Erasmus+',
  'CINEA',
  'EFSA',
  'Nacional/CPI',
];

const phaseOptions = [
  'Prospeccion',
  'Concept Note',
  'Consorcio',
  'Escritura',
  'Revision',
  'Enviada',
  'Evaluacion',
  'Negociacion',
  'Ganada',
  'Perdida',
];

const statusOptions = ['En preparacion', 'Enviada', 'En revision', 'Ganada', 'Archivada'];
const priorityOptions = ['Alta', 'Media', 'Baja'];

const proposalFields = [
  { name: 'nombre', label: 'Nombre de la propuesta', type: 'text', placeholder: 'Ej. EcoInnovate 2025', required: true },
  { name: 'id', label: 'ID', type: 'text', placeholder: 'PRP-2025-001' },
  { name: 'programa', label: 'Programa', type: 'select', options: programOptions },
  { name: 'convocatoria', label: 'Convocatoria', type: 'text', placeholder: 'Convocatoria vinculada' },
  { name: 'acronimo', label: 'Acronimo', type: 'text', placeholder: 'Ej. ECO2025' },
  { name: 'tipo', label: 'Tipo', type: 'text', placeholder: 'RIA, IA, CSA...' },
  { name: 'deadlineApertura', label: 'Deadline/Apertura', type: 'date' },
  { name: 'fase', label: 'Fase actual', type: 'select', options: phaseOptions },
  { name: 'estado', label: 'Estado', type: 'select', options: statusOptions },
  { name: 'prioridad', label: 'Prioridad', type: 'select', options: priorityOptions },
  { name: 'responsable', label: 'Responsable', type: 'memberSelect' },
  { name: 'rolEvenor', label: 'Rol EVENOR', type: 'text', placeholder: 'Coordinador, socio, lead...' },
  { name: 'coordinadorLead', label: 'Coordinador/Lead', type: 'text', placeholder: 'Entidad o persona lead' },
  { name: 'presupuestoTotal', label: 'Presupuesto total (EUR)', type: 'number', placeholder: '0' },
  { name: 'presupuestoEvenor', label: 'Presupuesto EVENOR (EUR)', type: 'number', placeholder: '0' },
  { name: 'probabilidad', label: 'Probabilidad (%)', type: 'number', placeholder: '0' },
  { name: 'valorEsperado', label: 'Valor esperado (EUR)', type: 'number', placeholder: '0' },
  { name: 'proyectoEjecucionVinculado', label: 'Proyecto ejecucion vinculado', type: 'text', placeholder: 'Proyecto relacionado' },
  { name: 'pagosRecibidosVinculados', label: 'Pagos recibidos vinculados (EUR)', type: 'number', placeholder: '0' },
  { name: 'balancePendiente', label: 'Balance pendiente (EUR)', type: 'number', placeholder: '0' },
  { name: 'proximaAccion', label: 'Proxima accion', type: 'text', placeholder: 'Siguiente paso pendiente' },
  { name: 'fuenteUrl', label: 'Fuente/URL', type: 'url', placeholder: 'https://...' },
  { name: 'notas', label: 'Notas', type: 'textarea', placeholder: 'Anotaciones relevantes de la propuesta' },
];

const fieldsByName = proposalFields.reduce((fields, field) => {
  fields[field.name] = field;
  return fields;
}, {});

const initialFormState = proposalFields.reduce((fields, field) => {
  fields[field.name] = '';
  return fields;
}, {});

const steps = [
  {
    title: 'Informacion general',
    description: 'Define los datos basicos de tu propuesta.',
    fields: ['nombre', 'acronimo', 'programa', 'convocatoria', 'deadlineApertura', 'fase', 'estado', 'prioridad'],
  },
  {
    title: 'Programa y convocatoria',
    description: 'Completa el marco de financiacion y referencia.',
    fields: ['id', 'tipo', 'fuenteUrl', 'proximaAccion', 'proyectoEjecucionVinculado'],
  },
  {
    title: 'Responsables y equipo',
    description: 'Asigna responsables y define el papel de EVENOR.',
    fields: ['responsable', 'rolEvenor', 'coordinadorLead'],
  },
  {
    title: 'Documentos y notas',
    description: 'Anade importes, balance y notas finales.',
    fields: [
      'presupuestoTotal',
      'presupuestoEvenor',
      'probabilidad',
      'valorEsperado',
      'pagosRecibidosVinculados',
      'balancePendiente',
      'notas',
    ],
  },
];

const CreateProposalPage = () => {
  const navigate = useNavigate();
  const { portalId, proposalId } = useParams();
  const [formData, setFormData] = useState(initialFormState);
  const [savedMessage, setSavedMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [members, setMembers] = useState([]);
  const [membersError, setMembersError] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoadingProposal, setIsLoadingProposal] = useState(Boolean(proposalId));

  const activeStep = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const isEditing = Boolean(proposalId);
  const proposalsPath = `/dashboard/portal/${portalId}/proposals`;

  useEffect(() => {
    let isMounted = true;

    const loadMembers = async () => {
      try {
        const response = await getPortalMembers(portalId);
        if (isMounted) {
          setMembers(response.data || []);
          setMembersError('');
        }
      } catch (error) {
        if (isMounted) {
          setMembers([]);
          setMembersError(error.response?.data?.message || 'No se pudieron cargar los responsables');
        }
      }
    };

    loadMembers();

    return () => {
      isMounted = false;
    };
  }, [portalId]);

  useEffect(() => {
    if (!proposalId) return undefined;

    let isMounted = true;

    const loadProposal = async () => {
      setIsLoadingProposal(true);
      setErrorMessage('');

      try {
        const response = await getProposal({ portalId, proposalId });
        const proposal = response.data;

        if (isMounted) {
          setFormData({
            ...initialFormState,
            nombre: proposal.nombre === 'Borrador sin titulo' ? '' : proposal.nombre || '',
            id: proposal.proposalId || '',
            programa: proposal.programa || '',
            convocatoria: proposal.convocatoria || '',
            acronimo: proposal.acronimo || '',
            tipo: proposal.tipo || '',
            deadlineApertura: proposal.deadlineApertura
              ? new Date(proposal.deadlineApertura).toISOString().slice(0, 10)
              : '',
            fase: proposal.fase || '',
            estado: proposal.estado || '',
            prioridad: proposal.prioridad || '',
            responsable: proposal.responsable?._id || '',
            rolEvenor: proposal.rolEvenor || '',
            coordinadorLead: proposal.coordinadorLead || '',
            presupuestoTotal: proposal.presupuestoTotal ?? '',
            presupuestoEvenor: proposal.presupuestoEvenor ?? '',
            probabilidad: proposal.probabilidad ?? '',
            valorEsperado: proposal.valorEsperado ?? '',
            proyectoEjecucionVinculado: proposal.proyectoEjecucionVinculado || '',
            pagosRecibidosVinculados: proposal.pagosRecibidosVinculados ?? '',
            balancePendiente: proposal.balancePendiente ?? '',
            proximaAccion: proposal.proximaAccion || '',
            fuenteUrl: proposal.fuenteUrl || '',
            notas: proposal.notas || '',
          });
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error.response?.data?.message || 'No se pudo cargar el borrador.');
        }
      } finally {
        if (isMounted) setIsLoadingProposal(false);
      }
    };

    loadProposal();

    return () => {
      isMounted = false;
    };
  }, [portalId, proposalId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentData) => ({ ...currentData, [name]: value }));
    setSavedMessage('');
    setErrorMessage('');
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setCurrentStep(0);
    setSavedMessage('');
    setErrorMessage('');
  };

  const persistProposal = async (lifecycleStatus) => {
    if (lifecycleStatus === 'active' && !formData.nombre.trim()) {
      setCurrentStep(0);
      setErrorMessage('El nombre de la propuesta es obligatorio.');
      return;
    }

    setIsSaving(true);
    setSavedMessage('');
    setErrorMessage('');

    try {
      const data = { ...formData, lifecycleStatus };
      const response = isEditing
        ? await updateProposal({ portalId, proposalId, data })
        : await createProposal({ portalId, data });
      const savedId = response.data?.id || response.data?._id || proposalId;
      const isDraft = lifecycleStatus === 'draft';

      navigate(proposalsPath, {
        replace: true,
        state: {
          selectedProposalId: isDraft ? null : savedId,
          activeSheet: isDraft ? 'Borradores' : 'Propuestas activas',
          notice: isDraft
            ? 'Borrador guardado. Podras continuar editandolo cuando quieras.'
            : 'Propuesta guardada correctamente.',
        },
      });
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'No se pudo guardar la propuesta.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await persistProposal('active');
  };

  const handleSaveDraft = async () => {
    await persistProposal('draft');
  };

  const goToNextStep = () => {
    if (isLastStep) return;
    setCurrentStep((step) => step + 1);
    setSavedMessage('');
  };

  const goToPreviousStep = () => {
    if (isFirstStep) return;
    setCurrentStep((step) => step - 1);
    setSavedMessage('');
  };

  const fieldBaseClass =
    'w-full rounded-xl border border-orange-100 bg-white px-4 py-3 text-sm text-orange-950 outline-none transition placeholder:text-orange-300 focus:border-orange-300 focus:ring-4 focus:ring-orange-100';

  const renderField = (fieldName) => {
    const field = fieldsByName[fieldName];

    return (
      <label
        key={field.name}
        className={field.type === 'textarea' ? 'md:col-span-2 xl:col-span-3' : ''}
      >
        <span className="mb-2 block text-xs font-semibold text-orange-950">
          {field.label}
          {field.required && <span className="ml-1 text-red-500">*</span>}
        </span>

        {field.type === 'textarea' ? (
          <textarea
            name={field.name}
            value={formData[field.name]}
            onChange={handleChange}
            placeholder={field.placeholder}
            rows={5}
            className={`${fieldBaseClass} resize-none`}
          />
        ) : field.type === 'select' ? (
          <select
            name={field.name}
            value={formData[field.name]}
            onChange={handleChange}
            className={fieldBaseClass}
          >
            <option value="">Seleccionar</option>
            {field.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : field.type === 'memberSelect' ? (
          <>
            <select
              name={field.name}
              value={formData[field.name]}
              onChange={handleChange}
              className={fieldBaseClass}
            >
              <option value="">Seleccionar responsable</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.username || member.email}
                  {member.role === 'owner' ? ' - creador' : ''}
                </option>
              ))}
            </select>
            {membersError && <p className="mt-2 text-xs font-medium text-red-600">{membersError}</p>}
          </>
        ) : (
          <div className="relative">
            <input
              name={field.name}
              type={field.type}
              value={formData[field.name]}
              onChange={handleChange}
              required={field.required}
              placeholder={field.placeholder}
              className={fieldBaseClass}
            />
            {field.type === 'url' && (
              <LinkIcon
                size={16}
                strokeWidth={2.1}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-orange-300"
              />
            )}
          </div>
        )}
      </label>
    );
  };

  return (
    <PortalSidebar>
      <div className="relative min-h-screen overflow-hidden bg-[#fafafa] px-4 py-6 sm:px-6 lg:px-8">
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
          className="relative z-10 mx-auto max-w-[1500px]"
        >
          <form onSubmit={handleSubmit}>
            <header className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-start gap-4">
                <button
                  type="button"
                  onClick={() => navigate(proposalsPath)}
                  className="grid h-12 w-12 shrink-0 cursor-pointer place-items-center rounded-2xl border border-orange-100 bg-white text-orange-500 shadow-sm transition hover:bg-orange-50"
                  aria-label="Volver"
                >
                  <ArrowLeft size={19} strokeWidth={2.2} />
                </button>

                <div>
                  <p className="text-sm font-semibold text-orange-500">
                    {isEditing ? 'Editar borrador' : 'Nueva propuesta'}
                  </p>
                  <h1 className="mt-2 text-3xl font-semibold text-orange-950 sm:text-4xl">
                    {isEditing ? 'Continuar propuesta' : 'Crear propuesta'}
                  </h1>
                  <p className="mt-2 text-sm text-orange-500">
                    {isEditing
                      ? 'Retoma la propuesta donde la dejaste y completa solo lo que necesites.'
                      : 'Introduce la informacion basica para dar de alta una nueva propuesta.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate(proposalsPath)}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-orange-100 bg-white px-5 py-3 text-sm font-semibold text-orange-950 transition hover:bg-orange-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isSaving || isLoadingProposal}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Bookmark size={16} strokeWidth={2.2} />
                  {isSaving ? 'Guardando...' : 'Poner en borrador'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isSaving || isLoadingProposal}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-red-100 bg-white px-5 py-3 text-sm font-semibold text-red-500 transition hover:bg-red-50"
                >
                  <RotateCcw size={16} strokeWidth={2.2} />
                  Limpiar
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isLoadingProposal}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-orange-500 bg-gradient-to-r from-orange-500 to-red-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-orange-600 hover:to-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save size={16} strokeWidth={2.2} />
                  {isSaving ? 'Guardando...' : isEditing ? 'Guardar propuesta' : 'Guardar propuesta'}
                </button>
              </div>
            </header>

            <section className="overflow-hidden rounded-[28px] border border-orange-100 bg-white/92 shadow-[0_24px_80px_rgba(249,115,22,0.08)] backdrop-blur">
              <div className="border-b border-orange-100 px-5 py-7 sm:px-8">
                <div className="grid gap-4 md:grid-cols-4">
                  {steps.map((step, index) => {
                    const isActive = index === currentStep;
                    const isDone = index < currentStep;

                    return (
                      <button
                        key={step.title}
                        type="button"
                        onClick={() => setCurrentStep(index)}
                        className="group relative flex cursor-pointer flex-col items-center gap-3 text-center"
                      >
                        <span
                          className={`relative z-10 grid h-9 w-9 place-items-center rounded-full border text-sm font-semibold transition ${
                            isActive
                              ? 'border-orange-500 bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-sm'
                              : isDone
                                ? 'border-orange-500 bg-orange-500 text-white'
                                : 'border-neutral-200 bg-neutral-200 text-neutral-500 group-hover:border-orange-200'
                          }`}
                        >
                          {index + 1}
                        </span>
                        <span className={`text-xs font-semibold ${isActive ? 'text-orange-500' : 'text-neutral-500'}`}>
                          {step.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-5 sm:p-6">
                {isLoadingProposal && (
                  <div className="mb-5 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-700">
                    Cargando borrador...
                  </div>
                )}
                {savedMessage && (
                  <div className="mb-5 flex items-center gap-3 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-950">
                    <Check size={17} strokeWidth={2.2} />
                    {savedMessage}
                  </div>
                )}
                {errorMessage && (
                  <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                    {errorMessage}
                  </div>
                )}

                <div className="rounded-[24px] border border-orange-100 bg-white p-5 sm:p-6">
                  <div className="mb-6 flex items-start gap-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-orange-50 text-orange-500">
                      <FileText size={20} strokeWidth={2.1} />
                    </span>
                    <div>
                      <h2 className="text-xl font-semibold text-orange-950">{activeStep.title}</h2>
                      <p className="mt-1 text-sm text-orange-500">{activeStep.description}</p>
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeStep.title}
                      initial={{ opacity: 0, x: 18 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -18 }}
                      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                      className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
                    >
                      {activeStep.fields.map((fieldName) => renderField(fieldName))}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              <footer className="flex flex-col gap-3 border-t border-orange-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <button
                  type="button"
                  onClick={goToPreviousStep}
                  disabled={isFirstStep}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-orange-100 bg-white px-5 py-3 text-sm font-semibold text-orange-950 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowLeft size={16} strokeWidth={2.2} />
                  Paso anterior
                </button>

                {isLastStep ? (
                  <button
                  type="submit"
                    disabled={isSaving}
                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-orange-500 bg-gradient-to-r from-orange-500 to-red-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-orange-600 hover:to-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Save size={16} strokeWidth={2.2} />
                    {isSaving ? 'Guardando...' : 'Guardar propuesta'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={goToNextStep}
                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-orange-500 bg-gradient-to-r from-orange-500 to-red-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-orange-600 hover:to-red-600"
                  >
                    Siguiente paso
                    <ArrowRight size={16} strokeWidth={2.2} />
                  </button>
                )}
              </footer>
            </section>

            <aside className="mt-5 flex items-start gap-4 rounded-[24px] border border-orange-200 bg-gradient-to-r from-orange-50 via-white to-rose-50 px-5 py-4 shadow-[0_18px_60px_rgba(249,115,22,0.08)]">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-orange-500 shadow-sm ring-1 ring-orange-100">
                <Lightbulb size={20} strokeWidth={2.2} />
              </span>
              <div>
                <p className="text-sm font-semibold text-orange-950">Puedes empezar con lo esencial</p>
                <p className="mt-1 text-sm leading-6 text-orange-700">
                  Solo necesitas indicar el nombre para guardar la propuesta. Todos los demas datos son opcionales y
                  podras completarlos tranquilamente mas adelante.
                </p>
              </div>
            </aside>
          </form>
        </motion.main>
      </div>
    </PortalSidebar>
  );
};

export default CreateProposalPage;
