import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLogin } from "../hooks/useLogin.js";
import { useRegister } from "../hooks/useRegister.js";
import { useGoogleAuth } from "../hooks/useGoogleAuth.js";

const bars = [
  { height: 200,  gradient: "linear-gradient(to bottom, #ffe380, #b38b00, #FFA500)", delay: 0.22 },
  { height: 400, gradient: "linear-gradient(to top, #73ff00, #ffc800, #FFA500)", delay: 0 },
  { height: 360, gradient: "linear-gradient(to top, #e11d48, #a54290, #ff3fd5)", delay: 0.44 },
  { height: 240, gradient: "linear-gradient(to top, #ef4444, #ff5050, #ff2929)", delay: 0.12 },
  { height: 80, gradient: "linear-gradient(to top, #ff7300, rgb(255, 134, 53), #fa2500)", delay: 0.36 },
];

const topBars = [
  { height: 140, gradient: "linear-gradient(to bottom, #ff7300, rgb(255, 134, 53), #fa2500)", delay: 0.1 },
  { height: 200,  gradient: "linear-gradient(to bottom, #ffe380, #b38b00, #FFA500)", delay: 0.22 },
  { height: 120, gradient: "linear-gradient(to bottom, #ff7300, #fbde3c, #c8ff00)", delay: 0.34 },
];

const fieldVariants = {
  hidden: { opacity: 0, height: 0, marginBottom: 0 },
  visible: {
    opacity: 1,
    height: "auto",
    marginBottom: 0,
    transition: { duration: 0.38, ease: [0.4, 0, 0.2, 1] },
  },
  exit: {
    opacity: 0,
    height: 0,
    marginBottom: 0,
    transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] },
  },
};

const LoginPage = () => {
  const { login, error: loginError, isLoading: loginLoading } = useLogin();
  const { register, error: registerError, isLoading: registerLoading } = useRegister();
  const { loginWithGoogle, error: googleError, isLoading: googleLoading } = useGoogleAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", password: "", confirmPassword: "" });
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [privacyError, setPrivacyError] = useState("");

  const error = privacyError || (isRegister ? registerError : loginError);
  const isLoading = isRegister ? registerLoading : loginLoading;
  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setPrivacyError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isRegister) {
      if (!privacyAccepted) {
        setPrivacyError("Debes aceptar la información básica de protección de datos.");
        return;
      }
      register(form);
    } else {
      login({ email: form.email, password: form.password });
    }
  };

  const toggleMode = () => {
    setIsRegister((prev) => !prev);
    setForm({ username: "", email: "", password: "", confirmPassword: "" });
    setPrivacyAccepted(false);
    setPrivacyError("");
  };

  return (
    <div className="min-h-screen flex">
      {/* Imagen izquierda */}
      <div className="hidden lg:block w-[55%] relative">
        <img
          src="https://res.cloudinary.com/dyfvdciiu/image/upload/q_auto/f_auto/v1782130555/Airbrush-IMAGE-ENHANCER-1782130577588-1782130577588_kv7etr.jpg"
          alt="Gestiona"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
      </div>

      {/* Formulario derecha */}
      <div
        className="flex-1 flex items-center justify-center px-6 py-12 relative overflow-hidden"
        style={{ backgroundColor: "#ffffff" }}
      >
        {/* Barras abajo separadas de la derecha */}
        <div className="absolute bottom-0 right-8 flex items-end gap-2 pointer-events-none select-none">
          {bars.map((bar, i) => (
            <motion.div
              key={i}
              className="w-14 rounded-t-2xl"
              style={{ background: bar.gradient }}
              initial={{ height: 0 }}
              animate={{ height: bar.height }}
              transition={{
                duration: 0.8,
                delay: bar.delay,
                type: "spring",
                stiffness: 140,
                damping: 12,
              }}
            />
          ))}
        </div>

        {/* Barras arriba a la izquierda con margen del difuminado */}
        <div className="absolute top-0 left-10 flex items-start gap-2 pointer-events-none select-none">
          {topBars.map((bar, i) => (
            <motion.div
              key={i}
              className="w-14 rounded-b-2xl"
              style={{ background: bar.gradient }}
              initial={{ height: 0 }}
              animate={{ height: bar.height }}
              transition={{
                duration: 0.8,
                delay: bar.delay,
                type: "spring",
                stiffness: 140,
                damping: 12,
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-sm relative z-10"
        >
          <div className="mb-8">
            <AnimatePresence mode="wait">
              {isRegister ? (
                <motion.div
                  key="register-title"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.25 }}
                >
                  <h1 style={{ fontFamily: "'AlfaSlabOne', serif" }} className="text-3xl text-orange-950 text-center">Crea tu cuenta en</h1>
                  <h1 style={{ fontFamily: "'AlfaSlabOne', serif" }} className="text-3xl text-orange-950 text-center mt-1">Gestiona-2</h1>
                </motion.div>
              ) : (
                <motion.div
                  key="login-title"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.25 }}
                >
                  <h1 style={{ fontFamily: "'AlfaSlabOne', serif" }} className="text-3xl text-orange-950 text-center">Bienvenido de nuevo a</h1>
                  <h1 style={{ fontFamily: "'AlfaSlabOne', serif" }} className="text-3xl text-orange-950 text-center mt-1">Gestiona-2</h1>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Campo username — solo en modo registro */}
            <AnimatePresence initial={false}>
              {isRegister && (
                <motion.div
                  key="username-field"
                  variants={fieldVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  style={{ overflow: "hidden" }}
                >
                  <label className="block text-sm font-medium text-orange-800 mb-1" htmlFor="username">
                    Nombre de usuario
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    value={form.username}
                    onChange={handleChange}
                    required={isRegister}
                    className="w-full px-3.5 py-2.5 border border-orange-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-orange-50 placeholder-orange-300 text-orange-900"
                    placeholder="tu_usuario"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-sm font-medium text-orange-800 mb-1 mt-4" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 border border-orange-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-orange-50 placeholder-orange-300 text-orange-900"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-orange-800 mb-1" htmlFor="password">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isRegister ? "new-password" : "current-password"}
                value={form.password}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 border border-orange-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-orange-50 placeholder-orange-300 text-orange-900"
                placeholder="Tu contraseña"
              />
            </div>

            {/* Campo confirmar contraseña — solo en modo registro */}
            <AnimatePresence initial={false}>
              {isRegister && (
                <motion.div
                  key="confirmPassword-field"
                  variants={fieldVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  style={{ overflow: "hidden" }}
                  className="pb-3"
                >
                  <label className="block text-sm font-medium text-orange-800 mb-1" htmlFor="confirmPassword">
                    Confirmar contraseña
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required={isRegister}
                    className="w-full px-3.5 py-2.5 border border-orange-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-orange-50 placeholder-orange-300 text-orange-900"
                    placeholder="Repite tu contraseña"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {isRegister && (
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-orange-100 bg-orange-50 px-3 py-2.5 text-xs leading-5 text-orange-900">
                <input
                  type="checkbox"
                  checked={privacyAccepted}
                  onChange={(event) => {
                    setPrivacyAccepted(event.target.checked);
                    setPrivacyError("");
                  }}
                  className="mt-1 accent-orange-500"
                />
                <span>
                  He leído y acepto la información básica de protección de datos.
                  <a href="/politica-privacidad" className="ml-1 font-semibold text-orange-600 hover:underline">
                    Política de Privacidad
                  </a>
                </span>
              </label>
            )}

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-all cursor-pointer"
            >
              {isLoading
                ? isRegister ? "Registrando..." : "Entrando..."
                : isRegister ? "Crear cuenta" : "Iniciar sesión"}
            </button>
          </form>

          <p className="text-sm text-center text-orange-400 mt-6">
            {isRegister ? "¿Ya tienes cuenta? " : "¿No tienes cuenta? "}
            <button
              type="button"
              onClick={toggleMode}
              className="text-orange-600 hover:underline font-medium cursor-pointer bg-transparent border-none p-0"
            >
              {isRegister ? "Inicia sesión" : "Regístrate"}
            </button>
          </p>
          
          <div className="flex items-center my-5 w-full select-none">
            <div className="flex-grow border-t border-rose-200"></div>
            <span className="flex-shrink mx-4 text-rose-400 text-xs font-normal whitespace-nowrap">
              Acceso rápido con
            </span>
            <div className="flex-grow border-t border-rose-200"></div>
          </div>

          {googleError && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3"
            >
              {googleError}
            </motion.p>
          )}

          <button
            type="button"
            onClick={() => loginWithGoogle()}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 border border-orange-200 bg-white hover:bg-orange-50 text-orange-900 text-sm font-medium py-2.5 rounded-lg transition-all cursor-pointer disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.332 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107"/>
              <path d="M6.306 14.691l6.571 4.819C14.655 15.108 19.001 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00"/>
              <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.31 0-9.821-3.317-11.561-7.951l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50"/>
              <path d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2"/>
            </svg>
            {googleLoading ? 'Conectando...' : 'Continuar con Google'}
          </button>

        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
