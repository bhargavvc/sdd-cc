'use strict';

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const AGENTS_DIR = path.join(__dirname, '..', 'agents');

function readAgent(name) {
  return fs.readFileSync(path.join(AGENTS_DIR, `${name}.md`), 'utf8');
}

describe('project skills awareness', () => {
  const agentsRequiringSkills = [
    'sdd-debugger',
    'sdd-integration-checker',
    'sdd-security-auditor',
    'sdd-nyquist-auditor',
    'sdd-codebase-mapper',
    'sdd-roadmapper',
    'sdd-eval-auditor',
    'sdd-intel-updater',
    'sdd-doc-writer',
  ];

  for (const agentName of agentsRequiringSkills) {
    test(`${agentName} has Project skills block`, () => {
      const content = readAgent(agentName);
      assert.ok(content.includes('Project skills'), `${agentName} missing Project skills block`);
    });

    test(`${agentName} does not load full AGENTS.md`, () => {
      const content = readAgent(agentName);
      assert.ok(
        !content.includes('Read AGENTS.md') && !content.includes('load AGENTS.md'),
        `${agentName} should not instruct loading full AGENTS.md`
      );
    });
  }

  test('sdd-doc-writer has security note about doc_assignment user data', () => {
    const content = readAgent('sdd-doc-writer');
    assert.ok(
      content.includes('doc_assignment') && content.includes('SECURITY'),
      'sdd-doc-writer missing security note for doc_assignment block'
    );
  });
});
