import { rollOnTable } from '../tables/tableEngine';
import { resolveMacro } from '../tables/macroResolver';
import { rollWeave } from '../weave/weaveEngine';
import { TableRegistry } from '../tables/types';
import { WeaveRegistry } from '../weave/weaveTypes';
import { rollDie } from '../dice/diceEngine';
import { v4 as uuidv4 } from 'uuid';

interface FirstLookResult {
    threadId: string;
    source: string;
    summary: string;
    content: string;
}

interface AtmosphereDiscoveryRoll {
    weaveRoll: number;
    tableRoll: number;
    packName: string;
    result: string;
}

export function runFirstLook(
    weaveId: string,
    aspectIds: string[],
    domainIds: string[],
    placeName: string,
    tableRegistry: TableRegistry,
    weaveRegistry: WeaveRegistry
): FirstLookResult {
    const weave = weaveRegistry.weaves.get(weaveId);
    if (!weave) throw new Error('Weave not found');

    // 1. Pick Domain and Aspect
    const domainId = domainIds[Math.floor(Math.random() * domainIds.length)];
    const aspectId = aspectIds[Math.floor(Math.random() * aspectIds.length)];

    const domainPack = tableRegistry.domainPacks.get(domainId);
    const aspectPack = tableRegistry.aspectPacks.get(aspectId);

    if (!domainPack) throw new Error('Domain pack not found');
    if (!aspectPack) throw new Error('Aspect pack not found');

    // 2. Roll Location (Domain index 2)
    const locationTable = domainPack.tables[2];
    const locationRoll = rollOnTable(locationTable);
    let locationResult = locationRoll.result;

    if (locationRoll.isMacro) {
        const macro = resolveMacro(tableRegistry, locationRoll, locationTable.id);
        if (macro) locationResult = formatMacroResult(macro);
    }

    // 3. Roll Manifestation (Aspect index 2)
    const manifestationTable = aspectPack.tables[2];
    const manifestationRoll = rollOnTable(manifestationTable);
    let manifestationResult = manifestationRoll.result;

    if (manifestationRoll.isMacro) {
        const macro = resolveMacro(tableRegistry, manifestationRoll, manifestationTable.id);
        if (macro) manifestationResult = formatMacroResult(macro);
    }

    // 4. Roll Atmosphere (75% chance of 1, 25% chance of 2)
    const atmosphereCount = rollDie(4) <= 3 ? 1 : 2;
    const atmosphereRolls: AtmosphereDiscoveryRoll[] = [];
    for (let i = 0; i < atmosphereCount; i++) {
        const { roll: weaveRoll, row } = rollWeave(weave);
        const atmRoll = resolveWeaveRowDetailed(row, tableRegistry, 'atmosphere', weaveRoll);
        atmosphereRolls.push(atmRoll);
    }

    // 5. Roll Discovery (75% chance of 1, 25% chance of 2)
    const discoveryCount = rollDie(4) <= 3 ? 1 : 2;
    const discoveryRolls: AtmosphereDiscoveryRoll[] = [];
    for (let i = 0; i < discoveryCount; i++) {
        const { roll: weaveRoll, row } = rollWeave(weave);
        const discRoll = resolveWeaveRowDetailed(row, tableRegistry, 'discovery', weaveRoll);
        discoveryRolls.push(discRoll);
    }

    // 6. Format Output
    const threadId = uuidv4();

    // source = header (what this is about)
    const source = `First Look at ${placeName}`;

    // summary = result (the actual generated content, normal text size with line breaks)
    const summaryLines: string[] = [];
    summaryLines.push(`Location: ${locationResult}\n`);
    summaryLines.push(`Manifestation: ${manifestationResult}\n`);

    atmosphereRolls.forEach(roll => {
        summaryLines.push(`Atmosphere (${roll.packName}): ${roll.result}\n`);
    });

    discoveryRolls.forEach(roll => {
        summaryLines.push(`Discovery (${roll.packName}): ${roll.result}\n`);
    });

    const summary = summaryLines.join('').trim();

    // Get all aspect and domain names
    const allAspectNames = aspectIds
        .map(id => tableRegistry.aspectPacks.get(id)?.packName)
        .filter(Boolean)
        .join(', ');

    const allDomainNames = domainIds
        .map(id => tableRegistry.domainPacks.get(id)?.packName)
        .filter(Boolean)
        .join(', ');

    // content = metadata (roll details, collapsed by default)
    const contentLines: string[] = [];
    contentLines.push(`Weave: ${weave.name}`);
    contentLines.push(`Aspects: ${allAspectNames}`);
    contentLines.push(`Domains: ${allDomainNames}`);
    contentLines.push('');
    contentLines.push(`Location: ${locationRoll.roll} on ${domainPack.packName}`);
    contentLines.push(`Manifestation: ${manifestationRoll.roll} on ${aspectPack.packName}`);

    atmosphereRolls.forEach((roll, idx) => {
        const label = atmosphereRolls.length > 1 ? `Atmosphere ${idx + 1}` : 'Atmosphere';
        contentLines.push(`${label}: ${roll.weaveRoll} on Weave → ${roll.tableRoll} on ${roll.packName}`);
    });

    discoveryRolls.forEach((roll, idx) => {
        const label = discoveryRolls.length > 1 ? `Discovery ${idx + 1}` : 'Discovery';
        contentLines.push(`${label}: ${roll.weaveRoll} on Weave → ${roll.tableRoll} on ${roll.packName}`);
    });

    const content = contentLines.join('\n');

    return {
        threadId,
        source,
        summary,
        content
    };
}

function resolveWeaveRowDetailed(
    row: any,
    registry: TableRegistry,
    intent: 'atmosphere' | 'discovery',
    weaveRoll: number
): AtmosphereDiscoveryRoll {
    const packId = row.targetId;
    const type = row.targetType; // 'aspect' | 'domain'

    const pack = type === 'aspect'
        ? registry.aspectPacks.get(packId)
        : registry.domainPacks.get(packId);

    if (!pack) {
        return {
            weaveRoll,
            tableRoll: 0,
            packName: `Unknown ${type}`,
            result: `Unknown ${type} (${packId})`
        };
    }

    // Atmosphere is index 1 for both
    // Discovery is index 3 for both
    const tableIndex = intent === 'atmosphere' ? 1 : 3;
    const table = pack.tables[tableIndex];

    if (!table) {
        return {
            weaveRoll,
            tableRoll: 0,
            packName: pack.packName,
            result: `Missing table for ${intent} in ${pack.packName}`
        };
    }

    const roll = rollOnTable(table);
    let result = roll.result;

    if (roll.isMacro) {
        const macro = resolveMacro(registry, roll, table.id);
        if (macro) result = formatMacroResult(macro);
    }

    return {
        weaveRoll,
        tableRoll: roll.roll,
        packName: pack.packName,
        result
    };
}

function formatMacroResult(macro: any): string {
    if (macro.type === 'combo') {
        // Handle Action+Theme or Descriptor+Focus
        if (macro.rolls && macro.rolls.length >= 2) {
            return `${macro.rolls[0].result} + ${macro.rolls[1].result}`;
        }
        return 'Invalid Combo';
    }
    if (macro.type === 'repeat') {
        return `Roll Twice: ${macro.rolls.map((r: any) => r.result).join(', ')}`;
    }
    if (macro.type === 'reference') {
        // Handle Objectives
        return macro.rolls.map((r: any) => r.result).join(', ');
    }
    if (macro.type === 'placeholder') {
        return macro.message || '...';
    }
    return macro.result || '...';
}
