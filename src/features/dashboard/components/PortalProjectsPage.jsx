import { motion } from 'framer-motion';
import PortalSidebar from './PortalSidebar.jsx';

const PortalProjectsPage = () => {
  return (
    <PortalSidebar>
      <div className="relative min-h-screen overflow-hidden bg-[#fafafa]">
        <motion.svg
          className="pointer-events-none absolute inset-0 z-0 h-full w-full select-none"
          viewBox="0 0 1440 900"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <motion.path
            d="M-100 165 C 180 70, 430 310, 700 200 S 1110 80, 1520 190"
            fill="none"
            stroke="#fb923c"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.14"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.14 }}
            transition={{ duration: 1.7, ease: 'easeInOut' }}
          />
          <motion.path
            d="M-120 760 C 180 650, 470 810, 730 700 S 1100 520, 1540 650"
            fill="none"
            stroke="#fb7185"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.14"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.14 }}
            transition={{ duration: 2, ease: 'easeInOut', delay: 0.15 }}
          />
        </motion.svg>
      </div>
    </PortalSidebar>
  );
};

export default PortalProjectsPage;
