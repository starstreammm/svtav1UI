import { Grid, Typography, Divider } from "@mui/material";

import type { AudioRunning } from "~/models/running";
import { NobarOverflow } from "~/components/frame";



function Progress({ info }: { info: AudioRunning }) {
    return (
        <>
            <Typography variant="h5" sx={{ mb: 1 }}>
                Progress Info
            </Typography>
            <NobarOverflow gap={1}>
                {[
                    ["CPU Usage", `${info.cpu_usage} %`],
                    ["RAM Usage", `${info.ram_usage} %`],
                    ["Start Time", new Date(info.start_time).toLocaleString()],
                    ["Consumed Time", info.consumed_time],
                    ["Bitrate", info.bitrate],
                    ["Size", info.size],
                    ["Completed Time", info.completed_duration],
                    ["Dup Frames", info.dup_frames],
                    ["Drop Frames", info.drop_frames],
                    ["Speed", `${info.speed}x`],
                    ["ETA", info.eta],
                ].map(([key, value]) => (
                    <Typography key={key} variant="body1">
                        <b>{key}:</b> {value}
                    </Typography>
                ))}
            </NobarOverflow>
        </>
    );
}

export default function AudioRunningProgress({ info }: { info: AudioRunning }) {
    return (
        <Grid container spacing={1}>
            <Grid size={8}>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold" }}>
                    Task Details
                </Typography>
                <NobarOverflow gap={1}>
                    <Typography color='primary'>
                        <b>Output</b>
                    </Typography>
                    <Typography>
                        {info.output}
                    </Typography>
                    <Typography color='primary'>
                        <b>Input(s)</b>
                    </Typography>
                    {info.input.map((input, index) =>
                        <Typography
                            key={index}
                            sx={{
                                overflowWrap: "break-word",
                                wordBreak: "break-word",
                            }}
                        >
                            <b>File {index + 1}:</b> {input}
                        </Typography>
                    )}
                </NobarOverflow>
            </Grid>
            <Divider orientation="vertical" />
            <Grid size={4}>
                <Progress info={info} />
            </Grid>
        </Grid>
    );
}