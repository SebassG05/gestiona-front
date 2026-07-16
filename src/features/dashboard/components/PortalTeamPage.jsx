import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Clock3,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPortalMembers } from '../services/portalService.js';
import {
  createTeamActivity,
  deleteTeamActivity,
  getTeamActivities,
  updateTeamActivity,
} from '../services/teamActivityService.js';
import PortalSidebar from './PortalSidebar.jsx';

const STATUS_OPTIONS = [
  { value: 'planned', label: 'Planificado', className: 'bg-sky-50 text-sky-700 border-sky-200' },
  {
    value: 'in_progress',
    label: 'En marcha',
    className: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  { value: 'blocked', label: 'Bloqueado', className: 'bg-rose-50 text-rose-700 border-rose-200' },
  { value: 'done', label: 'Terminado', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Baja', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'medium', label: 'Media', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'high', label: 'Alta', className: 'bg-rose-50 text-rose-700 border-rose-200' },
  { value: 'urgent', label: 'Urgente', className: 'bg-red-600 text-white border-red-700' },
];

const DEFAULT_ACTIVITY_COLOR = '#ff5a1f';

const emptyForm = {
  title: '',
  description: '',
  workDate: '',
  status: 'in_progress',
  priority: 'medium',
};

const toDateInputValue = (date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const parseActivityDate = (value) => new Date(`${String(value).slice(0, 10)}T12:00:00`);

const todayValue = () => toDateInputValue(new Date());

const getMonthRange = (date) => {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return {
    startDate: toDateInputValue(first),
    endDate: toDateInputValue(last),
  };
};

const buildCalendarDays = (monthDate) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startPadding = (firstDay.getDay() + 6) % 7;
  const days = [];

  for (let index = startPadding; index > 0; index -= 1) {
    const date = new Date(year, month, 1 - index);
    days.push({ date, isCurrentMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push({ date: new Date(year, month, day), isCurrentMonth: true });
  }

  let nextDay = 1;
  while (days.length % 7 !== 0) {
    const date = new Date(year, month + 1, nextDay);
    days.push({ date, isCurrentMonth: false });
    nextDay += 1;
  }

  return days;
};

const statusMeta = (value) => STATUS_OPTIONS.find((item) => item.value === value) || STATUS_OPTIONS[1];
const priorityMeta = (value) =>
  PRIORITY_OPTIONS.find((item) => item.value === value) || PRIORITY_OPTIONS[1];

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}') || {};
  } catch {
    return {};
  }
};

const PortalTeamPage = () => {
  const { portalId } = useParams();
  const [members, setMembers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [selectedDate, setSelectedDate] = useState(toDateInputValue(new Date()));
  const [monthCursor, setMonthCursor] = useState(new Date());
  const [form, setForm] = useState({ ...emptyForm, workDate: toDateInputValue(new Date()) });
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);

  const currentUser = useMemo(() => getStoredUser(), []);
  const currentUserLabel = currentUser.username || currentUser.name || currentUser.email || 'Tu usuario';

  const monthRange = useMemo(() => getMonthRange(monthCursor), [monthCursor]);

  const loadTeamData = async () => {
    setIsLoading(true);
    setError('');

    try {
      const [membersResponse, activitiesResponse] = await Promise.all([
        getPortalMembers(portalId),
        getTeamActivities({ portalId, ...monthRange }),
      ]);

      const nextMembers = membersResponse.data || [];
      setMembers(nextMembers);
      setActivities(activitiesResponse.data || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No se pudo cargar la actividad del equipo');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTeamData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portalId, monthRange.startDate, monthRange.endDate]);

  const calendarDays = useMemo(() => buildCalendarDays(monthCursor), [monthCursor]);

  const activitiesByDate = useMemo(
    () =>
      activities.reduce((acc, activity) => {
        const key = toDateInputValue(parseActivityDate(activity.workDate));
        acc[key] = [...(acc[key] || []), activity];
        return acc;
      }, {}),
    [activities]
  );

  const selectedActivities = activitiesByDate[selectedDate] || [];
  const minWorkDate = todayValue();
  const isSelectedPastDate = selectedDate < minWorkDate;
  const todayActivities = activitiesByDate[minWorkDate] || [];
  const doneActivities = selectedActivities.filter((activity) => activity.status === 'done').length;

  const resetForm = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      workDate: selectedDate,
    });
  };

  const handleOpenTaskForm = () => {
    if (!editingId) {
      setForm((current) => ({
        ...current,
        workDate: isSelectedPastDate ? minWorkDate : selectedDate,
      }));
    }
    setIsTaskFormOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.title.trim()) {
      setError('Indica en que estas trabajando para guardar la actividad');
      return;
    }

    if (form.workDate < minWorkDate) {
      setError('No se pueden crear tareas en dias anteriores a hoy');
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        workDate: form.workDate,
        status: form.status,
        priority: form.priority,
      };

      const response = editingId
        ? await updateTeamActivity({ portalId, activityId: editingId, activity: payload })
        : await createTeamActivity({ portalId, activity: payload });

      const savedActivity = response.data;
      setActivities((current) => {
        if (!editingId) return [...current, savedActivity];
        return current.map((activity) => (activity.id === savedActivity.id ? savedActivity : activity));
      });
      setSelectedDate(toDateInputValue(parseActivityDate(savedActivity.workDate)));
      resetForm();
      setIsTaskFormOpen(false);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No se pudo guardar la actividad');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (activity) => {
    setEditingId(activity.id);
    setIsTaskFormOpen(true);
    setForm({
      title: activity.title,
      description: activity.description || '',
      workDate: toDateInputValue(parseActivityDate(activity.workDate)),
      status: activity.status,
      priority: activity.priority,
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setError('');

    try {
      await deleteTeamActivity({ portalId, activityId: deleteTarget.id });
      setActivities((current) => current.filter((activity) => activity.id !== deleteTarget.id));
      if (editingId === deleteTarget.id) resetForm();
      setDeleteTarget(null);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No se pudo eliminar la actividad');
    }
  };

  const changeMonth = (amount) => {
    setMonthCursor((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  };

  const handleSelectDate = (date) => {
    const value = toDateInputValue(date);
    setSelectedDate(value);
    setForm((current) => ({ ...current, workDate: value }));
  };

  return (
    <PortalSidebar>
      <div className="relative min-h-screen overflow-hidden bg-[#fafafa] px-6 py-8 text-[#3b1208] md:px-10">
        <motion.svg
          className="pointer-events-none absolute inset-0 z-0 h-full w-full select-none"
          viewBox="0 0 1440 900"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <motion.path
            d="M-110 170 C 175 75, 440 300, 710 205 S 1115 85, 1530 205"
            fill="none"
            stroke="#fb923c"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.14"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.14 }}
            transition={{ duration: 1.7, ease: 'easeInOut' }}
          />
          <motion.path
            d="M-130 755 C 185 645, 470 815, 745 695 S 1110 520, 1540 660"
            fill="none"
            stroke="#fb7185"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.14"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.14 }}
            transition={{ duration: 2, ease: 'easeInOut', delay: 0.15 }}
          />
        </motion.svg>

        <main className="relative z-10 mx-auto max-w-7xl space-y-6">
          <section className="rounded-[24px] border border-orange-100 bg-white/90 p-7 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#ff3f6c]">Equipo</p>
            <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="font-display text-4xl text-[#4b1406] md:text-5xl">
                  Actividad del equipo
                </h1>
                <p className="mt-3 max-w-3xl text-base leading-7 text-[#ff5a1f]">
                  Anota en que estas trabajando, consulta el foco de cada persona y revisa el
                  calendario diario del portal.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex h-28 w-28 shrink-0 flex-col items-center justify-center rounded-2xl border border-orange-100 bg-[#fff8f1] p-4 text-center shadow-sm">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#ff5a1f] shadow-sm">
                    <Clock3 size={16} />
                  </span>
                  <div className="mt-2">
                    <p className="text-3xl font-black leading-none">{todayActivities.length}</p>
                    <p className="mt-2 text-[10px] font-black uppercase leading-tight text-[#ff5a1f]">
                      Actividad 
                    </p>
                  </div>
                </div>
                <div className="flex h-28 w-28 shrink-0 flex-col items-center justify-center rounded-2xl border border-orange-100 bg-[#fff8f1] p-4 text-center shadow-sm">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#ff5a1f] shadow-sm">
                    <Users size={16} />
                  </span>
                  <div className="mt-2">
                    <p className="text-3xl font-black leading-none">{members.length}</p>
                    <p className="mt-2 text-[10px] font-black uppercase leading-tight text-[#ff5a1f]">
                      Personas
                    </p>
                  </div>
                </div>
                <div className="flex h-28 w-28 shrink-0 flex-col items-center justify-center rounded-2xl border border-orange-100 bg-[#fff8f1] p-4 text-center shadow-sm">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#ff5a1f] shadow-sm">
                    <CheckCircle2 size={16} />
                  </span>
                  <div className="mt-2">
                    <p className="text-3xl font-black leading-none">{doneActivities}</p>
                    <p className="mt-2 text-[10px] font-black uppercase leading-tight text-[#ff5a1f]">
                      Terminadas
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}

          <section
            className={`grid items-start gap-6 transition-all duration-300 ${
              isTaskFormOpen
                ? 'xl:grid-cols-[minmax(0,0.95fr)_minmax(430px,1.05fr)]'
                : 'xl:grid-cols-1'
            }`}
          >
            <AnimatePresence initial={false}>
              {isTaskFormOpen && (
                <motion.form
                  key="team-activity-form"
                  onSubmit={handleSubmit}
                  initial={{ opacity: 0, x: -18, scale: 0.98 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -16, scale: 0.98 }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  className="self-start rounded-[24px] border border-orange-100 bg-white/95 p-6 shadow-sm xl:min-h-[632px]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff3e7] text-[#ff5a1f]">
                        <Pencil size={21} />
                      </span>
                      <div>
                        <h2 className="text-2xl font-black">
                          {editingId ? 'Actualizar actividad' : 'Que estas haciendo'}
                        </h2>
                        <p className="mt-1 text-sm text-[#ff5a1f]">
                          Guarda tu foco del dia para que el equipo lo vea al momento.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        resetForm();
                        setIsTaskFormOpen(false);
                      }}
                      className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-orange-200 bg-white text-[#8b2f12] shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-50"
                      title="Ocultar formulario"
                      aria-label="Ocultar formulario"
                    >
                      <X size={18} />
                    </button>
                  </div>

              <div className="mt-6 space-y-4">
                <label className="block">
                  <span className="text-sm font-bold">Tarea principal</span>
                  <input
                    value={form.title}
                    onChange={(event) => setForm({ ...form, title: event.target.value })}
                    placeholder="Ej. Revisar contactos de Horizon Europe"
                    className="mt-2 w-full rounded-2xl border border-orange-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#ff5a1f] focus:ring-4 focus:ring-orange-100"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-bold">Detalle</span>
                  <textarea
                    value={form.description}
                    onChange={(event) => setForm({ ...form, description: event.target.value })}
                    placeholder="Notas, bloqueos, siguiente paso..."
                    rows="4"
                    className="mt-2 w-full resize-none rounded-2xl border border-orange-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#ff5a1f] focus:ring-4 focus:ring-orange-100"
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-bold">Dia</span>
                    <input
                      type="date"
                      value={form.workDate}
                      onChange={(event) => setForm({ ...form, workDate: event.target.value })}
                      className="mt-2 w-full rounded-2xl border border-orange-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#ff5a1f] focus:ring-4 focus:ring-orange-100"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-bold">Persona</span>
                    <div className="mt-2 w-full rounded-2xl border border-orange-200 bg-white px-4 py-3 text-sm text-[#3b1208]">
                      <p className="truncate">{currentUserLabel}</p>
                    </div>
                  </label>

                  <label className="block">
                    <span className="text-sm font-bold">Estado</span>
                    <div className="relative mt-2">
                      <select
                        value={form.status}
                        onChange={(event) => setForm({ ...form, status: event.target.value })}
                        className="w-full cursor-pointer appearance-none rounded-2xl border border-orange-200 bg-[#fffaf5] px-4 py-3 pr-11 text-sm font-semibold text-[#3b1208] outline-none transition hover:border-orange-300 hover:bg-white focus:border-[#ff5a1f] focus:bg-white focus:ring-4 focus:ring-orange-100"
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={18}
                        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#ff5a1f]"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="text-sm font-bold">Prioridad</span>
                    <div className="relative mt-2">
                      <select
                        value={form.priority}
                        onChange={(event) => setForm({ ...form, priority: event.target.value })}
                        className="w-full cursor-pointer appearance-none rounded-2xl border border-orange-200 bg-[#fffaf5] px-4 py-3 pr-11 text-sm font-semibold text-[#3b1208] outline-none transition hover:border-orange-300 hover:bg-white focus:border-[#ff5a1f] focus:bg-white focus:ring-4 focus:ring-orange-100"
                      >
                        {PRIORITY_OPTIONS.map((priority) => (
                          <option key={priority.value} value={priority.value}>
                            {priority.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={18}
                        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#ff5a1f]"
                      />
                    </div>
                  </label>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="cursor-pointer rounded-2xl border border-orange-200 px-5 py-3 text-sm font-bold text-[#8b2f12] transition hover:bg-orange-50"
                >
                  Limpiar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-gradient-to-r from-[#ff5a00] to-[#ff3048] px-6 py-3 text-sm font-black text-white shadow-lg shadow-orange-100 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                  {editingId ? 'Actualizar' : 'Guardar actividad'}
                </button>
              </div>
                </motion.form>
              )}
            </AnimatePresence>

            <section
              className={`relative self-start overflow-visible rounded-[24px] border border-orange-100 bg-white/95 p-6 shadow-sm ${
                isSelectedPastDate ? '' : 'xl:min-h-[632px]'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff3e7] text-[#ff5a1f]">
                    <CalendarDays size={21} />
                  </span>
                  <div>
                    <h2 className="text-2xl font-black">Calendario</h2>
                    <p className="text-sm text-[#ff5a1f]">Pulsa un dia para ver su actividad.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenTaskForm}
                    className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-orange-200 bg-gradient-to-r from-[#ff5a00] to-[#ff3048] text-white shadow-sm shadow-orange-100 transition hover:-translate-y-0.5 hover:shadow-md"
                    title="Crear tarea"
                    aria-label="Crear tarea"
                  >
                    <Plus size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => changeMonth(-1)}
                    className="cursor-pointer rounded-xl border border-orange-200 p-2 text-[#8b2f12] transition hover:bg-orange-50"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <p className="min-w-36 text-center text-sm font-black capitalize">
                    {new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(
                      monthCursor
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() => changeMonth(1)}
                    className="cursor-pointer rounded-xl border border-orange-200 p-2 text-[#8b2f12] transition hover:bg-orange-50"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-7 gap-2 text-center text-xs font-black uppercase text-[#ff5a1f]">
                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-7 gap-2">
                {calendarDays.map(({ date, isCurrentMonth }) => {
                  const value = toDateInputValue(date);
                  const dayActivities = activitiesByDate[value] || [];
                  const isSelected = value === selectedDate;

                  return (
                    <motion.button
                      key={value}
                      type="button"
                      onClick={() => handleSelectDate(date)}
                      whileTap={{ scale: 0.97 }}
                      animate={isSelected ? { scale: 1.02 } : { scale: 1 }}
                      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                      className={`relative cursor-pointer overflow-hidden rounded-2xl border p-3 text-left transition ${
                        isSelected
                          ? 'border-[#ff5a1f] bg-[#fff3e7] shadow-sm'
                          : 'border-orange-100 bg-white hover:border-orange-300 hover:bg-orange-50/60'
                      } ${isTaskFormOpen ? 'min-h-24' : 'min-h-28'} ${!isCurrentMonth ? 'opacity-45' : ''}`}
                    >
                      <span className="absolute left-3 top-3 text-sm font-black">{date.getDate()}</span>
                      {dayActivities.length > 0 && (
                        <span className="absolute right-2 top-2 rounded-full border border-orange-100 bg-white px-2 py-0.5 text-[10px] font-black text-[#ff5a1f] shadow-sm">
                          {dayActivities.length}
                        </span>
                      )}
                      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1">
                        {dayActivities.slice(0, 4).map((activity) => (
                          <motion.span
                            key={activity.id}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="h-2.5 w-2.5 rounded-full shadow-sm"
                            style={{ backgroundColor: activity.color || DEFAULT_ACTIVITY_COLOR }}
                            title={`${activity.assignedTo?.username || activity.assignedTo?.email || 'Usuario'} - ${
                              activity.title
                            }`}
                          />
                        ))}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <AnimatePresence>
                {isSelectedPastDate && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="mt-5 flex items-start gap-3 rounded-2xl border border-red-100 bg-gradient-to-r from-red-50 to-orange-50 px-4 py-3 text-sm shadow-sm"
                  >
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-red-500 shadow-sm">
                      <AlertTriangle size={18} />
                    </span>
                    <div>
                      <p className="font-black text-[#3b1208]">Dia solo de consulta</p>
                      <p className="mt-1 leading-6 text-red-600">
                        Has seleccionado una fecha anterior a hoy. Puedes revisar su actividad, pero
                        para crear una tarea nueva elige hoy o una fecha futura.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          </section>

          <section className="rounded-[24px] border border-orange-100 bg-white/95 shadow-sm">
            <div className="flex flex-col gap-3 border-b border-orange-100 p-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-[#ff3f6c]">
                  Dia seleccionado
                </p>
                <h2 className="mt-1 text-2xl font-black">
                  {new Intl.DateTimeFormat('es-ES', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                  }).format(parseActivityDate(selectedDate))}
                </h2>
              </div>
              <span className="rounded-full border border-orange-200 bg-[#fff8f1] px-4 py-2 text-sm font-black text-[#ff5a1f]">
                {selectedActivities.length} actividades
              </span>
            </div>

            <div className="p-6">
              {isLoading ? (
                <div className="flex min-h-48 items-center justify-center text-[#ff5a1f]">
                  <Loader2 className="animate-spin" />
                </div>
              ) : selectedActivities.length === 0 ? (
                <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-orange-200 bg-[#fffaf5] text-center">
                  <UserRound size={32} className="text-[#ff5a1f]" />
                  <h3 className="mt-4 text-xl font-black">Aun no hay actividad este dia</h3>
                  <p className="mt-2 text-sm text-[#ff5a1f]">
                    Guarda una tarea para que el equipo sepa en que estas trabajando.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  <AnimatePresence initial={false}>
                    {selectedActivities.map((activity) => {
                      const status = statusMeta(activity.status);
                      const priority = priorityMeta(activity.priority);

                      return (
                        <motion.article
                          key={activity.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          className="rounded-2xl border border-orange-100 bg-[#fffaf5] p-5 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span
                                  className="h-3 w-3 rounded-full shadow-sm"
                                  style={{
                                    backgroundColor: activity.color || DEFAULT_ACTIVITY_COLOR,
                                  }}
                                />
                                <p className="text-sm font-bold text-[#ff5a1f]">
                                  {activity.assignedTo?.username || activity.assignedTo?.email}
                                </p>
                              </div>
                              <h3 className="mt-1 text-xl font-black">{activity.title}</h3>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleEdit(activity)}
                                className="cursor-pointer rounded-xl border border-orange-200 bg-white p-2 text-[#ff5a1f] transition hover:bg-orange-50"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(activity)}
                                className="cursor-pointer rounded-xl border border-rose-200 bg-white p-2 text-rose-500 transition hover:bg-rose-50"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>

                          {activity.description && (
                            <p className="mt-4 text-sm leading-6 text-[#6b2d1b]">
                              {activity.description}
                            </p>
                          )}

                          <div className="mt-5 flex flex-wrap gap-2">
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-black ${status.className}`}
                            >
                              {status.label}
                            </span>
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-black ${priority.className}`}
                            >
                              Prioridad {priority.label}
                            </span>
                          </div>
                        </motion.article>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </section>
        </main>

        <AnimatePresence>
          {deleteTarget && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-[#3b1208]/35 px-4 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="w-full max-w-lg rounded-[24px] border border-rose-100 bg-white p-7 shadow-2xl shadow-rose-100"
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
                    <AlertTriangle size={22} />
                  </span>
                  <div>
                    <p className="text-sm font-black uppercase tracking-wide text-[#ff3f6c]">
                      Eliminar tarea
                    </p>
                    <h3 className="mt-2 text-2xl font-black text-[#3b1208]">
                      {deleteTarget.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-[#ff5a1f]">
                      Esta tarea dejara de aparecer en el calendario del equipo. Esta accion no se
                      puede deshacer.
                    </p>
                  </div>
                </div>

                <div className="mt-7 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(null)}
                    className="cursor-pointer rounded-2xl border border-orange-200 bg-white px-5 py-3 text-sm font-black text-[#8b2f12] transition hover:bg-orange-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="cursor-pointer rounded-2xl bg-gradient-to-r from-[#ff5a00] to-[#ff3048] px-5 py-3 text-sm font-black text-white shadow-lg shadow-rose-100 transition hover:-translate-y-0.5"
                  >
                    Si, eliminar tarea
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

export default PortalTeamPage;
