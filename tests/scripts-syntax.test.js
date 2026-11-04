const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const scriptsDir = path.join(__dirname, '..', 'scripts');
const scripts = ['deploy-vps.sh', 'healthcheck-all.sh', 'backup-data.sh'];

describe('scripts/ syntax and formatting', () => {
  for (const scriptName of scripts) {
    const scriptPath = path.join(scriptsDir, scriptName);

    describe(scriptName, () => {
      it('should exist', () => {
        assert.ok(fs.existsSync(scriptPath), `${scriptName} must exist`);
      });

      it('should have a valid shebang line', () => {
        const content = fs.readFileSync(scriptPath, 'utf8');
        const firstLine = content.split('\n')[0];
        assert.ok(
          firstLine.startsWith('#!/') && firstLine.includes('bash'),
          `${scriptName} must start with a bash shebang, got: ${firstLine}`
        );
      });

      it('should use set -e for error exit', () => {
        const content = fs.readFileSync(scriptPath, 'utf8');
        assert.ok(
          content.includes('set -e'),
          `${scriptName} must contain set -e`
        );
      });

      it('should be executable', () => {
        const stats = fs.statSync(scriptPath);
        const isExecutable = (stats.mode & 0o111) !== 0;
        assert.ok(isExecutable, `${scriptName} must have executable permission`);
      });
    });
  }
});
