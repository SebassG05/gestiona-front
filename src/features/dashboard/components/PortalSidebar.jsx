import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ContactRound,
  FileText,
  FilePenLine,
  Home,
  LogOut,
  Menu,
  Settings,
  SquareChartGantt,
  Users,
  ClipboardCheck,
  ChartNoAxesCombined,
} from 'lucide-react';
import { clearAuthSession } from '../../../utils/session.js';

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
  { label: 'Análisis', icon: ChartNoAxesCombined, path: 'analytics' },
  { label: 'Propuestas', icon: FilePenLine, path: 'proposals' },
  { label: 'Gestión de propuestas', icon: ClipboardCheck, path: 'proposal-management' },
  { label: 'Oportunidades', icon: BriefcaseBusiness, path: 'opportunities' },
  { label: 'Contactos', icon: ContactRound, path: 'contacts' },
  { label: 'Equipo', icon: Users, path: 'team' },
  { label: 'Gantt', icon: SquareChartGantt, path: 'gantt' },
  { label: 'Documentos', icon: FileText, path: 'documents' },
  { label: 'Ajustes', icon: Settings, path: 'settings' },
];

const getNavigationItemId = (item) => item.path || 'home';
const defaultNavigationOrder = navigationItems.map(getNavigationItemId);

const getStoredUserId = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id || user._id || user.email || 'anonymous';
  } catch {
    return 'anonymous';
  }
};

const getNavigationStorageKey = (portalId) =>
  `gestiona2:sidebar-order:${getStoredUserId()}:${portalId || 'portal'}`;

const normalizeNavigationOrder = (storedOrder) => {
  const validIds = Array.isArray(storedOrder)
    ? storedOrder.filter((id) => defaultNavigationOrder.includes(id))
    : [];
  return [...new Set([...validIds, ...defaultNavigationOrder])];
};

const loadNavigationOrder = (portalId) => {
  try {
    return normalizeNavigationOrder(
      JSON.parse(localStorage.getItem(getNavigationStorageKey(portalId)) || '[]')
    );
  } catch {
    return defaultNavigationOrder;
  }
};

const SortableNavigationItem = ({
  item,
  to,
  isActive,
  isOpen = true,
  isMobile = false,
  onNavigate,
}) => {
  const itemId = getNavigationItemId(item);
  const Icon = item.icon;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: itemId });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? 'none' : transition,
        zIndex: isDragging ? 20 : 'auto',
        willChange: transform ? 'transform' : 'auto',
      }}
      className={`group relative flex h-12 touch-pan-y cursor-grab items-center rounded-xl active:cursor-grabbing ${
        isActive
          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-sm'
          : 'text-orange-900 hover:bg-orange-50 hover:text-orange-600'
      } ${isDragging ? 'opacity-20' : ''}`}
    >
      <Link
        to={to}
        onClick={onNavigate}
        className={`flex h-full min-w-0 flex-1 items-center gap-3 rounded-xl text-sm font-semibold transition ${
          isOpen ? 'px-2' : 'justify-center px-3'
        }`}
        title={!isOpen ? item.label : undefined}
      >
        <span className="grid h-6 w-6 shrink-0 place-items-center">
          <Icon size={18} strokeWidth={2.1} />
        </span>
        {isOpen && (
          <motion.span
            initial={isMobile ? false : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="truncate"
          >
            {item.label}
          </motion.span>
        )}
      </Link>
    </div>
  );
};

const NavigationDragOverlay = ({ item }) => {
  if (!item) return null;
  const Icon = item.icon;

  return (
    <div className="flex h-12 w-[280px] items-center gap-3 rounded-xl border border-orange-200 bg-white px-4 text-sm font-semibold text-orange-900 shadow-[0_18px_45px_rgba(124,45,18,0.18)] ring-1 ring-orange-100">
      <span className="grid h-6 w-6 shrink-0 place-items-center text-orange-600">
        <Icon size={18} strokeWidth={2.1} />
      </span>
      <span className="truncate">{item.label}</span>
    </div>
  );
};

const PortalSidebar = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { portalId } = useParams();
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [navigationOrder, setNavigationOrder] = useState(() => loadNavigationOrder(portalId));
  const [activeNavigationId, setActiveNavigationId] = useState(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 140, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const basePath = `/dashboard/portal/${portalId}`;
  const orderedNavigationItems = useMemo(() => {
    const itemById = new Map(navigationItems.map((item) => [getNavigationItemId(item), item]));
    return navigationOrder.map((id) => itemById.get(id)).filter(Boolean);
  }, [navigationOrder]);
  const activeNavigationItem = orderedNavigationItems.find(
    (item) => getNavigationItemId(item) === activeNavigationId
  );

  const handleNavigationDragEnd = ({ active, over }) => {
    setActiveNavigationId(null);
    if (!over || active.id === over.id) return;

    setNavigationOrder((current) => {
      const oldIndex = current.indexOf(active.id);
      const newIndex = current.indexOf(over.id);
      if (oldIndex < 0 || newIndex < 0) return current;

      const nextOrder = arrayMove(current, oldIndex, newIndex);
      localStorage.setItem(getNavigationStorageKey(portalId), JSON.stringify(nextOrder));
      return nextOrder;
    });
  };

  const handleLogout = () => {
    clearAuthSession();
    navigate('/', { replace: true, state: { logoutSuccess: true } });
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

        <nav className="min-h-0 flex-1 overflow-y-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={({ active }) => setActiveNavigationId(active.id)}
            onDragCancel={() => setActiveNavigationId(null)}
            onDragEnd={handleNavigationDragEnd}
          >
            <SortableContext
              items={navigationOrder}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {orderedNavigationItems.map((item) => {
                  const to = item.path ? `${basePath}/${item.path}` : basePath;
                  const isActive = item.path
                    ? location.pathname === to || location.pathname.startsWith(`${to}/`)
                    : location.pathname === basePath || location.pathname === `${basePath}/`;

                  return (
                    <SortableNavigationItem
                      key={getNavigationItemId(item)}
                      item={item}
                      to={to}
                      isActive={isActive}
                      isOpen={isOpen}
                    />
                  );
                })}
              </div>
            </SortableContext>
            <DragOverlay
              dropAnimation={{ duration: 220, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }}
            >
              <NavigationDragOverlay item={activeNavigationItem} />
            </DragOverlay>
          </DndContext>
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

          <AnimatePresence initial={false}>
            {isOpen && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="border-t border-orange-100 pt-3 text-center text-[11px] text-orange-700/70"
              >
                Desarrollado por{' '}
                <a
                  href="https://evenor-tech.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-orange-600 transition-colors hover:text-orange-700"
                >
                  Evenor-Tech
                </a>
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>

      <div className="lg:hidden">
        <div className="fixed left-4 top-4 z-50">
          <motion.button
            type="button"
            onClick={() => setIsMobileOpen((value) => !value)}
            whileTap={{ scale: 0.92 }}
            animate={{ rotate: isMobileOpen ? 90 : 0 }}
            transition={{ type: 'spring', stiffness: 360, damping: 24 }}
            className="grid h-11 w-11 cursor-pointer place-items-center rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg"
            aria-label={isMobileOpen ? 'Cerrar menu' : 'Abrir menu'}
            aria-expanded={isMobileOpen}
          >
            <Menu size={20} strokeWidth={2.2} />
          </motion.button>
        </div>

        <AnimatePresence initial={false}>
          {isMobileOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className="fixed inset-0 z-40 bg-orange-950/35 backdrop-blur-sm"
              onClick={() => setIsMobileOpen(false)}
            >
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', stiffness: 280, damping: 30, mass: 0.9 }}
                className="flex h-full w-72 flex-col bg-white p-4 shadow-2xl"
                onClick={(event) => event.stopPropagation()}
              >
              <div className="mb-6 flex min-h-11 items-center pl-14">
                <div className="flex items-center gap-3">
                  <img src={LOGO_URL} alt="Gestiona-2" className="h-10 w-10 object-contain" />
                  <span className="text-lg font-semibold text-orange-950">Gestiona-2</span>
                </div>
              </div>
              <nav className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={({ active }) => setActiveNavigationId(active.id)}
                  onDragCancel={() => setActiveNavigationId(null)}
                  onDragEnd={handleNavigationDragEnd}
                >
                  <SortableContext
                    items={navigationOrder}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {orderedNavigationItems.map((item) => {
                        const to = item.path ? `${basePath}/${item.path}` : basePath;
                        const isActive = item.path
                          ? location.pathname === to || location.pathname.startsWith(`${to}/`)
                          : location.pathname === basePath || location.pathname === `${basePath}/`;

                        return (
                          <SortableNavigationItem
                            key={getNavigationItemId(item)}
                            item={item}
                            to={to}
                            isActive={isActive}
                            isMobile
                            onNavigate={() => setIsMobileOpen(false)}
                          />
                        );
                      })}
                    </div>
                  </SortableContext>
                  <DragOverlay
                    dropAnimation={{ duration: 220, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }}
                  >
                    <NavigationDragOverlay item={activeNavigationItem} />
                  </DragOverlay>
                </DndContext>
              </nav>
              <p className="mt-4 border-t border-orange-100 pt-4 text-center text-[11px] text-orange-700/70">
                Desarrollado por{' '}
                <a
                  href="https://evenor-tech.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-orange-600"
                >
                  Evenor-Tech
                </a>
              </p>
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>
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
