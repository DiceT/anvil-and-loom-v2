import { Crepe } from '@milkdown/crepe';
import { EditorSettings } from '../../types/settings';

export const createEditor = (
    root: HTMLElement,
    settings: EditorSettings,
    initialMarkdown: string,
    onChange: (markdown: string) => void
) => {
    const crepe = new Crepe({
        root,
        defaultValue: initialMarkdown,
        features: {
            [Crepe.Feature.Placeholder]: true,
            [Crepe.Feature.Toolbar]: settings.showToolbar,
            [Crepe.Feature.BlockEdit]: settings.enableSlashMenu,
            [Crepe.Feature.Cursor]: settings.enableCursorEnhancements,
        },
    });

    // Note: Crepe doesn't support custom plugins via .use()
    // Result cards will need to be rendered in View mode only, or we need a different approach

    // Listener for auto-save
    crepe.on((listener) => {
        listener.markdownUpdated((_ctx, markdown, prevMarkdown) => {
            if (markdown !== prevMarkdown) {
                onChange(markdown);
            }
        });
    });

    return crepe;
};
