/**
 * AI Client - Generic service for calling AI endpoints
 */

export interface AiMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface AiResponse {
    content: string;
}

/**
 * Call an AI endpoint with the given messages
 */
export async function callAi(
    uri: string,
    apiKey: string,
    model: string,
    messages: AiMessage[]
): Promise<AiResponse> {
    try {
        const response = await fetch(uri, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model,
                messages,
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`AI request failed (${response.status}): ${errorText}`);
        }

        const data = await response.json();

        // Handle OpenAI-style response
        if (data.choices && data.choices[0] && data.choices[0].message) {
            return {
                content: data.choices[0].message.content,
            };
        }

        throw new Error('Unexpected AI response format');
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Unknown error during AI request');
    }
}

/**
 * Test the AI connection with a minimal request
 */
export async function testAiConnection(
    uri: string,
    apiKey: string,
    model: string
): Promise<void> {
    const messages: AiMessage[] = [
        {
            role: 'user',
            content: 'Reply with "OK" if you can read this.',
        },
    ];

    await callAi(uri, apiKey, model, messages);
}
