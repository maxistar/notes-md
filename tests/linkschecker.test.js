import LinksChecker from "../src/linkschecker";

describe('check links', () => {
    test('should count all links', () => {
        const checker = new LinksChecker(process.cwd() + '/tests/testnotes/linkscheck');
        checker.checkLinks();

        const expectedLinks = {
            '/index.md': ['./link', './diary'],
            '/note/note_01.md': ['2020/note_02.md'],
            '/diary/index.md': [
                './2023/week_2_2023_11.md',
                './2023/10/week_1_2023_10.md',
            ],
        }
        
        expect(checker.foundLinks).toStrictEqual(expectedLinks);
    });
    
    test('should count all files', () => {
        const checker = new LinksChecker(process.cwd() + '/tests/testnotes/linkscheck');
        checker.checkLinks();

        const expectedFiles = {
            "": "d",
            "/diary": "d",
            "/diary/2023": "d",
            "/diary/2023/10": "d",
            '/diary/2023/10/week_1_2023_10.md': 'f',
            '/diary/2023/week_2_2023_11.md': 'f',
            '/diary/index.md': 'f',
            '/index.md': 'f',
            "/note": "d",
            "/note/2020": "d",
            '/note/2020/note_02.md': 'f',
            '/note/note_01.md': 'f',
        }
        
        expect(checker.foundFiles).toStrictEqual(expectedFiles);
    });

    describe('check links', () => {
        const resolverTestCases = [
            ['/diary/index.md', './2023/week_2_2023_11.md', '/diary/2023/week_2_2023_11.md', 'relative link'],
            ['/diary/index.md', '../note/file.md', '/note/file.md', 'relative link with going up'],
        ]

        const checker = new LinksChecker(process.cwd() + '/tests/testnotes/linkscheck');
        resolverTestCases.forEach(testCase => {
            const [filePath, linkPath, expectedResult, testName] = testCase 
            test(testName, () => {
                const result = checker.resolveLink(filePath, linkPath);
                expect(result).toEqual(expectedResult)
            })
        })
    });

    describe('markdown tester', () => {
        const resolverTestCases = [
            ['/diary/index.md', true, 'markdown'],
            ['/diary/index.pdf', false, 'not mark down'],
        ]

        const checker = new LinksChecker(process.cwd() + '/tests/testnotes/linkscheck');
        resolverTestCases.forEach(testCase => {
            const [filePath, expectedResult, testName] = testCase 
            test(testName, () => {
                const result = checker.isMarkdown(filePath);
                expect(result).toEqual(expectedResult)
            })
        })
    });

    test('should count all files', () => {
        const checker = new LinksChecker(process.cwd() + '/tests/testnotes/linkscheck');
        checker.checkLinks();

        const expectedList = [
            ['/index.md', './link'],
        ]

        expect(checker.linksTotal).toEqual(5);
        expect(checker.linksTotalFailed).toEqual(1);
        expect(checker.linksFailed).toStrictEqual(expectedList);
    });

});
