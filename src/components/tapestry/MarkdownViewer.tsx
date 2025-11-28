import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownViewerProps {
    markdown: string;
}

export function MarkdownViewer({ markdown }: MarkdownViewerProps) {
    return (
        <div className="p-8 bg-slate-900">
            <div className="prose prose-slate prose-invert max-w-none">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        // Phase 5: Custom renderer for :::result-card blocks will go here
                    }}
                >
                    {markdown}
                </ReactMarkdown>
            </div>
        </div>
    );
}
