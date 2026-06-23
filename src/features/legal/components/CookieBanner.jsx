import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

const STORAGE_KEY = 'gestiona-cookie-consent';

const CookieBanner = () => {
  const [visible, setVisible] = useState(() => !localStorage.getItem(STORAGE_KEY));
  const [configOpen, setConfigOpen] = useState(false);
  const [preferences, setPreferences] = useState({
    analytics: false,
    advertising: false,
  });

  const saveConsent = (value) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    setVisible(false);
    setConfigOpen(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-5xl rounded-2xl border border-orange-100 bg-white/95 p-4 shadow-xl backdrop-blur sm:p-5"
        >
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="text-sm font-semibold text-orange-950">Política de Cookies</h2>
              <p className="mt-1 text-xs leading-6 text-orange-900/80 sm:text-sm">
                Este sitio web utiliza Cookies propias y de terceros, para recopilar información con la finalidad de mejorar nuestros servicios y mostrarle publicidad relacionada con sus preferencias, en base a un perfil elaborado a partir de sus hábitos de navegación. Puede obtener más información en la{' '}
                <Link to="/politica-cookies" className="font-semibold text-orange-600 hover:text-orange-700 hover:underline">
                  Política de Cookies
                </Link>
                .
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => saveConsent({ technical: true, analytics: true, advertising: true })}
                className="rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 text-xs font-semibold text-white transition hover:from-orange-600 hover:to-red-600"
              >
                ACEPTAR TODO
              </button>
              <button
                type="button"
                onClick={() => saveConsent({ technical: true, analytics: false, advertising: false })}
                className="rounded-lg border border-orange-200 bg-white px-4 py-2 text-xs font-semibold text-orange-900 transition hover:bg-orange-50"
              >
                RECHAZAR TODO
              </button>
              <button
                type="button"
                onClick={() => setConfigOpen((open) => !open)}
                className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-semibold text-orange-900 transition hover:bg-orange-100"
              >
                CONFIGURACIÓN
              </button>
            </div>
          </div>

          <AnimatePresence>
            {configOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="mt-4 grid gap-3 border-t border-orange-100 pt-4 sm:grid-cols-3">
                  <div className="rounded-lg bg-orange-50 p-3">
                    <p className="text-sm font-semibold text-orange-950">Técnicas</p>
                    <p className="mt-1 text-xs leading-5 text-orange-900/75">Necesarias para la navegación. Siempre activas.</p>
                  </div>
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-orange-100 p-3 text-sm text-orange-950">
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={(event) => setPreferences((prev) => ({ ...prev, analytics: event.target.checked }))}
                      className="mt-1 accent-orange-500"
                    />
                    <span>
                      <strong>Analíticas</strong>
                      <span className="block text-xs leading-5 text-orange-900/75">Permiten analizar hábitos de navegación y mejorar el servicio.</span>
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-orange-100 p-3 text-sm text-orange-950">
                    <input
                      type="checkbox"
                      checked={preferences.advertising}
                      onChange={(event) => setPreferences((prev) => ({ ...prev, advertising: event.target.checked }))}
                      className="mt-1 accent-orange-500"
                    />
                    <span>
                      <strong>Publicidad comportamental</strong>
                      <span className="block text-xs leading-5 text-orange-900/75">Permite mostrar publicidad relacionada con sus preferencias.</span>
                    </span>
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => saveConsent({ technical: true, ...preferences })}
                  className="mt-3 rounded-lg bg-orange-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-orange-900"
                >
                  GUARDAR CONFIGURACIÓN
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieBanner;
