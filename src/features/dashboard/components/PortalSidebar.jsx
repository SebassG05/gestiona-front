import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  FileText,
  FilePenLine,
  FolderKanban,
  Home,
  LogOut,
  Menu,
  Settings,
  SquareChartGantt,
  Users,
  Wallet,
  X,
  CalendarDays,
  ChartColumn,
} from 'lucide-react';

const SIDEBAR_OPEN_WIDTH = 312;
const SIDEBAR_CLOSED_WIDTH = 92;
const SIDEBAR_TRANSITION = {
  type: 'spring',
  stiffness: 150,
  damping: 20,
  mass: 0.95,
};
const LOGO_URL =
  'https://res.cloudinary.com/dyfvdciiu/image/upload/v1782198233/Gemini_Generated_Image_yz19hxyz19hxyz19_Nero_AI_Image_Upscaler_Photo_Face-removebg-preview_y3nioc.png';

const navigationItems = [
  { label: 'Inicio', icon: Home, path: '' },
  { label: 'Proyectos', icon: FolderKanban, path: 'projects' },
  { label: 'Propuestas', icon: FilePenLine, path: 'proposals' },
  { label: 'Equipo', icon: Users, path: 'team' },
  { label: 'Gantt', icon: SquareChartGantt, path: 'gantt' },
  { label: 'Financiacion', icon: Wallet, path: 'funding' },
  { label: 'Documentos', icon: FileText, path: 'documents' },
  { label: 'Calendario', icon: CalendarDays, path: 'calendar' },
  { label: 'Informes', icon: ChartColumn, path: 'reports' },
  { label: 'Ajustes', icon: Settings, path: 'settings' },
];

const PortalSidebar = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { portalId } = useParams();
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const basePath = `/dashboard/portal/${portalId}`;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <motion.aside
        initial={false}
        animate={{ width: isOpen ? SIDEBAR_OPEN_WIDTH : SIDEBAR_CLOSED_WIDTH }}
        transition={SIDEBAR_TRANSITION}
        className="fixed inset-y-0 left-0 z-40 hidden border-r border-orange-100 bg-white/95 shadow-sm backdrop-blur lg:flex lg:flex-col"
      >
        <div
          className={`flex border-b border-orange-100/70 ${
            isOpen ? 'h-20 items-center justify-between px-5' : 'flex-col items-center gap-3 px-3 py-4'
          }`}
        >
          <Link
            to="/dashboard"
            className={`flex min-w-0 items-center gap-3 ${isOpen ? '' : 'justify-center'}`}
          >
            <img src={LOGO_URL} alt="Gestiona-2" className="h-11 w-11 shrink-0 object-contain" />
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="truncate text-lg font-semibold text-orange-950"
                >
                  Gestiona-2
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          <button
            type="button"
            onClick={() => setIsOpen((value) => !value)}
            className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-xl border border-orange-100 bg-orange-50 text-orange-500 transition hover:bg-orange-100"
            aria-label={isOpen ? 'Contraer menu' : 'Abrir menu'}
          >
            {isOpen ? <ChevronLeft size={18} strokeWidth={2.2} /> : <ChevronRight size={18} strokeWidth={2.2} />}
          </button>
        </div>

        <nav className="flex-1 space-y-2 px-4 py-3">
          {navigationItems.map((item, index) => {
            const to = item.path ? `${basePath}/${item.path}` : basePath;
            const Icon = item.icon;
            const isActive = item.path
              ? location.pathname === to || location.pathname.startsWith(`${to}/`)
              : location.pathname === basePath || location.pathname === `${basePath}/`;

            return (
              <Link
                key={item.label}
                to={to}
                className={`flex h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-sm'
                    : 'text-orange-900 hover:bg-orange-50 hover:text-orange-600'
                } ${isOpen ? 'justify-start' : 'justify-center'}`}
                title={!isOpen ? item.label : undefined}
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center">
                  <Icon size={18} strokeWidth={2.1} />
                </span>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      className="truncate"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </nav>

        <div className="space-y-3 border-t border-orange-100 p-4">
          <AnimatePresence initial={false}>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="rounded-2xl border border-orange-100 bg-orange-50/70 p-4"
              >
                <p className="text-sm font-semibold text-orange-950">Portal activo</p>
                <p className="mt-1 truncate text-xs text-orange-500">{portalId}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <Link
            to="/dashboard"
            className={`flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-orange-900 transition hover:bg-orange-50 hover:text-orange-600 ${
              isOpen ? 'justify-start' : 'justify-center'
            }`}
            title={!isOpen ? 'Ayuda' : undefined}
          >
            <span className="grid h-6 w-6 shrink-0 place-items-center">
              <CircleHelp size={18} strokeWidth={2.1} />
            </span>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                >
                  Ayuda
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className={`flex h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-3 text-sm font-semibold text-red-500 transition hover:bg-red-50 ${
              isOpen ? 'justify-start' : 'justify-center'
            }`}
            title={!isOpen ? 'Cerrar sesion' : undefined}
          >
            <span className="grid h-6 w-6 shrink-0 place-items-center">
              <LogOut size={18} strokeWidth={2.1} />
            </span>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                >
                  Cerrar sesion
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>

      <div className="lg:hidden">
        <div className="fixed left-4 top-4 z-50">
          <button
            type="button"
            onClick={() => setIsMobileOpen((value) => !value)}
            className="grid h-11 w-11 cursor-pointer place-items-center rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg"
            aria-label="Abrir menu"
          >
            <Menu size={20} strokeWidth={2.2} />
          </button>
        </div>

        {isMobileOpen && (
          <div className="fixed inset-0 z-40 bg-orange-950/35 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)}>
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="h-full w-72 bg-white p-4 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={LOGO_URL} alt="Gestiona-2" className="h-10 w-10 object-contain" />
                  <span className="text-lg font-semibold text-orange-950">Gestiona-2</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileOpen(false)}
                  className="grid h-9 w-9 cursor-pointer place-items-center rounded-xl bg-orange-50 text-orange-500"
                >
                  <X size={18} strokeWidth={2.2} />
                </button>
              </div>
              <nav className="space-y-2">
                {navigationItems.map((item, index) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.label}
                      to={item.path ? `${basePath}/${item.path}` : basePath}
                      onClick={() => setIsMobileOpen(false)}
                      className={`flex h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold ${
                        (item.path
                          ? location.pathname === (item.path ? `${basePath}/${item.path}` : basePath) ||
                            location.pathname.startsWith(`${basePath}/${item.path}/`)
                          : location.pathname === basePath || location.pathname === `${basePath}/`)
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                          : 'text-orange-900'
                      }`}
                    >
                      <span className="grid h-6 w-6 place-items-center">
                        <Icon size={18} strokeWidth={2.1} />
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </motion.aside>
          </div>
        )}
      </div>

      <div
        className="min-h-screen transition-[padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:pl-[var(--portal-sidebar-offset)]"
        style={{
          '--portal-sidebar-offset': isOpen ? `${SIDEBAR_OPEN_WIDTH}px` : `${SIDEBAR_CLOSED_WIDTH}px`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PortalSidebar;
