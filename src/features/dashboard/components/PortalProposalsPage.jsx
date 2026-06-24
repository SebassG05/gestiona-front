import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import readXlsxFile from 'read-excel-file/browser';
import {
  AlertCircle,
  ArrowDownUp,
  BadgeEuro,
  Building2,
  CalendarDays,
  CheckSquare,
  ChevronDown,
  CircleUserRound,
  ExternalLink,
  FileText,
  FileSpreadsheet,
  Filter,
  Link as LinkIcon,
  Mail,
  Trash2,
  Plus,
  Search,
  SquarePen,
  Upload,
  UserPlus,
  X,
} from 'lucide-react';
import PortalSidebar from './PortalSidebar.jsx';
import { getPortalMembers } from '../services/portalService.js';
import {
  deleteProposal,
  getPortalProposals,
  importProposals,
} from '../services/proposalService.js';

const baseSheets = ['Propuestas activas', 'Borradores'];
const statusSheetOptions = ['En preparacion', 'Enviada', 'En revision', 'Ganada', 'Archivada'];

const emptyFilters = {
  estado: '',
  prioridad: '',
  programa: '',
  fase: '',
  responsable: '',
  tipo: '',
  deadlineFrom: '',
  deadlineTo: '',
};

const defaultTablePreferences = {
  sortKey: 'createdAt',
  sortDirection: 'desc',
  density: 'comfortable',
  visibleColumns: {
    tipo: true,
    acronimo: true,
    contactos: true,
  },
};

const sortOptions = [
  { value: 'createdAt', label: 'Fecha de creacion' },
  { value: 'nombre', label: 'Nombre' },
  { value: 'deadlineApertura', label: 'Deadline' },
  { value: 'prioridad', label: 'Prioridad' },
  { value: 'estado', label: 'Estado' },
  { value: 'programa', label: 'Programa' },
];

const normalizeExcelHeader = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[€%/()_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();

const excelColumns = {
  ID: 'id',
  'PROPUESTA ID': 'id',
  PROGRAMA: 'programa',
  CONVOCATORIA: 'convocatoria',
  ACRONIMO: 'acronimo',
  TIPO: 'tipo',
  DEADLINE: 'deadlineApertura',
  'DEADLINE APERTURA': 'deadlineApertura',
  FASE: 'fase',
  ESTADO: 'estado',
  PRIORIDAD: 'prioridad',
  RESPONSABLE: 'responsableLabel',
  'NOMBRE DE LA PROPUESTA': 'nombre',
  NOMBRE: 'nombre',
  'ROL EVENOR': 'rolEvenor',
  'COORDINADOR LEAD': 'coordinadorLead',
  'PRESUPUESTO TOTAL': 'presupuestoTotal',
  'PRESUPUESTO EVENOR': 'presupuestoEvenor',
  PROBABILIDAD: 'probabilidad',
  'VALOR ESPERADO': 'valorEsperado',
  'PROYECTO EJECUCION VINCULADO': 'proyectoEjecucionVinculado',
  'PAGOS RECIBIDOS VINCULADOS': 'pagosRecibidosVinculados',
  'BALANCE PENDIENTE': 'balancePendiente',
  'PROXIMA ACCION': 'proximaAccion',
  'FUENTE URL': 'fuenteUrl',
  NOTAS: 'notas',
  CONTACTOS: null,
};

const numericExcelFields = new Set([
  'presupuestoTotal',
  'presupuestoEvenor',
  'probabilidad',
  'valorEsperado',
  'pagosRecibidosVinculados',
  'balancePendiente',
]);

const formatExcelDate = (value) => {
  if (!value) return '';
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const dateParts = String(value).trim().match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dateParts) {
    const [, day, month, year] = dateParts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? '' : parsedDate.toISOString().slice(0, 10);
};

const parseExcelNumber = (value) => {
  if (typeof value === 'number') return value;

  const normalizedValue = String(value).trim().replace(/\s/g, '');
  const decimalValue =
    normalizedValue.includes(',') && normalizedValue.includes('.')
      ? normalizedValue.replace(/\./g, '').replace(',', '.')
      : normalizedValue.replace(',', '.');
  const parsedValue = Number(decimalValue);

  return Number.isFinite(parsedValue) ? parsedValue : null;
};

const normalizeExcelChoice = (value, options) => {
  const normalizedValue = normalizeExcelHeader(value);
  return options.find((option) => normalizeExcelHeader(option) === normalizedValue) || String(value).trim();
};

const statusStyles = {
  Activo: 'border-emerald-300 bg-emerald-100 text-emerald-800',
  Activa: 'border-emerald-300 bg-emerald-100 text-emerald-800',
  'En preparacion': 'border-amber-300 bg-amber-100 text-amber-800',
  Enviada: 'border-sky-300 bg-sky-100 text-sky-800',
  'En revision': 'border-violet-300 bg-violet-100 text-violet-800',
  Vigilancia: 'border-cyan-300 bg-cyan-100 text-cyan-800',
  Pausado: 'border-slate-300 bg-slate-100 text-slate-700',
  Pausada: 'border-slate-300 bg-slate-100 text-slate-700',
  Ganada: 'border-emerald-400 bg-emerald-100 text-emerald-800',
  Perdida: 'border-red-300 bg-red-100 text-red-700',
  Archivada: 'border-neutral-300 bg-neutral-100 text-neutral-600',
};

const priorityStyles = {
  A: 'border-red-300 bg-red-100 text-red-700',
  Alta: 'border-red-300 bg-red-100 text-red-700',
  B: 'border-amber-300 bg-amber-100 text-amber-800',
  Media: 'border-amber-300 bg-amber-100 text-amber-800',
  C: 'border-emerald-300 bg-emerald-100 text-emerald-800',
  Baja: 'border-emerald-300 bg-emerald-100 text-emerald-800',
};

const menuButtons = [
  { label: 'Anadir propuesta', icon: Plus, primary: true },
  { label: 'Importar Excel', icon: FileSpreadsheet, primary: false },
  { label: 'Editar campo', icon: SquarePen, primary: false },
];

const PortalProposalsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { portalId } = useParams();
  const excelInputRef = useRef(null);
  const sheetsStorageKey = `gestiona:portal:${portalId}:proposal-sheets`;
  const tableStorageKey = `gestiona:portal:${portalId}:proposal-table`;
  const storedSheetPreferences = (() => {
    try {
      const storedValue = window.localStorage.getItem(sheetsStorageKey);
      if (!storedValue) return null;

      const parsedValue = JSON.parse(storedValue);
      const savedSheets = Array.isArray(parsedValue.statusSheets)
        ? parsedValue.statusSheets.filter((sheet) => statusSheetOptions.includes(sheet))
        : [];
      const savedActiveSheet = [...baseSheets, ...savedSheets].includes(parsedValue.activeSheet)
        ? parsedValue.activeSheet
        : baseSheets[0];

      return {
        statusSheets: savedSheets,
        activeSheet: savedActiveSheet,
      };
    } catch {
      return null;
    }
  })();
  const [proposals, setProposals] = useState([]);
  const [selectedProposalId, setSelectedProposalId] = useState(location.state?.selectedProposalId || null);
  const [activeSheet, setActiveSheet] = useState(
    location.state?.activeSheet || storedSheetPreferences?.activeSheet || baseSheets[0]
  );
  const [statusSheets, setStatusSheets] = useState(storedSheetPreferences?.statusSheets || []);
  const [searchValue, setSearchValue] = useState('');
  const [filters, setFilters] = useState(emptyFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSheetMenuOpen, setIsSheetMenuOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [tablePreferences, setTablePreferences] = useState(() => {
    try {
      const storedValue = window.localStorage.getItem(tableStorageKey);
      if (!storedValue) return defaultTablePreferences;

      const parsedValue = JSON.parse(storedValue);
      return {
        ...defaultTablePreferences,
        ...parsedValue,
        visibleColumns: {
          ...defaultTablePreferences.visibleColumns,
          ...parsedValue.visibleColumns,
        },
      };
    } catch {
      return defaultTablePreferences;
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [notice, setNotice] = useState(location.state?.notice || '');
  const [proposalToDelete, setProposalToDelete] = useState(null);
  const [isDeletingProposal, setIsDeletingProposal] = useState(false);
  const [excelPreview, setExcelPreview] = useState(null);
  const [isReadingExcel, setIsReadingExcel] = useState(false);
  const [isImportingExcel, setIsImportingExcel] = useState(false);

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
    let isMounted = true;

    const loadMembers = async () => {
      try {
        const response = await getPortalMembers(portalId);
        if (isMounted) setMembers(response.data || []);
      } catch {
        if (isMounted) setMembers([]);
      }
    };

    loadMembers();

    return () => {
      isMounted = false;
    };
  }, [portalId]);

  useEffect(() => {
    if (!notice) return undefined;
    const timeout = window.setTimeout(() => setNotice(''), 3500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    window.localStorage.setItem(
      sheetsStorageKey,
      JSON.stringify({
        activeSheet,
        statusSheets,
      })
    );
  }, [activeSheet, sheetsStorageKey, statusSheets]);

  useEffect(() => {
    window.localStorage.setItem(tableStorageKey, JSON.stringify(tablePreferences));
  }, [tablePreferences, tableStorageKey]);

  const selectedProposal = useMemo(
    () => proposals.find((proposal) => proposal._id === selectedProposalId) || null,
    [proposals, selectedProposalId]
  );

  const filterOptions = useMemo(() => {
    const uniqueValues = (getValue) =>
      [...new Set(proposals.map(getValue).filter(Boolean))].sort((a, b) =>
        String(a).localeCompare(String(b), 'es')
      );

    return {
      estados: uniqueValues((proposal) => proposal.estado),
      prioridades: uniqueValues((proposal) => proposal.prioridad),
      programas: uniqueValues((proposal) => proposal.programa),
      fases: uniqueValues((proposal) => proposal.fase),
      tipos: uniqueValues((proposal) => proposal.tipo),
      responsables: proposals
        .map((proposal) => proposal.responsable)
        .filter(Boolean)
        .filter(
          (responsable, index, values) =>
            values.findIndex((candidate) => candidate._id === responsable._id) === index
        )
        .sort((a, b) =>
          String(a.username || a.email || '').localeCompare(String(b.username || b.email || ''), 'es')
        ),
    };
  }, [proposals]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const filteredProposals = proposals.filter((proposal) => {
    const lifecycleStatus = proposal.lifecycleStatus || 'active';
    const belongsToSheet =
      (activeSheet === 'Propuestas activas' && lifecycleStatus === 'active') ||
      (activeSheet === 'Borradores' && lifecycleStatus === 'draft') ||
      (statusSheets.includes(activeSheet) &&
        lifecycleStatus !== 'draft' &&
        proposal.estado === activeSheet);

    if (!belongsToSheet) return false;

    const normalizedSearch = searchValue.trim().toLowerCase();

    const matchesSearch =
      !normalizedSearch ||
      [
        proposal.nombre,
        proposal.estado,
        proposal.prioridad,
        proposal.tipo,
        proposal.acronimo,
        proposal.programa,
        proposal.fase,
        proposal.responsable?.username,
        proposal.responsable?.email,
      ].some((field) => String(field || '').toLowerCase().includes(normalizedSearch));

    if (!matchesSearch) return false;
    if (filters.estado && proposal.estado !== filters.estado) return false;
    if (filters.prioridad && proposal.prioridad !== filters.prioridad) return false;
    if (filters.programa && proposal.programa !== filters.programa) return false;
    if (filters.fase && proposal.fase !== filters.fase) return false;
    if (filters.tipo && proposal.tipo !== filters.tipo) return false;
    if (filters.responsable && proposal.responsable?._id !== filters.responsable) return false;

    const proposalDeadline = proposal.deadlineApertura
      ? new Date(proposal.deadlineApertura).setHours(0, 0, 0, 0)
      : null;
    const deadlineFrom = filters.deadlineFrom
      ? new Date(`${filters.deadlineFrom}T00:00:00`).getTime()
      : null;
    const deadlineTo = filters.deadlineTo
      ? new Date(`${filters.deadlineTo}T23:59:59`).getTime()
      : null;

    if (deadlineFrom && (!proposalDeadline || proposalDeadline < deadlineFrom)) return false;
    if (deadlineTo && (!proposalDeadline || proposalDeadline > deadlineTo)) return false;

    return true;
  });

  const sortedProposals = useMemo(() => {
    const priorityOrder = { A: 3, Alta: 3, B: 2, Media: 2, C: 1, Baja: 1 };
    const getSortValue = (proposal) => {
      if (tablePreferences.sortKey === 'prioridad') {
        return priorityOrder[proposal.prioridad] || 0;
      }

      if (tablePreferences.sortKey === 'deadlineApertura' || tablePreferences.sortKey === 'createdAt') {
        const dateValue = proposal[tablePreferences.sortKey];
        return dateValue ? new Date(dateValue).getTime() : null;
      }

      return String(proposal[tablePreferences.sortKey] || '').toLocaleLowerCase('es');
    };

    return [...filteredProposals].sort((firstProposal, secondProposal) => {
      const firstValue = getSortValue(firstProposal);
      const secondValue = getSortValue(secondProposal);

      if ((firstValue === null || firstValue === '') && (secondValue === null || secondValue === '')) {
        return 0;
      }
      if (firstValue === null || firstValue === '') return 1;
      if (secondValue === null || secondValue === '') return -1;

      const comparison =
        typeof firstValue === 'number'
          ? firstValue - secondValue
          : firstValue.localeCompare(secondValue, 'es', { numeric: true });

      return tablePreferences.sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredProposals, tablePreferences.sortDirection, tablePreferences.sortKey]);

  const tableGridColumns = [
    '56px',
    tablePreferences.visibleColumns.acronimo && '1fr',
    '1.8fr',
    '1.2fr',
    '1fr',
    '1fr',
    tablePreferences.visibleColumns.tipo && '0.9fr',
    '1fr',
    '1.2fr',
    tablePreferences.visibleColumns.contactos && '1fr',
  ]
    .filter(Boolean)
    .join(' ');

  const visibleColumnCount = Object.values(tablePreferences.visibleColumns).filter(Boolean).length;
  const tableMinWidth = 900 + visibleColumnCount * 110;
  const isCompactView = tablePreferences.density === 'compact';

  const formatDate = (value) => {
    if (!value) return '-';
    return new Intl.DateTimeFormat('es-ES').format(new Date(value));
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const reloadProposals = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await getPortalProposals(portalId);
      setProposals(response.data || []);
    } catch (error) {
      setProposals([]);
      setErrorMessage(error.response?.data?.message || 'No se pudieron cargar las propuestas.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSheetChange = (sheet) => {
    setActiveSheet(sheet);
    setSelectedProposalId(null);
    setIsSheetMenuOpen(false);
  };

  const handleAddStatusSheet = (status) => {
    setStatusSheets((current) => (current.includes(status) ? current : [...current, status]));
    handleSheetChange(status);
  };

  const handleRemoveStatusSheet = (status) => {
    setStatusSheets((current) => current.filter((sheet) => sheet !== status));

    if (activeSheet === status) {
      setActiveSheet(baseSheets[0]);
      setSelectedProposalId(null);
    }
  };

  const updateFilter = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }));
    setSelectedProposalId(null);
  };

  const handleDeleteProposal = async () => {
    if (!proposalToDelete || isDeletingProposal) return;

    setIsDeletingProposal(true);

    try {
      await deleteProposal({ portalId, proposalId: proposalToDelete._id });

      if (selectedProposalId === proposalToDelete._id) {
        setSelectedProposalId(null);
      }

      setNotice(`La propuesta "${proposalToDelete.nombre}" se ha eliminado.`);
      setProposalToDelete(null);
      await reloadProposals();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'No se pudo eliminar la propuesta.');
      setProposalToDelete(null);
    } finally {
      setIsDeletingProposal(false);
    }
  };

  const handleMenuAction = (label) => {
    if (label === 'Anadir propuesta') {
      navigate(`/dashboard/portal/${portalId}/proposals/create`);
      return;
    }

    if (label === 'Editar campo') {
      if (!selectedProposalId) return;
      navigate(`/dashboard/portal/${portalId}/proposals/${selectedProposalId}/edit`);
      return;
    }

    if (label === 'Importar Excel') {
      excelInputRef.current?.click();
    }
  };

  const handleExcelSelection = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      setErrorMessage('El archivo debe estar guardado en formato .xlsx.');
      return;
    }

    setIsReadingExcel(true);
    setErrorMessage('');

    try {
      const workbookSheets = await readXlsxFile(file);
      const sheetCandidates = workbookSheets
        .filter(({ data }) => Array.isArray(data) && data.length >= 2)
        .map(({ sheet, data }) => {
          const headers = data[0].map(normalizeExcelHeader);
          const recognizedCount = headers.filter((header) =>
            Object.prototype.hasOwnProperty.call(excelColumns, header)
          ).length;
          const hasProposalIdentifier = headers.includes('NOMBRE DE LA PROPUESTA') || headers.includes('ID');

          return {
            sheet,
            data,
            recognizedCount,
            hasProposalIdentifier,
          };
        })
        .sort((firstSheet, secondSheet) => {
          if (firstSheet.hasProposalIdentifier !== secondSheet.hasProposalIdentifier) {
            return Number(secondSheet.hasProposalIdentifier) - Number(firstSheet.hasProposalIdentifier);
          }

          return secondSheet.recognizedCount - firstSheet.recognizedCount;
        });

      const selectedSheet = sheetCandidates[0];

      if (!selectedSheet || selectedSheet.recognizedCount < 2) {
        setErrorMessage(
          'No se encontró ninguna hoja con cabeceras de propuestas. Comprueba que incluya ID o NOMBRE DE LA PROPUESTA.'
        );
        return;
      }

      const rows = selectedSheet.data;
      const headers = rows[0].map(normalizeExcelHeader);
      const mappedHeaders = headers.map((header) =>
        Object.prototype.hasOwnProperty.call(excelColumns, header) ? excelColumns[header] : undefined
      );
      const hasNameColumn = mappedHeaders.includes('nombre');
      const hasIdColumn = mappedHeaders.includes('id');
      const recognizedHeaders = headers.filter((header) =>
        Object.prototype.hasOwnProperty.call(excelColumns, header)
      );
      const ignoredHeaders = headers.filter(
        (header) => header && !Object.prototype.hasOwnProperty.call(excelColumns, header)
      );

      if (!hasNameColumn && !hasIdColumn) {
        setErrorMessage('Falta una columna "ID" o "NOMBRE DE LA PROPUESTA".');
        return;
      }

      const memberByLabel = new Map();
      members.forEach((member) => {
        [member.username, member.email].filter(Boolean).forEach((label) => {
          memberByLabel.set(String(label).trim().toLocaleLowerCase('es'), member.id);
        });
      });

      const errors = [];
      const warnings = [];
      const parsedProposals = rows
        .slice(1)
        .map((row, rowIndex) => {
          const isEmptyRow = row.every((cell) => cell === null || cell === undefined || cell === '');
          if (isEmptyRow) return null;

          const proposal = { lifecycleStatus: 'active' };

          row.forEach((cell, columnIndex) => {
            const field = mappedHeaders[columnIndex];
            if (!field || cell === null || cell === undefined || cell === '') return;

            if (field === 'deadlineApertura') {
              proposal[field] = formatExcelDate(cell);
            } else if (field === 'responsableLabel') {
              const label = String(cell).trim();
              const memberId = memberByLabel.get(label.toLocaleLowerCase('es'));
              if (memberId) {
                proposal.responsable = memberId;
              } else {
                warnings.push(`Fila ${rowIndex + 2}: responsable "${label}" no encontrado.`);
              }
            } else if (numericExcelFields.has(field)) {
              const numericValue = parseExcelNumber(cell);
              if (numericValue !== null) proposal[field] = numericValue;
            } else if (field === 'estado') {
              proposal[field] = normalizeExcelChoice(cell, statusSheetOptions);
            } else if (field === 'prioridad') {
              proposal[field] = normalizeExcelChoice(cell, Object.keys(priorityStyles));
            } else {
              proposal[field] = String(cell).trim();
            }
          });

          if (!proposal.nombre && proposal.id) {
            proposal.nombre = proposal.id;
          }

          if (!proposal.nombre || proposal.nombre.length < 2) {
            errors.push(`Fila ${rowIndex + 2}: falta un nombre válido para la propuesta.`);
          }

          return proposal;
        })
        .filter(Boolean);

      if (parsedProposals.length > 500) {
        errors.push('El archivo supera el límite de 500 propuestas por importación.');
      }
      if (parsedProposals.length === 0) {
        errors.push('El archivo no contiene ninguna propuesta para importar.');
      }

      if (recognizedHeaders.includes('CONTACTOS')) {
        warnings.push('La columna CONTACTOS se ha reconocido, pero todavía no se almacena en las propuestas.');
      }
      if (!hasNameColumn && hasIdColumn) {
        warnings.push(
          `La hoja "${selectedSheet.sheet}" no tiene NOMBRE DE LA PROPUESTA; se utilizará el valor de ID como nombre.`
        );
      }

      ignoredHeaders.forEach((header) => {
        warnings.push(`La columna "${header}" no se reconoce y será ignorada.`);
      });

      setExcelPreview({
        fileName: file.name,
        sheetName: selectedSheet.sheet,
        proposals: parsedProposals,
        errors: [...new Set(errors)],
        warnings: [...new Set(warnings)],
        recognizedCount: recognizedHeaders.length,
      });
    } catch {
      setErrorMessage('No se pudo leer el Excel. Comprueba que sea un archivo .xlsx válido.');
    } finally {
      setIsReadingExcel(false);
    }
  };

  const handleImportExcel = async () => {
    if (!excelPreview || excelPreview.errors.length > 0 || isImportingExcel) return;

    setIsImportingExcel(true);
    setErrorMessage('');

    try {
      const response = await importProposals({
        portalId,
        proposals: excelPreview.proposals,
      });
      const importedCount = response.data?.count || excelPreview.proposals.length;

      setExcelPreview(null);
      setActiveSheet('Propuestas activas');
      setSelectedProposalId(null);
      setNotice(`${importedCount} propuestas importadas correctamente.`);
      await reloadProposals();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'No se pudieron importar las propuestas.');
    } finally {
      setIsImportingExcel(false);
    }
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
          <input
            ref={excelInputRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={handleExcelSelection}
            className="hidden"
          />

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
                          onClick={() => handleMenuAction(button.label)}
                          disabled={button.label === 'Editar campo' && !selectedProposalId}
                          className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                            button.primary
                              ? 'border-orange-500 bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-sm hover:from-orange-600 hover:to-red-600'
                              : 'border-orange-100 bg-white text-orange-900 hover:bg-orange-50'
                          } ${
                            button.label === 'Editar campo' && !selectedProposalId
                              ? 'cursor-not-allowed opacity-45 hover:bg-white'
                              : ''
                          }`}
                        >
                          <Icon size={16} strokeWidth={2.2} />
                          {button.label === 'Importar Excel' && isReadingExcel
                            ? 'Leyendo Excel...'
                            : button.label}
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

                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsFilterOpen((current) => !current);
                          setIsSheetMenuOpen(false);
                          setIsSortOpen(false);
                          setIsViewOpen(false);
                        }}
                        className={`inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition lg:w-auto ${
                          isFilterOpen || activeFilterCount > 0
                            ? 'border-orange-300 bg-orange-50 text-orange-700'
                            : 'border-orange-100 bg-white text-orange-900 hover:bg-orange-50'
                        }`}
                        aria-expanded={isFilterOpen}
                      >
                        <Filter size={16} strokeWidth={2.1} />
                        Filtrar
                        {activeFilterCount > 0 && (
                          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-orange-500 px-1 text-[11px] text-white">
                            {activeFilterCount}
                          </span>
                        )}
                      </button>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsSortOpen((current) => !current);
                          setIsViewOpen(false);
                          setIsFilterOpen(false);
                          setIsSheetMenuOpen(false);
                        }}
                        className={`inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition lg:w-auto ${
                          isSortOpen
                            ? 'border-orange-300 bg-orange-50 text-orange-700'
                            : 'border-orange-100 bg-white text-orange-900 hover:bg-orange-50'
                        }`}
                        aria-expanded={isSortOpen}
                      >
                        <ArrowDownUp size={16} strokeWidth={2.1} />
                        Ordenar
                      </button>

                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsViewOpen((current) => !current);
                          setIsSortOpen(false);
                          setIsFilterOpen(false);
                          setIsSheetMenuOpen(false);
                        }}
                        className={`inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition lg:w-auto ${
                          isViewOpen
                            ? 'border-orange-300 bg-orange-50 text-orange-700'
                            : 'border-orange-100 bg-white text-orange-900 hover:bg-orange-50'
                        }`}
                        aria-expanded={isViewOpen}
                      >
                        Vista
                        <ChevronDown
                          size={16}
                          strokeWidth={2.1}
                          className={`transition-transform duration-200 ${isViewOpen ? 'rotate-180' : ''}`}
                        />
                      </button>

                    </div>
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {isFilterOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0, marginTop: 0 }}
                      animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
                      exit={{ height: 0, opacity: 0, marginTop: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50/65 via-white to-rose-50/55 p-4 sm:p-5">
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-orange-950">Filtrar propuestas</p>
                            <p className="mt-1 text-xs text-orange-500">
                              Combina varios campos para acotar los resultados de la tabla.
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-semibold text-orange-600">
                              {filteredProposals.length}{' '}
                              {filteredProposals.length === 1 ? 'resultado' : 'resultados'}
                            </span>
                            <button
                              type="button"
                              onClick={() => setFilters(emptyFilters)}
                              disabled={activeFilterCount === 0}
                              className="cursor-pointer text-xs font-semibold text-rose-500 transition hover:text-rose-600 disabled:cursor-default disabled:opacity-40"
                            >
                              Limpiar filtros
                            </button>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <FilterSelect
                            label="Estado"
                            value={filters.estado}
                            options={filterOptions.estados}
                            onChange={(value) => updateFilter('estado', value)}
                          />
                          <FilterSelect
                            label="Prioridad"
                            value={filters.prioridad}
                            options={filterOptions.prioridades}
                            onChange={(value) => updateFilter('prioridad', value)}
                          />
                          <FilterSelect
                            label="Programa"
                            value={filters.programa}
                            options={filterOptions.programas}
                            onChange={(value) => updateFilter('programa', value)}
                          />
                          <FilterSelect
                            label="Fase"
                            value={filters.fase}
                            options={filterOptions.fases}
                            onChange={(value) => updateFilter('fase', value)}
                          />
                          <FilterSelect
                            label="Tipo"
                            value={filters.tipo}
                            options={filterOptions.tipos}
                            onChange={(value) => updateFilter('tipo', value)}
                          />
                          <label className="block">
                            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-orange-700">
                              Responsable
                            </span>
                            <select
                              value={filters.responsable}
                              onChange={(event) => updateFilter('responsable', event.target.value)}
                              className="h-11 w-full cursor-pointer rounded-xl border border-orange-100 bg-white px-3 text-sm text-orange-950 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                            >
                              <option value="">Todos</option>
                              {filterOptions.responsables.map((responsable) => (
                                <option key={responsable._id} value={responsable._id}>
                                  {responsable.username || responsable.email}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="block">
                            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-orange-700">
                              Deadline desde
                            </span>
                            <input
                              type="date"
                              value={filters.deadlineFrom}
                              onChange={(event) => updateFilter('deadlineFrom', event.target.value)}
                              className="h-11 w-full rounded-xl border border-orange-100 bg-white px-3 text-sm text-orange-950 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                            />
                          </label>
                          <label className="block">
                            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-orange-700">
                              Deadline hasta
                            </span>
                            <input
                              type="date"
                              value={filters.deadlineTo}
                              onChange={(event) => updateFilter('deadlineTo', event.target.value)}
                              className="h-11 w-full rounded-xl border border-orange-100 bg-white px-3 text-sm text-orange-950 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                            />
                          </label>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence initial={false}>
                  {isSortOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0, marginTop: 0 }}
                      animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
                      exit={{ height: 0, opacity: 0, marginTop: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50/65 via-white to-rose-50/55 p-4 sm:p-5">
                        <div className="grid gap-5 lg:grid-cols-[minmax(220px,0.8fr)_minmax(300px,1.2fr)_minmax(280px,1fr)] lg:items-end">
                          <div>
                            <p className="text-sm font-semibold text-orange-950">Ordenar propuestas</p>
                            <p className="mt-1 max-w-xs text-xs leading-5 text-orange-500">
                              Elige el dato principal y el sentido en el que quieres organizar la tabla.
                            </p>
                          </div>

                          <label className="block">
                            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-orange-700">
                              Ordenar por
                            </span>
                            <select
                              value={tablePreferences.sortKey}
                              onChange={(event) =>
                                setTablePreferences((current) => ({
                                  ...current,
                                  sortKey: event.target.value,
                                }))
                              }
                              className="h-11 w-full cursor-pointer rounded-xl border border-orange-100 bg-white px-3 text-sm text-orange-950 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                            >
                              {sortOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>

                          <div>
                            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-orange-700">
                              Direccion
                            </span>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { value: 'asc', label: 'Ascendente' },
                                { value: 'desc', label: 'Descendente' },
                              ].map((direction) => (
                                <button
                                  key={direction.value}
                                  type="button"
                                  onClick={() =>
                                    setTablePreferences((current) => ({
                                      ...current,
                                      sortDirection: direction.value,
                                    }))
                                  }
                                  className={`h-11 cursor-pointer rounded-xl border px-3 text-xs font-semibold transition ${
                                    tablePreferences.sortDirection === direction.value
                                      ? 'border-orange-300 bg-orange-50 text-orange-700'
                                      : 'border-orange-100 bg-white text-orange-900 hover:bg-orange-50'
                                  }`}
                                >
                                  {direction.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence initial={false}>
                  {isViewOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0, marginTop: 0 }}
                      animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
                      exit={{ height: 0, opacity: 0, marginTop: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50/65 via-white to-rose-50/55 p-4 sm:p-5">
                        <div className="grid gap-5 lg:grid-cols-[minmax(220px,0.8fr)_minmax(260px,0.8fr)_minmax(420px,1.4fr)] lg:items-end">
                          <div>
                            <p className="text-sm font-semibold text-orange-950">Personalizar vista</p>
                            <p className="mt-1 max-w-xs text-xs leading-5 text-orange-500">
                              Ajusta el espacio de las filas y decide qué información necesitas ver.
                            </p>
                          </div>

                          <div>
                            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-orange-700">
                              Densidad
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { value: 'comfortable', label: 'Comoda' },
                                { value: 'compact', label: 'Compacta' },
                              ].map((density) => (
                                <button
                                  key={density.value}
                                  type="button"
                                  onClick={() =>
                                    setTablePreferences((current) => ({
                                      ...current,
                                      density: density.value,
                                    }))
                                  }
                                  className={`h-11 cursor-pointer rounded-xl border px-3 text-xs font-semibold transition ${
                                    tablePreferences.density === density.value
                                      ? 'border-orange-300 bg-orange-50 text-orange-700'
                                      : 'border-orange-100 bg-white text-orange-900 hover:bg-orange-50'
                                  }`}
                                >
                                  {density.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-orange-700">
                              Columnas opcionales
                            </p>
                            <div className="grid gap-2 sm:grid-cols-3">
                              {[
                                { key: 'tipo', label: 'Tipo' },
                                { key: 'acronimo', label: 'Acronimo' },
                                { key: 'contactos', label: 'Contactos' },
                              ].map((column) => {
                                const isVisible = tablePreferences.visibleColumns[column.key];

                                return (
                                  <button
                                    key={column.key}
                                    type="button"
                                    onClick={() =>
                                      setTablePreferences((current) => ({
                                        ...current,
                                        visibleColumns: {
                                          ...current.visibleColumns,
                                          [column.key]: !current.visibleColumns[column.key],
                                        },
                                      }))
                                    }
                                    className={`flex h-11 cursor-pointer items-center justify-between rounded-xl border px-3 text-sm font-semibold transition ${
                                      isVisible
                                        ? 'border-orange-300 bg-orange-50 text-orange-700'
                                        : 'border-orange-100 bg-white text-orange-900 hover:bg-orange-50'
                                    }`}
                                  >
                                    {column.label}
                                    <span
                                      className={`grid h-5 w-5 place-items-center rounded-md border transition ${
                                        isVisible
                                          ? 'border-orange-500 bg-orange-500 text-white'
                                          : 'border-orange-200 bg-white text-transparent'
                                      }`}
                                    >
                                      <CheckSquare size={13} strokeWidth={2.5} />
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="gestiona-scrollbar overflow-x-auto pb-1">
                <div style={{ minWidth: tableMinWidth }}>
                  <div
                    style={{ gridTemplateColumns: tableGridColumns }}
                    className={`grid items-center border-b border-orange-100 bg-orange-50/60 px-4 text-center text-[11px] font-semibold uppercase tracking-wide text-neutral-700 sm:px-6 ${
                      isCompactView ? 'py-3' : 'py-4'
                    }`}
                  >
                    <div />
                    {tablePreferences.visibleColumns.acronimo && <div>Acronimo</div>}
                    <div>Nombre de la propuesta</div>
                    <div>Programa</div>
                    <div>Estado</div>
                    <div>Prioridad</div>
                    {tablePreferences.visibleColumns.tipo && <div>Tipo</div>}
                    <div>Deadline</div>
                    <div>Responsable</div>
                    {tablePreferences.visibleColumns.contactos && <div>Contactos</div>}
                  </div>

                  {isLoading ? (
                    <div className="flex min-h-52 items-center justify-center border-b border-orange-100 bg-white px-6 py-10 text-sm font-semibold text-orange-500">
                      Cargando propuestas...
                    </div>
                  ) : errorMessage ? (
                    <div className="flex min-h-52 items-center justify-center border-b border-red-100 bg-red-50 px-6 py-10 text-center text-sm font-semibold text-red-600">
                      {errorMessage}
                    </div>
                  ) : sortedProposals.length > 0 ? (
                    sortedProposals.map((proposal) => {
                      const isSelected = proposal._id === selectedProposalId;

                      return (
                        <div
                          key={proposal._id}
                          style={{ gridTemplateColumns: tableGridColumns }}
                          onClick={() =>
                            setSelectedProposalId((current) => (current === proposal._id ? null : proposal._id))
                          }
                          onKeyDown={(event) => {
                            if (event.target !== event.currentTarget) return;
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              setSelectedProposalId((current) =>
                                current === proposal._id ? null : proposal._id
                              );
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          className={`grid w-full cursor-pointer items-center border-b border-orange-100 px-4 text-center transition duration-200 sm:px-6 ${
                            isCompactView ? 'min-h-[56px]' : 'min-h-[76px]'
                          } ${
                            isSelected ? 'bg-orange-50/80' : 'bg-white hover:bg-orange-50/45'
                          }`}
                        >
                          <div className={`flex items-center justify-center ${isCompactView ? 'py-2.5' : 'py-4'}`}>
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
                          {tablePreferences.visibleColumns.acronimo && (
                            <div className={`flex items-center justify-center px-3 text-sm leading-5 text-orange-700 ${isCompactView ? 'py-2.5' : 'py-4'}`}>
                              {proposal.acronimo || '-'}
                            </div>
                          )}
                          <div className={`flex items-center justify-center px-3 text-sm font-semibold leading-5 text-orange-950 ${isCompactView ? 'py-2.5' : 'py-4'}`}>
                            {proposal.nombre}
                          </div>
                          <div className={`flex items-center justify-center px-3 text-sm leading-5 text-orange-700 ${isCompactView ? 'py-2.5' : 'py-4'}`}>{proposal.programa || '-'}</div>
                          <div className={`flex items-center justify-center px-2 ${isCompactView ? 'py-2.5' : 'py-4'}`}>
                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[proposal.estado] || 'border-neutral-200 bg-neutral-50 text-neutral-500'}`}>
                              {proposal.estado || 'Sin estado'}
                            </span>
                          </div>
                          <div className={`flex items-center justify-center px-2 ${isCompactView ? 'py-2.5' : 'py-4'}`}>
                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${priorityStyles[proposal.prioridad] || 'border-neutral-200 bg-neutral-50 text-neutral-500'}`}>
                              {proposal.prioridad || 'Sin prioridad'}
                            </span>
                          </div>
                          {tablePreferences.visibleColumns.tipo && (
                            <div className={`flex items-center justify-center px-3 text-sm leading-5 text-orange-700 ${isCompactView ? 'py-2.5' : 'py-4'}`}>
                              {proposal.tipo || '-'}
                            </div>
                          )}
                          <div className={`flex items-center justify-center px-3 text-sm leading-5 text-orange-700 ${isCompactView ? 'py-2.5' : 'py-4'}`}>{formatDate(proposal.deadlineApertura)}</div>
                          <div className={`flex items-center justify-center px-3 text-sm leading-5 text-orange-700 ${isCompactView ? 'py-2.5' : 'py-4'}`}>
                            {proposal.responsable?.username || proposal.responsable?.email || '-'}
                          </div>
                          {tablePreferences.visibleColumns.contactos && (
                            <div className={`flex items-center justify-center px-3 ${isCompactView ? 'py-2.5' : 'py-4'}`}>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  navigate(
                                    `/dashboard/portal/${portalId}/proposals/${proposal._id}/contacts`
                                  );
                                }}
                                className="group inline-flex cursor-pointer items-center gap-2 rounded-xl border border-orange-100 bg-white px-3 py-2 text-orange-600 transition hover:border-orange-300 hover:bg-orange-50"
                                aria-label={`Gestionar contactos de ${proposal.nombre}`}
                                title="Gestionar contactos"
                              >
                                <UserPlus size={17} strokeWidth={2.2} />
                                <span className="min-w-5 rounded-full bg-orange-50 px-1.5 py-0.5 text-xs font-semibold text-orange-600 transition group-hover:bg-white">
                                  {proposal.contactCount || 0}
                                </span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex min-h-52 items-center justify-center border-b border-orange-100 bg-white px-6 py-10 text-center">
                      <div>
                        <p className="text-lg font-semibold text-orange-950">Todavia no hay propuestas</p>
                        <p className="mt-2 text-sm text-orange-500">
                          {activeFilterCount > 0
                            ? 'No hay propuestas que coincidan con los filtros seleccionados.'
                            : activeSheet === 'Borradores'
                              ? 'Los borradores que guardes para mas tarde apareceran aqui.'
                              : statusSheets.includes(activeSheet)
                                ? `Las propuestas con estado "${activeSheet}" apareceran aqui.`
                                : 'Crea una nueva propuesta y aparecera aqui automaticamente.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-orange-100 px-3 py-3 sm:px-5">
                <div className="flex flex-wrap items-center gap-2">
                  {baseSheets.map((sheet) => (
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
                  {statusSheets.map((sheet) => (
                    <div
                      key={sheet}
                      className={`flex items-center overflow-hidden rounded-xl border transition ${
                        activeSheet === sheet
                          ? 'border-orange-200 bg-orange-50 text-orange-600'
                          : 'border-transparent bg-white text-orange-400 hover:border-orange-100 hover:bg-orange-50/70'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleSheetChange(sheet)}
                        className="cursor-pointer py-2 pl-4 pr-2 text-sm font-semibold"
                      >
                        {sheet}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveStatusSheet(sheet)}
                        className="mr-1 grid h-7 w-7 cursor-pointer place-items-center rounded-lg transition hover:bg-white hover:text-rose-500"
                        aria-label={`Quitar vista ${sheet}`}
                        title={`Quitar vista ${sheet}`}
                      >
                        <X size={14} strokeWidth={2.4} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSheetMenuOpen((current) => !current);
                      setIsFilterOpen(false);
                      setIsSortOpen(false);
                      setIsViewOpen(false);
                    }}
                    className={`ml-1 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border text-orange-500 transition ${
                      isSheetMenuOpen
                        ? 'border-orange-300 bg-orange-50'
                        : 'border-orange-100 bg-white hover:bg-orange-50'
                    }`}
                    aria-label="Anadir vista por estado"
                    aria-expanded={isSheetMenuOpen}
                  >
                    <Plus
                      size={18}
                      strokeWidth={2.2}
                      className={`transition-transform duration-300 ${isSheetMenuOpen ? 'rotate-45' : ''}`}
                    />
                  </button>
                </div>

                <AnimatePresence initial={false}>
                  {isSheetMenuOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0, marginTop: 0 }}
                      animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
                      exit={{ height: 0, opacity: 0, marginTop: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-col gap-4 rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50/70 via-white to-rose-50/60 p-4 lg:flex-row lg:items-center">
                        <div className="shrink-0 lg:w-48">
                          <p className="text-sm font-semibold text-orange-950">Añadir vista</p>
                          <p className="mt-1 text-xs leading-5 text-orange-500">
                            Organiza la tabla según el estado de las propuestas.
                          </p>
                        </div>

                        <div className="grid flex-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
                          {statusSheetOptions.map((status) => {
                            const alreadyAdded = statusSheets.includes(status);
                            const isActive = activeSheet === status;

                            return (
                              <button
                                key={status}
                                type="button"
                                onClick={() => handleAddStatusSheet(status)}
                                className={`group flex min-h-14 cursor-pointer items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition duration-200 ${
                                  isActive
                                    ? 'border-orange-300 bg-white text-orange-700 shadow-sm'
                                    : 'border-orange-100 bg-white/80 text-orange-950 hover:-translate-y-0.5 hover:border-orange-200 hover:bg-white hover:shadow-sm'
                                }`}
                              >
                                <span className="flex min-w-0 items-center gap-2">
                                  <span
                                    className={`h-2.5 w-2.5 shrink-0 rounded-full border ${
                                      statusStyles[status] || 'border-orange-200 bg-orange-100'
                                    }`}
                                  />
                                  <span className="truncate">{status}</span>
                                </span>
                                <span
                                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg transition ${
                                    alreadyAdded
                                      ? 'bg-orange-500 text-white'
                                      : 'bg-orange-50 text-orange-400 group-hover:bg-orange-100'
                                  }`}
                                >
                                  {alreadyAdded ? (
                                    <CheckSquare size={14} strokeWidth={2.4} />
                                  ) : (
                                    <Plus size={14} strokeWidth={2.4} />
                                  )}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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

                      <button
                        type="button"
                        onClick={() => setProposalToDelete(selectedProposal)}
                        className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-100"
                      >
                        <Trash2 size={17} strokeWidth={2.2} />
                        Eliminar propuesta
                      </button>

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
                        <div className="space-y-3">
                          <p>
                            {selectedProposal.contactCount > 0
                              ? `${selectedProposal.contactCount} ${
                                  selectedProposal.contactCount === 1
                                    ? 'contacto registrado'
                                    : 'contactos registrados'
                                }`
                              : 'Sin contactos registrados'}
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/dashboard/portal/${portalId}/proposals/${selectedProposal._id}/contacts`
                              )
                            }
                            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-orange-100 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700 transition hover:border-orange-200 hover:bg-orange-100"
                          >
                            <UserPlus size={15} strokeWidth={2.2} />
                            {selectedProposal.contactCount > 0
                              ? 'Ver y gestionar contactos'
                              : 'Añadir contacto'}
                          </button>
                        </div>
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

        <AnimatePresence>
          {excelPreview && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-orange-950/45 px-4 py-6 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.98 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] border border-orange-100 bg-white shadow-2xl"
              >
                <div className="flex items-start justify-between gap-4 border-b border-orange-100 bg-gradient-to-r from-orange-50 to-rose-50 px-6 py-5">
                  <div className="flex min-w-0 items-start gap-4">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-orange-500 shadow-sm ring-1 ring-orange-100">
                      <FileSpreadsheet size={23} strokeWidth={2.1} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-rose-400">
                        Importacion masiva
                      </p>
                      <h2 className="mt-1 truncate text-2xl font-semibold text-orange-950">
                        Revisar propuestas del Excel
                      </h2>
                      <p className="mt-1 truncate text-sm text-orange-600">
                        {excelPreview.fileName} · Hoja: {excelPreview.sheetName}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExcelPreview(null)}
                    disabled={isImportingExcel}
                    className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-xl text-orange-500 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Cerrar importacion"
                  >
                    <X size={19} />
                  </button>
                </div>

                <div className="gestiona-scrollbar overflow-y-auto p-6">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <ImportSummaryCard
                      label="Propuestas"
                      value={excelPreview.proposals.length}
                      tone="orange"
                    />
                    <ImportSummaryCard
                      label="Columnas reconocidas"
                      value={excelPreview.recognizedCount}
                      tone="emerald"
                    />
                    <ImportSummaryCard
                      label="Avisos"
                      value={excelPreview.warnings.length}
                      tone={excelPreview.warnings.length ? 'amber' : 'emerald'}
                    />
                  </div>

                  {excelPreview.errors.length > 0 && (
                    <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-red-700">
                        <AlertCircle size={18} />
                        Corrige estos errores antes de importar
                      </div>
                      <ul className="mt-3 space-y-1.5 text-sm text-red-600">
                        {excelPreview.errors.slice(0, 8).map((error) => (
                          <li key={error}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {excelPreview.warnings.length > 0 && (
                    <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-sm font-semibold text-amber-800">Avisos de importacion</p>
                      <ul className="mt-3 space-y-1.5 text-sm text-amber-700">
                        {excelPreview.warnings.slice(0, 8).map((warning) => (
                          <li key={warning}>• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-5 overflow-hidden rounded-2xl border border-orange-100">
                    <div className="grid grid-cols-[1fr_1.8fr_1.2fr_1fr] bg-orange-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-orange-800">
                      <div>Acronimo</div>
                      <div>Nombre</div>
                      <div>Programa</div>
                      <div>Estado</div>
                    </div>
                    {excelPreview.proposals.slice(0, 8).map((proposal, index) => (
                      <div
                        key={`${proposal.nombre}-${index}`}
                        className="grid grid-cols-[1fr_1.8fr_1.2fr_1fr] border-t border-orange-100 px-4 py-3 text-sm text-orange-800"
                      >
                        <div className="truncate pr-3">{proposal.acronimo || '-'}</div>
                        <div className="truncate pr-3 font-semibold text-orange-950">
                          {proposal.nombre || 'Sin nombre'}
                        </div>
                        <div className="truncate pr-3">{proposal.programa || '-'}</div>
                        <div className="truncate">{proposal.estado || 'Sin estado'}</div>
                      </div>
                    ))}
                  </div>

                  {excelPreview.proposals.length > 8 && (
                    <p className="mt-3 text-center text-xs font-semibold text-orange-500">
                      Y {excelPreview.proposals.length - 8} propuestas mas.
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-center justify-end gap-3 border-t border-orange-100 px-6 py-4 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setExcelPreview(null)}
                    disabled={isImportingExcel}
                    className="w-full cursor-pointer rounded-xl border border-orange-200 bg-white px-5 py-3 text-sm font-semibold text-orange-950 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleImportExcel}
                    disabled={
                      isImportingExcel ||
                      excelPreview.errors.length > 0 ||
                      excelPreview.proposals.length === 0
                    }
                    className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:from-orange-600 hover:to-red-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    <Upload size={17} strokeWidth={2.2} />
                    {isImportingExcel
                      ? 'Importando...'
                      : `Importar ${excelPreview.proposals.length} propuestas`}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {proposalToDelete && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-orange-950/45 px-4 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28, ease: 'easeInOut' }}
            >
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                className="w-full max-w-md rounded-2xl border border-orange-100 bg-white p-6 shadow-2xl"
              >
                <p className="text-sm font-semibold uppercase tracking-wide text-rose-400">Eliminar propuesta</p>
                <h2 className="mt-3 text-2xl font-semibold text-orange-950">{proposalToDelete.nombre}</h2>
                <p className="mt-3 text-sm leading-6 text-orange-500">
                  Esta propuesta dejara de aparecer en el portal. Esta accion no se puede deshacer.
                </p>

                <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setProposalToDelete(null)}
                    disabled={isDeletingProposal}
                    className="w-full cursor-pointer rounded-xl border border-orange-200 bg-white px-5 py-3 text-sm font-semibold text-orange-900 transition duration-200 hover:-translate-y-0.5 hover:bg-orange-50 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteProposal}
                    disabled={isDeletingProposal}
                    className="w-full cursor-pointer rounded-xl bg-gradient-to-r from-red-500 to-orange-500 px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:from-red-600 hover:to-orange-600 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {isDeletingProposal ? 'Eliminando...' : 'Eliminar definitivamente'}
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

const FilterSelect = ({ label, value, options, onChange }) => (
  <label className="block">
    <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-orange-700">
      {label}
    </span>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-11 w-full cursor-pointer rounded-xl border border-orange-100 bg-orange-50/40 px-3 text-sm text-orange-950 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
    >
      <option value="">Todos</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </label>
);

const ImportSummaryCard = ({ label, value, tone }) => {
  const toneClasses = {
    orange: 'border-orange-200 bg-orange-50 text-orange-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
  };

  return (
    <div className={`rounded-2xl border p-4 ${toneClasses[tone] || toneClasses.orange}`}>
      <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
};

export default PortalProposalsPage;
