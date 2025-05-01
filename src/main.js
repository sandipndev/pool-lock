import * as core from '@actions/core'
import * as exec from '@actions/exec'

const RETRY_DELAY = 10

export async function run() {
  try {
    const pool = core.getInput('pool', { required: true })
    const resource = core.getInput('resource', { required: true })
    const gitUri = core.getInput('git_uri', { required: true })
    const gitBranch = core.getInput('git_branch') || 'main'
    const gitSshKey = core.getInput('git_ssh_key', { required: true })

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

      claim() {
        git fetch origin "${gitBranch}"
        git reset --hard "origin/${gitBranch}"

        if mv "$UNCLAIMED" "$CLAIMED" 2>/dev/null; then
          git add "$CLAIMED" "$UNCLAIMED"
          git commit -m "[gha] claim ${pool}/${resource}"

          if git push origin "HEAD:${gitBranch}"; then
            echo "✅ claimed ${resource} in ${pool}"
            return 0
          fi
        fi
        return 1
      }

      until claim; do
        echo "🔄 pool locked by someone else, retrying in ${RETRY_DELAY}s…"
        sleep "${RETRY_DELAY}"
      done

      ssh-agent -k

      popd
      popd
      popd
      rm -rf "$random_dir"
    `

    // run the whole thing in one shell so ssh-agent, env, etc. all persist,
    // and exec.exec will stream stdout/stderr live by default
    await exec.exec('bash', ['-lc', fullScript])
  } catch (err) {
    core.setFailed(err.message)
  }
}

run()
