const TERMINAL_STATUS_TERMS = [
  'aprob',
  'cancel',
  'cerrad',
  'conced',
  'descart',
  'enviad',
  'finaliz',
  'presentad',
  'rechaz',
  'sent',
  'submitted',
];

const normalizeStatus = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const startOfDay = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

export const isProposalClosed = (proposal) => {
  const status = normalizeStatus(`${proposal?.estado || ''} ${proposal?.lifecycleStatus || ''}`);
  return TERMINAL_STATUS_TERMS.some((term) => status.includes(term));
};

export const isProposalOverdue = (proposal, referenceDate = new Date()) => {
  if (!proposal?.deadlineApertura || isProposalClosed(proposal)) return false;

  const deadline = startOfDay(proposal.deadlineApertura);
  const today = startOfDay(referenceDate);
  return Boolean(deadline && today && deadline < today);
};

export const getEffectiveProposalStatus = (proposal, referenceDate = new Date()) =>
  isProposalOverdue(proposal, referenceDate) ? 'Vencida' : proposal?.estado || 'Sin estado';

export const getProposalOverdueDays = (proposal, referenceDate = new Date()) => {
  if (!isProposalOverdue(proposal, referenceDate)) return 0;

  const deadline = startOfDay(proposal.deadlineApertura);
  const today = startOfDay(referenceDate);
  return Math.floor((today.getTime() - deadline.getTime()) / 86_400_000);
};
