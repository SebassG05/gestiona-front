import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';

const PortalWorkspacePage = () => {
  const { portalId } = useParams();

  return (
    <div className="min-h-screen bg-[#fafafa] px-4 py-8 sm:px-6 lg:px-8">
      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mx-auto max-w-7xl"
      >
        <Link to="/dashboard" className="text-sm font-medium text-orange-500 transition hover:text-orange-700">
          Volver al dashboard
        </Link>

        <div className="mt-8 rounded-2xl border border-orange-100 bg-white/80 p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-orange-400">Portal activo</p>
          <h1 className="mt-2 text-2xl font-semibold text-orange-950">Área de trabajo del portal</h1>
          <p className="mt-2 text-sm text-orange-500">ID: {portalId}</p>
        </div>
      </motion.main>
    </div>
  );
};

export default PortalWorkspacePage;
