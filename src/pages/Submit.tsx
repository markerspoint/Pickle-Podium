import { useState, type FormEvent } from 'react'
import { CircleCheck } from 'lucide-react'
import { Button, Eyebrow, Field, Input, Select, Textarea } from '../components/ui'
import { createSubmission } from '../lib/store'
import { DIVISIONS, PLACEMENT_LABELS, PLACEMENTS, SKILL_LEVELS, SUBMISSION_TYPES, type Division, type Placement, type SkillLevel, type SubmissionType } from '../lib/types'
import { errorMessage, formatDate, isHttpUrl } from '../lib/utils'

const BLANK = {
  submission_type: 'New Achievement' as SubmissionType,
  player_name: '', partner_name: '', tournament_name: '', event_date: '',
  skill_level: '', placement: '', division: '', proof_url: '', notes: '',
}
type Form = typeof BLANK
type Errors = Partial<Record<keyof Form, string>>

function validate(f: Form): Errors {
  const e: Errors = {}
  if (!f.player_name.trim()) e.player_name = 'Enter the player’s full name.'
  if (!f.partner_name.trim()) e.partner_name = 'Enter the doubles partner’s full name.'
  if (!f.tournament_name.trim()) e.tournament_name = 'Enter the tournament name.'
  if (!f.event_date) e.event_date = 'Choose the tournament date.'
  if (!f.skill_level) e.skill_level = 'Choose a skill level.'
  if (!f.placement) e.placement = 'Choose a placement.'
  if (!f.division) e.division = 'Choose a division.'
  if (!f.proof_url.trim()) e.proof_url = 'Add a link to the official results.'
  else if (!isHttpUrl(f.proof_url)) e.proof_url = 'Enter a full link starting with http:// or https://'
  return e
}

export default function Submit() {
  const [form, setForm] = useState<Form>(BLANK)
  const [errors, setErrors] = useState<Errors>({})
  const [sent, setSent] = useState<Form | null>(null)
  const [sending, setSending] = useState(false)
  const [failure, setFailure] = useState('')
  const set = (k: keyof Form) => (v: string) => {
    setForm((f) => ({ ...f, [k]: v }))
    setErrors((e) => ({ ...e, [k]: undefined }))
  }
  const bad = (k: keyof Form) => (errors[k] ? 'border-destructive' : '')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length) return
    setSending(true)
    setFailure('')
    try {
      await createSubmission({
      ...form,
      player_name: form.player_name.trim(),
      partner_name: form.partner_name.trim(),
      tournament_name: form.tournament_name.trim(),
      proof_url: form.proof_url.trim(),
      notes: form.notes.trim(),
      skill_level: form.skill_level as SkillLevel,
      placement: form.placement as Placement,
      division: form.division as Division,
      })
      setSent(form)
      setForm(BLANK)
    } catch (err) {
      setFailure(errorMessage(err))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mx-auto max-w-[120rem] px-5 py-12 lg:px-10 lg:py-16">
      <header className="max-w-3xl">
        <Eyebrow className="text-royal">Community submissions</Eyebrow>
        <h1 className="mt-3 font-heading text-3xl font-extrabold leading-tight text-ink sm:text-4xl">Submit a result</h1>
        <p className="mt-4 text-base leading-relaxed text-athletic">
          Missing a podium finish, or spotted a record that needs correcting? Send it in with a link to the official result and an
          admin will verify it before it reaches the public directory.
        </p>
      </header>

      <div className="mt-10 max-w-4xl">
        {sent ? (
          <section className="rounded-md border border-court-deep/40 bg-white p-6 lg:p-8">
            <span className="flex h-11 w-11 items-center justify-center rounded-sm bg-court-soft">
              <CircleCheck className="h-5 w-5 text-court-deep" />
            </span>
            <h2 className="mt-4 font-heading text-xl font-extrabold text-ink">Submission received — thank you</h2>
            <p className="mt-3 text-sm leading-relaxed text-athletic">
              Your {sent.submission_type === 'Correction to Existing Record' ? 'correction' : 'podium finish'} for{' '}
              <span className="font-semibold text-ink">{sent.player_name}</span> at{' '}
              <span className="font-semibold text-ink">{sent.tournament_name}</span> is now pending review. An admin will verify the
              proof link before anything is added to the public database, so nothing appears immediately.
            </p>
            <dl className="mt-5 grid gap-x-6 gap-y-3 border-t border-ink/10 pt-5 text-sm sm:grid-cols-3">
              {[
                ['Tournament date', formatDate(sent.event_date)],
                ['Placement', PLACEMENT_LABELS[sent.placement as Placement]],
                ['Division', sent.division],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="font-heading text-[10px] font-bold uppercase tracking-[0.16em] text-athletic">{k}</dt>
                  <dd className="mt-1 text-ink">{v}</dd>
                </div>
              ))}
            </dl>
            <Button variant="outline" className="mt-6" onClick={() => setSent(null)}>Submit another result</Button>
          </section>
        ) : (
          <section className="rounded-md border border-ink/10 bg-white p-5 lg:p-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <Eyebrow className="text-royal">Submit a player achievement</Eyebrow>
                <p className="mt-3 font-heading text-xl font-extrabold text-ink">Missing results and corrections</p>
              </div>
              <p className="max-w-sm text-xs leading-relaxed text-athletic">
                Every submission stays private and pending until an admin reviews it. Nothing is published automatically.
              </p>
            </div>
            <form className="mt-6 space-y-5" onSubmit={submit} noValidate>
              <Field label="Submission type">
                <Select value={form.submission_type} onChange={(e) => set('submission_type')(e.target.value)}>
                  {SUBMISSION_TYPES.map((t) => <option key={t}>{t}</option>)}
                </Select>
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Player’s full name" error={errors.player_name}>
                  <Input value={form.player_name} onChange={(e) => set('player_name')(e.target.value)} placeholder="e.g. Maria Santos" className={bad('player_name')} />
                </Field>
                <Field label="Doubles partner’s full name" error={errors.partner_name}>
                  <Input value={form.partner_name} onChange={(e) => set('partner_name')(e.target.value)} placeholder="e.g. Juan Dela Cruz" className={bad('partner_name')} />
                </Field>
                <Field label="Tournament name" error={errors.tournament_name}>
                  <Input value={form.tournament_name} onChange={(e) => set('tournament_name')(e.target.value)} placeholder="e.g. MassKara Pickleball Festival 2025" className={bad('tournament_name')} />
                </Field>
                <Field label="Tournament date" error={errors.event_date}>
                  <Input type="date" value={form.event_date} onChange={(e) => set('event_date')(e.target.value)} className={bad('event_date')} />
                </Field>
                <Field label="Skill level" error={errors.skill_level}>
                  <Select value={form.skill_level} onChange={(e) => set('skill_level')(e.target.value)} className={bad('skill_level')}>
                    <option value="">Choose a skill level</option>
                    {SKILL_LEVELS.map((s) => <option key={s}>{s}</option>)}
                  </Select>
                </Field>
                <Field label="Placement" error={errors.placement}>
                  <Select value={form.placement} onChange={(e) => set('placement')(e.target.value)} className={bad('placement')}>
                    <option value="">Choose a placement</option>
                    {PLACEMENTS.map((p) => <option key={p} value={p}>{PLACEMENT_LABELS[p]}</option>)}
                  </Select>
                </Field>
                <Field label="Division" error={errors.division}>
                  <Select value={form.division} onChange={(e) => set('division')(e.target.value)} className={bad('division')}>
                    <option value="">Choose a division</option>
                    {DIVISIONS.map((d) => <option key={d}>{d}</option>)}
                  </Select>
                </Field>
                <Field label="Proof link" error={errors.proof_url} hint="For example, the organiser’s Facebook post announcing the results.">
                  <Input type="url" value={form.proof_url} onChange={(e) => set('proof_url')(e.target.value)} placeholder="https://… official results or bracket" className={bad('proof_url')} />
                </Field>
              </div>
              <Field label="Additional notes (optional)">
                <Textarea rows={4} value={form.notes} onChange={(e) => set('notes')(e.target.value)} placeholder="Anything an admin should know — the corrected detail, a scoring note, how to reach you." />
              </Field>
              {failure && <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{failure}</p>}
              <div className="flex flex-wrap items-center gap-4">
                <Button type="submit" variant="royal" disabled={sending}>{sending ? 'Sending…' : 'Submit for review'}</Button>
                <p className="text-xs leading-relaxed text-athletic">All fields except notes are required. A valid proof link is required.</p>
              </div>
            </form>
          </section>
        )}
      </div>
    </div>
  )
}
