import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Root, Text, Html, PhrasingContent } from 'mdast';

const TAG_REGEX = /#([a-zA-Z0-9][a-zA-Z0-9_-]*)/g;
const AUTHOR_REGEX = /@([a-zA-Z0-9][a-zA-Z0-9_-]*)/g;

export const remarkBadges: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, 'text', (node: Text, index, parent) => {
      if (!parent || index === null || index === undefined) return;

      const text = node.value;
      const matches: Array<{ index: number; length: number; type: 'tag' | 'author'; value: string }> = [];

      let match;
      const tagRegex = new RegExp(TAG_REGEX);
      while ((match = tagRegex.exec(text)) !== null) {
        matches.push({
          index: match.index,
          length: match[0].length,
          type: 'tag',
          value: match[1],
        });
      }

      const authorRegex = new RegExp(AUTHOR_REGEX);
      while ((match = authorRegex.exec(text)) !== null) {
        matches.push({
          index: match.index,
          length: match[0].length,
          type: 'author',
          value: match[1],
        });
      }

      if (matches.length === 0) return;

      matches.sort((a, b) => a.index - b.index);

      const newNodes: PhrasingContent[] = [];
      let lastIndex = 0;

      matches.forEach((match) => {
        if (match.index > lastIndex) {
          newNodes.push({
            type: 'text',
            value: text.substring(lastIndex, match.index),
          });
        }

        const htmlNode: Html = {
          type: 'html',
          value: `<badge data-badge-type="${match.type}" data-badge-value="${match.value}"></badge>`,
        };
        newNodes.push(htmlNode);

        lastIndex = match.index + match.length;
      });

      if (lastIndex < text.length) {
        newNodes.push({
          type: 'text',
          value: text.substring(lastIndex),
        });
      }

      parent.children.splice(index, 1, ...newNodes);
    });
  };
};
