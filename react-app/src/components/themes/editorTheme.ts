import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
    interface PaletteColor {
        checkmark?: string;
        cross?: string;
    }

    interface SimplePaletteColorOptions {
        checkmark?: string;
        cross?: string;
    }

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
        inputOutput: React.CSSProperties;
        buttonExponent: React.CSSProperties;
    }

    interface TypographyVariantsOptions {
        problemDescription?: React.CSSProperties;
        problemHighlightedWord: React.CSSProperties;
        problemHighlightedItalicWord: React.CSSProperties;
        problemDescriptionItalic: React.CSSProperties;
        aboveEditor: React.CSSProperties;
        inputOutput: React.CSSProperties;
        buttonExponent: React.CSSProperties;
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
        inputOutput: true;
        buttonExponent: true;
    }
}

const editorTheme = createTheme({
    palette: {
        primary: {
            main: '#ffffff',
            checkmark: '#11bb77',
            cross: '#ff0000',
        },
        button: {
            main: '#000000',
        },
    },
});

editorTheme.typography.problemDescription = {
    fontFamily: 'Arial',
    color: '#000000',
    fontSize: 16,
}

editorTheme.typography.problemHighlightedWord = {
    fontFamily: 'Arial',
    color: '#1468ab',
    fontSize: 16,
}

editorTheme.typography.problemDescriptionItalic = {
    fontFamily: 'Arial',
    color: '#000000',
    fontSize: 16,
    fontStyle: 'italic',
}

editorTheme.typography.problemHighlightedItalicWord = {
    fontFamily: 'Arial',
    color: '#1468ab',
    fontSize: 16,
    fontStyle: 'italic',
}

editorTheme.typography.aboveEditor = {
    fontFamily: 'Arial',
    color: '#000000',
    fontSize: 18,
}

editorTheme.typography.inputOutput = {
    fontFamily: 'Arial',
    color: '#000000',
    fontSize: 16,
}

editorTheme.typography.buttonExponent = {
    fontFamily: 'Arial',
    color: '#000000',
    fontSize: 12,
}

export default editorTheme;