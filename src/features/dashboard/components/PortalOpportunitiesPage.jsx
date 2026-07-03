import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import readXlsxFile from 'read-excel-file/browser';
import {
  AlertCircle,
  BriefcaseBusiness,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ContactRound,
  Copy,
  Edit3,
  Filter,
  FileSpreadsheet,
  Plus,
  Search,
  Sheet,
  Square,
  Trash2,
  Upload,
  UserPlus,
  X,
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import PortalSidebar from './PortalSidebar.jsx';
import {
  createOpportunityWorkbookRow,
  deleteOpportunityWorkbook,
  deleteOpportunityWorkbookRow,
  getLinkedContactsForOpportunityRows,
  getOpportunityWorkbook,
  getOpportunityWorkbooks,
  importOpportunityWorkbook,
  linkContactsToOpportunityRow,
  searchOpportunityWorkbooks,
  unlinkContactFromOpportunityRow,
  updateOpportunityWorkbookRow,
} from '../services/opportunityWorkbookService.js';

const OPPORTUNITY_ROWS_PAGE_SIZE = 80;

const emptyRowsPagination = {
  page: 1,
  limit: OPPORTUNITY_ROWS_PAGE_SIZE,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

const knownHeaders = new Set(
  [
    'proyectos',
    'proyectos relacionados',
    'rol',
    'nombre',
    'email',
    'e mail',
    'topic id',
    'opening',
    'deadline',
    'empresa',
    'proyecto',
    'correo',
    'type of action',
    'link call',
    'anuncio y n',
    'potencial mensaje',
    'destination',
    'sub destination',
  ].map((header) => header.toUpperCase())
);

const normalizeHeader = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[()/_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();

const isFilled = (value) => value !== null && value !== undefined && String(value).trim() !== '';

const serializeCell = (value) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }
  if (value === null || value === undefined) return null;
  return value;
};

const displayCell = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  if (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)
  ) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return new Intl.DateTimeFormat('es-ES').format(date);
  }
  return String(value);
};

const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

const getResultEmail = (result) => {
  const headers = result.workbook?.headers || [];
  const mailColumnIndex = headers.findIndex((header) =>
    ['EMAIL', 'E MAIL', 'MAIL', 'CORREO'].includes(normalizeHeader(header))
  );

  if (mailColumnIndex >= 0) {
    const emailFromColumn = displayCell(result.values?.[mailColumnIndex]).match(emailPattern)?.[0];
    if (emailFromColumn) return emailFromColumn;
  }

  return (
    (result.values || [])
      .map((value) => displayCell(value))
      .find((value) => emailPattern.test(value))
      ?.match(emailPattern)?.[0] || ''
  );
};

const copyTextToClipboard = async (text) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const temporaryTextarea = document.createElement('textarea');
  temporaryTextarea.value = text;
  temporaryTextarea.setAttribute('readonly', '');
  temporaryTextarea.style.position = 'fixed';
  temporaryTextarea.style.opacity = '0';
  document.body.appendChild(temporaryTextarea);
  temporaryTextarea.select();
  document.execCommand('copy');
  temporaryTextarea.remove();
};

const getResultPreviewCells = (result) => {
  const headers = result.workbook?.headers || [];
  return headers
    .map((header, index) => ({
      header,
      value: displayCell(result.values?.[index]),
    }))
    .filter((cell) => !isGeneratedHeader(cell.header) && cell.value !== '-')
    .slice(0, 5);
};

const getRowValueByHeaderNames = (row, headerNames) => {
  const headers = row.workbook?.headers || [];
  const normalizedNames = headerNames.map(normalizeHeader);
  const index = headers.findIndex((header) =>
    normalizedNames.includes(normalizeHeader(header))
  );
  return index >= 0 ? displayCell(row.values?.[index]) : '';
};

const buildOpportunityOption = (row) => {
  const title =
    getRowValueByHeaderNames(row, [
      'Topic ID',
      'Proyecto',
      'Proyectos',
      'Empresa',
      'Destination',
      'ID',
    ]) || `Fila ${row.rowNumber}`;
  const subtitleParts = [
    getRowValueByHeaderNames(row, ['Nombre', 'Acronimo', 'Acrónimo']),
    row.workbook?.name,
    `Fila ${row.rowNumber}`,
  ].filter(Boolean);
  const badge =
    getRowValueByHeaderNames(row, ['Deadline', 'Deadline/Apertura', 'Opening']) ||
    row.workbook?.sourceFileName ||
    '';

  return {
    id: row._id,
    rowId: row._id,
    workbookId: row.workbook?._id,
    title,
    subtitle: subtitleParts.join(' · '),
    badge,
  };
};

const isGeneratedHeader = (header) => /^Columna \d+(?: \(\d+\))?$/i.test(header);

const primaryGroupHeaders = new Set(['PROYECTO', 'PROYECTOS']);
const mergeableHeaders = new Set([
  ...primaryGroupHeaders,
  'PROYECTO RELACIONADO',
  'PROYECTOS RELACIONADOS',
]);
const singleValueGroupHeaders = new Set([
  'OPENING',
  'DEADLINE',
  'DEADLINE APERTURA',
  'LINK CALL',
  'TYPE OF ACTION',
  'ANUNCIO Y N',
  'POTENCIAL MENSAJE',
]);
const opportunityDetailHeaders = new Set([
  'PROYECTO RELACIONADO',
  'PROYECTOS RELACIONADOS',
  'NOMBRE',
  'NOMBRE Y APELLIDOS',
  'ROL',
  'E MAIL',
  'EMAIL',
  'MAIL',
  'CORREO',
  'CONTACTO',
]);
const opportunityDetailColumnGroups = [
  {
    label: 'Proyecto relacionado',
    headers: ['Proyectos relacionados', 'Proyecto relacionado'],
  },
  {
    label: 'Nombre',
    headers: ['Nombre', 'Nombre y apellidos'],
  },
  {
    label: 'Rol',
    headers: ['Rol'],
  },
  {
    label: 'Email',
    headers: ['E-mail', 'Email', 'Mail', 'Correo', 'Contacto'],
  },
];

const buildMergedTable = (rows, columns) => {
  const spanByCell = new Map();
  const hiddenCells = new Set();
  const displayValueByCell = new Map();
  const contactSpanByRow = new Map();
  const contactHiddenRows = new Set();
  const contactCountByRow = new Map();

  columns.forEach((column, columnPosition) => {
    if (!mergeableHeaders.has(normalizeHeader(column.header))) return;

    rows.forEach((row, rowIndex) => {
      const value = row.values[column.sourceIndex];
      if (!isFilled(value)) return;

      let rowSpan = 1;
      for (let nextIndex = rowIndex + 1; nextIndex < rows.length; nextIndex += 1) {
        const nextValue = rows[nextIndex].values[column.sourceIndex];
        if (isFilled(nextValue)) break;
        rowSpan += 1;
        hiddenCells.add(`${nextIndex}:${columnPosition}`);
      }

      spanByCell.set(`${rowIndex}:${columnPosition}`, rowSpan);
    });
  });

  const projectColumn = columns.find((column) =>
    primaryGroupHeaders.has(normalizeHeader(column.header))
  );
  let groupIndex = -1;
  const rowGroups = rows.map((row) => {
    if (projectColumn && isFilled(row.values[projectColumn.sourceIndex])) {
      groupIndex += 1;
    }
    return Math.max(groupIndex, 0);
  });

  if (projectColumn && rows.length) {
    let groupStartIndex = 0;

    const closeGroup = (endIndex) => {
      const rowSpan = endIndex - groupStartIndex + 1;
      const groupRows = rows.slice(groupStartIndex, endIndex + 1);
      const contactCount = rows
        .slice(groupStartIndex, endIndex + 1)
        .reduce((total, row) => total + (Number(row.contactLinkCount) || 0), 0);

      contactSpanByRow.set(groupStartIndex, rowSpan);
      contactCountByRow.set(groupStartIndex, contactCount);

      if (rowSpan > 1) {
        columns.forEach((column, columnPosition) => {
          if (!singleValueGroupHeaders.has(normalizeHeader(column.header))) return;

          const cellKey = `${groupStartIndex}:${columnPosition}`;
          const firstFilledValue = groupRows
            .map((row) => row.values[column.sourceIndex])
            .find(isFilled);

          spanByCell.set(cellKey, rowSpan);
          if (firstFilledValue !== undefined) {
            displayValueByCell.set(cellKey, firstFilledValue);
          }

          for (let rowIndex = groupStartIndex + 1; rowIndex <= endIndex; rowIndex += 1) {
            hiddenCells.add(`${rowIndex}:${columnPosition}`);
          }
        });
      }

      for (let rowIndex = groupStartIndex + 1; rowIndex <= endIndex; rowIndex += 1) {
        contactHiddenRows.add(rowIndex);
      }
    };

    rows.forEach((row, rowIndex) => {
      const startsNewGroup =
        rowIndex > 0 && isFilled(row.values[projectColumn.sourceIndex]);

      if (startsNewGroup) {
        closeGroup(rowIndex - 1);
        groupStartIndex = rowIndex;
      }
    });

    closeGroup(rows.length - 1);
  } else {
    rows.forEach((row, rowIndex) => {
      contactSpanByRow.set(rowIndex, 1);
      contactCountByRow.set(rowIndex, Number(row.contactLinkCount) || 0);
    });
  }

  return {
    spanByCell,
    hiddenCells,
    displayValueByCell,
    rowGroups,
    contactSpanByRow,
    contactHiddenRows,
    contactCountByRow,
  };
};

const makeUniqueHeaders = (rawHeaders, columnCount) => {
  const occurrences = new Map();

  return Array.from({ length: columnCount }, (_, index) => {
    const baseHeader = String(rawHeaders[index] || '').trim() || `Columna ${index + 1}`;
    const count = (occurrences.get(baseHeader) || 0) + 1;
    occurrences.set(baseHeader, count);
    return count === 1 ? baseHeader : `${baseHeader} (${count})`;
  });
};

const detectSheetTable = (sheets) => {
  const candidates = [];

  sheets.forEach(({ sheet, data }) => {
    const rows = Array.isArray(data) ? data : [];

    rows.slice(0, 30).forEach((row, rowIndex) => {
      const filledCells = row.filter(isFilled);
      if (filledCells.length < 2) return;

      const recognizedHeaders = filledCells.filter((cell) =>
        knownHeaders.has(normalizeHeader(cell))
      ).length;
      const dataRows = rows
        .slice(rowIndex + 1)
        .filter((candidateRow) => candidateRow.some(isFilled)).length;
      const score = recognizedHeaders * 12 + filledCells.length * 2 + Math.min(dataRows, 20);

      candidates.push({
        sheet,
        rows,
        headerIndex: rowIndex,
        recognizedHeaders,
        score,
      });
    });
  });

  candidates.sort((first, second) => {
    if (first.recognizedHeaders !== second.recognizedHeaders) {
      return second.recognizedHeaders - first.recognizedHeaders;
    }
    return second.score - first.score;
  });

  const selected = candidates[0];
  if (!selected || selected.recognizedHeaders < 2) return null;

  const dataRows = selected.rows
    .slice(selected.headerIndex + 1)
    .filter((row) => row.some(isFilled));
  const relevantRows = [selected.rows[selected.headerIndex], ...dataRows];
  const columnCount = relevantRows.reduce((maxColumns, row) => {
    let lastFilledIndex = -1;
    row.forEach((cell, index) => {
      if (isFilled(cell)) lastFilledIndex = index;
    });
    return Math.max(maxColumns, lastFilledIndex + 1);
  }, 0);

  if (!columnCount || !dataRows.length) return null;

  const namedColumnIndexes = Array.from({ length: columnCount }, (_, index) => index).filter(
    (index) => isFilled(selected.rows[selected.headerIndex][index])
  );
  const headers = makeUniqueHeaders(
    namedColumnIndexes.map((index) => selected.rows[selected.headerIndex][index]),
    namedColumnIndexes.length
  );

  return {
    sheetName: selected.sheet,
    headerRow: selected.headerIndex + 1,
    headers,
    rows: dataRows.map((row) =>
      namedColumnIndexes.map((index) => serializeCell(row[index]))
    ),
  };
};

const fileNameWithoutExtension = (fileName) => fileName.replace(/\.xlsx$/i, '').trim();

const libraryCopies = {
  opportunities: {
    category: 'opportunities',
    eyebrow: 'Oportunidades',
    title: 'Biblioteca de oportunidades',
    description:
      'Importa varios Excel y consulta cada uno como una pagina independiente dentro del portal.',
    searchAllPlaceholder: 'Buscar en todos los Excel importados...',
    loadingList: 'Cargando paginas de oportunidades...',
    loadListError: 'No se pudieron cargar las paginas de oportunidades.',
    importSingle: 'La pagina de oportunidades se ha importado correctamente.',
    importMultiple: (count) => `${count} paginas de oportunidades importadas correctamente.`,
    emptyTitle: 'Todavia no hay paginas de oportunidades',
    emptyDescription:
      'Puedes seleccionar varios Excel a la vez. Cada archivo se guardara como una pagina independiente.',
    emptyIcon: BriefcaseBusiness,
    importTitle: 'Importar paginas de oportunidades',
  },
  contacts: {
    category: 'contacts',
    eyebrow: 'Contactos',
    title: 'Biblioteca de contactos',
    description:
      'Guarda y consulta los Excel de contactos del portal separados de las oportunidades.',
    searchAllPlaceholder: 'Buscar en todos los contactos importados...',
    loadingList: 'Cargando paginas de contactos...',
    loadListError: 'No se pudieron cargar las paginas de contactos.',
    importSingle: 'La pagina de contactos se ha importado correctamente.',
    importMultiple: (count) => `${count} paginas de contactos importadas correctamente.`,
    emptyTitle: 'Todavia no hay paginas de contactos',
    emptyDescription:
      'Importa el Excel de contactos y quedara guardado en esta seccion del portal.',
    emptyIcon: ContactRound,
    importTitle: 'Importar paginas de contactos',
  },
};

const PortalOpportunitiesPage = ({ libraryType = 'opportunities' }) => {
  const { portalId } = useParams();
  const copy = libraryCopies[libraryType] || libraryCopies.opportunities;
  const workbookCategory = copy.category;
  const isContactsLibrary = workbookCategory === 'contacts';
  const excelInputRef = useRef(null);
  const [workbooks, setWorkbooks] = useState([]);
  const [activeWorkbookId, setActiveWorkbookId] = useState('');
  const [activeWorkbook, setActiveWorkbook] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isWorkbookLoading, setIsWorkbookLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [importPreview, setImportPreview] = useState(null);
  const [isReadingFiles, setIsReadingFiles] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [workbookToDelete, setWorkbookToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCopyMenuOpen, setIsCopyMenuOpen] = useState(false);
  const [globalSearchValue, setGlobalSearchValue] = useState('');
  const [globalResults, setGlobalResults] = useState([]);
  const [isGlobalSearching, setIsGlobalSearching] = useState(false);
  const [globalSearchError, setGlobalSearchError] = useState('');
  const [workbookPage, setWorkbookPage] = useState(1);
  const [workbookPagination, setWorkbookPagination] = useState(emptyRowsPagination);
  const [workbookReloadKey, setWorkbookReloadKey] = useState(0);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [draftContactFilters, setDraftContactFilters] = useState([{ header: '', value: '' }]);
  const [appliedContactFilters, setAppliedContactFilters] = useState([]);
  const [rowModal, setRowModal] = useState(null);
  const [rowFormValues, setRowFormValues] = useState([]);
  const [isSavingRow, setIsSavingRow] = useState(false);
  const [selectedContactRowIds, setSelectedContactRowIds] = useState([]);
  const [isOpportunityPickerOpen, setIsOpportunityPickerOpen] = useState(false);
  const [opportunityOptions, setOpportunityOptions] = useState([]);
  const [opportunitySearchValue, setOpportunitySearchValue] = useState('');
  const [isLoadingOpportunityOptions, setIsLoadingOpportunityOptions] = useState(false);
  const [isLinkingContacts, setIsLinkingContacts] = useState(false);
  const [opportunityPickerError, setOpportunityPickerError] = useState('');
  const [linkedContactsModal, setLinkedContactsModal] = useState(null);
  const [linkedContacts, setLinkedContacts] = useState([]);
  const [isLoadingLinkedContacts, setIsLoadingLinkedContacts] = useState(false);
  const [linkedContactsError, setLinkedContactsError] = useState('');
  const [unlinkingContactId, setUnlinkingContactId] = useState('');
  const [linkedContactSearchValue, setLinkedContactSearchValue] = useState('');
  const [linkedContactSearchResults, setLinkedContactSearchResults] = useState([]);
  const [isSearchingLinkedContacts, setIsSearchingLinkedContacts] = useState(false);
  const [linkingSearchContactId, setLinkingSearchContactId] = useState('');
  const [selectedOpportunityDetail, setSelectedOpportunityDetail] = useState(null);

  const readyDraftContactFilters = useMemo(
    () =>
      draftContactFilters.filter(
        (filter) => filter.header.trim() && filter.value.trim()
      ),
    [draftContactFilters]
  );

  const loadWorkbooks = async (preferredWorkbookId = '') => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await getOpportunityWorkbooks(portalId, {
        category: workbookCategory,
      });
      const nextWorkbooks = response.data || [];
      setWorkbooks(nextWorkbooks);
      if (preferredWorkbookId) setWorkbookPage(1);
      setActiveWorkbookId((current) => {
        const requestedId = preferredWorkbookId || current;
        return nextWorkbooks.some((workbook) => workbook._id === requestedId)
          ? requestedId
          : nextWorkbooks[0]?._id || '';
      });
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || copy.loadListError
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    setIsLoading(true);
    setErrorMessage('');
    setActiveWorkbook(null);
    setActiveWorkbookId('');
    setWorkbookPage(1);
    setWorkbookPagination(emptyRowsPagination);

    getOpportunityWorkbooks(portalId, { category: workbookCategory })
      .then((response) => {
        if (!isMounted) return;
        const nextWorkbooks = response.data || [];
        setWorkbooks(nextWorkbooks);
        setActiveWorkbookId(nextWorkbooks[0]?._id || '');
      })
      .catch((error) => {
        if (isMounted) {
          setErrorMessage(
            error.response?.data?.message ||
              copy.loadListError
          );
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [portalId, workbookCategory, copy.loadListError]);

  useEffect(() => {
    setSelectedContactRowIds([]);
    setSelectedOpportunityDetail(null);
  }, [activeWorkbookId, workbookCategory, appliedContactFilters]);

  useEffect(() => {
    if (!activeWorkbookId) return undefined;

    let isMounted = true;
    setIsWorkbookLoading(true);

    getOpportunityWorkbook({
      portalId,
      workbookId: activeWorkbookId,
      params: {
        page: workbookPage,
        limit: OPPORTUNITY_ROWS_PAGE_SIZE,
        category: workbookCategory,
        ...(isContactsLibrary && appliedContactFilters.length
          ? { filters: JSON.stringify(appliedContactFilters) }
          : {}),
      },
    })
      .then((response) => {
        if (!isMounted) return;
        setActiveWorkbook(response.data || null);
        setWorkbookPagination(response.data?.pagination || emptyRowsPagination);
        if (response.data?.pagination?.page && response.data.pagination.page !== workbookPage) {
          setWorkbookPage(response.data.pagination.page);
        }
      })
      .catch((error) => {
        if (isMounted) {
          setErrorMessage(error.response?.data?.message || 'No se pudo abrir esta página.');
        }
      })
      .finally(() => {
        if (isMounted) setIsWorkbookLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [
    activeWorkbookId,
    portalId,
    workbookPage,
    workbookCategory,
    isContactsLibrary,
    appliedContactFilters,
    workbookReloadKey,
  ]);

  useEffect(() => {
    if (!notice) return undefined;
    const timeout = window.setTimeout(() => setNotice(''), 3500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    const query = globalSearchValue.trim();

    if (query.length < 2) {
      return undefined;
    }

    let isActive = true;
    const timeout = window.setTimeout(() => {
      setIsGlobalSearching(true);
      searchOpportunityWorkbooks({ portalId, query, category: workbookCategory })
        .then((response) => {
          if (isActive) setGlobalResults(response.data || []);
        })
        .catch((error) => {
          if (isActive) {
            setGlobalResults([]);
            setGlobalSearchError(
              error.response?.data?.message || 'No se pudo buscar en todos los Excel.'
            );
          }
        })
        .finally(() => {
          if (isActive) setIsGlobalSearching(false);
        });
    }, 320);

    return () => {
      isActive = false;
      window.clearTimeout(timeout);
    };
  }, [globalSearchValue, portalId, workbookCategory]);

  const filteredRows = useMemo(() => {
    const rows = activeWorkbook?.rows || [];
    const normalizedSearch = searchValue.trim().toLocaleLowerCase('es');
    if (!normalizedSearch) return rows;

    return rows.filter((row) =>
      row.values.some((value) =>
        displayCell(value).toLocaleLowerCase('es').includes(normalizedSearch)
      )
    );
  }, [activeWorkbook, searchValue]);

  const selectedContactRows = useMemo(() => {
    const selectedIds = new Set(selectedContactRowIds);
    return (activeWorkbook?.rows || []).filter((row) => selectedIds.has(row._id));
  }, [activeWorkbook, selectedContactRowIds]);

  const visibleContactRowsAreSelected = useMemo(() => {
    if (!isContactsLibrary || !filteredRows.length) return false;
    const selectedIds = new Set(selectedContactRowIds);
    return filteredRows.every((row) => selectedIds.has(row._id));
  }, [filteredRows, isContactsLibrary, selectedContactRowIds]);

  const toggleContactRowSelection = (rowId) => {
    setSelectedContactRowIds((currentIds) =>
      currentIds.includes(rowId)
        ? currentIds.filter((currentId) => currentId !== rowId)
        : [...currentIds, rowId]
    );
  };

  const toggleVisibleContactRows = () => {
    if (!filteredRows.length) return;
    setSelectedContactRowIds((currentIds) => {
      const currentSet = new Set(currentIds);
      const allVisibleAreSelected = filteredRows.every((row) => currentSet.has(row._id));

      if (allVisibleAreSelected) {
        const visibleIds = new Set(filteredRows.map((row) => row._id));
        return currentIds.filter((rowId) => !visibleIds.has(rowId));
      }

      filteredRows.forEach((row) => currentSet.add(row._id));
      return [...currentSet];
    });
  };

  const loadInitialOpportunityOptions = async () => {
    setIsLoadingOpportunityOptions(true);
    setOpportunityPickerError('');

    try {
      const workbooksResponse = await getOpportunityWorkbooks(portalId, {
        category: 'opportunities',
      });
      const opportunityWorkbooks = workbooksResponse.data || [];

      if (!opportunityWorkbooks.length) {
        setOpportunityOptions([]);
        return;
      }

      const workbookResponses = await Promise.all(
        opportunityWorkbooks.slice(0, 4).map((workbook) =>
          getOpportunityWorkbook({
            portalId,
            workbookId: workbook._id,
            params: { page: 1, limit: 25, category: 'opportunities' },
          })
        )
      );

      setOpportunityOptions(
        workbookResponses.flatMap((response) => {
          const workbook = response.data?.workbook;
          return (response.data?.rows || []).map((row) => ({ ...row, workbook }));
        })
      );
    } catch (error) {
      setOpportunityOptions([]);
      setOpportunityPickerError(
        error.response?.data?.message || 'No se pudieron cargar las oportunidades.'
      );
    } finally {
      setIsLoadingOpportunityOptions(false);
    }
  };

  const openOpportunityPicker = async () => {
    if (!selectedContactRowIds.length) return;
    setIsOpportunityPickerOpen(true);
    setOpportunitySearchValue('');
    await loadInitialOpportunityOptions();
  };

  const closeOpportunityPicker = () => {
    if (isLinkingContacts) return;
    setIsOpportunityPickerOpen(false);
    setOpportunitySearchValue('');
    setOpportunityPickerError('');
  };

  const linkSelectedContactsToOpportunity = async (opportunity) => {
    if (!opportunity?.workbookId || !opportunity?.rowId || isLinkingContacts) return;
    setIsLinkingContacts(true);
    setOpportunityPickerError('');

    try {
      const response = await linkContactsToOpportunityRow({
        portalId,
        workbookId: opportunity.workbookId,
        rowId: opportunity.rowId,
        contactRowIds: selectedContactRowIds,
      });
      const linked = response.data?.linked || 0;
      const skipped = response.data?.skipped || 0;
      setNotice(
        skipped
          ? `${linked} contactos vinculados. ${skipped} ya estaban en esta oportunidad.`
          : `${linked} contactos vinculados a la oportunidad.`
      );
      setSelectedContactRowIds([]);
      closeOpportunityPicker();
    } catch (error) {
      setOpportunityPickerError(
        error.response?.data?.message || 'No se pudieron vincular los contactos.'
      );
    } finally {
      setIsLinkingContacts(false);
    }
  };

  const loadLinkedContactsForRows = async ({ workbookId, rowIds }) => {
    const response = await getLinkedContactsForOpportunityRows({
      portalId,
      workbookId,
      rowIds,
    });
    setLinkedContacts(response.data || []);
    return response.data || [];
  };

  const openLinkedContactsModal = async ({ rows, count }) => {
    if (!activeWorkbook?.workbook?._id || !rows?.length) return;

    const firstRow = { ...rows[0], workbook: activeWorkbook.workbook };
    const opportunity = buildOpportunityOption(firstRow);
    const rowIds = rows.map((row) => row._id);

    setLinkedContactsModal({
      title: opportunity.title,
      subtitle: opportunity.subtitle,
      count,
      workbookId: activeWorkbook.workbook._id,
      primaryRowId: rows[0]._id,
      rowIds,
    });
    setLinkedContacts([]);
    setLinkedContactsError('');
    setLinkedContactSearchValue('');
    setLinkedContactSearchResults([]);
    setIsLoadingLinkedContacts(true);

    try {
      await loadLinkedContactsForRows({
        workbookId: activeWorkbook.workbook._id,
        rowIds,
      });
    } catch (error) {
      setLinkedContactsError(
        error.response?.data?.message || 'No se pudieron cargar los contactos vinculados.'
      );
    } finally {
      setIsLoadingLinkedContacts(false);
    }
  };

  const openOpportunityDetail = ({ rows, count }) => {
    if (!activeWorkbook?.workbook?._id || !rows?.length) return;

    const rowsWithWorkbook = rows.map((row) => ({
      ...row,
      workbook: activeWorkbook.workbook,
    }));
    const opportunity = buildOpportunityOption(rowsWithWorkbook[0]);

    setSelectedOpportunityDetail({
      title: opportunity.title,
      subtitle: opportunity.subtitle,
      count: Number(count) || 0,
      rows: rowsWithWorkbook,
    });
  };

  const closeLinkedContactsModal = () => {
    setLinkedContactsModal(null);
    setLinkedContacts([]);
    setLinkedContactsError('');
    setUnlinkingContactId('');
    setLinkedContactSearchValue('');
    setLinkedContactSearchResults([]);
    setLinkingSearchContactId('');
  };

  const unlinkLinkedContact = async (linkId) => {
    if (!activeWorkbook?.workbook?._id || !linkId || unlinkingContactId) return;

    setUnlinkingContactId(linkId);
    setLinkedContactsError('');

    try {
      await unlinkContactFromOpportunityRow({
        portalId,
        workbookId: activeWorkbook.workbook._id,
        linkId,
      });
      setLinkedContacts((currentContacts) =>
        currentContacts.filter((contactLink) => contactLink.id !== linkId)
      );
      setLinkedContactsModal((currentModal) =>
        currentModal
          ? { ...currentModal, count: Math.max((currentModal.count || 1) - 1, 0) }
          : currentModal
      );
      await loadWorkbooks(activeWorkbook.workbook._id);
    } catch (error) {
      setLinkedContactsError(
        error.response?.data?.message || 'No se pudo desvincular el contacto.'
      );
    } finally {
      setUnlinkingContactId('');
    }
  };

  const linkSearchContactToCurrentOpportunity = async (contactRow) => {
    if (
      !linkedContactsModal?.workbookId ||
      !linkedContactsModal?.primaryRowId ||
      !contactRow?._id ||
      linkingSearchContactId
    ) {
      return;
    }

    setLinkingSearchContactId(contactRow._id);
    setLinkedContactsError('');

    try {
      await linkContactsToOpportunityRow({
        portalId,
        workbookId: linkedContactsModal.workbookId,
        rowId: linkedContactsModal.primaryRowId,
        contactRowIds: [contactRow._id],
      });
      const refreshedContacts = await loadLinkedContactsForRows({
        workbookId: linkedContactsModal.workbookId,
        rowIds: linkedContactsModal.rowIds,
      });
      setLinkedContactsModal((currentModal) =>
        currentModal ? { ...currentModal, count: refreshedContacts.length } : currentModal
      );
      setLinkedContactSearchResults((currentResults) =>
        currentResults.filter((result) => result._id !== contactRow._id)
      );
      await loadWorkbooks(linkedContactsModal.workbookId);
    } catch (error) {
      setLinkedContactsError(
        error.response?.data?.message || 'No se pudo vincular este contacto.'
      );
    } finally {
      setLinkingSearchContactId('');
    }
  };

  useEffect(() => {
    if (!linkedContactsModal) return undefined;

    const query = linkedContactSearchValue.trim();
    if (query.length < 2) {
      setLinkedContactSearchResults([]);
      setIsSearchingLinkedContacts(false);
      return undefined;
    }

    let isActive = true;
    const timeout = window.setTimeout(() => {
      setIsSearchingLinkedContacts(true);

      searchOpportunityWorkbooks({ portalId, query, category: 'contacts' })
        .then((response) => {
          if (!isActive) return;
          const linkedIds = new Set(
            linkedContacts.map((link) => link.contact?.rowId).filter(Boolean)
          );
          setLinkedContactSearchResults(
            (response.data || [])
              .filter((row) => !linkedIds.has(row._id))
              .slice(0, 8)
          );
        })
        .catch(() => {
          if (isActive) setLinkedContactSearchResults([]);
        })
        .finally(() => {
          if (isActive) setIsSearchingLinkedContacts(false);
        });
    }, 260);

    return () => {
      isActive = false;
      window.clearTimeout(timeout);
    };
  }, [linkedContactSearchValue, linkedContacts, linkedContactsModal, portalId]);

  useEffect(() => {
    if (!isOpportunityPickerOpen) return undefined;
    const query = opportunitySearchValue.trim();

    if (query.length < 2) {
      return undefined;
    }

    let isActive = true;
    const timeout = window.setTimeout(() => {
      setIsLoadingOpportunityOptions(true);
      setOpportunityPickerError('');

      searchOpportunityWorkbooks({ portalId, query, category: 'opportunities' })
        .then((response) => {
          if (isActive) setOpportunityOptions(response.data || []);
        })
        .catch((error) => {
          if (isActive) {
            setOpportunityOptions([]);
            setOpportunityPickerError(
              error.response?.data?.message || 'No se pudieron buscar oportunidades.'
            );
          }
        })
        .finally(() => {
          if (isActive) setIsLoadingOpportunityOptions(false);
        });
    }, 300);

    return () => {
      isActive = false;
      window.clearTimeout(timeout);
    };
  }, [isOpportunityPickerOpen, opportunitySearchValue, portalId]);

  const handleFileSelection = async (event) => {
    const files = [...(event.target.files || [])];
    event.target.value = '';
    if (!files.length) return;

    const invalidFiles = files.filter((file) => !file.name.toLowerCase().endsWith('.xlsx'));
    if (invalidFiles.length) {
      setErrorMessage('Todos los archivos deben estar en formato .xlsx.');
      return;
    }

    setIsReadingFiles(true);
    setErrorMessage('');

    const previews = [];
    const errors = [];

    for (const file of files) {
      try {
        const sheets = await readXlsxFile(file);
        const detectedTable = detectSheetTable(sheets);

        if (!detectedTable) {
          errors.push(
            `${file.name}: no se pudo detectar una tabla con cabeceras y filas de datos.`
          );
          continue;
        }

        previews.push({
          fileName: file.name,
          name: fileNameWithoutExtension(file.name),
          ...detectedTable,
        });
      } catch {
        errors.push(`${file.name}: no se pudo leer el archivo.`);
      }
    }

    setImportPreview({ files: previews, errors });
    setIsReadingFiles(false);
  };

  const handleWorkbookChange = (workbookId) => {
    if (workbookId === activeWorkbookId) return;
    setIsWorkbookLoading(true);
    setSearchValue('');
    setDraftContactFilters([{ header: '', value: '' }]);
    setAppliedContactFilters([]);
    setWorkbookPage(1);
    setWorkbookPagination(emptyRowsPagination);
    setSelectedContactRowIds([]);
    setActiveWorkbookId(workbookId);
  };

  const updateContactFilter = (index, nextFilter) => {
    setDraftContactFilters((currentFilters) =>
      currentFilters.map((filter, filterIndex) =>
        filterIndex === index ? { ...filter, ...nextFilter } : filter
      )
    );
  };

  const addContactFilter = () => {
    setDraftContactFilters((currentFilters) => [
      ...currentFilters,
      { header: visibleColumns[0]?.header || '', value: '' },
    ]);
  };

  const removeContactFilter = (index) => {
    setDraftContactFilters((currentFilters) => {
      const nextFilters = currentFilters.filter((_, filterIndex) => filterIndex !== index);
      return nextFilters.length ? nextFilters : [{ header: '', value: '' }];
    });
  };

  const applyContactFilters = () => {
    setAppliedContactFilters(readyDraftContactFilters);
    setWorkbookPage(1);
  };

  const clearContactFilters = () => {
    setDraftContactFilters([{ header: '', value: '' }]);
    setAppliedContactFilters([]);
    setWorkbookPage(1);
  };

  const openCreateRowModal = () => {
    const headers = activeWorkbook?.workbook?.headers || [];
    setRowFormValues(headers.map(() => ''));
    setRowModal({ mode: 'create', row: null });
  };

  const openEditRowModal = (row) => {
    const headers = activeWorkbook?.workbook?.headers || [];
    setRowFormValues(headers.map((_, index) => displayCell(row.values?.[index]) === '-' ? '' : displayCell(row.values?.[index])));
    setRowModal({ mode: 'edit', row });
  };

  const closeRowModal = () => {
    if (isSavingRow) return;
    setRowModal(null);
    setRowFormValues([]);
  };

  const saveContactRow = async () => {
    if (!activeWorkbook?.workbook?._id || !rowModal || isSavingRow) return;
    setIsSavingRow(true);
    setErrorMessage('');

    try {
      if (rowModal.mode === 'edit') {
        await updateOpportunityWorkbookRow({
          portalId,
          workbookId: activeWorkbook.workbook._id,
          rowId: rowModal.row._id,
          values: rowFormValues,
        });
        setNotice('Contacto actualizado correctamente.');
      } else {
        await createOpportunityWorkbookRow({
          portalId,
          workbookId: activeWorkbook.workbook._id,
          values: rowFormValues,
        });
        setNotice('Contacto anadido correctamente.');
      }

      setRowModal(null);
      setRowFormValues([]);
      setWorkbookReloadKey((current) => current + 1);
      await loadWorkbooks(activeWorkbook.workbook._id);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'No se pudo guardar el contacto.');
    } finally {
      setIsSavingRow(false);
    }
  };

  const deleteContactRow = async (row) => {
    if (!activeWorkbook?.workbook?._id || !window.confirm('Eliminar este contacto?')) return;
    setErrorMessage('');

    try {
      await deleteOpportunityWorkbookRow({
        portalId,
        workbookId: activeWorkbook.workbook._id,
        rowId: row._id,
      });
      setNotice('Contacto eliminado correctamente.');
      setWorkbookReloadKey((current) => current + 1);
      await loadWorkbooks(activeWorkbook.workbook._id);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'No se pudo eliminar el contacto.');
    }
  };

  const handleImport = async () => {
    if (!importPreview?.files.length || isImporting) return;
    setIsImporting(true);
    setErrorMessage('');

    try {
      const importedWorkbooks = [];

      for (const workbook of importPreview.files) {
        const response = await importOpportunityWorkbook({
          portalId,
          data: {
            name: workbook.name,
            sourceFileName: workbook.fileName,
            sheetName: workbook.sheetName,
            headerRow: workbook.headerRow,
            category: workbookCategory,
            headers: workbook.headers,
            rows: workbook.rows,
          },
        });
        importedWorkbooks.push(response.data);
      }

      const firstImportedId = importedWorkbooks[0]?._id || '';
      setImportPreview(null);
      setNotice(
        importedWorkbooks.length === 1
          ? copy.importSingle
          : copy.importMultiple(importedWorkbooks.length)
      );
      await loadWorkbooks(firstImportedId);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || 'No se pudieron importar todos los Excel.'
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleDelete = async () => {
    if (!workbookToDelete || isDeleting) return;
    setIsDeleting(true);

    try {
      await deleteOpportunityWorkbook({
        portalId,
        workbookId: workbookToDelete._id,
      });
      setWorkbookToDelete(null);
      setActiveWorkbook(null);
      setNotice(`La página "${workbookToDelete.name}" se ha eliminado.`);
      await loadWorkbooks();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'No se pudo eliminar la página.');
      setWorkbookToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyColumn = async (column) => {
    const columnContent = filteredRows
      .map((row) => {
        const value = row.values[column.sourceIndex];
        return value === null || value === undefined ? '' : displayCell(value);
      })
      .join('\n');

    try {
      await copyTextToClipboard(columnContent);

      setNotice(`Columna "${column.header}" copiada al portapapeles.`);
      setIsCopyMenuOpen(false);
    } catch {
      setErrorMessage('No se pudo copiar la columna. Comprueba los permisos del navegador.');
    }
  };

  const handleCopyGlobalEmail = async (email) => {
    try {
      await copyTextToClipboard(email);
      setNotice(`Mail "${email}" copiado al portapapeles.`);
    } catch {
      setErrorMessage('No se pudo copiar el mail. Comprueba los permisos del navegador.');
    }
  };

  const handleGlobalSearchChange = (value) => {
    setGlobalSearchValue(value);
    setGlobalSearchError('');

    if (value.trim().length < 2) {
      setGlobalResults([]);
      setIsGlobalSearching(false);
    }
  };

  const handleGlobalResultOpen = (workbookId) => {
    setGlobalSearchValue('');
    setGlobalResults([]);
    handleWorkbookChange(workbookId);
  };

  const visibleColumns = useMemo(
    () => {
      const headers = activeWorkbook?.workbook?.headers || [];
      return headers
        .map((header, sourceIndex) => ({ header, sourceIndex }))
        .filter((column) => !isGeneratedHeader(column.header))
        .filter(
          (column) =>
            isContactsLibrary ||
            !opportunityDetailHeaders.has(normalizeHeader(column.header))
        );
    },
    [activeWorkbook, isContactsLibrary]
  );
  const mergedTable = useMemo(
    () => buildMergedTable(filteredRows, visibleColumns),
    [filteredRows, visibleColumns]
  );
  const tableMinWidth = Math.max(
    900,
    visibleColumns.length * 220 + (isContactsLibrary ? 136 : 160)
  );
  const normalizedGlobalSearch = globalSearchValue.trim();
  const shouldShowGlobalSearch = normalizedGlobalSearch.length >= 2;

  return (
    <PortalSidebar>
      <div className="relative min-h-screen overflow-hidden bg-[#fafafa] px-3 py-4 sm:px-4 lg:px-6 xl:px-8">
        <BackgroundLines />

        <motion.main
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative z-10 mx-auto w-full max-w-[1600px]"
        >
          <section className="overflow-hidden rounded-[30px] border border-orange-100 bg-white/95 shadow-[0_24px_80px_rgba(249,115,22,0.08)]">
            <header className="flex flex-col gap-5 border-b border-orange-100 px-5 py-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-rose-400">
                  {copy.eyebrow}
                </p>
                <h1
                  style={{ fontFamily: "'AlfaSlabOne', serif" }}
                  className="mt-3 text-3xl leading-tight text-orange-950 sm:text-4xl"
                >
                  {copy.title}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-700 sm:text-base">
                  {copy.description}
                </p>
              </div>

              <input
                ref={excelInputRef}
                type="file"
                accept=".xlsx"
                multiple
                onChange={handleFileSelection}
                className="hidden"
              />
              <div className="flex w-full flex-col gap-3 lg:w-auto lg:min-w-[520px]">
                <label className="flex items-center gap-3 rounded-xl border border-orange-100 bg-white px-4 py-3 shadow-sm">
                  <Search size={17} className="text-orange-300" />
                  <input
                    value={globalSearchValue}
                    onChange={(event) => handleGlobalSearchChange(event.target.value)}
                    placeholder={copy.searchAllPlaceholder}
                    className="w-full bg-transparent text-sm text-orange-950 outline-none placeholder:text-orange-300"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => excelInputRef.current?.click()}
                  disabled={isReadingFiles}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-orange-600 hover:to-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Upload size={18} />
                  {isReadingFiles ? 'Leyendo Excel...' : 'Importar Excel'}
                </button>
              </div>
            </header>

            <AnimatePresence>
              {notice && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden border-b border-emerald-100 bg-emerald-50"
                >
                  <div className="flex items-center gap-2 px-5 py-3 text-sm font-semibold text-emerald-700">
                    <CheckCircle2 size={17} />
                    {notice}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {errorMessage && (
              <div className="flex items-center gap-2 border-b border-red-100 bg-red-50 px-5 py-3 text-sm font-semibold text-red-600">
                <AlertCircle size={17} />
                {errorMessage}
              </div>
            )}

            <div className="border-b border-orange-100 bg-orange-50/35 px-4 py-3">
              <div className="gestiona-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
                {workbooks.map((workbook) => {
                  const isActive = workbook._id === activeWorkbookId;

                  return (
                    <button
                      key={workbook._id}
                      type="button"
                      onClick={() => handleWorkbookChange(workbook._id)}
                      className={`relative flex shrink-0 cursor-pointer items-center gap-2 overflow-hidden rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                        isActive
                          ? 'border-orange-300 text-white shadow-sm'
                          : 'border-orange-100 bg-white text-orange-800 hover:bg-orange-50'
                      }`}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="active-opportunity-workbook"
                          className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500"
                          transition={{ type: 'spring', stiffness: 360, damping: 34 }}
                        />
                      )}
                      <FileSpreadsheet size={16} className="relative z-10" />
                      <span className="relative z-10 max-w-52 truncate">{workbook.name}</span>
                      <span
                        className={`relative z-10 rounded-full px-2 py-0.5 text-[11px] ${
                          isActive ? 'bg-white/20' : 'bg-orange-50 text-orange-600'
                        }`}
                      >
                        {workbook.rowCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <AnimatePresence initial={false}>
              {shouldShowGlobalSearch && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden border-b border-orange-100"
                >
                  <div className="bg-gradient-to-r from-orange-50/75 via-white to-orange-50/50 px-5 py-4">
                    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-orange-950">
                          Busqueda global
                        </p>
                        <p className="mt-1 text-xs leading-5 text-orange-500">
                          Resultados encontrados en esta biblioteca del portal.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setGlobalSearchValue('');
                          setGlobalResults([]);
                        }}
                        className="inline-flex cursor-pointer items-center gap-2 self-start rounded-xl border border-orange-100 bg-white px-3 py-2 text-xs font-semibold text-orange-700 transition hover:bg-orange-50"
                      >
                        <X size={14} />
                        Limpiar busqueda
                      </button>
                    </div>

                    {isGlobalSearching ? (
                      <div className="rounded-2xl border border-orange-100 bg-white px-4 py-5 text-sm font-semibold text-orange-500">
                        Buscando en la biblioteca...
                      </div>
                    ) : globalSearchError ? (
                      <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-5 text-sm font-semibold text-red-600">
                        {globalSearchError}
                      </div>
                    ) : globalResults.length ? (
                      <div className="grid gap-3 xl:grid-cols-2">
                        {globalResults.map((result) => {
                          const previewCells = getResultPreviewCells(result);
                          const resultEmail = getResultEmail(result);

                          return (
                            <article
                              key={result._id}
                              className="relative rounded-2xl border border-orange-100 bg-white p-4 pb-14 text-left shadow-sm transition hover:border-orange-300 hover:bg-orange-50/70"
                            >
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-orange-950">
                                    {result.workbook.name}
                                  </p>
                                  <p className="mt-1 text-xs text-orange-500">
                                    Fila {result.rowNumber} · {result.workbook.sourceFileName}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleGlobalResultOpen(result.workbook._id)}
                                  className="shrink-0 cursor-pointer rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700 transition hover:bg-orange-200"
                                >
                                  Abrir pagina
                                </button>
                              </div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {previewCells.map((cell) => (
                                  <span
                                    key={`${result._id}-${cell.header}`}
                                    className="rounded-xl border border-orange-100 bg-orange-50/70 px-3 py-2 text-xs text-orange-900"
                                  >
                                    <strong>{cell.header}:</strong> {cell.value}
                                  </span>
                                ))}
                              </div>
                              {resultEmail && (
                                <button
                                  type="button"
                                  onClick={() => handleCopyGlobalEmail(resultEmail)}
                                  className="absolute bottom-3 right-3 grid h-9 w-9 cursor-pointer place-items-center rounded-xl border border-orange-100 bg-white text-orange-500 shadow-sm transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
                                  title={`Copiar ${resultEmail}`}
                                  aria-label={`Copiar mail ${resultEmail}`}
                                >
                                  <Copy size={16} strokeWidth={2.1} />
                                </button>
                              )}
                            </article>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-orange-100 bg-white px-4 py-5 text-sm font-semibold text-orange-500">
                        No hay coincidencias en esta biblioteca.
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {isLoading ? (
              <LoadingState label={copy.loadingList} />
            ) : workbooks.length === 0 ? (
              <EmptyLibrary copy={copy} onImport={() => excelInputRef.current?.click()} />
            ) : !activeWorkbook ? (
              <LoadingState label="Abriendo Excel..." />
            ) : (
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeWorkbook.workbook._id}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="flex flex-col gap-4 border-b border-orange-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-orange-50 text-orange-500">
                          <Sheet size={20} />
                        </span>
                        <div className="min-w-0">
                          <h2 className="truncate text-lg font-semibold text-orange-950">
                            {activeWorkbook.workbook.name}
                          </h2>
                          <p className="mt-1 truncate text-xs text-orange-500">
                            {activeWorkbook.workbook.sourceFileName} · Hoja{' '}
                            {activeWorkbook.workbook.sheetName} · Cabeceras en fila{' '}
                            {activeWorkbook.workbook.headerRow}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <label className="flex min-w-[260px] items-center gap-3 rounded-xl border border-orange-100 bg-white px-4 py-3">
                        <Search size={17} className="text-orange-300" />
                        <input
                          value={searchValue}
                          onChange={(event) => setSearchValue(event.target.value)}
                          placeholder="Buscar en esta página..."
                          className="w-full bg-transparent text-sm text-orange-950 outline-none placeholder:text-orange-300"
                        />
                      </label>
                      {isContactsLibrary && (
                        <button
                          type="button"
                          onClick={openCreateRowModal}
                          className="inline-flex h-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-800 shadow-sm transition hover:border-orange-300 hover:bg-orange-100 hover:text-orange-900"
                        >
                          <Plus size={16} strokeWidth={2.1} />
                          Anadir contacto
                        </button>
                      )}
                      {isContactsLibrary && selectedContactRowIds.length > 0 && (
                        <button
                          type="button"
                          onClick={openOpportunityPicker}
                          className="inline-flex h-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-orange-600 hover:to-red-600"
                        >
                          <UserPlus size={16} strokeWidth={2.1} />
                          Anadir a oportunidad ({selectedContactRowIds.length})
                        </button>
                      )}
                      {isContactsLibrary && (
                        <button
                          type="button"
                          onClick={() => setIsFilterPanelOpen((current) => !current)}
                          className={`inline-flex h-full cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                            isFilterPanelOpen || appliedContactFilters.length
                              ? 'border-orange-300 bg-orange-50 text-orange-700'
                              : 'border-orange-100 bg-white text-orange-900 hover:bg-orange-50'
                          }`}
                          aria-expanded={isFilterPanelOpen}
                        >
                          <Filter size={16} strokeWidth={2.1} />
                          Filtrar
                          {appliedContactFilters.length > 0 && (
                            <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[11px] text-white">
                              {appliedContactFilters.length}
                            </span>
                          )}
                        </button>
                      )}
                      <div>
                        <button
                          type="button"
                          onClick={() => setIsCopyMenuOpen((current) => !current)}
                          className={`inline-flex h-full w-full cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition sm:w-auto ${
                            isCopyMenuOpen
                              ? 'border-orange-300 bg-orange-50 text-orange-700'
                              : 'border-orange-100 bg-white text-orange-900 hover:bg-orange-50'
                          }`}
                          aria-expanded={isCopyMenuOpen}
                        >
                          <Copy size={16} strokeWidth={2.1} />
                          Copiar columna
                          <ChevronDown
                            size={16}
                            className={`transition-transform duration-200 ${
                              isCopyMenuOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => setWorkbookToDelete(activeWorkbook.workbook)}
                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-100 bg-white px-4 py-3 text-sm font-semibold text-red-500 transition hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                        Eliminar página
                      </button>
                    </div>
                  </div>

                  <AnimatePresence initial={false}>
                    {isWorkbookLoading && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-b border-orange-100 bg-orange-50/55"
                      >
                        <div className="flex items-center gap-2 px-5 py-3 text-xs font-semibold text-orange-600">
                          <span className="h-2 w-2 animate-pulse rounded-full bg-orange-500" />
                          Actualizando resultados...
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence initial={false}>
                    {isContactsLibrary && isFilterPanelOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden border-b border-orange-100"
                      >
                        <div className="bg-gradient-to-r from-orange-50/75 via-white to-orange-50/45 px-5 py-4">
                          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-sm font-semibold text-orange-950">
                                Filtrar contactos
                              </p>
                              <p className="mt-1 text-xs leading-5 text-orange-500">
                                Prepara los criterios y aplica el filtro cuando lo tengas listo.
                              </p>
                            </div>
                            {appliedContactFilters.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {appliedContactFilters.map((filter) => (
                                  <span
                                    key={`${filter.header}-${filter.value}`}
                                    className="rounded-full border border-orange-100 bg-white px-3 py-1.5 text-xs font-semibold text-orange-700"
                                  >
                                    {filter.header}: {filter.value}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="space-y-3">
                            {draftContactFilters.map((filter, index) => (
                              <div
                                key={`${index}-${filter.header}`}
                                className="grid gap-3 rounded-2xl border border-orange-100 bg-white p-3 md:grid-cols-[minmax(180px,260px)_1fr_auto]"
                              >
                                <select
                                  value={filter.header}
                                  onChange={(event) =>
                                    updateContactFilter(index, { header: event.target.value })
                                  }
                                  className="h-11 rounded-xl border border-orange-100 bg-white px-3 text-sm font-semibold text-orange-950 outline-none transition focus:border-orange-300"
                                >
                                  <option value="">Columna</option>
                                  {visibleColumns.map((column) => (
                                    <option key={column.header} value={column.header}>
                                      {column.header}
                                    </option>
                                  ))}
                                </select>
                                <input
                                  value={filter.value}
                                  onChange={(event) =>
                                    updateContactFilter(index, { value: event.target.value })
                                  }
                                  onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                      event.preventDefault();
                                      applyContactFilters();
                                    }
                                  }}
                                  placeholder="Texto a buscar en esa columna..."
                                  className="h-11 rounded-xl border border-orange-100 bg-white px-3 text-sm text-orange-950 outline-none transition placeholder:text-orange-300 focus:border-orange-300"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeContactFilter(index)}
                                  className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-orange-100 px-3 text-sm font-semibold text-orange-700 transition hover:bg-orange-50"
                                >
                                  Quitar
                                </button>
                              </div>
                            ))}
                          </div>

                          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <button
                              type="button"
                              onClick={addContactFilter}
                              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-orange-100 bg-white px-4 py-2.5 text-sm font-semibold text-orange-900 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600"
                            >
                              <Filter size={14} className="text-orange-400" />
                              Anadir filtro
                            </button>
                            <div className="flex flex-col gap-2 sm:flex-row">
                              <button
                                type="button"
                                onClick={clearContactFilters}
                                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-orange-100 bg-white px-4 py-2.5 text-sm font-semibold text-orange-700 transition hover:bg-orange-50"
                              >
                                <X size={14} />
                                Limpiar
                              </button>
                              <button
                                type="button"
                                onClick={applyContactFilters}
                                disabled={readyDraftContactFilters.length === 0}
                                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-orange-600 hover:to-red-600 disabled:cursor-default disabled:opacity-45"
                              >
                                <Filter size={14} />
                                Aplicar filtros
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence initial={false}>
                    {isCopyMenuOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden border-b border-orange-100"
                      >
                        <div className="bg-gradient-to-r from-orange-50/75 via-white to-orange-50/45 px-5 py-4">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                            <div className="shrink-0 lg:w-56">
                              <p className="text-sm font-semibold text-orange-950">
                                Copiar una columna
                              </p>
                              <p className="mt-1 text-xs leading-5 text-orange-500">
                                Elige qué contenido quieres copiar al portapapeles.
                              </p>
                            </div>
                            <div className="flex flex-1 flex-wrap gap-2">
                              {visibleColumns.map((column) => (
                                <button
                                  key={column.header}
                                  type="button"
                                  onClick={() => handleCopyColumn(column)}
                                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-orange-100 bg-white px-4 py-2.5 text-sm font-semibold text-orange-900 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600"
                                >
                                  <Copy size={14} className="text-orange-400" />
                                  {column.header}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-5 transition-all duration-300">
                    <div className="min-w-0">
                      <div className="gestiona-scrollbar overflow-x-auto">
                        <div style={{ minWidth: tableMinWidth }}>
                      {filteredRows.length ? (
                        <table className="w-full table-fixed border-collapse">
                          <thead>
                            <tr className="bg-orange-500 text-center text-xs font-semibold uppercase tracking-wide text-white">
                              {isContactsLibrary && (
                                <th className="sticky left-0 z-10 w-32 border border-white/25 bg-orange-500 px-3 py-3">
                                  <button
                                    type="button"
                                    onClick={toggleVisibleContactRows}
                                    disabled={!filteredRows.length}
                                    className="mx-auto inline-flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 transition hover:bg-white/10 disabled:cursor-default disabled:opacity-50"
                                    title={
                                      visibleContactRowsAreSelected
                                        ? 'Quitar seleccion visible'
                                        : 'Seleccionar contactos visibles'
                                    }
                                  >
                                    {visibleContactRowsAreSelected ? (
                                      <CheckSquare size={15} />
                                    ) : (
                                      <Square size={15} />
                                    )}
                                    Gestion
                                  </button>
                                </th>
                              )}
                              {visibleColumns.map((column) => (
                                <th
                                  key={column.header}
                                  className="border border-white/25 px-4 py-3"
                                >
                                  {column.header}
                                </th>
                                  ))}
                              {!isContactsLibrary && (
                                <th className="w-40 border border-white/25 px-4 py-3">
                                  Contactos
                                </th>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {filteredRows.map((row, rowIndex) => {
                              const groupIsTinted = mergedTable.rowGroups[rowIndex] % 2 === 0;

                              return (
                                <tr
                                  key={row._id}
                                  className={`group text-center text-sm text-orange-950 transition hover:brightness-[0.98] ${
                                    groupIsTinted ? 'bg-orange-50' : 'bg-white'
                                  }`}
                                >
                                  {isContactsLibrary && (
                                    <td className="sticky left-0 z-10 w-32 border border-orange-100 bg-inherit px-2 py-3 align-middle">
                                      <div className="flex items-center justify-center gap-2 opacity-80 transition duration-200 group-hover:opacity-100">
                                        <button
                                          type="button"
                                          onClick={() => toggleContactRowSelection(row._id)}
                                          className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg border border-orange-100 bg-white/90 text-orange-600 shadow-sm transition hover:border-orange-300 hover:bg-orange-50 hover:shadow"
                                          title="Seleccionar contacto"
                                          aria-label="Seleccionar contacto"
                                        >
                                          {selectedContactRowIds.includes(row._id) ? (
                                            <CheckSquare size={15} strokeWidth={2.2} />
                                          ) : (
                                            <Square size={15} strokeWidth={2.2} />
                                          )}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => openEditRowModal(row)}
                                          className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg border border-orange-100 bg-white/90 text-orange-600 shadow-sm transition hover:border-orange-300 hover:bg-orange-50 hover:shadow"
                                          title="Editar contacto"
                                          aria-label="Editar contacto"
                                        >
                                          <Edit3 size={14} strokeWidth={2.1} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => deleteContactRow(row)}
                                          className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg border border-rose-100 bg-white/90 text-rose-500 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:shadow"
                                          title="Eliminar contacto"
                                          aria-label="Eliminar contacto"
                                        >
                                          <Trash2 size={14} strokeWidth={2.1} />
                                        </button>
                                      </div>
                                    </td>
                                  )}
                                  {visibleColumns.map((column, columnPosition) => {
                                    const cellKey = `${rowIndex}:${columnPosition}`;
                                    if (mergedTable.hiddenCells.has(cellKey)) return null;

                                    const rowSpan = mergedTable.spanByCell.get(cellKey) || 1;
                                    const normalizedColumnHeader = normalizeHeader(column.header);
                                    const isMergedColumn = mergeableHeaders.has(
                                      normalizedColumnHeader
                                    );
                                    const isPrimaryTopicColumn =
                                      !isContactsLibrary &&
                                      primaryGroupHeaders.has(normalizedColumnHeader);
                                    const value = displayCell(
                                      mergedTable.displayValueByCell.has(cellKey)
                                        ? mergedTable.displayValueByCell.get(cellKey)
                                        : row.values[column.sourceIndex]
                                    );
                                    const groupedRows = filteredRows.slice(
                                      rowIndex,
                                      rowIndex + rowSpan
                                    );
                                    const contactCount =
                                      mergedTable.contactCountByRow.get(rowIndex) || 0;
                                    const isSelectedTopic =
                                      isPrimaryTopicColumn &&
                                      selectedOpportunityDetail?.rows?.some(
                                        (detailRow) => detailRow._id === row._id
                                      );

                                    return (
                                      <td
                                        key={`${row._id}-${column.header}`}
                                        rowSpan={rowSpan}
                                        className={`whitespace-pre-line break-words border border-orange-100 px-4 py-3 align-middle leading-5 ${
                                          isMergedColumn && rowSpan > 1
                                            ? 'font-semibold italic text-orange-950'
                                            : ''
                                        }`}
                                        title={value}
                                      >
                                        {isPrimaryTopicColumn ? (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              openOpportunityDetail({
                                                rows: groupedRows,
                                                count: contactCount,
                                              })
                                            }
                                            className={`mx-auto block max-w-full cursor-pointer whitespace-pre-line rounded-2xl border px-4 py-3 text-center font-semibold italic transition duration-200 focus:outline-none focus:ring-2 focus:ring-orange-200 ${
                                              isSelectedTopic
                                                ? 'border-orange-200 bg-white text-orange-700 shadow-[0_10px_26px_rgba(249,115,22,0.12)]'
                                                : 'border-transparent text-orange-950 hover:border-orange-100 hover:bg-white/80 hover:text-orange-700 hover:shadow-[0_8px_22px_rgba(249,115,22,0.09)]'
                                            }`}
                                            title="Ver detalle del topic"
                                          >
                                            {value}
                                          </button>
                                        ) : (
                                          value
                                        )}
                                      </td>
                                    );
                                  })}
                                  {!isContactsLibrary &&
                                    !mergedTable.contactHiddenRows.has(rowIndex) && (
                                      <td
                                        rowSpan={mergedTable.contactSpanByRow.get(rowIndex) || 1}
                                        className="border border-orange-100 px-4 py-3 align-middle"
                                      >
                                        <div className="flex h-full min-h-14 items-center justify-center">
                                          {(() => {
                                            const contactCount =
                                              mergedTable.contactCountByRow.get(rowIndex) || 0;
                                            const rowSpan =
                                              mergedTable.contactSpanByRow.get(rowIndex) || 1;
                                            const groupedRows = filteredRows.slice(
                                              rowIndex,
                                              rowIndex + rowSpan
                                            );

                                            return contactCount > 0 ? (
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  openLinkedContactsModal({
                                                    rows: groupedRows,
                                                    count: contactCount,
                                                  })
                                                }
                                                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-orange-100 bg-white px-3 py-1.5 text-xs font-semibold text-orange-700 shadow-sm transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-800 hover:shadow-md"
                                                title="Ver contactos vinculados"
                                              >
                                                <UserPlus size={14} />
                                                {contactCount}
                                              </button>
                                            ) : (
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  openLinkedContactsModal({
                                                    rows: groupedRows,
                                                    count: 0,
                                                  })
                                                }
                                                className="inline-flex cursor-pointer items-center justify-center rounded-full border border-orange-100 bg-white px-3 py-1.5 text-orange-300 shadow-sm transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-500 hover:shadow-md"
                                                title="Sin contactos vinculados"
                                              >
                                                <UserPlus size={14} />
                                              </button>
                                            );
                                          })()}
                                        </div>
                                      </td>
                                    )}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      ) : (
                        <div className="grid min-h-64 place-items-center bg-white px-6 text-center">
                          <div>
                            <Search size={25} className="mx-auto text-orange-300" />
                            <p className="mt-3 text-lg font-semibold text-orange-950">
                              No hay coincidencias
                            </p>
                            <p className="mt-2 text-sm text-orange-500">
                              Prueba con otra búsqueda dentro de esta página.
                            </p>
                          </div>
                        </div>
                      )}
                        </div>
                      </div>

                      <RowsPagination
                        pagination={workbookPagination}
                        onPageChange={(nextPage) => {
                          setSearchValue('');
                          setSelectedOpportunityDetail(null);
                          setWorkbookPage(nextPage);
                        }}
                      />
                    </div>

                    <AnimatePresence>
                      {selectedOpportunityDetail && !isContactsLibrary && (
                        <OpportunityTopicDetailPanel
                          detail={selectedOpportunityDetail}
                          onClose={() => setSelectedOpportunityDetail(null)}
                          onOpenContacts={() =>
                            openLinkedContactsModal({
                              rows: selectedOpportunityDetail.rows,
                              count: selectedOpportunityDetail.count,
                            })
                          }
                        />
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </section>
        </motion.main>

        <AnimatePresence>
          {rowModal && activeWorkbook && (
            <ContactRowModal
              mode={rowModal.mode}
              columns={visibleColumns}
              values={rowFormValues}
              isSaving={isSavingRow}
              onChange={(sourceIndex, value) =>
                setRowFormValues((currentValues) => {
                  const nextValues = [...currentValues];
                  nextValues[sourceIndex] = value;
                  return nextValues;
                })
              }
              onCancel={closeRowModal}
              onSave={saveContactRow}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {importPreview && (
            <ImportModal
              preview={importPreview}
              copy={copy}
              isImporting={isImporting}
              onCancel={() => setImportPreview(null)}
              onImport={handleImport}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {workbookToDelete && (
            <DeleteModal
              workbook={workbookToDelete}
              isDeleting={isDeleting}
              onCancel={() => setWorkbookToDelete(null)}
              onConfirm={handleDelete}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isOpportunityPickerOpen && (
            <OpportunityPickerModal
              selectedCount={selectedContactRowIds.length}
              opportunities={opportunityOptions}
              searchValue={opportunitySearchValue}
              isLoading={isLoadingOpportunityOptions}
              isLinking={isLinkingContacts}
              errorMessage={opportunityPickerError}
              onSearchChange={setOpportunitySearchValue}
              onCancel={closeOpportunityPicker}
              onSelect={linkSelectedContactsToOpportunity}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {linkedContactsModal && (
            <LinkedContactsModal
              meta={linkedContactsModal}
              contacts={linkedContacts}
              isLoading={isLoadingLinkedContacts}
              unlinkingContactId={unlinkingContactId}
              searchValue={linkedContactSearchValue}
              searchResults={linkedContactSearchResults}
              isSearching={isSearchingLinkedContacts}
              linkingSearchContactId={linkingSearchContactId}
              errorMessage={linkedContactsError}
              onSearchChange={setLinkedContactSearchValue}
              onLinkSearchContact={linkSearchContactToCurrentOpportunity}
              onCancel={closeLinkedContactsModal}
              onUnlink={unlinkLinkedContact}
            />
          )}
        </AnimatePresence>
      </div>
    </PortalSidebar>
  );
};

const OpportunityTopicDetailPanel = ({ detail, onClose, onOpenContacts }) => {
  const detailRows = detail.rows
    .map((row) => {
      const cells = opportunityDetailColumnGroups.map((group) => ({
        label: group.label,
        value: getRowValueByHeaderNames(row, group.headers) || '-',
      }));

      return {
        id: row._id,
        cells,
        hasUsefulData: cells.some((cell) => cell.value !== '-'),
      };
    })
    .filter((row) => row.hasUsefulData);

  return (
    <motion.aside
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 18 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="min-w-0 overflow-hidden rounded-[28px] border border-orange-100 bg-white shadow-[0_24px_80px_rgba(249,115,22,0.14)]"
    >
      <div className="border-b border-orange-100 bg-gradient-to-br from-orange-50 via-white to-rose-50 px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-rose-400">
              Detalle del topic
            </p>
            <h3 className="mt-2 text-xl font-semibold leading-7 text-orange-950">
              {detail.title}
            </h3>
            {detail.subtitle && (
              <p className="mt-2 text-xs leading-5 text-orange-500">
                {detail.subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-orange-100 bg-white text-orange-700 shadow-sm transition hover:border-orange-300 hover:bg-orange-50"
            aria-label="Cerrar detalle"
            title="Cerrar detalle"
          >
            <X size={18} />
          </button>
        </div>
        <button
          type="button"
          onClick={onOpenContacts}
          className="mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm font-semibold text-orange-800 shadow-sm transition hover:border-orange-300 hover:bg-orange-50"
        >
          <UserPlus size={16} />
          Contactos vinculados
          {detail.count > 0 && (
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-700">
              {detail.count}
            </span>
          )}
        </button>
      </div>

      <div className="gestiona-scrollbar min-h-0 flex-1 overflow-y-auto p-5">
        {detailRows.length ? (
          <div className="gestiona-scrollbar overflow-x-auto rounded-2xl border border-orange-100 shadow-sm">
            <table className="w-full min-w-[900px] table-fixed border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-orange-500 to-red-500 text-left text-xs font-semibold uppercase tracking-wide text-white">
                  <th className="w-28 border border-white/20 px-4 py-3">Registro</th>
                  {opportunityDetailColumnGroups.map((group) => (
                    <th key={group.label} className="border border-white/20 px-4 py-3">
                      {group.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {detailRows.map((row, index) => (
                  <tr
                    key={row.id}
                    className={`text-sm text-orange-950 ${
                      index % 2 === 0 ? 'bg-orange-50/55' : 'bg-white'
                    }`}
                  >
                    <td className="border border-orange-100 px-4 py-4 font-semibold text-orange-600">
                      {index + 1}
                    </td>
                    {row.cells.map((cell) => (
                      <td
                        key={`${row.id}-${cell.label}`}
                        className="whitespace-pre-line break-words border border-orange-100 px-4 py-4 leading-5"
                      >
                        {cell.value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50/40 px-4 py-6 text-center">
            <ContactRound size={24} className="mx-auto text-orange-300" />
            <p className="mt-3 text-sm font-semibold text-orange-950">
              No hay datos adicionales en este topic.
            </p>
            <p className="mt-1 text-xs leading-5 text-orange-500">
              Cuando el Excel incluya nombres, roles o mails apareceran aqui.
            </p>
          </div>
        )}
      </div>
    </motion.aside>
  );
};

const BackgroundLines = () => (
  <motion.svg
    className="pointer-events-none absolute inset-0 z-0 h-full w-full select-none"
    viewBox="0 0 1440 900"
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    <motion.path
      d="M-100 165 C 180 70, 430 310, 700 200 S 1110 80, 1520 190"
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
      d="M-120 760 C 180 650, 470 810, 730 700 S 1100 520, 1540 650"
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
);

const RowsPagination = ({ pagination, onPageChange }) => {
  const currentPage = pagination?.page || 1;
  const totalPages = pagination?.totalPages || 1;
  const total = pagination?.total || 0;
  const limit = pagination?.limit || OPPORTUNITY_ROWS_PAGE_SIZE;
  const from = total ? (currentPage - 1) * limit + 1 : 0;
  const to = total ? Math.min(currentPage * limit, total) : 0;

  return (
    <div className="flex flex-col gap-3 border-t border-orange-100 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-semibold text-orange-500">
        {total ? `Mostrando filas ${from}-${to} de ${total}` : 'Sin filas para mostrar'}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!pagination?.hasPreviousPage}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-orange-100 bg-white px-3 py-2 text-sm font-semibold text-orange-900 transition hover:border-orange-300 hover:bg-orange-50 disabled:cursor-default disabled:opacity-45 disabled:hover:border-orange-100 disabled:hover:bg-white"
        >
          <ChevronLeft size={16} />
          Anterior
        </button>
        <span className="rounded-xl bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-600">
          {currentPage} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!pagination?.hasNextPage}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-orange-100 bg-white px-3 py-2 text-sm font-semibold text-orange-900 transition hover:border-orange-300 hover:bg-orange-50 disabled:cursor-default disabled:opacity-45 disabled:hover:border-orange-100 disabled:hover:bg-white"
        >
          Siguiente
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

const LoadingState = ({ label }) => (
  <div className="grid min-h-80 place-items-center bg-white px-6 text-sm font-semibold text-orange-500">
    {label}
  </div>
);

const EmptyLibrary = ({ copy, onImport }) => {
  const EmptyIcon = copy.emptyIcon;

  return (
  <div className="grid min-h-[430px] place-items-center bg-white px-6 py-12 text-center">
    <div className="max-w-lg">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-orange-50 text-orange-500">
        <EmptyIcon size={29} />
      </span>
      <h2 className="mt-5 text-2xl font-semibold text-orange-950">
        {copy.emptyTitle}
      </h2>
      <p className="mt-3 text-sm leading-6 text-orange-500">
        {copy.emptyDescription}
      </p>
      <button
        type="button"
        onClick={onImport}
        className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:from-orange-600 hover:to-red-600"
      >
        <Upload size={17} />
        Importar mis Excel
      </button>
    </div>
  </div>
  );
};

const ImportModal = ({ preview, copy, isImporting, onCancel, onImport }) => (
  <motion.div
    className="fixed inset-0 z-50 grid place-items-center bg-orange-950/45 px-4 py-6 backdrop-blur-sm"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.98 }}
      className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-2xl"
    >
      <div className="flex items-start justify-between border-b border-orange-100 bg-gradient-to-br from-orange-50 to-rose-50 px-6 py-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-400">
            Previsualización
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-orange-950">
            {copy.importTitle}
          </h2>
          <p className="mt-2 text-sm text-orange-600">
            Revisa las tablas detectadas antes de guardarlas en el portal.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          disabled={isImporting}
          className="grid h-10 w-10 cursor-pointer place-items-center rounded-xl text-orange-500 transition hover:bg-white disabled:opacity-50"
        >
          <X size={19} />
        </button>
      </div>

      <div className="gestiona-scrollbar flex-1 space-y-3 overflow-y-auto p-6">
        {preview.files.map((file) => (
          <div
            key={file.fileName}
            className="flex flex-col gap-3 rounded-2xl border border-orange-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                <FileSpreadsheet size={20} />
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-orange-950">{file.fileName}</p>
                <p className="mt-1 text-xs text-orange-500">
                  Hoja {file.sheetName} · Cabecera fila {file.headerRow}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2 text-xs font-semibold">
              <span className="rounded-full bg-orange-50 px-3 py-1.5 text-orange-600">
                {file.rows.length} filas
              </span>
              <span className="rounded-full bg-rose-50 px-3 py-1.5 text-rose-500">
                {file.headers.length} columnas
              </span>
            </div>
          </div>
        ))}

        {preview.errors.map((error) => (
          <div
            key={error}
            className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600"
          >
            <AlertCircle size={17} className="mt-0.5 shrink-0" />
            {error}
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center justify-end gap-3 border-t border-orange-100 px-6 py-4 sm:flex-row">
        <button
          type="button"
          onClick={onCancel}
          disabled={isImporting}
          className="w-full cursor-pointer rounded-xl border border-orange-100 px-5 py-3 text-sm font-semibold text-orange-950 transition hover:bg-orange-50 disabled:opacity-50 sm:w-auto"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onImport}
          disabled={isImporting || preview.files.length === 0}
          className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:from-orange-600 hover:to-red-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          <Upload size={17} />
          {isImporting
            ? 'Importando...'
            : `Importar ${preview.files.length} ${
                preview.files.length === 1 ? 'página' : 'páginas'
              }`}
        </button>
      </div>
    </motion.div>
  </motion.div>
);

const ContactRowModal = ({ mode, columns, values, isSaving, onChange, onCancel, onSave }) => (
  <motion.div
    className="fixed inset-0 z-50 grid place-items-center bg-orange-950/45 px-4 py-6 backdrop-blur-sm"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.98 }}
      className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-2xl"
    >
      <div className="flex items-start justify-between border-b border-orange-100 bg-gradient-to-br from-orange-50 to-rose-50 px-6 py-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-400">
            {mode === 'edit' ? 'Editar contacto' : 'Nuevo contacto'}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-orange-950">
            {mode === 'edit' ? 'Actualizar contacto' : 'Anadir contacto'}
          </h2>
          <p className="mt-2 text-sm text-orange-600">
            Completa los campos que quieras guardar dentro de esta pagina de contactos.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="grid h-10 w-10 cursor-pointer place-items-center rounded-xl text-orange-500 transition hover:bg-white disabled:opacity-50"
          aria-label="Cerrar formulario"
        >
          <X size={19} />
        </button>
      </div>

      <div className="gestiona-scrollbar grid flex-1 gap-4 overflow-y-auto p-6 md:grid-cols-2">
        {columns.map((column) => {
          const value = values[column.sourceIndex] || '';
          const isLongField = ['TEMATICA', 'KEYWORD', 'PROYECTOS'].includes(
            normalizeHeader(column.header)
          );

          return (
            <label
              key={column.header}
              className={isLongField ? 'md:col-span-2' : ''}
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-orange-900">
                {column.header}
              </span>
              {isLongField ? (
                <textarea
                  value={value}
                  onChange={(event) => onChange(column.sourceIndex, event.target.value)}
                  rows={4}
                  className="mt-2 w-full resize-y rounded-xl border border-orange-100 bg-white px-4 py-3 text-sm text-orange-950 outline-none transition placeholder:text-orange-300 focus:border-orange-300"
                />
              ) : (
                <input
                  value={value}
                  onChange={(event) => onChange(column.sourceIndex, event.target.value)}
                  className="mt-2 h-12 w-full rounded-xl border border-orange-100 bg-white px-4 text-sm text-orange-950 outline-none transition placeholder:text-orange-300 focus:border-orange-300"
                />
              )}
            </label>
          );
        })}
      </div>

      <div className="flex flex-col items-center justify-end gap-3 border-t border-orange-100 px-6 py-4 sm:flex-row">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="w-full cursor-pointer rounded-xl border border-orange-100 px-5 py-3 text-sm font-semibold text-orange-950 transition hover:bg-orange-50 disabled:opacity-50 sm:w-auto"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:from-orange-600 hover:to-red-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {mode === 'edit' ? <Edit3 size={17} /> : <Plus size={17} />}
          {isSaving ? 'Guardando...' : mode === 'edit' ? 'Guardar cambios' : 'Anadir contacto'}
        </button>
      </div>
    </motion.div>
  </motion.div>
);

const LinkedContactsBackground = () => (
  <>
    <motion.div
      className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_18%_28%,rgba(251,146,60,0.12),transparent_26%),radial-gradient(circle_at_82%_18%,rgba(244,63,94,0.10),transparent_24%),radial-gradient(circle_at_70%_82%,rgba(251,146,60,0.09),transparent_30%)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      aria-hidden="true"
    />
    <motion.svg
      className="pointer-events-none absolute inset-0 z-0 h-full w-full select-none"
      viewBox="0 0 1440 900"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <motion.path
        d="M-120 145 C 160 40, 400 260, 680 160 S 1100 20, 1540 190"
        fill="none"
        stroke="#fb923c"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.24 }}
        transition={{ duration: 1.55, ease: 'easeInOut' }}
      />
      <motion.path
        d="M-160 450 C 130 360, 420 545, 710 425 S 1110 310, 1550 485"
        fill="none"
        stroke="#fb7185"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.16 }}
        transition={{ duration: 1.75, ease: 'easeInOut', delay: 0.08 }}
      />
      <motion.path
        d="M-120 730 C 170 620, 470 820, 770 665 S 1110 500, 1540 640"
        fill="none"
        stroke="#fb923c"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.18 }}
        transition={{ duration: 1.95, ease: 'easeInOut', delay: 0.14 }}
      />
    </motion.svg>
  </>
);

const LinkedContactsModal = ({
  meta,
  contacts,
  isLoading,
  unlinkingContactId,
  searchValue,
  searchResults,
  isSearching,
  linkingSearchContactId,
  errorMessage,
  onSearchChange,
  onLinkSearchContact,
  onCancel,
  onUnlink,
}) => {
  const columns = useMemo(() => {
    const columnMap = new Map();

    contacts.forEach(({ contact }) => {
      (contact?.headers || []).forEach((header, sourceIndex) => {
        const label = String(header || `Columna ${sourceIndex + 1}`).trim();
        if (!label || isGeneratedHeader(label)) return;

        const key = normalizeHeader(label);
        if (!columnMap.has(key)) {
          columnMap.set(key, { key, label, sourceIndexByWorkbook: new Map() });
        }
        columnMap.get(key).sourceIndexByWorkbook.set(contact.workbookId || 'default', sourceIndex);
      });
    });

    return [...columnMap.values()];
  }, [contacts]);

  const getContactColumnValue = (contact, column) => {
    const workbookKey = contact.workbookId || 'default';
    let sourceIndex = column.sourceIndexByWorkbook.get(workbookKey);

    if (sourceIndex === undefined) {
      sourceIndex = (contact.headers || []).findIndex(
        (header) => normalizeHeader(header) === column.key
      );
    }

    return sourceIndex >= 0 ? displayCell(contact.values?.[sourceIndex]) : '-';
  };

  const describeContactResult = (row) => {
    const headers = row.workbook?.headers || [];
    const name =
      getRowValueByHeaderNames(row, ['nombre y apellidos', 'nombre', 'name']) ||
      displayCell(row.values?.find(isFilled)) ||
      'Contacto sin nombre';
    const email =
      getRowValueByHeaderNames(row, ['contacto', 'email', 'e-mail', 'mail', 'correo']) ||
      '';
    const entity =
      getRowValueByHeaderNames(row, ['entidad', 'empresa', 'entities']) ||
      row.workbook?.name ||
      'Contactos';
    const detail =
      getRowValueByHeaderNames(row, ['tematica', 'keyword', 'proyectos', 'rol']) ||
      headers.filter((header) => !isGeneratedHeader(header)).slice(0, 2).join(' · ');

    return { name, email, entity, detail };
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 14 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="relative flex h-screen w-screen flex-col overflow-hidden bg-white"
      >
        <LinkedContactsBackground />
        <div className="relative z-10 border-b border-orange-100 bg-white/95 px-6 py-5 shadow-sm backdrop-blur md:px-10">
          <div className="mx-auto flex max-w-[1800px] items-start justify-between gap-5">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-400">
                Contactos vinculados
              </p>
              <h2 className="mt-2 line-clamp-2 text-3xl font-semibold text-orange-950">
                {meta.title}
              </h2>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-orange-600">
                {meta.subtitle || 'Estos son los contactos asociados a esta oportunidad.'}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="rounded-full border border-orange-100 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 shadow-sm">
                {meta.count} contactos
              </span>
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-orange-100 bg-white px-4 py-3 text-sm font-semibold text-orange-950 shadow-sm transition hover:border-orange-200 hover:bg-orange-50"
                aria-label="Cerrar contactos vinculados"
              >
                <X size={18} />
                Cerrar
              </button>
            </div>
          </div>
        </div>

        <div className="gestiona-scrollbar relative z-10 flex-1 overflow-auto bg-white/45 px-6 py-6 md:px-10">
          {errorMessage && (
            <div className="mx-auto max-w-[1800px] rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {errorMessage}
            </div>
          )}

          <div className="mx-auto mb-5 max-w-[1800px] rounded-2xl border border-orange-100 bg-white/95 p-4 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold text-orange-950">
                  Buscar y vincular contacto
                </p>
                <p className="mt-1 text-xs text-orange-500">
                  Escribe el nombre, email, entidad o palabra clave y anadelo a este topic.
                </p>
              </div>
              <label className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-orange-100 bg-white px-4 py-3 shadow-sm lg:max-w-xl">
                <Search size={17} className="text-orange-300" />
                <input
                  value={searchValue}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder="Buscar en la biblioteca de contactos..."
                  className="w-full bg-transparent text-sm text-orange-950 outline-none placeholder:text-orange-300"
                />
              </label>
            </div>

            {searchValue.trim().length >= 2 && (
              <div className="mt-4">
                {isSearching ? (
                  <div className="rounded-xl border border-orange-100 bg-orange-50/60 px-4 py-3 text-sm font-semibold text-orange-600">
                    Buscando contactos...
                  </div>
                ) : searchResults.length ? (
                  <div className="grid gap-3 lg:grid-cols-2">
                    {searchResults.map((row) => {
                      const contact = describeContactResult(row);

                      return (
                        <div
                          key={row._id}
                          className="flex items-start justify-between gap-4 rounded-xl border border-orange-100 bg-orange-50/35 p-4"
                        >
                          <div className="min-w-0">
                            <p className="line-clamp-1 text-sm font-semibold text-orange-950">
                              {contact.name}
                            </p>
                            <p className="mt-1 line-clamp-1 text-xs text-orange-600">
                              {contact.email || 'Sin email registrado'}
                            </p>
                            <p className="mt-2 line-clamp-2 text-xs leading-5 text-orange-500">
                              {contact.entity}
                              {contact.detail ? ` · ${contact.detail}` : ''}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => onLinkSearchContact(row)}
                            disabled={linkingSearchContactId === row._id}
                            className="shrink-0 cursor-pointer rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:from-orange-600 hover:to-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {linkingSearchContactId === row._id ? 'Vinculando...' : 'Vincular'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-orange-100 bg-white px-4 py-3 text-sm text-orange-500">
                    No hay contactos que coincidan o ya estan vinculados a este topic.
                  </div>
                )}
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="mx-auto max-w-[1800px] rounded-2xl border border-orange-100 bg-orange-50/60 px-4 py-10 text-center text-sm font-semibold text-orange-600">
              Cargando contactos vinculados...
            </div>
          ) : contacts.length ? (
            <div className="mx-auto max-w-[1800px] overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm">
              <div className="gestiona-scrollbar overflow-x-auto">
                <table className="min-w-full border-collapse text-sm text-orange-950">
                  <thead className="bg-gradient-to-r from-orange-500 to-red-500 text-xs font-semibold uppercase text-white">
                    <tr>
                      <th className="border border-orange-200 px-4 py-3 text-left">
                        Gestion
                      </th>
                      <th className="border border-orange-200 px-4 py-3 text-left">
                        Origen
                      </th>
                      {columns.map((column) => (
                        <th
                          key={column.key}
                          className="border border-orange-200 px-4 py-3 text-left"
                        >
                          {column.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map(({ id, contact }, index) => (
                      <tr
                        key={id}
                        className={index % 2 === 0 ? 'bg-orange-50/35' : 'bg-white'}
                      >
                        <td className="w-28 border border-orange-100 px-4 py-3 align-middle">
                          <div className="flex h-full min-h-24 items-center justify-center">
                          <button
                            type="button"
                            onClick={() => onUnlink(id)}
                            disabled={unlinkingContactId === id}
                            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-rose-100 bg-white px-3 py-2 text-xs font-semibold text-rose-500 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                            title="Quitar contacto de esta oportunidad"
                          >
                            <Trash2 size={14} />
                            {unlinkingContactId === id ? 'Quitando...' : 'Quitar'}
                          </button>
                          </div>
                        </td>
                        <td className="min-w-52 border border-orange-100 px-4 py-3 align-top">
                          <p className="font-semibold text-orange-950">
                            {contact.workbookName || 'Contactos'}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-orange-500">
                            {contact.sourceFileName || 'Excel de contactos'}
                            {contact.rowNumber ? ` · Fila ${contact.rowNumber}` : ''}
                          </p>
                        </td>
                        {columns.map((column) => (
                          <td
                            key={`${id}-${column.key}`}
                            className="min-w-44 whitespace-pre-line break-words border border-orange-100 px-4 py-3 align-top leading-5"
                          >
                            {getContactColumnValue(contact, column)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-[1800px] rounded-2xl border border-orange-100 bg-white px-4 py-10 text-center">
              <p className="text-sm font-semibold text-orange-950">
                Aun no hay contactos vinculados
              </p>
              <p className="mt-2 text-sm text-orange-500">
                Selecciona contactos desde la biblioteca y anadelos a esta oportunidad.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const OpportunityPickerModal = ({
  selectedCount,
  opportunities,
  searchValue,
  isLoading,
  isLinking,
  errorMessage,
  onSearchChange,
  onCancel,
  onSelect,
}) => (
  <motion.div
    className="fixed inset-0 z-50 grid place-items-center bg-orange-950/45 px-4 py-6 backdrop-blur-sm"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.98 }}
      className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-2xl"
    >
      <div className="flex items-start justify-between border-b border-orange-100 bg-gradient-to-br from-orange-50 to-rose-50 px-6 py-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-400">
            Vincular contactos
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-orange-950">
            Elige una oportunidad
          </h2>
          <p className="mt-2 text-sm leading-6 text-orange-600">
            Se enlazaran {selectedCount} contactos a la oportunidad que selecciones. Los contactos
            seguiran disponibles en esta biblioteca para reutilizarlos.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLinking}
          className="grid h-10 w-10 cursor-pointer place-items-center rounded-xl text-orange-500 transition hover:bg-white disabled:opacity-50"
          aria-label="Cerrar selector"
        >
          <X size={19} />
        </button>
      </div>

      <div className="border-b border-orange-100 px-6 py-4">
        <label className="flex items-center gap-3 rounded-xl border border-orange-100 bg-white px-4 py-3 shadow-sm">
          <Search size={17} className="text-orange-300" />
          <input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar oportunidad por proyecto, empresa, topic o fila..."
            className="w-full bg-transparent text-sm text-orange-950 outline-none placeholder:text-orange-300"
            autoFocus
          />
        </label>
      </div>

      <div className="gestiona-scrollbar flex-1 overflow-y-auto p-6">
        {errorMessage && (
          <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {errorMessage}
          </div>
        )}

        {isLoading ? (
          <div className="rounded-2xl border border-orange-100 bg-orange-50/60 px-4 py-8 text-center text-sm font-semibold text-orange-600">
            Buscando oportunidades...
          </div>
        ) : opportunities.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {opportunities.map((row) => {
              const opportunity = buildOpportunityOption(row);

              return (
                <button
                  key={`${opportunity.workbookId}-${opportunity.rowId}`}
                  type="button"
                  onClick={() => onSelect(opportunity)}
                  disabled={isLinking}
                  className="group cursor-pointer rounded-2xl border border-orange-100 bg-white p-4 text-left shadow-sm transition hover:border-orange-300 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm font-semibold text-orange-950">
                        {opportunity.title}
                      </p>
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-orange-500">
                        {opportunity.subtitle}
                      </p>
                    </div>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-orange-50 text-orange-500 transition group-hover:bg-white">
                      <UserPlus size={16} />
                    </span>
                  </div>
                  {opportunity.badge && (
                    <span className="mt-4 inline-flex rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                      {opportunity.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-orange-100 bg-white px-4 py-8 text-center">
            <p className="text-sm font-semibold text-orange-950">
              No hay oportunidades disponibles
            </p>
            <p className="mt-2 text-sm text-orange-500">
              Importa un Excel en la biblioteca de oportunidades o prueba otra busqueda.
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end border-t border-orange-100 px-6 py-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLinking}
          className="cursor-pointer rounded-xl border border-orange-100 px-5 py-3 text-sm font-semibold text-orange-950 transition hover:bg-orange-50 disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    </motion.div>
  </motion.div>
);

const DeleteModal = ({ workbook, isDeleting, onCancel, onConfirm }) => (
  <motion.div
    className="fixed inset-0 z-50 grid place-items-center bg-orange-950/45 px-4 backdrop-blur-sm"
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
      <p className="text-sm font-semibold uppercase tracking-wide text-rose-400">
        Eliminar página
      </p>
      <h2 className="mt-3 text-2xl font-semibold text-orange-950">{workbook.name}</h2>
      <p className="mt-3 text-sm leading-6 text-orange-600">
        Se eliminarán sus {workbook.rowCount} filas del portal. El archivo original de tu equipo
        no se modificará.
      </p>
      <div className="mt-7 flex justify-center gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isDeleting}
          className="cursor-pointer rounded-xl border border-orange-200 px-5 py-3 text-sm font-semibold text-orange-950 transition hover:bg-orange-50 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isDeleting}
          className="cursor-pointer rounded-xl bg-gradient-to-r from-red-500 to-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:from-red-600 hover:to-orange-600 disabled:opacity-50"
        >
          {isDeleting ? 'Eliminando...' : 'Eliminar definitivamente'}
        </button>
      </div>
    </motion.div>
  </motion.div>
);

export default PortalOpportunitiesPage;
