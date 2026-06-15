import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2, Plus, Loader2, AlertCircle, Users, Key,
  ClipboardList, ChevronDown, ChevronUp, Trash2, UserPlus,
  RefreshCw, Check, Crown, Shield, User,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import {
  getOrgs, createOrg, deleteOrg,
  getOrgMembers, inviteOrgMember, removeOrgMember, updateMemberRole,
} from '../services/api'

const field = (obj, ...keys) => { for (const k of keys) if (obj?.[k] != null) return obj[k]; return null }

const ROLES = ['owner', 'admin', 'member', 'viewer']
const ROLE_STYLES = {
  owner:  'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  admin:  'text-crimson-400 bg-crimson-500/10 border-crimson-500/30',
  member: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  viewer: 'text-gray-400 bg-gray-500/10 border-gray-500/30',
}
const ROLE_ICONS = { owner: Crown, admin: Shield, member: User, viewer: User }

function RoleBadge({ role }) {
  const r   = (role ?? 'member').toLowerCase()
  const cls = ROLE_STYLES[r] ?? ROLE_STYLES.member
  const Icon = ROLE_ICONS[r] ?? User
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${cls}`}>
      <Icon className="w-2.5 h-2.5" />{r}
    </span>
  )
}

function Initials({ name, email }) {
  const src = name || email || '?'
  return src.slice(0, 2).toUpperCase()
}

/* ── Member row ── */
function MemberRow({ member, orgId, currentUserIsAdmin, onRemoved, onRoleChanged }) {
  const [removing, setRemoving]   = useState(false)
  const [newRole, setNewRole]     = useState('')
  const [changing, setChanging]   = useState(false)

  const id    = field(member, 'id', 'Id', 'userId', 'UserId')
  const name  = field(member, 'name', 'Name', 'displayName', 'DisplayName') ?? ''
  const email = field(member, 'email', 'Email') ?? ''
  const role  = field(member, 'role', 'Role') ?? 'member'

  const handleRemove = async () => {
    if (!confirm(`Remove ${email || name} from this org?`)) return
    setRemoving(true)
    try { await removeOrgMember(orgId, id); onRemoved(id) }
    catch (e) { alert(e.message || 'Failed to remove member') }
    finally { setRemoving(false) }
  }

  const handleRoleChange = async (r) => {
    setChanging(true)
    try { await updateMemberRole(orgId, id, r); onRoleChanged(id, r) }
    catch (e) { alert(e.message || 'Failed to change role') }
    finally { setChanging(false); setNewRole('') }
  }

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
      <div className="w-8 h-8 rounded-full bg-crimson-500/20 border border-crimson-500/30 flex items-center justify-center shrink-0">
        <span className="text-[10px] font-bold text-crimson-400"><Initials name={name} email={email} /></span>
      </div>
      <div className="flex-1 min-w-0">
        {name && <p className="text-xs font-semibold text-white truncate">{name}</p>}
        <p className="text-[10px] text-gray-500 truncate">{email}</p>
      </div>
      <RoleBadge role={role} />
      {currentUserIsAdmin && (
        <div className="flex items-center gap-1.5 shrink-0">
          <select
            value={newRole}
            onChange={e => { if (e.target.value) handleRoleChange(e.target.value) }}
            disabled={changing}
            className="text-[10px] bg-white/5 border border-white/10 text-gray-400 rounded-lg px-2 py-1 outline-none cursor-pointer"
          >
            <option value="">Change role…</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <button
            onClick={handleRemove}
            disabled={removing}
            className="text-gray-600 hover:text-red-400 transition-colors"
          >
            {removing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}
    </div>
  )
}

/* ── Org card ── */
function OrgCard({ org, onDeleted }) {
  const [expanded, setExpanded]   = useState(false)
  const [members, setMembers]     = useState(null)
  const [loadingM, setLoadingM]   = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole]   = useState('member')
  const [inviting, setInviting]   = useState(false)
  const [invitedOk, setInvitedOk] = useState(false)
  const [deleting, setDeleting]   = useState(false)

  const id   = field(org, 'id', 'Id', 'orgId', 'OrgId')
  const name = field(org, 'name', 'Name') ?? 'Unnamed Org'
  const slug = field(org, 'slug', 'Slug') ?? ''
  const role = field(org, 'role', 'Role', 'myRole', 'MyRole') ?? 'member'
  const memberCount = field(org, 'memberCount', 'MemberCount') ?? (members?.length ?? '—')
  const isAdmin = ['owner', 'admin'].includes((role ?? '').toLowerCase())

  const toggleMembers = async () => {
    const next = !expanded
    setExpanded(next)
    if (next && !members) {
      setLoadingM(true)
      try {
        const data = await getOrgMembers(id)
        setMembers(Array.isArray(data) ? data : (data?.members ?? data?.items ?? []))
      } catch { setMembers([]) }
      finally { setLoadingM(false) }
    }
  }

  const handleInvite = async (e) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviting(true)
    try {
      const res = await inviteOrgMember(id, { email: inviteEmail.trim(), role: inviteRole })
      const newMember = res?.member ?? res?.user ?? res
      if (newMember && typeof newMember === 'object') {
        setMembers(m => [...(m ?? []), newMember])
      }
      setInviteEmail(''); setInvitedOk(true)
      setTimeout(() => setInvitedOk(false), 3000)
    } catch (e) { alert(e.message || 'Failed to invite member') }
    finally { setInviting(false) }
  }

  const handleDelete = async () => {
    if (!confirm(`Delete organization "${name}"? This cannot be undone.`)) return
    setDeleting(true)
    try { await deleteOrg(id); onDeleted(id) }
    catch (e) { alert(e.message || 'Failed to delete org'); setDeleting(false) }
  }

  return (
    <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 flex items-start gap-4">
        <div className="w-10 h-10 bg-blue-500/15 border border-blue-500/30 rounded-xl flex items-center justify-center shrink-0">
          <Building2 className="w-5 h-5 text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-base font-bold text-white">{name}</p>
            <RoleBadge role={role} />
          </div>
          {slug && <p className="text-[10px] text-gray-500 font-mono mt-0.5">@{slug}</p>}
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Users className="w-3 h-3" /> {memberCount} member{memberCount !== 1 ? 's' : ''}
            </span>
            <Link
              to={`/org/${id}/apikeys`}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              <Key className="w-3 h-3" /> API Keys
            </Link>
            <Link
              to="/audit"
              className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <ClipboardList className="w-3 h-3" /> Audit Log
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isAdmin && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-gray-600 hover:text-red-400 transition-colors"
              title="Delete org"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
          )}
          <button
            onClick={toggleMembers}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Users className="w-3.5 h-3.5" />
            {expanded ? 'Hide' : 'Members'}
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-white/10 px-5 py-4 space-y-4">
          {loadingM && (
            <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading members…
            </div>
          )}
          {members && members.length === 0 && (
            <p className="text-xs text-gray-600">No members yet.</p>
          )}
          {members && members.length > 0 && (
            <div>
              {members.map((m, i) => (
                <MemberRow
                  key={field(m, 'id', 'Id', 'userId') ?? i}
                  member={m}
                  orgId={id}
                  currentUserIsAdmin={isAdmin}
                  onRemoved={(uid) => setMembers(ms => ms.filter(x => field(x, 'id', 'Id', 'userId') !== uid))}
                  onRoleChanged={(uid, r) => setMembers(ms => ms.map(x => field(x, 'id', 'Id', 'userId') === uid ? { ...x, role: r, Role: r } : x))}
                />
              ))}
            </div>
          )}

          {isAdmin && (
            <form onSubmit={handleInvite} className="border-t border-white/10 pt-4 space-y-3">
              <p className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5 text-crimson-400" /> Invite member
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="flex-1 bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-3 py-2 rounded-xl text-xs outline-none transition-colors"
                />
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value)}
                  className="bg-white/5 border border-white/15 text-gray-300 text-xs px-3 py-2 rounded-xl outline-none"
                >
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <button
                  type="submit"
                  disabled={inviting || !inviteEmail.trim()}
                  className="flex items-center gap-1 bg-crimson-500 hover:bg-crimson-600 disabled:bg-crimson-500/50 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors whitespace-nowrap"
                >
                  {inviting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (invitedOk ? <Check className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />)}
                  {invitedOk ? 'Invited!' : 'Invite'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Main page ── */
export default function OrganizationPage() {
  const [orgs, setOrgs]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [creating, setCreating] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName]   = useState('')
  const [newSlug, setNewSlug]   = useState('')

  const load = () => {
    setLoading(true); setError(null)
    getOrgs()
      .then(data => setOrgs(Array.isArray(data) ? data : (data?.organizations ?? data?.orgs ?? data?.items ?? [])))
      .catch(e => setError(e.message || 'Failed to load organizations'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    try {
      const org = await createOrg({ name: newName.trim(), slug: newSlug.trim() || undefined })
      setOrgs(o => [org, ...o])
      setNewName(''); setNewSlug(''); setShowCreate(false)
    } catch (e) { alert(e.message || 'Failed to create org') }
    finally { setCreating(false) }
  }

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        <div className="border-b border-white/10 py-12 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-blue-500/15 border border-blue-500/30 rounded-lg flex items-center justify-center">
                <Building2 className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Organizations</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">Your Organizations</h1>
                <p className="text-gray-400">Manage teams, invite members, and control API access.</p>
              </div>
              <button
                onClick={() => setShowCreate(v => !v)}
                className="flex items-center gap-1.5 bg-crimson-500 hover:bg-crimson-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shrink-0 mt-1"
              >
                <Plus className="w-4 h-4" /> New Org
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">

          {showCreate && (
            <form onSubmit={handleCreate} className="bg-white/3 border border-crimson-500/30 rounded-2xl p-5 space-y-4">
              <p className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-crimson-400" /> Create Organization
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Name *</label>
                  <input
                    required value={newName} onChange={e => { setNewName(e.target.value); setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')) }}
                    placeholder="Acme Corp"
                    className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-3 py-2 rounded-xl text-sm outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Slug <span className="text-gray-600">(optional)</span></label>
                  <input
                    value={newSlug} onChange={e => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="acme-corp"
                    className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-3 py-2 rounded-xl text-sm outline-none transition-colors font-mono"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={creating || !newName.trim()}
                  className="flex items-center gap-1.5 bg-crimson-500 hover:bg-crimson-600 disabled:bg-crimson-500/50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {creating ? 'Creating…' : 'Create'}
                </button>
                <button type="button" onClick={() => setShowCreate(false)}
                  className="text-sm text-gray-500 hover:text-white px-4 py-2 rounded-xl transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
              <button onClick={load} className="ml-auto flex items-center gap-1 hover:text-white transition-colors">
                <RefreshCw className="w-3.5 h-3.5" /> Retry
              </button>
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-2 text-gray-400 py-12 justify-center">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading organizations…
            </div>
          )}

          {!loading && !error && orgs.length === 0 && (
            <div className="text-center py-16 bg-white/3 border border-white/10 rounded-2xl">
              <Building2 className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-white font-semibold">No organizations yet</p>
              <p className="text-sm text-gray-500 mt-1">Create one to start inviting teammates.</p>
            </div>
          )}

          {!loading && orgs.map((org, i) => (
            <OrgCard
              key={field(org, 'id', 'Id', 'orgId') ?? i}
              org={org}
              onDeleted={(id) => setOrgs(o => o.filter(x => field(x, 'id', 'Id', 'orgId') !== id))}
            />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  )
}
