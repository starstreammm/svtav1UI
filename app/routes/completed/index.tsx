import {
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Button,
} from '@mui/material';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';

import { useEffect, useState, Fragment } from 'react';

import { Language } from '~/models/const';
import type { ApiCompleted } from "~/models/completed";
import { NoContent } from '~/components/no_content';
import { TableListContainer } from '~/components/frame';
import { fetchCompletedList } from "./function";
import ClearConfirmDialog from "./dialog";
import { ImageCompletedDetails, VideoCompletedDetails, LLMCompletedDetails } from "./details";


export default function Completed() {
    const [tasks, setTasks] = useState<ApiCompleted[]>([]);
    const [extend, setExtend] = useState<string | null>(null);
    const [confirm, setConfirm] = useState(false);

    useEffect(() => { fetchCompletedList().then(data => setTasks(data)); }, [])


    if (tasks.length === 0) { return (<NoContent title="Completed" />); }

    return (
        <>
            {confirm &&
                <ClearConfirmDialog onClose={(cleared) => {
                    setConfirm(false);
                    if (cleared) { setTasks([]); }
                }} />
            }
            <TableListContainer>
                <TableHead>
                    <TableRow>
                        <TableCell className="col-1">Input</TableCell>
                        <TableCell className="col-2">Output</TableCell>
                        <TableCell align='center' className="no-wrap">Total Consumed</TableCell>
                        <TableCell align='center' className="no-wrap">Finished Time</TableCell>
                        <TableCell align='center' className="no-wrap">
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => setConfirm(true)}
                            >
                                Clear List
                            </Button>
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {tasks.map((task, index) => (
                        <Fragment key={index}>
                            <TableRow
                                hover
                                onClick={() => setExtend(extend === task.finished_time ? null : task.finished_time)}
                            >
                                <TableCell className="col-1">
                                    {task.type === "llm"
                                        ? task.input
                                        : task.type === "whisper"
                                            ? task.input.map((file) => file.split("/").pop()).join(", ")
                                            : task.type === "image" && task.input.length > 3
                                                ? `${task.input.length} image(s)`
                                                : task.input.map((file) => file.path.split("/").pop()).join(", ")
                                    }
                                </TableCell>
                                <TableCell className="col-2">
                                    {task.type === "video"
                                        ? task.output.path
                                        : task.type === "image"
                                            ? task.output[0].path.slice(0, task.output[0].path.lastIndexOf("/") + 1)
                                            : task.output
                                    }
                                </TableCell>
                                <TableCell align='center' className="no-wrap">{task.total_consumed}</TableCell>
                                <TableCell align='center' className="no-wrap">{new Date(task.finished_time).toLocaleString()}</TableCell>
                                <TableCell align='center' className="no-wrap" sx={{ gap: 1 }}>
                                    {task.type === "whisper"
                                        ? Language[task.args]
                                        : extend === task.finished_time
                                            ? <ExpandLessRoundedIcon />
                                            : <ExpandMoreRoundedIcon />
                                    }
                                </TableCell>
                            </TableRow>
                            {task.type === "image" && <ImageCompletedDetails task={task} extend={extend === task.finished_time} />}
                            {task.type === "video" && <VideoCompletedDetails task={task} extend={extend === task.finished_time} />}
                            {task.type === "llm" && <LLMCompletedDetails task={task} extend={extend === task.finished_time} />}
                        </Fragment>
                    ))}
                </TableBody>
            </TableListContainer>
        </>
    );
}