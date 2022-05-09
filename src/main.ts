import * as core from '@actions/core'
import * as github from '@actions/github'
// import {Octokit} from '@octokit/rest'
import {wait} from './wait'

// const octokit = new Octokit({})

async function run(): Promise<void> {
  try {
    const ms: string = core.getInput('milliseconds')
    core.debug(`Waiting ${ms} milliseconds ...`) // debug is only output if you set the secret `ACTIONS_STEP_DEBUG` to true

    core.debug(new Date().toTimeString())
    await wait(parseInt(ms, 10))
    core.debug(new Date().toTimeString())

    core.debug(JSON.stringify(github.context))
    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = JSON.stringify(github.context.payload, undefined, 2)
    core.setOutput('payload', `The event payload: ${payload}`)
    core.setOutput('context', github.context)

    // Get latest release
    // TODO: make this more robust
    // const latestRelease = await octokit.rest.repos.getLatestRelease({
    //   owner: github.context.payload.owner.name,
    //   repo: github.context.payload.repository?.name ?? ''
    // })
    // core.setOutput('latestRelease', latestRelease.data.tag_name)

    // Get diff between last tag and now
    // const lastTag = latestRelease.data.tag_name
    // const commits = await octokit.rest.repos.listCommits({
    //   owner: payload.owner.name,
    //   repo: payload.repository?.name ?? ''
    // })
    // core.setOutput('commits', commits)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
