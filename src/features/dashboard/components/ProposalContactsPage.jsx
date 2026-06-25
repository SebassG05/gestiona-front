import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ExternalLink,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Search,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import PortalSidebar from './PortalSidebar.jsx';
import {
  createProposalContact,
  deleteProposalContact,
  getProposalContacts,
  updateProposalContact,
} from '../services/proposalContactService.js';
import {
  createProposalRelation,
  deleteProposalRelation,
  getProposalRelations,
  updateProposalRelation,
} from '../services/proposalRelationService.js';

const relationshipStatuses = [
  'Por contactar',
  'Contactado',
  'En seguimiento',
  'Confirmado',
  'Descartado',
];

const emptyItems = {
  contacts: {
    name: '',
    organization: '',
    position: '',
    email: '',
    phone: '',
    relationshipStatus: 'Por contactar',
    lastContactAt: '',
    nextAction: '',
    notes: '',
  },
  opportunities: {
    destination: '',
    subDestination: '',
    topicId: '',
    opening: '',
    deadline: '',
    company: '',
    project: '',
    role: '',
    email: '',
    typeOfAction: '',
    linkCall: '',
    announcement: '',
    potentialMessage: '',
  },
  companies: {
    acronym: '',
    entities: '',
    countries: '',
    pilots: '',
    nda: '',
    emailList: '',
    partA: '',
    participantPortalInvitation: '',
  },
};

const sections = {
  contacts: {
    label: 'Contactos',
    singular: 'contacto',
    newLabel: 'Nuevo contacto',
    addedLabel: 'añadido',
    updatedLabel: 'actualizado',
    description: 'Personas con las que quieres hablar o ya has contactado.',
    icon: Users,
    addIcon: UserPlus,
    searchPlaceholder: 'Buscar contactos...',
  },
  opportunities: {
    label: 'Oportunidades',
    singular: 'oportunidad',
    newLabel: 'Nueva oportunidad',
    addedLabel: 'añadida',
    updatedLabel: 'actualizada',
    description: 'Convocatorias, acciones y posibilidades vinculadas a la propuesta.',
    icon: BriefcaseBusiness,
    addIcon: BriefcaseBusiness,
    searchPlaceholder: 'Buscar oportunidades...',
  },
  companies: {
    label: 'Empresas',
    singular: 'empresa',
    newLabel: 'Nueva empresa',
    addedLabel: 'añadida',
    updatedLabel: 'actualizada',
    description: 'Entidades y empresas que participan o podrían participar.',
    icon: Building2,
    addIcon: Building2,
    searchPlaceholder: 'Buscar empresas...',
  },
};

const fields = {
  contacts: [
    { name: 'name', label: 'Nombre *', required: true },
    { name: 'organization', label: 'Organización' },
    { name: 'position', label: 'Cargo' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'phone', label: 'Teléfono' },
    {
      name: 'relationshipStatus',
      label: 'Estado de relación',
      type: 'select',
      options: relationshipStatuses,
    },
    { name: 'lastContactAt', label: 'Último contacto', type: 'date' },
    { name: 'nextAction', label: 'Próxima acción' },
    { name: 'notes', label: 'Notas', type: 'textarea', wide: true },
  ],
  opportunities: [
    { name: 'destination', label: 'Destination' },
    { name: 'subDestination', label: 'Sub-Destination' },
    { name: 'topicId', label: 'Topic ID' },
    { name: 'opening', label: 'Opening', type: 'date' },
    { name: 'deadline', label: 'Deadline', type: 'date' },
    { name: 'company', label: 'Empresa' },
    { name: 'project', label: 'Proyecto' },
    { name: 'role', label: 'ROL' },
    { name: 'email', label: 'Correo', type: 'email' },
    { name: 'typeOfAction', label: 'Type of Action' },
    { name: 'linkCall', label: 'Link call', type: 'url' },
    {
      name: 'announcement',
      label: 'Anuncio (Y/N)',
      type: 'select',
      options: ['', 'Y', 'N'],
      optionLabels: ['Sin definir', 'Sí', 'No'],
    },
    { name: 'potentialMessage', label: 'Potencial mensaje', type: 'textarea', wide: true },
  ],
  companies: [
    { name: 'acronym', label: 'Acrónimo' },
    { name: 'entities', label: 'ENTITIES' },
    { name: 'countries', label: 'COUNTRIES' },
    { name: 'pilots', label: 'PILOTOS' },
    {
      name: 'nda',
      label: 'NDA',
      type: 'select',
      options: ['', 'Y', 'N'],
      optionLabels: ['Sin definir', 'Sí', 'No'],
    },
    { name: 'emailList', label: 'Email LIST', type: 'textarea', wide: true },
    { name: 'partA', label: 'Part A', type: 'textarea', wide: true },
    {
      name: 'participantPortalInvitation',
      label: 'Participant Portal Invitation',
      type: 'textarea',
      wide: true,
    },
  ],
};

const statusClasses = {
  'Por contactar': 'border-amber-200 bg-amber-50 text-amber-700',
  Contactado: 'border-sky-200 bg-sky-50 text-sky-700',
  'En seguimiento': 'border-violet-200 bg-violet-50 text-violet-700',
  Confirmado: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Descartado: 'border-slate-200 bg-slate-100 text-slate-600',
};

const formatDate = (value) =>
  value ? new Intl.DateTimeFormat('es-ES').format(new Date(value)) : '';

const toFormValue = (field, value) => {
  if (field.type === 'date' && value) return new Date(value).toISOString().slice(0, 10);
  return value || '';
};

const ProposalContactsPage = () => {
  const navigate = useNavigate();
  const { portalId, proposalId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedView = searchParams.get('view');
  const initialSection = sections[requestedView] ? requestedView : 'contacts';
  const [activeSection, setActiveSection] = useState(initialSection);
  const [proposal, setProposal] = useState(null);
  const [itemsBySection, setItemsBySection] = useState({
    contacts: [],
    opportunities: [],
    companies: [],
  });
  const [searchValue, setSearchValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(emptyItems[initialSection]);
  const [isSaving, setIsSaving] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadAll = async ({ showLoader = true } = {}) => {
    if (showLoader) setIsLoading(true);
    setErrorMessage('');

    try {
      const [contactsResponse, opportunitiesResponse, companiesResponse] = await Promise.all([
        getProposalContacts({ portalId, proposalId }),
        getProposalRelations({ portalId, proposalId, resource: 'opportunities' }),
        getProposalRelations({ portalId, proposalId, resource: 'companies' }),
      ]);

      setProposal(contactsResponse.data?.proposal || null);
      setItemsBySection({
        contacts: contactsResponse.data?.contacts || [],
        opportunities: opportunitiesResponse.data?.items || [],
        companies: companiesResponse.data?.items || [],
      });
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'No se pudieron cargar los datos.');
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      getProposalContacts({ portalId, proposalId }),
      getProposalRelations({ portalId, proposalId, resource: 'opportunities' }),
      getProposalRelations({ portalId, proposalId, resource: 'companies' }),
    ])
      .then(([contactsResponse, opportunitiesResponse, companiesResponse]) => {
        if (!isMounted) return;

        setProposal(contactsResponse.data?.proposal || null);
        setItemsBySection({
          contacts: contactsResponse.data?.contacts || [],
          opportunities: opportunitiesResponse.data?.items || [],
          companies: companiesResponse.data?.items || [],
        });
        setErrorMessage('');
      })
      .catch((error) => {
        if (isMounted) {
          setErrorMessage(error.response?.data?.message || 'No se pudieron cargar los datos.');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [portalId, proposalId]);

  useEffect(() => {
    if (!notice) return undefined;
    const timeout = window.setTimeout(() => setNotice(''), 3500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const activeItems = itemsBySection[activeSection];
  const activeConfig = sections[activeSection];
  const ActiveIcon = activeConfig.icon;
  const AddIcon = activeConfig.addIcon;

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLocaleLowerCase('es');
    if (!normalizedSearch) return activeItems;

    return activeItems.filter((item) =>
      Object.values(item).some((value) =>
        String(value || '').toLocaleLowerCase('es').includes(normalizedSearch)
      )
    );
  }, [activeItems, searchValue]);

  const changeSection = (section) => {
    if (section === activeSection) return;
    setActiveSection(section);
    setSearchParams(section === 'contacts' ? {} : { view: section }, { replace: true });
    setSearchValue('');
    setErrorMessage('');
    setIsEditorOpen(false);
    setEditingItem(null);
    setFormData(emptyItems[section]);
  };

  const openCreateEditor = () => {
    setEditingItem(null);
    setFormData({ ...emptyItems[activeSection] });
    setErrorMessage('');
    setIsEditorOpen(true);
  };

  const openEditEditor = (item) => {
    const nextData = {};
    fields[activeSection].forEach((field) => {
      nextData[field.name] = toFormValue(field, item[field.name]);
    });
    setEditingItem(item);
    setFormData(nextData);
    setErrorMessage('');
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    if (isSaving) return;
    setIsEditorOpen(false);
    setEditingItem(null);
    setFormData({ ...emptyItems[activeSection] });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const canSave =
    activeSection === 'contacts'
      ? Boolean(formData.name?.trim())
      : activeSection === 'opportunities'
        ? Boolean(formData.destination?.trim() || formData.topicId?.trim())
        : Boolean(formData.acronym?.trim() || formData.entities?.trim());

  const handleSave = async (event) => {
    event.preventDefault();
    if (!canSave || isSaving) return;

    setIsSaving(true);
    setErrorMessage('');

    try {
      if (activeSection === 'contacts') {
        if (editingItem) {
          await updateProposalContact({
            portalId,
            proposalId,
            contactId: editingItem._id,
            data: formData,
          });
        } else {
          await createProposalContact({ portalId, proposalId, data: formData });
        }
      } else if (editingItem) {
        await updateProposalRelation({
          portalId,
          proposalId,
          resource: activeSection,
          itemId: editingItem._id,
          data: formData,
        });
      } else {
        await createProposalRelation({
          portalId,
          proposalId,
          resource: activeSection,
          data: formData,
        });
      }

      setNotice(
        `${activeConfig.singular[0].toUpperCase()}${activeConfig.singular.slice(1)} ${
          editingItem ? activeConfig.updatedLabel : activeConfig.addedLabel
        } correctamente.`
      );
      setIsEditorOpen(false);
      setEditingItem(null);
      setFormData({ ...emptyItems[activeSection] });
      await loadAll({ showLoader: false });
    } catch (error) {
      const validationMessage = error.response?.data?.errors?.[0]?.message;
      setErrorMessage(
        validationMessage || error.response?.data?.message || 'No se pudo guardar el registro.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete || isDeleting) return;
    setIsDeleting(true);

    try {
      if (activeSection === 'contacts') {
        await deleteProposalContact({
          portalId,
          proposalId,
          contactId: itemToDelete._id,
        });
      } else {
        await deleteProposalRelation({
          portalId,
          proposalId,
          resource: activeSection,
          itemId: itemToDelete._id,
        });
      }

      setItemToDelete(null);
      setNotice('Registro eliminado correctamente.');
      await loadAll({ showLoader: false });
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'No se pudo eliminar el registro.');
      setItemToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <PortalSidebar>
      <div className="relative min-h-screen overflow-hidden bg-[#fafafa] px-4 py-5 sm:px-6 lg:px-8">
        <BackgroundLines />

        <main className="relative z-10 mx-auto w-full max-w-[1500px]">
          <header className="mb-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-4">
              <button
                type="button"
                onClick={() => navigate(`/dashboard/portal/${portalId}/proposals`)}
                className="grid h-12 w-12 shrink-0 cursor-pointer place-items-center rounded-2xl border border-orange-100 bg-white text-orange-500 shadow-sm transition hover:bg-orange-50"
                aria-label="Volver a propuestas"
              >
                <ArrowLeft size={19} />
              </button>
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-rose-400">
                  Relaciones de propuesta
                </p>
                <h1 className="mt-2 text-3xl font-semibold text-orange-950 sm:text-4xl">
                  {proposal?.nombre || 'Propuesta'}
                </h1>
                <p className="mt-2 text-sm text-orange-600">
                  {proposal?.acronimo ||
                    proposal?.proposalId ||
                    'Organiza contactos, oportunidades y empresas desde un solo lugar.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={openCreateEditor}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-orange-600 hover:to-red-600"
            >
              <AddIcon size={18} />
              Añadir {activeConfig.singular}
            </button>
          </header>

          <div className="mb-5 grid gap-2 rounded-2xl border border-orange-100 bg-white p-2 shadow-sm sm:grid-cols-3">
            {Object.entries(sections).map(([key, section]) => {
              const Icon = section.icon;
              const isActive = key === activeSection;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => changeSection(key)}
                  className={`relative flex cursor-pointer items-center justify-between overflow-hidden rounded-xl px-4 py-3 text-left transition-colors duration-300 ${
                    isActive
                      ? 'text-white'
                      : 'text-orange-900 hover:bg-orange-50'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="proposal-relation-active-tab"
                      className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 shadow-sm"
                      transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-3">
                    <Icon size={18} />
                    <span className="font-semibold">{section.label}</span>
                  </span>
                  <span
                    className={`relative z-10 grid h-7 min-w-7 place-items-center rounded-full px-2 text-xs font-semibold transition-colors duration-300 ${
                      isActive ? 'bg-white/20 text-white' : 'bg-orange-50 text-orange-600'
                    }`}
                  >
                    {itemsBySection[key].length}
                  </span>
                </button>
              );
            })}
          </div>

          <AnimatePresence>
            {notice && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
              >
                {notice}
              </motion.div>
            )}
          </AnimatePresence>

          {errorMessage && !isEditorOpen && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {errorMessage}
            </div>
          )}

          <AnimatePresence mode="wait" initial={false}>
            <motion.section
              key={activeSection}
              initial={{ opacity: 0, x: 18, scale: 0.995 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -14, scale: 0.995 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden rounded-[28px] border border-orange-100 bg-white/95 shadow-[0_24px_80px_rgba(249,115,22,0.08)]"
            >
              <div className="flex flex-col gap-4 border-b border-orange-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <motion.span
                    initial={{ rotate: -8, scale: 0.9 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                    className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-50 text-orange-500"
                  >
                    <ActiveIcon size={20} />
                  </motion.span>
                  <div>
                    <p className="font-semibold text-orange-950">
                      {activeItems.length}{' '}
                      {activeItems.length === 1
                        ? activeConfig.singular
                        : activeConfig.label.toLowerCase()}
                    </p>
                    <p className="text-xs text-orange-500">{activeConfig.description}</p>
                  </div>
                </div>
                <label className="flex min-w-[260px] items-center gap-3 rounded-xl border border-orange-100 bg-white px-4 py-3">
                  <Search size={17} className="text-orange-300" />
                  <input
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                    placeholder={activeConfig.searchPlaceholder}
                    className="w-full bg-transparent text-sm text-orange-950 outline-none placeholder:text-orange-300"
                  />
                </label>
              </div>

              {isLoading ? (
                <div className="grid min-h-72 place-items-center text-sm font-semibold text-orange-500">
                  Cargando información...
                </div>
              ) : filteredItems.length === 0 ? (
                <EmptyState
                  icon={AddIcon}
                  hasItems={activeItems.length > 0}
                  label={activeConfig.label.toLowerCase()}
                  singular={activeConfig.singular}
                />
              ) : (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: 0.045 } },
                  }}
                  className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3"
                >
                  {filteredItems.map((item) => (
                    <motion.div
                      key={item._id}
                      variants={{
                        hidden: { opacity: 0, y: 10 },
                        visible: { opacity: 1, y: 0 },
                      }}
                      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <RelationCard
                        section={activeSection}
                        item={item}
                        onEdit={() => openEditEditor(item)}
                        onDelete={() => setItemToDelete(item)}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.section>
          </AnimatePresence>
        </main>

        <AnimatePresence>
          {isEditorOpen && (
            <EditorPanel
              section={activeSection}
              item={editingItem}
              formData={formData}
              isSaving={isSaving}
              canSave={canSave}
              errorMessage={errorMessage}
              onChange={handleChange}
              onClose={closeEditor}
              onSubmit={handleSave}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {itemToDelete && (
            <DeleteModal
              title={getItemTitle(activeSection, itemToDelete)}
              isDeleting={isDeleting}
              onCancel={() => setItemToDelete(null)}
              onConfirm={handleDelete}
            />
          )}
        </AnimatePresence>
      </div>
    </PortalSidebar>
  );
};

const BackgroundLines = () => (
  <motion.svg
    className="pointer-events-none absolute inset-0 h-full w-full"
    viewBox="0 0 1440 980"
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    <motion.path
      d="M-120 140 C 180 40, 470 280, 760 170 S 1120 50, 1560 180"
      fill="none"
      stroke="#fb923c"
      strokeWidth="2"
      opacity="0.14"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 1.6 }}
    />
    <motion.path
      d="M-100 820 C 200 700, 520 910, 810 770 S 1120 560, 1560 710"
      fill="none"
      stroke="#fb7185"
      strokeWidth="2"
      opacity="0.14"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 1.9, delay: 0.15 }}
    />
  </motion.svg>
);

const getItemTitle = (section, item) => {
  if (section === 'contacts') return item.name;
  if (section === 'opportunities') return item.topicId || item.destination || 'Oportunidad';
  return item.acronym || item.entities || 'Empresa';
};

const RelationCard = ({ section, item, onEdit, onDelete }) => {
  if (section === 'contacts') {
    return (
      <CardShell title={item.name} subtitle={[item.position, item.organization].filter(Boolean).join(' · ') || 'Sin entidad'} badge={item.relationshipStatus} badgeClass={statusClasses[item.relationshipStatus]} onEdit={onEdit} onDelete={onDelete}>
        <InfoLine icon={Mail} value={item.email || 'Sin email'} />
        <InfoLine icon={Phone} value={item.phone || 'Sin teléfono'} />
        <InfoLine icon={CalendarDays} value={item.lastContactAt ? `Último contacto: ${formatDate(item.lastContactAt)}` : 'Sin contacto registrado'} />
        <InfoLine icon={Building2} value={item.nextAction || 'Sin próxima acción'} />
        {item.notes && <Note>{item.notes}</Note>}
      </CardShell>
    );
  }

  if (section === 'opportunities') {
    return (
      <CardShell title={item.topicId || item.destination || 'Oportunidad'} subtitle={[item.destination, item.subDestination].filter(Boolean).join(' · ') || 'Sin clasificación'} badge={item.typeOfAction || (item.announcement ? `Anuncio ${item.announcement}` : '')} onEdit={onEdit} onDelete={onDelete}>
        <InfoLine icon={Building2} value={item.company || 'Sin empresa'} />
        <InfoLine icon={BriefcaseBusiness} value={item.project || 'Sin proyecto'} />
        <InfoLine icon={CalendarDays} value={item.deadline ? `Deadline: ${formatDate(item.deadline)}` : 'Sin deadline'} />
        <InfoLine icon={Mail} value={item.email || 'Sin correo'} />
        {item.linkCall && <InfoLine icon={ExternalLink} value={item.linkCall} />}
        {item.potentialMessage && <Note>{item.potentialMessage}</Note>}
      </CardShell>
    );
  }

  return (
    <CardShell title={item.acronym || item.entities || 'Empresa'} subtitle={item.entities || 'Sin entidad definida'} badge={item.nda ? `NDA: ${item.nda}` : ''} onEdit={onEdit} onDelete={onDelete}>
      <InfoLine icon={MapPin} value={item.countries || 'Sin países'} />
      <InfoLine icon={BriefcaseBusiness} value={item.pilots || 'Sin pilotos'} />
      <InfoLine icon={Mail} value={item.emailList || 'Sin lista de emails'} />
      <InfoLine icon={Users} value={item.participantPortalInvitation || 'Sin invitación registrada'} />
      {item.partA && <Note>{item.partA}</Note>}
    </CardShell>
  );
};

const CardShell = ({ title, subtitle, badge, badgeClass, children, onEdit, onDelete }) => (
  <article className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="truncate text-lg font-semibold text-orange-950">{title}</h2>
        <p className="mt-1 line-clamp-2 text-sm text-orange-600">{subtitle}</p>
      </div>
      {badge && (
        <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${badgeClass || 'border-orange-200 bg-orange-50 text-orange-700'}`}>
          {badge}
        </span>
      )}
    </div>
    <div className="mt-5 space-y-2.5 text-sm text-orange-700">{children}</div>
    <div className="mt-5 flex justify-end gap-2 border-t border-orange-100 pt-4">
      <button type="button" onClick={onEdit} className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-orange-100 px-3 py-2 text-xs font-semibold text-orange-800 transition hover:bg-orange-50">
        <Pencil size={14} /> Editar
      </button>
      <button type="button" onClick={onDelete} className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-red-100 px-3 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-50">
        <Trash2 size={14} /> Eliminar
      </button>
    </div>
  </article>
);

const InfoLine = ({ icon: Icon, value }) => (
  <div className="flex items-center gap-2.5">
    <Icon size={15} className="shrink-0 text-orange-400" />
    <span className="truncate" title={value}>{value}</span>
  </div>
);

const Note = ({ children }) => (
  <p className="mt-4 line-clamp-3 rounded-xl bg-orange-50/70 px-3 py-2 text-sm leading-5 text-orange-700">
    {children}
  </p>
);

const EmptyState = ({ icon: Icon, hasItems, label, singular }) => (
  <div className="grid min-h-72 place-items-center px-6 text-center">
    <div>
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-orange-50 text-orange-500">
        <Icon size={25} />
      </span>
      <h2 className="mt-4 text-xl font-semibold text-orange-950">
        {hasItems ? 'No hay coincidencias' : `Todavía no hay ${label}`}
      </h2>
      <p className="mt-2 text-sm text-orange-500">
        {hasItems
          ? 'Prueba con otra búsqueda.'
          : `Añade ${singular === 'empresa' ? 'una' : 'un'} ${singular} para empezar.`}
      </p>
    </div>
  </div>
);

const EditorPanel = ({
  section,
  item,
  formData,
  isSaving,
  canSave,
  errorMessage,
  onChange,
  onClose,
  onSubmit,
}) => {
  const config = sections[section];

  return (
    <motion.div className="fixed inset-0 z-50 flex justify-end bg-orange-950/35 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.aside initial={{ x: 560 }} animate={{ x: 0 }} exit={{ x: 560 }} transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }} className="h-full w-full max-w-[560px] overflow-y-auto bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <form onSubmit={onSubmit} className="flex min-h-full flex-col">
          <div className="flex items-start justify-between border-b border-orange-100 bg-gradient-to-br from-orange-50 to-rose-50 px-6 py-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-400">
                {item ? `Editar ${config.singular}` : config.newLabel}
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-orange-950">
                {item ? getItemTitle(section, item) : `Añadir ${config.singular}`}
              </h2>
              {section !== 'contacts' && (
                <p className="mt-2 text-xs text-orange-600">
                  {section === 'opportunities'
                    ? 'Indica al menos Destination o Topic ID.'
                    : 'Indica al menos Acrónimo o ENTITIES.'}
                </p>
              )}
            </div>
            <button type="button" onClick={onClose} className="grid h-10 w-10 cursor-pointer place-items-center rounded-xl text-orange-500 transition hover:bg-white">
              <X size={19} />
            </button>
          </div>

          <div className="grid flex-1 gap-4 p-6 sm:grid-cols-2">
            {errorMessage && (
              <div className="sm:col-span-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                {errorMessage}
              </div>
            )}
            {fields[section].map((field) => (
              <RelationField
                key={field.name}
                field={field}
                value={formData[field.name] || ''}
                onChange={onChange}
              />
            ))}
          </div>

          <div className="flex justify-end gap-3 border-t border-orange-100 px-6 py-4">
            <button type="button" onClick={onClose} disabled={isSaving} className="cursor-pointer rounded-xl border border-orange-100 px-5 py-3 text-sm font-semibold text-orange-950 transition hover:bg-orange-50 disabled:opacity-50">
              Cancelar
            </button>
            <button type="submit" disabled={isSaving || !canSave} className="cursor-pointer rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:from-orange-600 hover:to-red-600 disabled:cursor-not-allowed disabled:opacity-50">
              {isSaving ? 'Guardando...' : item ? 'Guardar cambios' : `Añadir ${config.singular}`}
            </button>
          </div>
        </form>
      </motion.aside>
    </motion.div>
  );
};

const RelationField = ({ field, value, onChange }) => {
  const commonClass =
    'w-full rounded-xl border border-orange-100 bg-white px-4 py-3 text-sm text-orange-950 outline-none placeholder:text-orange-300 focus:border-orange-300 focus:ring-4 focus:ring-orange-100';

  return (
    <label className={field.wide ? 'sm:col-span-2' : ''}>
      <span className="mb-2 block text-xs font-semibold text-orange-950">{field.label}</span>
      {field.type === 'textarea' ? (
        <textarea name={field.name} value={value} onChange={onChange} rows={4} className={`${commonClass} resize-none`} />
      ) : field.type === 'select' ? (
        <select name={field.name} value={value} onChange={onChange} className={`${commonClass} cursor-pointer`}>
          {field.options.map((option, index) => (
            <option key={`${field.name}-${option || 'empty'}`} value={option}>
              {field.optionLabels?.[index] || option}
            </option>
          ))}
        </select>
      ) : (
        <input name={field.name} type={field.type || 'text'} value={value} onChange={onChange} required={field.required} className={commonClass} />
      )}
    </label>
  );
};

const DeleteModal = ({ title, isDeleting, onCancel, onConfirm }) => (
  <motion.div className="fixed inset-0 z-[60] grid place-items-center bg-orange-950/45 px-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
    <motion.div initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.98 }} className="w-full max-w-md rounded-2xl border border-orange-100 bg-white p-6 shadow-2xl">
      <p className="text-sm font-semibold uppercase tracking-wide text-rose-400">Eliminar registro</p>
      <h2 className="mt-3 text-2xl font-semibold text-orange-950">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-orange-600">
        Se eliminará de esta propuesta. Esta acción no se puede deshacer.
      </p>
      <div className="mt-7 flex justify-center gap-3">
        <button type="button" onClick={onCancel} disabled={isDeleting} className="cursor-pointer rounded-xl border border-orange-200 px-5 py-3 text-sm font-semibold text-orange-950 transition hover:bg-orange-50 disabled:opacity-50">
          Cancelar
        </button>
        <button type="button" onClick={onConfirm} disabled={isDeleting} className="cursor-pointer rounded-xl bg-gradient-to-r from-red-500 to-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:from-red-600 hover:to-orange-600 disabled:opacity-50">
          {isDeleting ? 'Eliminando...' : 'Eliminar definitivamente'}
        </button>
      </div>
    </motion.div>
  </motion.div>
);

export default ProposalContactsPage;
