import {
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    IconButton,
} from '@mui/material';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';

import { useEffect, useState } from 'react';

import type { LLMWaiting } from "~/models/waiting";
import { Language } from "~/models/const";
import { NoContent } from "~/components/no_content";
import { TableListContainer } from '~/components/frame';
import { fetchLLMWaitingList, deleteLLMWaitingItem } from "./function";


export default function LLMWaiting() {
    const [tasks, setTasks] = useState<LLMWaiting[]>([]);

    useEffect(() => { fetchLLMWaitingList().then(data => setTasks(data)); }, []);



    if (tasks.length === 0) { return <NoContent title="LLM waiting tasks" />; }

    return (
        <TableListContainer>
            <TableHead>
                <TableRow>
                    <TableCell align='center' className="no-wrap">UID</TableCell>
                    <TableCell className="col-1">Input</TableCell>
                    <TableCell className="col-2">Output</TableCell>
                    <TableCell align='center' className="no-wrap">
                        Original Language
                    </TableCell>
                    <TableCell align='center' className="no-wrap">
                        Destination Language
                    </TableCell>
                    <TableCell align='center' className="no-wrap" />
                </TableRow>
            </TableHead>
            <TableBody>
                {tasks.map((task) => (
                    <TableRow key={task.output}>
                        <TableCell align='center' className="no-wrap">{task.uid}</TableCell>
                        <TableCell className="col-1">{task.input}</TableCell>
                        <TableCell className="col-2">{task.output}</TableCell>
                        <TableCell align='center' className="no-wrap">{Language[task.args.original]}</TableCell>
                        <TableCell align='center' className="no-wrap">{Language[task.args.destination]}</TableCell>
                        <TableCell align='center' className="no-wrap">
                            <IconButton onClick={() => deleteLLMWaitingItem(task.uid!)}>
                                <DeleteRoundedIcon color='error' />
                            </IconButton>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </TableListContainer>
    );
}