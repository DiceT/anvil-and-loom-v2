import { v4 as uuidv4 } from 'uuid';
import { ResultCardModel, ResultCardType } from '../../types/tapestry';

export const createResultCard = (
    type: ResultCardType,
    source: string,
    summary: string,
    payload: any,
    expression?: string,
    content?: string
): ResultCardModel => {
    return {
        id: uuidv4(),
        type,
        source,
        summary,
        content,
        payload,
        expression,
    };
};

export const serializeResultCard = (card: ResultCardModel): string => {
    const json = JSON.stringify(card, null, 2);
    return `\n\`\`\`result-card\n${json}\n\`\`\`\n`;
};

export const appendResultCard = (currentMarkdown: string, card: ResultCardModel): string => {
    const cardMarkdown = serializeResultCard(card);
    // Ensure we append with a newline if needed
    const separator = currentMarkdown.endsWith('\n') ? '' : '\n';
    return `${currentMarkdown}${separator}${cardMarkdown}`;
};
