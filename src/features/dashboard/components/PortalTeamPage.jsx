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
  Landmark,
  MessageSquare,
  MapPin,
  Pencil,
  PlaneTakeoff,
  Plus,
  RefreshCw,
  SendHorizontal,
  Trash2,
  Umbrella,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getBusinessTrips } from '../services/businessTripService.js';
import { getPortalMembers } from '../services/portalService.js';
import {
  addTeamActivityComment,
  createTeamActivity,
  deleteTeamActivityComment,
  deleteTeamActivity,
  getGoogleCalendarEvents,
  getTeamActivities,
  syncGoogleCalendar,
  updateTeamActivity,
} from '../services/teamActivityService.js';
import {
  createTeamVacation,
  deleteTeamVacation,
  getTeamVacations,
} from '../services/teamVacationService.js';
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
const VACATION_TOTAL_DAYS = 15;
const USER_ACTIVITY_COLORS = [
  '#ff5a1f',
  '#ff3048',
  '#f59e0b',
  '#10b981',
  '#06b6d4',
  '#8b5cf6',
  '#ec4899',
  '#3b1208',
];

const HOLIDAY_COLOR = '#7c3aed';
const ACTIVITY_STATUS_COLORS = {
  planned: '#2563eb',
  in_progress: '#f97316',
  blocked: '#dc2626',
  done: '#059669',
};

const GOOGLE_EVENT_CATEGORIES = {
  collaboration: {
    label: 'Colaboración',
    color: '#8b5cf6',
    softColor: '#f5f3ff',
    borderColor: '#ddd6fe',
    textColor: '#6d28d9',
  },
  meeting: {
    label: 'Reuniones y correos',
    color: '#f97316',
    softColor: '#fff7ed',
    borderColor: '#fed7aa',
    textColor: '#c2410c',
  },
  deadline: {
    label: 'Plazos y cierres',
    color: '#e11d48',
    softColor: '#fff1f2',
    borderColor: '#fecdd3',
    textColor: '#be123c',
  },
  event: {
    label: 'Eventos',
    color: '#10b981',
    softColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    textColor: '#047857',
  },
  horizon: {
    label: 'Horizon y proyectos',
    color: '#0891b2',
    softColor: '#ecfeff',
    borderColor: '#a5f3fc',
    textColor: '#0e7490',
  },
  other: {
    label: 'Otros de Google Calendar',
    color: '#2563eb',
    softColor: '#eff6ff',
    borderColor: '#bfdbfe',
    textColor: '#1d4ed8',
  },
};

const GOOGLE_EVENT_CATEGORY_ORDER = [
  'collaboration',
  'meeting',
  'deadline',
  'event',
  'horizon',
  'other',
];

const FIXED_SEVILLE_HOLIDAYS = [
  { month: 0, day: 1, name: 'Ano Nuevo', scope: 'Nacional' },
  { month: 0, day: 6, name: 'Reyes', scope: 'Nacional' },
  { month: 1, day: 28, name: 'Dia de Andalucia', scope: 'Andalucia', moveIfSunday: true },
  { month: 4, day: 1, name: 'Dia del Trabajo', scope: 'Nacional' },
  { month: 7, day: 15, name: 'Asuncion', scope: 'Nacional' },
  { month: 9, day: 12, name: 'Fiesta Nacional', scope: 'Nacional' },
  { month: 10, day: 1, name: 'Todos los Santos', scope: 'Nacional', moveIfSunday: true },
  { month: 11, day: 6, name: 'Constitucion', scope: 'Nacional', moveIfSunday: true },
  { month: 11, day: 8, name: 'Inmaculada', scope: 'Nacional' },
  { month: 11, day: 25, name: 'Navidad', scope: 'Nacional' },
];

const SEVILLE_LOCAL_HOLIDAYS_BY_YEAR = {
  2026: [
    { date: '2026-04-22', name: 'Feria de Sevilla', scope: 'Sevilla' },
    { date: '2026-06-04', name: 'Corpus Christi', scope: 'Sevilla' },
  ],
};

const emptyForm = {
  title: '',
  description: '',
  workDate: '',
  endDate: '',
  assignedTo: '',
  status: 'in_progress',
  priority: 'medium',
};

const toDateInputValue = (date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const parseActivityDate = (value) => new Date(`${String(value).slice(0, 10)}T12:00:00`);

const todayValue = () => toDateInputValue(new Date());

const addDays = (date, amount) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + amount);
  return nextDate;
};

const getFixedHolidayDate = (year, holiday) => {
  const holidayDate = new Date(year, holiday.month, holiday.day);
  return holiday.moveIfSunday && holidayDate.getDay() === 0 ? addDays(holidayDate, 1) : holidayDate;
};

const getEasterSunday = (year) => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
};

const getSevilleHolidays = (year) => {
  const easterSunday = getEasterSunday(year);
  const fixedHolidays = FIXED_SEVILLE_HOLIDAYS.map((holiday) => ({
    ...holiday,
    date: toDateInputValue(getFixedHolidayDate(year, holiday)),
  }));
  const localHolidays =
    SEVILLE_LOCAL_HOLIDAYS_BY_YEAR[year] ||
    [
      { date: toDateInputValue(addDays(easterSunday, 17)), name: 'Feria de Sevilla', scope: 'Sevilla' },
      { date: toDateInputValue(addDays(easterSunday, 60)), name: 'Corpus Christi', scope: 'Sevilla' },
    ];

  return [
    ...fixedHolidays,
    {
      date: toDateInputValue(addDays(easterSunday, -3)),
      name: 'Jueves Santo',
      scope: 'Andalucia',
    },
    {
      date: toDateInputValue(addDays(easterSunday, -2)),
      name: 'Viernes Santo',
      scope: 'Andalucia',
    },
    ...localHolidays,
  ];
};

const getYearRange = (date) => ({
  startDate: toDateInputValue(new Date(date.getFullYear(), 0, 1)),
  endDate: toDateInputValue(new Date(date.getFullYear(), 11, 31)),
});

const getMonthRange = (date) => ({
  startDate: toDateInputValue(new Date(date.getFullYear(), date.getMonth(), 1)),
  endDate: toDateInputValue(new Date(date.getFullYear(), date.getMonth() + 1, 0)),
});

const buildWeekDays = (date) => {
  const target = new Date(date);
  const mondayOffset = (target.getDay() + 6) % 7;
  const start = addDays(target, -mondayOffset);

  return Array.from({ length: 7 }, (_, index) => ({
    date: new Date(start.getFullYear(), start.getMonth(), start.getDate() + index),
    isCurrentMonth: true,
  }));
};

const buildMonthDays = (date) => {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const startPadding = (firstDay.getDay() + 6) % 7;
  const days = [];

  for (let index = startPadding; index > 0; index -= 1) {
    const previousDate = new Date(date.getFullYear(), date.getMonth(), 1 - index);
    days.push({ date: previousDate, isCurrentMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push({ date: new Date(date.getFullYear(), date.getMonth(), day), isCurrentMonth: true });
  }

  let nextDay = 1;
  while (days.length % 7 !== 0) {
    days.push({ date: new Date(date.getFullYear(), date.getMonth() + 1, nextDay), isCurrentMonth: false });
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

const getUserId = (user) => user?._id || user?.id || user?.userId || '';

const getUserLabel = (user) => user?.username || user?.name || user?.email || 'Usuario';

const getUserFilterId = (user) => getUserId(user) || user?.email || getUserLabel(user);

const getInitials = (value) => {
  const source = String(value || 'U').trim();
  const cleanSource = source.includes('@') ? source.split('@')[0] : source;
  const parts = cleanSource.split(/[\s._-]+/).filter(Boolean);
  const initials = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : cleanSource.slice(0, 2);
  return initials.toUpperCase();
};

const getUserColor = (value) => {
  const source = String(value || 'usuario');
  const sum = Array.from(source).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return USER_ACTIVITY_COLORS[sum % USER_ACTIVITY_COLORS.length];
};

const getActivityMarkerColor = (activity) => {
  return ACTIVITY_STATUS_COLORS[activity?.status] || getUserColor(activity?.assignedTo?.id || activity?.title);
};

const normalizeEventText = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const getGoogleEventCategory = (event) => {
  const text = normalizeEventText(`${event?.title || ''} ${event?.description || ''}`);

  if (/potential collaboration|colaboracion|collaboration|partnership|partnering/.test(text)) {
    return 'collaboration';
  }

  if (/deadline|cierre|justificacion|convocatoria|plazo|due date|jibble/.test(text)) {
    return 'deadline';
  }

  if (/reunion|correo|meeting|call|llamada|follow[- ]?up/.test(text)) {
    return 'meeting';
  }

  if (/\bevent\b|evento|webinar|conference|conferencia|workshop|taller/.test(text)) {
    return 'event';
  }

  if (/horizon|\bcl[0-9]+\b/.test(text)) {
    return 'horizon';
  }

  return 'other';
};

const getGoogleEventMeta = (event) => GOOGLE_EVENT_CATEGORIES[getGoogleEventCategory(event)];

const getCalendarEventColor = (event, fallbackColor) => {
  const categoryKey = getGoogleEventCategory(event);
  return categoryKey === 'other' ? fallbackColor : GOOGLE_EVENT_CATEGORIES[categoryKey].color;
};

const SAFE_EVENT_HTML_TAGS = new Set([
  'a',
  'b',
  'blockquote',
  'br',
  'div',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'i',
  'li',
  'ol',
  'p',
  'span',
  'strong',
  'table',
  'tbody',
  'td',
  'th',
  'thead',
  'tr',
  'u',
  'ul',
]);

const BLOCKED_EVENT_HTML_TAGS = new Set([
  'base',
  'embed',
  'form',
  'iframe',
  'input',
  'link',
  'meta',
  'object',
  'script',
  'style',
]);

const escapeEventHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const isSafeEventLink = (value) => /^(https?:|mailto:)/i.test(String(value || '').trim());

const formatGoogleEventDescription = (value) => {
  const source = String(value || '').trim();
  if (!source) return '';

  if (!/<\/?[a-z][\s\S]*>/i.test(source) || typeof document === 'undefined') {
    return escapeEventHtml(source).replace(/\r?\n/g, '<br />');
  }

  const template = document.createElement('template');
  template.innerHTML = source;

  const sanitizeChildren = (parent) => {
    Array.from(parent.children).forEach((element) => {
      const tagName = element.tagName.toLowerCase();

      if (BLOCKED_EVENT_HTML_TAGS.has(tagName)) {
        element.remove();
        return;
      }

      if (!SAFE_EVENT_HTML_TAGS.has(tagName)) {
        element.replaceWith(...Array.from(element.childNodes));
        sanitizeChildren(parent);
        return;
      }

      Array.from(element.attributes).forEach((attribute) => {
        const attributeName = attribute.name.toLowerCase();
        const isLink = tagName === 'a' && attributeName === 'href' && isSafeEventLink(attribute.value);
        const isTableSpan =
          ['td', 'th'].includes(tagName) &&
          ['colspan', 'rowspan'].includes(attributeName) &&
          /^\d+$/.test(attribute.value);

        if (!isLink && !isTableSpan) element.removeAttribute(attribute.name);
      });

      if (tagName === 'a') {
        if (!isSafeEventLink(element.getAttribute('href'))) {
          element.removeAttribute('href');
        } else {
          element.setAttribute('target', '_blank');
          element.setAttribute('rel', 'noreferrer');
        }
      }

      sanitizeChildren(element);
    });
  };

  sanitizeChildren(template.content);
  return template.innerHTML.replace(/(?:<br\s*\/?>(?:\s|&nbsp;)*){2,}/gi, '<br />');
};

const GoogleEventDescription = ({ description, category }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const formattedDescription = useMemo(
    () => formatGoogleEventDescription(description),
    [description]
  );
  const plainTextLength = formattedDescription
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim().length;
  const canExpand = plainTextLength > 700;

  return (
    <div className="mt-3">
      <div className={`relative ${canExpand && !isExpanded ? 'max-h-56 overflow-hidden' : ''}`}>
        <div
          className="overflow-x-auto text-sm leading-6 [&_a]:font-black [&_a]:underline [&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-current [&_blockquote]:pl-3 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_table]:my-1 [&_table]:max-w-full [&_table]:border-collapse [&_td]:align-top [&_td]:p-1 [&_th]:align-top [&_th]:p-1 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5"
          style={{ color: category.textColor }}
          dangerouslySetInnerHTML={{ __html: formattedDescription }}
        />
        {canExpand && !isExpanded && (
          <span
            className="pointer-events-none absolute inset-x-0 bottom-0 h-12"
            style={{ background: `linear-gradient(to bottom, transparent, ${category.softColor})` }}
          />
        )}
      </div>
      {canExpand && (
        <button
          type="button"
          onClick={() => setIsExpanded((current) => !current)}
          className="mt-2 cursor-pointer rounded-full border bg-white px-3 py-1.5 text-xs font-black shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          style={{ borderColor: category.borderColor, color: category.textColor }}
        >
          {isExpanded ? 'Ver menos' : 'Ver más'}
        </button>
      )}
    </div>
  );
};

const countInclusiveDays = (startDate, endDate) => {
  if (!startDate || !endDate || startDate > endDate) return 0;
  const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
  const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
  const start = Date.UTC(startYear, startMonth - 1, startDay);
  const end = Date.UTC(endYear, endMonth - 1, endDay);
  return Math.round((end - start) / 86400000) + 1;
};

const formatShortDate = (value) => {
  if (!value) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
  }).format(parseActivityDate(value));
};

const formatCommentDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const getWeekRange = (date = new Date()) => {
  const target = parseActivityDate(toDateInputValue(date));
  const mondayOffset = (target.getDay() + 6) % 7;
  const start = addDays(target, -mondayOffset);
  const end = addDays(start, 6);

  return {
    startDate: toDateInputValue(start),
    endDate: toDateInputValue(end),
  };
};

const rangesOverlap = (firstStart, firstEnd, secondStart, secondEnd) =>
  firstStart <= secondEnd && firstEnd >= secondStart;

const belongsToPerson = (user, person) => {
  if (!user || !person) return false;
  const userEmail = String(user.email || '').toLowerCase();
  const personEmail = String(person.email || '').toLowerCase();

  return (
    getUserFilterId(user) === person.id ||
    (userEmail && personEmail && userEmail === personEmail) ||
    getUserLabel(user) === person.label
  );
};

const isDateInVacation = (value, vacation) =>
  vacation?.startDate <= value && vacation?.endDate >= value;

const isDateInTrip = (value, trip) =>
  trip?.status !== 'Cancelado' && trip?.startDate <= value && trip?.endDate >= value;

const getActivityEndValue = (activity) =>
  toDateInputValue(parseActivityDate(activity.endDate || activity.workDate));

const PortalTeamPage = () => {
  const { portalId } = useParams();
  const navigate = useNavigate();
  const [isLeavingForTrips, setIsLeavingForTrips] = useState(false);
  const [members, setMembers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [googleEvents, setGoogleEvents] = useState([]);
  const [googleCalendarConfigured, setGoogleCalendarConfigured] = useState(false);
  const [isGoogleSyncing, setIsGoogleSyncing] = useState(false);
  const [googleCalendarMessage, setGoogleCalendarMessage] = useState('');
  const [vacations, setVacations] = useState([]);
  const [trips, setTrips] = useState([]);
  const [selectedDate, setSelectedDate] = useState(toDateInputValue(new Date()));
  const [monthCursor, setMonthCursor] = useState(new Date());
  const [calendarView, setCalendarView] = useState('month');
  const [form, setForm] = useState({
    ...emptyForm,
    workDate: toDateInputValue(new Date()),
    endDate: toDateInputValue(new Date()),
  });
  const [vacationForm, setVacationForm] = useState({
    startDate: toDateInputValue(new Date()),
    endDate: toDateInputValue(new Date()),
  });
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isVacationSaving, setIsVacationSaving] = useState(false);
  const [error, setError] = useState('');
  const [vacationError, setVacationError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [commentDrafts, setCommentDrafts] = useState({});
  const [commentSavingId, setCommentSavingId] = useState(null);
  const [commentDeleteTarget, setCommentDeleteTarget] = useState(null);
  const [commentError, setCommentError] = useState('');
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);
  const [personFilter, setPersonFilter] = useState('all');
  const personScrollerRef = useRef(null);
  const personDragRef = useRef({
    isDragging: false,
    moved: false,
    startX: 0,
    scrollLeft: 0,
  });
  const personDragResetRef = useRef(null);

  const currentUser = useMemo(() => getStoredUser(), []);
  const currentUserId = getUserId(currentUser);

  const personOptions = useMemo(() => {
    const people = new Map();

    const addPerson = (user) => {
      const id = getUserFilterId(user);
      if (!id || people.has(id)) return;

      const label = getUserLabel(user);
      people.set(id, {
        id,
        label,
        email: user?.email || '',
        color: getUserColor(id),
        initials: getInitials(label),
      });
    };

    members.forEach((member) => addPerson(member.user || member));
    activities.forEach((activity) => addPerson(activity.assignedTo || activity.createdBy));
    vacations.forEach((vacation) => addPerson(vacation.user));
    trips.forEach((trip) => addPerson(trip.assignedTo));
    addPerson(currentUser);

    return Array.from(people.values()).sort((first, second) =>
      first.label.localeCompare(second.label, 'es')
    );
  }, [activities, currentUser, members, trips, vacations]);

  const getPersonColorForUser = (user) => {
    const id = getUserFilterId(user);
    const matchedPerson = personOptions.find((person) => person.id === id);

    return matchedPerson?.color || getUserColor(id || user?.email || getUserLabel(user));
  };

  useEffect(() => {
    if (personFilter !== 'all' && !personOptions.some((person) => person.id === personFilter)) {
      setPersonFilter('all');
    }
  }, [personFilter, personOptions]);

  const selectedPerson = personOptions.find((person) => person.id === personFilter);
  const assignablePeople = personOptions.filter((person) =>
    members.some((member) => getUserFilterId(member.user || member) === person.id)
  );
  const assignedPerson = assignablePeople.find((person) => person.id === form.assignedTo);
  const isPersonFiltered = personFilter !== 'all';

  const handlePersonDragStart = (event) => {
    if (event.button !== 0 || !personScrollerRef.current) return;
    if (personDragResetRef.current) {
      window.clearTimeout(personDragResetRef.current);
      personDragResetRef.current = null;
    }

    personDragRef.current = {
      isDragging: true,
      moved: false,
      startX: event.clientX,
      scrollLeft: personScrollerRef.current.scrollLeft,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePersonDragMove = (event) => {
    const drag = personDragRef.current;
    if (!drag.isDragging || !personScrollerRef.current) return;

    const distance = event.clientX - drag.startX;
    if (!drag.moved && Math.abs(distance) < 8) return;

    drag.moved = true;
    personScrollerRef.current.scrollLeft = drag.scrollLeft - distance;
  };

  const handlePersonDragEnd = (event) => {
    if (!personDragRef.current.isDragging) return;
    personDragRef.current.isDragging = false;
    event.currentTarget.releasePointerCapture?.(event.pointerId);

    if (!personDragRef.current.moved) {
      personDragResetRef.current = window.setTimeout(() => {
        personDragRef.current.moved = false;
        personDragResetRef.current = null;
      }, 0);
    }
  };

  const handlePersonClickCapture = (event) => {
    if (!personDragRef.current.moved) return;
    event.preventDefault();
    event.stopPropagation();
    personDragResetRef.current = window.setTimeout(() => {
      personDragRef.current.moved = false;
      personDragResetRef.current = null;
    }, 0);
  };

  const visibleActivities = useMemo(() => {
    if (!isPersonFiltered) return activities;
    return activities.filter(
      (activity) => getUserFilterId(activity.assignedTo || activity.createdBy) === personFilter
    );
  }, [activities, isPersonFiltered, personFilter]);

  const visibleVacations = useMemo(() => {
    if (!isPersonFiltered) return vacations;
    return vacations.filter((vacation) => getUserFilterId(vacation.user) === personFilter);
  }, [isPersonFiltered, personFilter, vacations]);

  const vacationLaneByUser = useMemo(() => {
    const lanes = new Map();
    visibleVacations.forEach((vacation) => {
      const userKey = getUserFilterId(vacation.user);
      if (userKey && !lanes.has(userKey)) lanes.set(userKey, lanes.size);
    });
    return lanes;
  }, [visibleVacations]);

  const visibleTrips = useMemo(() => {
    if (!isPersonFiltered) return trips;
    return trips.filter((trip) => getUserFilterId(trip.assignedTo) === personFilter);
  }, [isPersonFiltered, personFilter, trips]);

  const weekRange = useMemo(() => getWeekRange(monthCursor), [monthCursor]);
  const monthRange = useMemo(() => getMonthRange(monthCursor), [monthCursor]);
  const dayRange = useMemo(() => ({ startDate: selectedDate, endDate: selectedDate }), [selectedDate]);
  const calendarRange = calendarView === 'month' ? monthRange : calendarView === 'week' ? weekRange : dayRange;

  const weeklySummary = useMemo(() => {
    const { startDate, endDate } = weekRange;
    const weekActivities = activities.filter((activity) => {
      if (!activity.workDate) return false;
      const workDate = toDateInputValue(parseActivityDate(activity.workDate));
      return rangesOverlap(workDate, getActivityEndValue(activity), startDate, endDate);
    });
    const weekVacations = vacations.filter((vacation) => {
      if (!vacation.startDate || !vacation.endDate) return false;
      return rangesOverlap(vacation.startDate, vacation.endDate, startDate, endDate);
    });

    const people = personOptions
      .map((person) => {
        const ownActivities = weekActivities.filter((activity) =>
          belongsToPerson(activity.assignedTo || activity.createdBy, person)
        );
        const ownVacations = weekVacations.filter((vacation) => belongsToPerson(vacation.user, person));
        const openActivities = ownActivities.filter((activity) => activity.status !== 'done');
        const mainActivity = openActivities[0] || ownActivities[0] || null;

        return {
          ...person,
          activities: ownActivities,
          mainActivity,
          openCount: openActivities.length,
          totalCount: ownActivities.length,
          vacations: ownVacations,
        };
      })
      .sort(
        (first, second) =>
          second.totalCount - first.totalCount || first.label.localeCompare(second.label, 'es')
      );

    return {
      startDate,
      endDate,
      rangeLabel: `${formatShortDate(startDate)} - ${formatShortDate(endDate)}`,
      people,
      busiest: people.find((person) => person.totalCount > 0) || null,
      vacationPeople: people.filter((person) => person.vacations.length > 0),
      totalActivities: weekActivities.length,
    };
  }, [activities, personOptions, vacations, weekRange]);

  const vacationRange = useMemo(() => getYearRange(monthCursor), [monthCursor]);

  const loadTeamData = async () => {
    setIsLoading(true);
    setError('');

    try {
      const [membersResponse, activitiesResponse, vacationsResponse, tripsResponse, googleResponse] = await Promise.all([
        getPortalMembers(portalId),
        getTeamActivities({ portalId, ...calendarRange }),
        getTeamVacations({ portalId, ...vacationRange }),
        getBusinessTrips(portalId, calendarRange),
        getGoogleCalendarEvents({ portalId, ...calendarRange }).catch((requestError) => ({
          configured: false,
          data: [],
          error:
            requestError.response?.data?.message ||
            'No se pudo conectar con Google Calendar desde el servidor.',
        })),
      ]);

      const nextMembers = membersResponse.data || [];
      setMembers(nextMembers);
      setActivities(activitiesResponse.data || activitiesResponse.activities || activitiesResponse || []);
      setVacations(vacationsResponse.data || vacationsResponse.vacations || vacationsResponse || []);
      setTrips(tripsResponse.data || tripsResponse.trips || tripsResponse || []);
      setGoogleCalendarConfigured(Boolean(googleResponse?.configured));
      setGoogleEvents(googleResponse?.data || []);
      setGoogleCalendarMessage(googleResponse?.error || '');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No se pudo cargar la actividad del equipo');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTeamData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    calendarRange.endDate,
    calendarRange.startDate,
    portalId,
    vacationRange.endDate,
    vacationRange.startDate,
  ]);

  const handleGoogleCalendarSync = async () => {
    if (!googleCalendarConfigured || isGoogleSyncing) return;

    setIsGoogleSyncing(true);
    setGoogleCalendarMessage('');
    try {
      const response = await syncGoogleCalendar({ portalId });
      const result = response.data || {};
      setGoogleCalendarMessage(
        result.failed > 0
          ? `Google Calendar: ${result.synchronized} sincronizadas, ${result.failed} con error.`
          : `${result.synchronized} actividades sincronizadas con Google Calendar.`
      );
      await loadTeamData();
    } catch (requestError) {
      setGoogleCalendarMessage(
        requestError.response?.data?.message || 'No se pudo sincronizar Google Calendar.'
      );
    } finally {
      setIsGoogleSyncing(false);
    }
  };

  const calendarDays = useMemo(() => {
    if (calendarView === 'month') return buildMonthDays(monthCursor);
    if (calendarView === 'day') {
      return [{ date: parseActivityDate(selectedDate), isCurrentMonth: true }];
    }
    return buildWeekDays(monthCursor);
  }, [calendarView, monthCursor, selectedDate]);
  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(monthCursor),
    [monthCursor]
  );
  const dayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(parseActivityDate(selectedDate)),
    [selectedDate]
  );
  const weekLabel = useMemo(() => {
    const start = parseActivityDate(weekRange.startDate);
    const end = parseActivityDate(weekRange.endDate);
    const startLabel = new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'short',
    }).format(start);
    const endLabel = new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(end);

    return `${startLabel} - ${endLabel}`;
  }, [weekRange]);

  const holidaysByDate = useMemo(() => {
    const years = new Set(calendarDays.map(({ date }) => date.getFullYear()));
    return Array.from(years).reduce((acc, year) => {
      getSevilleHolidays(year).forEach((holiday) => {
        acc[holiday.date] = holiday;
      });
      return acc;
    }, {});
  }, [calendarDays]);

  const activitiesByDate = useMemo(() => {
    const grouped = {};
    calendarDays.forEach(({ date }) => {
      const key = toDateInputValue(date);
      grouped[key] = visibleActivities.filter((activity) => {
        const start = toDateInputValue(parseActivityDate(activity.workDate));
        return key >= start && key <= getActivityEndValue(activity);
      });
    });
    return grouped;
  }, [calendarDays, visibleActivities]);

  const googleEventsByDate = useMemo(() => {
    const grouped = {};
    calendarDays.forEach(({ date }) => {
      const key = toDateInputValue(date);
      grouped[key] = googleEvents.filter((event) => key >= event.workDate && key <= event.endDate);
    });
    return grouped;
  }, [calendarDays, googleEvents]);

  const vacationsByDate = useMemo(() => {
    const grouped = {};
    calendarDays.forEach(({ date }) => {
      const key = toDateInputValue(date);
      grouped[key] = visibleVacations.filter((vacation) => isDateInVacation(key, vacation));
    });
    return grouped;
  }, [calendarDays, visibleVacations]);

  const tripsByDate = useMemo(() => {
    const grouped = {};
    calendarDays.forEach(({ date }) => {
      const key = toDateInputValue(date);
      grouped[key] = visibleTrips.filter((trip) => isDateInTrip(key, trip));
    });
    return grouped;
  }, [calendarDays, visibleTrips]);

  const selectedActivities = activitiesByDate[selectedDate] || [];
  const selectedGoogleEvents = googleEventsByDate[selectedDate] || [];
  const selectedTrips = tripsByDate[selectedDate] || [];
  const selectedHoliday = holidaysByDate[selectedDate];
  const minWorkDate = todayValue();
  const isSelectedPastDate = selectedDate < minWorkDate;
  const todayActivities = activitiesByDate[minWorkDate] || [];
  const doneActivities = selectedActivities.filter((activity) => activity.status === 'done').length;
  const currentUserColor = getPersonColorForUser(currentUser);
  const currentUserVacations = useMemo(
    () =>
      vacations.filter((vacation) => {
        const vacationUserId = getUserId(vacation.user);
        return (
          (currentUserId && vacationUserId === currentUserId) ||
          vacation.user?.email === currentUser.email
        );
      }),
    [vacations, currentUserId, currentUser.email]
  );
  const usedVacationDays = currentUserVacations.reduce((total, vacation) => {
    const start = vacation.startDate < vacationRange.startDate ? vacationRange.startDate : vacation.startDate;
    const end = vacation.endDate > vacationRange.endDate ? vacationRange.endDate : vacation.endDate;
    return total + countInclusiveDays(start, end);
  }, 0);
  const remainingVacationDays = Math.max(VACATION_TOTAL_DAYS - usedVacationDays, 0);
  const vacationRequestedDays = countInclusiveDays(vacationForm.startDate, vacationForm.endDate);

  const resetForm = () => {
    setEditingId(null);
    setIsAssigneeOpen(false);
    setForm({
      ...emptyForm,
      workDate: selectedDate,
      endDate: selectedDate,
      assignedTo: currentUserId,
    });
  };

  const handleOpenTaskForm = () => {
    if (!editingId) {
      setForm((current) => ({
        ...current,
        workDate: isSelectedPastDate ? minWorkDate : selectedDate,
        endDate: isSelectedPastDate ? minWorkDate : selectedDate,
        assignedTo: current.assignedTo || currentUserId,
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

    if (form.endDate < form.workDate) {
      setError('La fecha de fin debe ser igual o posterior a la fecha de inicio');
      return;
    }

    if (!form.assignedTo) {
      setError('Selecciona una persona del portal para asignar la tarea');
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        workDate: form.workDate,
        endDate: form.endDate,
        assignedTo: form.assignedTo,
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
      endDate: getActivityEndValue(activity),
      assignedTo: getUserId(activity.assignedTo),
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

  const syncActivity = (nextActivity) => {
    if (!nextActivity?.id) return;

    setActivities((current) =>
      current.map((activity) => (activity.id === nextActivity.id ? nextActivity : activity))
    );
  };

  const handleCommentDraftChange = (activityId, value) => {
    setCommentDrafts((current) => ({ ...current, [activityId]: value }));
    if (commentError === activityId) setCommentError('');
  };

  const handleAddComment = async (activity) => {
    const message = (commentDrafts[activity.id] || '').trim();

    if (!message) {
      setCommentError(activity.id);
      return;
    }

    setCommentSavingId(activity.id);
    setCommentError('');

    try {
      const response = await addTeamActivityComment({
        portalId,
        activityId: activity.id,
        message,
      });
      syncActivity(response.data || response.activity || response);
      setCommentDrafts((current) => {
        const next = { ...current };
        delete next[activity.id];
        return next;
      });
    } catch (requestError) {
      setCommentError(activity.id);
      setError(requestError.response?.data?.message || 'No se pudo anadir el comentario');
    } finally {
      setCommentSavingId(null);
    }
  };

  const handleCommentKeyDown = (event, activity) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      handleAddComment(activity);
    }
  };

  const handleConfirmDeleteComment = async () => {
    if (!commentDeleteTarget) return;

    setCommentSavingId(commentDeleteTarget.activityId);

    try {
      const response = await deleteTeamActivityComment({
        portalId,
        activityId: commentDeleteTarget.activityId,
        commentId: commentDeleteTarget.commentId,
      });
      syncActivity(response.data || response.activity || response);
      setCommentDeleteTarget(null);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No se pudo eliminar el comentario');
    } finally {
      setCommentSavingId(null);
    }
  };

  const handleVacationChange = (event) => {
    const { name, value } = event.target;
    setVacationForm((current) => {
      const next = { ...current, [name]: value };
      if (name === 'startDate' && value > next.endDate) next.endDate = value;
      if (name === 'endDate' && value < next.startDate) next.startDate = value;
      return next;
    });
    setVacationError('');
  };

  const handleVacationSubmit = async (event) => {
    event.preventDefault();
    setVacationError('');

    if (!vacationForm.startDate || !vacationForm.endDate) {
      setVacationError('Elige el inicio y el final de tus vacaciones.');
      return;
    }

    if (vacationForm.startDate < minWorkDate) {
      setVacationError('Las vacaciones deben empezar hoy o en una fecha futura.');
      return;
    }

    if (vacationRequestedDays > remainingVacationDays) {
      setVacationError(`Solo te quedan ${remainingVacationDays} dias disponibles.`);
      return;
    }

    setIsVacationSaving(true);

    try {
      const response = await createTeamVacation({
        portalId,
        vacation: {
          startDate: vacationForm.startDate,
          endDate: vacationForm.endDate,
          color: currentUserColor,
        },
      });
      const savedVacation = response.data || response.vacation || response;
      setVacations((current) => [...current, savedVacation]);
      setVacationForm({ startDate: minWorkDate, endDate: minWorkDate });
    } catch (requestError) {
      setVacationError(requestError.response?.data?.message || 'No se pudieron guardar las vacaciones');
    } finally {
      setIsVacationSaving(false);
    }
  };

  const handleDeleteVacation = async (vacationId) => {
    setVacationError('');

    try {
      await deleteTeamVacation({ portalId, vacationId });
      setVacations((current) =>
        current.filter((vacation) => vacation.id !== vacationId && vacation._id !== vacationId)
      );
    } catch (requestError) {
      setVacationError(requestError.response?.data?.message || 'No se pudieron eliminar las vacaciones');
    }
  };

  const changeCalendarPeriod = (amount) => {
    const baseDate = calendarView === 'day' ? parseActivityDate(selectedDate) : monthCursor;
    const nextCursor =
      calendarView === 'month'
        ? new Date(baseDate.getFullYear(), baseDate.getMonth() + amount, 1)
        : addDays(baseDate, amount * (calendarView === 'week' ? 7 : 1));

    setMonthCursor(nextCursor);
    setSelectedDate(
      calendarView === 'month'
        ? toDateInputValue(new Date(nextCursor.getFullYear(), nextCursor.getMonth(), 1))
        : calendarView === 'week'
          ? getWeekRange(nextCursor).startDate
          : toDateInputValue(nextCursor)
    );
  };

  const handleCalendarViewChange = (view) => {
    setCalendarView(view);
    setMonthCursor(parseActivityDate(selectedDate));
  };

  const handleSelectDate = (date) => {
    const value = toDateInputValue(date);
    setSelectedDate(value);
    if (
      calendarView === 'month' &&
      (date.getMonth() !== monthCursor.getMonth() || date.getFullYear() !== monthCursor.getFullYear())
    ) {
      setMonthCursor(date);
    }
    if (!editingId) setForm((current) => ({ ...current, workDate: value, endDate: value }));
  };

  const renderActivityComments = (activity) => {
    const comments = activity.comments || [];
    const draft = commentDrafts[activity.id] || '';
    const isSavingComment = commentSavingId === activity.id;

    return (
      <div className="mt-5 rounded-[24px] border border-[#ffd9b8] bg-white/75 p-4 shadow-[0_12px_30px_rgba(80,20,0,0.06)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff4ea] text-[#ff5a1f]">
              <MessageSquare className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-black text-[#3d1208]">Comentarios</p>
              <p className="text-xs font-semibold text-[#ff5a1f]">
                Actualizaciones rapidas de esta tarea.
              </p>
            </div>
          </div>
          <span className="rounded-full border border-[#ffd9b8] bg-[#fffaf5] px-3 py-1 text-xs font-black text-[#ff5a1f]">
            {comments.length} {comments.length === 1 ? 'nota' : 'notas'}
          </span>
        </div>

        <AnimatePresence initial={false}>
          {comments.length > 0 ? (
            <motion.div
              key="comments"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="mt-4 space-y-3"
            >
              {comments.map((comment) => {
                const commentId = comment.id || comment._id;
                const authorId = getUserId(comment.author);
                const canDeleteComment =
                  currentUserId &&
                  [authorId, getUserId(activity.author), getUserId(activity.createdBy), getUserId(activity.assignedTo)]
                    .filter(Boolean)
                    .includes(currentUserId);

                return (
                  <div
                    key={commentId}
                    className="group rounded-2xl border border-[#ffe4cc] bg-[#fffaf5] p-3 transition hover:border-[#ffb170] hover:bg-white"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black text-[#3d1208]">
                          {getUserLabel(comment.author)}
                        </p>
                        <p className="text-[11px] font-semibold text-[#ff7a2f]">
                          {formatCommentDate(comment.createdAt)}
                        </p>
                      </div>
                      {canDeleteComment && (
                        <button
                          type="button"
                          onClick={() =>
                            setCommentDeleteTarget({
                              activityId: activity.id,
                              commentId,
                              message: comment.message,
                            })
                          }
                          className="cursor-pointer rounded-xl border border-rose-100 bg-white p-2 text-rose-500 opacity-100 transition hover:bg-rose-50 sm:opacity-0 sm:group-hover:opacity-100"
                          aria-label="Eliminar comentario"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#5a2014]">
                      {comment.message}
                    </p>
                  </div>
                );
              })}
            </motion.div>
          ) : (
            <motion.p
              key="empty-comments"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="mt-4 rounded-2xl border border-dashed border-[#ffd9b8] bg-[#fffaf5] px-4 py-3 text-sm font-semibold text-[#a34a21]"
            >
              Todavia no hay comentarios en esta tarea.
            </motion.p>
          )}
        </AnimatePresence>

        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-[#ffd9b8] bg-white p-3 sm:flex-row sm:items-end">
          <label className="flex-1 text-xs font-black text-[#3d1208]">
            Nueva actualizacion
            <textarea
              value={draft}
              onChange={(event) => handleCommentDraftChange(activity.id, event.target.value)}
              onKeyDown={(event) => handleCommentKeyDown(event, activity)}
              placeholder="Escribe un avance, bloqueo o siguiente paso..."
              rows={2}
              className="mt-2 min-h-[76px] w-full resize-none rounded-2xl border border-[#ffd4ad] bg-[#fffaf5] px-4 py-3 text-sm font-semibold text-[#3d1208] outline-none transition focus:border-[#ff5a1f] focus:ring-4 focus:ring-[#ff5a1f]/10"
            />
            {commentError === activity.id && (
              <span className="mt-2 block text-xs font-black text-[#ff2d55]">
                Escribe algo antes de enviarlo.
              </span>
            )}
          </label>
          <button
            type="button"
            onClick={() => handleAddComment(activity)}
            disabled={isSavingComment}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#ff5a1f] to-[#ff2d55] px-5 py-3 text-sm font-black text-white shadow-lg shadow-orange-200 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSavingComment ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <SendHorizontal className="h-4 w-4" />
            )}
            Anadir nota
          </button>
        </div>
      </div>
    );
  };

  const renderCalendarDay = ({ date, isCurrentMonth }) => {
    const value = toDateInputValue(date);
    const dayActivities = activitiesByDate[value] || [];
    const dayGoogleEvents = googleEventsByDate[value] || [];
    const dayVacations = vacationsByDate[value] || [];
    const dayTrips = tripsByDate[value] || [];
    const holiday = holidaysByDate[value];
    const isSelected = value === selectedDate;
    const isDailyView = calendarView === 'day';
    const maxVisibleEvents = isDailyView ? 50 : calendarView === 'week' ? 12 : 3;
    const events = [
      ...dayGoogleEvents.map((event) => {
        const category = getGoogleEventMeta(event);

        return {
        id: event.id,
        title: event.title,
        timeLabel: event.timeLabel || 'Todo el día',
          color: getCalendarEventColor(event, category.color),
        source: 'google',
        };
      }),
      ...dayActivities.map((activity) => ({
        id: activity.id,
        title: activity.title,
        timeLabel: activity.timeLabel || 'Todo el día',
        color: getCalendarEventColor(activity, getActivityMarkerColor(activity)),
        source: 'activity',
      })),
    ].sort((first, second) => {
      if (first.timeLabel === 'Todo el día') return 1;
      if (second.timeLabel === 'Todo el día') return -1;
      return first.timeLabel.localeCompare(second.timeLabel);
    });

    return (
      <motion.button
        key={value}
        type="button"
        onClick={() => handleSelectDate(date)}
        whileTap={{ scale: 0.99 }}
        className={`group flex min-h-[190px] flex-col rounded-2xl border p-3 text-left transition md:min-h-[220px] md:rounded-[22px] md:p-4 ${
          isDailyView ? 'min-h-[560px] md:min-h-[620px]' : ''
        } ${
          isSelected
            ? 'border-[#ff5a1f] bg-[#fff3e7] shadow-[0_12px_30px_rgba(255,90,31,0.12)]'
            : holiday && isCurrentMonth
              ? 'border-violet-200 bg-violet-50/60 hover:border-violet-300'
              : 'border-orange-100 bg-white hover:border-orange-300 hover:bg-orange-50/50'
        } ${calendarView === 'month' && !isCurrentMonth ? 'opacity-45' : ''}`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-orange-100 pb-3">
          <div>
            <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-[#ff5a1f] md:text-xs">
              {new Intl.DateTimeFormat('es-ES', { weekday: 'short' }).format(date).replace('.', '')}
            </span>
            <span className="mt-1 block text-2xl font-black text-[#3b1208] md:text-3xl">{date.getDate()}</span>
          </div>
          {(events.length > 0 || dayTrips.length > 0 || dayVacations.length > 0) && (
            <span className="rounded-full border border-orange-100 bg-white px-2 py-1 text-[10px] font-black text-[#9a4a2f] shadow-sm">
              {events.length + dayTrips.length + dayVacations.length}
            </span>
          )}
        </div>

        <div className={`mt-3 flex min-h-0 flex-1 flex-col gap-2 ${isDailyView ? 'overflow-y-auto pr-1' : 'overflow-hidden'}`}>
          {holiday && isCurrentMonth && (
            <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-black text-white shadow-sm md:text-xs" style={{ backgroundColor: HOLIDAY_COLOR }}>
              <Landmark size={12} />
              <span className="truncate">{holiday.name}</span>
            </span>
          )}

          {dayTrips.map((trip) => (
            <span key={trip.id || trip._id} className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-[10px] font-black text-sky-700 md:text-xs" title={`${trip.title} - ${trip.destination}`}>
              <PlaneTakeoff size={12} />
              <span className="truncate">Viaje · {trip.destination}</span>
            </span>
          ))}

          {dayVacations.slice(0, 3).map((vacation) => (
            <span key={vacation.id || vacation._id} className="inline-flex max-w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-black text-white shadow-sm md:text-xs" style={{ backgroundColor: getPersonColorForUser(vacation.user) }}>
              <Umbrella size={12} />
              <span className="truncate">Vacaciones · {getUserLabel(vacation.user)}</span>
            </span>
          ))}

          {events.slice(0, maxVisibleEvents).map((event) => (
            <span key={`${event.source}-${event.id}`} className="flex min-h-[66px] flex-col items-start rounded-lg px-2.5 py-2 text-[10px] font-black leading-4 text-white shadow-sm md:text-xs md:leading-5" style={{ backgroundColor: event.color }} title={`${event.timeLabel} · ${event.title}`}>
              <span className="rounded bg-white/20 px-1.5 py-0.5 text-[9px] font-black md:text-[10px]">{event.timeLabel}</span>
              <span className="mt-1 block max-h-10 min-w-0 overflow-hidden break-words">{event.title}</span>
            </span>
          ))}

          {events.length > maxVisibleEvents && (
            <span className="mt-auto rounded-lg border border-dashed border-orange-200 px-2.5 py-1.5 text-center text-[10px] font-black text-[#9a4a2f]">
              +{events.length - maxVisibleEvents} más
            </span>
          )}

          {events.length === 0 && dayTrips.length === 0 && dayVacations.length === 0 && !holiday && (
            <span className="mt-auto text-[11px] font-semibold text-[#c58b70]">Sin eventos</span>
          )}
        </div>
      </motion.button>
    );
  };

  return (
    <PortalSidebar>
      <div className="relative min-h-screen overflow-hidden bg-[#fafafa] px-3 py-5 text-[#3b1208] md:px-6 md:py-8 xl:px-8">
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

        <motion.main
          initial={{ opacity: 0, x: -14 }}
          animate={isLeavingForTrips ? { opacity: 0, x: 22 } : { opacity: 1, x: 0 }}
          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          onAnimationComplete={() => {
            if (isLeavingForTrips) navigate(`/dashboard/portal/${portalId}/team/trips`);
          }}
          className="relative z-10 mx-auto w-full max-w-[1800px] space-y-4 md:space-y-6"
        >
          <section className="rounded-[20px] border border-orange-100 bg-white/90 p-5 shadow-sm md:rounded-[24px] md:p-7">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#ff3f6c]">Equipo</p>
            <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="font-display text-3xl text-[#4b1406] md:text-5xl">
                  Actividad del equipo
                </h1>
                <p className="mt-3 max-w-3xl text-base leading-7 text-[#ff5a1f]">
                  Anota en que estas trabajando, consulta el foco de cada persona y revisa el
                  calendario diario del portal.
                </p>
                <motion.button
                  type="button"
                  onClick={() => setIsLeavingForTrips(true)}
                  disabled={isLeavingForTrips}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.96, y: 1 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                  className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff5a00] to-[#ff3048] px-4 py-2.5 text-sm font-black text-white shadow-md shadow-orange-100 hover:shadow-lg disabled:cursor-wait"
                >
                  <PlaneTakeoff size={18} />
                  Agregar viaje de empresa
                </motion.button>
              </div>
              <div className="grid w-full grid-cols-3 gap-2 md:w-auto md:gap-3">
                <div className="flex h-24 min-w-0 flex-col items-center justify-center rounded-2xl border border-orange-100 bg-[#fff8f1] px-2 text-center shadow-sm md:h-28 md:w-28 md:shrink-0 md:p-4">
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
                <div className="flex h-24 min-w-0 flex-col items-center justify-center rounded-2xl border border-orange-100 bg-[#fff8f1] px-2 text-center shadow-sm md:h-28 md:w-28 md:shrink-0 md:p-4">
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
                <div className="flex h-24 min-w-0 flex-col items-center justify-center rounded-2xl border border-orange-100 bg-[#fff8f1] px-2 text-center shadow-sm md:h-28 md:w-28 md:shrink-0 md:p-4">
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

          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <motion.form
              onSubmit={handleVacationSubmit}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              layout
              className="overflow-hidden rounded-[26px] border border-orange-100 bg-white/95 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 p-4 pb-3 md:p-6 md:pb-4">
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff3e7] text-[#ff5a1f]">
                    <Umbrella size={22} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-[#ff3f6c]">
                      Implementar vacaciones
                    </p>
                    <h2 className="mt-1 text-2xl font-black text-[#3b1208]">
                      Planifica tus dias libres
                    </h2>
                    <p className="mt-1 text-sm text-[#ff5a1f]">
                      Marca un rango y se vera como una linea continua con tu color en el calendario.
                    </p>
                  </div>
                </div>
                <motion.span
                  key={vacationRequestedDays}
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="rounded-full border border-orange-100 bg-orange-50 px-4 py-2 text-sm font-black text-[#ff5a1f]"
                >
                  {vacationRequestedDays} {vacationRequestedDays === 1 ? 'dia' : 'dias'} seleccionados
                </motion.span>
              </div>

              <div className="px-4 md:px-6">
                <div className="grid items-stretch gap-4 md:grid-cols-[1fr_auto_1fr]">
                  <label className="group block rounded-3xl border border-orange-100 bg-[#fffaf5] p-4 transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-sm">
                    <span className="flex items-center justify-between gap-3 text-sm font-black text-[#3b1208]">
                      Inicio
                      <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-[#ff5a1f] shadow-sm">
                        <CalendarDays size={17} />
                      </span>
                    </span>
                    <span className="mt-3 block text-2xl font-black text-[#3b1208]">
                      {formatShortDate(vacationForm.startDate)}
                    </span>
                    <input
                      type="date"
                      name="startDate"
                      min={minWorkDate}
                      value={vacationForm.startDate}
                      onChange={handleVacationChange}
                      className="mt-3 h-11 w-full cursor-pointer rounded-2xl border border-orange-200 bg-white px-4 text-sm outline-none transition focus:border-[#ff5a1f] focus:ring-4 focus:ring-orange-100"
                    />
                  </label>
                  <div className="hidden min-w-24 flex-col items-center justify-center md:flex">
                    <motion.span
                      key={`range-${vacationRequestedDays}`}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="flex h-14 w-14 items-center justify-center rounded-full border border-orange-100 bg-white text-lg font-black text-[#ff5a1f] shadow-sm"
                    >
                      {vacationRequestedDays}
                    </motion.span>
                    <span className="mt-2 text-center text-[10px] font-black uppercase text-[#ff8a3d]">
                      dias
                    </span>
                  </div>
                  <label className="group block rounded-3xl border border-orange-100 bg-[#fffaf5] p-4 transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-sm">
                    <span className="flex items-center justify-between gap-3 text-sm font-black text-[#3b1208]">
                      Fin
                      <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-[#ff5a1f] shadow-sm">
                        <CalendarDays size={17} />
                      </span>
                    </span>
                    <span className="mt-3 block text-2xl font-black text-[#3b1208]">
                      {formatShortDate(vacationForm.endDate)}
                    </span>
                    <input
                      type="date"
                      name="endDate"
                      min={vacationForm.startDate || minWorkDate}
                      value={vacationForm.endDate}
                      onChange={handleVacationChange}
                      className="mt-3 h-11 w-full cursor-pointer rounded-2xl border border-orange-200 bg-white px-4 text-sm outline-none transition focus:border-[#ff5a1f] focus:ring-4 focus:ring-orange-100"
                    />
                  </label>
                </div>

                <motion.div
                  layout
                  className="mt-4 overflow-hidden rounded-3xl border border-orange-100 bg-white p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-[#ff5a1f]">
                        Rango preparado
                      </p>
                      <p className="mt-1 text-sm font-black text-[#3b1208]">
                        {formatShortDate(vacationForm.startDate)} - {formatShortDate(vacationForm.endDate)}
                      </p>
                    </div>
                    <span className="rounded-full border border-orange-100 bg-[#fff8f1] px-3 py-1 text-xs font-black text-[#ff5a1f]">
                      Se pintara con tu color
                    </span>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-orange-100">
                    <motion.span
                      className="block h-full rounded-full"
                      style={{ backgroundColor: currentUserColor }}
                      initial={false}
                      animate={{
                        width: `${Math.min((vacationRequestedDays / VACATION_TOTAL_DAYS) * 100, 100)}%`,
                      }}
                      transition={{ duration: 0.35, ease: 'easeOut' }}
                    />
                  </div>
                </motion.div>
              </div>

              <AnimatePresence>
                {vacationError && (
                  <motion.p
                    initial={{ opacity: 0, height: 0, y: -6 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -6 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className="mx-4 mt-4 overflow-hidden rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 md:mx-6"
                  >
                    {vacationError}
                  </motion.p>
                )}
              </AnimatePresence>

              <div className="mt-5 flex flex-col items-stretch gap-4 border-t border-orange-100 bg-[#fffaf5] px-4 py-5 md:flex-row md:flex-wrap md:items-center md:justify-between md:px-6">
                <div className="flex flex-wrap gap-2">
                  <AnimatePresence initial={false}>
                    {currentUserVacations.length === 0 ? (
                      <motion.span
                        key="empty-vacations"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="rounded-full border border-dashed border-orange-200 bg-white px-4 py-2 text-sm text-[#ff8a3d]"
                      >
                        Aun no tienes vacaciones guardadas.
                      </motion.span>
                    ) : (
                      currentUserVacations.map((vacation) => (
                        <motion.span
                          layout
                          key={vacation.id || vacation._id}
                          initial={{ opacity: 0, scale: 0.92, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: -8 }}
                          transition={{ duration: 0.2, ease: 'easeOut' }}
                          className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white px-3 py-2 text-sm font-black text-[#3b1208] shadow-sm"
                        >
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: currentUserColor }}
                          />
                          {formatShortDate(vacation.startDate)} - {formatShortDate(vacation.endDate)}
                          <button
                            type="button"
                            onClick={() => handleDeleteVacation(vacation.id || vacation._id)}
                            className="cursor-pointer rounded-full p-1 text-[#ff3048] transition hover:bg-red-50"
                            aria-label="Quitar vacaciones"
                          >
                            <X size={14} />
                          </button>
                        </motion.span>
                      ))
                    )}
                  </AnimatePresence>
                </div>
                <button
                  type="submit"
                  disabled={isVacationSaving}
                  className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#ff5a1f] to-[#ff3048] px-6 py-3 text-sm font-black text-white shadow-lg shadow-orange-200 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
                >
                  {isVacationSaving ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                  Guardar vacaciones
                </button>
              </div>
            </motion.form>

            <motion.aside
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut', delay: 0.05 }}
              layout
              className="rounded-[26px] border border-orange-100 bg-[#fff8f1] p-6 shadow-sm"
            >
              <p className="text-sm font-semibold uppercase tracking-wide text-[#ff3f6c]">Leyenda</p>
              <h3 className="mt-1 text-xl font-black text-[#3b1208]">Dias disponibles</h3>
              <div className="mt-5 rounded-3xl border border-orange-100 bg-white p-5 shadow-sm">
                <div className="grid grid-cols-[1fr_auto] items-center gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-[#ff8a3d]">
                      Disponibles
                    </p>
                    <motion.span
                      key={remainingVacationDays}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      className="mt-1 block text-5xl font-black leading-none text-[#3b1208]"
                    >
                      {remainingVacationDays}
                    </motion.span>
                  </div>
                  <div className="rounded-2xl border border-orange-100 bg-[#fff8f1] px-4 py-3 text-center">
                    <p className="text-[10px] font-black uppercase text-[#ff8a3d]">Total anual</p>
                    <p className="mt-1 text-xl font-black text-[#3b1208]">{VACATION_TOTAL_DAYS}</p>
                  </div>
                </div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-orange-100">
                  <motion.span
                    className="block h-full rounded-full bg-gradient-to-r from-[#ff5a1f] to-[#ff3048]"
                    initial={false}
                    animate={{
                      width: `${Math.min((usedVacationDays / VACATION_TOTAL_DAYS) * 100, 100)}%`,
                    }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                  />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-orange-100 bg-[#fffaf5] p-3">
                    <p className="text-[10px] font-black uppercase text-[#ff8a3d]">Usados</p>
                    <motion.p
                      key={usedVacationDays}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="mt-1 text-lg font-black text-[#3b1208]"
                    >
                      {usedVacationDays}
                    </motion.p>
                  </div>
                  <div className="rounded-2xl border border-orange-100 bg-[#fffaf5] p-3">
                    <p className="text-[10px] font-black uppercase text-[#ff8a3d]">Seleccion</p>
                    <motion.p
                      key={vacationRequestedDays}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="mt-1 text-lg font-black text-[#3b1208]"
                    >
                      {vacationRequestedDays}
                    </motion.p>
                  </div>
                </div>
              </div>
              <div className="mt-4 rounded-3xl border border-orange-100 bg-white p-4 text-sm text-[#3b1208]">
                <div className="flex items-center gap-3">
                  <motion.span
                    className="inline-block h-4 w-10 rounded-full"
                    style={{ backgroundColor: currentUserColor }}
                    initial={{ scaleX: 0.4, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    transition={{ duration: 0.28, ease: 'easeOut' }}
                  />
                  <span>Este sera tu color para vacaciones y actividad. Las vacaciones cuentan todos los dias naturales.</span>
                </div>
              </div>
            </motion.aside>
          </section>

          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut', delay: 0.08 }}
            className="rounded-[20px] border border-orange-100 bg-white/95 p-4 shadow-sm md:rounded-[26px] md:p-5"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff3e7] text-[#ff5a1f]">
                  <Users size={21} />
                </span>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-[#ff3f6c]">
                    Vista por persona
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-[#3b1208]">
                    {isPersonFiltered ? selectedPerson?.label || 'Persona seleccionada' : 'Todo el equipo'}
                  </h2>
                  <p className="mt-1 text-sm text-[#ff5a1f]">
                    Filtra el calendario para revisar solo las tareas y vacaciones de un miembro concreto.
                  </p>
                </div>
              </div>
              <motion.span
                key={personFilter}
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="inline-flex w-fit items-center gap-2 rounded-full border border-orange-100 bg-[#fff8f1] px-4 py-2 text-sm font-black text-[#ff5a1f]"
              >
                {isPersonFiltered ? 'Vista individual' : `${personOptions.length} personas`}
              </motion.span>
            </div>

            <div className="relative mt-5">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-white/95 to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-white/95 to-transparent" />
              <div
                ref={personScrollerRef}
                onClickCapture={handlePersonClickCapture}
                onPointerDown={handlePersonDragStart}
                onPointerMove={handlePersonDragMove}
                onPointerUp={handlePersonDragEnd}
                onPointerCancel={handlePersonDragEnd}
                className="gestiona-scrollbar-hidden flex cursor-grab select-none gap-3 overflow-x-auto px-1 py-1 active:cursor-grabbing"
              >
                <button
                  type="button"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={() => setPersonFilter('all')}
                  className={`inline-flex min-w-fit cursor-pointer items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-black shadow-sm transition hover:-translate-y-0.5 ${
                    personFilter === 'all'
                      ? 'border-transparent bg-gradient-to-r from-[#ff5a1f] to-[#ff3048] text-white shadow-orange-200'
                      : 'border-orange-100 bg-white text-[#3b1208] hover:border-orange-200'
                  }`}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
                    <Users size={16} />
                  </span>
                  Todo el equipo
                </button>

                {personOptions.map((person) => {
                  const active = personFilter === person.id;
                  return (
                    <button
                      type="button"
                      key={person.id}
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={() => setPersonFilter(person.id)}
                      className={`inline-flex min-w-[210px] cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-black shadow-sm transition hover:-translate-y-0.5 ${
                        active
                          ? 'border-transparent bg-gradient-to-r from-[#ff5a1f] to-[#ff3048] text-white shadow-orange-200'
                          : 'border-orange-100 bg-white text-[#3b1208] hover:border-orange-200'
                      }`}
                    >
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black text-white shadow-sm"
                        style={{ backgroundColor: active ? 'rgba(255,255,255,0.22)' : person.color }}
                      >
                        {person.initials}
                      </span>
                      <span className="min-w-0 text-left">
                        <span className="block truncate">{person.label}</span>
                        {person.email && (
                          <span className={`block truncate text-[11px] ${active ? 'text-white/80' : 'text-[#ff8a3d]'}`}>
                            {person.email}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut', delay: 0.1 }}
            className="min-w-0 max-w-full overflow-hidden rounded-[20px] border border-orange-100 bg-white/95 shadow-sm md:rounded-[26px]"
          >
            <div className="flex flex-col gap-4 border-b border-orange-100 p-4 md:p-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 items-start gap-3 md:gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff3e7] text-[#ff5a1f] md:h-12 md:w-12 md:rounded-2xl">
                  <CalendarDays size={21} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold uppercase tracking-wide text-[#ff3f6c]">
                    Resumen semanal
                  </p>
                  <h2 className="mt-1 text-xl font-black text-[#3b1208] md:text-2xl">
                    Semana {weeklySummary.rangeLabel}
                  </h2>
                  <p className="mt-1 text-sm text-[#ff5a1f]">
                    Foco del equipo, carga de trabajo y vacaciones en una vista rapida.
                  </p>
                </div>
              </div>
              <motion.span
                key={weeklySummary.totalActivities}
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="inline-flex w-fit items-center gap-2 rounded-full border border-orange-100 bg-[#fff8f1] px-4 py-2 text-sm font-black text-[#ff5a1f]"
              >
                {weeklySummary.totalActivities} actividades esta semana
              </motion.span>
            </div>

            <div className="grid min-w-0 gap-3 p-3 min-[420px]:p-4 md:gap-4 md:p-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(220px,0.72fr)_minmax(260px,0.88fr)]">
              <div className="min-w-0 rounded-2xl border border-orange-100 bg-[#fffaf5] p-3 md:rounded-3xl md:p-4">
                <div className="mb-3 flex min-w-0 items-center gap-3 md:mb-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#ff5a1f] shadow-sm md:h-10 md:w-10 md:rounded-2xl">
                    <Users size={18} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-base font-black text-[#3b1208] md:text-lg">Que hace cada persona</h3>
                    <p className="text-xs font-semibold text-[#ff5a1f]">Actividad principal registrada.</p>
                  </div>
                </div>

                {weeklySummary.people.length ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {weeklySummary.people.slice(0, 6).map((person) => (
                      <motion.div
                        key={person.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        className="flex min-w-0 items-center gap-2.5 rounded-xl border border-orange-100 bg-white p-2.5 shadow-sm md:gap-3 md:rounded-2xl md:p-3"
                      >
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-black text-white shadow-sm md:h-10 md:w-10 md:text-xs"
                          style={{ backgroundColor: person.color }}
                        >
                          {person.initials}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate font-black text-[#3b1208]">{person.label}</p>
                            <span className="shrink-0 rounded-full bg-orange-50 px-2 py-1 text-xs font-black text-[#ff5a1f]">
                              {person.totalCount}
                            </span>
                          </div>
                          <p className="mt-1 truncate text-sm text-[#8b2f12]">
                            {person.mainActivity?.title ||
                              (person.vacations.length
                                ? 'De vacaciones esta semana'
                                : 'Sin actividad esta semana')}
                          </p>
                        </div>
                      </motion.div>
                    ))}

                    {weeklySummary.people.length > 6 && (
                      <div className="rounded-2xl border border-dashed border-orange-200 bg-white/70 p-3 text-sm font-black text-[#ff5a1f]">
                        +{weeklySummary.people.length - 6} personas mas en el equipo.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-orange-200 p-4 text-sm font-bold text-[#ff5a1f]">
                    Todavia no hay personas con actividad para esta semana.
                  </div>
                )}
              </div>

              <div className="min-w-0 rounded-2xl border border-orange-100 bg-white p-3 md:rounded-3xl md:p-4">
                <div className="mb-3 flex min-w-0 items-center gap-3 md:mb-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fff3e7] text-[#ff5a1f] md:h-10 md:w-10 md:rounded-2xl">
                    <Clock3 size={18} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-base font-black text-[#3b1208] md:text-lg">Mas carga</h3>
                    <p className="text-xs font-semibold text-[#ff5a1f]">Mayor volumen semanal.</p>
                  </div>
                </div>

                {weeklySummary.busiest ? (
                  <div className="min-w-0 rounded-xl border border-orange-100 bg-gradient-to-br from-orange-50 to-rose-50 p-3 md:rounded-2xl md:p-4">
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-black text-white shadow-sm md:h-12 md:w-12 md:text-sm"
                      style={{ backgroundColor: weeklySummary.busiest.color }}
                    >
                      {weeklySummary.busiest.initials}
                    </span>
                    <p className="mt-3 break-words font-black text-[#3b1208]">{weeklySummary.busiest.label}</p>
                    <p className="mt-1 text-sm font-semibold text-[#ff5a1f]">
                      {weeklySummary.busiest.totalCount} actividades esta semana.
                    </p>
                  </div>
                ) : (
                  <p className="rounded-2xl border border-dashed border-orange-200 p-4 text-sm font-bold text-[#ff5a1f]">
                    Sin carga registrada esta semana.
                  </p>
                )}
              </div>

              <div className="min-w-0 rounded-2xl border border-orange-100 bg-white p-3 md:rounded-3xl md:p-4">
                <div className="mb-3 flex min-w-0 items-center gap-3 md:mb-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fff3e7] text-[#ff5a1f] md:h-10 md:w-10 md:rounded-2xl">
                    <Umbrella size={18} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-base font-black text-[#3b1208] md:text-lg">Vacaciones</h3>
                    <p className="text-xs font-semibold text-[#ff5a1f]">Ausencias de esta semana.</p>
                  </div>
                </div>

                {weeklySummary.vacationPeople.length ? (
                  <div className="space-y-3">
                    {weeklySummary.vacationPeople.slice(0, 4).map((person) => (
                      <motion.div
                        key={person.id}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        className="min-w-0 rounded-xl border border-orange-100 bg-[#fffaf5] p-2.5 md:rounded-2xl md:p-3"
                      >
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: person.color }} />
                          <p className="min-w-0 break-words font-black text-[#3b1208]">{person.label}</p>
                        </div>
                        <p className="mt-1 text-xs font-bold text-[#ff5a1f]">
                          {person.vacations
                            .map(
                              (vacation) =>
                                `${formatShortDate(vacation.startDate)} - ${formatShortDate(vacation.endDate)}`
                            )
                            .join(', ')}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-2xl border border-dashed border-orange-200 p-4 text-sm font-bold text-[#ff5a1f]">
                    Nadie esta de vacaciones esta semana.
                  </p>
                )}
              </div>
            </div>
          </motion.section>

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
                  className="self-start rounded-[20px] border border-orange-100 bg-white/95 p-4 shadow-sm md:rounded-[24px] md:p-6 xl:min-h-[632px]"
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
                          Planifica una tarea para uno o varios dias y compartela con el equipo.
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
                    <span className="text-sm font-bold">Inicio</span>
                    <input
                      type="date"
                      value={form.workDate}
                      min={editingId ? undefined : minWorkDate}
                      onChange={(event) => {
                        const workDate = event.target.value;
                        setForm((current) => ({
                          ...current,
                          workDate,
                          endDate: !current.endDate || current.endDate < workDate ? workDate : current.endDate,
                        }));
                      }}
                      className="mt-2 w-full rounded-2xl border border-orange-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#ff5a1f] focus:ring-4 focus:ring-orange-100"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-bold">Fin</span>
                    <input
                      type="date"
                      min={form.workDate || minWorkDate}
                      value={form.endDate}
                      onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))}
                      className="mt-2 w-full rounded-2xl border border-orange-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#ff5a1f] focus:ring-4 focus:ring-orange-100"
                    />
                  </label>

                  <div className="relative block">
                    <span className="text-sm font-bold">Persona</span>
                    <button
                      type="button"
                      onClick={() => setIsAssigneeOpen((open) => !open)}
                      aria-haspopup="listbox"
                      aria-expanded={isAssigneeOpen}
                      className="mt-2 flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-orange-200 bg-[#fffaf5] px-4 py-3 text-left text-sm font-semibold outline-none transition hover:border-orange-300 hover:bg-white focus:border-[#ff5a1f] focus:ring-4 focus:ring-orange-100"
                    >
                      <span
                        className="h-3 w-3 shrink-0 rounded-full shadow-sm"
                        style={{ backgroundColor: assignedPerson?.color || '#d6d3d1' }}
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {assignedPerson?.label || 'Seleccionar persona'}
                      </span>
                      <ChevronDown
                        size={18}
                        className={`shrink-0 text-[#ff5a1f] transition ${isAssigneeOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    <AnimatePresence>
                      {isAssigneeOpen && (
                        <motion.div
                          role="listbox"
                          initial={{ opacity: 0, y: -6, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -4, scale: 0.98 }}
                          transition={{ duration: 0.16 }}
                          className="absolute left-0 right-0 top-full z-30 mt-2 max-h-56 overflow-y-auto rounded-2xl border border-orange-100 bg-white p-2 shadow-xl shadow-orange-100/60"
                        >
                          {assignablePeople.map((person) => (
                            <button
                              key={person.id}
                              type="button"
                              role="option"
                              aria-selected={form.assignedTo === person.id}
                              onClick={() => {
                                setForm((current) => ({ ...current, assignedTo: person.id }));
                                setIsAssigneeOpen(false);
                              }}
                              className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-orange-50 ${
                                form.assignedTo === person.id ? 'bg-orange-50 font-black' : 'font-semibold'
                              }`}
                            >
                              <span
                                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[10px] font-black text-white shadow-sm"
                                style={{ backgroundColor: person.color }}
                              >
                                {person.initials}
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate">{person.label}</span>
                                {person.email && (
                                  <span className="block truncate text-xs font-normal text-[#9a4a2f]">
                                    {person.email}
                                  </span>
                                )}
                              </span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

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

              <div className="mt-6 grid grid-cols-2 gap-3 md:flex md:flex-wrap md:items-center md:justify-between">
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
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#ff5a00] to-[#ff3048] px-4 py-3 text-sm font-black text-white shadow-lg shadow-orange-100 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 md:px-6"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                  {editingId ? 'Actualizar' : 'Guardar actividad'}
                </button>
              </div>
                </motion.form>
              )}
            </AnimatePresence>

            <section
              className={`relative self-start overflow-visible rounded-[20px] border border-orange-100 bg-gradient-to-br from-white via-white to-[#fffaf5] p-4 shadow-[0_20px_60px_rgba(124,45,18,0.08)] md:rounded-[28px] md:p-7 ${
                isSelectedPastDate ? '' : 'xl:min-h-[632px]'
              }`}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff3e7] text-[#ff5a1f]">
                    <CalendarDays size={21} />
                  </span>
                  <div>
                    <h2 className="text-2xl font-black">Calendario</h2>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <p className="text-sm text-[#ff5a1f]">Pulsa un dia para ver su actividad.</p>
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full border border-violet-100 bg-violet-50 px-2.5 py-1 text-[11px] font-black text-violet-700"
                        style={{ color: HOLIDAY_COLOR }}
                      >
                        <Landmark size={13} />
                        Festivo Sevilla
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-black ${
                          googleCalendarConfigured
                            ? 'border-blue-100 bg-blue-50 text-blue-700'
                            : 'border-slate-200 bg-slate-50 text-slate-500'
                        }`}
                        title={
                          googleCalendarConfigured
                            ? 'Eventos compartidos desde el calendario de Google'
                            : googleCalendarMessage || 'Google Calendar pendiente de configuración en el servidor'
                        }
                      >
                        <CalendarDays size={13} />
                        {googleCalendarConfigured
                          ? 'Google Calendar conectado'
                          : googleCalendarMessage
                            ? 'Google Calendar con error'
                            : 'Google Calendar no conectado'}
                      </span>
                      {googleCalendarConfigured && (
                        <button
                          type="button"
                          onClick={handleGoogleCalendarSync}
                          disabled={isGoogleSyncing}
                          className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-white px-2.5 py-1 text-[11px] font-black text-blue-700 transition hover:bg-blue-50 disabled:cursor-wait disabled:opacity-60"
                          title="Sincronizar las actividades existentes"
                        >
                          <RefreshCw size={13} className={isGoogleSyncing ? 'animate-spin' : ''} />
                          Sincronizar
                        </button>
                      )}
                      {googleCalendarMessage && (
                        <span className="text-[11px] font-bold text-blue-700">{googleCalendarMessage}</span>
                      )}
                    </div>
                  </div>
                </div>
                   <div className="flex w-full flex-wrap items-center justify-between gap-2 md:w-auto md:justify-start">
                    <div className="flex items-center rounded-xl border border-orange-200 bg-white p-1 shadow-sm">
                      {[
                        { value: 'month', label: 'Mes' },
                        { value: 'week', label: 'Semana' },
                        { value: 'day', label: 'Día' },
                      ].map((view) => (
                        <button
                          key={view.value}
                          type="button"
                          onClick={() => handleCalendarViewChange(view.value)}
                          className={`cursor-pointer rounded-lg px-2.5 py-1.5 text-[11px] font-black transition md:px-3 ${
                            calendarView === view.value
                              ? 'bg-[#3b1208] text-white shadow-sm'
                              : 'text-[#8b2f12] hover:bg-orange-50'
                          }`}
                        >
                          {view.label}
                        </button>
                      ))}
                    </div>
                    <button
                     type="button"
                     onClick={() => {
                       const today = new Date();
                       setMonthCursor(today);
                       setSelectedDate(toDateInputValue(today));
                     }}
                     className="hidden cursor-pointer rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs font-black text-[#8b2f12] transition hover:bg-orange-50 sm:inline-flex"
                   >
                     Hoy
                   </button>
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
                      onClick={() => changeCalendarPeriod(-1)}
                    className="cursor-pointer rounded-xl border border-orange-200 p-2 text-[#8b2f12] transition hover:bg-orange-50"
                  >
                    <ChevronLeft size={18} />
                  </button>
                    <p className="min-w-0 flex-1 text-center text-sm font-black capitalize md:min-w-52 md:flex-none">
                      {calendarView === 'month'
                        ? monthLabel
                        : calendarView === 'week'
                          ? `Semana ${weekLabel}`
                          : dayLabel}
                  </p>
                  <button
                    type="button"
                      onClick={() => changeCalendarPeriod(1)}
                    className="cursor-pointer rounded-xl border border-orange-200 p-2 text-[#8b2f12] transition hover:bg-orange-50"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-orange-100 pt-4 text-[11px] font-bold text-[#7c3a24] md:gap-3 md:text-xs">
                <span className="mr-1 uppercase tracking-[0.16em] text-[#9a4a2f]">Leyenda</span>
                {STATUS_OPTIONS.map((status) => (
                  <span key={status.value} className="inline-flex items-center gap-1.5 rounded-full border border-orange-100 bg-white px-2.5 py-1.5 shadow-sm">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ACTIVITY_STATUS_COLORS[status.value] }} />
                    {status.label}
                  </span>
                ))}
                {GOOGLE_EVENT_CATEGORY_ORDER.map((categoryKey) => {
                  const category = GOOGLE_EVENT_CATEGORIES[categoryKey];

                  return (
                    <span
                      key={categoryKey}
                      className="inline-flex items-center gap-1.5 rounded-full border bg-white px-2.5 py-1.5 shadow-sm"
                      style={{ borderColor: category.borderColor, color: category.textColor }}
                    >
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: category.color }} />
                      {category.label}
                    </span>
                  );
                })}
              </div>

              <div className="mt-5 md:mt-6">
                <div className="min-w-0">
                  {calendarView === 'month' && (
                    <div className="grid grid-cols-7 gap-2 text-center md:gap-3">
                      {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day) => (
                        <span key={day} className="rounded-xl bg-[#fff8f1] py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#ff5a1f] md:py-2.5 md:text-xs">
                          {day}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className={`mt-3 grid gap-2 md:mt-4 md:gap-3 ${calendarView === 'day' ? 'grid-cols-1' : 'grid-cols-7'}`}>
                    {calendarDays.map(renderCalendarDay)}
                  </div>
                </div>
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
                {selectedHoliday && (
                  <span
                    className="mt-3 inline-flex items-center gap-2 rounded-full border border-violet-100 bg-violet-50 px-3 py-1.5 text-xs font-black text-violet-700"
                    style={{ color: HOLIDAY_COLOR }}
                  >
                    <Landmark size={14} />
                    {selectedHoliday.name}
                  </span>
                )}
              </div>
              <span className="rounded-full border border-orange-200 bg-[#fff8f1] px-4 py-2 text-sm font-black text-[#ff5a1f]">
                {selectedActivities.length} actividades · {selectedTrips.length} viajes
              </span>
            </div>

            <div className="p-6">
              {selectedTrips.length > 0 && (
                <div className="mb-5 grid gap-3 lg:grid-cols-2">
                  {selectedTrips.map((trip) => (
                    <Link
                      key={trip.id}
                      to={`/dashboard/portal/${portalId}/team/trips`}
                      className="flex items-center gap-4 rounded-2xl border border-sky-200 bg-sky-50/70 p-4 transition hover:border-sky-300 hover:bg-sky-50"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-sky-600 shadow-sm">
                        <PlaneTakeoff size={19} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-black">{trip.title}</span>
                        <span className="mt-1 flex items-center gap-1 truncate text-sm font-semibold text-sky-700">
                          <MapPin size={13} /> {trip.destination} · {getUserLabel(trip.assignedTo)}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              )}
              {isLoading ? (
                <div className="flex min-h-48 items-center justify-center text-[#ff5a1f]">
                  <Loader2 className="animate-spin" />
                </div>
               ) : selectedActivities.length === 0 && selectedGoogleEvents.length === 0 ? (
                <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-orange-200 bg-[#fffaf5] text-center">
                  <UserRound size={32} className="text-[#ff5a1f]" />
                  <h3 className="mt-4 text-xl font-black">Aun no hay actividad este dia</h3>
                  <p className="mt-2 text-sm text-[#ff5a1f]">
                    Guarda una tarea para que el equipo sepa en que estas trabajando.
                  </p>
                </div>
               ) : (
                 <div className="grid gap-4 lg:grid-cols-2">
                   {selectedGoogleEvents.map((event) => {
                     const category = getGoogleEventMeta(event);

                     return (
                     <motion.article
                       key={event.id}
                       layout
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       className="rounded-2xl border p-5 shadow-sm"
                       style={{ borderColor: category.borderColor, backgroundColor: category.softColor }}
                     >
                       <div className="flex items-start gap-3">
                         <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white shadow-sm" style={{ color: category.color }}>
                           <CalendarDays size={19} />
                         </span>
                         <div className="min-w-0">
                           <p className="text-sm font-black" style={{ color: category.textColor }}>
                             Google Calendar · {category.label}
                           </p>
                           <h3 className="mt-1 text-xl font-black">{event.title}</h3>
                         </div>
                       </div>
                       <div className="mt-4 flex flex-wrap items-center gap-3">
                       <span className="inline-flex rounded-full border bg-white px-3 py-1 text-xs font-black shadow-sm" style={{ borderColor: category.borderColor, color: category.textColor }}>
                         {event.timeLabel || 'Todo el día'}
                       </span>
                       {event.googleUrl && (
                         <a
                           href={event.googleUrl}
                           target="_blank"
                           rel="noreferrer"
                           className="inline-flex rounded-full border bg-white px-3 py-1.5 text-sm font-black shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                           style={{ borderColor: category.borderColor, color: category.textColor }}
                         >
                           Abrir en Google Calendar
                         </a>
                       )}
                       </div>
                       {event.description && (
                         <GoogleEventDescription description={event.description} category={category} />
                       )}
                     </motion.article>
                     );
                   })}
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
                                    backgroundColor: getPersonColorForUser(
                                      activity.assignedTo || activity.createdBy || currentUser
                                    ),
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

                          {renderActivityComments(activity)}
                        </motion.article>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </section>
        </motion.main>

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

        <AnimatePresence>
          {commentDeleteTarget && (
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
                      Eliminar comentario
                    </p>
                    <h3 className="mt-2 text-2xl font-black text-[#3b1208]">
                      Quitar actualizacion
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-[#ff5a1f]">
                      Esta nota dejara de aparecer en la tarea. La accion no se puede deshacer.
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-[#ffd9b8] bg-[#fffaf5] p-4 text-sm leading-6 text-[#5a2014]">
                  {commentDeleteTarget.message}
                </div>

                <div className="mt-7 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCommentDeleteTarget(null)}
                    className="cursor-pointer rounded-2xl border border-orange-200 bg-white px-5 py-3 text-sm font-black text-[#8b2f12] transition hover:bg-orange-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDeleteComment}
                    disabled={commentSavingId === commentDeleteTarget.activityId}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-gradient-to-r from-[#ff5a00] to-[#ff3048] px-5 py-3 text-sm font-black text-white shadow-lg shadow-rose-100 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {commentSavingId === commentDeleteTarget.activityId && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Eliminar comentario
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
