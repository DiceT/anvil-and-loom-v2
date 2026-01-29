
const THREAD_DIRECTIVE_REGEX = /::: thread (\w+)(?: id:(\S+))?(?: timestamp:([^\r\n]+))?(?:\r?\n)([\s\S]*?)(?:\r?\n):::/g;

function preprocessThreadsForEditor(markdown) {
    // Reset regex state
    THREAD_DIRECTIVE_REGEX.lastIndex = 0;

    return markdown.replace(
        THREAD_DIRECTIVE_REGEX,
        (match, type, id = '', timestamp = '', content) => {
            console.log('MATCH FOUND!');
            console.log('Type:', type);
            console.log('ID:', id);
            const trimmedContent = content.trim();
            const safeId = id || '';
            const safeTimestamp = timestamp ? timestamp.trim() : '';

            return `<div class="thread-container thread-${type}" data-thread-id="${safeId}" data-timestamp="${safeTimestamp}" data-thread-container="true">

${trimmedContent}

</div>
<!-- /thread -->`;
        }
    );
}

// Emulate output from threadMarkdownGenerator.ts
const id = "1769701071764-duf627xbr";
const timestamp = "10:37 AM";
const type = "dice";
const header = "Dice: d20";
const meta = "Expression: d20 Rolls: [14]";
const result = "Total: 14";

const directive = `::: thread ${type} id:${id} timestamp:${timestamp}`;
const body = `#### ${header}\n\n> ${meta}\n\n**${result}**`;
const markdown = `\n${directive}\n${body}\n:::\n`;

console.log("--- INPUT MARKDOWN ---");
console.log(JSON.stringify(markdown));
console.log("----------------------");

const output = preprocessThreadsForEditor(markdown);

console.log("--- OUTPUT HTML ---");
console.log(output);
console.log("-------------------");

if (output === markdown) {
    console.log("FAIL: Regex did not match.");
} else {
    console.log("SUCCESS: Regex matched.");
}
