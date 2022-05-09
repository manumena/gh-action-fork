import * as core from '@actions/core'
import * as github from '@actions/github'
import { Octokit } from "@octokit/rest"
import {wait} from './wait'

const octokit = new Octokit({})

async function run(): Promise<void> {
  try {
    const ms: string = core.getInput('milliseconds')
    core.debug(`Waiting ${ms} milliseconds ...`) // debug is only output if you set the secret `ACTIONS_STEP_DEBUG` to true

    core.debug(new Date().toTimeString())
    await wait(parseInt(ms, 10))
    core.debug(new Date().toTimeString())

    // core.setOutput('time', new Date().toTimeString())

    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = JSON.stringify(github.context.payload, undefined, 2)
    core.setOutput('payload', `The event payload: ${payload}`)
    core.setOutput('context', github.context)

    // Get latest release
    // const latestRelease = octokit.rest.repos.getLatestRelease({
    //   payload.owner.name,
    //   payload.repository.name,
    // })

    const latestRelease = await octokit.rest.repos.getLatestRelease({
      owner: 'manumena',
      repo: 'gh-action-fork'
    })
    // core.setOutput('latestRelease', JSON.stringify(latestRelease, undefined, 2))
    core.setOutput('latestRelease', latestRelease)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
