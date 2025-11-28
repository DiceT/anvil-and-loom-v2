import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ResultCard } from './ResultCard';
import { ResultCardModel } from '../../types/tapestry';

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
                        pre(props) {
                            const { children } = props;

                            // Check if this pre contains a code element with result-card language
                            if (children && typeof children === 'object' && 'props' in children) {
                                const codeProps = (children as any).props;
                                const className = codeProps?.className || '';
                                const match = /language-([\w-]+)/.exec(className);
                                const lang = match ? match[1] : '';

                                console.log('[MarkdownViewer] Pre block detected:', { lang, className });

                                if (lang === 'result-card') {
                                    try {
                                        const jsonString = String(codeProps.children).replace(/\n$/, '');
                                        console.log('[MarkdownViewer] Parsing result card JSON');
                                        const card = JSON.parse(jsonString) as ResultCardModel;
                                        console.log('[MarkdownViewer] Successfully parsed result card:', card.type);
                                        return <ResultCard card={card} />;
                                    } catch (e) {
                                        console.error('[MarkdownViewer] Failed to parse result card:', e);
                                        return (
                                            <div className="p-4 text-red-500 bg-red-900/20 rounded border border-red-900/50">
                                                Invalid Result Card Data: {String(e)}
                                            </div>
                                        );
                                    }
                                }
                            }

                            // Default pre rendering
                            return <pre {...props}>{children}</pre>;
                        }
                    }}
                >
                    {markdown}
                </ReactMarkdown>
            </div>
        </div>
    );
}
