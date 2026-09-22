import {
    Box,
    Typography,
    Button,
    Switch,
    Divider,
    Collapse,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    CircularProgress,
    Tooltip,
    IconButton,
} from "@mui/material";
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import BlurOnRoundedIcon from '@mui/icons-material/BlurOnRounded';
import RemoveCircleRoundedIcon from '@mui/icons-material/RemoveCircleRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import AddCircleRoundedIcon from '@mui/icons-material/AddCircleRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';

import { useState, Fragment, type Dispatch, type SetStateAction } from "react";
import { DragDropProvider } from '@dnd-kit/react';
import { useSortable } from '@dnd-kit/react/sortable';
import { move } from '@dnd-kit/helpers';

import type { VideoInfo, ImageInfo } from "~/models/task";
import { type LanguageKey, Language } from "~/models/const";
import type { VideoResponse, VideoInsertConfig } from "./models";
import useLocalStorage from "~/hooks/storage";
import PathSelector, { fetchPathList } from "~/components/pathselector";
import { NobarOverflow } from "~/components/frame";
import { VideoInfoComponent, ImageInfoComponent } from "~/components/task_info";


type FileSelectorProps =
    | {
        type: "image";
        disable_remove: number;
        files: ImageInfo[];
        setFiles: Dispatch<SetStateAction<ImageInfo[]>>;
        onInsert: (paths: string[]) => Promise<void>;
    }
    | {
        type: "video";
        disable_remove: number;
        config: VideoInsertConfig;
        setConfig: Dispatch<SetStateAction<VideoInsertConfig>>;
        files: VideoResponse[];
        setFiles: Dispatch<SetStateAction<VideoResponse[]>>;
        onInsert: (paths: string[]) => Promise<void>;
    }
    | {
        type: "llm";
        disable_remove: number;
        files: [string, LanguageKey][];
        setFiles: Dispatch<SetStateAction<[string, LanguageKey][]>>;
        onInsert: (paths: string[]) => Promise<void>;
    };


export default function FileSelector(props: FileSelectorProps) {
    const [extend, setExtend] = useState<string | null>(null);

    return (
        <Box sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
            height: "100%",
        }}>
            <FileSelectorTitle {...props} />
            <NobarOverflow>
                <DragDropProvider
                    onDragEnd={(event) => {
                        props.setFiles(move(props.files as any, event));
                    }}
                    onDragStart={() => setExtend(null)}
                >
                    {props.type === "video" && props.files
                        .filter((task) => props.config.allow_av1 || task.info.codec !== "av1")
                        .map((task, index) =>
                            <Fragment key={task.info.path}>
                                <FileSelectorItem
                                    type="video"
                                    disable_remove={index < props.disable_remove}
                                    info={task.info}
                                    path={task.info.path}
                                    index={index}
                                    extend={extend}
                                    setExtend={setExtend}
                                    onDelete={(path) => props.setFiles(props.files.filter((task) => task.info.path !== path))}
                                />
                                <Collapse in={extend === task.info.path} timeout="auto" unmountOnExit sx={{ flexShrink: 0 }}>
                                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                        <Divider />
                                        <VideoInfoComponent video={task.info} />
                                        <Divider />
                                    </Box>
                                </Collapse>
                            </Fragment>
                        )}
                    {props.type === "image" && props.files.map((task, index) =>
                        <Fragment key={task.path}>
                            <FileSelectorItem
                                type="image"
                                disable_remove={index < props.disable_remove}
                                info={task}
                                path={task.path}
                                index={index}
                                extend={extend}
                                setExtend={setExtend}
                                onDelete={(path) => props.setFiles(props.files.filter((task) => task.path !== path))}
                            />
                            <Collapse in={extend === task.path} timeout="auto" unmountOnExit sx={{ flexShrink: 0 }}>
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                    <Divider />
                                    <ImageInfoComponent image={task} />
                                    <Divider />
                                </Box>
                            </Collapse>
                        </Fragment>
                    )}
                    {props.type === "llm" && props.files.map((path, index) =>
                        <FileSelectorItem
                            type="llm"
                            disable_remove={index < props.disable_remove}
                            path={path[0]}
                            lang={path[1]}
                            index={index}
                            onDelete={(path) => props.setFiles(props.files.filter((file) => file[0] !== path))}
                        />
                    )}
                </DragDropProvider>
                <FileSelectorAddNew
                    onOpen={() => setExtend(null)}
                    onInsert={props.onInsert}
                    filter={props.type === "llm" ? "subtitle" : props.type}
                />
            </NobarOverflow>
        </Box>
    );
}

function FileSelectorTitle(props: FileSelectorProps) {
    return (
        <Box sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
        }}>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                Add Files
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center" }}>
                <Button
                    onClick={() => props.setFiles([])}
                    variant="outlined"
                    color="error"
                    size="small"
                    sx={{ mr: 3 }}
                >
                    Clear
                </Button>
                {props.type === "video" &&
                    <>
                        <Typography variant="body2" color="text.secondary">
                            Allow AV1
                        </Typography>
                        <Switch
                            checked={props.config.allow_av1 ?? false}
                            onChange={(_, checked) => props.setConfig({ ...props.config, allow_av1: checked })}
                            disabled={props.config.only_subtitle}
                        />
                        <Typography variant="body2" color="text.secondary">
                            Multi-in-one
                        </Typography>
                        <Switch
                            checked={props.config.multi_in_one ?? false}
                            onChange={(_, checked) => props.setConfig({ ...props.config, multi_in_one: checked })}
                            disabled={props.config.only_subtitle}
                        />
                    </>
                }
            </Box>
        </Box>
    );
}

type FileSelectorItemProps =
    | {
        type: "image";
        disable_remove: boolean;
        info: ImageInfo;
        path: string;
        index: number;
        extend: string | null;
        setExtend: Dispatch<SetStateAction<string | null>>;
        onDelete: (path: string) => void;
    }
    | {
        type: "video";
        disable_remove: boolean;
        info: VideoInfo;
        path: string;
        index: number;
        extend: string | null;
        setExtend: Dispatch<SetStateAction<string | null>>;
        onDelete: (path: string) => void;
    }
    | {
        type: "llm";
        disable_remove: boolean;
        lang: LanguageKey;
        path: string,
        index: number;
        onDelete: (path: string) => void;
    };

function FileSelectorItem(props: FileSelectorItemProps) {
    const { ref, handleRef } = useSortable({ id: props.path[0], index: props.index });

    return (
        <div ref={ref}>
            <ListItem disablePadding>
                <ListItemButton
                    onClick={() => props.type !== "llm" &&
                        props.setExtend((prev) => prev === props.path ? null : props.path)
                    }
                    sx={{ gap: 1 }}
                >
                    <ListItemIcon>
                        <Tooltip title={props.disable_remove ? "The file is added by retrying failed task. Cannot be removed." : ""} placement="bottom">
                            <IconButton
                                disabled={props.disable_remove}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    props.onDelete(props.path);
                                }}
                            >
                                <RemoveCircleRoundedIcon color="error" />
                            </IconButton>
                        </Tooltip>
                    </ListItemIcon>
                    <ListItemText
                        sx={{
                            color: (theme) => theme.vars?.palette.primary.main,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                        }}
                        secondary={props.path.split("/").slice(-1)[0]}
                    >
                        <b>File {props.index + 1}</b>
                    </ListItemText>
                    {props.type === "llm" &&
                        <ListItemText>
                            {Language[props.lang]}
                        </ListItemText>
                    }
                    {props.type === "video" && props.info.codec === "av1" && (
                        <ListItemIcon>
                            <Tooltip title="The original codec is AV1.">
                                <IconButton>
                                    <WarningAmberRoundedIcon color="warning" />
                                </IconButton>
                            </Tooltip>
                        </ListItemIcon>
                    )}
                    {props.type === "image" && props.path.endsWith(".avif") && (
                        <ListItemIcon>
                            <Tooltip title="The original image is AVIF format.">
                                <IconButton>
                                    <WarningAmberRoundedIcon color="warning" />
                                </IconButton>
                            </Tooltip>
                        </ListItemIcon>
                    )}
                    <ListItemIcon>
                        <Tooltip title="Drag to reorder" placement="bottom">
                            <IconButton ref={handleRef} onPointerDown={(e) => {
                                e.stopPropagation();
                            }}>
                                <BlurOnRoundedIcon />
                            </IconButton>
                        </Tooltip>
                    </ListItemIcon>
                    {props.type !== "llm" &&
                        <ListItemIcon>
                            {props.extend === props.path
                                ? <ExpandLessRoundedIcon />
                                : <ExpandMoreRoundedIcon />
                            }
                        </ListItemIcon>
                    }
                </ListItemButton>
            </ListItem>
        </div>
    );
}


export function FileSelectorAddNew({ onOpen, onInsert, filter }: {
    onOpen?: () => void;
    onInsert: (paths: string[]) => Promise<void>;
    filter: "video" | "image" | "subtitle";
}) {
    const [open, setOpen] = useState(false);
    const [inserting, setInserting] = useState(false);
    const [path, setPath] = useLocalStorage("inputPath", "/", "local");

    const handleInsert = (path: string) => {
        setInserting(true);
        setOpen(false);
        fetchPathList(path, filter)
            .then((data) => {
                onInsert(data.dir.length === 0 && data.file.length === 0 ? [path] : data.file.map((file) => path + file))
                    .then(() => {
                        setInserting(false);
                        setPath(path.endsWith("/") ? path : path.slice(0, path.lastIndexOf("/") + 1));
                    });
            })
    }


    if (open) {
        return (
            <ListItem
                sx={{ gap: 1 }}
                disablePadding
                onKeyDown={(e) => {
                    if (e.key === "Escape") {
                        setOpen(false);
                        e.stopPropagation();
                    }
                    if (e.key === "Enter") {
                        handleInsert(path);
                        e.stopPropagation();
                    }
                }}
            >
                <ListItemIcon>
                    <IconButton onClick={() => setOpen(false)}>
                        <RemoveCircleRoundedIcon color="error" />
                    </IconButton>
                </ListItemIcon>
                <ListItemIcon>
                    <IconButton onClick={() => handleInsert(path)}>
                        <CheckRoundedIcon color="success" />
                    </IconButton>
                </ListItemIcon>
                <ListItemText>
                    <PathSelector
                        label="Path"
                        onClose={(path) => setPath(path)}
                        onEnter={(path) => {
                            setPath(path);
                            handleInsert(path);
                        }}
                        value={path}
                        filter={filter}
                    />
                </ListItemText>
            </ListItem>
        );
    }

    else if (inserting) {
        let msg = "Inserting ";
        if (path.endsWith("/")) {
            msg += "from directory \"" + path.match(/([^\/]+)\/$/)?.[1] + "/\"";
        }
        else {
            msg += path.slice(path.lastIndexOf("/") + 1);
        }
        msg += " ...";

        return (
            <ListItem>
                <ListItemIcon sx={{ mr: 1 }}>
                    <CircularProgress size="26px" />
                </ListItemIcon>
                <ListItemText primary={msg} />
            </ListItem>
        );
    }

    else {
        return (
            <ListItem disablePadding>
                <ListItemButton onClick={() => {
                    setOpen(true);
                    onOpen?.();
                }}>
                    <ListItemIcon sx={{ mr: 1 }}>
                        <IconButton disableRipple>
                            <AddCircleRoundedIcon />
                        </IconButton>
                    </ListItemIcon>
                    <ListItemText primary="Add a video file or directory" />
                </ListItemButton>
            </ListItem>
        );
    }
}