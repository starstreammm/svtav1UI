import {
    Divider,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Collapse,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    LinearProgress,
} from "@mui/material";
import PlayCircleRoundedIcon from '@mui/icons-material/PlayCircleRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import PauseCircleRoundedIcon from '@mui/icons-material/PauseCircleRounded';
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';

import { useState, useEffect } from "react";

import type { ImageRunning, ImageRunningItem, ImageCompletedItem, ImageErrorItem } from "~/models/running";
import type { ImageInfo } from "~/models/task";
import { NobarOverflow, ColumnWidth } from "~/components/frame";
import { ImageArgsComponent, SettingsInfoComponent, TaskInfoItemBase } from "~/components/task_info";
import { PanelTitle } from "./component";

function BaseItem({ image }: { image: ImageInfo }) {
    return (
        <>
            <TableCell>{image.path}</TableCell>
            <TableCell sx={{ whiteSpace: "nowrap" }}>
                {image.width} x {image.height}
            </TableCell>
            <TableCell sx={{ whiteSpace: "nowrap" }}>
                {`${(image.size / 1024 / 1024).toFixed(2)} MB`}
            </TableCell>
            <TableCell sx={{ whiteSpace: "nowrap" }}>
                {image.pix_fmt}
            </TableCell>
        </>
    );
}

function RunningItem({ image, now }: { image: ImageRunningItem; now: number }) {
    const startTime = new Date(image.start_time).getTime();

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <TableRow>
            <BaseItem image={image} />
            <TableCell sx={{ whiteSpace: "nowrap" }}>
                {formatTime((now - startTime) / 1000)}
            </TableCell>
            <TableCell sx={{ whiteSpace: "nowrap" }}>
                <LinearProgress color="primary" sx={{ minWidth: 133 }} />
            </TableCell>
        </TableRow>
    );
}

function PendingItem({ image, now }: { image: ImageInfo; now: number }) {
    return (
        <TableRow>
            <BaseItem image={image} />
            <TableCell sx={{ whiteSpace: "nowrap" }}>
                <LinearProgress
                    variant="buffer"
                    value={0}
                    valueBuffer={(now % 59) / 59 * 100}
                    color="info"
                    sx={{ minWidth: 133 }}
                />
            </TableCell>
        </TableRow>
    );
}

function CompletedItem({ image }: { image: ImageCompletedItem }) {
    return (
        <TableRow>
            <BaseItem image={image.output} />
            <TableCell sx={{ whiteSpace: "nowrap" }}>
                {`${((1 - (image.output.size / image.input.size)) * 100).toFixed(2)}%`}
            </TableCell>
            <TableCell sx={{ whiteSpace: "nowrap" }}>
                {image.consumed_time}
            </TableCell>
            <TableCell sx={{ whiteSpace: "nowrap" }}>
                <LinearProgress
                    variant="determinate"
                    value={100}
                    color="success"
                    sx={{ minWidth: 133 }}
                />
            </TableCell>
        </TableRow>
    )
}

function ErrorItem({ image }: { image: ImageErrorItem }) {
    return (
        <TableRow>
            <BaseItem image={image} />
            <TableCell sx={{
                whiteSpace: "nowrap",
                maxWidth: 333,
                fontColor: "error.main",
                overflow: "hidden",
                textOverflow: "ellipsis",
            }}>
                {image.error}
            </TableCell>
            <TableCell sx={{ whiteSpace: "nowrap" }}>
                <LinearProgress
                    value={100}
                    color="error"
                    sx={{ minWidth: 133 }}
                />
            </TableCell>
        </TableRow>
    );
}




function StateListItem({ label, icon, head, body, defaultOpen = false, length, output }: {
    label: string;
    icon: React.ReactNode;
    head?: React.ReactNode;
    body: React.ReactNode[];
    defaultOpen?: boolean;
    length: number;
    output?: boolean;
}) {
    const [extend, setExtend] = useState<boolean>(defaultOpen);

    return (
        <>
            <ListItemButton onClick={() => setExtend(!extend)}>
                <ListItemIcon>
                    {icon}
                </ListItemIcon>
                <ListItemText>
                    {label} ({length})
                </ListItemText>
                <ListItemIcon>
                    {extend ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
                </ListItemIcon>
            </ListItemButton>
            <Collapse in={extend} timeout="auto" unmountOnExit sx={{ flexShrink: 0 }}>
                <TableContainer sx={{ bgcolor: "background.paper" }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ width: "100%" }}>{output ? "Output" : "Input"}</TableCell>
                                <TableCell sx={{ whiteSpace: "nowrap" }}>Resolution</TableCell>
                                <TableCell sx={{ whiteSpace: "nowrap" }}>Size</TableCell>
                                <TableCell sx={{ whiteSpace: "nowrap" }}>Pixel Format</TableCell>
                                {head}
                                <TableCell sx={{ whiteSpace: "nowrap" }} />
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {body}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Collapse>
        </>
    );
}


export default function ImageRunningProgress({ info }: { info: ImageRunning }) {
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const timer = setInterval(() => {
            setNow(Date.now());
        }, 1000);
        return () => clearInterval(timer);
    }, []);


    return (
        <>
            <ColumnWidth width={"23%"}>
                <PanelTitle title="Arguments & Settings" />
                <NobarOverflow gap={1}>
                    <TaskInfoItemBase size="body1" content={[
                        ["Start Time", new Date(info.start_time).toLocaleString()],
                        ["Consumed Time", info.consumed_time],
                    ]} />
                    <ImageArgsComponent size="body1" args={info.args} />
                    <SettingsInfoComponent size="body1" settings={info.settings} />
                </NobarOverflow>
            </ColumnWidth>
            <Divider orientation="vertical" />
            <ColumnWidth>
                <PanelTitle title="Progress" />
                <NobarOverflow gap={1}>
                    <List>
                        <StateListItem
                            label="Running"
                            icon={<PlayCircleRoundedIcon color="primary" />}
                            defaultOpen
                            length={info.running.length}
                            head={<TableCell sx={{ whiteSpace: "nowrap" }}>Consumed Time</TableCell>}
                            body={info.running.map((image) =>
                                <RunningItem
                                    key={image.path}
                                    image={image}
                                    now={now}
                                />
                            )}
                        />
                        <StateListItem
                            label="Error"
                            icon={<ErrorRoundedIcon color="error" />}
                            length={info.error.length}
                            head={<TableCell sx={{ whiteSpace: "nowrap" }}>Error</TableCell>}
                            body={info.error.map((image) =>
                                <ErrorItem
                                    key={image.path}
                                    image={image}
                                />
                            )}
                        />
                        <StateListItem
                            label="Pending"
                            length={info.pending.length}
                            icon={<PauseCircleRoundedIcon color="info" />}
                            body={info.pending.map((image) =>
                                <PendingItem
                                    key={image.path}
                                    image={image}
                                    now={now}
                                />
                            )}
                        />
                        <StateListItem
                            label="Completed"
                            length={info.completed.length}
                            icon={<CheckCircleRoundedIcon color="success" />}
                            head={<>
                                <TableCell sx={{ whiteSpace: "nowrap" }}>Compression Ratio</TableCell>
                                <TableCell sx={{ whiteSpace: "nowrap" }}>Consumed Time</TableCell>
                            </>}
                            body={info.completed.map((image) =>
                                <CompletedItem
                                    key={image.input.path}
                                    image={image}
                                />
                            )}
                        />
                    </List>
                </NobarOverflow>
            </ColumnWidth>
        </>
    );
}

