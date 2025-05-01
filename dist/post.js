import { c as coreExports, e as execExports } from './exec-BQru9POo.js';
import 'os';
import 'crypto';
import 'fs';
import 'path';
import 'http';
import 'https';
import 'net';
import 'tls';
import 'events';
import 'assert';
import 'util';
import 'stream';
import 'buffer';
import 'querystring';
import 'stream/web';
import 'node:stream';
import 'node:util';
import 'node:events';
import 'worker_threads';
import 'perf_hooks';
import 'util/types';
import 'async_hooks';
import 'console';
import 'url';
import 'zlib';
import 'string_decoder';
import 'diagnostics_channel';
import 'child_process';
import 'timers';

const RETRY_DELAY = 10;

async function run() {
  try {
    if (coreExports.getState('claimed') !== 'true') {
      coreExports.info('we did not claim, skipping release step.');
      return
    }

    const pool = coreExports.getInput('pool', { required: true });
    const resource = coreExports.getInput('resource', { required: true });
    const gitUri = coreExports.getInput('git_uri', { required: true });
    const gitBranch = coreExports.getInput('git_branch') || 'main';
    const gitSshKey = coreExports.getInput('git_ssh_key', { required: true });

    const fullScript = `
      #!/usr/bin/env bash
      set -eux

      # —— 1) SSH setup —— 
      echo "${gitSshKey}" > /tmp/git_ssh_key
      chmod 600 /tmp/git_ssh_key
      eval "$(ssh-agent -s)"
      ssh-add /tmp/git_ssh_key
      rm /tmp/git_ssh_key

      git config --global user.name "GitHub Action"
      git config --global user.email "actions@github.com"

      random_dir="$(mktemp -d)"
      pushd "$random_dir"

      # —— 2) Clone —— 
      git clone -b "${gitBranch}" --single-branch "${gitUri}" pool-lock
      pushd pool-lock

      # —— 3) claim —— 
      pushd "${pool}"
      UNCLAIMED="unclaimed/${resource}"
      CLAIMED="claimed/${resource}"

      release() {
        git fetch origin "${gitBranch}"
        git reset --hard "origin/${gitBranch}"

        if [[ -f $UNCLAIMED ]]; then
          echo "already released ($POOL/$RESOURCE)"
          return 0
        fi

        if mv "$CLAIMED" "$UNCLAIMED" 2>/dev/null; then
          git add "$CLAIMED" "$UNCLAIMED"
          git commit -m "[gha] release ${pool}/${resource}"

          if git push origin "HEAD:${gitBranch}"; then
            echo "✅ released ${resource} in ${pool}"
            return 0
          fi
        fi
        return 1
      }

      until release; do
        echo "🔄 retrying to release resource from pool, retrying in ${RETRY_DELAY}s…"
        sleep "${RETRY_DELAY}"
      done

      ssh-agent -k

      popd
      popd
      popd
      rm -rf "$random_dir"
    `;

    // run the whole thing in one shell so ssh-agent, env, etc. all persist,
    // and exec.exec will stream stdout/stderr live by default
    await execExports.exec('bash', ['-lc', fullScript]);
  } catch (err) {
    coreExports.setFailed(err.message);
  }
}

run();

export { run };
