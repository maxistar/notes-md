#!/usr/bin/env node
console.log("Hello world");

const { exec: execCallback } = require('child_process');
const { promisify } = require('util');
const exec = promisify(execCallback);
const commitMessage = "Your commit message here";
const remote = "origin";
const branch = "master";

/**
 * #!/data/data/com.termux/files/usr/bin/bash
 *
 * cd /storage/emulated/0/Documents/work
 * git add * > ~/.sync.log
 * git commit -am"autocommit" >> ~/.sync.log
 * git pull origin master >> ~/.sync.log
 * git add * >> ~/.sync.log
 * git commit -am"autocommit" >> ~/.sync.log
 * git push origin master >> ~/.sync.log
 *
 *
 * termux-toast cat ~/.sync.log
 * 
 * @returns {Promise<void>}
 */

async function runACommand(command) {
    try {
        // Run git commit
        const { stdout: commitStdout } = await exec(command);
        console.log(`command success: ${commitStdout}`);
    } catch (error) {
        console.error(`command: Error: ${error}`);
        if (error.stderr) {
            console.error(`Error details: ${error.stderr}`);
        }
    }
}

async function commitAndPush() {
    // add files
    await runACommand(`git add *`)
    // commit changes
    await runACommand(`git commit -am"autocommit"`)
    //merge in case of any remote changes
    await runACommand(`git pull origin master`)
    //add all conflicts if any, IDC
    await runACommand(`git add *`)
    // one more commit if needed
    await runACommand(`git commit -am"autocommit"`)
    // push the result
    await runACommand(`git push origin master`)
}

commitAndPush();
