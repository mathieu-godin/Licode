import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
    interface Palette {
        button: Palette['primary'];
    }

    interface PaletteOptions {
        button: PaletteOptions['primary'];
    }

    interface TypographyVariants {
        problemDescription: React.CSSProperties;
        problemHighlightedWord: React.CSSProperties;
        problemHighlightedItalicWord: React.CSSProperties;
        problemDescriptionItalic: React.CSSProperties;
        aboveEditor: React.CSSProperties;
    }

    interface TypographyVariantsOptions {
        problemDescription?: React.CSSProperties;
        problemHighlightedWord: React.CSSProperties;
        problemHighlightedItalicWord: React.CSSProperties;
        problemDescriptionItalic: React.CSSProperties;
        aboveEditor: React.CSSProperties;
    }
}

declare module '@mui/material/IconButton' {
    interface IconButtonPropsColorOverrides {
        button: true;
    }
}

declare module '@mui/material/Typography' {
    interface TypographyPropsVariantOverrides {
        problemDescription: true;
        problemHighlightedWord: true;
        problemHighlightedItalicWord: true;
        problemDescriptionItalic: true;
        aboveEditor: true;
    }
}

const editorTheme = createTheme({
    palette: {
        primary: {
            main: '#ffffff',
        },
        button: {
            main: '#000000',
        },
    },
});

editorTheme.typography.problemDescription = {
    fontFamily: 'Arial',
    color: '#000000',
    fontSize: 24,
}

editorTheme.typography.problemHighlightedWord = {
    fontFamily: 'Arial',
    color: '#1468ab',
    fontSize: 24,
}

editorTheme.typography.problemDescriptionItalic = {
    fontFamily: 'Arial',
    color: '#000000',
    fontSize: 24,
    fontStyle: 'italic',
}

editorTheme.typography.problemHighlightedItalicWord = {
    fontFamily: 'Arial',
    color: '#1468ab',
    fontSize: 24,
    fontStyle: 'italic',
}

editorTheme.typography.aboveEditor = {
    fontFamily: 'Arial',
    color: '#000000',
    fontSize: 32,
}

export default editorTheme;