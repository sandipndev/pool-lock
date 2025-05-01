# pool-lock

GitHub Action that performs cross run concurrent pool locking - interoperable
with [Concourse Pool](https://github.com/concourse/pool-resource) resource via
git

### Usage

```yaml
- uses: sandipndev/pool-lock@0.0.1
  with:
    pool: mac
    resource: mac-m4
    git_uri: git@github.com:atx-finance/ci.git
    git_branch: pool
    git_ssh_key: ${{ secrets.CUSTOM_SSH_KEY_FOR_POOL_REPO_ACCESS }}
```

### Pool Repo Structure

The pool repo should have the following structure:

```
${pool}/
    claimed/
        .gitkeep
    unclaimed/
        .gitkeep
        ${resource}
```

There can be other files but this is the minimum required structure. The
`claimed` directory is where the lock will push to on claim and the `unclaimed`
directory is where the lock will push to on release. The `unclaimed` directory
should contain a file with the name of the resource that is being locked. The
file can be empty or contain any data. The `claimed` directory should contain a
`.gitkeep` file to ensure that it is created in the repo. The `unclaimed`
directory should also contain a `.gitkeep` file to ensure that it is created in
the repo.
