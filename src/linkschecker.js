import fs from 'fs';
import { isLocalLink } from './util/is_local_link.js';


class LinksChecker {
    linksTotal = 0;
    linksTotalFailed = 0;
    linksFailed = [];
    foundLinks = {};
    foundFiles = {};
    
    constructor(filesFolder) {
        this.filesFolder = filesFolder;
    }

    checkLinks(folder = '') {
        this.readLinksInFolder(folder);
        this.compareLinks();
    }

    showReport() {
        console.log(`linksTotal ${this.linksTotal}`);
        console.log(`filesTotal: ${Object.keys(this.foundFiles).length}`);
        console.log(`linksFailed`, this.linksFailed);
        console.log(`linksTotalFailed: ${this.linksTotalFailed}`);
    }

    compareLinks() {
        let resolvedPage = "";
        for (let page in this.foundLinks) {
            if (!this.foundLinks.hasOwnProperty(page)) {
                continue;
            }
            const links = this.foundLinks[page];
            for(let link of links) {
                this.linksTotal++;
                //console.log(link);
                resolvedPage = this.resolveLink(page, link);
                if (!this.foundFiles.hasOwnProperty(resolvedPage) && 
                    !this.foundFiles.hasOwnProperty(resolvedPage + '/index.md')) {
                    this.linksTotalFailed++;
                    this.linksFailed.push([page, link])
                }
            }
        }
    }

    readLinksInFolder(folder) {
        this.foundFiles[folder] = 'd';
        this.listFolderFiles(folder).forEach(file => {
            if (file === 'app') return;
            if (file === 'node_modules') return;
            if (file[0] === '.') return;
            if (this.isFolder(this.filesFolder + '/' + folder + '/' + file)) {
                // do something with folder
                this.readLinksInFolder(folder + '/' + file)
                return;
            }

            this.processFile(folder + '/' + file)
        });
    }

    /**
     *
     * @param folderName folder, should end without slash e.g.: '', '/2023', etc.
     * @returns {string[]}
     */
    listFolderFiles(folderName = '') {
        return fs.readdirSync(this.filesFolder + folderName);
    }

    isFolder(filename) {
        return fs.statSync(filename).isDirectory()
    }

    readFileContent(filename) {
        return fs.readFileSync(filename, 'utf8');
    }

    isMarkdown(filename) {
        return (filename.indexOf('.md') === filename.length - 3);
    }


    /**
     *
     * @param filename Starts from slash
     */
    processFile(filename) {
        this.foundFiles[filename] = 'f';
        if (!this.isMarkdown(filename)) {
            return;
        }
        try {
            const data = this.readFileContent(this.filesFolder + filename);

            const regex = /\[.*\]\((.*)\)/g;
            const matches = data.match(regex);

            if (matches) {
                const linkFound = matches.map(match => {
                    const extractedLink = match.replace(/\[.*\]\((.*)\)/, '$1');
                    if (isLocalLink(extractedLink)) {
                        return extractedLink;
                    }
                    return false;
                }).filter( value => {
                    return value;
                });
                this.foundLinks[filename] = linkFound
            } 
            
        } catch (err) {
            console.error(err)
        }
    }



    resolveLink(filePath, linkPath) {
        const filePathParts = filePath.split('/');
        filePathParts.pop();

        const linkPathParts = linkPath.split('/');
        
        while (linkPathParts[0] === '.') {
            linkPathParts.shift();
        }
        
        while (linkPathParts[0] === '..') {
            filePathParts.pop();
            linkPathParts.shift();
        }

        const newPathParts = [...filePathParts, ...linkPathParts]
        return newPathParts.join('/')
    }
}

export default LinksChecker;
