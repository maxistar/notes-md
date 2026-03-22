#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import NotesIndexer from "./src/notesindexer.js";
import LinksChecker from "./src/linkschecker.js";
import StructureChecker from "./src/structurechecker.js";


import { exec as execCallback } from 'child_process';
import { promisify } from 'util';

const exec = promisify(execCallback);
// const commitMessage = "Your commit message here";
// const remote = "origin";
// const branch = "master";

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
    const env = { ...process.env, LANG: 'C', LC_ALL: 'C' };
    try {
        const { stdout } = await exec(command, { env });
        if (stdout?.trim()) console.log(stdout.trim());
    } catch (error) {
        const msg = (error.stderr || error.stdout || error.message || '').trim();
        const isExpected = msg.includes('nothing to commit')
            || msg.includes('nothing added to commit');
        if (!isExpected) console.error(msg || `Error running: ${command}`);
    }
}

async function commitAndPush() {
    console.log("adding new files if any...")
    await runACommand(`git add -A`)
    console.log("committing changes...")
    await runACommand(`git commit -am"autocommit"`)
    console.log("pulling remote changes...")
    await runACommand(`git pull origin master`)
    console.log("adding files after merge...")
    await runACommand(`git add -A`)
    console.log("committing after merge...")
    await runACommand(`git commit -am"autocommit"`)
    console.log("pushing to remote...")
    await runACommand(`git push origin master`)
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
