
import React from 'react';
import { useStitchStore } from '../../stores/useStitchStore';
import { useEditorStore } from '../../stores/useEditorStore';
import { useTapestryStore } from '../../stores/useTapestryStore';
import { useTabStore } from '../../stores/useTabStore';
import { useDialogStore } from '../../stores/useDialogStore';

interface WikiLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    href?: string;
}

export function WikiLink({ href, children, ...props }: WikiLinkProps) {
    const { resolvePanel } = useStitchStore();
    const { openEntry } = useEditorStore();
    const { createEntry } = useTapestryStore();
    const { openTab } = useTabStore();

    // Check if this is a wiki link
    if (!href?.startsWith('wiki:')) {
        return <a href={href} {...props}>{children}</a>;
    }

    const targetTitle = href.replace('wiki:', '');
    const resolved = resolvePanel(targetTitle);
    const isResolved = !!resolved;

    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        console.log('[WikiLink] Clicked:', { targetTitle, isResolved, resolved });

        if (isResolved) {
            // Open existing panel
            console.log('[WikiLink] Opening existing panel:', resolved.path);
            try {
                await openEntry(resolved.path);
                // Also open/activate tab
                openTab({
                    id: resolved.id,
                    type: 'entry',
                    title: targetTitle, // Use targetTitle since resolved doesn't have title
                    data: { path: resolved.path }
                });
            } catch (error) {
                console.error('[WikiLink] Failed to open entry:', error);
            }
        } else {
            // Create new panel
            console.log('[WikiLink] Prompting to create new panel');

            // Use custom dialog instead of native confirm
            const confirmed = await useDialogStore.getState().confirm({
                title: 'Create New Panel',
                message: `Create new panel "${targetTitle}"?`,
                confirmText: 'Create',
            });

            if (confirmed) {
                try {
                    console.log('[WikiLink] Creating panel:', targetTitle);
                    const { path, id } = await createEntry(targetTitle);
                    console.log('[WikiLink] Panel created, opening:', path);
                    await openEntry(path);
                    // Also open/activate tab
                    openTab({
                        id: id,
                        type: 'entry',
                        title: targetTitle,
                        data: { path }
                    });
                } catch (error) {
                    console.error('[WikiLink] Failed to create panel:', error);
                }
            }
        }
    };

    return (
        <a
            href={href}
            onClick={handleClick}
            className="wiki-link cursor-pointer transition-all duration-200"
            data-resolved={isResolved}
            title={isResolved ? `Open "${targetTitle}"` : `Create "${targetTitle}"`}
            {...props}
        >
            {children}
        </a>
    );
}
