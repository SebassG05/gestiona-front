import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Download, FileText, History, Loader2, RefreshCw, Trash2, UploadCloud } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import PortalSidebar from './PortalSidebar.jsx';
import { deleteOpportunityConceptNote, downloadOpportunityConceptNote, downloadOpportunityConceptNoteVersion, getOpportunityConceptNote, saveOpportunityConceptNote } from '../services/opportunityWorkbookService.js';

const normalize = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
const formatSize = (bytes) => bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(2)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
const formatDate = (value) => value ? new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '-';

const OpportunityConceptNotePage = () => {
  const { portalId, workbookId, rowId } = useParams();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [note, setNote] = useState(null);
  const [opportunity, setOpportunity] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    setIsLoading(true); setError('');
    try {
      const response = await getOpportunityConceptNote({ portalId, workbookId, rowId });
      setOpportunity(response.data?.opportunity || null);
      setNote(response.data?.conceptNote || null);
    } catch (requestError) { setError(requestError.response?.data?.message || 'No se pudo abrir el Concept Note.'); }
    finally { setIsLoading(false); }
  };
  useEffect(() => { load(); }, [portalId, workbookId, rowId]);

  const opportunityTitle = useMemo(() => {
    const headers = opportunity?.workbook?.headers || [];
    const index = headers.findIndex((header) => ['PROYECTOS', 'PROYECTO', 'NOMBRE', 'TOPIC'].includes(normalize(header)));
    return String(opportunity?.values?.[index >= 0 ? index : 0] || `Oportunidad fila ${opportunity?.rowNumber || ''}`);
  }, [opportunity]);
  const hasFile = Boolean(note?.fileName && note?.fileSize);

  const upload = async (file) => {
    if (!file) return;
    if (!/\.(docx|doc|pdf)$/i.test(file.name)) { setError('Selecciona un archivo .docx, .doc o .pdf.'); return; }
    if (file.size > 7 * 1024 * 1024) { setError('El archivo no puede superar 7 MB.'); return; }
    setIsUploading(true); setError(''); setNotice('');
    try {
      const fileBase64 = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1] || ''); reader.onerror = reject; reader.readAsDataURL(file); });
      const response = await saveOpportunityConceptNote({ portalId, workbookId, rowId, data: { fileName: file.name, mimeType: file.type || 'application/octet-stream', fileBase64, title: file.name.replace(/\.(docx|doc|pdf)$/i, '') } });
      setNote(response.data); setNotice(hasFile ? 'Nueva versiÃ³n aÃ±adida correctamente. La anterior sigue disponible.' : 'Concept Note importado correctamente.');
    } catch (requestError) { setError(requestError.response?.data?.message || 'No se pudo importar el Concept Note.'); }
    finally { setIsUploading(false); }
  };

  const download = async () => {
    setIsDownloading(true); setError('');
    try {
      const response = await downloadOpportunityConceptNote({ portalId, workbookId, rowId });
      const url = URL.createObjectURL(response.data); const link = document.createElement('a'); link.href = url; link.download = note.fileName; link.click(); URL.revokeObjectURL(url);
    } catch (requestError) { setError(requestError.response?.data?.message || 'No se pudo descargar el archivo.'); }
    finally { setIsDownloading(false); }
  };

  const downloadVersion = async (version) => {
    if (!version.versionId) return;
    try {
      const response = await downloadOpportunityConceptNoteVersion({ portalId, workbookId, rowId, versionId: version.versionId });
      const url = URL.createObjectURL(response.data); const link = document.createElement('a'); link.href = url; link.download = version.fileName || 'Concept_Note_anterior'; link.click(); URL.revokeObjectURL(url);
    } catch (requestError) { setError(requestError.response?.data?.message || 'No se pudo descargar esta versiÃ³n.'); }
  };

  const remove = async () => {
    if (!window.confirm('Â¿Quitar este Concept Note de la oportunidad?')) return;
    try { await deleteOpportunityConceptNote({ portalId, workbookId, rowId }); setNote({ status: 'draft', versions: [] }); setNotice('Concept Note eliminado.'); }
    catch (requestError) { setError(requestError.response?.data?.message || 'No se pudo eliminar el archivo.'); }
  };

  return <PortalSidebar><div className="min-h-screen bg-[#fafafa] px-4 py-5 lg:px-8"><main className="mx-auto max-w-[1300px]">
    <button type="button" onClick={() => navigate(`/dashboard/portal/${portalId}/opportunities`)} className="mb-4 inline-flex items-center gap-2 rounded-xl border border-orange-100 bg-white px-4 py-2.5 text-sm font-semibold text-orange-700 shadow-sm hover:bg-orange-50"><ArrowLeft size={17} /> Volver a oportunidades</button>
    <section className="overflow-hidden rounded-[30px] border border-orange-100 bg-white shadow-[0_24px_80px_rgba(249,115,22,0.09)]">
      <header className="border-b border-orange-100 bg-gradient-to-br from-orange-50 via-white to-rose-50 px-6 py-7 lg:px-9"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-rose-400"><FileText size={16} /> Concept Note</p><h1 className="mt-3 text-2xl font-bold leading-tight text-orange-950 lg:text-3xl">{opportunityTitle}</h1><p className="mt-2 text-sm text-orange-500">{opportunity?.workbook?.name} Â· Fila {opportunity?.rowNumber}</p></header>
      {isLoading ? <div className="grid min-h-[420px] place-items-center text-orange-500"><Loader2 className="animate-spin" size={30} /></div> : <div className="space-y-5 p-6 lg:p-9">
        {error && <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div>}{notice && <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{notice}</div>}
        {hasFile ? <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm"><div className="flex flex-col gap-5 bg-gradient-to-r from-emerald-50 via-white to-orange-50 p-6 sm:flex-row sm:items-center"><span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-emerald-500 text-white shadow-lg"><FileText size={30} /></span><div className="min-w-0 flex-1"><span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700"><CheckCircle2 size={14} /> Documento importado</span><h2 className="mt-3 truncate text-xl font-bold text-orange-950">{note.fileName}</h2><p className="mt-1 text-sm text-orange-500">{formatSize(note.fileSize)} Â· Actualizado {formatDate(note.updatedAt)}</p></div></div><div className="flex flex-wrap gap-3 border-t border-orange-100 p-5"><button type="button" onClick={download} disabled={isDownloading} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"><Download size={17} /> {isDownloading ? 'Descargando...' : 'Descargar'}</button><button type="button" onClick={() => inputRef.current?.click()} disabled={isUploading} className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-5 py-3 text-sm font-semibold text-orange-700"><RefreshCw size={17} /> Subir nueva versión</button><button type="button" onClick={remove} className="ml-auto inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50"><Trash2 size={17} /> Quitar</button></div></motion.div> : <div onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setIsDragging(false)} onDrop={(event) => { event.preventDefault(); setIsDragging(false); upload(event.dataTransfer.files?.[0]); }} className={`grid min-h-[360px] place-items-center rounded-3xl border-2 border-dashed p-8 text-center transition ${isDragging ? 'border-orange-500 bg-orange-50' : 'border-orange-200 bg-orange-50/30'}`}><div className="max-w-lg"><span className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-xl"><UploadCloud size={35} /></span><h2 className="mt-6 text-2xl font-bold text-orange-950">Importar Concept Note terminado</h2><p className="mt-3 text-sm leading-6 text-orange-500">Arrastra aquÃ­ el documento ya preparado o selecciÃ³nalo desde tu equipo. Formatos permitidos: Word y PDF, hasta 7 MB.</p><button type="button" onClick={() => inputRef.current?.click()} disabled={isUploading} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-semibold text-white shadow-sm disabled:opacity-50">{isUploading ? <Loader2 className="animate-spin" size={18} /> : <UploadCloud size={18} />}{isUploading ? 'Importando...' : 'Seleccionar archivo'}</button></div></div>}
        {note?.versions?.length > 0 && <div className="rounded-2xl border border-orange-100 bg-orange-50/30 p-5"><p className="flex items-center gap-2 text-sm font-bold text-orange-950"><History size={17} /> Versiones anteriores</p><p className="mt-1 text-xs text-orange-500">Todos los miembros del portal pueden consultar y descargar estas versiones.</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{[...note.versions].reverse().map((version, index) => <div key={`${version.versionId || version.savedAt}-${index}`} className="flex items-center gap-3 rounded-xl border border-orange-100 bg-white px-4 py-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-orange-900">{version.fileName || 'VersiÃ³n anterior'}</p><p className="mt-1 text-xs text-orange-400">{formatSize(version.fileSize || 0)} Â· {formatDate(version.savedAt)}</p></div><button type="button" onClick={() => downloadVersion(version)} disabled={!version.versionId} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-orange-100 text-orange-600 hover:bg-orange-50 disabled:opacity-30" title="Descargar esta versiÃ³n"><Download size={16} /></button></div>)}</div></div>}
        <input ref={inputRef} type="file" accept=".doc,.docx,.pdf" onChange={(event) => { upload(event.target.files?.[0]); event.target.value = ''; }} className="hidden" />
      </div>}
    </section>
  </main></div></PortalSidebar>;
};

export default OpportunityConceptNotePage;

