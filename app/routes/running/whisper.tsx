import { Divider } from "@mui/material";

import type { WhisperRunning } from "~/models/running";
import { NobarOverflow, ColumnWidth } from "~/components/frame";
import { TaskInfoItemBase } from "~/components/task_info";
import { LogsProgress, PanelTitle } from "./component";



export default function WhisperProgress({ info }: { info: WhisperRunning }) {
    return (
        <>
            <ColumnWidth>
                <PanelTitle title="Task Details" />
                <NobarOverflow gap={1}>
                    <TaskInfoItemBase size="body1" content={[
                        ["Start Time", new Date(info.start_time).toLocaleString()],
                        ["Consumed Time", info.consumed_time],
                        ["Input Path", info.input],
                        ["Output Path", info.output],
                        ["Destination Language", info.subtitle],
                    ]} />
                </NobarOverflow>
            </ColumnWidth>
            <Divider orientation="vertical" />
            <ColumnWidth width="73%">
                <LogsProgress title="Whisper" newLogs={info.log} />
            </ColumnWidth>
        </>
    );
}