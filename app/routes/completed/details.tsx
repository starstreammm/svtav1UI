import { Typography } from "@mui/material";
import { Fragment } from "react";
import type { ImageCompleted, VideoCompleted, LLMCompleted } from "~/models/completed";
import { TaskInfoItemBase, ImageArgsComponent, ImageInfoComponent, VideoArgsComponent, VideoInfoComponent } from "~/components/task_info";
import { GridContainer, GridColumn } from "~/components/frame";



export function ImageCompletedDetails({ task, extend }: { task: ImageCompleted; extend?: boolean }) {
    return (
        <GridContainer extend={extend}>
            <GridColumn title="Input Details" size={5}>
                {task.input.map((file, index) => (
                    <ImageInfoComponent
                        key={file.path}
                        image={file}
                        index={index + 1}
                    />
                ))}
            </GridColumn>
            <GridColumn title="Output Details" size={5}>
                {task.output.map((file, index) => (
                    <>
                        <ImageInfoComponent
                            key={file.path}
                            image={file}
                            index={index + 1}
                        />
                        <TaskInfoItemBase size="body1" content={[[
                            "Compression Ratio",
                            `${((1 - (file.size / task.input[index].size)) * 100).toFixed(2)}%`,
                        ]]} />
                    </>
                ))}
            </GridColumn>
            <GridColumn title="Transcode Args" size={2}>
                <ImageArgsComponent size="body1" args={task.args} />
            </GridColumn>
        </GridContainer>
    );
}


export function VideoCompletedDetails({ task, extend }: { task: VideoCompleted; extend?: boolean }) {
    return (
        <GridContainer extend={extend}>
            <GridColumn title="Input Details" size={4}>
                {task.input.map((video, index) => (
                    <VideoInfoComponent key={index} video={video} index={index} />
                ))}
            </GridColumn>
            <GridColumn title="Output Details" size={4}>
                <VideoInfoComponent video={task.output} />
            </GridColumn>
            <GridColumn title="FFmpeg Args" size={4}>
                <VideoArgsComponent task={task.args} />
            </GridColumn>
        </GridContainer>
    );
}


export function LLMCompletedDetails({ task, extend }: { task: LLMCompleted; extend?: boolean }) {
    return (

        <GridContainer extend={extend}>
            <GridColumn title="Input & Output" size={8}>
                {[
                    ["Input", task.input],
                    ["Output", task.output],
                ].map(([label, value]) =>
                    <Fragment key={label}>
                        <Typography>
                            <b>{label}:</b>
                        </Typography>
                        <Typography sx={{
                            overflowWrap: "anywhere",
                            wordBreak: "break-all",
                            pl: 3,
                        }}>
                            {value}
                        </Typography>
                    </Fragment>
                )}
            </GridColumn>
            <GridColumn title="Translation Args" size={4}>
                {[
                    ["Original Language", task.args.original],
                    ["Destination Language", task.args.destination],
                ].map(([label, value]) =>
                    <Typography key={label}>
                        <b>{label}:</b> {value}
                    </Typography>
                )}
            </GridColumn>
        </GridContainer>
    );
}