import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Root, Text, Link } from 'mdast';

/**
 * Custom remark plugin to parse [[wikilink]] syntax
 */
export function remarkWikiLinks() {
  return (tree: any) => {


    visit(tree, 'text', (node: any, index: any, parent: any) => {
      if (!parent || typeof index !== 'number') return;

      const text = node.value;
      const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;

      if (!wikiLinkRegex.test(text)) return;



      // Reset regex
      wikiLinkRegex.lastIndex = 0;

      const newNodes: any[] = [];
      let lastIndex = 0;
      let match;

      while ((match = wikiLinkRegex.exec(text)) !== null) {
        const [fullMatch, linkText] = match;
        const startIndex = match.index;



        // Add text before the link
        if (startIndex > lastIndex) {
          newNodes.push({
            type: 'text',
            value: text.slice(lastIndex, startIndex),
          });
        }

        // Parse link text (support [[Target|Display]] syntax)
        const parts = linkText.split('|');
        const target = parts[0].trim();
        const display = parts[1]?.trim() || target;

        // Add the link node
        const linkNode = {
          type: 'link',
          url: `wiki:${target}`,
          data: {
            hProperties: {
              href: `wiki:${target}`
            }
          },
          children: [
            {
              type: 'text',
              value: display,
            },
          ],
        };


        newNodes.push(linkNode);

        lastIndex = startIndex + fullMatch.length;
      }

      // Add remaining text
      if (lastIndex < text.length) {
        newNodes.push({
          type: 'text',
          value: text.slice(lastIndex),
        });
      }

      // Replace the text node with the new nodes
      if (newNodes.length > 0) {

        parent.children.splice(index, 1, ...newNodes);
      }
    });
  };
};
