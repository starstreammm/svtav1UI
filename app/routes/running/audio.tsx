import { Divider } from "@mui/material";

import type { AudioRunning } from "~/models/running";
import { NobarOverflow, ColumnWidth } from "~/components/frame";
import { TaskInfoItemBase } from "~/components//task_info";
import { PanelTitle } from "./component";



function Progress({ info }: { info: AudioRunning }) {
    return (
        <>
            <PanelTitle title="Progress Info" />
            <NobarOverflow gap={1}>
                <TaskInfoItemBase size="body1" content={[
                    ["Start Time", new Date(info.start_time).toLocaleString()],
                    ["Consumed Time", info.consumed_time],
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

export default function AudioRunningProgress({ info }: { info: AudioRunning }) {
    return (
        <>
            <ColumnWidth>
                <PanelTitle title="Task Details" />
                <TaskInfoItemBase size="body1" content={[
                    ["Output Path", info.output],
                ]} />
                <PanelTitle title="Input File(s)" mt={3} />
                <NobarOverflow gap={1}>
                    <TaskInfoItemBase size="body1" content={
                        info.input
                            .map((input, index) => ["File " + (index + 1), input])
                    } />
                </NobarOverflow>
            </ColumnWidth>
            <Divider orientation="vertical" />
            <ColumnWidth width={"33%"}>
                <Progress info={info} />
            </ColumnWidth>
        </>
    );
}