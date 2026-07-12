import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const sections = [
  {
    id: 'terminos',
    title: 'Términos de uso',
    subsections: [
      {
        heading: '1. Aceptación de los términos',
        body: 'Al acceder y usar EvalúaPro, el usuario acepta quedar sujeto a los presentes términos. Si no está de acuerdo con alguno de ellos, debe abstenerse de usar la plataforma.',
      },
      {
        heading: '2. Descripción del servicio',
        body: 'EvalúaPro es una plataforma de gestión académica digital que permite a evaluadores crear grupos, diseñar instrumentos de evaluación, registrar resultados y generar reportes. Los estudiantes pueden consultar sus calificaciones y retroalimentación.',
      },
      {
        heading: '3. Cuentas y acceso',
        body: 'Cada usuario es responsable de mantener la confidencialidad de sus credenciales. Las cuentas son personales e intransferibles. El usuario debe notificar de inmediato cualquier uso no autorizado de su cuenta.',
      },
      {
        heading: '4. Uso aceptable',
        body: 'El usuario se compromete a usar la plataforma únicamente con fines académicos legítimos, a no intentar acceder a datos de otros usuarios sin autorización y a no realizar acciones que puedan degradar el rendimiento o la seguridad del sistema.',
      },
      {
        heading: '5. Propiedad intelectual',
        body: 'El código, diseño y contenidos propios de EvalúaPro son propiedad de sus desarrolladores. Los datos académicos introducidos por evaluadores y estudiantes son de su exclusiva titularidad.',
      },
      {
        heading: '6. Modificaciones del servicio',
        body: 'Nos reservamos el derecho de modificar, suspender o discontinuar cualquier parte de la plataforma en cualquier momento, con o sin previo aviso.',
      },
      {
        heading: '7. Limitación de responsabilidad',
        body: 'EvalúaPro no se hace responsable por pérdida de datos derivada de fallos técnicos ajenos a nuestra voluntad, ni por el uso indebido de la plataforma por parte de terceros.',
      },
    ],
  },
  {
    id: 'privacidad',
    title: 'Política de privacidad',
    subsections: [
      {
        heading: '1. Datos que recopilamos',
        body: 'Recopilamos la información que el usuario proporciona al crear su cuenta (nombre, correo electrónico, rol) y los datos académicos que introduce durante el uso normal de la plataforma (evaluaciones, calificaciones, comentarios).',
      },
      {
        heading: '2. Finalidad del tratamiento',
        body: 'Los datos se utilizan exclusivamente para prestar el servicio: gestionar la autenticación, mostrar resultados académicos, generar reportes y mejorar la experiencia de la plataforma.',
      },
      {
        heading: '3. Almacenamiento y seguridad',
        body: 'Los datos se almacenan en servidores protegidos. Aplicamos medidas técnicas razonables (cifrado en tránsito, autenticación mediante tokens seguros) para proteger la información de accesos no autorizados.',
      },
      {
        heading: '4. Compartición de datos',
        body: 'No compartimos información personal con terceros con fines comerciales. Los datos académicos de un estudiante solo son visibles para el propio estudiante y los evaluadores y administradores de la institución a la que pertenece.',
      },
      {
        heading: '5. Retención de datos',
        body: 'Conservamos los datos mientras la cuenta esté activa. Tras la eliminación de una cuenta, los datos personales se borran en un plazo máximo de 30 días, salvo obligación legal de conservación.',
      },
      {
        heading: '6. Derechos del usuario',
        body: 'El usuario tiene derecho a acceder, rectificar y solicitar la eliminación de sus datos personales. Para ejercer estos derechos puede contactarnos a través del correo institucional del administrador de la plataforma.',
      },
      {
        heading: '7. Cookies',
        body: 'EvalúaPro no utiliza cookies de seguimiento ni publicidad. La sesión del usuario se gestiona mediante un token almacenado en sessionStorage, que se elimina al cerrar el navegador.',
      },
      {
        heading: '8. Cambios a esta política',
        body: 'Podemos actualizar esta política periódicamente. Los cambios se comunicarán dentro de la plataforma y la fecha de última actualización se indicará al pie de esta página.',
      },
    ],
  },
];

function LegalPage() {
  return (
    <div className="legal-page">
      <div className="legal-header">
        <Link className="legal-back" to="/">
          <ArrowLeft size={16} aria-hidden="true" />
          Volver al inicio
        </Link>
        <p className="eyebrow">EvalúaPro</p>
        <h1>Políticas de la plataforma</h1>
        <p className="legal-intro">
          Estos documentos describen las condiciones bajo las cuales puedes usar EvalúaPro y cómo
          tratamos la información que nos confías. Última actualización: julio 2026.
        </p>
        <nav className="legal-toc" aria-label="Secciones">
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="legal-toc-link">
              {s.title}
            </a>
          ))}
        </nav>
      </div>

      {sections.map((section) => (
        <section key={section.id} id={section.id} className="legal-section">
          <h2>{section.title}</h2>
          {section.subsections.map((sub) => (
            <div key={sub.heading} className="legal-subsection">
              <h3>{sub.heading}</h3>
              <p>{sub.body}</p>
            </div>
          ))}
        </section>
      ))}

      <footer className="legal-footer">
        <p>¿Tienes preguntas? Contacta al administrador de tu institución.</p>
        <Link className="button button-secondary" to="/">
          Volver al inicio
        </Link>
      </footer>
    </div>
  );
}

export default LegalPage;
