
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

    // Check if this is a macro link
    if (href?.startsWith('macro:')) {
        const macroId = href.replace('macro:', '');

        return (
            <a
                href={href}
                onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('[WikiLink] Executing macro:', macroId);

                    // We need to find the macro slot to execute it
                    // Since specific macro execution might depend on context, 
                    // we'll try to find it in the global store.
                    const { slots } = (await import('../../stores/useMacroStore')).useMacroStore.getState();
                    const slot = slots.find(s => s.id === macroId);

                    if (slot) {
                        const { executeMacro } = await import('../../lib/macro/executeMacro');
                        await executeMacro(slot);
                    } else {
                        console.warn('[WikiLink] Macro not found:', macroId);
                        // Fallback: If it's a table ID or something else masquerading as a macro?
                        // For now, notify user
                    }
                }}
                className="cursor-pointer text-ruby hover:text-ruby-light hover:underline bg-ruby/10 px-1 rounded"
                title="Run Macro"
                {...props}
            >
                {children}
                <span className="ml-1 opacity-75">▶</span>
            </a>
        );
    }

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
                    title: targetTitle,
                    data: { path: resolved.path }
                });
            } catch (error) {
                console.error('[WikiLink] Failed to open entry:', error);
            }
        } else {
            // Check Environment Store for Aspect/Domain
            // We lazily import or use store directly to avoid circular deps if any
            const envStore = (await import('../../stores/useEnvironmentStore')).useEnvironmentStore.getState();
            const toolStore = (await import('../../stores/useToolStore')).useToolStore.getState();

            // Check if there is any table with category "Aspect - Title" or "Domain - Title"
            // This implies the Aspect/Domain exists
            const aspectName = targetTitle; // e.g. "Fire"

            // We check if "Aspect - Fire" or "Domain - Fire" exists as a category in any table
            // OR if we strictly look for folders. 
            // The EnvironmentFileTree derives folders from table categories.

            const hasAspect = envStore.tables.some(t => t.category === `Aspect - ${aspectName}`);
            const hasDomain = envStore.tables.some(t => t.category === `Domain - ${aspectName}`);

            if (hasAspect) {
                toolStore.setRightPaneMode('environment');
                envStore.expandFolder(`aspect-${aspectName}`);
                return;
            }

            if (hasDomain) {
                toolStore.setRightPaneMode('environment');
                envStore.expandFolder(`domain-${aspectName}`);
                return;
            }

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
