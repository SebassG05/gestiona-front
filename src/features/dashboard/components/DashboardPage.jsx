import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const cards = [
  {
    id: 'create',
    title: 'Crear Nuevo Portal',
    description: 'Inicia un nuevo portal de gestión desde cero y configura tu equipo.',
    gradient: 'from-orange-400 to-red-500',
    image: 'https://res.cloudinary.com/dyfvdciiu/image/upload/v1782202853/d4220bfd-41b4-4618-909e-b3edf81b2d9a_ihojwv.png',
    action: '/dashboard/create',
  },
  {
    id: 'join',
    title: 'Unirme a un Portal',
    description: 'Accede a un portal existente con un código de invitación.',
    gradient: 'from-yellow-400 to-orange-500',
    image: 'https://res.cloudinary.com/dyfvdciiu/image/upload/v1782202953/5fb13ece-bef4-4e19-bb3a-b1f6c3ade3c5_v8qyfn.png',
    action: '/dashboard/join',
  },
  {
    id: 'portals',
    title: 'Mis Portales',
    description: 'Visualiza y accede a todos los portales en los que participas.',
    gradient: 'from-pink-500 to-purple-600',
    image: 'https://res.cloudinary.com/dyfvdciiu/image/upload/v1782202994/6b987017-b102-4e2c-ace3-73585671036b_qdza6d.png',
    action: '/dashboard/portals',
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] },
  },
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const username = user?.username || 'Usuario';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#fafafa' }}>

      {/* Líneas decorativas de fondo */}
      <motion.svg
        className="absolute inset-0 z-0 w-full h-full pointer-events-none select-none"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <motion.path
          d="M-80 220 C 180 120, 370 320, 620 220 S 1000 80, 1520 210"
          fill="none"
          stroke="#fb923c"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.16"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.16 }}
          transition={{ duration: 1.8, ease: 'easeInOut', delay: 0.15 }}
        />
        <motion.path
          d="M-100 780 C 210 610, 430 820, 700 690 S 1050 520, 1540 700"
          fill="none"
          stroke="#fdba74"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.2"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.2 }}
          transition={{ duration: 2.1, ease: 'easeInOut', delay: 0.35 }}
        />
        <motion.path
          d="M110 520 C 350 440, 490 540, 690 500 S 1030 380, 1330 470"
          fill="none"
          stroke="#fed7aa"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="10 16"
          opacity="0.32"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.32 }}
          transition={{ duration: 1.9, ease: 'easeInOut', delay: 0.55 }}
        />
      </motion.svg>

      {/* Contenido principal */}
      <main className="relative z-10 w-full max-w-screen-xxl mx-auto px-4 sm:px-6 xl:px-8 py-8 sm:py-12 xl:py-30">
        {/* Título de bienvenida */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 sm:mb-10 xl:mb-14 text-center"
        >
          <h1
            style={{ fontFamily: "'AlfaSlabOne', serif" }}
            className="text-3xl sm:text-4xl xl:text-5xl text-orange-950 leading-tight"
          >
            Bienvenido a Gestiona-2,
          </h1>
          <h2
            style={{
              fontFamily: "'AlfaSlabOne', serif",
              background: 'linear-gradient(to right, #f97316, #ef4444)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
            className="text-3xl sm:text-4xl xl:text-5xl mt-2 pb-2"
          >
            {username}
          </h2>
        </motion.div>

        {/* Tarjetas */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 xl:gap-6"
        >
          {cards.map((card) => (
            <motion.button
              key={card.id}
              variants={cardVariants}
              onClick={() => navigate(card.action)}
              className={`group relative flex flex-col items-start rounded-2xl bg-white border border-orange-100 shadow-sm hover:shadow-md transition-all duration-200 text-left cursor-pointer overflow-hidden`}
            >
              {/* Decoración de fondo al hover */}
              <div
                className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-200 bg-gradient-to-br ${card.gradient}`}
              />

              {/* Imagen */}
              <div className="w-full h-48 sm:h-64 xl:h-80 bg-orange-50 rounded-t-2xl flex items-center justify-center overflow-hidden">
                <img
                  src={card.image}
                  alt=""
                  aria-hidden="true"
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Texto */}
              <div className="p-5 sm:p-6 xl:p-8 w-full">
                <h3 className="text-base sm:text-lg xl:text-xl font-semibold text-orange-950 mb-1 xl:mb-2">{card.title}</h3>
                <p className="text-xs sm:text-sm text-orange-400 leading-relaxed">{card.description}</p>
              </div>

              {/* Flecha */}
              <div className="px-5 pb-5 sm:px-6 sm:pb-6 xl:px-8 xl:pb-8 mt-auto">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-4 h-4 text-orange-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all duration-200"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </div>
            </motion.button>
          ))}
        </motion.div>
      </main>

      <footer className="absolute bottom-13 left-1/2 z-10 flex -translate-x-1/2 flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 text-center text-xs text-orange-400">
        <Link to="/aviso-legal" className="transition hover:text-orange-600 hover:underline">
          Aviso Legal
        </Link>
        <Link to="/politica-privacidad" className="transition hover:text-orange-600 hover:underline">
          Política de Privacidad
        </Link>
        <Link to="/politica-cookies" className="transition hover:text-orange-600 hover:underline">
          Política de Cookies
        </Link>
        <span className="font-medium text-orange-500">Desarrollado por Evenor-Tech</span>
      </footer>

      {/* Botón cerrar sesión — imagen abajo derecha */}
      <motion.button
        onClick={handleLogout}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="fixed z-20 bottom-4 right-4 sm:bottom-6 sm:right-6 cursor-pointer"
        title="Cerrar sesión"
      >
        <img
          src="https://res.cloudinary.com/dyfvdciiu/image/upload/v1782199591/upscalemedia-transformed__2_-removebg-preview_1_fhctdb.png"
          alt="Cerrar sesión"
          className="w-12 h-12 sm:w-14 sm:h-14 xl:w-16 xl:h-16 object-contain drop-shadow-lg"
        />
      </motion.button>
    </div>
  );
};

export default DashboardPage;
