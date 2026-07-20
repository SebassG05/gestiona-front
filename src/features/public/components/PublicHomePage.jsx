import { motion } from 'framer-motion';
import {
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  ClipboardCheck,
  FolderKanban,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { hasValidSession } from '../../../utils/session.js';

const LOGO_URL =
  'https://res.cloudinary.com/dyfvdciiu/image/upload/v1782198233/Gemini_Generated_Image_yz19hxyz19hxyz19_Nero_AI_Image_Upscaler_Photo_Face-removebg-preview_y3nioc.png';
const HERO_IMAGE_URL =
  'https://res.cloudinary.com/dyfvdciiu/image/upload/q_auto/f_auto/v1782130555/Airbrush-IMAGE-ENHANCER-1782130577588-1782130577588_kv7etr.jpg';

const capabilities = [
  {
    icon: FolderKanban,
    title: 'Proyectos y oportunidades',
    text: 'Organiza convocatorias, contactos, propuestas y proyectos desde un espacio de trabajo compartido.',
  },
  {
    icon: ClipboardCheck,
    title: 'Control de propuestas',
    text: 'Revisa indicadores, responsables, avance y versiones de propuestas europeas con criterios consistentes.',
  },
  {
    icon: Users,
    title: 'Coordinacion de equipos',
    text: 'Distribuye tareas, vacaciones y viajes de empresa con una vision diaria de la actividad del portal.',
  },
];

const PublicHomePage = () => {
  const accessPath = hasValidSession() ? '/dashboard' : '/login';

  return (
    <main className="min-h-screen bg-white text-[#3b1208]">
      <section className="relative flex min-h-[92vh] flex-col overflow-hidden bg-[#3b1208] text-white">
        <img
          src={HERO_IMAGE_URL}
          alt="Espacio de trabajo de Gestiona-2 para la gestion de proyectos y propuestas"
          className="absolute inset-0 h-full w-full object-cover object-center"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-[#3b1208]/72" />

        <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 md:px-8">
          <Link to="/" className="flex items-center gap-3" aria-label="Gestiona-2, inicio">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-white shadow-sm">
              <img src={LOGO_URL} alt="" className="h-9 w-9 object-contain" />
            </span>
            <span className="text-xl font-black">Gestiona-2</span>
          </Link>
          <Link
            to={accessPath}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/35 bg-white/10 px-4 text-sm font-black backdrop-blur transition hover:bg-white hover:text-[#7b2a10]"
          >
            {hasValidSession() ? 'Ir al panel' : 'Acceder'}
            <ArrowRight size={17} />
          </Link>
        </header>

        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 items-center px-5 pb-20 pt-10 md:px-8 md:pb-24">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-4xl"
          >
            <p className="text-sm font-black uppercase text-orange-300">Gestion de proyectos colaborativa</p>
            <h1 className="mt-5 font-display text-5xl leading-tight md:text-7xl">Gestiona-2</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-orange-50 md:text-xl">
              Una plataforma de Evenor-Tech para coordinar proyectos, oportunidades y propuestas
              europeas con el equipo, la informacion y las decisiones en un mismo lugar.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to={accessPath}
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 px-6 font-black text-white shadow-lg shadow-orange-950/20 transition hover:-translate-y-0.5"
              >
                {hasValidSession() ? 'Abrir Gestiona-2' : 'Entrar en Gestiona-2'}
                <ArrowRight size={18} />
              </Link>
              <a
                href="#capacidades"
                className="inline-flex h-12 items-center rounded-xl border border-white/40 px-6 font-black transition hover:bg-white/10"
              >
                Conocer la plataforma
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="capacidades" className="border-b border-orange-100 bg-[#fffaf5] px-5 py-20 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
            <div>
              <p className="text-sm font-black uppercase text-[#ff3f6c]">Un entorno conectado</p>
              <h2 className="mt-3 font-display text-3xl leading-tight text-[#4b1406] md:text-4xl">
                Del seguimiento a la propuesta final
              </h2>
              <p className="mt-4 max-w-xl leading-7 text-[#a64729]">
                Gestiona-2 concentra los procesos que normalmente quedan repartidos entre hojas de
                calculo, correos y calendarios independientes.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {capabilities.map(({ icon: Icon, title, text }) => (
                <article key={title} className="border-l-2 border-orange-300 pl-5">
                  <Icon size={24} className="text-orange-600" />
                  <h3 className="mt-4 text-lg font-black">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#8b3a20]">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-black uppercase text-[#ff3f6c]">Pensado para equipos de proyecto</p>
            <h2 className="mt-3 font-display text-3xl leading-tight text-[#4b1406] md:text-4xl">
              Informacion clara para avanzar con criterio
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {[
              [CalendarCheck2, 'Planificacion compartida', 'Actividad, fechas, vacaciones y desplazamientos coordinados.'],
              [CheckCircle2, 'Calidad y trazabilidad', 'Estados, responsables y versiones visibles durante todo el proceso.'],
            ].map(([Icon, title, text]) => (
              <div key={title} className="flex gap-4 border-t border-orange-200 pt-5">
                <Icon size={22} className="mt-0.5 shrink-0 text-orange-600" />
                <div>
                  <h3 className="font-black">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#8b3a20]">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-orange-100 bg-[#fffaf5] px-5 py-7 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-[#8b3a20] sm:flex-row sm:items-center sm:justify-between">
          <p><strong className="text-[#3b1208]">Gestiona-2</strong> · Una plataforma de Evenor-Tech</p>
          <nav className="flex flex-wrap gap-5" aria-label="Informacion legal">
            <Link to="/aviso-legal" className="hover:text-orange-600">Aviso legal</Link>
            <Link to="/politica-privacidad" className="hover:text-orange-600">Privacidad</Link>
            <Link to="/politica-cookies" className="hover:text-orange-600">Cookies</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
};

export default PublicHomePage;
