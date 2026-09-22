import { Divider } from "@mui/material";

import type { VideoRunning } from "~/models/running";
import { NobarOverflow, ColumnWidth } from "~/components/frame";
import {
    VideoInfoComponent,
    VideoArgsComponent,
    TaskInfoItemBase,
    SettingsInfoComponent,
} from "~/components/task_info";
import { PanelTitle } from "./component";



function Progress({ info }: { info: VideoRunning }) {
    return (
        <>
            <PanelTitle title="Progress Info" />
            <NobarOverflow gap={1}>
                <TaskInfoItemBase size="body1" content={[
                    ["Start Time", new Date(info.start_time).toLocaleString()],
                    ["Consumed Time", info.consumed_time],
                    ["Frame", info.frame],
                    ["FPS", info.fps],
                    ["QP", info.qp],
                    ["Bitrate", info.bitrate],
                    ["Size", info.size],
                    ["Completed Duration", info.completed_duration],
                    ["Total Duration", info.total_duration],
                    ["Dup Frames", info.dup_frames],
                    ["Drop Frames", info.drop_frames],
                    ["Speed", `${info.speed}x`],
                    ["ETA", info.eta],
                ]} />
            </NobarOverflow>
        </>
    );
}

export default function VideoRunningProgress({ info }: { info: VideoRunning }) {
    return (
        <>
            <ColumnWidth>
                <PanelTitle title="Input Video(s) Info" />
                <NobarOverflow gap={1}>
                    {info.input.map((video, index) =>
                        <VideoInfoComponent
                            key={index}
                            video={video}
                            index={info.input.length > 1 ? index + 1 : undefined}
                        />
                    )}
                </NobarOverflow>
            </ColumnWidth>
            <Divider orientation="vertical" />
            <ColumnWidth width={"33%"}>
                <PanelTitle title="Output Arguments" />
                <NobarOverflow gap={1}>
                    <TaskInfoItemBase size="body1" content={[
                        ["Output Path", info.output],
                        ["Preset", info.settings.preset],
                    ]} />
                    <VideoArgsComponent size="body1" task={info.args} />
                    <SettingsInfoComponent size="body1" settings={info.settings} />
                </NobarOverflow>
            </ColumnWidth>
            <Divider orientation="vertical" />
            <ColumnWidth width={"33%"}>
                <Progress info={info} />
            </ColumnWidth>
        </>
    );
}

