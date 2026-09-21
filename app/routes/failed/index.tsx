import {
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Button,
} from '@mui/material';

import { useEffect, useState } from 'react';

import type { ApiFailed } from '~/models/failed';
import { NoContent } from "~/components/no_content";
import { TableListContainer } from "~/components/frame";
import { fetchFailedTasks } from "./function";
import { ClearConfirmDialog } from "./dialog";
import { VideoFailedItem, ImageFailedItem, LLMFailedItem } from "./item";

export default function Failed() {
    const [tasks, setTasks] = useState<ApiFailed[]>([]);
    const [clearOpen, setClearOpen] = useState(false);

    useEffect(() => { fetchFailedTasks().then(setTasks); }, []);

    if (tasks.length === 0) { return (<NoContent title="failed" />); }

    return (
        <>
            {clearOpen &&
                <ClearConfirmDialog onClose={(cleared) => {
                    setClearOpen(false);
                    if (cleared) setTasks([]);
                }} />
            }
            <TableListContainer>
                <TableHead>
                    <TableRow>
                        <TableCell className="col-1">Input</TableCell>
                        <TableCell className="col-2">Output</TableCell>
                        <TableCell className="no-wrap">Time</TableCell>
                        <TableCell className="no-wrap">
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => setClearOpen(true)}
                            >
                                Clear List
                            </Button>
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {tasks.map((task, index) => {
                        if (task.type === "video")
                            return <VideoFailedItem
                                key={task.uid}
                                task={task}
                                onDelete={() => setTasks(tasks.filter(t => t.uid !== task.uid))}
                            />;
                        if (task.type === "image")
                            return <ImageFailedItem
                                key={task.uid}
                                task={task}
                                onDelete={() => setTasks(tasks.filter(t => t.uid !== task.uid))}
                            />;
                        if (task.type === "llm")
                            return <LLMFailedItem
                                key={task.uid}
                                task={task}
                                onDelete={() => setTasks(tasks.filter(t => t.uid !== task.uid))}
                            />;
                        return null;
                    })}
                </TableBody>
            </TableListContainer>
        </>
    );
}