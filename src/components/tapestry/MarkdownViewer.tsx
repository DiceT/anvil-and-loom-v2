import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { remarkWikiLinks } from '../../core/markdown/remarkWikiLinks';
import { PanelThreadCard } from './PanelThreadCard';
import { ThreadModel } from '../../types/tapestry';
import { WikiLink } from './WikiLink';

interface MarkdownViewerProps {
    markdown: string;
    onInterpretThread?: (thread: ThreadModel) => Promise<void>;
}

export function MarkdownViewer({ markdown, onInterpretThread }: MarkdownViewerProps) {
    return (
        <div className="p-8 bg-slate-900">
            <div className="prose prose-slate prose-invert max-w-none" style={{ color: '#eeeeff' }}>
                <ReactMarkdown
                    remarkPlugins={[
                        remarkGfm,
                        remarkWikiLinks
                    ]}
                    components={{
                        a: (props) => {

                            return <WikiLink {...props} />;
                        },
                        // Style inline tags
                        text: ({ children }) => {
                            if (typeof children === 'string') {
                                // Split by tag pattern and wrap tags
                                const parts = children.split(/(#[a-zA-Z0-9_/-]+)/g);
                                return (
                                    <>
                                        {parts.map((part, index) => {
                                            if (part.match(/^#[a-zA-Z0-9_/-]+$/)) {
                                                return (
                                                    <span key={index} className="inline-tag">
                                                        {part}
                                                    </span>
                                                );
                                            }
                                            return <span key={index}>{part}</span>;
                                        })}
                                    </>
                                );
                            }
                            return <>{children}</>;
                        },
                        pre(props) {
                            const { children } = props;

                            // Check if this pre contains a code element with result-card language
                            if (children && typeof children === 'object' && 'props' in children) {
                                const codeProps = (children as any).props;
                                const className = codeProps?.className || '';
                                const match = /language-([\w-]+)/.exec(className);
                                const lang = match ? match[1] : '';

                                if (lang === 'result-card') {
                                    try {
                                        const jsonString = String(codeProps.children).replace(/\n$/, '');
                                        const card = JSON.parse(jsonString) as ThreadModel;
                                        return (
                                            <PanelThreadCard
                                                card={card}
                                                onInterpretWithAi={
                                                    onInterpretThread
                                                        ? () => onInterpretThread(card)
                                                        : undefined
                                                }
                                            />
                                        );
                                    } catch (e) {
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
                    urlTransform={(url) => {
                        if (url.startsWith('wiki:')) {
                            return url;
                        }
                        // Default behavior for other URLs
                        // ReactMarkdown's default is to allow http, https, mailto, tel
                        // We can just return the URL if it's safe, or implement basic checking
                        // For now, let's allow http/https/mailto/tel explicitly to match default
                        if (/^(https?|mailto|tel):/.test(url)) {
                            return url;
                        }
                        // If it's a relative path (no protocol), allow it
                        if (!/^[a-z]+:/i.test(url)) {
                            return url;
                        }
                        return url;
                    }}
                >
                    {markdown}
                </ReactMarkdown>
            </div>
        </div>
    );
}
