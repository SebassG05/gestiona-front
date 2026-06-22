import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useLogin } from "../hooks/useLogin.js";

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

const LoginPage = () => {
  const { login, error, isLoading } = useLogin();
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    login(form);
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
        <div className="absolute inset-y-0 right-0 w-6 bg-gradient-to-r from-transparent to-orange-50" />
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
            <h1 className="text-2xl font-bold text-orange-950">Bienvenido de nuevo</h1>
            <p className="text-sm text-orange-400 mt-1">Inicia sesión en tu cuenta</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label className="block text-sm font-medium text-orange-800 mb-1" htmlFor="email">
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
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 border border-orange-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-orange-50 placeholder-orange-300 text-orange-900"
                placeholder="Tu contraseña"
              />
            </div>

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
              {isLoading ? "Entrando..." : "Iniciar sesión"}
            </button>
          </form>

          <p className="text-sm text-center text-orange-400 mt-6">
            ¿No tienes cuenta?{" "}
            <Link to="/register" className="text-orange-600 hover:underline font-medium">
              Regístrate
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
