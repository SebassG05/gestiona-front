import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCreatePortal } from '../hooks/useCreatePortal.js';

const inputClass =
  'w-full rounded-xl border border-orange-200 bg-orange-50/70 px-4 py-3 text-sm text-orange-950 placeholder-orange-300 outline-none transition focus:border-transparent focus:ring-2 focus:ring-orange-400';

const chipClass =
  'inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-3 py-1.5 text-xs font-medium text-orange-800 shadow-sm';

const CreatePortalPage = () => {
  const [portalName, setPortalName] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [emailInput, setEmailInput] = useState('');
  const [invites, setInvites] = useState([]);
  const { submitPortal, error, isLoading } = useCreatePortal();

  const addTag = () => {
    const nextTag = tagInput.trim();
    if (!nextTag || tags.includes(nextTag)) return;
    setTags((prev) => [...prev, nextTag]);
    setTagInput('');
  };

  const addInvite = () => {
    const nextEmail = emailInput.trim().toLowerCase();
    if (!nextEmail || invites.includes(nextEmail) || !/^\S+@\S+\.\S+$/.test(nextEmail)) return;
    setInvites((prev) => [...prev, nextEmail]);
    setEmailInput('');
  };

  const handleKeyDown = (event, action) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      action();
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    submitPortal({
      name: portalName.trim(),
      tags,
      invites,
    });
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
          d="M-120 190 C 210 90, 430 310, 690 210 S 1080 60, 1560 240"
          fill="none"
          stroke="#fb7185"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.16"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.16 }}
          transition={{ duration: 1.9, ease: 'easeInOut' }}
        />
        <motion.path
          d="M-80 740 C 220 590, 480 790, 740 650 S 1080 520, 1520 680"
          fill="none"
          stroke="#fb923c"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.18"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.18 }}
          transition={{ duration: 2.1, ease: 'easeInOut', delay: 0.25 }}
        />
      </motion.svg>

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <Link to="/dashboard" className="mb-8 inline-flex w-fit text-sm font-medium text-orange-500 transition hover:text-orange-700">
          Volver al dashboard
        </Link>

        <motion.header
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-wide text-rose-400">Crear nuevo portal</p>
          <h1
            style={{ fontFamily: "'AlfaSlabOne', serif" }}
            className="mt-3 text-3xl leading-tight text-orange-950 sm:text-4xl xl:text-5xl"
          >
            Antes de nada, empecemos a personalizar tu portal
          </h1>
          <p className="mt-4 text-sm leading-6 text-orange-500 sm:text-base">
            Dale un nombre, organiza sus etiquetas y decide si quieres invitar a tu equipo desde el inicio.
          </p>
        </motion.header>

        <motion.form
          id="create-portal-form"
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="mt-10 grid flex-1 items-start gap-6 lg:grid-cols-2"
        >
          <section className="rounded-2xl border border-orange-100 bg-white/90 p-5 shadow-sm sm:p-7">
            <div className="mb-6">
              <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-500">Texto 1</span>
              <h2 className="mt-4 text-2xl font-semibold text-orange-950">Nombre y tags</h2>
              <p className="mt-2 text-sm leading-6 text-orange-500">
                Define cómo se verá tu portal y añade etiquetas para identificarlo rápido.
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label htmlFor="portal-name" className="mb-2 block text-sm font-medium text-orange-800">
                  Nombre del portal
                </label>
                <input
                  id="portal-name"
                  value={portalName}
                  onChange={(event) => setPortalName(event.target.value)}
                  className={inputClass}
                  placeholder="Ej. Portal de clientes"
                />
              </div>

              <div>
                <label htmlFor="portal-tags" className="mb-2 block text-sm font-medium text-orange-800">
                  Tags
                </label>
                <div className="flex gap-2">
                  <input
                    id="portal-tags"
                    value={tagInput}
                    onChange={(event) => setTagInput(event.target.value)}
                    onKeyDown={(event) => handleKeyDown(event, addTag)}
                    className={inputClass}
                    placeholder="Finanzas, clientes, interno..."
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-4 text-sm font-semibold text-white transition hover:from-orange-600 hover:to-red-600"
                  >
                    Añadir
                  </button>
                </div>

                <div className="mt-4 flex min-h-10 flex-wrap gap-2">
                  {tags.length === 0 ? (
                    <p className="text-xs text-orange-300">Los tags que añadas aparecerán aquí.</p>
                  ) : (
                    tags.map((tag) => (
                      <span key={tag} className={chipClass}>
                        {tag}
                        <button
                          type="button"
                          onClick={() => setTags((prev) => prev.filter((item) => item !== tag))}
                          className="text-orange-300 transition hover:text-red-500"
                          aria-label={`Eliminar tag ${tag}`}
                        >
                          ×
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-rose-100 bg-white/90 p-5 shadow-sm sm:p-7">
            <div className="mb-6">
              <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-400">Texto 2</span>
              <h2 className="mt-4 text-2xl font-semibold text-orange-950">Invitar personas</h2>
              <p className="mt-2 text-sm leading-6 text-orange-500">
                Si quieres, añade los correos de las personas que participarán en este portal.
              </p>
            </div>

            <div>
              <label htmlFor="portal-invites" className="mb-2 block text-sm font-medium text-orange-800">
                Emails de invitación
              </label>
              <div className="flex gap-2">
                <input
                  id="portal-invites"
                  value={emailInput}
                  onChange={(event) => setEmailInput(event.target.value)}
                  onKeyDown={(event) => handleKeyDown(event, addInvite)}
                  className={inputClass}
                  placeholder="persona@email.com"
                  type="email"
                />
                <button
                  type="button"
                  onClick={addInvite}
                  className="rounded-xl bg-gradient-to-r from-rose-400 to-orange-500 px-4 text-sm font-semibold text-white transition hover:from-rose-500 hover:to-orange-600"
                >
                  Invitar
                </button>
              </div>

              <div className="mt-4 flex min-h-36 flex-col gap-2 rounded-xl border border-orange-100 bg-orange-50/40 p-3">
                {invites.length === 0 ? (
                  <p className="text-xs text-orange-300">Aún no hay invitaciones. Puedes saltarte este paso y añadirlas más tarde.</p>
                ) : (
                  invites.map((email) => (
                    <div key={email} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm text-orange-900 shadow-sm">
                      <span>{email}</span>
                      <button
                        type="button"
                        onClick={() => setInvites((prev) => prev.filter((item) => item !== email))}
                        className="text-orange-300 transition hover:text-red-500"
                        aria-label={`Eliminar invitación ${email}`}
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </motion.form>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
          className="mt-6 flex flex-col items-stretch justify-between gap-3 rounded-2xl border border-orange-100 bg-white/80 p-4 shadow-sm sm:flex-row sm:items-center"
        >
          <p className="text-sm text-orange-500">
            {portalName ? `Portal: ${portalName}` : 'Cuando tengas lo básico, seguimos con las utilidades del portal.'}
          </p>
          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
          <button
            type="submit"
            form="create-portal-form"
            className="rounded-xl bg-orange-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-900 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!portalName.trim() || isLoading}
          >
            {isLoading ? 'Creando portal...' : 'Continuar'}
          </button>
        </motion.div>
      </main>
    </div>
  );
};

export default CreatePortalPage;
