#!/usr/bin/env node
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
        //console.log(`command success: ${commitStdout}`);
    } catch (error) {
        //console.error(`command: Error: ${error}`);
        if (error.stderr) {
            //console.error(`Error details: ${error.stderr}`);
        }
    }
}

async function commitAndPush() {
    // add files
    console.log("adding new files if any...")
    await runACommand(`git add *`)
    // commit changes
    console.log("doing commit to save our changes...")
    await runACommand(`git commit -am"autocommit"`)
    //merge in case of any remote changes
    console.log("pulling remote changes...")
    await runACommand(`git pull origin master`)
    //add all conflicts if any, IDC
    console.log("adding files in case conflicts...")
    await runACommand(`git add *`)
    // one more commit if needed
    console.log("doing commit again to save our changes...")
    await runACommand(`git commit -am"autocommit"`)
    // push the result
    console.log("pushing updates to remote...")
    await runACommand(`git push origin master`)
    console.log("done.")
}

async function customCommand01() {
    console.log("done.")
}

async function main() {
    const command = process.argv[2];  // Get the command from arguments

    if (process.argv.length !== 3) {
        console.error("should be called like: nmd <command>")
        return;
    }
    
    switch (command) {
        case 's':
        case 'sync':
            await commitAndPush();
            break;
        case 'command01':
            await customCommand01();
            break;
        default:
            console.log('Usage: node gitCommitPush.js [sync|command01]');
            break;
    }
}

main().then(r => {});
