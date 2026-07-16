import { motion } from 'framer-motion';
import PortalSidebar from './PortalSidebar.jsx';

const PortalTeamPage = () => {
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
            d="M-110 170 C 175 75, 440 300, 710 205 S 1115 85, 1530 205"
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
            d="M-130 755 C 185 645, 470 815, 745 695 S 1110 520, 1540 660"
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

export default PortalTeamPage;
