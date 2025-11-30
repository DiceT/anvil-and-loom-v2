
import { remark } from 'remark';
import remarkWikiLink from 'remark-wiki-link';

const markdown = '[[Reyk Cedandar]]';

async function test() {
    try {
        const result = await remark()
            .use(remarkWikiLink, {
                hrefTemplate: (permalink) => `wiki:${permalink}`,
                pageResolver: (name) => [name],
                aliasDivider: '|'
            })
            .process(markdown);

        console.log('Input:', markdown);
        console.log('Output:', result.toString());
    } catch (e) {
        console.error('Error:', e);
    }
}

test();
