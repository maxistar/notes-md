import fs from 'fs';
import { isLocalLink } from './util/is_local_link.js';


const MAX_LINKS_NUMBER = 10

class NotesIndexer {
    notesFolder = '';
    rootFolder = '';
    tags = {};
    fileTags = {};
    fileTitles = {};
    tagsSynonymes = {};
    backLinks = {};
    separator = "### see also:";
    maxOtherLinksNumber = MAX_LINKS_NUMBER;
    ignoredFolders = ['/history', '/loqseq', '/pages', '/app', '/src', '/tests', '/notes/tags', '/.idea', '/journals', '/.git', '/node_modules'];
    

    constructor(notesFolder) {
        this.setNotesFolder(notesFolder);
    }


    setNotesFolder(notesFolder) {
        this.notesFolder = notesFolder + '/notes';
        this.rootFolder = notesFolder;
    }
    
    setNotesSeparator(separator) {
        this.separator = separator;
    }
    
    setMaxOtherLinksNumber(value) {
        this.maxOtherLinksNumber = value;
    }
    
    setTagSynonyms(tagsSynonymes) {
        const result = {};

        for (const key of Object.keys(tagsSynonymes)) {
            for (let value of tagsSynonymes[key]) {
                result['#' + value] = '#' + key;
            }    
        }
        this.tagsSynonymes = result;
    }
    
    /**
     * Format tags
     *
     * @param tags
     * @param skipCharacters
     * @return {string}
     */
    formatTags(tags, skipCharacters) {
        let s = '# Index\n\n'
        s += '| tag | files |\n';
        s += '| --- | ----- |\n';
        for (const tag of Object.keys(tags).sort()) {
            const pages = tags[tag];
            const fileTag = tag.substring(1);
            const txtPages = [];
            for (const page of pages) {
                txtPages.push('[' + this.getPageTitle(page, skipCharacters) + '](' + page.substring(skipCharacters) + ')');
            }
            s += '|[' + tag + '](tags/' + fileTag + '.md)|' + txtPages.join(', ') + '|\n';
        }
        return s;
    }

    readFileContent(filename) {
        return fs.readFileSync(filename, 'utf8');
    }

    /**
     * 
     * @param folderName folder, should end without slash e.g.: '', '/2023', etc.
     * @returns {string[]}
     */
    listFolderFiles(folderName = '') {
        return fs.readdirSync(this.rootFolder + folderName); 
    }
    
    isFolder(filename) {
        return fs.statSync(this.rootFolder + filename).isDirectory()
    }

    normalizeTag(tag) {
        if (this.tagsSynonymes.hasOwnProperty(tag)) {
            return this.tagsSynonymes[tag]; 
        }
        return tag;
    }

    /**
     * 
     * @param filename Starts from slash
     */
    processFile(filename) {
        try {
            const data = this.readFileContent(this.rootFolder + filename);
            this.readTagsFromFile(filename, data);
            this.readBackLinks(filename, data);
        } catch (err) {
            console.error(err)
        }
    }

    readBackLinks(filename, data) {
        const separator = '\n' + this.separator + '\n';
        const lines = data.split(separator);
        const content = lines[0];
        const regex = /\[.*\]\((.*)\)/g;
        const matches = content.match(regex);

        if (matches) {
            const linksFound = matches.map(match => {
                const extractedLink = match.replace(/\[.*\]\((.*)\)/, '$1');
                if (isLocalLink(extractedLink)) {
                    return this.resolveLink(filename, extractedLink);
                }
                return false;
            }).filter( value => {
                return value;
            });

            for (let linkFound of linksFound) {
                if (!this.backLinks[linkFound]) {
                    this.backLinks[linkFound] = [filename];
                }
    
                if (this.backLinks[linkFound].indexOf(filename) === -1) {
                    this.backLinks[linkFound].push(filename)
                }
            }
        } 
    }

    buildRelativeLink(filePath, linkPath) {
        const filePathParts = filePath.split('/');
        const linkPathPart = linkPath.split('/');
        let countCommonParts = 0;
        let commonLength = 0;
        let commonPart;
        while(filePathParts.length > 1 && linkPathPart.length > 1 && filePathParts[0] === linkPathPart[0]) {
            commonPart = filePathParts.shift();
            linkPathPart.shift();
            countCommonParts++;
            commonLength += commonPart.length;
        }
        let prefix = '';
        for(let i = 1; i < filePathParts.length; i++) {
            prefix += '../';
        }
        
        return [prefix, countCommonParts + commonLength];
    }
    
    /**
     * transforms relative link to absolute one
     * 
     * @param {*} filePath File Where Links is Found
     * @param {*} linkPath Link itself
     * @returns 
     */
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

    readTagsFromFile(filename, data) {
        const lines = data.split('\n');
            let tagsLineFound = false;
            let titleFound = false;
            let tagNormalized;
            // get the line with tags:
            for (const line of lines) {
                if (line.indexOf('tags:') === 0) {
                    tagsLineFound = true;
                    // console.log(line);
                    const t = /#[a-zа-я0-9_\-]+/ugi
                    const result = line.match(t);

                    if (result !== null) {
                        for (let tag of result) {
                            tagNormalized = this.normalizeTag(tag);
                            
                            if (!this.tags.hasOwnProperty(tagNormalized)) {
                                this.tags[tagNormalized] = [];
                            }
                            if (this.tags[tagNormalized].indexOf(filename) === -1) {
                                this.tags[tagNormalized].push(filename);
                            }


                            if (!this.fileTags.hasOwnProperty(filename)) {
                                this.fileTags[filename] = [];
                            }
                            if (this.fileTags[filename].indexOf(tagNormalized) === -1) {
                                this.fileTags[filename].push(tagNormalized);
                            }
                        }
                    }
                }

                // found title
                if (line.indexOf('# ') === 0) {
                    if (!titleFound) {
                        this.fileTitles[filename] = line.substring(2);
                        titleFound = true;
                    }
                }
            }
            //if (!tagsLineFound) {
            //    console.log(`Warning: no tags found in ${filename}`);
            //}
    }

    
    /**
     * Read Notes
     * 
     * folder, should end without slash e.g.: '', '/2023', etc.
     */
    readNotes(folder = '') {
        if (this.ignoredFolders.indexOf(folder) !== -1) {
            console.log(folder)
            return;
        }
        this.listFolderFiles(folder).forEach(file => {
            if (file === 'index.md') return;
            if (file === 'tags') return;
            if (file.substring(0, 1) === '.') return; // skip hidden files started from .
            if (this.isFolder( folder + '/' + file)) {
                // do something with folder
                this.readNotes(folder + '/' + file)
                return;
            }

            this.processFile(folder + '/' + file)
        });
    }

    /**
     * Write Index File
     */
    writeIndex() {
        const [_, skipCharacters] = ['', 7];
        fs.writeFile(this.notesFolder + '/index.md', this.formatTags(this.tags, skipCharacters), () => {});
    }

    /**
     * returns number of '../' depending on number of 'in file'
     * @param fileUrl
     */
    getTagsPrefix(fileUrl) {
        //fileWithoutPrefix
        const parts = fileUrl.split('/');
        let result = "";
        for (let i = 3; i < parts.length; i++) {
            result = result + "../"
        }
        return result;
    }

    /**
     * Update File with links
     *
     * @param file
     */
    linkFile(file) {
        try {
            const data = this.readFileContent(this.rootFolder + '/' + file , 'utf8');
            let tagLinksText = '';
            const separator = '\n' + this.separator + '\n';
            const lines = data.split(separator);
            const content = lines[0];
            const [tagsPrefix, skipCharacters] = [this.getTagsPrefix(file), 7]
            if (this.fileTags.hasOwnProperty(file)) {
                // prepare list of relevant pages
                const tagLinks = [];
                const fileLinks = [];
                const theFileTags = [...this.fileTags[file]].sort();
                for (const tag of theFileTags) {
                    tagLinks.push('- [' + tag + ']('+ tagsPrefix + 'tags/' + tag.substring(1) + '.md)');
                    const otherFiles = [...this.tags[tag]].sort();
                    for (const otherFile of otherFiles) {
                        const fileIsNotInBacklinks = !(this.backLinks[file] && this.backLinks[file].indexOf(otherFile) !== -1);
                        const fileIsNotInTheList = fileLinks.indexOf(otherFile) === -1;
                        if (fileIsNotInBacklinks && fileIsNotInTheList) {
                            fileLinks.push(otherFile);
                        }
                    }
                }

                // format an updated list of the links
                const fileLinksSorted = [...fileLinks].sort();

                const tagFileLinks = this.limitExternalLinks(fileLinksSorted, file, tagsPrefix, skipCharacters);

                tagLinksText = tagLinks.join('\n') 
                    + '\n'
                    + (tagFileLinks.length > 0 ? tagFileLinks.join('\n') + '\n' : '');
            }

            const revertLinksText = this.formatBackLinksForFile(file);
            if(tagLinksText !== '' || revertLinksText !== '') {
                // build a new text
                

                const newContent = content + 
                        separator + 
                        revertLinksText + 
                        tagLinksText;

                fs.writeFile(this.rootFolder + '/' + file, newContent, () => {});
            }

        } catch (err) {
            console.error(err) 
        }
    }

    formatBackLinksForFile(file) {
        if (!this.backLinks[file]) {
            return '';
        }
        const backLinks = this.backLinks[file];
        const backLinksFormatted = [];
        for (let backLink of backLinks) {
            const [tagsPrefix, skipCharacters] = this.buildRelativeLink(file, backLink)
            // todo this prevents from indexing backlinks
            //if (backLink.indexOf('/notes/') !== 0) {
            //    continue;
            //}
            backLinksFormatted.push('- [' + this.getPageTitle(backLink, skipCharacters) + '](' + tagsPrefix + backLink.substring(skipCharacters) + ')');
        }
        if (backLinksFormatted.length === 0) {
            return '';
        }
        return backLinksFormatted.join('\n') + '\n';
    }

    limitExternalLinks(fileLinksSorted, currentFileName, tagsPrefix, skipCharacters) {
        const tagFileLinks = [];

        const currentFileIndex = fileLinksSorted.indexOf(currentFileName);

        let startIndex = Math.max(0, currentFileIndex - Math.floor(this.maxOtherLinksNumber / 2));
        let stopIndex = Math.min(currentFileIndex + Math.ceil(this.maxOtherLinksNumber / 2), fileLinksSorted.length - 1);

        const leftElements = fileLinksSorted.length - currentFileIndex - 1

        if (leftElements < this.maxOtherLinksNumber / 2) {
            startIndex = Math.max(0, fileLinksSorted.length - 1 - this.maxOtherLinksNumber)
            stopIndex = fileLinksSorted.length - 1;
        } else if (currentFileIndex < this.maxOtherLinksNumber / 2) {
            startIndex = 0
            stopIndex = Math.min(fileLinksSorted.length - 1, this.maxOtherLinksNumber)
        }


        let index = 0;
        for (const fileLink of fileLinksSorted) {
            if (index < startIndex || index > stopIndex) {
                index++;
                continue
            }
            index++;
            if (fileLink === currentFileName) { // skip current file from the list
                continue
            }
            tagFileLinks.push('- [' + this.getPageTitle(fileLink, skipCharacters) + '](' + tagsPrefix + fileLink.substring(skipCharacters) + ')');
        }
        return tagFileLinks;
    }

    /**
     * Link Notes 
     * 
     * @folder String '', '/folder'
     */
    linkNotes(folder = '') {
        //read files
        this.listFolderFiles(folder).forEach(file => {
            if (file === 'index.md') return;
            if (file === 'tags') return;

            if (this.isFolder(folder + '/' + file)) {
                // do something with folder
                this.linkNotes(folder + '/' + file)
                return;
            }
            this.linkFile(folder + '/' + file);
        });
    }

    /**
     * Write Tag Index files to
     * @param tag
     * @param pages
     */
    writeTagIndex(tag, pages) {
        const [tagPrefix, skipCharacters] = ['../', 7]; 
        const fileName = tag.substring(1);
        const content = [];
        const sortedPages = [...pages].sort();
        content.push('# ' + fileName + '\n');

        for(const page of sortedPages) {
            content.push('- [' + this.getPageTitle(page, skipCharacters) + '](' + tagPrefix + page.substring(skipCharacters) + ')');
        }

        content.push('\n');
        content.push('[index](../index.md)');

        fs.writeFile(this.notesFolder + '/tags/' + fileName + '.md', content.join('\n'), () => {});
    }

    writeTags() {
        for(const tag of Object.keys(this.tags).sort()) {
            const pages = this.tags[tag];
            this.writeTagIndex(tag, pages);
        }
    }

    indexPages() {
        this.readNotes();
        this.writeIndex();
        this.writeTags();
        this.linkNotes('/notes');
    }

    getPageTitle(fileLink, skipCharacters) {
        if (this.fileTitles.hasOwnProperty(fileLink)) {
            return this.fileTitles[fileLink];
        }
        return fileLink.substring(skipCharacters);
    }
}

export default NotesIndexer



