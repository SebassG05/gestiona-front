import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Copy, Crown, MailPlus, Send, Settings, Shield, Trash2, Users } from 'lucide-react';
import { useParams } from 'react-router-dom';
import PortalSidebar from './PortalSidebar.jsx';
import { getPortalMembers, invitePortalMembers, removePortalMember } from '../services/portalService.js';

const inputClass =
  'w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm text-orange-950 placeholder-orange-300 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100';

const buildInviteLink = (code) => `${window.location.origin}/login?invite=${encodeURIComponent(code)}`;

const PortalSettingsPage = () => {
  const { portalId } = useParams();
  const [emailInput, setEmailInput] = useState('');
  const [invites, setInvites] = useState([]);
  const [sentInvites, setSentInvites] = useState([]);
  const [copiedValue, setCopiedValue] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [members, setMembers] = useState([]);
  const [membersError, setMembersError] = useState('');
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [removingMemberId, setRemovingMemberId] = useState('');

  const portalJoinReference = useMemo(() => portalId || '', [portalId]);
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }, []);
  const isOwner = members.some((member) => member.role === 'owner' && member.id === currentUser.id);

  const loadMembers = async () => {
    setIsLoadingMembers(true);
    setMembersError('');

    try {
      const response = await getPortalMembers(portalId);
      setMembers(response.data || []);
    } catch (err) {
      setMembersError(err.response?.data?.message || 'No se pudieron cargar los miembros');
    } finally {
      setIsLoadingMembers(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [portalId]);

  const addInvite = () => {
    const email = emailInput.trim().toLowerCase();

    if (!email || !/^\S+@\S+\.\S+$/.test(email) || invites.includes(email)) {
      return;
    }

    setInvites((current) => [...current, email]);
    setEmailInput('');
    setError('');
  };

  const removeInvite = (email) => {
    setInvites((current) => current.filter((item) => item !== email));
  };

  const copyValue = async (value, label = 'Copiado') => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopiedValue(value);
      setSuccessMessage(label);
      window.setTimeout(() => setCopiedValue(''), 1800);
    } catch {
      setError('No se pudo copiar al portapapeles');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    const pendingInvites = [...invites];
    const email = emailInput.trim().toLowerCase();

    if (email && /^\S+@\S+\.\S+$/.test(email) && !pendingInvites.includes(email)) {
      pendingInvites.push(email);
    }

    if (pendingInvites.length === 0) {
      setError('Añade al menos un correo para enviar la invitacion');
      return;
    }

    setIsSending(true);

    try {
      const response = await invitePortalMembers({ portalId, invites: pendingInvites });
      setSentInvites(response.data.invites || []);
      setInvites([]);
      setEmailInput('');
      setSuccessMessage('Invitaciones enviadas correctamente');
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudieron enviar las invitaciones');
    } finally {
      setIsSending(false);
    }
  };

  const handleRemoveMember = async (member) => {
    if (!member?.id || member.role === 'owner' || member.id === currentUser.id) {
      return;
    }

    const confirmed = window.confirm(`Expulsar a ${member.username || member.email} de este portal?`);

    if (!confirmed) {
      return;
    }

    setRemovingMemberId(member.id);
    setMembersError('');

    try {
      await removePortalMember({ portalId, memberId: member.id });
      setMembers((current) => current.filter((item) => item.id !== member.id));
      setSuccessMessage('Miembro expulsado correctamente');
    } catch (err) {
      setMembersError(err.response?.data?.message || 'No se pudo expulsar al miembro');
    } finally {
      setRemovingMemberId('');
    }
  };

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
            d="M-120 190 C 170 90, 420 290, 690 210 S 1090 85, 1540 230"
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
            d="M-140 760 C 180 650, 480 815, 760 690 S 1110 515, 1540 665"
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

        <main className="relative z-10 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <motion.header
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="rounded-[26px] border border-orange-100 bg-white/90 p-6 shadow-sm sm:p-8"
          >
            <p className="text-sm font-semibold uppercase tracking-wide text-rose-400">Ajustes del portal</p>
            <h1
              style={{ fontFamily: "'AlfaSlabOne', serif" }}
              className="mt-3 text-3xl leading-tight text-orange-950 sm:text-4xl xl:text-5xl"
            >
              Configuracion del portal
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-orange-700 sm:text-base">
              Gestiona las invitaciones del equipo y comparte los codigos necesarios para que otras personas puedan
              unirse al portal.
            </p>
          </motion.header>

          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.08 }}
            className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]"
          >
            <form onSubmit={handleSubmit} className="rounded-[26px] border border-orange-100 bg-white/92 p-6 shadow-sm sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orange-50 text-orange-500">
                    <MailPlus size={22} strokeWidth={2.1} />
                  </span>
                  <div>
                    <h2 className="text-2xl font-semibold text-orange-950">Invitar personas</h2>
                    <p className="mt-1 text-sm leading-6 text-orange-600">
                      Añade uno o varios correos. Al enviar, cada persona recibira un email con su codigo de invitacion.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-7">
                <label htmlFor="settings-invite-email" className="mb-2 block text-sm font-semibold text-orange-950">
                  Email de invitacion
                </label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    id="settings-invite-email"
                    type="email"
                    value={emailInput}
                    onChange={(event) => setEmailInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        addInvite();
                      }
                    }}
                    className={inputClass}
                    placeholder="persona@email.com"
                  />
                  <button
                    type="button"
                    onClick={addInvite}
                    className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-orange-100 bg-white px-5 py-3 text-sm font-semibold text-orange-900 transition hover:bg-orange-50"
                  >
                    Añadir
                  </button>
                </div>
              </div>

              <div className="mt-5 min-h-24 rounded-2xl border border-orange-100 bg-orange-50/40 p-4">
                {invites.length === 0 ? (
                  <p className="text-sm text-orange-300">Los correos que añadas apareceran aqui antes de enviar.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {invites.map((email) => (
                      <span
                        key={email}
                        className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white px-3 py-2 text-sm font-medium text-orange-900 shadow-sm"
                      >
                        {email}
                        <button
                          type="button"
                          onClick={() => removeInvite(email)}
                          className="cursor-pointer text-orange-400 transition hover:text-red-500"
                          aria-label={`Eliminar ${email}`}
                        >
                          x
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {error && (
                <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                  {error}
                </p>
              )}

              {successMessage && !error && (
                <p className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                  <Check size={16} strokeWidth={2.2} />
                  {successMessage}
                </p>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={isSending}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-orange-600 hover:to-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send size={17} strokeWidth={2.1} />
                  {isSending ? 'Enviando...' : 'Enviar invitacion'}
                </button>
              </div>
            </form>

            <aside className="space-y-6">
              <section className="rounded-[26px] border border-orange-100 bg-white/92 p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orange-50 text-orange-500">
                    <Settings size={21} strokeWidth={2.1} />
                  </span>
                  <div>
                    <h2 className="text-xl font-semibold text-orange-950">Codigo del portal</h2>
                    <p className="mt-1 text-sm leading-6 text-orange-600">
                      Identificador interno de esta sala.
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-orange-100 bg-orange-50/50 p-4">
                  <p className="break-all font-mono text-sm font-semibold text-orange-950">{portalJoinReference}</p>
                  <button
                    type="button"
                    onClick={() => copyValue(portalJoinReference, 'Codigo del portal copiado')}
                    className="mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm font-semibold text-orange-900 transition hover:bg-orange-50"
                  >
                    <Copy size={16} strokeWidth={2.1} />
                    Copiar codigo
                  </button>
                </div>
              </section>

              <section className="rounded-[26px] border border-orange-100 bg-white/92 p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-orange-950">Ultimas invitaciones</h2>
                <p className="mt-1 text-sm leading-6 text-orange-600">
                  Copia el codigo o enlace de acceso de las invitaciones que acabas de enviar.
                </p>

                <div className="mt-5 space-y-3">
                  {sentInvites.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-orange-100 bg-orange-50/40 px-4 py-5 text-sm text-orange-300">
                      Aun no has enviado invitaciones desde esta pantalla.
                    </p>
                  ) : (
                    sentInvites.map((invite) => {
                      const inviteLink = buildInviteLink(invite.code);

                      return (
                        <article key={`${invite.email}-${invite.code}`} className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4">
                          <p className="truncate text-sm font-semibold text-orange-950">{invite.email}</p>
                          <p className="mt-2 font-mono text-lg font-bold tracking-[0.18em] text-orange-600">{invite.code}</p>
                          <div className="mt-4 grid gap-2 sm:grid-cols-2">
                            <button
                              type="button"
                              onClick={() => copyValue(invite.code, 'Codigo de invitacion copiado')}
                              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-orange-100 bg-white px-3 py-2 text-xs font-semibold text-orange-900 transition hover:bg-orange-50"
                            >
                              <Copy size={14} strokeWidth={2.1} />
                              {copiedValue === invite.code ? 'Copiado' : 'Codigo'}
                            </button>
                            <button
                              type="button"
                              onClick={() => copyValue(inviteLink, 'Enlace de invitacion copiado')}
                              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-orange-100 bg-white px-3 py-2 text-xs font-semibold text-orange-900 transition hover:bg-orange-50"
                            >
                              <Copy size={14} strokeWidth={2.1} />
                              {copiedValue === inviteLink ? 'Copiado' : 'Enlace'}
                            </button>
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              </section>
            </aside>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.14 }}
            className="mt-6 rounded-[26px] border border-orange-100 bg-white/92 p-6 shadow-sm sm:p-8"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orange-50 text-orange-500">
                  <Users size={22} strokeWidth={2.1} />
                </span>
                <div>
                  <h2 className="text-2xl font-semibold text-orange-950">Personas dentro del portal</h2>
                  <p className="mt-1 text-sm leading-6 text-orange-600">
                    Consulta quien tiene acceso a este portal. Solo el propietario puede expulsar miembros.
                  </p>
                </div>
              </div>

              <span className="rounded-full border border-orange-100 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700">
                {members.length} {members.length === 1 ? 'persona' : 'personas'}
              </span>
            </div>

            {membersError && (
              <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                {membersError}
              </p>
            )}

            <div className="mt-6 grid gap-3 lg:grid-cols-2">
              {isLoadingMembers ? (
                <p className="rounded-2xl border border-dashed border-orange-100 bg-orange-50/40 px-4 py-5 text-sm text-orange-300">
                  Cargando personas del portal...
                </p>
              ) : members.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-orange-100 bg-orange-50/40 px-4 py-5 text-sm text-orange-300">
                  Todavia no hay miembros visibles en este portal.
                </p>
              ) : (
                members.map((member) => {
                  const canRemove = isOwner && member.role !== 'owner' && member.id !== currentUser.id;

                  return (
                    <article
                      key={member.id}
                      className="flex flex-col gap-4 rounded-2xl border border-orange-100 bg-orange-50/35 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-orange-500 shadow-sm">
                          {member.role === 'owner' ? <Crown size={19} strokeWidth={2.1} /> : <Shield size={19} strokeWidth={2.1} />}
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-base font-semibold text-orange-950">
                              {member.username || member.email}
                            </h3>
                            <span className="rounded-full border border-orange-100 bg-white px-2.5 py-1 text-xs font-semibold text-orange-600">
                              {member.role === 'owner' ? 'Propietario' : 'Miembro'}
                            </span>
                          </div>
                          <p className="mt-1 truncate text-sm text-orange-500">{member.email}</p>
                        </div>
                      </div>

                      {canRemove && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member)}
                          disabled={removingMemberId === member.id}
                          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-500 transition hover:border-red-200 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Trash2 size={16} strokeWidth={2.1} />
                          {removingMemberId === member.id ? 'Expulsando...' : 'Expulsar'}
                        </button>
                      )}
                    </article>
                  );
                })
              )}
            </div>
          </motion.section>
        </main>
      </div>
    </PortalSidebar>
  );
};

export default PortalSettingsPage;
