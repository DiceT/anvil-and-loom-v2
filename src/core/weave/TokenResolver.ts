/**
 * TokenResolver - Handles recursive resolution of [[ TAG ]] tokens.
 * 
 * Tokens can appear in text or object results.
 * - Max depth: 10
 * - Cycle detection enabled
 * - Fallback: [UNRESOLVED:TAG]
 */

import type { ObjectResult, RollResult, RollByTagCallback, ErrorCallback, ResolverContext } from '../../types/weave';

/** Token syntax: [[ TAG_NAME ]] */
const TOKEN_REGEX = /\[\[\s*([a-zA-Z0-9_\-\s]+?)\s*\]\]/g;

/** Maximum recursion depth for token resolution */
const MAX_DEPTH = 10;


export class TokenResolver {
    private onError?: ErrorCallback;

    constructor(onError?: ErrorCallback) {
        this.onError = onError;
    }

    /**
     * Resolves all tokens in a result value.
     * Returns: fully resolved value and merged context info.
     */
    resolve(
        value: string | ObjectResult,
        rollByTag: RollByTagCallback,
        context?: Partial<ResolverContext>
    ): { resolved: string | ObjectResult; context: ResolverContext } {
        const ctx: ResolverContext = {
            depth: context?.depth ?? 0,
            visitedTags: context?.visitedTags ?? new Set(),
            tableChain: context?.tableChain ?? [],
            rolls: context?.rolls ?? [],
            warnings: context?.warnings ?? [],
        };

        if (typeof value === 'string') {
            const resolved = this.resolveString(value, rollByTag, ctx);
            return { resolved, context: ctx };
        } else {
            const resolved = this.resolveObject(value, rollByTag, ctx);
            return { resolved, context: ctx };
        }
    }

    private resolveString(
        text: string,
        rollByTag: RollByTagCallback,
        ctx: ResolverContext
    ): string {
        return text.replace(TOKEN_REGEX, (_match, tag: string) => {
            const cleanTag = tag.trim();
            return this.resolveToken(cleanTag, rollByTag, ctx);
        });
    }

    private resolveObject(
        obj: ObjectResult,
        rollByTag: RollByTagCallback,
        ctx: ResolverContext
    ): ObjectResult {
        const resolved: ObjectResult = {};

        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                resolved[key] = this.resolveString(value, rollByTag, ctx);
            } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                resolved[key] = this.resolveObject(value as ObjectResult, rollByTag, ctx);
            } else {
                resolved[key] = value;
            }
        }

        return resolved;
    }

    private resolveToken(
        tag: string,
        rollByTag: RollByTagCallback,
        ctx: ResolverContext
    ): string {
        // Depth check
        if (ctx.depth >= MAX_DEPTH) {
            const msg = `Max resolution depth (${MAX_DEPTH}) exceeded for tag "${tag}"`;
            ctx.warnings.push(msg);
            this.onError?.(msg, { tag, depth: ctx.depth });
            return `[UNRESOLVED:${tag}]`;
        }

        // Cycle detection
        if (ctx.visitedTags.has(tag)) {
            const msg = `Cycle detected: tag "${tag}" already in resolution chain`;
            ctx.warnings.push(msg);
            this.onError?.(msg, { tag, chain: Array.from(ctx.visitedTags) });
            return `[CYCLE:${tag}]`;
        }

        // Roll on referenced table
        const result = rollByTag(tag);
        if (!result) {
            const msg = `No table found for tag "${tag}"`;
            ctx.warnings.push(msg);
            this.onError?.(msg, { tag });
            return `[UNRESOLVED:${tag}]`;
        }

        // Update context - preserve initial rolls by only adding new rolls
        if (result.rolls.length > 0) {
            ctx.rolls.push(...result.rolls);
        }
        ctx.visitedTags.add(tag);
        ctx.tableChain.push(...result.tableChain);
        ctx.warnings.push(...result.warnings);

        // Recursively resolve the result
        const childCtx: ResolverContext = {
            depth: ctx.depth + 1,
            visitedTags: new Set(ctx.visitedTags),
            tableChain: ctx.tableChain,
            rolls: ctx.rolls,
            warnings: ctx.warnings,
        };

        if (typeof result.result === 'string') {
            return this.resolveString(result.result, rollByTag, childCtx);
        } else if (typeof result.result === 'object' && result.result !== null && !('tag' in result.result)) {
            // Object result - stringify it
            const resolved = this.resolveObject(result.result, rollByTag, childCtx);
            return JSON.stringify(resolved);
        } else {
            // TableReference - return as tag name
            return `[${(result.result as any).tag}]`;
        }
    }
}
