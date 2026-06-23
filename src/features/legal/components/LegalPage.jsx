import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const companyRows = [
  ['Razón social', 'EVENOR TECH, S.L.U.'],
  ['NIF', 'B91790527'],
  ['Dominio', 'WWW.EVENOS-TECH.COM'],
  ['Dirección postal', 'AVDA REPUBLICA ARGENTINA 27 B SEVILLA, 41011 SEVILLA (SEVILLA)'],
  ['Dirección electrónica', 'info@evenor-tech.com'],
  ['Teléfonos', '651549721'],
  ['N.º registro / datos adicionales', ''],
];

const treatments = [
  {
    name: 'Acciones comerciales formulario web',
    details: [
      ['Finalidad', 'Captación, registro y tratamiento de datos con finalidades de atender sus consultas y/o solicitudes, así como de publicidad y prospección comercial.'],
      ['Plazo de conservación', 'Mientras se mantenga el consentimiento prestado, salvo obligación legal.'],
      ['Base legítima', 'El consentimiento del interesado.'],
      ['Tipología de datos', 'Datos básicos: nombre y apellidos, dirección electrónica.'],
    ],
  },
  {
    name: 'Gestión usuarios web',
    details: [
      ['Finalidad', 'Captación, registro y tratamiento de datos del usuario.'],
      ['Plazo de conservación', 'Mientras se mantenga el consentimiento prestado, salvo obligación legal.'],
      ['Base legítima', 'El consentimiento del interesado.'],
      ['Tipología de datos', 'Datos básicos: nombre y apellidos, dirección electrónica.'],
    ],
  },
  {
    name: 'Newsletter',
    details: [
      ['Finalidad', 'Gestión de la suscripción a la newsletter, para realizar los envíos correspondientes.'],
      ['Plazo de conservación', 'Mientras se mantenga el consentimiento prestado.'],
      ['Base legítima', 'El consentimiento del interesado.'],
      ['Tipología de datos', 'Datos básicos: nombre y apellidos, dirección electrónica.'],
    ],
  },
  {
    name: 'Instalación de cookies',
    details: [
      ['Finalidad', 'Gestión e instalación de las cookies.'],
      ['Plazo de conservación', 'Mientras se mantenga el consentimiento prestado.'],
      ['Base legítima', 'El consentimiento del interesado.'],
      ['Tipología de datos', 'Datos básicos: dirección electrónica, dirección IP.'],
    ],
  },
  {
    name: 'Gestión Formulario web',
    details: [
      ['Finalidad', 'Atender sus consultas y/o solicitudes.'],
      ['Plazo de conservación', 'Mientras se mantenga el consentimiento prestado.'],
      ['Base legítima', 'El consentimiento del interesado.'],
      ['Tipología de datos', 'Datos básicos: nombre y apellidos, dirección electrónica, dirección IP.'],
    ],
  },
];

const rights = [
  ['Acceso', 'Obtener confirmación sobre si se están tratando sus datos y, en tal caso, acceder a los datos personales tratados y a la información legal del tratamiento.'],
  ['Rectificación', 'Solicitar que se modifiquen los datos inexactos o incompletos.'],
  ['Limitación del tratamiento', 'Solicitar que se limiten los fines del tratamiento en determinados supuestos.'],
  ['Supresión', 'Solicitar la supresión de sus datos personales, salvo en los casos previstos por la normativa aplicable.'],
  ['Portabilidad', 'Recibir los datos facilitados en formato estructurado, de uso común y lectura mecánica, y transmitirlos a otro responsable cuando proceda.'],
  ['Oposición', 'Solicitar que no se lleve a cabo el tratamiento de sus datos o que se cese en el mismo cuando proceda.'],
  ['No ser objeto de decisiones automatizadas', 'No ser objeto de decisiones basadas únicamente en tratamientos automatizados, incluida la elaboración de perfiles, cuando produzcan efectos jurídicos o le afecten significativamente.'],
  ['Retirada del consentimiento', 'Retirar en cualquier momento y de manera gratuita el consentimiento otorgado para tratamientos basados en este.'],
];

const cookieTypes = [
  ['Según la entidad que las gestione', 'Cookies propias', 'Se envían al equipo terminal del usuario desde un equipo o dominio gestionado por el propio editor.'],
  ['Según la entidad que las gestione', 'Cookies de tercero', 'Se envían al equipo terminal del usuario desde un equipo o dominio no gestionado por el editor, sino por otra entidad.'],
  ['Según el plazo de tiempo que permanezcan activadas', 'Cookies de sesión', 'Recaban y almacenan datos mientras el usuario accede a una página web y desaparecen al terminar la sesión.'],
  ['Según el plazo de tiempo que permanezcan activadas', 'Cookies persistentes', 'Los datos siguen almacenados en el terminal durante un periodo definido por el responsable de la cookie.'],
  ['Según su finalidad', 'Cookies técnicas', 'Permiten la navegación por una página web, plataforma o aplicación y la utilización de sus opciones o servicios.'],
  ['Según su finalidad', 'Cookies de personalización', 'Permiten aplicar características propias para la navegación del usuario por el sitio web, como el idioma.'],
  ['Según su finalidad', 'Cookies de análisis', 'Permiten el seguimiento y análisis del comportamiento de los usuarios para medir actividad e introducir mejoras.'],
  ['Según su finalidad', 'Cookies publicitarias', 'Permiten al editor incluir espacios publicitarios en la página web.'],
  ['Según su finalidad', 'Cookies de publicidad comportamental', 'Almacenan información del comportamiento de los usuarios para desarrollar un perfil específico y mostrar publicidad en función del mismo.'],
];

const emptyCookieRows = ['Técnicas', 'Personalización', 'Análisis', 'Publicidad / Publicidad comportamental'];

const basicFormRows = [
  ['Responsable', 'EVENOR TECH, S.L.U.'],
  ['Finalidad', 'Atender sus consultas y/o solicitudes.'],
  ['Derechos', 'Acceder, rectificar y suprimir los datos, así como otros derechos, como se explica en la información adicional.'],
  ['Información adicional', 'Puede consultar la información adicional y detallada sobre Protección de Datos en nuestra página web, apartado Política de Privacidad.'],
];

const legalPages = {
  '/aviso-legal': {
    eyebrow: 'Página: Aviso Legal',
    title: 'Aviso Legal',
    content: <LegalNotice />,
  },
  '/politica-privacidad': {
    eyebrow: 'Página: Política de Privacidad',
    title: 'Política de Privacidad',
    content: <PrivacyPolicy />,
  },
  '/politica-cookies': {
    eyebrow: 'Página: Política de Cookies',
    title: 'Política de Cookies',
    content: <CookiePolicy />,
  },
};

function DataTable({ rows, headers }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-orange-100 bg-white shadow-sm">
      <table className="w-full min-w-[620px] text-left text-sm">
        {headers && (
          <thead className="bg-orange-50 text-orange-950">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-3 font-semibold">{header}</th>
              ))}
            </tr>
          </thead>
        )}
        <tbody className="divide-y divide-orange-100">
          {rows.map((row, index) => (
            <tr key={index} className="align-top">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className={`px-4 py-3 ${cellIndex === 0 ? 'font-semibold text-orange-950' : 'text-orange-900'}`}>
                  {cell || '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-orange-950">{title}</h2>
      <div className="space-y-4 text-sm leading-7 text-orange-950/80">{children}</div>
    </section>
  );
}

function LegalNotice() {
  return (
    <>
      <Section title="Datos identificativos">
        <p>En cumplimiento de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), EVENOR TECH, S.L.U. informa que es titular del sitio web.</p>
        <DataTable rows={companyRows} />
      </Section>

      <Section title="Usuario y régimen de responsabilidades">
        <p>La navegación, acceso y uso por el sitio web de EVENOR TECH, S.L.U. confiere la condición de usuario. El usuario asume su responsabilidad en el uso correcto del sitio web.</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>La veracidad y licitud de las informaciones aportadas por el usuario en los formularios.</li>
          <li>El uso de la información, servicios y datos ofrecidos conforme a estas condiciones, la Ley, la moral, las buenas costumbres y el orden público.</li>
        </ul>
      </Section>

      <Section title="Política de enlaces y exenciones de responsabilidad">
        <p>EVENOR TECH, S.L.U. no se hace responsable del contenido de los sitios web a los que el usuario pueda acceder a través de enlaces establecidos en su sitio web, salvo que tenga conocimiento efectivo de que la actividad o información enlazada es ilícita y no actúe con diligencia para suprimir o inutilizar el enlace.</p>
        <p>EVENOR TECH, S.L.U. declara haber adoptado las medidas necesarias para evitar daños derivados de la navegación por su sitio web, sin garantizar la disponibilidad técnica, exactitud, veracidad, validez o legalidad de sitios ajenos a su propiedad.</p>
      </Section>

      <Section title="Modificaciones">
        <p>EVENOR TECH, S.L.U. se reserva la facultad de efectuar modificaciones y actualizaciones de la información contenida en su sitio web o en su configuración y presentación, en cualquier momento y sin necesidad de previo aviso.</p>
      </Section>

      <Section title="Indicación de precios">
        <p>En caso de que se muestren precios de productos y/o servicios, los indicados en pantalla serán los vigentes en cada momento. Los precios serán indicados en euros e incorporarán el IVA, salvo indicación expresa en contrario.</p>
      </Section>

      <Section title="Propiedad intelectual e industrial">
        <p>EVENOR TECH, S.L.U., por sí misma o como cesionaria, es titular de todos los derechos de propiedad intelectual e industrial de su página web y de los elementos contenidos en la misma.</p>
        <p>Quedan prohibidas la reproducción, distribución y comunicación pública, incluida su modalidad de puesta a disposición, de la totalidad o parte de los contenidos con fines comerciales, sin autorización de EVENOR TECH, S.L.U.</p>
      </Section>

      <Section title="Acciones legales, legislación aplicable y jurisdicción">
        <p>Si el usuario desea presentar una reclamación, deberá contactar mediante el correo electrónico info@evenor-tech.com. EVENOR TECH, S.L.U. se reserva la facultad de presentar las acciones civiles o penales oportunas por la utilización indebida del sitio web y sus contenidos.</p>
        <p>La relación entre el usuario y el prestador se regirá por la normativa vigente y de aplicación en el territorio español.</p>
        <p><strong>Última actualización:</strong> 4 de mayo de 2026.</p>
      </Section>
    </>
  );
}

function PrivacyPolicy() {
  return (
    <>
      <Section title="Datos del propietario de la web">
        <DataTable rows={companyRows} />
      </Section>

      <Section title="Protección de datos">
        <p>De conformidad con la normativa vigente y aplicable en protección de datos de carácter personal, le informamos que sus datos serán incorporados al sistema de tratamiento titularidad de EVENOR TECH, S.L.U.</p>
        <DataTable
          headers={['Tratamiento', 'Información']}
          rows={treatments.map((treatment) => [
            treatment.name,
            <div className="space-y-2" key={treatment.name}>
              {treatment.details.map(([label, value]) => (
                <p key={label}><strong>{label}:</strong> {value}</p>
              ))}
            </div>,
          ])}
        />
      </Section>

      <Section title="Derechos de los interesados">
        <p>Los usuarios podrán ejercer ante EVENOR TECH, S.L.U. los siguientes derechos:</p>
        <ul className="list-disc space-y-2 pl-5">
          {rights.map(([name, description]) => (
            <li key={name}><strong>Derecho de {name}:</strong> {description}</li>
          ))}
        </ul>
        <p>Para ejercer estos derechos, deberá presentar un escrito a la dirección AVDA REPUBLICA ARGENTINA 27 B SEVILLA, 41011 SEVILLA (SEVILLA), a la atención de EVENOR TECH, S.L.U., o enviar un correo electrónico a info@evenor-tech.com.</p>
        <p>El escrito deberá identificar fehacientemente al solicitante, concretar el derecho que desea ejercer, indicar una dirección postal o electrónica a efectos de notificaciones y aportar los documentos acreditativos necesarios.</p>
        <p>También tiene derecho a presentar una reclamación ante la Agencia Española de Protección de Datos.</p>
      </Section>

      <Section title="Redes sociales">
        <p>EVENOR TECH, S.L.U. ha creado perfiles en Facebook, X, Instagram y Linkedin con la finalidad principal de publicitar sus productos y servicios.</p>
        <p>Al unirse a la página creada por EVENOR TECH, S.L.U. en redes sociales, el usuario consiente el tratamiento de aquellos datos personales publicados en su perfil. Estos datos se utilizan dentro de la propia red social y no se incorporan a ningún sistema de tratamiento.</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Acceso a la información pública del perfil.</li>
          <li>Publicación en el perfil del usuario de información ya publicada en la página de EVENOR TECH, S.L.U.</li>
          <li>Envío de mensajes personales e individuales a través de los canales de la red social.</li>
          <li>Actualizaciones del estado de la página publicadas en el perfil del usuario.</li>
        </ul>
      </Section>

      <Section title="Publicaciones, concursos y publicidad">
        <p>El usuario podrá publicar comentarios, enlaces, imágenes, fotografías u otros contenidos soportados por la red social, siempre que sea titular de estos o cuente con los derechos y autorizaciones necesarios.</p>
        <p>EVENOR TECH, S.L.U. se reserva el derecho a retirar contenidos que vulneren la moral, la ética, el buen gusto, el decoro, los derechos de propiedad intelectual o industrial, el derecho a la imagen o la Ley.</p>
        <p>EVENOR TECH, S.L.U. podrá realizar concursos, promociones y acciones publicitarias en redes sociales cumpliendo con la LSSI-CE y la normativa aplicable.</p>
        <p><strong>Políticas de privacidad de redes sociales:</strong> Facebook, X, Instagram y Linkedin.</p>
        <p><strong>Última actualización:</strong> 4 de mayo de 2026.</p>
      </Section>
    </>
  );
}

function CookiePolicy() {
  return (
    <>
      <Section title="Información general">
        <p>Conforme a lo dispuesto en el artículo 22.2 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), EVENOR TECH, S.L.U. informa sobre las cookies que utiliza y sus finalidades.</p>
        <p>Este sitio web utiliza cookies y/o tecnologías similares que almacenan y recuperan información cuando navegas. Las cookies permiten almacenar y recuperar información sobre los hábitos de navegación de un usuario o de su equipo y pueden utilizarse para reconocer al usuario.</p>
        <p>El usuario puede modificar la configuración personalizada AQUÍ.</p>
      </Section>

      <Section title="Tipos de cookies">
        <DataTable headers={['Criterio', 'Tipo', 'Descripción']} rows={cookieTypes} />
      </Section>

      <Section title="Cookies propias">
        <DataTable
          headers={['Tipo', 'Titular', 'Cookie', 'Finalidad', 'Conservación']}
          rows={emptyCookieRows.map((type) => [type, '', '', '', ''])}
        />
      </Section>

      <Section title="Cookies de terceros">
        <DataTable
          headers={['Tipo', 'Titular', 'Cookie', 'Finalidad', 'Conservación']}
          rows={emptyCookieRows.map((type) => [type, '', '', '', ''])}
        />
      </Section>

      <Section title="Transferencias internacionales">
        <p>Puede informarse de las transferencias internacionales a terceros países que, en su caso, realizan los terceros identificados en esta política de cookies en sus correspondientes políticas.</p>
        <DataTable
          headers={['Titular', 'Cookie', 'País de la transferencia', 'Régimen aplicado']}
          rows={[['', '', '', ''], ['', '', '', ''], ['', '', '', '']]}
        />
      </Section>

      <Section title="Configuración del navegador">
        <p>Si acepta cookies de terceros, deberá eliminarlas desde las opciones del navegador o desde el sistema ofrecido por el propio tercero.</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Firefox: https://support.mozilla.org/es/kb/cookies-informacion-que-los-sitios-web-guardan-en-</li>
          <li>Chrome: http://support.google.com/chrome/bin/answer.py?hl=es&answer=95647</li>
          <li>Internet Explorer: http://windows.microsoft.com/es-es/internet-explorer/delete-manage-cookies#ie=ie-10</li>
          <li>Microsoft Edge: https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09</li>
          <li>Safari: https://support.apple.com/kb/ph17191?locale=es_ES</li>
          <li>Opera: https://help.opera.com/en/latest/web-preferences/#cookies</li>
        </ul>
        <p>Para conocer más información sobre el tratamiento de datos personales, le recomendamos visitar nuestro apartado Política de Privacidad.</p>
        <p><strong>Última actualización:</strong> 4 de mayo de 2026.</p>
      </Section>

      <Section title="Banner de cookies">
        <p><strong>Texto a configurar:</strong> Este sitio web utiliza Cookies propias y de terceros, para recopilar información con la finalidad de mejorar nuestros servicios y mostrarle publicidad relacionada con sus preferencias, en base a un perfil elaborado a partir de sus hábitos de navegación. Puede obtener más información en la Política de Cookies.</p>
        <div className="flex flex-wrap gap-3">
          {['ACEPTAR TODO', 'RECHAZAR TODO', 'CONFIGURACIÓN'].map((button) => (
            <span key={button} className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-900">
              [{button}]
            </span>
          ))}
        </div>
      </Section>

      <Section title="Información básica sobre protección de datos - Gestión Formulario web">
        <DataTable rows={basicFormRows} />
        <p><strong>Checkbox obligatorio:</strong> He leído y acepto la información básica de protección de datos.</p>
      </Section>
    </>
  );
}

const LegalPage = () => {
  const location = useLocation();
  const page = legalPages[location.pathname] || legalPages['/aviso-legal'];

  return (
    <div className="min-h-screen bg-[#fafafa] px-4 py-8 sm:px-6 lg:px-8">
      <motion.main
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mx-auto max-w-5xl"
      >
        <Link to="/dashboard" className="inline-flex text-sm font-medium text-orange-500 transition hover:text-orange-700">
          Volver al dashboard
        </Link>
        <header className="my-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-500">{page.eyebrow}</p>
          <h1 style={{ fontFamily: "'AlfaSlabOne', serif" }} className="mt-2 text-4xl text-orange-950">
            {page.title}
          </h1>
        </header>
        <article className="space-y-10 rounded-2xl border border-orange-100 bg-white/90 p-5 shadow-sm sm:p-8">
          {page.content}
        </article>
      </motion.main>
    </div>
  );
};

export default LegalPage;
