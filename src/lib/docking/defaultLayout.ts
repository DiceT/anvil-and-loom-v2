import type { LayoutData } from 'rc-dock';

export const defaultLayout: LayoutData = {
    dockbox: {
        mode: 'horizontal',
        children: [
            {
                size: 256,
                tabs: [
                    {
                        id: 'tapestry',
                        title: 'Tapestry',
                        closable: false,
                        content: 'placeholder',
                    },
                ],
            },
            {
                mode: 'vertical',
                children: [
                    {
                        tabs: [
                            {
                                id: 'editor',
                                title: 'Editor',
                                closable: false,
                                content: 'placeholder',
                            },
                        ],
                    },
                ],
            },
            {
                size: 320,
                tabs: [
                    {
                        id: 'tools',
                        title: 'Tools',
                        closable: false,
                        content: 'placeholder',
                    },
                ],
            },
        ],
    },
};
