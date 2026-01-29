
import { remark } from 'remark';
import directive from 'remark-directive';

const processor = remark().use(directive);

const input = `
:::thread{type="dice" id="123" timestamp="10:00"}

Header

:::
`;

const result = processor.parse(input);

console.log(JSON.stringify(result, null, 2));

// Check if we have a containerDirective
const hasDirective = result.children.some(c => c.type === 'containerDirective');

if (hasDirective) {
    console.log("SUCCESS: Parsed as containerDirective");
} else {
    console.log("FAIL: Parsed as " + result.children[0].type);
}
