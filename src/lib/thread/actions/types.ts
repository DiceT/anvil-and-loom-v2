import { Thread } from '../../../types/thread';
import { ThreadAnalysis } from '../threadAnalyzer';
import { LucideIcon } from 'lucide-react';

/** Application state needed for action predicates and execution */
export interface ActionContext {
    activeSessionId?: string;
    activePanelId?: string;
    aiConfigured: boolean;
    // Add more as needed
}

/** A discrete action that can be performed on a Thread */
export interface ThreadAction {
    /** Unique identifier */
    id: string;

    /** Display label */
    label: string;

    /** Lucide icon component */
    icon: LucideIcon;

    /** Optional keyboard shortcut hint */
    shortcut?: string;

    /** Tooltip description */
    description: string;

    /** 
     * Predicate: Should this action be available?
     * Return false to hide, return true to show
     */
    isAvailable: (thread: Thread, analysis: ThreadAnalysis, context: ActionContext) => boolean;

    /**
     * Predicate: Is this action currently enabled?
     * Return false to show disabled, return true to enable
     */
    isEnabled: (thread: Thread, analysis: ThreadAnalysis, context: ActionContext) => boolean;

    /**
     * Execute the action
     * Must return the Thread(s) created as a result
     */
    execute: (thread: Thread, context: ActionContext) => Promise<Thread[]>;

    /** Optional: Confirmation required before execution */
    requiresConfirmation?: boolean;

    /** Optional: Confirmation message */
    confirmationMessage?: string;
}

/** Category for grouping actions in UI */
export type ActionCategory =
    | 'interpret'    // AI-related
    | 'defer'        // Clocks and Tracks
    | 'link'         // Panel linking
    | 'roll'         // Dice/Table rolls
    | 'manage';      // Edit, delete, etc.
