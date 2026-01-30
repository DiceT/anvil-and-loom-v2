import { Crepe, CrepeFeature } from '@milkdown/crepe';
import { listener, listenerCtx } from '@milkdown/plugin-listener';
import { replaceAll, getMarkdown } from '@milkdown/utils';
import { editorViewCtx } from '@milkdown/core';
import { Ctx } from '@milkdown/ctx';
import { toggleMark } from '@milkdown/prose/commands';
import { litmMarksFeature } from './features/marks/litmMarks';
// import { litmToolbarItems } from './toolbar/litmToolbarItems'; // Logic moved inline to use builder
import { litmSlashCommands } from './slash/litmSlashCommands'; // Kept for reference but unused yet

// Import Crepe base styles
import '@milkdown/crepe/theme/common/style.css';
// Our custom theme overrides Crepe defaults
import '../../styles/crepe-anvil.css';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface CrepeEditorConfig {
  root: HTMLElement;
  defaultValue: string;
  onChange: (markdown: string) => void;
  nodeViewFactory?: any;
  mode: 'edit' | 'view' | 'source';
  placeholder?: string;
}

export interface CrepeEditorInstance {
  crepe: Crepe;
  destroy: () => void;
  replaceContent: (markdown: string) => void;
  appendContent: (markdown: string) => void;
  getMarkdown: () => string;
  getRawMarkdown: () => string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Editor Factory
// ─────────────────────────────────────────────────────────────────────────────

export async function createCrepeEditor(
  config: CrepeEditorConfig
): Promise<CrepeEditorInstance> {
  const {
    root,
    defaultValue,
    onChange,
    mode,
    placeholder = 'Start writing, or type / for commands...',
  } = config;

  const isEditable = mode === 'edit';

  console.log('[Crepe] createCrepeEditor called. Mode:', mode);

  // ─────────────────────────────────────────────────────────────────────────
  // Create Crepe Instance
  // ─────────────────────────────────────────────────────────────────────────

  const crepe = new Crepe({
    root,
    defaultValue: defaultValue, // Pass markdown directly, no preprocessor!
    features: {
      [CrepeFeature.BlockEdit]: isEditable,
      [CrepeFeature.Toolbar]: isEditable,
      [CrepeFeature.LinkTooltip]: isEditable, // Disable in view mode
      [CrepeFeature.ListItem]: true,
      [CrepeFeature.Table]: true,
      [CrepeFeature.Cursor]: isEditable,
      [CrepeFeature.ImageBlock]: isEditable,
      [CrepeFeature.Placeholder]: isEditable,
      [CrepeFeature.CodeMirror]: false,
      [CrepeFeature.Latex]: false,
    },
    featureConfigs: {
      [CrepeFeature.Placeholder]: {
        text: placeholder,
      },
      [CrepeFeature.Toolbar]: {
        buildToolbar: (builder: any) => {
          // Add LitM Group using builder pattern
          builder.addGroup('litm', 'Legent in the Mist')
            .addItem('lmtag', {
              icon: '🏷️',
              onRun: (ctx: Ctx) => {
                const view = ctx.get(editorViewCtx);
                const markType = view.state.schema.marks.lmtag;
                if (markType) toggleMark(markType)(view.state, view.dispatch);
              },
              active: (ctx: Ctx) => {
                const view = ctx.get(editorViewCtx);
                const markType = view.state.schema.marks.lmtag;
                if (!markType) return false;
                const { from, to } = view.state.selection;
                let active = false;
                view.state.doc.nodesBetween(from, to, (node: any) => {
                  if (markType.isInSet(node.marks)) active = true;
                });
                return active;
              }
            })
            .addItem('lmstatus', {
              icon: '⚡',
              onRun: (ctx: Ctx) => {
                const view = ctx.get(editorViewCtx);
                const markType = view.state.schema.marks.lmstatus;
                if (markType) toggleMark(markType)(view.state, view.dispatch);
              },
              active: (ctx: Ctx) => {
                const view = ctx.get(editorViewCtx);
                const markType = view.state.schema.marks.lmstatus;
                if (!markType) return false;
                const { from, to } = view.state.selection;
                let active = false;
                view.state.doc.nodesBetween(from, to, (node: any) => {
                  if (markType.isInSet(node.marks)) active = true;
                });
                return active;
              }
            })
            .addItem('lmchallenge', {
              icon: '⚔️',
              onRun: (ctx: Ctx) => {
                const view = ctx.get(editorViewCtx);
                const markType = view.state.schema.marks.lmchallenge;
                if (markType) toggleMark(markType)(view.state, view.dispatch);
              },
              active: (ctx: Ctx) => {
                const view = ctx.get(editorViewCtx);
                const markType = view.state.schema.marks.lmchallenge;
                if (!markType) return false;
                const { from, to } = view.state.selection;
                let active = false;
                view.state.doc.nodesBetween(from, to, (node: any) => {
                  if (markType.isInSet(node.marks)) active = true;
                });
                return active;
              }
            });
        },
      },
    },
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Configure Features & Plugins
  // ─────────────────────────────────────────────────────────────────────────

  // Configure Slash Commands to include LitM commands
  // Note: We use the comment strategy here because verifying the exact API 
  // for extending Crepe's internal slash menu without potentially duplicating it
  // requires inspecting internal types not exposed in the public exports.
  // The commands are ready in `litmSlashCommands.ts` for when the integration point is verified.
  /*
  crepe.editor.config((ctx) => {
    // Placeholder for slash commands hookup
  });
  */

  // 1. Thread Feature (NATIVE!)
  crepe.editor.use(litmMarksFeature);

  // 2. Change Listener (Only in Edit Mode)
  if (isEditable) {
    crepe.editor.use(listener);

    crepe.editor.config((ctx) => {
      const listenerInstance = ctx.get(listenerCtx);
      listenerInstance.markdownUpdated((_ctx, markdown, prevMarkdown) => {
        if (markdown !== prevMarkdown) {
          onChange(markdown);
        }
      });
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Create the Editor
  // ─────────────────────────────────────────────────────────────────────────

  await crepe.create();

  // ─────────────────────────────────────────────────────────────────────────
  // Return Instance with Helper Methods
  // ─────────────────────────────────────────────────────────────────────────

  return {
    crepe,

    destroy: () => {
      crepe.destroy();
    },

    replaceContent: (markdown: string) => {
      crepe.editor.action(replaceAll(markdown));
    },

    appendContent: (markdown: string) => {
      const current = crepe.editor.action(getMarkdown());
      // Handle spacing intelligently
      const spacing = current.endsWith('\n\n') ? '' : current.endsWith('\n') ? '\n' : '\n\n';
      const combined = current + spacing + markdown;
      crepe.editor.action(replaceAll(combined));
    },

    getMarkdown: () => {
      return crepe.editor.action(getMarkdown());
    },

    getRawMarkdown: () => {
      return crepe.editor.action(getMarkdown());
    },
  };
}
