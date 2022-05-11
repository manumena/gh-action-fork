import * as core from '@actions/core'
import * as github from '@actions/github'
import {Octokit} from '@octokit/rest'
// import {createActionAuth} from '@octokit/auth-action'

async function run(): Promise<void> {
  const token = core.getInput('GITHUB_TOKEN')
  // const auth = createActionAuth()
  // const authentication = await auth()

  const octokit = new Octokit({
    auth: token
  })

  try {
    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = JSON.stringify(github.context.payload, undefined, 2)
    const owner = github.context.payload.repository?.owner.name ?? 'manumena'
    const repo = github.context.payload.repository?.name ?? 'gh-action-fork'
    // TODO: fail if owner or repo are not filled properly

    core.setOutput('payload', `The event payload: ${payload}`)
    core.setOutput('context', github.context)

    // Get latest release
    const latestRelease = await octokit.rest.repos.getLatestRelease({
      owner,
      repo
    })
    core.setOutput('latestRelease', latestRelease.data.tag_name)
    // TODO: fail if tag is not semver

    // Get diff between last tag and now
    // TODO: pagination
    const lastTag = latestRelease.data.tag_name
    const commits = await octokit.rest.repos.compareCommits({
      owner,
      repo,
      base: lastTag,
      head: 'HEAD'
    })

    // Extract messages
    const commitsMessages = commits.data.commits.map(
      commit => commit.commit.message
    )
    core.setOutput('commits', commitsMessages)

    // Decide what to bump depending on commit messages
    let bumpPatch = false
    let bumpMinor = false
    let bumpMajor = false
    for (const message of commitsMessages) {
      if (message.match('^(chore|docs|fix|refactor|revert|style|test): .+$')) {
        bumpPatch = true
      } else if (message.match('^feat: .+$')) {
        bumpMinor = true
      } else if (message.match('^break: .+$')) {
        bumpMajor = true
      }
    }
    core.setOutput('bumpMajor', bumpMajor)
    core.setOutput('bumpMinor', bumpMinor)
    core.setOutput('bumpPatch', bumpPatch)

    // Bump the version
    const semverRegex = new RegExp('^([0-9]+).([0-9]+).([0-9]+)$', 'g')
    const match = semverRegex.exec(lastTag)
    let newTag = ''
    if (match) {
      if (bumpMajor) {
        const bump = (parseInt(match[1]) + 1).toString()
        newTag = lastTag.replace(semverRegex, `${bump}.0.0`)
      } else if (bumpMinor) {
        const bump = (parseInt(match[2]) + 1).toString()
        newTag = lastTag.replace(semverRegex, `$1.${bump}.0`)
      } else if (bumpPatch) {
        const bump = (parseInt(match[3]) + 1).toString()
        newTag = lastTag.replace(semverRegex, `$1.$2.${bump}`)
      }
    }
    core.setOutput('newTag', newTag)

    // Create a release
    const response = octokit.rest.repos.createRelease({
      owner,
      repo,
      tag_name: newTag,
      generate_release_notes: true
    })
    core.setOutput('releaseResponse', response)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
