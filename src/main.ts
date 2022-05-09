import * as core from '@actions/core'
import * as github from '@actions/github'
import {Octokit} from '@octokit/rest'

const octokit = new Octokit({})

async function run(): Promise<void> {
  try {
    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = JSON.stringify(github.context.payload, undefined, 2)
    const owner = github.context.payload.owner.name ?? 'manumena'
    const repo = github.context.payload.repository?.name ?? 'gh-action-fork'

    core.setOutput('payload', `The event payload: ${payload}`)
    core.setOutput('context', github.context)

    // Get latest release
    // TODO: make this more robust
    const latestRelease = await octokit.rest.repos.getLatestRelease({
      owner,
      repo
    })
    core.setOutput('latestRelease', latestRelease.data.tag_name)

    // Get diff between last tag and now
    // const lastTag = latestRelease.data.tag_name
    const commits = await octokit.rest.repos.listCommits({
      owner,
      repo
    })
    core.setOutput('commits', commits)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
