import fs from 'fs';

class StructureChecker {

    names = {};
    
    constructor(filesFolder) {
        console.log(filesFolder)
        this.filesFolder = filesFolder;
    }

    checkNotes(folder = '') {
        console.log(folder)
        this.readLinksInFolder(folder);
        // this.compareLinks();
    }

    showReport() {
        console.log(`result`);
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
        //this.foundFiles[folder] = 'd';
        this.listFolderFiles(folder).forEach(file => {
            if (file === 'app') return;
            if (file === 'src') return;
            if (file === 'tests') return;
            if (file === 'tags') return;
            if (file === 'node_modules') return;
            if (file[0] === '.') return;
            if (this.isFolder(this.filesFolder + '/' + folder + '/' + file)) {
                // do something with folder
                this.readLinksInFolder(folder + '/' + file)
                return;
            }

            // check file name
            // const prefix = folder.substring(1).replace('/', '_');
            // console.log(prefix)
            
            // if (file.indexOf(prefix) !== 0) {
            //    console.log('wrong file prefix: ' + folder + '/' + file) 
            //}
            this.processFile(folder + '/' + file)
            
            if (this.names.hasOwnProperty(file)) {
                console.log('duplicated file with name: ' + folder + '/' + file)
            } else {
                this.names[file] = folder;
            }
            
            
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
        // this.foundFiles[filename] = 'f';
        // console.log(filename);
        if (!this.isMarkdown(filename)) {
            console.log(`warning wrong extension ${filename}`);
            return;
        }
        try {
            /*
            const data = this.readFileContent(this.filesFolder + filename);

            const regex = /\[.*\]\((.*)\)/g;
            const matches = data.match(regex);

            if (matches) {
                const linkFound = matches.map(match => {
                    const extractedLink = match.replace(/\[.*\]\((.*)\)/, '$1');
                    if (this.isLocalLink(extractedLink)) {
                        return extractedLink;
                    }
                    return false;
                }).filter( value => {
                    return value;
                });
                this.foundLinks[filename] = linkFound
            } */

        } catch (err) {
            console.error(err)
        }
    }

    isLocalLink(linkFound) {

        if (linkFound.indexOf('http://') === 0) {
            return false;
        }
        if (linkFound.indexOf('https://') === 0) {
            return false;
        }
        if (linkFound.indexOf('file://') === 0) {
            return false;
        }
        if (linkFound.indexOf('git@') === 0) {
            return false;
        }
        if (linkFound.indexOf('#') === 0) {
            return false;
        }
        return true;
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

export default StructureChecker;
