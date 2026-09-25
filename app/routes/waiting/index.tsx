import {
    Box,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    IconButton,
    Tooltip,
    Switch,
} from '@mui/material';
import BlurOnRoundedIcon from '@mui/icons-material/BlurOnRounded';
import DeleteForeverRoundedIcon from '@mui/icons-material/DeleteForeverRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import VerticalAlignTopRoundedIcon from '@mui/icons-material/VerticalAlignTopRounded';

import { useEffect, useState, Fragment, type Dispatch, type SetStateAction, useRef } from 'react';

import { DragDropProvider } from '@dnd-kit/react';
import { useSortable } from '@dnd-kit/react/sortable';

import type { ApiWaiting } from "~/models/waiting";
import useLocalStorage from "~/hooks/storage";
import { EtaText, getEta } from "~/hooks/eta";
import { NoContent } from "~/components/no_content";
import { TableListContainer } from "~/components/frame";
import { ImageWaitingDetails, VideoWaitingDetails } from "./details";
import { deleteWaitingItem, fetchWaitingList, resortWaitingItem, type ApiSort, throttle } from "./function";



export default function Waiting() {
    const [scrollTop, setScrollTop] = useLocalStorage("scrollTop", true, "local");
    const tableRef = useRef<HTMLTableElement>(null);

    const [totalEta, setTotalEta] = useState<number>(0);
    const [waitingInfo, setWaitingInfo] = useState<ApiWaiting[]>([]);
    const [extend, setExtend] = useState<number | null>(null);

    const resortTask = (oldIndex: number, newIndex: number) => {
        if (oldIndex === newIndex) return;

        const newArr = [...waitingInfo];
        const [item] = newArr.splice(oldIndex, 1);
        newArr.splice(newIndex, 0, item);

        const sortDetail: ApiSort = {
            uid: item.uid ?? -1,
            last: newArr[newIndex - 1]?.uid,
            next: newArr[newIndex + 1]?.uid,
        };

        resortWaitingItem(sortDetail)
            .then(() => {
                const scrollY = tableRef.current?.scrollTop ?? 0;
                setWaitingInfo(newArr);
                requestAnimationFrame(() => tableRef.current?.scrollTo({
                    top: scrollTop ? 0 : scrollY,
                    behavior: scrollTop ? "smooth" : "instant",
                }));
            })
    }

    const refreshList = throttle(() => {
        fetchWaitingList()
            .then((data) => setWaitingInfo(data))
    }, 3000);

    useEffect(() => { refreshList(); }, []);



    if (waitingInfo.length === 0) { return (<NoContent title="waiting" />); }

    return (
        <TableListContainer ref={tableRef}>
            <TableHead>
                <TableRow>
                    <TableCell align='center' className="no-wrap">UID</TableCell>
                    <TableCell className="col-1">Input</TableCell>
                    <TableCell className="col-2">Output</TableCell>
                    <TableCell align='center' className="no-wrap">
                        <EtaText eta={totalEta} title="Total ETA: " />
                    </TableCell>
                    <TableCell align='center' className="no-wrap">Retry</TableCell>
                    <TableCell align='center' className="no-wrap">
                        <Tooltip title="Auto scroll to top when move task to top." placement="top" arrow>
                            <Switch checked={scrollTop} onChange={(_, v) => setScrollTop(v)} />
                        </Tooltip>
                    </TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                <DragDropProvider
                    onDragEnd={({ operation }) => {
                        // @ts-ignore
                        const newIndex = operation.source?.index;
                        // @ts-ignore
                        const oldIndex = operation.source?.initialIndex;

                        if (newIndex === undefined || oldIndex === undefined || newIndex === oldIndex) return;

                        resortTask(oldIndex, newIndex);
                    }}
                    onDragStart={() => setExtend(null)}
                >
                    {waitingInfo.map((task, index) => (
                        <Fragment key={task.uid}>
                            <SortableWaitingItem
                                task={task}
                                index={index}
                                onClick={() => setExtend((prev) => (prev === task.uid ? null : task.uid))}
                                onRefresh={refreshList}
                                onMoveTop={() => resortTask(index, 0)}
                                onDelete={() => {
                                    deleteWaitingItem(task.uid)
                                        .then(() => setWaitingInfo((prev) => prev.filter((t) => t.uid !== task.uid)))
                                }}
                                extend={extend === task.uid}
                                setTotalEta={setTotalEta}
                            />
                            {task.type === "image"
                                ? <ImageWaitingDetails task={task} extend={extend === task.uid} />
                                : <VideoWaitingDetails task={task} extend={extend === task.uid} />
                            }
                        </Fragment>
                    ))}
                </DragDropProvider>
            </TableBody>
        </TableListContainer>
    );
}



function SortableWaitingItem({ task, index, onClick, onRefresh, onMoveTop, onDelete, extend, setTotalEta }: {
    task: ApiWaiting;
    index: number;
    onClick: () => void;
    onRefresh: () => void;
    onMoveTop: () => void;
    onDelete: () => void;
    extend?: boolean;
    setTotalEta: Dispatch<SetStateAction<number>>;
}) {
    const { ref, handleRef } = useSortable({ id: task.uid || -1, index });
    const [eta, setEta] = useState<number>(-1);

    const updateEta = (newEta: number) => {
        setTotalEta((prev) => prev + newEta - Math.max(0, eta));
        setEta(newEta);
    };

    useEffect(() => {
        getEta(task).then((updateEta));
    }, [task]);

    return (
        <TableRow ref={ref} hover onClick={onClick}>
            <TableCell align='center' className="no-wrap">{task.uid}</TableCell>
            <TableCell className="col-1">
                {task.type === "video"
                    ? task.input.map((file) => file.path.split("/").pop()).join(", ")
                    : `${task.input.length} images`
                }
            </TableCell>
            <TableCell className="col-2">{task.output}</TableCell>
            <TableCell align='center' className="no-wrap">
                <EtaText eta={eta} />
            </TableCell>
            <TableCell align='center' className="no-wrap">
                {task.retry}
            </TableCell>
            <TableCell align='center' className="no-wrap">
                <Box sx={{
                    display: "flex",
                    flexDirection: "row",
                    alignContent: "center",
                    justifyContent: "center",
                    width: "100%",
                    gap: 1,
                }}>
                    <IconButton
                        color="error"
                        onMouseEnter={onRefresh}
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                    >
                        <DeleteForeverRoundedIcon />
                    </IconButton>
                    <Tooltip title="Move to Top" placement="bottom">
                        <IconButton
                            onMouseEnter={onRefresh}
                            onClick={(e) => {
                                e.stopPropagation();
                                onMoveTop();
                            }}
                        >
                            <VerticalAlignTopRoundedIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Drag to reorder" placement="bottom">
                        <IconButton
                            ref={handleRef}
                            onPointerDown={(e) => e.stopPropagation()}
                            onMouseEnter={onRefresh}
                        >
                            <BlurOnRoundedIcon />
                        </IconButton>
                    </Tooltip>
                    <IconButton disableRipple>
                        {extend ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
                    </IconButton>
                </Box>
            </TableCell>
        </TableRow>
    );
}