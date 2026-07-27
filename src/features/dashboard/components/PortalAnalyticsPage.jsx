import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BarChart3,
  BriefcaseBusiness,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Filter,
  Gauge,
  LayoutDashboard,
  LineChart,
  Loader2,
  PieChart as PieChartIcon,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Settings2,
  Users,
  X,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import PortalSidebar from './PortalSidebar.jsx';
import {
  getOpportunityWorkbook,
  getOpportunityWorkbooks,
} from '../services/opportunityWorkbookService.js';
import { getPortalProposals } from '../services/proposalService.js';
import { getPortalMembers } from '../services/portalService.js';
import { getTeamActivities } from '../services/teamActivityService.js';
import { getTeamVacations } from '../services/teamVacationService.js';

const COLORS = ['#ff5a1f', '#ff3f6c', '#f59e0b', '#10b981', '#0ea5e9', '#8b5cf6'];
const DEFAULT_WIDGETS = ['trend', 'programs', 'deadlines', 'alerts'];
const PERIODS = [
  { value: 30, label: '30 días' },
  { value: 90, label: '90 días' },
  { value: 365, label: '1 año' },
];

const WIDGET_CATALOG = {
  trend: { title: 'Evolución de propuestas', description: 'Altas registradas durante los últimos seis meses.', icon: LineChart, size: 'wide' },
  programs: { title: 'Presupuesto por programa', description: 'Volumen económico acumulado por programa.', icon: CircleDollarSign, size: 'standard' },
  deadlines: { title: 'Próximos deadlines', description: 'Fechas que requieren atención inmediata.', icon: CalendarClock, size: 'standard' },
  alerts: { title: 'Alertas operativas', description: 'Bloqueos, asignaciones y fechas críticas.', icon: AlertTriangle, size: 'standard' },
};

const DATA_SOURCE_OPTIONS = [
  { value: 'opportunities', label: 'Oportunidades' },
  { value: 'proposals', label: 'Propuestas' },
  { value: 'activities', label: 'Actividad del equipo' },
  { value: 'vacations', label: 'Vacaciones' },
];

const AGGREGATION_OPTIONS = [
  { value: 'count', label: 'Contar registros' },
  { value: 'sum', label: 'Sumar resultado' },
  { value: 'average', label: 'Calcular media' },
];

const CALCULATION_OPTIONS = [
  { value: 'sum', label: 'Sumar campos', symbol: '+' },
  { value: 'subtract', label: 'Restar campos', symbol: '−' },
  { value: 'average', label: 'Media de campos', symbol: 'x̄' },
  { value: 'multiply', label: 'Multiplicar campos', symbol: '×' },
];

const CHART_TYPES = [
  { value: 'bar', label: 'Barras', icon: BarChart3 },
  { value: 'horizontalBar', label: 'Barras horizontales', icon: Gauge },
  { value: 'line', label: 'Líneas', icon: LineChart },
  { value: 'area', label: 'Área', icon: Activity },
  { value: 'donut', label: 'Donut', icon: PieChartIcon },
  { value: 'regression', label: 'Regresión lineal', icon: LineChart },
];

const unwrapProposals = (response) => response?.data?.items || response?.data || [];
const unwrapItems = (response, key) => response?.data || response?.[key] || response || [];
const getUserId = (user) => String(user?._id || user?.id || user || '');
const getUserName = (user) => user?.username || user?.name || user?.email || 'Sin asignar';
const formatNumber = (value) => new Intl.NumberFormat('es-ES').format(value || 0);
const formatCurrency = (value) => new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
  notation: value >= 1000000 ? 'compact' : 'standard',
}).format(value || 0);

const toDateInput = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getAllPortalProposals = async (portalId) => {
  const first = await getPortalProposals(portalId, { page: 1, limit: 100 });
  const items = unwrapProposals(first);
  const totalPages = Number(first?.data?.pagination?.totalPages || 1);
  if (totalPages <= 1) return { data: items };
  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      getPortalProposals(portalId, { page: index + 2, limit: 100 })
    )
  );
  return { data: [...items, ...rest.flatMap(unwrapProposals)] };
};

const getAllOpportunityData = async (portalId) => {
  const workbookResponse = await getOpportunityWorkbooks(portalId, { category: 'opportunities' });
  const workbooks = workbookResponse?.data || [];
  const workbookResults = await Promise.allSettled(workbooks.map(async (workbook) => {
    const first = await getOpportunityWorkbook({
      portalId,
      workbookId: workbook._id,
      params: { page: 1, limit: 200, category: 'opportunities' },
    });
    const firstRows = first?.data?.rows || [];
    const totalPages = Number(first?.data?.pagination?.totalPages || 1);
    const rest = totalPages > 1
      ? await Promise.all(Array.from({ length: totalPages - 1 }, (_, index) =>
          getOpportunityWorkbook({
            portalId,
            workbookId: workbook._id,
            params: { page: index + 2, limit: 200, category: 'opportunities' },
          })
        ))
      : [];
    const headers = first?.data?.workbook?.headers || workbook.headers || [];
    return [firstRows, ...rest.flatMap((response) => response?.data?.rows || [])].map((row) =>
      Object.fromEntries(headers.map((header, index) => [
        header || `Columna ${index + 1}`,
        row.values?.[index],
      ]))
    );
  }));
  return {
    data: workbooks,
    rows: workbookResults.flatMap((result) => result.status === 'fulfilled' ? result.value : []),
  };
};

const isPresented = (proposal) => {
  const value = `${proposal.estado || ''} ${proposal.lifecycleStatus || ''}`.toLowerCase();
  return ['enviad', 'presentad', 'aprobad', 'concedid', 'sent'].some((term) => value.includes(term));
};

const HUMANIZED_COLUMNS = {
  nombre: 'Nombre',
  acronimo: 'Acrónimo',
  programa: 'Programa',
  convocatoria: 'Convocatoria',
  tipo: 'Tipo',
  fase: 'Fase',
  estado: 'Estado',
  prioridad: 'Prioridad',
  responsableName: 'Responsable',
  presupuestoTotal: 'Presupuesto total',
  presupuestoEvenor: 'Presupuesto Evenor',
  probabilidad: 'Probabilidad',
  valorEsperado: 'Valor esperado',
  pagosRecibidosVinculados: 'Pagos recibidos',
  balancePendiente: 'Balance pendiente',
  workDate: 'Fecha de inicio',
  endDate: 'Fecha final',
  status: 'Estado',
  priority: 'Prioridad',
  title: 'Tarea',
  color: 'Color',
  startDate: 'Fecha de inicio',
};

const humanizeColumn = (key) => HUMANIZED_COLUMNS[key] || String(key)
  .replace(/([a-z])([A-Z])/g, '$1 $2')
  .replace(/^./, (letter) => letter.toUpperCase());

const getCellValue = (row, column) => {
  const value = row?.[column];
  if (value && typeof value === 'object') return getUserName(value);
  return value;
};

const toNumericValue = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
  const normalized = String(value ?? '').trim().replace(/[€$£%\s]/g, '');
  if (!normalized) return NaN;
  const decimalNormalized = normalized.includes(',') && normalized.includes('.')
    ? normalized.replace(/\./g, '').replace(',', '.')
    : normalized.replace(',', '.');
  const parsed = Number(decimalNormalized);
  return Number.isFinite(parsed) ? parsed : NaN;
};

const inferColumns = (rows) => {
  const blocked = new Set(['_id', 'id', '__v', 'portal', 'createdBy', 'author', 'comments', 'updatedAt']);
  const keys = [...new Set(rows.flatMap((row) => Object.keys(row || {})))].filter((key) => !blocked.has(key));
  return keys.map((key) => {
    const values = rows.map((row) => getCellValue(row, key)).filter((value) => value !== null && value !== undefined && value !== '');
    const numeric = values.length > 0 && values.every((value) => Number.isFinite(toNumericValue(value)));
    const date = !numeric && values.length > 0 && values.every((value) =>
      /date|fecha|deadline/i.test(key) || (!Number.isNaN(Date.parse(value)) && String(value).includes('-'))
    );
    return { value: key, label: humanizeColumn(key), type: numeric ? 'number' : date ? 'date' : 'text' };
  }).filter((column) => column.type !== 'text' || rows.some((row) => {
    const value = getCellValue(row, column.value);
    return typeof value !== 'object';
  }));
};

const linearRegression = (points) => {
  if (points.length < 2) return [];
  const count = points.length;
  const sumX = points.reduce((sum, point) => sum + point.x, 0);
  const sumY = points.reduce((sum, point) => sum + point.y, 0);
  const sumXY = points.reduce((sum, point) => sum + point.x * point.y, 0);
  const sumXX = points.reduce((sum, point) => sum + point.x * point.x, 0);
  const denominator = count * sumXX - sumX * sumX;
  const slope = denominator ? (count * sumXY - sumX * sumY) / denominator : 0;
  const intercept = (sumY - slope * sumX) / count;
  return [...points]
    .sort((first, second) => first.x - second.x)
    .map((point) => ({ ...point, regression: slope * point.x + intercept }));
};

const calculateMeasure = (row, columns, calculation) => {
  const values = columns
    .map((column) => toNumericValue(getCellValue(row, column)))
    .filter(Number.isFinite);
  if (!values.length) return NaN;
  if (calculation === 'subtract') return values.slice(1).reduce((result, value) => result - value, values[0]);
  if (calculation === 'multiply') return values.reduce((result, value) => result * value, 1);
  if (calculation === 'average') return values.reduce((sum, value) => sum + value, 0) / values.length;
  return values.reduce((sum, value) => sum + value, 0);
};

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-orange-100 bg-white px-3 py-2 text-xs shadow-lg">
      {label && <p className="mb-1 font-bold text-[#8b2f12]">{label}</p>}
      {payload.map((item) => (
        <p key={item.dataKey || item.name} className="font-black" style={{ color: item.color || item.payload?.fill }}>
          {item.name}: {formatNumber(item.value)}
        </p>
      ))}
    </div>
  );
};

const Metric = ({ icon: Icon, label, value, detail, color }) => (
  <article className="min-w-0 border-r border-orange-100 px-3 last:border-0 sm:px-5">
    <div className="flex items-center gap-2 text-xs font-black uppercase text-[#9b3f22]">
      <Icon size={15} style={{ color }} />
      <span className="truncate">{label}</span>
    </div>
    <p className="mt-3 truncate text-2xl font-black text-[#3b1208] sm:text-3xl">{value}</p>
    <p className="mt-1 truncate text-xs text-[#bd5a39]">{detail}</p>
  </article>
);

const WidgetFrame = ({ id, widget, editMode, index, total, onRemove, onMove, children }) => {
  const Icon = widget.icon;
  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className={`min-w-0 overflow-hidden rounded-2xl border bg-white shadow-sm ${
        editMode ? 'border-dashed border-orange-400 ring-4 ring-orange-50' : 'border-orange-100'
      } ${widget.size === 'wide' ? 'xl:col-span-2' : ''}`}
    >
      <header className="flex min-h-20 items-start justify-between gap-3 border-b border-orange-100 px-4 py-4 sm:px-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-50 text-[#ff5a1f]">
            <Icon size={19} />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-base font-black text-[#3b1208] sm:text-lg">{widget.title}</h2>
            <p className="mt-0.5 truncate text-xs text-[#bd5a39]">{widget.description}</p>
          </div>
        </div>
        {editMode && (
          <div className="flex shrink-0 gap-1">
            <button type="button" onClick={() => onMove(index, -1)} disabled={index === 0} className="grid h-8 w-8 place-items-center rounded-lg text-orange-600 hover:bg-orange-50 disabled:opacity-25" title="Mover antes"><ArrowUp size={15} /></button>
            <button type="button" onClick={() => onMove(index, 1)} disabled={index === total - 1} className="grid h-8 w-8 place-items-center rounded-lg text-orange-600 hover:bg-orange-50 disabled:opacity-25" title="Mover después"><ArrowDown size={15} /></button>
            <button type="button" onClick={() => onRemove(id)} className="grid h-8 w-8 place-items-center rounded-lg text-red-500 hover:bg-red-50" title="Quitar gráfica"><X size={16} /></button>
          </div>
        )}
      </header>
      <div className="h-[300px] p-4 sm:p-5">{children}</div>
    </motion.section>
  );
};

const EmptyChart = ({ children }) => (
  <div className="grid h-full place-items-center text-center text-sm text-[#bd5a39]">
    <div><BarChart3 className="mx-auto mb-3 text-orange-200" size={30} /><p>{children}</p></div>
  </div>
);

const readDashboardConfig = (storageKey) => {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey));
    if (Array.isArray(stored)) {
      return {
        widgets: stored.filter((id) => WIDGET_CATALOG[id]),
        customCharts: {},
      };
    }
    const customCharts = stored?.customCharts && typeof stored.customCharts === 'object'
      ? Object.fromEntries(Object.entries(stored.customCharts).filter(([, chart]) => chart?.source))
      : {};
    const widgets = Array.isArray(stored?.widgets)
      ? stored.widgets.filter((id) => WIDGET_CATALOG[id] || customCharts[id])
      : DEFAULT_WIDGETS;
    return { widgets: widgets.length ? widgets : DEFAULT_WIDGETS, customCharts };
  } catch {
    return { widgets: DEFAULT_WIDGETS, customCharts: {} };
  }
};

const PortalAnalyticsPage = () => {
  const { portalId } = useParams();
  const storageKey = `gestiona2:analytics-widgets:${portalId}`;
  const initialConfig = useMemo(() => readDashboardConfig(storageKey), [storageKey]);
  const [period, setPeriod] = useState(90);
  const [program, setProgram] = useState('all');
  const [widgets, setWidgets] = useState(initialConfig.widgets);
  const [customCharts, setCustomCharts] = useState(initialConfig.customCharts);
  const [isEditing, setIsEditing] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [fieldSearch, setFieldSearch] = useState('');
  const [builder, setBuilder] = useState({
    title: '',
    source: 'proposals',
    dimension: 'estado',
    aggregation: 'count',
    valueColumn: 'presupuestoTotal',
    measureColumns: ['presupuestoTotal'],
    calculation: 'sum',
    xColumn: 'presupuestoTotal',
    chartType: 'bar',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [warnings, setWarnings] = useState([]);
  const [data, setData] = useState({
    proposals: [],
    workbooks: [],
    opportunityRows: [],
    members: [],
    activities: [],
    vacations: [],
  });

  const range = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - period);
    return { startDate: toDateInput(start), endDate: toDateInput(end) };
  }, [period]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({ widgets, customCharts }));
  }, [customCharts, storageKey, widgets]);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      getAllPortalProposals(portalId),
      getAllOpportunityData(portalId),
      getPortalMembers(portalId),
      getTeamActivities({ portalId, ...range }),
      getTeamVacations({ portalId, ...range }),
    ]).then((results) => {
      if (!active) return;
      const failed = [];
      const read = (index, fallback, label) => {
        if (results[index].status === 'fulfilled') return results[index].value;
        failed.push(label);
        return fallback;
      };
      const proposals = read(0, {}, 'propuestas');
      const workbooks = read(1, {}, 'oportunidades');
      const members = read(2, {}, 'equipo');
      const activities = read(3, [], 'actividad');
      const vacations = read(4, [], 'vacaciones');
      setData({
        proposals: unwrapProposals(proposals),
        workbooks: workbooks?.data || [],
        opportunityRows: workbooks?.rows || [],
        members: members?.data || [],
        activities: unwrapItems(activities, 'activities'),
        vacations: unwrapItems(vacations, 'vacations'),
      });
      setWarnings(failed);
      setIsLoading(false);
    });
    return () => { active = false; };
  }, [portalId, range, reloadKey]);

  const programs = useMemo(
    () => [...new Set(data.proposals.map((item) => item.programa).filter(Boolean))].sort(),
    [data.proposals]
  );
  const proposals = useMemo(
    () => program === 'all' ? data.proposals : data.proposals.filter((item) => item.programa === program),
    [data.proposals, program]
  );
  const rowsBySource = useMemo(() => ({
    opportunities: data.opportunityRows,
    proposals,
    activities: data.activities,
    vacations: data.vacations,
  }), [data.activities, data.opportunityRows, data.vacations, proposals]);
  const columnsBySource = useMemo(() => Object.fromEntries(
    Object.entries(rowsBySource).map(([source, rows]) => [source, inferColumns(rows)])
  ), [rowsBySource]);
  const builderColumns = columnsBySource[builder.source] || [];
  const builderNumericColumns = builderColumns.filter((column) => column.type === 'number');
  const visibleBuilderColumns = builderColumns.filter((column) =>
    column.label.toLowerCase().includes(fieldSearch.trim().toLowerCase())
  );
  const dimensionColumn = builderColumns.find((column) => column.value === builder.dimension);
  const recommendedChartTypes = dimensionColumn?.type === 'date'
    ? ['line', 'area']
    : builder.measureColumns.length
      ? ['bar', 'horizontalBar']
      : ['bar', 'donut'];
  const canCreateChart = builder.chartType === 'regression'
    ? Boolean(builder.xColumn && builder.measureColumns.length >= 2)
    : Boolean(builder.dimension && (builder.aggregation === 'count' || builder.measureColumns.length >= 2));

  const analytics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextMonth = new Date(today);
    nextMonth.setDate(today.getDate() + 30);
    const opportunities = data.workbooks.reduce((total, item) => total + Number(item.rowCount || 0), 0);
    const presented = proposals.filter(isPresented).length;
    const projects = proposals.filter((item) => item.proyectoEjecucionVinculado).length;
    const completed = data.activities.filter((item) => item.status === 'done').length;
    const budget = proposals.reduce((total, item) => total + Number(item.presupuestoTotal || 0), 0);

    const statusMap = proposals.reduce((result, item) => {
      const label = String(item.estado || 'Sin estado').trim();
      result[label] = (result[label] || 0) + 1;
      return result;
    }, {});
    const status = Object.entries(statusMap).map(([name, value], index) => ({
      name, value, fill: COLORS[index % COLORS.length],
    })).sort((a, b) => b.value - a.value);

    const countBy = (items, getLabel) => Object.entries(items.reduce((result, item) => {
      const name = String(getLabel(item) || 'Sin definir').trim();
      result[name] = (result[name] || 0) + 1;
      return result;
    }, {})).map(([name, value], index) => ({ name, value, fill: COLORS[index % COLORS.length] }))
      .sort((a, b) => b.value - a.value);

    const workloadMap = new Map(data.members.map((member) => {
      const person = member.user || member;
      return [getUserId(person), { name: getUserName(person), tareas: 0, fill: member.color || '#ff5a1f' }];
    }));
    data.activities.forEach((item) => {
      const person = item.assignedTo || item.author;
      const id = getUserId(person);
      const current = workloadMap.get(id) || { name: getUserName(person), tareas: 0, fill: item.color || '#ff5a1f' };
      current.tareas += 1;
      workloadMap.set(id, current);
    });
    const workload = [...workloadMap.values()].sort((a, b) => b.tareas - a.tareas).slice(0, 7);

    const programMap = proposals.reduce((result, item) => {
      const name = item.programa || 'Sin programa';
      result[name] = (result[name] || 0) + Number(item.presupuestoTotal || 0);
      return result;
    }, {});
    const programBudget = Object.entries(programMap).map(([name, presupuesto]) => ({ name, presupuesto }))
      .sort((a, b) => b.presupuesto - a.presupuesto).slice(0, 6);

    const monthFormatter = new Intl.DateTimeFormat('es-ES', { month: 'short' });
    const trend = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(today.getFullYear(), today.getMonth() - 5 + index, 1);
      return { date, name: monthFormatter.format(date).replace('.', ''), propuestas: 0 };
    });
    proposals.forEach((item) => {
      const created = new Date(item.createdAt);
      const bucket = trend.find(({ date }) => date.getMonth() === created.getMonth() && date.getFullYear() === created.getFullYear());
      if (bucket) bucket.propuestas += 1;
    });

    const deadlines = proposals.filter((item) => item.deadlineApertura)
      .map((item) => ({ ...item, deadline: new Date(item.deadlineApertura) }))
      .filter((item) => item.deadline >= today)
      .sort((a, b) => a.deadline - b.deadline).slice(0, 5);

    return {
      opportunities, presented, projects, budget,
      completion: data.activities.length ? Math.round((completed / data.activities.length) * 100) : 0,
      status,
      proposalPriority: countBy(proposals, (item) => item.prioridad),
      proposalProgram: countBy(proposals, (item) => item.programa),
      taskStatus: countBy(data.activities, (item) => ({
        planned: 'Planificada',
        in_progress: 'En curso',
        blocked: 'Bloqueada',
        done: 'Terminada',
      })[item.status] || item.status),
      workload,
      programBudget,
      trend,
      deadlines,
      alerts: [
        { label: 'Deadlines en 30 días', value: deadlines.filter((item) => item.deadline <= nextMonth).length, icon: CalendarClock },
        { label: 'Tareas bloqueadas', value: data.activities.filter((item) => item.status === 'blocked').length, icon: AlertTriangle },
        { label: 'Propuestas sin responsable', value: proposals.filter((item) => !item.responsable && !item.responsableName).length, icon: Users },
      ],
    };
  }, [data, proposals]);

  const removeWidget = (id) => {
    setWidgets((current) => current.filter((item) => item !== id));
    if (customCharts[id]) {
      setCustomCharts((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
    }
  };
  const addWidget = (id) => setWidgets((current) => current.includes(id) ? current : [...current, id]);
  const moveWidget = (index, direction) => setWidgets((current) => {
    const target = index + direction;
    if (target < 0 || target >= current.length) return current;
    const next = [...current];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  });

  const createCustomChart = () => {
    const id = `custom-${Date.now()}`;
    const sourceLabel = DATA_SOURCE_OPTIONS.find((item) => item.value === builder.source)?.label;
    const dimensionLabel = builderColumns.find((item) => item.value === builder.dimension)?.label;
    setCustomCharts((current) => ({
      ...current,
      [id]: {
        ...builder,
        title: builder.title.trim() || (
          builder.chartType === 'regression'
            ? `Relación entre ${humanizeColumn(builder.xColumn)} y medida calculada`
            : `${sourceLabel} por ${dimensionLabel}`
        ),
      },
    }));
    setWidgets((current) => [...current, id]);
    setBuilder((current) => ({ ...current, title: '' }));
    setIsCatalogOpen(false);
  };

  const getWidgetMeta = (id) => {
    if (WIDGET_CATALOG[id]) return WIDGET_CATALOG[id];
    const chart = customCharts[id];
    const type = CHART_TYPES.find((item) => item.value === chart?.chartType);
    const source = DATA_SOURCE_OPTIONS.find((item) => item.value === chart?.source);
    return {
      title: chart?.title || 'Gráfica personalizada',
      description: `${type?.label || 'Gráfica'} · ${source?.label || 'Datos del portal'}`,
      icon: type?.icon || BarChart3,
      size: ['horizontalBar', 'regression'].includes(chart?.chartType) ? 'wide' : 'standard',
    };
  };

  const getCustomDataset = (chart) => {
    const rows = rowsBySource[chart.source] || [];
    const measureColumns = chart.measureColumns?.length
      ? chart.measureColumns
      : chart.valueColumn
        ? [chart.valueColumn]
        : [];
    const groups = new Map();
    rows.forEach((row) => {
      const rawLabel = getCellValue(row, chart.dimension);
      const name = rawLabel instanceof Date
        ? rawLabel.toLocaleDateString('es-ES')
        : String(rawLabel || 'Sin definir');
      const numericValue = calculateMeasure(row, measureColumns, chart.calculation || 'sum');
      const current = groups.get(name) || { count: 0, sum: 0 };
      current.count += 1;
      if (Number.isFinite(numericValue)) current.sum += numericValue;
      groups.set(name, current);
    });
    return [...groups.entries()]
      .map(([name, values], index) => ({
        name,
        value: chart.aggregation === 'sum'
          ? values.sum
          : chart.aggregation === 'average'
            ? values.sum / values.count
            : values.count,
        fill: COLORS[index % COLORS.length],
      }))
      .sort((first, second) => second.value - first.value);
  };

  const renderCustomChart = (chart) => {
    if (chart.chartType === 'regression') {
      const measureColumns = chart.measureColumns?.length
        ? chart.measureColumns
        : chart.yColumn
          ? [chart.yColumn]
          : chart.valueColumn
            ? [chart.valueColumn]
            : [];
      const points = (rowsBySource[chart.source] || [])
        .map((row) => ({
          x: toNumericValue(getCellValue(row, chart.xColumn)),
          y: calculateMeasure(row, measureColumns, chart.calculation || 'sum'),
        }))
        .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
      const regressionData = linearRegression(points);
      if (regressionData.length < 2) {
        return <EmptyChart>Se necesitan al menos dos filas con valores numéricos en ambas columnas.</EmptyChart>;
      }
      return (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={regressionData} margin={{ top: 12, right: 18, left: 0, bottom: 12 }}>
            <CartesianGrid stroke="#ffedd5" strokeDasharray="3 3" />
            <XAxis type="number" dataKey="x" name={humanizeColumn(chart.xColumn)} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9b3f22' }} />
            <YAxis type="number" dataKey="y" name={chart.title || 'Medida calculada'} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9b3f22' }} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<ChartTooltip />} />
            <Scatter dataKey="y" name="Datos" fill="#ff5a1f" />
            <Line type="linear" dataKey="regression" name="Tendencia lineal" stroke="#0ea5e9" strokeWidth={3} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      );
    }

    const chartData = getCustomDataset(chart);
    if (!chartData.some((item) => item.value > 0)) {
      return <EmptyChart>No hay datos disponibles para esta combinación.</EmptyChart>;
    }

    if (chart.chartType === 'donut') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" innerRadius="46%" outerRadius="75%" paddingAngle={3}>
              {chartData.map((item, index) => <Cell key={item.name} fill={item.fill || COLORS[index % COLORS.length]} />)}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    if (chart.chartType === 'horizontalBar') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData.slice(0, 8)} layout="vertical" margin={{ top: 0, right: 18, left: 28, bottom: 0 }}>
            <CartesianGrid stroke="#ffedd5" strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9b3f22' }} />
            <YAxis type="category" dataKey="name" width={94} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#4b1406' }} />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="value" name="Total" radius={[0, 6, 6, 0]}>
              {chartData.map((item, index) => <Cell key={item.name} fill={item.fill || COLORS[index % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (chart.chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLineChart data={chartData.slice(0, 10)} margin={{ top: 10, right: 12, left: -18, bottom: 20 }}>
            <CartesianGrid stroke="#ffedd5" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9b3f22' }} angle={-15} textAnchor="end" />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9b3f22' }} />
            <Tooltip content={<ChartTooltip />} />
            <Line type="monotone" dataKey="value" name="Total" stroke="#ff5a1f" strokeWidth={3} dot={{ fill: '#ff3f6c', r: 4 }} />
          </RechartsLineChart>
        </ResponsiveContainer>
      );
    }

    if (chart.chartType === 'area') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData.slice(0, 10)} margin={{ top: 10, right: 12, left: -18, bottom: 20 }}>
            <defs><linearGradient id={`customArea-${chart.source}-${chart.dimension}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff5a1f" stopOpacity={0.36} /><stop offset="100%" stopColor="#ff5a1f" stopOpacity={0.03} /></linearGradient></defs>
            <CartesianGrid stroke="#ffedd5" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9b3f22' }} angle={-15} textAnchor="end" />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9b3f22' }} />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="value" name="Total" stroke="#ff5a1f" strokeWidth={3} fill={`url(#customArea-${chart.source}-${chart.dimension})`} />
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData.slice(0, 10)} margin={{ top: 10, right: 10, left: -18, bottom: 20 }}>
          <CartesianGrid stroke="#ffedd5" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9b3f22' }} angle={-15} textAnchor="end" />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9b3f22' }} />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="value" name="Total" radius={[6, 6, 0, 0]}>
            {chartData.map((item, index) => <Cell key={item.name} fill={item.fill || COLORS[index % COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderWidget = (id) => {
    if (customCharts[id]) return renderCustomChart(customCharts[id]);
    if (id === 'trend') return analytics.trend.some((item) => item.propuestas) ? (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={analytics.trend} margin={{ top: 12, right: 10, left: -24, bottom: 0 }}>
          <defs><linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff5a1f" stopOpacity={0.35} /><stop offset="100%" stopColor="#ff5a1f" stopOpacity={0.02} /></linearGradient></defs>
          <CartesianGrid stroke="#ffedd5" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9b3f22', fontSize: 11 }} />
          <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#9b3f22', fontSize: 11 }} />
          <Tooltip content={<ChartTooltip />} />
          <Area type="monotone" dataKey="propuestas" name="Propuestas" stroke="#ff5a1f" strokeWidth={3} fill="url(#trendFill)" activeDot={{ r: 5, fill: '#ff3f6c' }} />
        </AreaChart>
      </ResponsiveContainer>
    ) : <EmptyChart>No hay propuestas creadas en los últimos seis meses.</EmptyChart>;

    if (id === 'programs') return analytics.programBudget.some((item) => item.presupuesto) ? (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={analytics.programBudget} margin={{ top: 8, right: 5, left: -10, bottom: 16 }}>
          <CartesianGrid stroke="#ffedd5" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9b3f22' }} interval={0} angle={-15} textAnchor="end" />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9b3f22' }} tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
          <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ border: '1px solid #ffedd5', borderRadius: 8 }} />
          <Bar dataKey="presupuesto" name="Presupuesto" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    ) : <EmptyChart>Añade presupuestos para analizar los programas.</EmptyChart>;

    if (id === 'deadlines') return (
      <div className="h-full overflow-y-auto">
        {analytics.deadlines.length ? analytics.deadlines.map((item) => (
          <Link key={item._id || item.id} to={`/dashboard/portal/${portalId}/proposals/${item._id || item.id}/edit`} className="grid grid-cols-[62px_1fr_auto] items-center gap-3 border-b border-orange-100 py-3 last:border-0 hover:bg-orange-50/60">
            <span className="text-xs font-black uppercase text-[#ff5a1f]">{new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' }).format(item.deadline)}</span>
            <span className="truncate text-sm font-black">{item.acronimo || item.nombre}</span>
            <ArrowRight size={15} className="text-orange-400" />
          </Link>
        )) : <EmptyChart>No hay próximos deadlines registrados.</EmptyChart>}
      </div>
    );

    return (
      <div className="space-y-3">
        {analytics.alerts.map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-center gap-3 border-b border-orange-100 py-3">
            <span className={`grid h-10 w-10 place-items-center rounded-xl ${value ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}><Icon size={18} /></span>
            <span className="min-w-0 flex-1 text-sm font-bold">{label}</span>
            <span className="text-xl font-black">{value}</span>
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) return (
    <PortalSidebar><main className="grid min-h-screen place-items-center bg-[#fafafa] text-[#ff5a1f]"><div className="text-center"><Loader2 className="mx-auto animate-spin" size={32} /><p className="mt-3 text-sm font-bold">Preparando tu dashboard...</p></div></main></PortalSidebar>
  );

  return (
    <PortalSidebar>
      <main className="min-h-screen bg-[#f8f8f8] px-3 py-5 text-[#3b1208] [&_button:not(:disabled)]:cursor-pointer [&_button:disabled]:cursor-not-allowed [&_select]:cursor-pointer md:px-7 md:py-7">
        <div className="mx-auto max-w-[1680px]">
          <header className="rounded-2xl border border-orange-100 bg-white px-4 py-5 shadow-sm md:px-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="flex items-center gap-2 text-xs font-black uppercase text-[#ff3f6c]"><LayoutDashboard size={16} /> Centro de análisis</p>
                <h1 className="mt-2 font-display text-3xl text-[#4b1406] md:text-4xl">Dashboard del portal</h1>
                <p className="mt-2 text-sm text-[#bd4b27]">Indicadores clave, capacidad del equipo y evolución de la cartera.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="relative min-w-[180px] flex-1 sm:flex-none">
                  <Filter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-orange-500" size={15} />
                  <select value={program} onChange={(event) => setProgram(event.target.value)} className="h-10 w-full appearance-none rounded-lg border border-orange-200 bg-white pl-9 pr-8 text-xs font-bold outline-none focus:ring-4 focus:ring-orange-100">
                    <option value="all">Todos los programas</option>
                    {programs.map((item) => <option key={item}>{item}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-orange-500" size={15} />
                </label>
                <label className="relative">
                  <select value={period} onChange={(event) => setPeriod(Number(event.target.value))} className="h-10 appearance-none rounded-lg border border-orange-200 bg-white pl-3 pr-8 text-xs font-bold outline-none focus:ring-4 focus:ring-orange-100">
                    {PERIODS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-orange-500" size={15} />
                </label>
                <button type="button" onClick={() => setReloadKey((value) => value + 1)} className="grid h-10 w-10 place-items-center rounded-lg border border-orange-200 bg-white text-orange-600 hover:bg-orange-50" title="Actualizar"><RefreshCw size={16} /></button>
                <button type="button" onClick={() => setIsEditing((value) => !value)} className={`inline-flex h-10 items-center gap-2 rounded-lg px-4 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 ${isEditing ? 'bg-[#4b1406] hover:bg-[#6b220d]' : 'bg-gradient-to-r from-[#ff5a1f] to-[#ff3048]'}`}>
                  {isEditing ? <Check size={16} /> : <Settings2 size={16} />}{isEditing ? 'Terminar' : 'Personalizar'}
                </button>
              </div>
            </div>
          </header>

          {warnings.length > 0 && <div className="mt-4 border-l-4 border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-900">No se pudieron actualizar: {warnings.join(', ')}.</div>}

          <section className="mt-4 grid grid-cols-2 gap-y-5 rounded-2xl border border-orange-100 bg-white py-5 shadow-sm lg:grid-cols-5">
            <Metric icon={BriefcaseBusiness} label="Oportunidades" value={formatNumber(analytics.opportunities)} detail="En el portal" color={COLORS[0]} />
            <Metric icon={BarChart3} label="Propuestas" value={formatNumber(proposals.length)} detail={program === 'all' ? 'Cartera total' : program} color={COLORS[1]} />
            <Metric icon={Gauge} label="Conversión" value={`${analytics.opportunities ? Math.round((proposals.length / analytics.opportunities) * 100) : 0}%`} detail="A propuesta" color={COLORS[2]} />
            <Metric icon={CheckCircle2} label="Tareas listas" value={`${analytics.completion}%`} detail={`${data.activities.length} tareas`} color={COLORS[3]} />
            <Metric icon={CircleDollarSign} label="Presupuesto" value={formatCurrency(analytics.budget)} detail="Volumen total" color={COLORS[4]} />
          </section>

          {isEditing && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-orange-300 bg-orange-50 px-4 py-3">
              <p className="text-sm font-bold text-[#8b2f12]">Añade, elimina o cambia el orden de tus gráficas.</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => { setWidgets(DEFAULT_WIDGETS); setCustomCharts({}); }} className="inline-flex h-9 items-center gap-2 rounded-lg border border-orange-200 bg-white px-3 text-xs font-black text-orange-700"><RotateCcw size={14} /> Restablecer</button>
                <button type="button" onClick={() => setIsCatalogOpen(true)} className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#ff5a1f] px-3 text-xs font-black text-white"><Plus size={15} /> Añadir gráfica</button>
              </div>
            </div>
          )}

          {widgets.length ? (
            <motion.div layout className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
              <AnimatePresence mode="popLayout">
                {widgets.map((id, index) => (
                  <WidgetFrame key={id} id={id} widget={getWidgetMeta(id)} editMode={isEditing} index={index} total={widgets.length} onRemove={removeWidget} onMove={moveWidget}>
                    {renderWidget(id)}
                  </WidgetFrame>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <section className="mt-4 grid min-h-80 place-items-center rounded-2xl border border-dashed border-orange-300 bg-white text-center">
              <div><LayoutDashboard className="mx-auto text-orange-300" size={38} /><h2 className="mt-4 text-xl font-black">Tu dashboard está vacío</h2><p className="mt-2 text-sm text-[#bd5a39]">Añade las gráficas que necesitas para empezar.</p><button type="button" onClick={() => setIsCatalogOpen(true)} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#ff5a1f] px-4 py-2.5 text-sm font-black text-white"><Plus size={16} /> Añadir gráfica</button></div>
            </section>
          )}
        </div>
      </main>

      <AnimatePresence>
        {isCatalogOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] grid place-items-center bg-orange-950/35 p-4 backdrop-blur-sm [&_button:not(:disabled)]:cursor-pointer [&_button:disabled]:cursor-not-allowed [&_select]:cursor-pointer" onClick={() => setIsCatalogOpen(false)}>
            <motion.section initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.98 }} className="flex max-h-[92vh] w-full max-w-[1400px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
              <header className="z-10 flex shrink-0 items-center justify-between border-b border-orange-100 bg-white px-5 py-4">
                <div><h2 className="text-xl font-black">Diseñar una gráfica</h2><p className="mt-1 text-xs text-[#bd5a39]">Selecciona campos, define el cálculo y revisa el resultado antes de añadirlo.</p></div>
                <button type="button" onClick={() => setIsCatalogOpen(false)} className="grid h-9 w-9 place-items-center rounded-lg bg-orange-50 text-orange-600"><X size={17} /></button>
              </header>
              <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[290px_minmax(0,1fr)] lg:overflow-hidden">
              <aside className="border-b border-orange-100 bg-white p-4 lg:overflow-y-auto lg:border-b-0 lg:border-r">
                <p className="px-1 text-[11px] font-black uppercase tracking-wide text-[#9b3f22]">1. Explorar datos</p>
                <label className="mt-3 block">
                  <span className="text-[11px] font-bold text-[#bd5a39]">Origen</span>
                  <div className="relative mt-1.5">
                    <select
                      value={builder.source}
                      onChange={(event) => {
                        const source = event.target.value;
                        const columns = columnsBySource[source] || [];
                        const numericColumns = columns.filter((column) => column.type === 'number');
                        setBuilder((current) => ({
                          ...current,
                          source,
                          dimension: columns[0]?.value || '',
                          valueColumn: numericColumns[0]?.value || '',
                          measureColumns: numericColumns[0]?.value ? [numericColumns[0].value] : [],
                          xColumn: numericColumns[0]?.value || '',
                        }));
                        setFieldSearch('');
                      }}
                      className="h-10 w-full appearance-none rounded-lg border border-orange-200 bg-white px-3 pr-9 text-xs font-black outline-none focus:ring-4 focus:ring-orange-100"
                    >
                      {DATA_SOURCE_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-orange-500" size={15} />
                  </div>
                </label>
                <label className="relative mt-3 block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-orange-400" size={14} />
                  <input
                    value={fieldSearch}
                    onChange={(event) => setFieldSearch(event.target.value)}
                    placeholder="Buscar una columna..."
                    className="h-9 w-full rounded-lg border border-orange-100 bg-[#fffaf5] pl-9 pr-3 text-xs outline-none focus:border-orange-300"
                  />
                </label>
                <div className="my-3 flex items-center justify-between px-1">
                  <span className="text-[11px] font-black uppercase text-[#9b3f22]">Campos</span>
                  <span className="text-[10px] font-bold text-[#bd5a39]">{visibleBuilderColumns.length} disponibles</span>
                </div>
                <div className="space-y-1.5">
                  {visibleBuilderColumns.map((column) => {
                    const selected = builder.dimension === column.value && builder.chartType !== 'regression';
                    const measureSelected = builder.measureColumns.includes(column.value);
                    return (
                      <div key={column.value} className={`flex items-center rounded-lg border transition ${
                        selected
                          ? 'border-orange-400 bg-orange-50 text-[#8b2f12]'
                          : 'border-transparent hover:border-orange-100 hover:bg-orange-50/60'
                      }`}>
                        <button
                          type="button"
                          onClick={() => setBuilder((current) => ({ ...current, dimension: column.value }))}
                          className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-left"
                        >
                          <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-md text-[10px] font-black uppercase ${
                            column.type === 'number'
                              ? 'bg-sky-50 text-sky-600'
                              : column.type === 'date'
                                ? 'bg-violet-50 text-violet-600'
                                : 'bg-orange-50 text-orange-600'
                          }`}>
                            {column.type === 'number' ? '123' : column.type === 'date' ? 'F' : 'Aa'}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-sm font-bold">{column.label}</span>
                          {selected && <Check size={15} className="shrink-0 text-orange-600" />}
                        </button>
                        {column.type === 'number' && (
                          <button
                            type="button"
                            onClick={() => setBuilder((current) => {
                              const exists = current.measureColumns.includes(column.value);
                              if (exists) {
                                return {
                                  ...current,
                                  measureColumns: current.measureColumns.filter((value) => value !== column.value),
                                };
                              }
                              if (current.measureColumns.length >= 4) return current;
                              return {
                                ...current,
                                measureColumns: [...current.measureColumns, column.value],
                              };
                            })}
                            className={`mr-2 grid h-7 w-7 shrink-0 place-items-center rounded-md border text-sm font-black ${
                              measureSelected
                                ? 'border-sky-500 bg-sky-500 text-white'
                                : 'border-sky-200 bg-white text-sky-600 hover:bg-sky-50'
                            }`}
                            title={measureSelected ? 'Quitar del cálculo' : 'Añadir al cálculo'}
                            aria-label={measureSelected ? `Quitar ${column.label} del cálculo` : `Añadir ${column.label} al cálculo`}
                          >
                            {measureSelected ? <Check size={14} /> : <Plus size={14} />}
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {!visibleBuilderColumns.length && (
                    <p className="rounded-lg bg-orange-50 px-3 py-4 text-center text-xs text-[#bd5a39]">
                      {builderColumns.length ? 'No hay columnas que coincidan con la búsqueda.' : 'Este origen todavía no contiene columnas con datos.'}
                    </p>
                  )}
                </div>
              </aside>
              <div className="bg-[#fffaf5] p-5 lg:overflow-y-auto lg:p-6">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-100 text-orange-600">
                    <Settings2 size={18} />
                  </span>
                  <div>
                    <h3 className="font-black">Crear gráfica personalizada</h3>
                    <p className="mt-0.5 text-xs text-[#bd5a39]">Combina el tipo de visualización con los datos que quieras analizar.</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-b border-orange-100 pb-4">
                  <span className="mr-1 text-[11px] font-black uppercase text-[#9b3f22]">Plantillas rápidas</span>
                  {Object.entries(WIDGET_CATALOG).map(([id, item]) => {
                    const Icon = item.icon;
                    const added = widgets.includes(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => addWidget(id)}
                        disabled={added}
                        className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-bold ${
                          added
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-orange-200 bg-white text-orange-700 hover:bg-orange-50'
                        }`}
                        title={item.title}
                      >
                        {added ? <Check size={13} /> : <Icon size={13} />}
                        {item.title}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label className="sm:col-span-2">
                    <span className="text-xs font-black uppercase text-[#8b2f12]">Nombre de la gráfica <span className="font-semibold normal-case text-[#bd5a39]">(opcional)</span></span>
                    <input
                      value={builder.title}
                      onChange={(event) => setBuilder((current) => ({ ...current, title: event.target.value }))}
                      placeholder="Ej. Estado de nuestra cartera"
                      maxLength={70}
                      className="mt-2 h-11 w-full rounded-xl border border-orange-200 bg-white px-4 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                    />
                  </label>
                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-black uppercase text-[#8b2f12]">3. Elegir visualización</span>
                      <span className="text-[10px] font-bold text-[#bd5a39]">Las opciones marcadas encajan mejor con tus campos</span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {CHART_TYPES.map((item) => {
                        const Icon = item.icon;
                        const active = builder.chartType === item.value;
                        const recommended = item.value === 'regression'
                          ? builder.measureColumns.length >= 2
                          : recommendedChartTypes.includes(item.value);
                        return (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => setBuilder((current) => ({ ...current, chartType: item.value }))}
                            className={`relative flex h-12 items-center gap-2 rounded-lg border px-3 text-left transition ${
                              active
                                ? 'border-orange-500 bg-orange-500 text-white'
                                : 'border-orange-200 bg-white text-orange-600 hover:bg-orange-50'
                            }`}
                            title={item.label}
                            aria-label={item.label}
                            aria-pressed={active}
                          >
                            <Icon size={17} />
                            <span className="min-w-0 truncate text-xs font-black">{item.label}</span>
                            {recommended && !active && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {builder.chartType === 'regression' ? (
                    <>
                      <label>
                        <span className="text-xs font-black uppercase text-[#8b2f12]">Columna X</span>
                        <div className="relative mt-2">
                          <select value={builder.xColumn} onChange={(event) => setBuilder((current) => ({ ...current, xColumn: event.target.value }))} className="h-11 w-full appearance-none rounded-xl border border-orange-200 bg-white px-4 pr-10 text-sm font-bold outline-none focus:ring-4 focus:ring-orange-100">
                            <option value="">Seleccionar columna numérica</option>
                            {builderNumericColumns.map((column) => <option key={column.value} value={column.value}>{column.label}</option>)}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-orange-500" size={16} />
                        </div>
                      </label>
                      <div>
                        <span className="text-xs font-black uppercase text-[#8b2f12]">Eje Y</span>
                        <div className="mt-2 flex h-11 items-center rounded-xl border border-orange-200 bg-white px-4 text-sm font-bold">
                          Medida calculada
                        </div>
                      </div>
                      {builderNumericColumns.length < 2 && (
                        <p className="sm:col-span-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
                          Este origen necesita al menos dos columnas numéricas con datos para calcular una regresión.
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <div>
                        <span className="text-xs font-black uppercase text-[#8b2f12]">2. Agrupar por</span>
                        <div className="mt-2 flex h-11 items-center gap-2 rounded-xl border border-orange-200 bg-white px-4 text-sm font-bold">
                          <span className="min-w-0 flex-1 truncate">
                            {builderColumns.find((column) => column.value === builder.dimension)?.label || 'Selecciona una columna a la izquierda'}
                          </span>
                          <Check size={16} className="shrink-0 text-emerald-500" />
                        </div>
                      </div>
                      <label>
                        <span className="text-xs font-black uppercase text-[#8b2f12]">Operación</span>
                        <div className="relative mt-2">
                          <select value={builder.aggregation} onChange={(event) => setBuilder((current) => ({ ...current, aggregation: event.target.value }))} className="h-11 w-full appearance-none rounded-xl border border-orange-200 bg-white px-4 pr-10 text-sm font-bold outline-none focus:ring-4 focus:ring-orange-100">
                            {AGGREGATION_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-orange-500" size={16} />
                        </div>
                      </label>
                    </>
                  )}
                  {(builder.chartType === 'regression' || builder.aggregation !== 'count') && (
                    <div className="sm:col-span-2 rounded-xl border border-orange-200 bg-white p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <span className="text-xs font-black uppercase text-[#8b2f12]">2. Medida calculada</span>
                          <p className="mt-1 text-xs text-[#bd5a39]">Selecciona entre 2 y 4 campos numéricos desde la columna izquierda.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                          {CALCULATION_OPTIONS.map((item) => (
                            <button
                              key={item.value}
                              type="button"
                              onClick={() => setBuilder((current) => ({ ...current, calculation: item.value }))}
                              className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border px-2 text-[11px] font-black ${
                                builder.calculation === item.value
                                  ? 'border-sky-500 bg-sky-500 text-white'
                                  : 'border-sky-200 bg-white text-sky-700 hover:bg-sky-50'
                              }`}
                              title={item.label}
                            >
                              <span>{item.symbol}</span>
                              <span>{item.label.replace(' campos', '')}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="mt-3 flex min-h-11 flex-wrap items-center gap-2 rounded-lg bg-[#f8fbff] px-3 py-2">
                        {builder.measureColumns.length ? builder.measureColumns.map((column, index) => (
                          <div key={column} className="flex items-center gap-2">
                            {index > 0 && (
                              <span className="font-black text-sky-500">
                                {CALCULATION_OPTIONS.find((item) => item.value === builder.calculation)?.symbol}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1.5 rounded-md border border-sky-200 bg-white px-2.5 py-1.5 text-xs font-bold text-sky-800">
                              {builderNumericColumns.find((item) => item.value === column)?.label || humanizeColumn(column)}
                              <button
                                type="button"
                                onClick={() => setBuilder((current) => ({
                                  ...current,
                                  measureColumns: current.measureColumns.filter((value) => value !== column),
                                }))}
                                className="text-sky-400 hover:text-red-500"
                                aria-label={`Quitar ${humanizeColumn(column)}`}
                              >
                                <X size={12} />
                              </button>
                            </span>
                          </div>
                        )) : (
                          <span className="text-xs font-semibold text-sky-400">Añade campos numéricos con el botón + de la izquierda.</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <section className="mt-5 overflow-hidden rounded-xl border border-orange-200 bg-white">
                  <div className="flex items-center justify-between border-b border-orange-100 px-4 py-3">
                    <div>
                      <p className="text-xs font-black uppercase text-[#8b2f12]">Vista previa</p>
                      <p className="mt-0.5 text-[11px] text-[#bd5a39]">Se actualiza automáticamente con tu configuración.</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
                      canCreateChart ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {canCreateChart ? 'Lista para añadir' : 'Configuración incompleta'}
                    </span>
                  </div>
                  <div className="h-64 p-4">
                    {canCreateChart
                      ? renderCustomChart(builder)
                      : (
                        <div className="grid h-full place-items-center text-center">
                          <div>
                            <BarChart3 className="mx-auto text-orange-200" size={34} />
                            <p className="mt-3 text-sm font-black text-[#8b2f12]">Completa los campos necesarios</p>
                            <p className="mt-1 text-xs text-[#bd5a39]">
                              {builder.chartType === 'regression'
                                ? 'Selecciona el eje X y al menos dos campos para la medida Y.'
                                : 'Selecciona una dimensión y, si calculas valores, al menos dos campos numéricos.'}
                            </p>
                          </div>
                        </div>
                      )}
                  </div>
                </section>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-[#bd5a39]">
                    La gráfica se guardará en este portal y podrás quitarla o cambiarla de posición.
                  </p>
                  <button
                    type="button"
                    onClick={createCustomChart}
                    disabled={!canCreateChart}
                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff5a1f] to-[#ff3048] px-5 text-sm font-black text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <Plus size={17} /> Crear y añadir
                  </button>
                </div>
              </div>
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </PortalSidebar>
  );
};

export default PortalAnalyticsPage;
