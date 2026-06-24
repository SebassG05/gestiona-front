import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Mail,
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

const relationshipStatuses = [
  'Por contactar',
  'Contactado',
  'En seguimiento',
  'Confirmado',
  'Descartado',
];

const emptyContact = {
  name: '',
  organization: '',
  position: '',
  email: '',
  phone: '',
  relationshipStatus: 'Por contactar',
  lastContactAt: '',
  nextAction: '',
  notes: '',
};

const statusClasses = {
  'Por contactar': 'border-amber-200 bg-amber-50 text-amber-700',
  Contactado: 'border-sky-200 bg-sky-50 text-sky-700',
  'En seguimiento': 'border-violet-200 bg-violet-50 text-violet-700',
  Confirmado: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Descartado: 'border-slate-200 bg-slate-100 text-slate-600',
};

const ProposalContactsPage = () => {
  const navigate = useNavigate();
  const { portalId, proposalId } = useParams();
  const [proposal, setProposal] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [formData, setFormData] = useState(emptyContact);
  const [isSaving, setIsSaving] = useState(false);
  const [contactToDelete, setContactToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const refreshContacts = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await getProposalContacts({ portalId, proposalId });
      setProposal(response.data?.proposal || null);
      setContacts(response.data?.contacts || []);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'No se pudieron cargar los contactos.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadContacts = async () => {
      try {
        const response = await getProposalContacts({ portalId, proposalId });

        if (isMounted) {
          setProposal(response.data?.proposal || null);
          setContacts(response.data?.contacts || []);
          setErrorMessage('');
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error.response?.data?.message || 'No se pudieron cargar los contactos.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadContacts();

    return () => {
      isMounted = false;
    };
  }, [portalId, proposalId]);

  useEffect(() => {
    if (!notice) return undefined;
    const timeout = window.setTimeout(() => setNotice(''), 3500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const filteredContacts = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLocaleLowerCase('es');
    if (!normalizedSearch) return contacts;

    return contacts.filter((contact) =>
      [
        contact.name,
        contact.organization,
        contact.position,
        contact.email,
        contact.phone,
        contact.relationshipStatus,
      ].some((value) => String(value || '').toLocaleLowerCase('es').includes(normalizedSearch))
    );
  }, [contacts, searchValue]);

  const openCreateEditor = () => {
    setEditingContact(null);
    setFormData(emptyContact);
    setErrorMessage('');
    setIsEditorOpen(true);
  };

  const openEditEditor = (contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name || '',
      organization: contact.organization || '',
      position: contact.position || '',
      email: contact.email || '',
      phone: contact.phone || '',
      relationshipStatus: contact.relationshipStatus || 'Por contactar',
      lastContactAt: contact.lastContactAt
        ? new Date(contact.lastContactAt).toISOString().slice(0, 10)
        : '',
      nextAction: contact.nextAction || '',
      notes: contact.notes || '',
    });
    setErrorMessage('');
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    if (isSaving) return;
    setIsEditorOpen(false);
    setEditingContact(null);
    setFormData(emptyContact);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!formData.name.trim() || isSaving) return;

    setIsSaving(true);
    setErrorMessage('');

    try {
      if (editingContact) {
        await updateProposalContact({
          portalId,
          proposalId,
          contactId: editingContact._id,
          data: formData,
        });
        setNotice('Contacto actualizado correctamente.');
      } else {
        await createProposalContact({ portalId, proposalId, data: formData });
        setNotice('Contacto añadido correctamente.');
      }

      setIsEditorOpen(false);
      setEditingContact(null);
      setFormData(emptyContact);
      await refreshContacts();
    } catch (error) {
      const validationMessage = error.response?.data?.errors?.[0]?.message;
      setErrorMessage(
        validationMessage || error.response?.data?.message || 'No se pudo guardar el contacto.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!contactToDelete || isDeleting) return;
    setIsDeleting(true);

    try {
      await deleteProposalContact({
        portalId,
        proposalId,
        contactId: contactToDelete._id,
      });
      setContactToDelete(null);
      setNotice('Contacto eliminado correctamente.');
      await refreshContacts();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'No se pudo eliminar el contacto.');
      setContactToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <PortalSidebar>
      <div className="relative min-h-screen overflow-hidden bg-[#fafafa] px-4 py-5 sm:px-6 lg:px-8">
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
                  Contactos de propuesta
                </p>
                <h1 className="mt-2 text-3xl font-semibold text-orange-950 sm:text-4xl">
                  {proposal?.nombre || 'Contactos'}
                </h1>
                <p className="mt-2 text-sm text-orange-600">
                  {proposal?.acronimo || proposal?.proposalId || 'Organiza las personas vinculadas a esta propuesta.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={openCreateEditor}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-orange-600 hover:to-red-600"
            >
              <UserPlus size={18} />
              Añadir contacto
            </button>
          </header>

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

          <section className="overflow-hidden rounded-[28px] border border-orange-100 bg-white/95 shadow-[0_24px_80px_rgba(249,115,22,0.08)]">
            <div className="flex flex-col gap-4 border-b border-orange-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-50 text-orange-500">
                  <Users size={20} />
                </span>
                <div>
                  <p className="font-semibold text-orange-950">
                    {contacts.length} {contacts.length === 1 ? 'contacto' : 'contactos'}
                  </p>
                  <p className="text-xs text-orange-500">Personas relacionadas con la propuesta</p>
                </div>
              </div>
              <label className="flex min-w-[260px] items-center gap-3 rounded-xl border border-orange-100 bg-white px-4 py-3">
                <Search size={17} className="text-orange-300" />
                <input
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="Buscar contactos..."
                  className="w-full bg-transparent text-sm text-orange-950 outline-none placeholder:text-orange-300"
                />
              </label>
            </div>

            {isLoading ? (
              <div className="grid min-h-72 place-items-center text-sm font-semibold text-orange-500">
                Cargando contactos...
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="grid min-h-72 place-items-center px-6 text-center">
                <div>
                  <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-orange-50 text-orange-500">
                    <UserPlus size={25} />
                  </span>
                  <h2 className="mt-4 text-xl font-semibold text-orange-950">
                    {contacts.length ? 'No hay coincidencias' : 'Todavía no hay contactos'}
                  </h2>
                  <p className="mt-2 text-sm text-orange-500">
                    {contacts.length
                      ? 'Prueba con otro nombre, entidad o email.'
                      : 'Añade las personas con las que quieres hablar o ya has contactado.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredContacts.map((contact) => (
                  <article
                    key={contact._id}
                    className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-semibold text-orange-950">{contact.name}</h2>
                        <p className="mt-1 truncate text-sm text-orange-600">
                          {[contact.position, contact.organization].filter(Boolean).join(' · ') || 'Sin entidad'}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses[contact.relationshipStatus]}`}>
                        {contact.relationshipStatus}
                      </span>
                    </div>

                    <div className="mt-5 space-y-2.5 text-sm text-orange-700">
                      <ContactLine icon={Mail} value={contact.email || 'Sin email'} />
                      <ContactLine icon={Phone} value={contact.phone || 'Sin teléfono'} />
                      <ContactLine
                        icon={CalendarDays}
                        value={
                          contact.lastContactAt
                            ? `Último contacto: ${new Intl.DateTimeFormat('es-ES').format(new Date(contact.lastContactAt))}`
                            : 'Sin contacto registrado'
                        }
                      />
                      <ContactLine icon={Building2} value={contact.nextAction || 'Sin próxima acción'} />
                    </div>

                    {contact.notes && (
                      <p className="mt-4 line-clamp-3 rounded-xl bg-orange-50/70 px-3 py-2 text-sm leading-5 text-orange-700">
                        {contact.notes}
                      </p>
                    )}

                    <div className="mt-5 flex justify-end gap-2 border-t border-orange-100 pt-4">
                      <button
                        type="button"
                        onClick={() => openEditEditor(contact)}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-orange-100 px-3 py-2 text-xs font-semibold text-orange-800 transition hover:bg-orange-50"
                      >
                        <Pencil size={14} />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setContactToDelete(contact)}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-red-100 px-3 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                        Eliminar
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </main>

        <AnimatePresence>
          {isEditorOpen && (
            <motion.div
              className="fixed inset-0 z-50 flex justify-end bg-orange-950/35 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeEditor}
            >
              <motion.aside
                initial={{ x: 440 }}
                animate={{ x: 0 }}
                exit={{ x: 440 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                className="h-full w-full max-w-[440px] overflow-y-auto bg-white shadow-2xl"
                onClick={(event) => event.stopPropagation()}
              >
                <form onSubmit={handleSave} className="flex min-h-full flex-col">
                  <div className="flex items-start justify-between border-b border-orange-100 bg-gradient-to-br from-orange-50 to-rose-50 px-6 py-5">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-rose-400">
                        {editingContact ? 'Editar contacto' : 'Nuevo contacto'}
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold text-orange-950">
                        {editingContact ? editingContact.name : 'Añadir una persona'}
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={closeEditor}
                      className="grid h-10 w-10 cursor-pointer place-items-center rounded-xl text-orange-500 transition hover:bg-white"
                    >
                      <X size={19} />
                    </button>
                  </div>

                  <div className="flex-1 space-y-4 p-6">
                    {errorMessage && (
                      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                        {errorMessage}
                      </div>
                    )}
                    <ContactField label="Nombre *" name="name" value={formData.name} onChange={handleChange} required />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <ContactField label="Organización" name="organization" value={formData.organization} onChange={handleChange} />
                      <ContactField label="Cargo" name="position" value={formData.position} onChange={handleChange} />
                    </div>
                    <ContactField label="Email" name="email" type="email" value={formData.email} onChange={handleChange} />
                    <ContactField label="Teléfono" name="phone" value={formData.phone} onChange={handleChange} />
                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold text-orange-950">Estado de relación</span>
                      <select
                        name="relationshipStatus"
                        value={formData.relationshipStatus}
                        onChange={handleChange}
                        className="w-full cursor-pointer rounded-xl border border-orange-100 bg-white px-4 py-3 text-sm text-orange-950 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
                      >
                        {relationshipStatuses.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </label>
                    <ContactField label="Último contacto" name="lastContactAt" type="date" value={formData.lastContactAt} onChange={handleChange} />
                    <ContactField label="Próxima acción" name="nextAction" value={formData.nextAction} onChange={handleChange} />
                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold text-orange-950">Notas</span>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows={5}
                        placeholder="Contexto, conversaciones, intereses..."
                        className="w-full resize-none rounded-xl border border-orange-100 bg-white px-4 py-3 text-sm text-orange-950 outline-none placeholder:text-orange-300 focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
                      />
                    </label>
                  </div>

                  <div className="flex justify-end gap-3 border-t border-orange-100 px-6 py-4">
                    <button
                      type="button"
                      onClick={closeEditor}
                      disabled={isSaving}
                      className="cursor-pointer rounded-xl border border-orange-100 px-5 py-3 text-sm font-semibold text-orange-950 transition hover:bg-orange-50 disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving || !formData.name.trim()}
                      className="cursor-pointer rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:from-orange-600 hover:to-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSaving ? 'Guardando...' : editingContact ? 'Guardar cambios' : 'Añadir contacto'}
                    </button>
                  </div>
                </form>
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {contactToDelete && (
            <motion.div
              className="fixed inset-0 z-[60] grid place-items-center bg-orange-950/45 px-4 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                className="w-full max-w-md rounded-2xl border border-orange-100 bg-white p-6 shadow-2xl"
              >
                <p className="text-sm font-semibold uppercase tracking-wide text-rose-400">Eliminar contacto</p>
                <h2 className="mt-3 text-2xl font-semibold text-orange-950">{contactToDelete.name}</h2>
                <p className="mt-3 text-sm leading-6 text-orange-600">
                  Se eliminará de esta propuesta. Esta acción no se puede deshacer.
                </p>
                <div className="mt-7 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setContactToDelete(null)}
                    disabled={isDeleting}
                    className="cursor-pointer rounded-xl border border-orange-200 px-5 py-3 text-sm font-semibold text-orange-950 transition hover:bg-orange-50 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="cursor-pointer rounded-xl bg-gradient-to-r from-red-500 to-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:from-red-600 hover:to-orange-600 disabled:opacity-50"
                  >
                    {isDeleting ? 'Eliminando...' : 'Eliminar definitivamente'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PortalSidebar>
  );
};

const ContactLine = ({ icon: Icon, value }) => (
  <div className="flex items-center gap-2.5">
    <Icon size={15} className="shrink-0 text-orange-400" />
    <span className="truncate">{value}</span>
  </div>
);

const ContactField = ({ label, name, value, onChange, type = 'text', required = false }) => (
  <label className="block">
    <span className="mb-2 block text-xs font-semibold text-orange-950">{label}</span>
    <input
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      required={required}
      className="w-full rounded-xl border border-orange-100 bg-white px-4 py-3 text-sm text-orange-950 outline-none placeholder:text-orange-300 focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
    />
  </label>
);

export default ProposalContactsPage;
