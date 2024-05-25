import NotesIndexer from "../src/notesindexer";

describe('add function', () => {
    test('tags should be stored internally the normal way', () => {
        const indexer = new NotesIndexer(process.cwd() + '/tests/testnotes/source');
        indexer.setTagSynonyms({
            'teg': ["teg1", "tag"]
        })
        
        indexer.readNotes();
        
        const expectedTags = { 
            '#teg': ['/notes/2023/20231020_test_note.md', '/notes/test_note.md' ],
            '#subfolder':  ['/notes/2023/20231020_test_note.md'],
            '#blah': [ '/notes/test_note.md' ] 
        }
        expect(indexer.tags).toStrictEqual(expectedTags);
    });


    test('tags should be stored externaly', () => {
        const indexer = new NotesIndexer(process.cwd() + '/tests/testnotes/source');
        const prefix = indexer.getTagsPrefix("/notes/test")
        expect(prefix).toEqual('');

        const prefix1 = indexer.getTagsPrefix("/notes/test/test")
        expect(prefix1).toEqual('../');
    });
    
    
    test('tags should be stored externally', () => {
        const indexer = new NotesIndexer(process.cwd() + '/tests/testnotes/source');
        indexer.setTagSynonyms({
            'teg': ["teg1", "tag"] 
        })

        indexer.readNotes();
        indexer.setNotesFolder(process.cwd() + '/tests/testnotes/target');
    
        indexer.writeIndex();
        indexer.writeTags();
        indexer.linkNotes();
    });

    test('tags should read backlinks', () => {
        const indexer = new NotesIndexer(process.cwd() + '/tests/testnotes/source');
        indexer.setTagSynonyms({
            'teg': ["teg1", "tag"]
        })

        indexer.readNotes();
        const expectedBacklinks = {  
            "/notes/test_note.md": ["/notes/2023/20231020_test_note.md"]
        }
        expect(indexer.backLinks).toStrictEqual(expectedBacklinks);
    });
    
    test('relative links resolving to absolute', () => {
        const indexer = new NotesIndexer(process.cwd() + '/tests/testnotes/source');
        [['/notes/index.md', '../diary/index.md', '/diary/index.md']].forEach((useCase) => {
            const [filePath,linkPath, expectedResult] = useCase;
            const value = indexer.resolveLink(filePath, linkPath);
            expect(value).toEqual(expectedResult);
        })
    });

    test('absolute links resolving to relative', () => {
        const indexer = new NotesIndexer(process.cwd() + '/tests/testnotes/source');
        [
            ['/notes/tags/index.md', '/notes/index.md', '../', 7], // ../index.md
            ['/notes/tags/index.md', '/notes/subject/science/index.md', '../', 7], // ../subject/science/index.md
            ['/notes/subject/index.md', '/notes/subject/science/index.md', '', 15], // science/index.md 5 + 7 + 2 + 1
            ['/notes/article.md', '/diary/2024/week1.md', '../', 1], // ../diary/2024/week1.md
            ['/notes/subject/article.md', '/diary/2024/week1.md', '../../', 1] // ../../diary/2024/week1.md
        ].forEach((useCase) => {
            const [filePath,linkPath, expectedPrefix, expectedTrim] = useCase;
            const [tagPrefix, trimCharacters] = indexer.buildRelativeLink(filePath, linkPath);
            expect(tagPrefix).toEqual(expectedPrefix);
            expect(trimCharacters).toEqual(expectedTrim);
        })
    });
    
});
