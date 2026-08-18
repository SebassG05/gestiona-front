import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, BarChart3, BriefcaseBusiness, CheckCircle2, Compass, FilePenLine, Lightbulb, Network, Sparkles, Target, Users } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import PortalSidebar from './PortalSidebar.jsx';
import { getMyPortals, getPortalMembers } from '../services/portalService.js';

const scenes = [
  { eyebrow: 'Bienvenido a tu espacio de trabajo', title: 'Todo el ciclo de una oportunidad, en un único portal.', description: 'Gestiona-2 reúne oportunidades, Concept Notes, contactos, propuestas y coordinación de equipo para transformar convocatorias complejas en proyectos preparados para avanzar.', accent: 'from-orange-500 to-red-500', icon: Sparkles },
  { eyebrow: 'Qué hacemos', title: 'Del descubrimiento a la propuesta.', description: 'La plataforma organiza información dispersa, conecta oportunidades con las personas adecuadas y mantiene el conocimiento del proyecto accesible para todo el equipo.', accent: 'from-rose-500 to-orange-500', icon: Compass },
  { eyebrow: 'Un flujo conectado', title: 'Cada módulo impulsa el siguiente.', description: 'Explora el proceso completo sin perder contexto. Cada decisión, documento y relación permanece vinculada al portal.', accent: 'from-orange-400 to-amber-500', icon: Network },
  { eyebrow: 'Nuestros objetivos', title: 'Menos fricción. Más claridad. Mejores decisiones.', description: 'Gestiona-2 está diseñado para reducir tareas repetitivas, favorecer la colaboración y convertir datos en una visión operativa y compartida.', accent: 'from-red-500 to-rose-500', icon: Target },
  { eyebrow: 'Empieza a trabajar', title: 'Tu próxima oportunidad está a un paso.', description: 'Entra en el área que necesitas y continúa desde el punto exacto en el que está trabajando el equipo.', accent: 'from-orange-500 to-red-500', icon: Lightbulb },
];

const workflow = [
  { icon: BriefcaseBusiness, title: 'Detecta', text: 'Importa, busca y prioriza oportunidades relevantes.' },
  { icon: Users, title: 'Conecta', text: 'Vincula contactos, entidades y conocimiento del equipo.' },
  { icon: FilePenLine, title: 'Construye', text: 'Convierte la oportunidad en una propuesta gestionable.' },
];

const objectives = [
  'Centralizar la información crítica del portal.',
  'Acelerar la preparación de propuestas europeas.',
  'Coordinar personas, tareas y decisiones.',
  'Conservar trazabilidad y conocimiento compartido.',
];

const SceneContent = ({ sceneIndex, portalId, portalName, memberCount }) => {
  const scene = scenes[sceneIndex];
  const Icon = scene.icon;

  return (
    <div className="mx-auto flex h-full w-full max-w-[1500px] items-center px-5 py-20 sm:px-8 lg:px-12">
      <div className="grid w-full items-center gap-10 lg:grid-cols-[0.92fr_1.08fr] xl:gap-16">
        <div className="relative z-10">
          <motion.span layout className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${scene.accent} text-white shadow-[0_16px_36px_rgba(249,115,22,0.24)]`}><Icon size={25} /></motion.span>
          <p className="mt-6 text-xs font-black uppercase tracking-[0.22em] text-rose-400">{scene.eyebrow}</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[1.04] tracking-tight text-[#4b1406] sm:text-5xl xl:text-6xl">{scene.title}</h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-[#8a442c] sm:text-lg">{scene.description}</p>

          {sceneIndex === 0 && <div className="mt-7 flex flex-wrap items-center gap-3"><span className="rounded-full border border-orange-200 bg-white/80 px-4 py-2 text-sm font-bold text-orange-800 shadow-sm">{portalName}</span><span className="rounded-full border border-orange-100 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-600">{memberCount} {memberCount === 1 ? 'persona' : 'personas'} en el portal</span></div>}

          {sceneIndex === 4 && <div className="mt-8 flex flex-wrap gap-3"><Link to={`/dashboard/portal/${portalId}/opportunities`} className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl">Ver oportunidades <ArrowRight size={17} /></Link><Link to={`/dashboard/portal/${portalId}/analytics`} className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-orange-200 bg-white px-6 py-3.5 text-sm font-bold text-orange-800 shadow-sm transition hover:bg-orange-50"><BarChart3 size={17} /> Abrir análisis</Link></div>}
        </div>

        <div className="relative hidden min-h-[500px] lg:block">
          <div className="absolute inset-4 rounded-[42px] bg-gradient-to-br from-orange-100/80 via-white to-rose-100/70 blur-[1px]" />
          {sceneIndex === 0 && <div className="absolute inset-0 grid place-items-center"><div className="relative w-full max-w-xl rounded-[34px] border border-orange-100 bg-white/90 p-7 shadow-[0_30px_90px_rgba(124,45,18,0.13)] backdrop-blur"><div className="flex items-center gap-3"><span className="h-3 w-3 rounded-full bg-red-400"/><span className="h-3 w-3 rounded-full bg-amber-400"/><span className="h-3 w-3 rounded-full bg-emerald-400"/></div><div className="mt-8 space-y-4"><div className="h-4 w-2/3 rounded-full bg-orange-100"/><div className="h-14 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500"/><div className="grid grid-cols-3 gap-3">{['Oportunidades','Contactos','Propuestas'].map((label, index) => <div key={label} className="rounded-2xl border border-orange-100 bg-orange-50/50 p-4"><p className="text-2xl font-black text-orange-600">{index + 1}</p><p className="mt-2 text-xs font-bold text-orange-900">{label}</p></div>)}</div></div></div></div>}
          {sceneIndex === 1 && <div className="absolute inset-0 grid content-center gap-4 p-5 sm:grid-cols-2">{[{ icon: BriefcaseBusiness, title: 'Información estructurada', text: 'Excel, oportunidades y documentos siempre localizables.' },{ icon: Network, title: 'Relaciones visibles', text: 'Contactos y propuestas conectados con su origen.' },{ icon: BarChart3, title: 'Visión operativa', text: 'Indicadores para comprender el estado del portal.' },{ icon: Users, title: 'Trabajo compartido', text: 'El equipo accede a una única fuente de verdad.' }].map(({icon: CardIcon,title,text}, index) => <motion.article key={title} initial={{ opacity: 0, x: index % 2 ? 60 : -60, scale: .9 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ delay: index * .08 }} className="rounded-3xl border border-orange-100 bg-white/95 p-5 shadow-[0_18px_45px_rgba(124,45,18,0.09)]"><CardIcon className="text-orange-500" size={22}/><h3 className="mt-4 font-bold text-orange-950">{title}</h3><p className="mt-2 text-sm leading-6 text-orange-500">{text}</p></motion.article>)}</div>}
          {sceneIndex === 2 && <div className="absolute inset-0 flex flex-col justify-center gap-4 p-5">{workflow.map(({icon: StepIcon,title,text}, index) => <motion.article key={title} initial={{ opacity: 0, x: index % 2 ? 90 : -90 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * .12, type: 'spring', stiffness: 130, damping: 18 }} className="flex items-center gap-5 rounded-3xl border border-orange-100 bg-white/95 p-5 shadow-[0_18px_45px_rgba(124,45,18,0.09)]"><span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${index === 1 ? 'bg-rose-50 text-rose-500' : 'bg-orange-50 text-orange-500'}`}><StepIcon size={22}/></span><div><p className="text-xs font-black uppercase tracking-widest text-orange-300">Paso {index + 1}</p><h3 className="mt-1 text-lg font-bold text-orange-950">{title}</h3><p className="mt-1 text-sm text-orange-500">{text}</p></div></motion.article>)}</div>}
          {sceneIndex === 3 && <div className="absolute inset-0 grid content-center gap-3 p-5">{objectives.map((objective, index) => <motion.div key={objective} initial={{ opacity: 0, scale: .65 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * .1, type: 'spring', stiffness: 120, damping: 18 }} className="flex items-center gap-4 rounded-2xl border border-orange-100 bg-white/95 px-5 py-4 shadow-sm"><CheckCircle2 size={20} className="shrink-0 text-emerald-500"/><p className="font-semibold text-orange-950">{objective}</p></motion.div>)}</div>}
          {sceneIndex === 4 && <div className="absolute inset-0 grid place-items-center p-5"><div className="grid w-full max-w-xl grid-cols-2 gap-4">{[{icon:BriefcaseBusiness,label:'Oportunidades',path:'opportunities'},{icon:FilePenLine,label:'Propuestas',path:'proposals'},{icon:Users,label:'Equipo',path:'team'},{icon:BarChart3,label:'Análisis',path:'analytics'}].map(({icon:CardIcon,label,path}, index) => <motion.div key={label} initial={{ opacity: 0, y: 70, rotate: index % 2 ? 3 : -3 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ delay: index * .08 }}><Link to={`/dashboard/portal/${portalId}/${path}`} className="group flex min-h-36 cursor-pointer flex-col justify-between rounded-3xl border border-orange-100 bg-white/95 p-5 shadow-[0_18px_45px_rgba(124,45,18,0.09)] transition hover:-translate-y-1 hover:border-orange-300"><CardIcon size={24} className="text-orange-500"/><span className="flex items-center justify-between font-bold text-orange-950">{label}<ArrowRight size={17} className="text-orange-300 transition group-hover:translate-x-1 group-hover:text-orange-500"/></span></Link></motion.div>)}</div></div>}
        </div>
      </div>
    </div>
  );
};

const StaticBelowFoldContent = ({ portalId, portalName }) => {
  const capabilities = [
    { icon: BriefcaseBusiness, title: 'Biblioteca de oportunidades', text: 'Centraliza convocatorias, prioriza favoritas y vincula cada oportunidad con sus contactos y Concept Notes.', path: 'opportunities' },
    { icon: FilePenLine, title: 'Propuestas conectadas', text: 'Convierte oportunidades en propuestas y conserva siempre la relación con su información de origen.', path: 'proposals' },
    { icon: Users, title: 'Coordinación de equipo', text: 'Organiza personas, responsabilidades, actividad y conocimiento dentro de un mismo entorno compartido.', path: 'team' },
    { icon: BarChart3, title: 'Análisis operativo', text: 'Consulta indicadores para entender el avance del portal y apoyar decisiones con una visión global.', path: 'analytics' },
  ];

  return (
    <div className="relative overflow-hidden bg-white">
      <section className="mx-auto max-w-[1500px] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <motion.div initial={{ opacity: 0, y: 45 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .35 }} transition={{ duration: .65, ease: [0.22, 1, 0.36, 1] }} className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-rose-400">Un portal, múltiples capacidades</p>
          <h2 className="mt-4 text-4xl font-black leading-tight tracking-tight text-[#4b1406] sm:text-5xl">Una estructura diseñada para trabajar, no solo para almacenar.</h2>
          <p className="mt-6 text-base leading-7 text-[#8a442c] sm:text-lg">Cada área de {portalName} responde a una fase concreta del trabajo y comparte contexto con las demás.</p>
        </motion.div>

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {capabilities.map(({ icon: Icon, title, text, path }, index) => (
            <motion.article key={title} initial={{ opacity: 0, y: 55, scale: .96 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true, amount: .25 }} transition={{ duration: .55, delay: index * .08, ease: [0.22, 1, 0.36, 1] }} className="group rounded-[30px] border border-orange-100 bg-[#fffaf7] p-7 transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-[0_24px_60px_rgba(124,45,18,0.09)]">
              <span className="grid h-13 w-13 place-items-center rounded-2xl bg-white text-orange-500 shadow-sm"><Icon size={23}/></span>
              <h3 className="mt-6 text-xl font-black text-orange-950">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-orange-600">{text}</p>
              <Link to={`/dashboard/portal/${portalId}/${path}`} className="mt-6 inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-orange-600 transition group-hover:text-orange-800">Explorar apartado <ArrowRight size={16} className="transition group-hover:translate-x-1"/></Link>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="relative bg-[#4b1406] px-5 py-24 text-white sm:px-8 lg:px-12 lg:py-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(249,115,22,0.32),transparent_28%),radial-gradient(circle_at_86%_78%,rgba(244,63,94,0.24),transparent_30%)]"/>
        <div className="relative mx-auto max-w-[1400px]">
          <motion.div initial={{ opacity: 0, x: -55 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: .4 }} transition={{ duration: .65 }} className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-300">Cómo trabajamos</p>
            <h2 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">Un recorrido continuo, con el contexto siempre presente.</h2>
          </motion.div>
          <div className="mt-16 grid gap-4 lg:grid-cols-4">
            {['Descubrir oportunidades', 'Evaluar y documentar', 'Construir la propuesta', 'Coordinar la ejecución'].map((label, index) => (
              <motion.div key={label} initial={{ opacity: 0, y: 45 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .35 }} transition={{ duration: .5, delay: index * .1 }} className="relative rounded-3xl border border-white/15 bg-white/8 p-6 backdrop-blur-sm">
                <span className="text-4xl font-black text-orange-400/70">0{index + 1}</span>
                <h3 className="mt-8 text-lg font-bold">{label}</h3>
                {index < 3 && <ArrowRight className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-orange-300 lg:block" size={22}/>}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <motion.div initial={{ opacity: 0, scale: .94 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, amount: .4 }} transition={{ duration: .65 }} className="overflow-hidden rounded-[38px] bg-gradient-to-br from-orange-500 to-red-500 p-8 text-white shadow-[0_30px_90px_rgba(249,115,22,0.22)] sm:p-12 lg:flex lg:items-center lg:justify-between lg:gap-10">
          <div className="max-w-3xl"><p className="text-xs font-black uppercase tracking-[0.22em] text-orange-100">Continúa en {portalName}</p><h2 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">Convierte la información del portal en tu siguiente decisión.</h2><p className="mt-4 text-base leading-7 text-orange-50">Empieza revisando las oportunidades priorizadas o consulta el estado global del trabajo.</p></div>
          <div className="mt-8 flex shrink-0 flex-wrap gap-3 lg:mt-0"><Link to={`/dashboard/portal/${portalId}/opportunities`} className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-orange-700 shadow-lg transition hover:-translate-y-0.5">Oportunidades <ArrowRight size={17}/></Link><Link to={`/dashboard/portal/${portalId}/analytics`} className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20">Ver análisis</Link></div>
        </motion.div>
      </section>
    </div>
  );
};

const BelowFoldContent = ({ portalId, portalName }) => {
  const journeyRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: journeyRef,
    offset: ['start start', 'end end'],
  });
  const horizontalX = useTransform(scrollYProgress, [0, 1], ['0%', '-75%']);

  if (prefersReducedMotion) {
    return <StaticBelowFoldContent portalId={portalId} portalName={portalName} />;
  }

  const tickerItems = ['OPORTUNIDADES', 'CONCEPT NOTES', 'CONTACTOS', 'PROPUESTAS', 'EQUIPO', 'DECISIONES'];

  return (
    <div className="overflow-hidden bg-[#fffaf7] text-[#48160a]">
      <section className="relative border-y border-white/10 bg-[#160705] py-5 text-white" aria-label="Áreas conectadas">
        <motion.div
          className="flex w-max items-center gap-8 whitespace-nowrap"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 26, ease: 'linear', repeat: Infinity }}
        >
          {[...tickerItems, ...tickerItems].map((item, index) => (
            <div key={`${item}-${index}`} className="flex items-center gap-8">
              <span className="text-sm font-black tracking-[0.24em]">{item}</span>
              <Sparkles className="h-4 w-4 text-orange-400" />
            </div>
          ))}
        </motion.div>
      </section>

      <section ref={journeyRef} className="relative h-[400vh] bg-[#160705]">
        <div className="sticky top-0 h-screen overflow-hidden">
          <motion.div style={{ x: horizontalX }} className="flex h-full w-[400%]">
            <article className="relative flex h-full w-1/4 shrink-0 items-center overflow-hidden bg-[#fff7ef] px-[clamp(2rem,9vw,10rem)]">
              <div className="pointer-events-none absolute right-[8%] top-1/2 h-[34rem] w-[34rem] -translate-y-1/2 rounded-full border border-orange-300/50">
                {[0, 1, 2].map((ring) => (
                  <motion.div
                    key={ring}
                    className="absolute inset-0 m-auto rounded-full border border-orange-400/40"
                    style={{ width: `${76 - ring * 20}%`, height: `${76 - ring * 20}%` }}
                    animate={{ scale: [0.92, 1.08, 0.92], opacity: [0.35, 0.8, 0.35] }}
                    transition={{ duration: 4 + ring, repeat: Infinity, delay: ring * 0.35 }}
                  />
                ))}
                <motion.div className="absolute left-[62%] top-[23%] h-4 w-4 rounded-full bg-red-500 shadow-[0_0_28px_8px_rgba(239,68,68,.35)]" animate={{ scale: [1, 1.45, 1] }} transition={{ duration: 2, repeat: Infinity }} />
                <div className="absolute inset-0 m-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-2xl"><Compass className="h-10 w-10" /></div>
              </div>
              <div className="relative z-10 max-w-2xl">
                <span className="text-xs font-black tracking-[0.3em] text-orange-600">01 · DETECTAR</span>
                <h2 className="mt-6 text-[clamp(3rem,6vw,6.8rem)] font-black leading-[0.86] tracking-[-0.06em]">Un radar para lo que importa.</h2>
                <p className="mt-8 max-w-xl text-lg leading-8 text-[#8b4b38]">Explora convocatorias, guarda las decisivas y concentra la información que antes vivía dispersa entre archivos y personas.</p>
              </div>
              <span className="absolute bottom-8 right-10 text-[11rem] font-black leading-none text-orange-950/[0.04]">01</span>
            </article>

            <article className="relative flex h-full w-1/4 shrink-0 items-center overflow-hidden bg-[#160705] px-[clamp(2rem,8vw,9rem)] text-white">
              <div className="grid w-full grid-cols-1 items-center gap-16 lg:grid-cols-[0.85fr_1.15fr]">
                <div>
                  <span className="text-xs font-black tracking-[0.3em] text-orange-400">02 · CONECTAR</span>
                  <h2 className="mt-6 text-[clamp(3rem,5vw,6rem)] font-black leading-[0.9] tracking-[-0.055em]">El contexto deja de ser invisible.</h2>
                  <p className="mt-8 max-w-xl text-lg leading-8 text-orange-100/65">Personas, documentos y oportunidades forman un mismo mapa vivo. Cada elemento explica y potencia al siguiente.</p>
                </div>
                <div className="relative mx-auto aspect-square w-full max-w-[38rem]">
                  <div className="absolute inset-[15%] rounded-full border border-orange-400/20" />
                  <div className="absolute inset-[31%] rounded-full border border-dashed border-orange-300/30" />
                  <motion.div className="absolute inset-[37%] flex items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-500 font-black shadow-[0_0_90px_rgba(249,115,22,.32)]" animate={{ boxShadow: ['0 0 50px rgba(249,115,22,.2)', '0 0 110px rgba(249,115,22,.42)', '0 0 50px rgba(249,115,22,.2)'] }} transition={{ duration: 4, repeat: Infinity }}>PORTAL</motion.div>
                  {[
                    ['Contactos', 'left-[2%] top-[18%]', Users],
                    ['Concept Notes', 'right-[0%] top-[18%]', FilePenLine],
                    ['Propuestas', 'bottom-[8%] left-[7%]', BriefcaseBusiness],
                    ['Análisis', 'bottom-[3%] right-[8%]', BarChart3],
                  ].map(([label, position, Icon], index) => (
                    <motion.div key={label} className={`absolute ${position} flex items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.08] px-5 py-4 backdrop-blur-xl`} animate={{ y: [-7, 7, -7] }} transition={{ duration: 4 + index * 0.7, repeat: Infinity }}>
                      <Icon className="h-5 w-5 text-orange-400" /><span className="text-sm font-bold">{label}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </article>

            <article className="relative flex h-full w-1/4 shrink-0 items-center overflow-hidden bg-gradient-to-br from-[#ff6a00] via-[#ff421f] to-[#e71d4f] px-[clamp(2rem,8vw,9rem)] text-white">
              <div className="grid w-full grid-cols-1 items-center gap-14 lg:grid-cols-[1fr_1fr]">
                <div className="order-2 lg:order-1">
                  <div className="rounded-[2.5rem] border border-white/25 bg-[#270905]/85 p-7 shadow-[0_40px_100px_rgba(70,0,0,.3)] backdrop-blur-xl">
                    <div className="mb-8 flex items-center justify-between"><span className="text-xs font-black tracking-[0.22em] text-orange-200">PROPOSAL COCKPIT</span><span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-300">EN CURSO</span></div>
                    {[['Concept Note', 92], ['Consorcio', 68], ['Impacto', 81], ['Documentación', 54]].map(([label, value], index) => (
                      <div key={label} className="mb-6">
                        <div className="mb-2 flex justify-between text-sm"><span>{label}</span><span className="font-bold">{value}%</span></div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/10"><motion.div className="h-full rounded-full bg-gradient-to-r from-orange-300 to-rose-400" initial={{ width: 0 }} whileInView={{ width: `${value}%` }} transition={{ duration: 1.1, delay: index * 0.12 }} /></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="order-1 lg:order-2">
                  <span className="text-xs font-black tracking-[0.3em] text-white/70">03 · CONSTRUIR</span>
                  <h2 className="mt-6 text-[clamp(3rem,5vw,6rem)] font-black leading-[0.88] tracking-[-0.055em]">Del dato a una propuesta defendible.</h2>
                  <p className="mt-8 max-w-xl text-lg leading-8 text-white/80">Transforma señales, contactos y conocimiento compartido en una hoja de ruta que todo el equipo entiende.</p>
                </div>
              </div>
            </article>

            <article className="relative flex h-full w-1/4 shrink-0 items-center overflow-hidden bg-[#f7eee9] px-[clamp(2rem,8vw,9rem)]">
              <div className="absolute -right-24 -top-24 h-[34rem] w-[34rem] rounded-full bg-red-300/25 blur-3xl" />
              <div className="grid w-full grid-cols-1 items-center gap-14 lg:grid-cols-[1fr_0.9fr]">
                <div className="relative z-10">
                  <span className="text-xs font-black tracking-[0.3em] text-red-500">04 · AVANZAR</span>
                  <h2 className="mt-6 text-[clamp(3rem,5vw,6rem)] font-black leading-[0.9] tracking-[-0.055em]">Un equipo. Un pulso. La siguiente decisión.</h2>
                  <p className="mt-8 max-w-xl text-lg leading-8 text-[#8b4b38]">Gestiona-2 convierte el trabajo colectivo en progreso visible, trazable y preparado para actuar.</p>
                  <div className="mt-10 flex flex-wrap gap-3">
                    <Link to={`/dashboard/portal/${portalId}/opportunities`} className="cursor-pointer rounded-full bg-[#401308] px-7 py-4 text-sm font-black text-white transition hover:-translate-y-1 hover:bg-black">Explorar oportunidades <ArrowRight className="ml-2 inline h-4 w-4" /></Link>
                    <Link to={`/dashboard/portal/${portalId}/analytics`} className="cursor-pointer rounded-full border border-[#401308]/20 bg-white/60 px-7 py-4 text-sm font-black transition hover:-translate-y-1 hover:bg-white">Ver análisis</Link>
                  </div>
                </div>
                <div className="relative space-y-4">
                  {['Oportunidad priorizada', 'Concept Note actualizada', 'Contacto vinculado', 'Equipo preparado'].map((label, index) => (
                    <motion.div key={label} className="flex items-center gap-4 rounded-2xl border border-orange-900/10 bg-white/75 p-5 shadow-lg backdrop-blur" animate={{ x: [0, index % 2 ? 9 : -9, 0] }} transition={{ duration: 4 + index, repeat: Infinity }}>
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white"><CheckCircle2 className="h-5 w-5" /></span>
                      <div><p className="font-black">{label}</p><p className="text-xs text-[#9b5b48]">Sincronizado en {portalName}</p></div>
                    </motion.div>
                  ))}
                </div>
              </div>
              <span className="absolute bottom-8 right-10 text-[11rem] font-black leading-none text-red-950/[0.04]">04</span>
            </article>
          </motion.div>

          <div className="absolute bottom-0 left-0 right-0 z-20 h-1 bg-white/10">
            <motion.div className="h-full origin-left bg-gradient-to-r from-orange-400 via-red-500 to-rose-500" style={{ scaleX: scrollYProgress }} />
          </div>
          <div className="pointer-events-none absolute bottom-7 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-[10px] font-black tracking-[0.22em] text-white/65 backdrop-blur-md">SIGUE DESLIZANDO</div>
        </div>
      </section>

      <section className="relative isolate min-h-screen overflow-hidden bg-[#fffaf7] px-6 py-28 sm:px-12 lg:px-24">
        <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[42rem] w-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-300/20 blur-[100px]" />
        <div className="mx-auto max-w-7xl text-center">
          <span className="text-xs font-black tracking-[0.3em] text-orange-600">TU ECOSISTEMA DE TRABAJO</span>
          <h2 className="mx-auto mt-6 max-w-5xl text-[clamp(3rem,7vw,7rem)] font-black leading-[0.86] tracking-[-0.065em]">Todo gira alrededor de una oportunidad.</h2>
          <div className="relative mx-auto mt-20 aspect-square w-full max-w-[42rem]">
            <motion.div className="absolute inset-[4%] rounded-full border border-dashed border-orange-500/30" animate={{ rotate: 360 }} transition={{ duration: 45, ease: 'linear', repeat: Infinity }}>
              {[
                ['CONTACTOS', 'left-1/2 top-0 -translate-x-1/2 -translate-y-1/2'],
                ['CONCEPT NOTES', 'right-0 top-1/2 translate-x-1/2 -translate-y-1/2'],
                ['PROPUESTAS', 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2'],
                ['EQUIPO', 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2'],
              ].map(([label, position]) => <span key={label} className={`absolute ${position} rounded-full border border-orange-200 bg-white px-5 py-3 text-xs font-black shadow-xl`}>{label}</span>)}
            </motion.div>
            <div className="absolute inset-[24%] flex flex-col items-center justify-center rounded-full bg-[#401308] text-white shadow-[0_40px_100px_rgba(64,19,8,.32)]">
              <Sparkles className="mb-5 h-9 w-9 text-orange-400" />
              <span className="text-xs font-black tracking-[0.25em] text-orange-300">GESTIONA-2</span>
              <strong className="mt-3 px-6 text-center text-2xl leading-tight">{portalName}</strong>
            </div>
          </div>
          <p className="mx-auto mt-14 max-w-2xl text-lg leading-8 text-[#89503e]">Un espacio diseñado para que la información no termine archivada, sino convertida en criterio, colaboración y avance.</p>
          <Link to={`/dashboard/portal/${portalId}/opportunities`} className="mt-9 inline-flex cursor-pointer items-center rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-8 py-4 text-sm font-black text-white shadow-xl transition hover:-translate-y-1 hover:shadow-2xl">Entrar en oportunidades <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </div>
      </section>
    </div>
  );
};

const PortalWorkspacePage = () => {
  const { portalId } = useParams();
  const storyRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();
  const [sceneIndex, setSceneIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [portalName, setPortalName] = useState('Tu portal');
  const [memberCount, setMemberCount] = useState(0);
  const { scrollYProgress } = useScroll({ target: storyRef, offset: ['start start', 'end end'] });

  useMotionValueEvent(scrollYProgress, 'change', (progress) => {
    const nextScene = Math.min(scenes.length - 1, Math.floor(progress * scenes.length));
    if (nextScene !== sceneIndex) { setDirection(nextScene > sceneIndex ? 1 : -1); setSceneIndex(nextScene); }
  });

  useEffect(() => {
    let active = true;
    Promise.all([getMyPortals(), getPortalMembers(portalId)])
      .then(([portalsResponse, membersResponse]) => {
        if (!active) return;
        const portal = (portalsResponse.data || []).find((item) => String(item.id) === String(portalId));
        setPortalName(portal?.name || 'Tu portal');
        setMemberCount((membersResponse.data || []).length);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [portalId]);

  return (
    <PortalSidebar>
      <div ref={storyRef} className="relative h-[500vh] bg-[#fffaf7]">
        <section className="sticky top-0 h-screen overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(251,146,60,0.16),transparent_28%),radial-gradient(circle_at_82%_72%,rgba(244,63,94,0.12),transparent_30%)]"/>
          <motion.div className="pointer-events-none absolute -left-24 top-1/3 h-72 w-72 rounded-full border border-orange-200/70" animate={prefersReducedMotion ? {} : { scale: [1, 1.12, 1], rotate: [0, 18, 0] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}/>
          <motion.div className="pointer-events-none absolute -right-24 bottom-10 h-96 w-96 rounded-full border border-rose-200/60" animate={prefersReducedMotion ? {} : { scale: [1.1, 1, 1.1], rotate: [0, -15, 0] }} transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}/>

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div key={sceneIndex} custom={direction} variants={{ enter: (dir) => ({ opacity: 0, x: dir * 90, scale: .88, filter: 'blur(12px)' }), center: { opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }, exit: (dir) => ({ opacity: 0, x: dir * -70, scale: 1.06, filter: 'blur(10px)' }) }} initial={prefersReducedMotion ? false : 'enter'} animate="center" exit={prefersReducedMotion ? undefined : 'exit'} transition={{ duration: prefersReducedMotion ? 0 : .55, ease: [0.22, 1, 0.36, 1] }} className="absolute inset-0">
              <SceneContent sceneIndex={sceneIndex} portalId={portalId} portalName={portalName} memberCount={memberCount}/>
            </motion.div>
          </AnimatePresence>

          <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-orange-100 bg-white/85 px-4 py-2 shadow-lg backdrop-blur">
            {scenes.map((scene, index) => <span key={scene.eyebrow} className={`h-2 rounded-full transition-all duration-300 ${index === sceneIndex ? 'w-8 bg-orange-500' : 'w-2 bg-orange-200'}`}/>) }
          </div>
          <p className="absolute bottom-6 right-7 hidden text-xs font-bold uppercase tracking-widest text-orange-300 sm:block">Desliza para descubrir</p>
        </section>
      </div>
      <BelowFoldContent portalId={portalId} portalName={portalName}/>
    </PortalSidebar>
  );
};

export default PortalWorkspacePage;
