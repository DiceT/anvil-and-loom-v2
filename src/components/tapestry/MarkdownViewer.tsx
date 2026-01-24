import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { remarkWikiLinks } from '../../core/markdown/remarkWikiLinks';
import { ThreadCard } from '../thread/ThreadCard';
import { panelThreadToThread } from '../../lib/thread/adapters';
import { analyzeThread } from '../../lib/thread/threadAnalyzer';
import { getAvailableActions } from '../../lib/thread/actions/registry';
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

                            // Check if this pre contains a code element with thread-card or result-card language
                            if (children && typeof children === 'object' && 'props' in children) {
                                const codeProps = (children as any).props;
                                const className = codeProps?.className || '';
                                const match = /language-([\w-]+)/.exec(className);
                                const lang = match ? match[1] : '';

                                if (lang === 'result-card' || lang === 'thread-card') {
                                    try {
                                        const jsonString = String(codeProps.children).replace(/\n$/, '');
                                        const card = JSON.parse(jsonString) as ThreadModel;

                                        // Adapt to new Thread model
                                        const thread = panelThreadToThread(card);
                                        const analysis = analyzeThread(thread);
                                        // Stub context for viewer
                                        const actions = getAvailableActions(thread, analysis, {
                                            activeSessionId: 'current',
                                            activePanelId: 'current',
                                            aiConfigured: true
                                        });

                                        return (
                                            <ThreadCard
                                                thread={thread}
                                                mode="embedded"
                                                defaultExpanded={false}
                                                actions={actions}
                                                onAction={async (action, thread) => {
                                                    try {
                                                        // Execute generic action
                                                        const context = {
                                                            activeSessionId: 'current',
                                                            activePanelId: 'current',
                                                            aiConfigured: true
                                                        };

                                                        const newThreads = await action.execute(thread, context);

                                                        if (newThreads && newThreads.length > 0) {
                                                            // Add to store/panel
                                                            const { useThreadsStore } = await import('../../stores/useThreadsStore');
                                                            newThreads.forEach(t => useThreadsStore.getState().addThread(t));

                                                            // Auto-Add to Active Entry
                                                            const { useEditorStore } = await import('../../stores/useEditorStore');
                                                            const { activeEntryId, updateEntryContent, openEntries, saveEntry } = useEditorStore.getState();

                                                            if (activeEntryId) {
                                                                const entry = openEntries.find(e => e.id === activeEntryId);
                                                                if (entry) {
                                                                    const { appendThread, createThread: createPanelThread } = await import('../../lib/tapestry/threadEngine');

                                                                    let content = entry.content;
                                                                    for (const newThread of newThreads) {
                                                                        let type: any = 'dice';
                                                                        if (newThread.type === 'ai_text') type = 'ai';
                                                                        if (newThread.type === 'oracle') type = 'oracle';
                                                                        if (newThread.source === 'clock') type = 'system';
                                                                        if (newThread.source === 'track') type = 'system';

                                                                        const panelThread = createPanelThread(
                                                                            type,
                                                                            newThread.source,
                                                                            newThread.summary,
                                                                            {
                                                                                ...newThread.meta,
                                                                                clock: newThread.clock,
                                                                                track: newThread.track
                                                                            },
                                                                            newThread.meta?.expression,
                                                                            newThread.content,
                                                                            newThread.timestamp
                                                                        );

                                                                        content = appendThread(content, panelThread);
                                                                    }

                                                                    updateEntryContent(entry.id, content);
                                                                    saveEntry(entry.id);
                                                                }
                                                            }
                                                        }

                                                        // Also allow external interpret hook callback if needed
                                                        if (action.id === 'interpret' && onInterpretThread) {
                                                            onInterpretThread(card);
                                                        }
                                                    } catch (e) {
                                                        console.error('Action failed in Viewer:', e);
                                                    }
                                                }}
                                                onUpdate={async (updates) => {
                                                    // Sync interactivity in Viewer (Read Mode)
                                                    console.log('[MarkdownViewer] onUpdate', updates);
                                                    const { useEditorStore } = await import('../../stores/useEditorStore');
                                                    const { activeEntryId, updateEntryContent, openEntries, saveEntry } = useEditorStore.getState();

                                                    // 1. Update Document
                                                    if (activeEntryId) {
                                                        const entry = openEntries.find(e => e.id === activeEntryId);
                                                        if (entry) {
                                                            const { updateThreadInContent } = await import('../../lib/tapestry/contentUpdates');
                                                            const newContent = updateThreadInContent(entry.content, thread.id, updates);
                                                            if (newContent) {
                                                                updateEntryContent(entry.id, newContent);
                                                                saveEntry(entry.id);
                                                            }
                                                        }
                                                    }

                                                    // 2. Sync to History Store
                                                    const { useThreadsStore } = await import('../../stores/useThreadsStore');
                                                    useThreadsStore.getState().updateThread(thread.id, updates);
                                                }}
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
