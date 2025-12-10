import { useState, useEffect, useRef } from 'react';
import { Link2, Binoculars, Plus, X, ChevronDown } from 'lucide-react';
import { useEditorStore } from '../../stores/useEditorStore';
import { useWeaveStore } from '../../stores/useWeaveStore';
import { useTableStore } from '../../stores/useTableStore';
import { useToolStore } from '../../stores/useToolStore';
import { useTabStore } from '../../stores/useTabStore';
import { EntryDoc, PanelThreadModel } from '../../types/tapestry';
import { runFirstLook } from '../../core/tapestry/firstLook';

interface PlaceHeaderProps {
    panel: EntryDoc;
}

export function PlaceHeader({ panel }: PlaceHeaderProps) {
    const { setWeaveRef, addAspect, removeAspect, addDomain, removeDomain } = useEditorStore();
    const { registry: weaveRegistry, loadWeaves } = useWeaveStore();
    const { registry: tableRegistry, loadTables } = useTableStore();
    const { setRightPaneMode, setRequestExpandPack } = useToolStore();
    const { openTab } = useTabStore();

    const [isWeaveOpen, setIsWeaveOpen] = useState(false);
    const [isAspectOpen, setIsAspectOpen] = useState(false);
    const [isDomainOpen, setIsDomainOpen] = useState(false);

    const weaveDropdownRef = useRef<HTMLDivElement>(null);
    const aspectDropdownRef = useRef<HTMLDivElement>(null);
    const domainDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!weaveRegistry) loadWeaves();
        if (!tableRegistry) loadTables();
    }, []);

    // Close dropdowns on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (weaveDropdownRef.current && !weaveDropdownRef.current.contains(event.target as Node)) {
                setIsWeaveOpen(false);
            }
            if (aspectDropdownRef.current && !aspectDropdownRef.current.contains(event.target as Node)) {
                setIsAspectOpen(false);
            }
            if (domainDropdownRef.current && !domainDropdownRef.current.contains(event.target as Node)) {
                setIsDomainOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const weaves = weaveRegistry ? Array.from(weaveRegistry.weaves.values()) : [];
    const aspects = tableRegistry ? Array.from(tableRegistry.aspectPacks.values()) : [];
    const domains = tableRegistry ? Array.from(tableRegistry.domainPacks.values()) : [];

    const selectedWeave = panel.frontmatter.weaveRef
        ? weaveRegistry?.weaves.get(panel.frontmatter.weaveRef)
        : null;

    const selectedAspects = (panel.frontmatter.aspects || [])
        .map(id => tableRegistry?.aspectPacks.get(id))
        .filter(Boolean);

    const selectedDomains = (panel.frontmatter.domains || [])
        .map(id => tableRegistry?.domainPacks.get(id))
        .filter(Boolean);

    const handleOpenWeave = () => {
        if (selectedWeave) {
            setRightPaneMode('weave');
            useWeaveStore.getState().setActiveWeave(selectedWeave.id);
            openTab({
                id: selectedWeave.id,
                type: 'weave',
                title: selectedWeave.name
            });
        }
    };

    const handleOpenPack = (packId: string, _type: 'aspect' | 'domain') => {
        setRightPaneMode('environments');
        setRequestExpandPack(packId);
    };

    const handleFirstLook = async () => {
        if (!panel.frontmatter.weaveRef || !panel.frontmatter.aspects?.length || !panel.frontmatter.domains?.length) {
            alert('Please select a Weave, at least one Aspect, and at least one Domain.');
            return;
        }

        if (!weaveRegistry || !tableRegistry) return;

        try {
            const result = await runFirstLook(
                panel.frontmatter.weaveRef,
                panel.frontmatter.aspects,
                panel.frontmatter.domains,
                panel.title, // Pass the place name
                tableRegistry,
                weaveRegistry
            );

            // Create Thread Model
            const thread: PanelThreadModel = {
                id: result.threadId,
                type: 'weave',
                source: result.source,  // "First Look at [Place Name]"
                summary: result.summary, // The actual results
                content: result.content, // Metadata
                payload: {},
                timestamp: new Date().toISOString()
            };

            // Append to content
            const newContent = (panel.content || '') + `\n\n\`\`\`thread-card\n${JSON.stringify(thread, null, 2)}\n\`\`\`\n`;

            // Update content and set firstLookDone
            useEditorStore.getState().updateEntryContent(panel.id, newContent);
            useEditorStore.getState().setFirstLookDone(panel.id, true);

        } catch (err) {
            console.error('First Look failed:', err);
            alert('Failed to generate First Look: ' + String(err));
        }
    };

    const handleCreateWeave = async () => {
        const newWeave = useWeaveStore.getState().createWeave({
            name: panel.title,
            aspects: panel.frontmatter.aspects,
            domains: panel.frontmatter.domains
        });
        await useWeaveStore.getState().saveWeave(newWeave.id);

        // Link to Place
        setWeaveRef(panel.id, newWeave.id);

        // Auto-Open the new Weave
        setRightPaneMode('weave');
        useWeaveStore.getState().setActiveWeave(newWeave.id);
        openTab({
            id: newWeave.id,
            type: 'weave',
            title: newWeave.name
        });
    };

    return (
        <div className="px-6 py-2 border-b border-slate-800 bg-slate-900/30 flex flex-col gap-3">
            {/* Row 1: Weave & First Look */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {/* Weave Selector */}
                    <div className="flex items-center gap-2 relative" ref={weaveDropdownRef}>
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Weave</span>
                        <div className="flex items-center bg-slate-800 rounded border border-slate-700">
                            <button
                                onClick={() => setIsWeaveOpen(!isWeaveOpen)}
                                className="px-3 py-1 text-sm text-slate-300 hover:text-white flex items-center gap-2 min-w-[120px] justify-between"
                            >
                                <span className="truncate max-w-[150px]">
                                    {selectedWeave ? selectedWeave.name : 'Select Weave...'}
                                </span>
                                <ChevronDown className="w-3 h-3 text-slate-500" />
                            </button>

                            {selectedWeave && (
                                <div className="flex border-l border-slate-700">
                                    <button
                                        onClick={handleOpenWeave}
                                        className="p-1 hover:bg-slate-700 text-slate-400 hover:text-purple-400 transition-colors"
                                        title="Open Weave"
                                    >
                                        <Link2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}
                            {!selectedWeave && (
                                <div className="flex border-l border-slate-700">
                                    <button
                                        onClick={handleCreateWeave}
                                        className="p-1 hover:bg-slate-700 text-slate-400 hover:text-green-400 transition-colors"
                                        title="Create Weave from Place"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {isWeaveOpen && (
                            <div className="absolute top-full left-0 mt-1 w-64 bg-slate-800 border border-slate-700 rounded shadow-xl z-50 max-h-60 overflow-y-auto">
                                {weaves.length === 0 ? (
                                    <div className="p-2 text-xs text-slate-500 text-center">No weaves found</div>
                                ) : (
                                    weaves.map(weave => (
                                        <button
                                            key={weave.id}
                                            onClick={() => {
                                                setWeaveRef(panel.id, weave.id);

                                                // Sync aspects/domains from Weave Rows
                                                const weaveAspects = new Set<string>();
                                                const weaveDomains = new Set<string>();

                                                weave.rows.forEach(row => {
                                                    if (row.targetType === 'aspect' && row.targetId) {
                                                        weaveAspects.add(row.targetId);
                                                    }
                                                    if (row.targetType === 'domain' && row.targetId) {
                                                        weaveDomains.add(row.targetId);
                                                    }
                                                });

                                                if (weaveAspects.size > 0 || weaveDomains.size > 0) {
                                                    useEditorStore.getState().updateEntryFrontmatter(panel.id, {
                                                        ...panel.frontmatter,
                                                        weaveRef: weave.id,
                                                        aspects: Array.from(weaveAspects),
                                                        domains: Array.from(weaveDomains)
                                                    });
                                                }
                                                setIsWeaveOpen(false);
                                            }}
                                            className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                                        >
                                            {weave.name}
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* First Look Button */}
                {!panel.frontmatter.firstLookDone && (
                    <button
                        className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-sm font-medium transition-colors shadow-sm shadow-purple-900/20"
                        onClick={handleFirstLook}
                    >
                        <Binoculars className="w-4 h-4" />
                        <span>First Look</span>
                    </button>
                )}
            </div>

            {/* Row 2: Aspects & Domains */}
            <div className="flex flex-col gap-2">
                {/* Aspects */}
                <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1.5 w-16">Aspects</span>
                    <div className="flex-1 flex flex-wrap gap-2">
                        {selectedAspects.map(pack => (
                            <div
                                key={pack!.packId}
                                className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 group"
                            >
                                <button
                                    onClick={() => handleOpenPack(pack!.packId, 'aspect')}
                                    className="text-sm text-slate-300 hover:text-purple-400 transition-colors"
                                >
                                    {pack!.packName}
                                </button>
                                <button
                                    onClick={() => removeAspect(panel.id, pack!.packId)}
                                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-700 rounded text-slate-500 hover:text-red-400 transition-all"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}

                        <div className="relative" ref={aspectDropdownRef}>
                            <button
                                onClick={() => setIsAspectOpen(!isAspectOpen)}
                                className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-slate-300 border border-transparent hover:border-slate-700 transition-all"
                            >
                                <Plus className="w-4 h-4" />
                            </button>

                            {isAspectOpen && (
                                <div className="absolute top-full left-0 mt-1 w-48 bg-slate-800 border border-slate-700 rounded shadow-xl z-50 max-h-60 overflow-y-auto">
                                    {aspects.filter(p => !panel.frontmatter.aspects?.includes(p.packId)).map(pack => (
                                        <button
                                            key={pack.packId}
                                            onClick={() => {
                                                addAspect(panel.id, pack.packId);
                                                setIsAspectOpen(false);
                                            }}
                                            className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                                        >
                                            {pack.packName}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Domains */}
                <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1.5 w-16">Domains</span>
                    <div className="flex-1 flex flex-wrap gap-2">
                        {selectedDomains.map(pack => (
                            <div
                                key={pack!.packId}
                                className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 group"
                            >
                                <button
                                    onClick={() => handleOpenPack(pack!.packId, 'domain')}
                                    className="text-sm text-slate-300 hover:text-purple-400 transition-colors"
                                >
                                    {pack!.packName}
                                </button>
                                <button
                                    onClick={() => removeDomain(panel.id, pack!.packId)}
                                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-700 rounded text-slate-500 hover:text-red-400 transition-all"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}

                        <div className="relative" ref={domainDropdownRef}>
                            <button
                                onClick={() => setIsDomainOpen(!isDomainOpen)}
                                className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-slate-300 border border-transparent hover:border-slate-700 transition-all"
                            >
                                <Plus className="w-4 h-4" />
                            </button>

                            {isDomainOpen && (
                                <div className="absolute top-full left-0 mt-1 w-48 bg-slate-800 border border-slate-700 rounded shadow-xl z-50 max-h-60 overflow-y-auto">
                                    {domains.filter(p => !panel.frontmatter.domains?.includes(p.packId)).map(pack => (
                                        <button
                                            key={pack.packId}
                                            onClick={() => {
                                                addDomain(panel.id, pack.packId);
                                                setIsDomainOpen(false);
                                            }}
                                            className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                                        >
                                            {pack.packName}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
