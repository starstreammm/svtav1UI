import {
    Box,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    DialogActions,
    Button,
    IconButton,
    Tooltip,
    Switch,
    Divider,
} from "@mui/material";
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import DriveFileRenameOutlineRoundedIcon from '@mui/icons-material/DriveFileRenameOutlineRounded';

import {
    useState,
    useEffect,
    useRef,
    useImperativeHandle,
    type RefObject,
    type Dispatch,
    type SetStateAction,
    type ForwardedRef,
    createRef,
} from "react";

import type { TranscodeSettings } from "~/models/settings";
import type { VideoTaskInfo, VideoTranscodeArgs } from "~/models/task";
import type { VideoResponse, VideoInsertConfig } from "../models";
import { Rotate, Language } from "~/models/const";
import { EtaText, getEta } from "~/hooks/eta";
import useLocalStorage from "~/hooks/storage";
import PathSelector from "~/components/pathselector";
import { RotateSelector, OrgLangSelector, DestLangSelector } from "./components";
import { NobarOverflow } from "~/components/frame";


export function SingleOutput({ files, setFiles, settings, config, ref }: {
    files: VideoResponse[];
    setFiles: Dispatch<SetStateAction<VideoResponse[]>>;
    settings: TranscodeSettings;
    config: VideoInsertConfig;
    ref: ForwardedRef<() => Record<string, string>>;
}) {
    const [output, setOutput] = useLocalStorage("outputPath", "local", "local");
    const [totalEta, setTotalEta] = useState(0);
    const outputRefs = useRef<Record<string, RefObject<() => string>>>({});;

    useImperativeHandle(ref, () => () => {
        let result: Record<string, string> = {};
        for (const [input, ref] of Object.entries(outputRefs.current)) {
            console.log("ref", ref, ref.current());
            if (ref.current) {
                const path = ref.current();
                result[input] = path;
            }
        }
        return result;
    });


    return (
        <Box sx={{ display: "flex", height: "100%", flexDirection: "column", gap: 3 }}>
            <OutputTitle path={output} setPath={setOutput} totalEta={totalEta} />
            <NobarOverflow gap={1}>
                {files
                    .filter((task) => config.allow_av1 || task.info.codec !== "av1")
                    .map((file, index) =>
                        <OutputItem
                            key={file.info.path}
                            index={index}
                            file={file}
                            setArgs={(action) => {
                                const newArgs =
                                    typeof action === "function"
                                        ? action(file.args)
                                        : action;

                                const newFiles = [...files];
                                newFiles[index] = {
                                    info: file.info,
                                    args: newArgs,
                                };
                                setFiles(newFiles);
                            }}
                            settings={settings}
                            output={output}
                            setTotalEta={setTotalEta}
                            ref={outputRefs.current[file.info.path] ??= createRef<() => string>() as RefObject<() => string>}
                        />
                    )
                }
            </NobarOverflow>
        </Box>
    );
}



export function MultiOutput({ files, args, setArgs, settings, ref }: {
    files: VideoResponse[];
    args: VideoTranscodeArgs;
    setArgs: Dispatch<SetStateAction<VideoTranscodeArgs>>;
    settings: TranscodeSettings;
    ref: ForwardedRef<() => Record<string, string>>;
}) {
    const [output, setOutput] = useLocalStorage("multi-outputPath", "local", "local");
    const [eta, setEta] = useState(-1);
    const outputRef = useRef<() => string>(null);

    useImperativeHandle(ref, () => () => {
        if (outputRef.current)
            return { path: outputRef.current() };
        else
            throw new Error("Output path is not set.");
    });

    useEffect(() => {
        getEta({ input: files.map(f => f.info), output: "", args: args, settings } satisfies VideoTaskInfo)
            .then((newEta) => setEta(newEta));
    }, []);

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <OutputTitle path={output} setPath={setOutput} totalEta={eta} />
            <OutputItem
                index={-1}
                file={{ info: files[0].info, args: args }}
                setArgs={setArgs}
                settings={settings}
                output={output}
                setTotalEta={() => { }}
                ref={outputRef}
            />
        </Box>
    );
}

function OutputTitle({ path, setPath, totalEta }: {
    path: string;
    setPath: (newPath: string) => void;
    totalEta: number;
}) {
    return (
        <>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    Output Settings
                </Typography>
                <EtaText eta={totalEta} title="Total ETA: " />
            </Box>
            <PathSelector
                label="Output Path"
                value={path}
                onClose={setPath}
                type="dir"
                addDir
            />
            <Divider />
        </>
    );
}

function OutputItem({ index, file, setArgs, settings, output, setTotalEta, ref }: {
    index: number;
    file: VideoResponse;
    setArgs: Dispatch<SetStateAction<VideoTranscodeArgs>>;
    settings: TranscodeSettings;
    output: string;
    setTotalEta: Dispatch<SetStateAction<number>>;
    ref: ForwardedRef<() => string>;
}) {
    const [rename, setRename] = useState(false);
    const [edit, setEdit] = useState(false);
    const [eta, setEta] = useState(-1);
    const [name, setName] = useState("OutputVideo");

    useEffect(() => {
        getEta({ input: [file.info], output: "", args: file.args, settings } satisfies VideoTaskInfo)
            .then((newEta) => {
                setTotalEta((prev) => prev + newEta - Math.max(0, eta));
                setEta(newEta);
            })
        const defaultName = file.info.path
            .slice(file.info.path.lastIndexOf("/") + 1)
            .replace(/\.[^/.]+$/, "");
        setName(defaultName);
    }, []);

    useImperativeHandle(ref, () => () => {
        return `${output}${output.endsWith("/") ? "" : "/"}${name}.mp4`;
    });

    return (
        <Box sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
        }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography sx={{ fontWeight: "bold", color: "primary.main", mr: 3 }}>
                    File {index < 0 ? null : index + 1}
                </Typography>
                <EtaText eta={eta} title="ETA: " />
                <Tooltip title="Rename" sx={{ ml: "auto", mr: 1 }}>
                    <IconButton onClick={() => setRename(true)}>
                        <DriveFileRenameOutlineRoundedIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Edit Task">
                    <IconButton onClick={() => setEdit(true)}>
                        <AssignmentRoundedIcon />
                    </IconButton>
                </Tooltip>
                {rename &&
                    <OutputRenameDialog
                        defaultName={name}
                        onClose={(newName) => {
                            setRename(false);
                            if (newName !== null)
                                setName(newName);
                        }}
                    />
                }
                {edit &&
                    <OutputEditDialog
                        defaultArgs={file.args}
                        onClose={(newArgs) => {
                            setEdit(false);
                            if (newArgs !== null)
                                setArgs(newArgs);
                        }}
                    />
                }
            </Box>
            {[
                ["Output Path", `${output}${output.endsWith("/") ? "" : "/"}${name}.mp4`],
                ["Video Bitrate", `${(Math.min(file.args.video_br / 1000 / 1000, settings.max_bitrate_mb)).toFixed(2)} Mbps`],
                ["Audio Bitrate", `${(file.args.audio_br / 1000).toFixed(2)} kbps`],
                ["Pixel Format", file.args.pix_fmt],
                ["SAR Fix", file.args.sar_fix === "" ? "N/A" : file.args.sar_fix],
                ["Zscale", file.args.zscale],
                ["Rotate", typeof file.args.rotate === "number" ? Rotate[file.args.rotate] : "N/A"],
                ["Subtitle", file.args.subtitle ? Language[file.args.subtitle] : "None"],
            ].map(([key, value]) => (
                <Typography key={key} variant="body2" sx={{
                    overflowWrap: "anywhere",
                    wordBreak: "break-all",
                    textIndent: "3em hanging",
                }}>
                    <Box component="b" sx={{ color: "secondary.main" }}>{key}:</Box> {value}
                </Typography>
            ))}
            {file.args.subtitle &&
                <>
                    {[
                        ["Subtitle Path", `${output}${output.endsWith("/") ? "" : "/"}${name}.${file.args.subtitle}.srt`],
                        ["Translate", file.args.tran ? Language[file.args.tran] : "None"],
                    ].map(([key, value]) => (
                        <Typography key={key} variant="body2" sx={{ pl: 2 }}>
                            <b>{key}:</b> {value}
                        </Typography>
                    ))}
                </>
            }
            {file.args.tran &&
                <Typography variant="body2" sx={{ pl: 2 }}>
                    <b>Translate Immediately:</b> {file.args.tran_inmediate ? "On" : "Off"}
                </Typography>
            }
        </Box >
    );
}



function OutputRenameDialog({
    defaultName,
    onClose,
}: {
    defaultName: string;
    onClose: (newName: string | null) => void;
}) {
    const [name, setName] = useState(defaultName);

    return (
        <Dialog
            fullWidth
            open
            onClose={() => onClose(null)}
            onKeyDown={(e) => {
                if (e.key === "Escape") {
                    e.stopPropagation();
                    onClose(null);
                }
                if (e.key === "Enter") {
                    e.preventDefault();
                    e.stopPropagation();
                    onClose(name);
                }
            }}
        >
            <DialogTitle>
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    Rename
                </Typography>
            </DialogTitle>
            <DialogContent>
                <TextField
                    label="File Name"
                    value={name}
                    variant="outlined"
                    sx={{ mt: 1, width: "100%" }}
                    onChange={(e) => setName(e.target.value)}
                />
            </DialogContent>
            <DialogActions sx={{ pb: 3, pr: 3, gap: 1 }}>
                <Button onClick={() => onClose(null)} variant="outlined" color="error">
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={() => onClose(name)}
                    disabled={name === ""}
                >
                    Rename
                </Button>
            </DialogActions>
        </Dialog>
    );
}

function OutputEditDialog({ defaultArgs, onClose }: {
    defaultArgs: VideoTranscodeArgs;
    onClose: (newArgs: VideoTranscodeArgs | null) => void;
}) {
    const [args, setArgs] = useState<VideoTranscodeArgs>(defaultArgs);


    function ItemFrame({ title, desc = "", children }: { title: string, desc?: string, children: React.ReactNode }) {
        return (
            <Box sx={{
                display: "flex",
                alignItems: "center",
                gap: 3,
            }}>
                <Tooltip title={desc}>
                    <Typography variant="body1">
                        {title}
                    </Typography>
                </Tooltip>
                {children}
            </Box>
        );
    }

    return (

        <Dialog
            fullWidth
            open
            onClose={() => onClose(null)}
            onKeyDown={(e) => {
                if (e.key === "Escape") {
                    e.stopPropagation();
                    onClose(null);
                }
                if (e.key === "Enter") {
                    e.preventDefault();
                    e.stopPropagation();
                    onClose(args);
                }
            }}
        >
            <DialogTitle>
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    Edit Task
                </Typography>
            </DialogTitle>
            <DialogContent>
                <Box sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                    p: 3,
                }}>
                    <ItemFrame title="Rotate" desc="Rotate the video.">
                        <RotateSelector
                            value={args.rotate}
                            onChange={(value) => setArgs((prev) => ({ ...prev, rotate: value }))}
                        />
                    </ItemFrame>
                    <ItemFrame title="Subtitle" desc="Whether to generate subtitle file.">
                        <OrgLangSelector
                            value={args.subtitle}
                            onChange={(value) => setArgs((prev) => ({ ...prev, subtitle: value }))}
                        />
                    </ItemFrame>
                    <ItemFrame title="Translate Subtitle" desc="Translate the generated subtitle to another language.">
                        <DestLangSelector
                            org={args.subtitle}
                            value={args.tran}
                            onChange={(value) => setArgs((prev) => ({ ...prev, tran: value }))}
                        />
                    </ItemFrame>
                    <ItemFrame title="Translate Immediately" desc="Translate the subtitles immediately after the transcoding. This may increase the processing time.">
                        <Switch
                            checked={args.tran_inmediate ?? false}
                            onChange={(e) => setArgs((prev) => ({ ...prev, tran_inmediate: e.target.checked }))}
                        />
                    </ItemFrame>
                </Box>
            </DialogContent>
            <DialogActions sx={{ pb: 3, pr: 3, gap: 1 }}>
                <Button onClick={() => onClose(null)} variant="outlined" color="error">
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={() => onClose(args)}
                >
                    Edit
                </Button>
            </DialogActions>
        </Dialog>
    );

}