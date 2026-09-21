import {
    Box,
    TableContainer,
    Table,
    TableRow,
    TableCell,
    Grid,
    Collapse,
    Typography,
} from '@mui/material';

export function NobarOverflow({
    children,
    gap = 0,
    width = "100%",
}: {
    children: React.ReactNode,
    gap?: number,
    width?: string,
}) {
    return (
        <Box sx={{
            gap: gap,
            display: "flex",
            flexDirection: "column",
            width: width,
            height: "100%",
            overflowY: "scroll",
            overflowX: "hidden",
            scrollbarWidth: 'none',     // Firefox
            msOverflowStyle: 'none',    // IE 10+
            '&::-webkit-scrollbar': {   // Chrome / Safari
                display: 'none',
            },
        }}>
            {children}
        </Box>
    );
}

export function ColumnWidth({
    children,
    width,
    gap = 0,
}: {
    children: React.ReactNode,
    width?: string,
    gap?: number,
}) {
    return (
        <Box sx={{
            display: "flex",
            flexDirection: "column",
            width: width,
            height: "100%",
            px: 1,
            gap: gap,
            flexShrink: 0,
            flex: width ? undefined : 1,
            minWidth: 0,
        }}>
            {children}
        </Box>
    );
}



export function TableListContainer({ children }: { children: React.ReactNode }) {
    return (
        <TableContainer
            component={Box}
            sx={{
                overflowY: "auto",
                scrollbarWidth: "none",
                "&::-webkit-scrollbar": {
                    display: "none",
                },
            }}
        >
            <Table stickyHeader sx={{
                width: "100%",
                tableLayout: 'auto',

                '& .col-1': {
                    width: '33%',
                    overflowWrap: 'anywhere',
                    wordBreak: 'break-word',
                },

                '& .col-2': {
                    width: '67%',
                    overflowWrap: 'anywhere',
                    wordBreak: 'break-word',
                },

                '& .no-wrap': {
                    whiteSpace: 'nowrap',
                },
            }}>
                {children}
            </Table>
        </TableContainer>
    );
}



export function GridContainer({ children, extend }: { children: React.ReactNode; extend?: boolean }) {
    return (
        <TableRow sx={{ p: 0, m: 0 }}>
            <TableCell colSpan={6} sx={{ p: 0, m: 0 }}>
                <Collapse in={extend} timeout="auto" unmountOnExit>
                    <Grid container spacing={1} sx={{ m: 3 }}>
                        {children}
                    </Grid>
                </Collapse>
            </TableCell>
        </TableRow>
    );
}

export function GridColumn({ children, title, size = 4 }: {
    children: React.ReactNode;
    title: string;
    size?: number;
}) {
    return (
        <Grid
            size={size}
            sx={{
                display: "flex",
                justifyContent: "start",
                flexDirection: "column",
                alignItems: "start",
            }}
        >
            <Typography
                variant="h6"
                sx={{
                    mb: 1,
                    fontWeight: "bold",
                    color: "text.secondary",
                }}
            >
                {title}
            </Typography>
            {children}
        </Grid >
    );
}