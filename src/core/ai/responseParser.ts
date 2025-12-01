/**
 * Parse AI response to extract Content and Result sections
 */

export interface ParsedInterpretation {
    content: string;
    result: string;
}

/**
 * Parse interpretation from AI response
 * Looks for "Content:" and "Result:" sections
 */
export function parseInterpretation(text: string): ParsedInterpretation {
    // Normalize line endings
    const normalized = text.replace(/\r\n/g, '\n');

    // Look for "Content:" section
    const contentMatch = normalized.match(/Content:\s*\n([\s\S]*?)(?=\n\s*Result:|$)/i);
    const contentText = contentMatch ? contentMatch[1].trim() : '';

    // Look for "Result:" section
    const resultMatch = normalized.match(/Result:\s*\n([\s\S]*?)$/i);
    const resultText = resultMatch ? resultMatch[1].trim() : '';

    // Fallback: if neither section found, treat entire response as Result
    if (!contentText && !resultText) {
        return {
            content: '',
            result: normalized.trim(),
        };
    }

    return {
        content: contentText,
        result: resultText,
    };
}
