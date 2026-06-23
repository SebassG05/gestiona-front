import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getInvitationByCode, respondToInvitation } from '../services/portalService.js';

const inputClass =
  'w-full rounded-xl border border-orange-200 bg-orange-50/70 px-4 py-3 text-sm text-orange-950 placeholder-orange-300 outline-none transition focus:border-transparent focus:ring-2 focus:ring-orange-400';

const JoinPortalPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState(searchParams.get('code') || '');
  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(Boolean(searchParams.get('code')));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadInvitation = async (nextCode = code) => {
    const normalizedCode = nextCode.trim().toUpperCase();

    if (!normalizedCode) {
      setError('Introduce un codigo de invitacion');
      setInvitation(null);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await getInvitationByCode(normalizedCode);
      setInvitation(response.data);
      setCode(normalizedCode);
    } catch (err) {
      setInvitation(null);
      setError(err.response?.data?.message || 'No se pudo recuperar la invitacion');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initialCode = searchParams.get('code');
    if (initialCode) {
      loadInvitation(initialCode);
    } else {
      setIsLoading(false);
    }
  }, [searchParams]);

  const handleAction = async (action) => {
    setIsSubmitting(true);
    setError('');

    try {
      const response = await respondToInvitation({ code, action });
      if (action === 'accept') {
        navigate(`/dashboard/portal/${response.data.portalId}`);
        return;
      }
      navigate('/dashboard/portals');
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo gestionar la invitacion');
    } finally {
      setIsSubmitting(false);
    }
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
          d="M-110 210 C 180 130, 450 310, 690 230 S 1080 90, 1540 250"
          fill="none"
          stroke="#fb923c"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.15"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.15 }}
          transition={{ duration: 1.9, ease: 'easeInOut' }}
        />
      </motion.svg>

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <Link to="/dashboard" className="inline-flex w-fit text-sm font-medium text-orange-500 transition hover:text-orange-700">
          Volver al dashboard
        </Link>

        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mt-8 max-w-3xl"
        >
          <p className="text-sm font-semibold uppercase tracking-wide text-rose-400">Unirme a un portal</p>
          <h1
            style={{ fontFamily: "'AlfaSlabOne', serif" }}
            className="mt-3 text-3xl leading-tight text-orange-950 sm:text-4xl xl:text-5xl"
          >
            Gestiona tu invitacion
          </h1>
          <p className="mt-4 text-sm leading-6 text-orange-500 sm:text-base">
            Introduce el codigo que recibiste por correo para aceptar o rechazar la invitacion.
          </p>
        </motion.header>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mt-10 rounded-2xl border border-orange-100 bg-white/90 p-5 shadow-sm sm:p-7"
        >
          <label htmlFor="invite-code" className="mb-2 block text-sm font-medium text-orange-800">
            Codigo de invitacion
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="invite-code"
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              className={inputClass}
              placeholder="AB12CD34"
            />
            <button
              type="button"
              onClick={() => loadInvitation()}
              disabled={isLoading}
              className="rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:from-orange-600 hover:to-red-600 disabled:opacity-50"
            >
              {isLoading ? 'Comprobando...' : 'Comprobar codigo'}
            </button>
          </div>

          {error && (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          {invitation && (
            <div className="mt-6 rounded-2xl border border-orange-100 bg-orange-50/40 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="inline-flex rounded-full border border-orange-200 bg-white px-3 py-1 text-xs font-semibold text-orange-700">
                    {invitation.status === 'pending' ? 'Pendiente' : invitation.status}
                  </span>
                  <h2 className="mt-4 text-2xl font-semibold text-orange-950">{invitation.portalName}</h2>
                  <p className="mt-2 text-sm text-orange-500">
                    Propietario: {invitation.owner?.username || invitation.owner?.email || 'Equipo'}
                  </p>
                </div>

                <div className="rounded-xl border border-orange-200 bg-white px-4 py-3 text-center">
                  <p className="text-xs uppercase tracking-wide text-orange-400">Codigo</p>
                  <p className="mt-1 text-lg font-semibold tracking-[0.2em] text-orange-950">{invitation.code}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {invitation.tags?.length > 0 ? (
                  invitation.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-orange-700 shadow-sm">
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-orange-300">Este portal aun no tiene tags</span>
                )}
              </div>

              {invitation.status === 'pending' && (
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => handleAction('accept')}
                    disabled={isSubmitting}
                    className="rounded-xl bg-orange-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-900 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Guardando...' : 'Aceptar invitacion'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction('reject')}
                    disabled={isSubmitting}
                    className="rounded-xl border border-orange-200 bg-white px-5 py-3 text-sm font-semibold text-orange-900 transition hover:bg-orange-50 disabled:opacity-50"
                  >
                    Rechazar invitacion
                  </button>
                </div>
              )}
            </div>
          )}
        </motion.section>
      </main>
    </div>
  );
};

export default JoinPortalPage;
