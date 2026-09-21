import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TableContainer,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
} from "@mui/material";
import { clearFailedList } from "./function";


export function ClearConfirmDialog({ onClose }: { onClose: (cleared: boolean) => void }) {
    return (
        <Dialog open onClose={() => onClose(false)} >
            <DialogTitle>Are you sure to clear the failed tasks list?</DialogTitle>
            <DialogActions>
                <Button onClick={() => onClose(false)} variant='outlined'>
                    Cancel
                </Button>
                <Button
                    onClick={() => clearFailedList().then(() => onClose(true))}
                    variant='contained'
                    color='error'
                >
                    Clear
                </Button>
            </DialogActions>
        </Dialog >
    );
}

export function ErrorDetailsDialog({ onClose, errors }: { onClose: () => void, errors: string[] }) {
    return (
        <Dialog open onClose={onClose} maxWidth={false} fullWidth>
            <DialogTitle>Error Details</DialogTitle>
            <DialogContent>
                <TableContainer>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell>Index</TableCell>
                                <TableCell sx={{ width: '100%' }}>Error Message</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {errors.map((line, index) =>
                                <TableRow key={index}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell sx={{ width: '100%' }}>{line}</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </DialogContent>
        </Dialog>
    );
}