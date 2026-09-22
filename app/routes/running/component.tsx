import {
    Box,
    Button,
    TextField,
    Typography,
    LinearProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    type CircularProgressProps,
} from '@mui/material';
import PauseCircleOutlineRoundedIcon from '@mui/icons-material/PauseCircleOutlineRounded';
import PlayCircleOutlineRoundedIcon from '@mui/icons-material/PlayCircleOutlineRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

import { useEffect, useRef, useState } from 'react';

import { pushMsg, pushError } from "~/components/error_popout";
import { getLocalStorage } from "~/hooks/storage";
import { api } from "~/hooks/api";

const apiUrl = getLocalStorage("apiUrl", "local");



export function LogsProgress({ title, newLogs }: { title: string; newLogs: string[] }) {
    const [logs, setLogs] = useState<string[]>([]);
    const textRef = useRef<HTMLTextAreaElement | null>(null);
    const shouldScrollRef = useRef(true);
    const autoScrollingRef = useRef(false);


    const handleScroll = () => {
        const textarea = textRef.current;
        if (!textarea) return;

        if (autoScrollingRef.current) {
            return;
        }

        shouldScrollRef.current =
            textarea.scrollHeight - textarea.scrollTop <= textarea.clientHeight + 5;
    };

    useEffect(() => {
        if (!shouldScrollRef.current) return;

        const textarea = textRef.current;
        if (!textarea) return;

        requestAnimationFrame(() => {
            autoScrollingRef.current = true;

            textarea.scrollTop = textarea.scrollHeight;

            requestAnimationFrame(() => {
                autoScrollingRef.current = false;
            });
        });
    }, [logs]);

    useEffect(() => { setLogs(prev => [...prev, ...newLogs]) }, [newLogs]);


    return (
        <>
            <PanelTitle title={`${title} Progress Logs`} />
            <TextField
                multiline
                value={logs.join("\n")}
                slotProps={{
                    htmlInput: {
                        readOnly: true,
                        ref: textRef,
                        onScroll: handleScroll,
                    },
                }}
                sx={{
                    mb: 3,
                    width: "100%",
                    height: "100%",
                    "& .MuiInputBase-root": {
                        height: "100%",
                    },
                    "& textarea": {
                        height: "100% !important",
                        overflowY: "auto !important",
                    },
                }}
            />
        </>
    );
}

export function LineProgress({ progress, cpu, ram }: { progress: number; cpu: number; ram: number }) {
    return (
        <Box sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            gap: 3,
        }}>
            <LinearProgress
                variant={progress >= 100 || progress === 0 ? "indeterminate" : "determinate"}
                value={progress}
                sx={{ width: "83%" }}
            />
            <Typography sx={{ width: "8%" }}>
                {progress >= 100 || progress === 0 ? "Processing..." : `${progress.toFixed(2)} %`}
            </Typography>
            <CircularProgressWithLabel value={cpu} title="CPU" />
            <CircularProgressWithLabel value={ram} title="RAM" />
        </Box>
    );
}

function CircularProgressWithLabel(props: CircularProgressProps & { value: number, title: string },) {
    return (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress
                    enableTrackSlot
                    variant="determinate"
                    aria-label="Upload photos"
                    {...props}
                />
                <Box
                    sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: 'absolute',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Typography
                        variant="caption"
                        component="div"
                        sx={{ color: 'text.secondary' }}
                    >
                        {props.value.toFixed(0)}%
                    </Typography>
                </Box>
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {props.title}
            </Typography>
        </Box>
    );
}


export function TaskControl({ title, llm = false }: { title: string; llm?: boolean }) {
    const [pause, setPause] = useState(false);
    const [openCancel, setOpenCancel] = useState(false);

    const fetch = () => {
        api.get(`${apiUrl}/task/running/pause`).json<boolean>()
            .then((is_set) => setPause(!is_set))
            .catch((error) => pushError(error, "Get Pause/Resume Status"));
    }

    const submit = () => {
        api.post(`${apiUrl}/task/running/pause`, { searchParams: { set: pause } }).json<boolean>()
            .then((is_set) => {
                setPause(!is_set);
                pushMsg(`Task ${!is_set ? "paused" : "resumed"} successfully.`, "success");
            })
            .catch((error) => pushError(error, "Set Pause/Resume Status"));
    }

    useEffect(() => { fetch() }, []);

    return (
        <Box sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
        }}>
            <Typography variant="h4">
                {title}
            </Typography>
            <Box sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 3,
            }}>
                <Button
                    disabled={llm}
                    color={pause ? "info" : "primary"}
                    variant={pause ? 'contained' : 'outlined'}
                    startIcon={pause ? <PlayCircleOutlineRoundedIcon /> : <PauseCircleOutlineRoundedIcon />}
                    onClick={submit}
                    onMouseEnter={fetch}
                >
                    {pause ? "Resume" : "Pause"}
                </Button>
                <Button
                    disabled={llm}
                    variant='outlined'
                    color='error'
                    startIcon={<CloseRoundedIcon />}
                    onClick={() => setOpenCancel(true)}
                >
                    Cancel
                </Button>
                {openCancel && <CancelPopout onClose={() => setOpenCancel(false)} />}
            </Box>
        </Box>
    );
}

function CancelPopout({ onClose }: { onClose: () => void }) {
    const cancel = () => {
        api.post(`${apiUrl}/task/running/cancel`)
            .then(() => {
                pushMsg("Task cancelled successfully.", "info");
                onClose();
            })
            .catch((error) => {
                pushError(error, "Cancel Task");
                onClose();
            });
    }

    return (
        <Dialog open onClose={onClose} fullWidth>
            <DialogTitle>
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    Cancel Task
                </Typography>
            </DialogTitle>
            <DialogContent>
                <Typography variant="body1">
                    Are you sure you want to cancel the running task?
                </Typography>
            </DialogContent>
            <DialogActions sx={{ pb: 3, pr: 3, gap: 1 }}>
                <Button
                    variant='outlined'
                    onClick={onClose}
                >
                    No
                </Button>
                <Button
                    color="error"
                    variant="contained"
                    onClick={cancel}
                >
                    Yes
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export function PanelTitle({ title, mt }: { title: string; mt?: number }) {
    return (
        <Typography variant="h6" sx={{
            mb: 1,
            mt,
            fontWeight: "bold",
            color: "text.secondary",
        }}>
            {title}
        </Typography>
    );
}