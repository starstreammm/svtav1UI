import { Alert, AlertTitle, Dialog, Box, Button } from "@mui/material";
import { clearCompletedList } from "./function";

export default function ClearConfirmDialog({ onClose }: {
    onClose: (cleared: boolean) => void;
}) {
    return (
        <Dialog open onClose={() => onClose(false)}>
            <Alert severity="warning">
                <AlertTitle>Warning</AlertTitle>
                This is a warning Alert with a cautious title.
                <Box sx={{
                    display: "flex",
                    justifyContent: "end",
                    gap: 1,
                    pt: 3,
                }}>
                    <Button
                        onClick={() => onClose(false)}
                        variant='outlined'
                        size="small"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => {
                            clearCompletedList()
                                .then(() => onClose(true));
                        }}
                        variant='contained'
                        color="error"
                        size="small"
                    >
                        Clear
                    </Button>
                </Box>
            </Alert>
        </Dialog>
    );
}