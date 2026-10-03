# GitHub CI workers

Cargo Hauler's root GitHub Action drains ready PRs through a bounded pool of
Linux workers. The repository supplies its commands in one recipe. The Action
owns admission, snapshot checkout, isolated execution, warm compiler outputs,
per-PR checks, cancellation, and timing reports.

Use a reviewed commit SHA for the Action. The caller must check out its exact
default-branch workflow commit. Ordinary `pull_request` execution is rejected
because PR code must not control the process holding check-writing credentials.

```yaml
name: Hauler CI
on:
  pull_request_target:
    types: [opened, synchronize, reopened, ready_for_review]
  workflow_run:
    workflows: [CI]
    types: [completed]
  workflow_dispatch:
  schedule:
    - cron: '*/10 * * * *'
permissions:
  contents: read
  pull-requests: read
  checks: write
  actions: read
jobs:
  enqueue:
    if: github.event_name == 'pull_request_target'
    concurrency:
      group: hauler-enqueue-${{ github.event.pull_request.number }}
      cancel-in-progress: false
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1
        with:
          ref: ${{ github.sha }}
          persist-credentials: false
      - uses: ScriptedAlchemy/cargo-hauler@<reviewed-commit-sha>
        with:
          mode: enqueue
          token: ${{ github.token }}
          pull-requests: ${{ github.event.pull_request.number }}
  plan:
    if: github.event_name != 'pull_request_target'
    permissions:
      contents: read
      pull-requests: read
      checks: read
      actions: read
    runs-on: ubuntu-24.04
    outputs:
      lanes: ${{ steps.plan.outputs.lanes }}
      count: ${{ steps.plan.outputs.count }}
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1
        with:
          ref: ${{ github.sha }}
          persist-credentials: false
      - uses: ScriptedAlchemy/cargo-hauler@<reviewed-commit-sha>
        id: plan
        with:
          mode: plan
          token: ${{ github.token }}
  worker:
    name: Hauler pool / ${{ matrix.lane }}
    needs: plan
    if: needs.plan.outputs.count != '0'
    concurrency:
      group: hauler-ci-${{ matrix.lane }}
      cancel-in-progress: false
    strategy:
      fail-fast: false
      matrix:
        lane: ${{ fromJSON(needs.plan.outputs.lanes) }}
    runs-on: ubuntu-24.04
    timeout-minutes: 180
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1
        with:
          ref: ${{ github.sha }}
          persist-credentials: false
      - uses: ScriptedAlchemy/cargo-hauler@<reviewed-commit-sha>
        id: hauler
        with:
          token: ${{ github.token }}
          lane: ${{ matrix.lane }}
          max-minutes: '120'
      - uses: actions/upload-artifact@v4
        if: always() && steps.hauler.outputs.evidence != ''
        with:
          name: hauler-${{ matrix.lane }}
          path: ${{ steps.hauler.outputs.evidence }}
```

The read-only `plan` mode returns `lanes` as a JSON array and `count` as its
length. It includes execution and queued-check maintenance, so empty pools avoid
worker allocation while cleanup still runs under each lane's concurrency lock.
Planning is advisory: each drain rechecks admission after acquiring its lane.
A validated native-CI receipt also plans queued checks from prior policy versions
for retirement. Only serialized drains cancel them after rechecking the current
head, receipt and queued state; mismatched delegated receipts never admit work.
Checks carry a bounded controller ownership block with the worker's native run,
attempt, lane job, snapshot ordinal, finish state, remaining admissions and deadline.
The planner verifies the current run attempt, repository, default branch, manager
workflow and unique `Hauler pool / <lane>` job through GitHub. Live owners suppress
their active snapshots and cover ready work within their remaining capacity.
Workers with an explicit PR selection advertise zero future capacity, so unrelated
queued PRs remain eligible; selected PRs still drain and reuse compatible sandboxes.
One worker is counted once using its latest ordinal, even when several checks
carry its evidence. Completed early failure checks remain owned until independent
tasks finish. Finished, expired, deleted or superseded owners release work for
recovery; exhausted owners reserve no future admissions. Unknown API failures
fail the plan visibly. Enqueue provenance in `external_id` remains intact, while
`details_url` links to the actual worker job. Use the same recipe, Action pin and explicit PR
selection for planning and draining.

The default recipe path is `.github/hauler-ci.json`. Name the manager workflow
`hauler-ci.yml`, or set `manager-workflow` consistently on all invocations.

In the existing `ci.yml` scope job, call the same immutable Action before any
PR checkout. Give that job read permissions for contents, PRs, checks, and
Actions. Keep cheap repository gates unconditional. Run native heavy jobs
unless routing succeeds and returns `delegated`.

```yaml
- uses: ScriptedAlchemy/cargo-hauler@<reviewed-commit-sha>
  id: route
  continue-on-error: true
  with:
    mode: route
    token: ${{ github.token }}
- name: Hauler route / ${{ steps.route.outputs.decision || 'native' }} / ${{ steps.route.outputs.policy || 'unavailable' }}
  run: ':'
```

The named step records ownership in GitHub's job metadata. The controller
requires that successful receipt from the configured `admission-workflow`
(default `ci.yml`) before draining automatic work. Routing decides from policy
alone: a trusted, non-draft, same-repository head that leaves policy untouched
is delegated at once, without waiting for lane checks. Drain still verifies
those checks before it admits a snapshot, so routing never mints or trusts
them. If routing times out or policy validation fails, native CI remains
responsible; a late enqueue cannot start duplicate managed work. Enqueue
creates pending lane checks before a PR waits for a worker. It runs outside
worker concurrency limits.

Delegation is optimistic: a delegated head whose `pull_request_target` enqueue
run failed or never ran has no lane checks, and no worker admits it. Consumers
relying on delegation should also run `mode: enqueue` on a schedule (without
`pull-requests`) so those heads get their checks on the next tick.

PRs that change `.github/`, the configured recipe, or its Dockerfile or build
context retain native CI so new validation cannot be skipped by the default
branch's recipe. Rename sources count too. An incomplete or unreadable PR file
list also keeps native CI; routing never executes the PR's policy.

Confirmed merge conflicts prevent new admission. Enqueue skips these heads;
serialized lane drains cancel only matching queued checks for the current conflicted head. Unknown mergeability
is not a confirmed conflict, and later base conflicts do not cancel a snapshot
already being tested.

A manual dispatch with an explicit `pull-requests` selection permits a bounded
trial alongside native CI. Automatic drains require the ownership receipt.

```json
{
  "version": 1,
  "trustedAuthors": ["your-maintainer-login"],
  "sharedBuilds": false,
  "requiredChecks": ["Repository gates"],
  "image": {"dockerfile": ".github/hauler/Dockerfile", "context": ".github/hauler"},
  "compatibilityPaths": ["Cargo.lock", "rust-toolchain.toml", ".cargo/"],
  "prepare": ["cargo metadata --locked --no-deps --format-version 1 >/dev/null"],
  "reports": [],
  "lanes": [{
    "id": "tests",
    "checkName": "Hauler / Tests",
    "tasks": [{"id": "workspace", "run": "hauler exec -- cargo test --workspace --locked", "timeoutSeconds": 3600}]
  }]
}
```

The trusted Dockerfile installs the repository's tools. It must provide
`/bin/sh`, `/usr/local/bin/node`, and a nonroot-compatible tool installation.
Rust installs use `/opt/rustup` and `/opt/cargo/bin`. The Action executes as
UID 10001 with a private home and temporary directory. Writable mounts contain
only the snapshot and its compiler/package caches. The Docker socket, host
process tree, host home, Actions command files, and host credentials are absent.

For an image built by a trusted workflow, optionally set `image.reference` to
`ghcr.io/<owner>/<image>@sha256:<64 lowercase hex digits>`. Floating tags and other
registries are rejected. Each worker pulls that digest lazily once instead of
building; failed pulls fail the snapshot with no build fallback. A later snapshot
may retry the same digest after a failed or cancelled pull. The trusted Dockerfile
and context still participate in policy validation and hashing. Private GHCR
images require a separate host login step with a job-scoped token and a private
`DOCKER_CONFIG` directory under `RUNNER_TEMP`; only image pull/build receives that
directory. It never enters the PR container or its mounts.

Only ready same-repository PRs from the recipe's authors are admitted, after
their named GitHub Actions checks pass. A lane finishes one snapshot before
selecting the next eligible head. Each lane has exactly one worker under the
caller workflow's concurrency group. Do not run multiple workflows with
different concurrency groups against the same lane/check names.

Admission pins the PR head and its published merge snapshot. A changed PR head,
draft conversion, or closure cancels its work. A later base-branch commit does
not interrupt the admitted snapshot. Checks name the tested merge and base;
they do not claim that a newer base was tested. As with ordinary PR CI, a new
head triggers fresh validation. The Action does not automatically retest a
completed head solely because the base advances. Require up-to-date branches
in repository merge policy if that is part of the repository's contract.

Tests run for every admitted head. No test result is copied to another head.
The first failed task is published immediately; independent remaining tasks
can still provide diagnostics. Success requires every lane task and report
export to finish. Each lane publishes its own result without waiting for
another PR or a final batch reporter.

`sharedBuilds: true` explicitly allows the listed authors to share writable
Cargo and package caches within this worker lifetime. Use it only for code
in one trusted cohort. A PR can modify executable compiler outputs, so a
container alone cannot make that shared cache safe for hostile code. Leave it
false for separate snapshots. Forks and unlisted authors are not admitted;
retain ordinary isolated CI for them.

All Cargo manifests and the listed compatibility inputs participate in the
cache key. Unchanged source files and identical Git subtrees retain their immediately
previous mtimes, avoiding rebuilds caused only by a fresh checkout directory.
Changed or reverted files and subtrees receive fresh timestamps, including
child additions, deletions, and mode changes. Git metadata is never preserved. Every snapshot gets a new
container, and all of its descendants are removed before another starts.
Worker containers never receive the GitHub token. The trusted controller uses
only the short-lived job token; no personal token or App private key is needed.
Read-only routing receives no check-writing permission.

The host summary records queue time, exact snapshot and image identities,
compatibility hashes, compatible sandbox reuse, task outcomes, and monotonic
stage durations, including failed and aborted stages. `compatibility` measures
compatibility metadata reads; `image` includes image pull/build and sandbox
creation or cleanup; `checkout`, preparation, tasks and report collection have
separate timings. Each check publishes this sanitized evidence as work progresses.
Final per-snapshot JSON and the current summary are persisted before admitting
the next snapshot. `evidence` contains those JSON files, numeric JUnit totals and
the names of up to 10 failing or erroring test cases (each at most 120 characters,
plus a count of the rest), which the completed check summary also lists. Raw
XML/JSON reports, passing test names, failure messages, errors and worker output
stay private. The caller's
final artifact upload still happens after the drain step ends. Checks therefore
provide evidence during long drains and interrupted jobs without an artifact SDK.

A drain worker is resident: when an admission scan finds nothing, it waits one
poll interval and scans again, keeping its warm sandbox. It waits through up to
`idle-polls` (default 5, 0 to 60) consecutive empty scans and exits on the next
one. Found work resets the count; `idle-polls: 0` exits on the first empty scan. A snapshot superseded by a
new PR head is cancelled but its sandbox stays warm for the next snapshot;
infrastructure errors and workflow cancellation still discard it.

Workers and caches last only for the hosted job. The schedule recovers missed
demand; normal admission follows the cheap CI workflow's completion. When
enabling this manager, remove the equivalent legacy heavy PR jobs so each
snapshot has one owner. Optional platform/release workflows can remain native.

Local verification uses `pnpm test:action`. The sandbox suite also accepts
`HAULER_SANDBOX_TEST_SNAPSHOT` for its real Docker isolation probe. Hosted
performance must be measured on the repository's full task recipe before
claiming a latency or runner-cost improvement.
