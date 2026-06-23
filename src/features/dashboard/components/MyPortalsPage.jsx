import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useMyPortals } from '../hooks/useMyPortals.js';

const badgeStyles = {
  'Creado por ti': 'bg-orange-50 text-orange-700 border-orange-200',
  'Invitado': 'bg-rose-50 text-rose-600 border-rose-200',
  Miembro: 'bg-yellow-50 text-yellow-700 border-yellow-200',
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
  },
};

const MyPortalsPage = () => {
  const navigate = useNavigate();
  const { portals, isLoading, error, deletingPortalId, removePortal } = useMyPortals();
  const [portalToDelete, setPortalToDelete] = useState(null);

  const handleDeletePortal = (portal) => {
    setPortalToDelete(portal);
  };

  const confirmDeletePortal = async () => {
    if (!portalToDelete) return;

    await removePortal(portalToDelete.id);
    setPortalToDelete(null);
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#fafafa]">
      <motion.svg
        className="absolute inset-0 z-0 h-full w-full pointer-events-none select-none"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <motion.path
          d="M-120 210 C 250 120, 430 320, 710 220 S 1100 70, 1560 230"
          fill="none"
          stroke="#fb923c"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.16"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.16 }}
          transition={{ duration: 1.9, ease: 'easeInOut' }}
        />
        <motion.path
          d="M-90 760 C 220 610, 500 810, 760 680 S 1080 530, 1540 690"
          fill="none"
          stroke="#fb7185"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.16"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.16 }}
          transition={{ duration: 2.1, ease: 'easeInOut', delay: 0.2 }}
        />
      </motion.svg>

      <main className="relative z-10 mx-auto min-h-screen w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link to="/dashboard" className="inline-flex text-sm font-medium text-orange-500 transition hover:text-orange-700">
          Volver al dashboard
        </Link>

        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mt-8 max-w-3xl"
        >
          <p className="text-sm font-semibold uppercase tracking-wide text-rose-400">Mis Portales</p>
          <h1
            style={{ fontFamily: "'AlfaSlabOne', serif" }}
            className="mt-3 text-3xl leading-tight text-orange-950 sm:text-4xl xl:text-5xl"
          >
            Estos son tus portales
          </h1>
          <p className="mt-4 text-sm leading-6 text-orange-500 sm:text-base">
            Aquí verás los portales que has creado y aquellos a los que te han invitado.
          </p>
        </motion.header>

        <section className="mt-10">
          {error && (
            <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-56 animate-pulse rounded-2xl border border-orange-100 bg-white/80" />
              ))}
            </div>
          ) : portals.length === 0 ? (
            <div className="rounded-2xl border border-orange-100 bg-white/90 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-orange-950">Aún no tienes portales</h2>
              <p className="mt-2 text-sm text-orange-500">
                Crea uno nuevo o espera a que te inviten para que aparezca aquí.
              </p>
              <Link
                to="/dashboard/create"
                className="mt-4 inline-flex rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:from-orange-600 hover:to-red-600"
              >
                Crear portal
              </Link>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
            >
              {portals.map((portal) => (
                <motion.article
                  key={portal.id}
                  variants={itemVariants}
                  className="group flex flex-col rounded-2xl border border-orange-100 bg-white/90 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3 border-b border-orange-100 p-5">
                    <div>
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold ${badgeStyles[portal.accessLabel] || badgeStyles.Miembro}`}
                      >
                        {portal.accessLabel}
                      </span>
                      <h2 className="mt-4 text-lg font-semibold text-orange-950">{portal.name}</h2>
                    </div>
                    <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-500">
                      {portal.tags.length} tags
                    </span>
                  </div>

                  <div className="flex-1 p-5">
                    <p className="text-sm text-orange-500">
                      {portal.owner?.username
                        ? `Propietario: ${portal.owner.username}`
                        : 'Propietario del portal'}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {portal.tags.length > 0 ? (
                        portal.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700"
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-orange-300">Sin tags todavía</span>
                      )}
                    </div>

                    <p className="mt-4 text-xs text-orange-400">
                      Creado el {new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' }).format(new Date(portal.createdAt))}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-5">
                    <button
                      type="button"
                      onClick={() => navigate(`/dashboard/portal/${portal.id}`)}
                      className="text-sm font-medium text-orange-400 transition hover:text-orange-600"
                    >
                      Entrar al portal
                    </button>

                    {portal.accessLabel === 'Creado por ti' && (
                      <button
                        type="button"
                        onClick={() => handleDeletePortal(portal)}
                        disabled={deletingPortalId === portal.id}
                        className="cursor-pointer rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-500 transition hover:border-red-200 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingPortalId === portal.id ? 'Eliminando...' : 'Eliminar'}
                      </button>
                    )}
                  </div>
                </motion.article>
              ))}
            </motion.div>
          )}
        </section>
      </main>

      <AnimatePresence>
        {portalToDelete && (
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
              <p className="text-sm font-semibold uppercase tracking-wide text-rose-400">Eliminar portal</p>
              <h2 className="mt-3 text-2xl font-semibold text-orange-950">{portalToDelete.name}</h2>
              <p className="mt-3 text-sm leading-6 text-orange-500">
                Vas a eliminar este portal y dejará de aparecer para sus miembros. Esta acción no se puede deshacer.
              </p>

              <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setPortalToDelete(null)}
                  className="w-full cursor-pointer rounded-xl border border-orange-200 bg-white px-5 py-3 text-sm font-semibold text-orange-900 transition duration-200 hover:-translate-y-0.5 hover:bg-orange-50 active:translate-y-0 sm:w-auto"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmDeletePortal}
                  disabled={deletingPortalId === portalToDelete.id}
                  className="w-full cursor-pointer rounded-xl bg-gradient-to-r from-red-500 to-orange-500 px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:from-red-600 hover:to-orange-600 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {deletingPortalId === portalToDelete.id ? 'Eliminando...' : 'Eliminar definitivamente'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyPortalsPage;
