'use strict';

/**
 * sdd2-import — Reverse migration from SDD-2 (.sdd/) to SDD v1 (.planning/)
 *
 * Reads a SDD-2 project directory structure and produces a complete
 * .planning/ artifact tree in SDD v1 format.
 *
 * SDD-2 hierarchy:  Milestone → Slice → Task
 * SDD v1 hierarchy: Milestone (in ROADMAP.md) → Phase → Plan
 *
 * Mapping rules:
 *   - Slices are numbered sequentially across all milestones (01, 02, …)
 *   - Tasks within a slice become plans (01-01, 01-02, …)
 *   - Completed slices ([x] in ROADMAP) → [x] phases in ROADMAP.md
 *   - Tasks with a SUMMARY file → SUMMARY.md written
 *   - Slice RESEARCH.md → phase XX-RESEARCH.md
 */

const fs = require('node:fs');
const path = require('node:path');

// ─── Utilities ──────────────────────────────────────────────────────────────

function readOptional(filePath) {
  try { return fs.readFileSync(filePath, 'utf8'); } catch { return null; }
}

function zeroPad(n, width = 2) {
  return String(n).padStart(width, '0');
}

function slugify(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ─── SDD-2 Parser ───────────────────────────────────────────────────────────

/**
 * Find the .sdd/ directory starting from a project root.
 * Returns the absolute path or null if not found.
 */
function findSdd2Root(startPath) {
  if (path.basename(startPath) === '.sdd' && fs.existsSync(startPath)) {
    return startPath;
  }
  const candidate = path.join(startPath, '.sdd');
  if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
    return candidate;
  }
  return null;
}

/**
 * Parse the ## Slices section from a SDD-2 milestone ROADMAP.md.
 * Each slice entry looks like:
 *   - [x] **S01: Title** `risk:medium` `depends:[S00]`
 */
function parseSlicesFromRoadmap(content) {
  const slices = [];
  const sectionMatch = content.match(/## Slices\n([\s\S]*?)(?:\n## |\n# |$)/);
  if (!sectionMatch) return slices;

  for (const line of sectionMatch[1].split('\n')) {
    const m = line.match(/^- \[([x ])\]\s+\*\*(\w+):\s*([^*]+)\*\*/);
    if (!m) continue;
    slices.push({ done: m[1] === 'x', id: m[2].trim(), title: m[3].trim() });
  }
  return slices;
}

/**
 * Parse the milestone title from the first heading in a SDD-2 ROADMAP.md.
 * Format: # M001: Title
 */
function parseMilestoneTitle(content) {
  const m = content.match(/^# \w+:\s*(.+)/m);
  return m ? m[1].trim() : null;
}

/**
 * Parse a task title from a SDD-2 T##-PLAN.md.
 * Format: # T01: Title
 */
function parseTaskTitle(content, fallback) {
  const m = content.match(/^# \w+:\s*(.+)/m);
  return m ? m[1].trim() : fallback;
}

/**
 * Parse the ## Description body from a SDD-2 task plan.
 */
function parseTaskDescription(content) {
  const m = content.match(/## Description\n+([\s\S]+?)(?:\n## |\n# |$)/);
  return m ? m[1].trim() : '';
}

/**
 * Parse ## Must-Haves items from a SDD-2 task plan.
 */
function parseTaskMustHaves(content) {
  const m = content.match(/## Must-Haves\n+([\s\S]+?)(?:\n## |\n# |$)/);
  if (!m) return [];
  return m[1].split('\n')
    .map(l => l.match(/^- \[[ x]\]\s*(.+)/))
    .filter(Boolean)
    .map(match => match[1].trim());
}

/**
 * Read all task plan files from a SDD-2 tasks/ directory.
 */
function readTasksDir(tasksDir) {
  if (!fs.existsSync(tasksDir)) return [];

  return fs.readdirSync(tasksDir)
    .filter(f => f.endsWith('-PLAN.md'))
    .sort()
    .map(tf => {
      const tid = tf.replace('-PLAN.md', '');
      const plan = readOptional(path.join(tasksDir, tf));
      const summary = readOptional(path.join(tasksDir, `${tid}-SUMMARY.md`));
      return {
        id: tid,
        title: plan ? parseTaskTitle(plan, tid) : tid,
        description: plan ? parseTaskDescription(plan) : '',
        mustHaves: plan ? parseTaskMustHaves(plan) : [],
        plan,
        summary,
        done: !!summary,
      };
    });
}

/**
 * Parse a complete SDD-2 .sdd/ directory into a structured representation.
 */
function parseSdd2(sddDir) {
  const data = {
    projectContent: readOptional(path.join(sddDir, 'PROJECT.md')),
    requirements: readOptional(path.join(sddDir, 'REQUIREMENTS.md')),
    milestones: [],
  };

  const milestonesBase = path.join(sddDir, 'milestones');
  if (!fs.existsSync(milestonesBase)) return data;

  const milestoneIds = fs.readdirSync(milestonesBase)
    .filter(d => fs.statSync(path.join(milestonesBase, d)).isDirectory())
    .sort();

  for (const mid of milestoneIds) {
    const mDir = path.join(milestonesBase, mid);
    const roadmapContent = readOptional(path.join(mDir, `${mid}-ROADMAP.md`));
    const slicesDir = path.join(mDir, 'slices');

    const sliceInfos = roadmapContent ? parseSlicesFromRoadmap(roadmapContent) : [];

    const slices = sliceInfos.map(info => {
      const sDir = path.join(slicesDir, info.id);
      const hasSDir = fs.existsSync(sDir);
      return {
        id: info.id,
        title: info.title,
        done: info.done,
        plan: hasSDir ? readOptional(path.join(sDir, `${info.id}-PLAN.md`)) : null,
        summary: hasSDir ? readOptional(path.join(sDir, `${info.id}-SUMMARY.md`)) : null,
        research: hasSDir ? readOptional(path.join(sDir, `${info.id}-RESEARCH.md`)) : null,
        context: hasSDir ? readOptional(path.join(sDir, `${info.id}-CONTEXT.md`)) : null,
        tasks: hasSDir ? readTasksDir(path.join(sDir, 'tasks')) : [],
      };
    });

    data.milestones.push({
      id: mid,
      title: roadmapContent ? (parseMilestoneTitle(roadmapContent) ?? mid) : mid,
      research: readOptional(path.join(mDir, `${mid}-RESEARCH.md`)),
      slices,
    });
  }

  return data;
}

// ─── Artifact Builders ──────────────────────────────────────────────────────

/**
 * Build a SDD v1 PLAN.md from a SDD-2 task.
 */
function buildPlanMd(task, phasePrefix, planPrefix, phaseSlug, milestoneTitle) {
  const lines = [
    '---',
    `phase: "${phasePrefix}"`,
    `plan: "${planPrefix}"`,
    'type: "implementation"',
    '---',
    '',
    '<objective>',
    task.title,
    '</objective>',
    '',
    '<context>',
    `Phase: ${phasePrefix} (${phaseSlug}) — Milestone: ${milestoneTitle}`,
  ];

  if (task.description) {
    lines.push('', task.description);
  }

  lines.push('</context>');

  if (task.mustHaves.length > 0) {
    lines.push('', '<must_haves>');
    for (const mh of task.mustHaves) {
      lines.push(`- ${mh}`);
    }
    lines.push('</must_haves>');
  }

  return lines.join('\n') + '\n';
}

/**
 * Build a SDD v1 SUMMARY.md from a SDD-2 task summary.
 * Strips the SDD-2 frontmatter and preserves the body.
 */
function buildSummaryMd(task, phasePrefix, planPrefix) {
  const raw = task.summary || '';
  // Strip SDD-2 frontmatter block (--- ... ---) if present
  const bodyMatch = raw.match(/^---[\s\S]*?---\n+([\s\S]*)$/);
  const body = bodyMatch ? bodyMatch[1].trim() : raw.trim();

  return [
    '---',
    `phase: "${phasePrefix}"`,
    `plan: "${planPrefix}"`,
    '---',
    '',
    body || 'Task completed (migrated from SDD-2).',
    '',
  ].join('\n');
}

/**
 * Build a SDD v1 XX-CONTEXT.md from a SDD-2 slice.
 */
function buildContextMd(slice, phasePrefix) {
  const lines = [
    `# Phase ${phasePrefix} Context`,
    '',
    `Migrated from SDD-2 slice ${slice.id}: ${slice.title}`,
  ];

  const extra = slice.context || '';
  if (extra.trim()) {
    lines.push('', extra.trim());
  }

  return lines.join('\n') + '\n';
}

/**
 * Build the SDD v1 ROADMAP.md with milestone-sectioned format.
 */
function buildRoadmapMd(milestones, phaseMap) {
  const lines = ['# Roadmap', ''];

  for (const milestone of milestones) {
    lines.push(`## ${milestone.id}: ${milestone.title}`, '');
    const mPhases = phaseMap.filter(p => p.milestoneId === milestone.id);
    for (const { slice, phaseNum } of mPhases) {
      const prefix = zeroPad(phaseNum);
      const slug = slugify(slice.title);
      const check = slice.done ? 'x' : ' ';
      lines.push(`- [${check}] **Phase ${prefix}: ${slug}** — ${slice.title}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Build the SDD v1 STATE.md reflecting the current position in the project.
 */
function buildStateMd(phaseMap) {
  const currentEntry = phaseMap.find(p => !p.slice.done);
  const totalPhases = phaseMap.length;
  const donePhases = phaseMap.filter(p => p.slice.done).length;
  const pct = totalPhases > 0 ? Math.round((donePhases / totalPhases) * 100) : 0;

  const currentPhaseNum = currentEntry ? zeroPad(currentEntry.phaseNum) : zeroPad(totalPhases);
  const currentSlug = currentEntry ? slugify(currentEntry.slice.title) : 'complete';
  const status = currentEntry ? 'Ready to plan' : 'All phases complete';

  const filled = Math.round(pct / 10);
  const bar = `[${'█'.repeat(filled)}${'░'.repeat(10 - filled)}]`;
  const today = new Date().toISOString().split('T')[0];

  return [
    '# Project State',
    '',
    '## Project Reference',
    '',
    'See: .planning/PROJECT.md',
    '',
    `**Current focus:** Phase ${currentPhaseNum} (${currentSlug})`,
    '',
    '## Current Position',
    '',
    `Phase: ${currentPhaseNum} of ${zeroPad(totalPhases)} (${currentSlug})`,
    `Status: ${status}`,
    `Last activity: ${today} — Migrated from SDD-2`,
    '',
    `Progress: ${bar} ${pct}%`,
    '',
    '## Accumulated Context',
    '',
    '### Decisions',
    '',
    'Migrated from SDD-2. Review PROJECT.md for key decisions.',
    '',
    '### Blockers/Concerns',
    '',
    'None.',
    '',
    '## Session Continuity',
    '',
    `Last session: ${today}`,
    'Stopped at: Migration from SDD-2 completed',
    'Resume file: None',
    '',
  ].join('\n');
}

// ─── Transformer ─────────────────────────────────────────────────────────────

/**
 * Convert parsed SDD-2 data into a map of relative path → file content.
 * All paths are relative to the .planning/ root.
 */
function buildPlanningArtifacts(sdd2Data) {
  const artifacts = new Map();

  // Passthrough files
  artifacts.set('PROJECT.md', sdd2Data.projectContent || '# Project\n\n(Migrated from SDD-2)\n');
  if (sdd2Data.requirements) {
    artifacts.set('REQUIREMENTS.md', sdd2Data.requirements);
  }

  // Minimal valid v1 config
  artifacts.set('config.json', JSON.stringify({ version: 1 }, null, 2) + '\n');

  // Build sequential phase map: flatten Milestones → Slices into numbered phases
  const phaseMap = [];
  let phaseNum = 1;
  for (const milestone of sdd2Data.milestones) {
    for (const slice of milestone.slices) {
      phaseMap.push({ milestoneId: milestone.id, milestoneTitle: milestone.title, slice, phaseNum });
      phaseNum++;
    }
  }

  artifacts.set('ROADMAP.md', buildRoadmapMd(sdd2Data.milestones, phaseMap));
  artifacts.set('STATE.md', buildStateMd(phaseMap));

  for (const { slice, phaseNum, milestoneTitle } of phaseMap) {
    const prefix = zeroPad(phaseNum);
    const slug = slugify(slice.title);
    const dir = `phases/${prefix}-${slug}`;

    artifacts.set(`${dir}/${prefix}-CONTEXT.md`, buildContextMd(slice, prefix));

    if (slice.research) {
      artifacts.set(`${dir}/${prefix}-RESEARCH.md`, slice.research);
    }

    for (let i = 0; i < slice.tasks.length; i++) {
      const task = slice.tasks[i];
      const planPrefix = zeroPad(i + 1);

      artifacts.set(
        `${dir}/${prefix}-${planPrefix}-PLAN.md`,
        buildPlanMd(task, prefix, planPrefix, slug, milestoneTitle)
      );

      if (task.done && task.summary) {
        artifacts.set(
          `${dir}/${prefix}-${planPrefix}-SUMMARY.md`,
          buildSummaryMd(task, prefix, planPrefix)
        );
      }
    }
  }

  return artifacts;
}

// ─── Preview ─────────────────────────────────────────────────────────────────

/**
 * Format a dry-run preview string for display before writing.
 */
function buildPreview(sdd2Data, artifacts) {
  const lines = ['Preview — files that will be created in .planning/:'];

  for (const rel of artifacts.keys()) {
    lines.push(`  ${rel}`);
  }

  const totalSlices = sdd2Data.milestones.reduce((s, m) => s + m.slices.length, 0);
  const doneSlices = sdd2Data.milestones.reduce((s, m) => s + m.slices.filter(sl => sl.done).length, 0);
  const allTasks = sdd2Data.milestones.flatMap(m => m.slices.flatMap(sl => sl.tasks));
  const doneTasks = allTasks.filter(t => t.done).length;

  lines.push('');
  lines.push(`Milestones: ${sdd2Data.milestones.length}`);
  lines.push(`Phases (slices): ${totalSlices} (${doneSlices} completed)`);
  lines.push(`Plans (tasks): ${allTasks.length} (${doneTasks} completed)`);
  lines.push('');
  lines.push('Cannot migrate automatically:');
  lines.push('  - SDD-2 cost/token ledger (no v1 equivalent)');
  lines.push('  - SDD-2 database state (rebuilt from files on first /sdd-health)');
  lines.push('  - VS Code extension state');

  return lines.join('\n');
}

// ─── Writer ───────────────────────────────────────────────────────────────────

/**
 * Write all artifacts to the .planning/ directory.
 */
function writePlanningDir(artifacts, planningRoot) {
  for (const [rel, content] of artifacts) {
    const absPath = path.join(planningRoot, rel);
    fs.mkdirSync(path.dirname(absPath), { recursive: true });
    fs.writeFileSync(absPath, content, 'utf8');
  }
}

// ─── Command Handler ──────────────────────────────────────────────────────────

/**
 * Entry point called from sdd-tools.cjs.
 * Supports: --force, --dry-run, --path <dir>
 */
function cmdFromSdd2(args, cwd, raw) {
  const { output, error } = require('./core.cjs');

  const force = args.includes('--force');
  const dryRun = args.includes('--dry-run');

  const pathIdx = args.indexOf('--path');
  const projectDir = pathIdx >= 0 && args[pathIdx + 1]
    ? path.resolve(cwd, args[pathIdx + 1])
    : cwd;

  const sddDir = findSdd2Root(projectDir);
  if (!sddDir) {
    return output({ success: false, error: `No .sdd/ directory found in ${projectDir}` }, raw);
  }

  const planningRoot = path.join(path.dirname(sddDir), '.planning');
  if (fs.existsSync(planningRoot) && !force) {
    return output({
      success: false,
      error: `.planning/ already exists at ${planningRoot}. Pass --force to overwrite.`,
    }, raw);
  }

  const sdd2Data = parseSdd2(sddDir);
  const artifacts = buildPlanningArtifacts(sdd2Data);
  const preview = buildPreview(sdd2Data, artifacts);

  if (dryRun) {
    return output({ success: true, dryRun: true, preview }, raw);
  }

  writePlanningDir(artifacts, planningRoot);

  return output({
    success: true,
    planningDir: planningRoot,
    filesWritten: artifacts.size,
    milestones: sdd2Data.milestones.length,
    preview,
  }, raw);
}

module.exports = {
  findSdd2Root,
  parseSdd2,
  buildPlanningArtifacts,
  buildPreview,
  writePlanningDir,
  cmdFromSdd2,
  // Exported for unit tests
  parseSlicesFromRoadmap,
  parseMilestoneTitle,
  parseTaskTitle,
  parseTaskDescription,
  parseTaskMustHaves,
  buildPlanMd,
  buildSummaryMd,
  buildContextMd,
  buildRoadmapMd,
  buildStateMd,
  slugify,
  zeroPad,
};
