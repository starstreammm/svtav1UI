import { TableRow, TableCell, IconButton, Collapse, Box, Typography } from "@mui/material";
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import InfoOutlineRoundedIcon from '@mui/icons-material/InfoOutlineRounded';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';

import { useState } from "react";
import type { ApiFailed, ImageFailed, LLMFailed, VideoFailed } from "~/models/failed";
import { PanelTitle } from "~/routes/running/component";
import { TaskInfoItemBase } from "~/components/task_info";
import VideoInsert from "~/insert/video";
import ImageInsert from "~/insert/image";
import LLMInsert from "~/insert/llm";
import { ErrorDetailsDialog } from "./dialog";
import { deleteFailedTask } from "./function";



function FailedItemBase({ task, input, InsertDialog, onDelete }: {
    task: ApiFailed;
    input: string;
    InsertDialog: React.ComponentType<{ retry_task: any, onClose: () => void, onCancel: () => void }>;
    onDelete: () => void;
}) {
    const [error, setError] = useState<boolean>(false);
    const [insert, setInsert] = useState<boolean>(false);
    const [extend, setExtend] = useState<boolean>(false);

    return (
        <>
            {error &&
                <ErrorDetailsDialog
                    onClose={() => setError(false)}
                    errors={task.error}
                />
            }
            {insert &&
                <InsertDialog
                    retry_task={task}
                    onClose={() => {
                        setInsert(false);
                        onDelete();
                        deleteFailedTask(task.uid);
                    }}
                    onCancel={() => setInsert(false)}
                />
            }
            <TableRow onClick={() => setExtend((prev) => !prev)}>
                <TableCell className="col-1">{input}</TableCell>
                <TableCell className="col-2">{task.output}</TableCell>
                <TableCell className="no-wrap">{new Date(task.time).toLocaleString()}</TableCell>
                <TableCell className="no-wrap">
                    <IconButton onClick={() => setError(true)}>
                        <InfoOutlineRoundedIcon />
                    </IconButton>
                    <IconButton onClick={() => setInsert(true)}>
                        <ReplayRoundedIcon />
                    </IconButton>
                    <IconButton onClick={() => {
                        onDelete();
                        deleteFailedTask(task.uid);
                    }}>
                        <DeleteRoundedIcon color='error' />
                    </IconButton>
                    {extend ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
                </TableCell>
            </TableRow>
            <TableRow sx={{ p: 0, m: 0 }}>
                <TableCell colSpan={4} sx={{ p: 0, m: 0 }}>
                    <Collapse in={extend} timeout="auto" unmountOnExit sx={{ flexShrink: 0 }}>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, p: 3 }}>
                            <PanelTitle title="Error Details" />
                            <TaskInfoItemBase pl={3} size="body1" content={
                                task.error.map((err, index) => ["Attempt " + (index + 1), err])
                            } />
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow >
        </>
    );
}


export function VideoFailedItem({ task, onDelete }: { task: VideoFailed, onDelete: () => void }) {
    return <FailedItemBase
        task={task}
        input={task.input.map(file => file.path.split("/").slice(-1)[0]).join(", ")}
        InsertDialog={VideoInsert}
        onDelete={onDelete}
    />;
}


export function ImageFailedItem({ task, onDelete }: { task: ImageFailed, onDelete: () => void }) {
    return <FailedItemBase
        task={task}
        input={task.input.map(file => file.path.split("/").slice(-1)[0]).join(", ")}
        InsertDialog={ImageInsert}
        onDelete={onDelete}
    />;
}

export function LLMFailedItem({ task, onDelete }: { task: LLMFailed, onDelete: () => void }) {
    return <FailedItemBase
        task={task}
        input={task.input}
        InsertDialog={LLMInsert} onDelete={onDelete}
    />;
}