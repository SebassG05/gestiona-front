import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  Edit3,
  MapPin,
  PlaneTakeoff,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import PortalSidebar from './PortalSidebar.jsx';
import { getPortalMembers } from '../services/portalService.js';
import {
  createBusinessTrip,
  deleteBusinessTrip,
  getBusinessTrips,
  updateBusinessTrip,
} from '../services/businessTripService.js';

const todayValue = () => new Date().toISOString().slice(0, 10);

const initialTripForm = () => ({
  title: '',
  destination: '',
  purpose: '',
  startDate: todayValue(),
  endDate: todayValue(),
  assignedTo: '',
  transport: 'Avion',
  status: 'Planificado',
  notes: '',
});

const transportLabels = {
  Avion: 'Avion',
  Tren: 'Tren',
  Coche: 'Coche',
  Otro: 'Otro',
};

const statusStyles = {
  Planificado: 'border-sky-200 bg-sky-50 text-sky-700',
  'En curso': 'border-amber-200 bg-amber-50 text-amber-700',
  Finalizado: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Cancelado: 'border-rose-200 bg-rose-50 text-rose-700',
};

const normalizeMembersResponse = (payload) => {
  const source = Array.isArray(payload) ? payload : payload?.members || payload?.data || [];

  return source
    .map((item) => {
      const user = item.user || item.member || item;
      const id = user.id || user._id || item.id || item._id;

      return {
        id,
        username: user.username || item.username || user.name || item.name || user.email || 'Usuario',
        email: user.email || item.email || '',
      };
    })
    .filter((member) => member.id);
};

const normalizeTripsResponse = (payload) => (
  Array.isArray(payload) ? payload : payload?.trips || payload?.data || []
);

const formatDate = (value) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value.slice(0, 10)}T12:00:00`));
};

const getInitials = (name = '') => {
  const parts = name.trim().split(/\s|_/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'U';
};

const getTripDateValue = (trip, field) => (trip?.[field] ? trip[field].slice(0, 10) : '');

const PortalBusinessTripsPage = () => {
  const { portalId } = useParams();
  const [members, setMembers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [form, setForm] = useState(initialTripForm);
  const [editingTripId, setEditingTripId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setError('');

    try {
      const [membersPayload, tripsPayload] = await Promise.all([
        getPortalMembers(portalId),
        getBusinessTrips(portalId),
      ]);

      setMembers(normalizeMembersResponse(membersPayload));
      setTrips(normalizeTripsResponse(tripsPayload));
    } catch (loadError) {
      setError(loadError.response?.data?.message || 'No se pudieron cargar los viajes del portal.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [portalId]);

  const memberById = useMemo(() => {
    const map = new Map();
    members.forEach((member) => map.set(member.id, member));
    return map;
  }, [members]);

  const resolveAssignedMember = (assignedTo) => {
    if (!assignedTo) return null;
    if (typeof assignedTo === 'object') return assignedTo;
    return memberById.get(assignedTo) || null;
  };

  const filteredTrips = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return trips;

    return trips.filter((trip) => {
      const assignedName = trip.assignedTo?.username || '';
      return [
        trip.title,
        trip.destination,
        trip.purpose,
        trip.status,
        trip.transport,
        assignedName,
      ].some((value) => String(value || '').toLowerCase().includes(term));
    });
  }, [trips, search]);

  const upcomingTrips = useMemo(() => {
    const today = todayValue();
    return trips
      .filter((trip) => getTripDateValue(trip, 'endDate') >= today)
      .sort((a, b) => getTripDateValue(a, 'startDate').localeCompare(getTripDateValue(b, 'startDate')))
      .slice(0, 5);
  }, [trips]);

  const assignedPeopleCount = useMemo(() => {
    const assignedIds = new Set(trips.map((trip) => trip.assignedTo?.id).filter(Boolean));
    return assignedIds.size;
  }, [trips]);

  const activeTripsCount = trips.filter((trip) => trip.status === 'En curso').length;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const resetForm = () => {
    setForm(initialTripForm());
    setEditingTripId(null);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!form.title.trim() || !form.destination.trim() || !form.assignedTo || !form.startDate || !form.endDate) {
      setError('Completa titulo, destino, persona asignada y fechas para guardar el viaje.');
      return;
    }

    if (form.endDate < form.startDate) {
      setError('La fecha de vuelta no puede ser anterior a la fecha de salida.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        ...form,
        title: form.title.trim(),
        destination: form.destination.trim(),
        purpose: form.purpose.trim(),
        notes: form.notes.trim(),
      };

      if (editingTripId) {
        const updatedTrip = await updateBusinessTrip({ portalId, tripId: editingTripId, data: payload });
        setTrips((current) => current.map((trip) => (trip.id === editingTripId ? updatedTrip : trip)));
        setSuccess('Viaje actualizado correctamente.');
      } else {
        const createdTrip = await createBusinessTrip({ portalId, data: payload });
        setTrips((current) => [createdTrip, ...current]);
        setSuccess('Viaje creado correctamente.');
      }

      resetForm();
    } catch (submitError) {
      setError(submitError.response?.data?.message || 'No se pudo guardar el viaje.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (trip) => {
    setEditingTripId(trip.id);
    setSuccess('');
    setError('');
    setForm({
      title: trip.title || '',
      destination: trip.destination || '',
      purpose: trip.purpose || '',
      startDate: getTripDateValue(trip, 'startDate') || todayValue(),
      endDate: getTripDateValue(trip, 'endDate') || todayValue(),
      assignedTo: trip.assignedTo?.id || '',
      transport: trip.transport || 'Avion',
      status: trip.status || 'Planificado',
      notes: trip.notes || '',
    });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setError('');
    setSuccess('');

    try {
      await deleteBusinessTrip({ portalId, tripId: deleteTarget.id });
      setTrips((current) => current.filter((trip) => trip.id !== deleteTarget.id));
      if (editingTripId === deleteTarget.id) resetForm();
      setSuccess('Viaje eliminado correctamente.');
      setDeleteTarget(null);
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || 'No se pudo eliminar el viaje.');
    }
  };

  return (
    <PortalSidebar>
      <main className="relative min-h-screen overflow-hidden px-6 py-8 text-[#3d1006]">
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 opacity-80"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
        >
          <div className="absolute left-[-8%] top-24 h-72 w-[70%] rounded-full border border-orange-100" />
          <div className="absolute right-[-12%] top-56 h-96 w-[74%] rounded-full border border-rose-100" />
          <div className="absolute bottom-0 left-1/4 h-72 w-[66%] rounded-full border border-orange-100" />
        </motion.div>

        <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6">
          <section className="rounded-[26px] border border-orange-100 bg-white/92 p-8 shadow-[0_18px_45px_rgba(255,96,26,0.08)]">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-[#ff3d65]">Viajes</p>
                <h1 className="mt-4 font-display text-5xl leading-tight text-[#4b1406]">
                  Viajes de empresa
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-[#ff4b16]">
                  Organiza los proximos desplazamientos, asigna responsables y consulta de un vistazo
                  quien viaja, cuando y a donde.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <StatBox icon={CalendarDays} label="Proximos" value={upcomingTrips.length} />
                <StatBox icon={Users} label="Asignados" value={assignedPeopleCount} />
                <StatBox icon={PlaneTakeoff} label="En curso" value={activeTripsCount} />
              </div>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_420px]">
            <motion.section
              initial={{ opacity: 0, y: 18, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-[26px] border border-orange-100 bg-white/95 shadow-[0_16px_40px_rgba(255,96,26,0.08)]"
            >
              <div className="border-b border-orange-100 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orange-50 text-[#ff5a1f]">
                      <BriefcaseBusiness size={22} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black">
                        {editingTripId ? 'Editar viaje' : 'Planificar viaje'}
                      </h2>
                      <p className="text-sm text-[#ff4b16]">
                        Define el destino, fechas y persona asignada al desplazamiento.
                      </p>
                    </div>
                  </div>
                  <Link
                    to={`/dashboard/portal/${portalId}/team`}
                    className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-orange-200 bg-white px-4 text-sm font-black text-[#8b2f12] transition hover:-translate-y-0.5 hover:bg-orange-50 hover:shadow-sm focus:outline-none focus:ring-4 focus:ring-orange-100"
                  >
                    <ArrowLeft size={17} />
                    Volver a Equipo
                  </Link>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="grid gap-5 p-6">
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Titulo del viaje" name="title" value={form.title} onChange={handleChange} placeholder="Ej. Reunion Horizon Europe" required />
                  <Field label="Destino" name="destination" value={form.destination} onChange={handleChange} placeholder="Ej. Bruselas" required />
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Salida" name="startDate" type="date" value={form.startDate} onChange={handleChange} required />
                  <Field label="Vuelta" name="endDate" type="date" value={form.endDate} onChange={handleChange} required />
                </div>

                <div className="grid gap-5 md:grid-cols-3">
                  <SelectField label="Persona asignada" name="assignedTo" value={form.assignedTo} onChange={handleChange} required>
                    <option value="">Seleccionar persona</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.username}
                      </option>
                    ))}
                  </SelectField>
                  <SelectField label="Transporte" name="transport" value={form.transport} onChange={handleChange}>
                    {Object.keys(transportLabels).map((transport) => (
                      <option key={transport} value={transport}>{transportLabels[transport]}</option>
                    ))}
                  </SelectField>
                  <SelectField label="Estado" name="status" value={form.status} onChange={handleChange}>
                    {Object.keys(statusStyles).map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </SelectField>
                </div>

                <Field label="Motivo" name="purpose" value={form.purpose} onChange={handleChange} placeholder="Objetivo principal del viaje" />
                <label className="grid gap-2 text-sm font-bold">
                  Notas
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Reserva, alojamiento, reuniones o informacion relevante..."
                    className="resize-none rounded-2xl border border-orange-200 bg-[#fffaf5] px-4 py-3 font-normal outline-none transition focus:border-[#ff5a1f] focus:bg-white focus:ring-4 focus:ring-orange-100"
                  />
                </label>

                <AnimatePresence>
                  {(error || success) && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
                        error
                          ? 'border-rose-200 bg-rose-50 text-rose-600'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {error || success}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="cursor-pointer rounded-2xl border border-orange-200 px-5 py-3 font-bold text-[#7b2a10] transition hover:-translate-y-0.5 hover:bg-orange-50"
                  >
                    Limpiar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-gradient-to-r from-[#ff5a00] to-[#ff2f4f] px-6 py-3 font-black text-white shadow-[0_14px_28px_rgba(255,64,20,0.22)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Plus size={18} />
                    {isSubmitting ? 'Guardando...' : editingTripId ? 'Guardar cambios' : 'Crear viaje'}
                  </button>
                </div>
              </form>
            </motion.section>

            <section className="rounded-[26px] border border-orange-100 bg-white/95 p-6 shadow-[0_16px_40px_rgba(255,96,26,0.08)]">
              <div className="flex items-center gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-50 text-[#ff5a1f]">
                  <MapPin size={22} />
                </div>
                <div>
                  <h2 className="text-2xl font-black">Proximos viajes</h2>
                  <p className="text-sm text-[#ff4b16]">Los desplazamientos mas cercanos del portal.</p>
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                {isLoading ? (
                  <p className="rounded-2xl border border-orange-100 bg-[#fffaf5] p-4 text-sm text-[#ff4b16]">
                    Cargando viajes...
                  </p>
                ) : upcomingTrips.length ? (
                  upcomingTrips.map((trip) => (
                    <motion.article
                      key={trip.id}
                      layout
                      className="rounded-2xl border border-orange-100 bg-[#fffaf5] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-black">{trip.title}</h3>
                          <p className="mt-1 text-sm text-[#ff4b16]">{trip.destination}</p>
                        </div>
                        <StatusBadge status={trip.status} />
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                        <MemberPill member={resolveAssignedMember(trip.assignedTo)} />
                        <span className="font-bold text-[#7b2a10]">
                          {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                        </span>
                      </div>
                    </motion.article>
                  ))
                ) : (
                  <p className="rounded-2xl border border-dashed border-orange-200 bg-[#fffaf5] p-4 text-sm text-[#ff4b16]">
                    Aun no hay viajes proximos planificados.
                  </p>
                )}
              </div>
            </section>
          </div>

          <section className="overflow-hidden rounded-[26px] border border-orange-100 bg-white/95 shadow-[0_18px_45px_rgba(255,96,26,0.08)]">
            <div className="flex flex-col gap-4 border-b border-orange-100 p-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-[#ff3d65]">Planificacion</p>
                <h2 className="mt-2 text-2xl font-black">Todos los viajes</h2>
              </div>
              <label className="flex min-h-[48px] w-full max-w-sm items-center gap-3 rounded-2xl border border-orange-200 bg-white px-4 text-[#ff9b54] shadow-sm">
                <Search size={18} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar viaje, destino o persona..."
                  className="w-full bg-transparent text-sm outline-none placeholder:text-[#ffad74]"
                />
              </label>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[#fff7ef] text-xs uppercase text-[#7b2a10]">
                  <tr>
                    <th className="px-6 py-4">Viaje</th>
                    <th className="px-6 py-4">Persona</th>
                    <th className="px-6 py-4">Destino</th>
                    <th className="px-6 py-4">Fechas</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4">Transporte</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrips.map((trip) => (
                    <tr key={trip.id} className="border-t border-orange-100 transition hover:bg-orange-50/40">
                      <td className="px-6 py-5">
                        <p className="font-black">{trip.title}</p>
                        <p className="mt-1 max-w-xs truncate text-xs text-[#ff4b16]">{trip.purpose || 'Sin motivo indicado'}</p>
                      </td>
                      <td className="px-6 py-5">
                        <MemberPill member={resolveAssignedMember(trip.assignedTo)} />
                      </td>
                      <td className="px-6 py-5 font-bold text-[#ff4b16]">{trip.destination}</td>
                      <td className="px-6 py-5 font-bold">
                        {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                      </td>
                      <td className="px-6 py-5"><StatusBadge status={trip.status} /></td>
                      <td className="px-6 py-5">{transportLabels[trip.transport] || trip.transport || '-'}</td>
                      <td className="px-6 py-5">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(trip)}
                            className="grid h-10 w-10 cursor-pointer place-items-center rounded-xl border border-orange-200 bg-white text-[#ff5a1f] transition hover:-translate-y-0.5 hover:bg-orange-50"
                            aria-label="Editar viaje"
                          >
                            <Edit3 size={17} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(trip)}
                            className="grid h-10 w-10 cursor-pointer place-items-center rounded-xl border border-rose-200 bg-rose-50 text-rose-500 transition hover:-translate-y-0.5 hover:bg-rose-100"
                            aria-label="Eliminar viaje"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!isLoading && filteredTrips.length === 0 && (
                <div className="grid min-h-[220px] place-items-center border-t border-orange-100 px-6 py-12 text-center">
                  <div>
                    <PlaneTakeoff className="mx-auto text-[#ff5a1f]" size={34} />
                    <h3 className="mt-4 text-xl font-black">Aun no hay viajes</h3>
                    <p className="mt-2 text-sm text-[#ff4b16]">
                      Crea el primer desplazamiento para verlo en esta planificacion.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        <AnimatePresence>
          {deleteTarget && (
            <motion.div
              className="fixed inset-0 z-50 grid place-items-center bg-[#3d1006]/35 p-6 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 18 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 18 }}
                className="w-full max-w-md rounded-[26px] border border-rose-100 bg-white p-6 shadow-2xl"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wide text-[#ff3d65]">Eliminar viaje</p>
                    <h2 className="mt-3 text-2xl font-black">{deleteTarget.title}</h2>
                    <p className="mt-3 text-sm leading-6 text-[#ff4b16]">
                      Esta accion eliminara el viaje de la planificacion del portal.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(null)}
                    className="grid h-10 w-10 cursor-pointer place-items-center rounded-xl border border-orange-100 text-[#ff5a1f] transition hover:bg-orange-50"
                    aria-label="Cerrar"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="mt-6 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(null)}
                    className="cursor-pointer rounded-2xl border border-orange-200 px-5 py-3 font-bold text-[#7b2a10] transition hover:-translate-y-0.5 hover:bg-orange-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={confirmDelete}
                    className="cursor-pointer rounded-2xl bg-gradient-to-r from-[#ff5a00] to-[#ff2f4f] px-5 py-3 font-black text-white transition hover:-translate-y-0.5"
                  >
                    Eliminar definitivamente
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </PortalSidebar>
  );
};

const StatBox = ({ icon: Icon, label, value }) => (
  <div className="grid aspect-square w-28 place-items-center rounded-[22px] border border-orange-100 bg-[#fff8f1] p-4 text-center shadow-sm">
    <div className="grid h-9 w-9 place-items-center rounded-full bg-white text-[#ff5a1f] shadow-sm">
      <Icon size={18} />
    </div>
    <strong className="text-3xl font-black leading-none">{value}</strong>
    <span className="text-[11px] font-black uppercase text-[#ff4b16]">{label}</span>
  </div>
);

const Field = ({ label, required, ...props }) => (
  <label className="grid gap-2 text-sm font-bold">
    {label} {required && <span className="text-[#ff2f4f]">*</span>}
    <input
      {...props}
      className="min-h-[50px] rounded-2xl border border-orange-200 bg-[#fffaf5] px-4 font-normal outline-none transition focus:border-[#ff5a1f] focus:bg-white focus:ring-4 focus:ring-orange-100"
    />
  </label>
);

const SelectField = ({ label, required, children, ...props }) => (
  <label className="grid gap-2 text-sm font-bold">
    {label} {required && <span className="text-[#ff2f4f]">*</span>}
    <select
      {...props}
      className="min-h-[50px] cursor-pointer rounded-2xl border border-orange-200 bg-[#fffaf5] px-4 font-normal outline-none transition focus:border-[#ff5a1f] focus:bg-white focus:ring-4 focus:ring-orange-100"
    >
      {children}
    </select>
  </label>
);

const StatusBadge = ({ status }) => (
  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${statusStyles[status] || statusStyles.Planificado}`}>
    {status || 'Planificado'}
  </span>
);

const MemberPill = ({ member }) => {
  const name = member?.username || 'Sin asignar';
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white px-3 py-2 shadow-sm">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-r from-[#ff5a00] to-[#ff2f4f] text-xs font-black text-white">
        {getInitials(name)}
      </span>
      <span className="max-w-[140px] truncate font-bold">{name}</span>
    </div>
  );
};

export default PortalBusinessTripsPage;
