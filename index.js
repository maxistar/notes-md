#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import NotesIndexer from "./src/notesindexer.js";
import LinksChecker from "./src/linkschecker.js";
import StructureChecker from "./src/structurechecker.js";


import { exec as execCallback } from 'child_process';
import { promisify } from 'util';

const exec = promisify(execCallback);
const GIT_ENV = { ...process.env, LANG: 'C', LC_ALL: 'C' };

async function runACommand(command) {
    try {
        const { stdout } = await exec(command, { env: GIT_ENV });
        if (stdout?.trim()) console.log(stdout.trim());
    } catch (error) {
        const msg = (error.stderr || error.stdout || error.message || '').trim();
        const isExpected = msg.includes('nothing to commit')
            || msg.includes('nothing added to commit');
        if (!isExpected) console.error(msg || `Error running: ${command}`);
    }
}

async function gitQuery(command) {
    try {
        const { stdout } = await exec(command, { env: GIT_ENV });
        return stdout.trim();
    } catch {
        return '';
    }
}

async function getHead() {
    return gitQuery('git rev-parse HEAD');
}

async function countChangedFiles(from, to) {
    if (!from || !to || from === to) return 0;
    const out = await gitQuery(`git diff --name-only ${from} ${to}`);
    return out ? out.split('\n').filter(Boolean).length : 0;
}

async function countFilesAheadOfRemote() {
    const out = await gitQuery('git diff --name-only @{u} HEAD');
    return out ? out.split('\n').filter(Boolean).length : 0;
}

async function commitAndPush() {
    console.log("adding new files...")
    await runACommand(`git add -A`)
    console.log("committing changes...")
    await runACommand(`git commit -am"autocommit"`)

    console.log("counting files to push...")
    const filesToPush = await countFilesAheadOfRemote();

    console.log("pulling remote changes...")
    const headBefore = await getHead();
    await runACommand(`git pull origin master`)
    const headAfter = await getHead();
    const pulled = await countChangedFiles(headBefore, headAfter);
    if (pulled > 0) {
        console.log(`↓ pulled: ${pulled} file(s) changed from remote`);
    } else {
        console.log('↓ already up to date');
    }

    console.log("adding files after merge...")
    await runACommand(`git add -A`)
    console.log("committing after merge...")
    await runACommand(`git commit -am"autocommit"`)

    console.log("pushing to remote...")
    await runACommand(`git push origin master`)
    if (filesToPush > 0) {
        console.log(`↑ pushed: ${filesToPush} file(s) to remote`);
    }

    console.log("done.")
}

async function indexNotes() {
    console.log("process folder " + path.resolve("."))

    let config;
    try {
        config = JSON.parse(fs.readFileSync(path.resolve("notes.config.json"), 'utf-8'));
    } catch (e) {
        console.error("error reading notes.config.json")
        console.error(e)
        return;
    }
    const indexer = new NotesIndexer(path.resolve("."));

    indexer.setTagSynonyms(config.synonyms);
    indexer.setNotesSeparator(config.notes.separator);
    indexer.setMaxOtherLinksNumber(config.notes.maxOtherLinksNumber);
    indexer.indexPages();
    
    console.log("done.")
}

async function checkLinks() {
    try {
        JSON.parse(fs.readFileSync(path.resolve("notes.config.json"), 'utf-8'));
    } catch (e) {
        console.error("error reading notes.config.json")
        console.error(e)
        return;
    }

    const linksChecker = new LinksChecker(path.resolve("."))
    console.log("read links...");
    linksChecker.checkLinks();
    console.log("analise links...");

    linksChecker.showReport();
}

async function checkStructure() {
    let config;
    try {
        config = JSON.parse(fs.readFileSync(path.resolve("notes.config.json"), 'utf-8'));
    } catch (e) {
        console.error("error reading notes.config.json")
        console.error(e)
        return;
    }
    
    const indexer = new StructureChecker(path.resolve(".", config.folders.notes));

    indexer.checkNotes();
}

async function main() {
    const command = process.argv[2];  // Get the command from arguments
    let helpString = 'Usage: node gitCommitPush.js [sync|s|index|i|check-links|cl|check-structure|cs]';

    if (process.argv.length !== 3) {
        console.error(helpString)
        return;
    }
    
    switch (command) {
        case 's':
        case 'sync':
            await commitAndPush();
            break;
        case 'i':
        case 'index':
            await indexNotes();
            break;
        case 'cl':
        case 'check-links':
            await checkLinks();
            break;
        case 'cs':
        case 'check-structure':
            await checkStructure();
            break;
        default:
            console.log(helpString);
            break;
    }
}

main().then(r => {});
