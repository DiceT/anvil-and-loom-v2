import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { remarkWikiLinks } from '../../core/markdown/remarkWikiLinks';
import { WikiLink } from './WikiLink';
import { useSettingsStore } from '../../stores/useSettingsStore';

interface MarkdownViewerProps {
    markdown: string;

}

export function MarkdownViewer({ markdown }: MarkdownViewerProps) {
    const { settings } = useSettingsStore();
    const { editorWidth } = settings.editor;

    return (
        <div className="p-8 bg-slate-900 h-full overflow-auto">
            <div
                className={`
                    prose prose-slate prose-invert 
                    ${editorWidth === 'readable' ? 'max-w-[65ch] mx-auto' : 'max-w-none'}
                `}
                style={{ color: '#eeeeff' }}
            >
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
