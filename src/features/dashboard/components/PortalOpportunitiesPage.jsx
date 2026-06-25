import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import readXlsxFile from 'read-excel-file/browser';
import {
  AlertCircle,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  Copy,
  FileSpreadsheet,
  Search,
  Sheet,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import PortalSidebar from './PortalSidebar.jsx';
import {
  deleteOpportunityWorkbook,
  getOpportunityWorkbook,
  getOpportunityWorkbooks,
  importOpportunityWorkbook,
} from '../services/opportunityWorkbookService.js';

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

const isGeneratedHeader = (header) => /^Columna \d+(?: \(\d+\))?$/i.test(header);

const primaryGroupHeaders = new Set(['PROYECTO', 'PROYECTOS']);
const mergeableHeaders = new Set([
  ...primaryGroupHeaders,
  'PROYECTO RELACIONADO',
  'PROYECTOS RELACIONADOS',
]);

const buildMergedTable = (rows, columns) => {
  const spanByCell = new Map();
  const hiddenCells = new Set();

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

  return { spanByCell, hiddenCells, rowGroups };
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

const PortalOpportunitiesPage = () => {
  const { portalId } = useParams();
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

  const loadWorkbooks = async (preferredWorkbookId = '') => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await getOpportunityWorkbooks(portalId);
      const nextWorkbooks = response.data || [];
      setWorkbooks(nextWorkbooks);
      setActiveWorkbookId((current) => {
        const requestedId = preferredWorkbookId || current;
        return nextWorkbooks.some((workbook) => workbook._id === requestedId)
          ? requestedId
          : nextWorkbooks[0]?._id || '';
      });
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || 'No se pudieron cargar las páginas de oportunidades.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    getOpportunityWorkbooks(portalId)
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
              'No se pudieron cargar las páginas de oportunidades.'
          );
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [portalId]);

  useEffect(() => {
    if (!activeWorkbookId) return undefined;

    let isMounted = true;

    getOpportunityWorkbook({ portalId, workbookId: activeWorkbookId })
      .then((response) => {
        if (isMounted) setActiveWorkbook(response.data || null);
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
  }, [activeWorkbookId, portalId]);

  useEffect(() => {
    if (!notice) return undefined;
    const timeout = window.setTimeout(() => setNotice(''), 3500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

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
    setActiveWorkbookId(workbookId);
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
          ? 'La página de oportunidades se ha importado correctamente.'
          : `${importedWorkbooks.length} páginas de oportunidades importadas correctamente.`
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
    const columnContent = (activeWorkbook?.rows || [])
      .map((row) => {
        const value = row.values[column.sourceIndex];
        return value === null || value === undefined ? '' : displayCell(value);
      })
      .join('\n');

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(columnContent);
      } else {
        const temporaryTextarea = document.createElement('textarea');
        temporaryTextarea.value = columnContent;
        temporaryTextarea.setAttribute('readonly', '');
        temporaryTextarea.style.position = 'fixed';
        temporaryTextarea.style.opacity = '0';
        document.body.appendChild(temporaryTextarea);
        temporaryTextarea.select();
        document.execCommand('copy');
        temporaryTextarea.remove();
      }

      setNotice(`Columna "${column.header}" copiada al portapapeles.`);
      setIsCopyMenuOpen(false);
    } catch {
      setErrorMessage('No se pudo copiar la columna. Comprueba los permisos del navegador.');
    }
  };

  const visibleColumns = useMemo(
    () => {
      const headers = activeWorkbook?.workbook?.headers || [];
      return headers
        .map((header, sourceIndex) => ({ header, sourceIndex }))
        .filter((column) => !isGeneratedHeader(column.header));
    },
    [activeWorkbook]
  );
  const mergedTable = useMemo(
    () => buildMergedTable(filteredRows, visibleColumns),
    [filteredRows, visibleColumns]
  );
  const tableMinWidth = Math.max(900, visibleColumns.length * 220);

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
                  Oportunidades
                </p>
                <h1
                  style={{ fontFamily: "'AlfaSlabOne', serif" }}
                  className="mt-3 text-3xl leading-tight text-orange-950 sm:text-4xl"
                >
                  Biblioteca de oportunidades
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-700 sm:text-base">
                  Importa varios Excel y consulta cada uno como una página independiente dentro
                  del portal.
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
              <button
                type="button"
                onClick={() => excelInputRef.current?.click()}
                disabled={isReadingFiles}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-orange-600 hover:to-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Upload size={18} />
                {isReadingFiles ? 'Leyendo Excel...' : 'Importar Excel'}
              </button>
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

            {isLoading ? (
              <LoadingState label="Cargando páginas de oportunidades..." />
            ) : workbooks.length === 0 ? (
              <EmptyLibrary onImport={() => excelInputRef.current?.click()} />
            ) : isWorkbookLoading || !activeWorkbook ? (
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

                  <div className="gestiona-scrollbar overflow-x-auto">
                    <div style={{ minWidth: tableMinWidth }}>
                      {filteredRows.length ? (
                        <table className="w-full table-fixed border-collapse">
                          <thead>
                            <tr className="bg-orange-500 text-center text-xs font-semibold uppercase tracking-wide text-white">
                              {visibleColumns.map((column) => (
                                <th
                                  key={column.header}
                                  className="border border-white/25 px-4 py-3"
                                >
                                  {column.header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {filteredRows.map((row, rowIndex) => {
                              const groupIsTinted = mergedTable.rowGroups[rowIndex] % 2 === 0;

                              return (
                                <tr
                                  key={row._id}
                                  className={`text-center text-sm text-orange-950 transition hover:brightness-[0.98] ${
                                    groupIsTinted ? 'bg-orange-50' : 'bg-white'
                                  }`}
                                >
                                  {visibleColumns.map((column, columnPosition) => {
                                    const cellKey = `${rowIndex}:${columnPosition}`;
                                    if (mergedTable.hiddenCells.has(cellKey)) return null;

                                    const rowSpan = mergedTable.spanByCell.get(cellKey) || 1;
                                    const isMergedColumn = mergeableHeaders.has(
                                      normalizeHeader(column.header)
                                    );
                                    const value = displayCell(row.values[column.sourceIndex]);

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
                                        {value}
                                      </td>
                                    );
                                  })}
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
                </motion.div>
              </AnimatePresence>
            )}
          </section>
        </motion.main>

        <AnimatePresence>
          {importPreview && (
            <ImportModal
              preview={importPreview}
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
      </div>
    </PortalSidebar>
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

const LoadingState = ({ label }) => (
  <div className="grid min-h-80 place-items-center bg-white px-6 text-sm font-semibold text-orange-500">
    {label}
  </div>
);

const EmptyLibrary = ({ onImport }) => (
  <div className="grid min-h-[430px] place-items-center bg-white px-6 py-12 text-center">
    <div className="max-w-lg">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-orange-50 text-orange-500">
        <BriefcaseBusiness size={29} />
      </span>
      <h2 className="mt-5 text-2xl font-semibold text-orange-950">
        Todavía no hay páginas de oportunidades
      </h2>
      <p className="mt-3 text-sm leading-6 text-orange-500">
        Puedes seleccionar varios Excel a la vez. Cada archivo se guardará como una página
        independiente.
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

const ImportModal = ({ preview, isImporting, onCancel, onImport }) => (
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
            Importar páginas de oportunidades
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
