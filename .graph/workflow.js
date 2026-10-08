export const meta = {
  name: 'opening-graph',
  description: 'His graph: source finder, four free scouts, variety check, scorecard router, ten builders, automatic test, manager review, then his approval',
  phases: [
    { title: 'Sources', detail: 'one agent maps where to look, once' },
    { title: 'Scout', detail: 'four scouts search freely, each its own sources' },
    { title: 'Check', detail: 'variety check, then the scorecard router; fails go back, max 3 rounds' },
    { title: 'Build', detail: 'one builder per approved idea' },
    { title: 'Test', detail: 'automatic test in the browser, then the manager; fails go back, max 3 rounds' },
    { title: 'Hand over', detail: 'register, build the pages, commit, the page for his approval' },
  ],
}

const ROOT = '/Users/chenliangyuan/Desktop/travel website/experiments/opening-graph'
const COMMON = `You work inside the git worktree ${ROOT} (branch exp/opening-graph). Run every command from there and never touch any other folder of the repository. Read ${ROOT}/.graph/taste.md, ${ROOT}/.graph/excluded.md and ${ROOT}/.graph/scorecard.md first. The site is a landscape photographer's personal site, warm paper, "The Printed Travel Journal"; its home page opens on a full-window photograph (Aoraki / Mount Cook through a car window) with nothing written across it.`

const FIND = {
  type: 'object',
  properties: {
    finds: { type: 'array', items: { type: 'object', properties: {
      title: { type: 'string' }, url: { type: 'string' }, source: { type: 'string' },
      what: { type: 'string', description: 'what the opening does, beat by beat, 2-4 sentences' },
      why: { type: 'string', description: 'why it grabs the eye and is unlike the usual site' },
      quality: { type: 'string', description: 'the one quality worth borrowing, not the look' },
    }, required: ['title', 'url', 'source', 'what', 'why', 'quality'] } },
  }, required: ['finds'],
}
const SOURCES = {
  type: 'object',
  properties: { sources: { type: 'array', items: { type: 'object', properties: {
    name: { type: 'string' }, url: { type: 'string' }, offers: { type: 'string' },
    readable: { type: 'boolean', description: 'can an agent actually read useful detail there (text, code, descriptions), not just pictures or video' },
    scout: { type: 'integer', minimum: 1, maximum: 4 },
  }, required: ['name', 'url', 'offers', 'readable', 'scout'] } } },
  required: ['sources'],
}
const VERDICTS = {
  type: 'object',
  properties: { verdicts: { type: 'array', items: { type: 'object', properties: {
    title: { type: 'string' }, pass: { type: 'boolean' },
    reasons: { type: 'string', description: 'per scorecard item: PASS/FAIL and one sentence; for a fail, what would make it pass' },
    scout: { type: 'integer' },
    name: { type: 'string', description: 'if pass: a short lowercase letters-only name for the opening file, unique' },
    en: { type: 'string' }, zh: { type: 'string' },
    desc_en: { type: 'string' }, desc_zh: { type: 'string' },
  }, required: ['title', 'pass', 'reasons', 'scout'] } } },
  required: ['verdicts'],
}
const BUILT = {
  type: 'object',
  properties: { name: { type: 'string' }, file: { type: 'string' }, seconds: { type: 'number' }, notes: { type: 'string' }, ok: { type: 'boolean' } },
  required: ['name', 'file', 'ok'],
}
const TESTS = {
  type: 'object',
  properties: { results: { type: 'array', items: { type: 'object', properties: {
    name: { type: 'string' }, pass: { type: 'boolean' }, seconds: { type: 'number' }, report: { type: 'string' },
  }, required: ['name', 'pass', 'report'] } } },
  required: ['results'],
}

// ---------------------------------------------------------------- Sources
phase('Sources')
log('Mapping the sources, once')
const srcMap = await agent(`${COMMON}
You are the source finder. Your job runs once and its result is reused by later runs.
Find the places on the web where eye-catching website openings, intros, preloaders and title sequences can be studied: award sites and their collections, motion-design and creative-coding galleries, film and TV title-sequence archives, studio showcases, demo sites, anything where the first seconds of a page or film are the point. Use web search; open each candidate and judge whether an agent can read useful detail there (text, code, case-study descriptions) or only pictures and video. Prefer sources that describe or show HOW an opening moves. Aim for 12 to 20 sources, varied, not four copies of Awwwards. Assign each to one of four scouts (1-4) so that each scout gets a distinct hunting ground: roughly, 1 award sites and their collections, 2 film and TV title sequences and motion studios, 3 creative-coding and demo galleries, 4 your own free choice of unusual places (art, print, photography books online, exhibitions). Write the map to ${ROOT}/.graph/sources.md as a table, then return it as structured output.`,
  { label: 'source finder', phase: 'Sources', schema: SOURCES })
const sources = (srcMap && srcMap.sources) || []
log(`${sources.length} sources mapped`)

// ---------------------------------------------------------------- Scout + Check, with the loop back
const scoutPrompt = (i, feedback) => `${COMMON}
You are scout ${i} of four. Search freely. No premise from the owner confines you: look for website openings and title sequences that are aesthetically eye-catching, that a stranger would stop for, and that are unlike the usual site and unlike boring projects. The router, not you, will decide what fits his site; do not pre-filter for his taste, but do read .graph/excluded.md and never bring back any of those 21 or a variant of them.
Your hunting ground (search these first, then anywhere else you like):
${sources.filter((s) => s.scout === i).map((s) => `- ${s.name} ${s.url}: ${s.offers}${s.readable ? '' : ' (pictures or video only: use it for leads, confirm elsewhere)'}`).join('\n') || '- any source you choose'}
${feedback ? `\nThis is a retry. The router rejected your earlier finds for these reasons; bring back different finds that answer them:\n${feedback}\n` : ''}
Bring back 5 finds. For each: the title, the URL, the source, WHAT the opening does beat by beat (you may only have read a description or code; say so), WHY it grabs the eye, and the ONE quality worth borrowing. Also append your finds to ${ROOT}/.graph/finds/scout-${i}.md. Return them as structured output.`

let approved = []
let feedback = { 1: '', 2: '', 3: '', 4: '' }
let allFinds = []
for (let round = 1; round <= 3 && approved.length < 13; round++) {
  phase('Scout')
  log(`Scouting, round ${round}`)
  const scouts = [1, 2, 3, 4].filter((i) => round === 1 || feedback[i])
  const found = (await parallel(scouts.map((i) => () =>
    agent(scoutPrompt(i, feedback[i]), { label: `scout ${i}, round ${round}`, phase: 'Scout', schema: FIND })
      .then((r) => (r && r.finds || []).map((f) => ({ ...f, scout: i })))))).filter(Boolean).flat()
  allFinds = allFinds.concat(found)
  log(`${found.length} finds this round`)
  if (!found.length) break

  phase('Check')
  // variety check: merge true duplicates across all finds so far, then the router scores what is new
  const pool = await agent(`${COMMON}
You are the variety check at the join. Here are all finds so far, as JSON:
${JSON.stringify(allFinds.map((f) => ({ title: f.title, url: f.url, what: f.what, quality: f.quality, scout: f.scout })))}
And here are the ideas already approved: ${JSON.stringify(approved.map((a) => ({ title: a.title, quality: a.quality })))}
Group finds that are truly the same idea (same mechanism, not merely similar mood). Keep the strongest of each group and drop the rest. Do NOT drop ideas for being similar in mood; only for being the same idea. Also drop any find that is the same idea as an already approved one. Return the kept finds' titles exactly as given.`,
    { label: `variety check, round ${round}`, phase: 'Check', schema: { type: 'object', properties: { keep: { type: 'array', items: { type: 'string' } } }, required: ['keep'] } })
  const keepTitles = new Set((pool && pool.keep) || [])
  const candidates = found.filter((f) => keepTitles.has(f.title))
  log(`${candidates.length} distinct ideas go to the router`)
  if (!candidates.length) { feedback = { 1: 'all your finds duplicated others; bring back different mechanisms', 2: '', 3: '', 4: '' }; continue }

  const judged = await agent(`${COMMON}
You are the router: the inspiration check. You bring each find back to his site using the scorecard items 1 to 6 (hard rules) and a first read of 7 and 8. Judge these finds, as JSON:
${JSON.stringify(candidates)}
For each find: PASS or FAIL, with the reason per scorecard item, and for a fail what would make it pass. Be strict on item 4 (excluded designs) and item 6 (borrow a quality, never copy). For a PASS also give: a short unique lowercase letters-only file name (no digits, no hyphens; not one of: ${JSON.stringify(['aperture','contact','filmstrip','burst','letters','pullback','darkroom','mosaic','prints','exposure','negative','reel','orbit','route','grow','book','stack','counter','slices','ripple','flythrough'].concat(approved.map((a) => a.name)))}), an English name, a 繁體中文 name, and a one-sentence description in each language that says what the visitor will see. Return structured output.`,
    { label: `router, round ${round}`, phase: 'Check', schema: VERDICTS, effort: 'high' })
  const verdicts = (judged && judged.verdicts) || []
  const passed = verdicts.filter((v) => v.pass && v.name).map((v) => ({ ...candidates.find((c) => c.title === v.title), ...v }))
  approved = approved.concat(passed)
  log(`${passed.length} approved this round, ${approved.length} in all`)
  feedback = { 1: '', 2: '', 3: '', 4: '' }
  verdicts.filter((v) => !v.pass).forEach((v) => { feedback[v.scout] = (feedback[v.scout] || '') + `- "${v.title}": ${v.reasons}\n` })
  if (approved.length >= 13) break
}
if (approved.length < 10) log(`Only ${approved.length} ideas approved after three rounds; building those`)
const toBuild = approved.slice(0, 10)
const spares = approved.slice(10)

// ---------------------------------------------------------------- Build
phase('Build')
const builderPrompt = (idea, fix) => `${COMMON}
You are a builder. Build ONE opening for the home page from this approved inspiration:
${JSON.stringify({ title: idea.title, url: idea.url, what: idea.what, why: idea.why, quality: idea.quality, verdict: idea.reasons })}
Its file name is "${idea.name}". Write exactly one file: ${ROOT}/design 1/js/opening/${idea.name}.js, which registers window.Openings.${idea.name} = function (o) { ... }. Read ${ROOT}/design 1/js/opening.js for the runtime (o.stage(cls), o.style(css), o.load(src), o.src(photo, size), o.lead, o.others, o.pick(n), o.fit(photo, W, H), o.easeOut/easeInOut/clamp, o.done(stage, wait)) and read two existing openings in that folder for the conventions, but do not copy their ideas. Rules: borrow the quality, not the look; nothing written across the photograph at any moment; the page is light, a dark stage is fine; 3 to 8 seconds; one ease language; must end exactly on the page's cover (the lead photograph, object-fit cover, full window) then call o.done(stage, wait); any word must be bilingual (check document.documentElement.lang for zh); no library, no server; use only the photographs in window.ALL_PHOTOS via o.src; images wider than their box need max-width: none. Do NOT touch tools/build.py, any HTML, or any other opening. Do not use the browser; check your file with "node --check" instead. Then write a sidecar ${ROOT}/.graph/openings/${idea.name}.json with keys name, en, zh, desc_en, desc_zh, source_url, borrowed (one sentence, what quality was borrowed) using these values: ${JSON.stringify({ en: idea.en, zh: idea.zh, desc_en: idea.desc_en, desc_zh: idea.desc_zh })}.
${fix ? `\nThis is a fix round. The test or the manager failed your opening for these reasons; fix the file in place:\n${fix}\n` : ''}
Return structured output: name, file, seconds (your intended length), notes, ok.`

let built = (await parallel(toBuild.map((idea) => () => agent(builderPrompt(idea, ''), { label: `build ${idea.name}`, phase: 'Build', schema: BUILT })))).filter(Boolean)
log(`${built.filter((b) => b.ok).length} openings built`)

// ---------------------------------------------------------------- Register, Test, Manager, with the loop back
const registerPrompt = `${COMMON}
Register the openings in .graph/openings/*.json in tools/build.py: in the OPENINGS list, add one entry per sidecar (name, en, zh, desc_en, desc_zh) if not already present; extend build_openings() so that an optional sixth field, the source URL, is shown as a small link "Source" after the description when present (add it from the sidecar's source_url, with the sidecar's borrowed sentence as the link title). Update opSub to say how many ways there are now. Then run python3 tools/build.py and python3 tools/check_site.py from ${ROOT} and report. Do not edit any opening file. Return plain text.`

const testPrompt = (names) => `${COMMON}
You are the automatic test. The experiment is served at http://localhost:8649 (if not, start it: python3 tools/serve.py 8649 "design 1" from ${ROOT} in the background). Use the built-in browser tools (load them with ToolSearch: mcp__Claude_Browser__navigate, computer, read_console_messages, javascript_tool, resize_window). For EACH of these openings, one after another: ${JSON.stringify(names)}
Open http://localhost:8649/index.html?opening=<name>. Take screenshots at about 0.5 s, 2 s, 4 s and after it ends (when html.op-done is set; poll document.documentElement.classList with javascript_tool). Record: console errors; how long until op-done (fail under 3 s or over 9 s, or if it never ends within 15 s); whether any text appears over the photograph in any screenshot; whether the final frame is the page's own cover (compare the screenshot after op-done with http://localhost:8649/index.html with no opening). Repeat at phone width (resize_window preset mobile) with one screenshot mid-way and one at the end; reset to desktop after. A pass needs: no console errors, length in range, nothing written over the photograph, final frame equals the cover at both widths. Return structured output with a short report per opening saying exactly what failed.`

const managerPrompt = (names) => `${COMMON}
You are the manager, the lead designer who reviews the builders' work. You never built any of these. The experiment is served at http://localhost:8649. Use the built-in browser tools (ToolSearch: mcp__Claude_Browser__navigate, computer, javascript_tool, resize_window). For EACH of these openings, one after another: ${JSON.stringify(names)}
Read its sidecar ${ROOT}/.graph/openings/<name>.json for the inspiration and the borrowed quality, and open the inspiration URL to read what you can of the source. Watch the opening at http://localhost:8649/index.html?opening=<name> (several screenshots through its run, desktop and phone width) and read its file. Score it on the scorecard: items 1 to 6 pass/fail, items 7 to 9 graded 1 to 5. Fail it if any hard item fails or any grade is under 3. Ask the two questions the owner asked for: does it fit his look (quiet paper site, the photograph wins), and is it as well made as the site that inspired it? Write the full review to ${ROOT}/.graph/openings/<name>.review.md. Return structured output: per opening, pass or fail, and a report that tells the builder exactly what to change.`

let active = built.filter((b) => b.ok).map((b) => b.name)
let passedNames = []
for (let round = 1; round <= 3 && active.length; round++) {
  phase('Test')
  await agent(registerPrompt, { label: `register, round ${round}`, phase: 'Test', effort: 'low' })
  const tested = await agent(testPrompt(active), { label: `automatic test, round ${round}`, phase: 'Test', schema: TESTS })
  const tResults = (tested && tested.results) || []
  const tPass = active.filter((n) => tResults.find((r) => r.name === n && r.pass))
  log(`test round ${round}: ${tPass.length} of ${active.length} pass the automatic test`)
  let mResults = []
  if (tPass.length) {
    const reviewed = await agent(managerPrompt(tPass), { label: `manager review, round ${round}`, phase: 'Test', schema: TESTS, effort: 'high' })
    mResults = (reviewed && reviewed.results) || []
  }
  const ok = tPass.filter((n) => mResults.find((r) => r.name === n && r.pass))
  passedNames = passedNames.concat(ok)
  log(`manager round ${round}: ${ok.length} pass; ${passedNames.length} approved in all`)
  const failed = active.filter((n) => !ok.includes(n))
  if (!failed.length || round === 3) { active = []; break }
  // fix round: each failed opening goes back to a builder with both reports; after round 2 a failed one is replaced by a spare
  const fixes = failed.map((n) => {
    const idea = approved.find((a) => a.name === n)
    const t = tResults.find((r) => r.name === n), m = mResults.find((r) => r.name === n)
    return { idea, fix: `Automatic test: ${t ? t.report : 'not reached'}\nManager: ${m ? m.report : 'not reached'}` }
  })
  phase('Build')
  const rebuilt = (await parallel(fixes.map(({ idea, fix }) => () => agent(builderPrompt(idea, fix), { label: `fix ${idea.name}, round ${round}`, phase: 'Build', schema: BUILT })))).filter(Boolean)
  active = rebuilt.filter((b) => b.ok).map((b) => b.name)
}
// spares for the ones that never passed, one try each
const short = 10 - passedNames.length
if (short > 0 && spares.length) {
  const use = spares.slice(0, short)
  log(`${short} short; building ${use.length} spare idea(s)`)
  phase('Build')
  const sb = (await parallel(use.map((idea) => () => agent(builderPrompt(idea, ''), { label: `spare ${idea.name}`, phase: 'Build', schema: BUILT })))).filter(Boolean).filter((b) => b.ok).map((b) => b.name)
  if (sb.length) {
    phase('Test')
    await agent(registerPrompt, { label: 'register spares', phase: 'Test', effort: 'low' })
    const t = await agent(testPrompt(sb), { label: 'automatic test, spares', phase: 'Test', schema: TESTS })
    const tp = sb.filter((n) => ((t && t.results) || []).find((r) => r.name === n && r.pass))
    if (tp.length) {
      const m = await agent(managerPrompt(tp), { label: 'manager review, spares', phase: 'Test', schema: TESTS, effort: 'high' })
      passedNames = passedNames.concat(tp.filter((n) => ((m && m.results) || []).find((r) => r.name === n && r.pass)))
    }
  }
}

// ---------------------------------------------------------------- Hand over
phase('Hand over')
const handover = await agent(`${COMMON}
Final step. Approved by the manager: ${JSON.stringify(passedNames)}. Everything else in .graph/openings/ failed.
1. Remove the failed openings from tools/build.py's OPENINGS and delete their .js files and sidecars (keep their .review.md files for the record). Keep every opening that existed before this run (the inherited six and their versions): never touch those.
2. Make sure each approved opening is in OPENINGS with its source link, run python3 tools/build.py and python3 tools/check_site.py.
3. Write ${ROOT}/.graph/RUN.md: the approved openings with one line each (name, what the visitor sees, inspiration link, borrowed quality), the ones that failed and why in one line each, and how many agents the loop took per stage if you can tell from .graph.
4. git add -A and commit on the current branch with a bilingual message (繁體中文 first, then English after " — "), ending with the line "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>". Do not push.
Return plain text: the approved names and the commit hash.`, { label: 'hand over', phase: 'Hand over', effort: 'low' })

return { approved: passedNames, ideasApproved: approved.map((a) => a.name), handover }