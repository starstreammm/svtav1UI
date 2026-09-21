import { Typography } from "@mui/material";

import type { ImageWaiting, VideoWaiting } from "~/models/waiting";
import { ImageArgsComponent, ImageInfoComponent, VideoArgsComponent, VideoInfoComponent } from "~/components/task_info";
import { GridContainer, GridColumn } from "~/components/frame";




export function ImageWaitingDetails({ task, extend }: { task: ImageWaiting; extend?: boolean }) {
    return (
        <GridContainer extend={extend}>
            <GridColumn title="Input Details" size={8}>
                {task.input.map((file, index) => (
                    <ImageInfoComponent
                        key={file.path}
                        image={file}
                        index={index}
                    />
                ))}
            </GridColumn>
            <GridColumn title="Output Set" size={4}>
                <Typography>
                    <b>Output Path:</b>
                </Typography>
                <Typography sx={{
                    overflowWrap: "anywhere",
                    wordBreak: "break-all",
                    pl: 3,
                }}>
                    {task.output}
                </Typography>
                <ImageArgsComponent args={task.args} />
            </GridColumn>
        </GridContainer>
    );
}

export function VideoWaitingDetails({ task, extend }: { task: VideoWaiting; extend?: boolean }) {
    return (
        <GridContainer extend={extend}>
            <GridColumn title="Input Details" size={4}>
                {task.input.map((video, index) => (
                    <VideoInfoComponent key={index} video={video} index={index} />
                ))}
            </GridColumn>
            <GridColumn title="Output Set" size={4}>
                <Typography>
                    <b>Output Path:</b>
                </Typography>
                <Typography sx={{
                    overflowWrap: "anywhere",
                    wordBreak: "break-all",
                    pl: 3,
                }}>
                    {task.output}
                </Typography>
                <VideoArgsComponent task={task.args} />
            </GridColumn>
            <GridColumn title="FFmpeg Args" size={4}>
                {[
                    ["Preset", task.settings.preset],
                    ["Retry", task.settings.retry],
                    ["Overshoot Pct", task.settings.overshoot_pct],
                    ["Undershoot Pct", task.settings.undershoot_pct],
                    ["Min Section Pct", task.settings.minsection_pct],
                    ["Max Section Pct", task.settings.maxsection_pct],
                    ["Keyint", task.settings.keyint],
                    ["Lookahead", task.settings.lookahead],
                    ["SCD", task.settings.scd ? "Enabled" : "Disabled"],
                ].map(([key, value]) => (
                    <Typography key={key} sx={{
                        overflowWrap: "break-word",
                        wordBreak: "break-word",
                    }}>
                        <b>{key}:</b> {value}
                    </Typography>
                ))}
            </GridColumn>
        </GridContainer>
    );
}