import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
    interface TypographyVariants {
        problemDescription: React.CSSProperties;
        problemHighlightedWord: React.CSSProperties;
        problemHighlightedItalicWord: React.CSSProperties;
        problemDescriptionItalic: React.CSSProperties;
    }

    interface TypographyVariantsOptions {
        problemDescription?: React.CSSProperties;
        problemHighlightedWord: React.CSSProperties;
        problemHighlightedItalicWord: React.CSSProperties;
        problemDescriptionItalic: React.CSSProperties;
    }
}

declare module '@mui/material/Typography' {
    interface TypographyPropsVariantOverrides {
        problemDescription: true;
        problemHighlightedWord: true;
        problemHighlightedItalicWord: true;
        problemDescriptionItalic: true;
    }
}

const theme = createTheme({
    palette: {
        primary: {
            main: '#ffffff',
        },
    },
});

theme.typography.problemDescription = {
    fontFamily: 'Arial',
    color: '#000000',
    fontSize: 24,
}

theme.typography.problemHighlightedWord = {
    fontFamily: 'Arial',
    color: '#1468ab',
    fontSize: 24,
}

theme.typography.problemDescriptionItalic = {
    fontFamily: 'Arial',
    color: '#000000',
    fontSize: 24,
    fontStyle: 'italic',
}

theme.typography.problemHighlightedItalicWord = {
    fontFamily: 'Arial',
    color: '#1468ab',
    fontSize: 24,
    fontStyle: 'italic',
}

export default theme;