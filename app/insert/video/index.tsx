import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Divider,
    Box,
} from '@mui/material';

import { useRef, useState, useEffect } from 'react';
import { useNavigate } from "react-router";

import type { VideoTaskInfo, VideoTranscodeArgs } from '~/models/task';
import type { TranscodeSettings } from '~/models/settings';
import type { VideoResponse, VideoInsertConfig } from "../models";
import { updateLocalStorage } from '~/hooks/storage';
import { pushError, pushMsg } from '~/components/error_popout';
import { ColumnWidth } from "~/components/frame";
import { fetchTranscodeSettings } from "~/routes/settings/function";
import { defaultTranscodeConfig } from "~/routes/settings/default";
import { fetchTaskInfo, fetchMultiTaskInfo, submitTask } from "./function";
import InputPart from "../file_selector";
import { SingleOutput, MultiOutput } from "./output";
import SettingsPart from "./settings";

export default function VideoInsertTaskDialog({
    retry_task,
    onClose,
    onCancel,
}: {
    retry_task?: VideoTaskInfo;
    onClose: () => void;
    onCancel: () => void;
}) {
    // const
    const navigate = useNavigate();

    // data 
    const [settings, setSettings] = useState<TranscodeSettings>(defaultTranscodeConfig);
    const [config, setConfig] = useState<VideoInsertConfig>({} as VideoInsertConfig);
    const [files, setFiles] = useState<VideoResponse[]>([]);
    const [multiTaskArgs, setMultiTaskArgs] = useState<VideoTranscodeArgs>({} as VideoTranscodeArgs);

    // state 
    const [inserting, setInserting] = useState(false);
    const outputRef = useRef<() => Record<string, string>>(null);

    useEffect(() => {
        if (retry_task) {
            if (retry_task.input.length > 1) {
                setConfig({ ...config, multi_in_one: true });
                setMultiTaskArgs(retry_task.args);
                updateLocalStorage<string>("multi-outputPath", retry_task.output.slice(0, retry_task.output.lastIndexOf("/") + 1), "local");
                Promise.allSettled(retry_task.input.map((input) => fetchTaskInfo(input.path)))
                    .then((results) => {
                        let newFiles: VideoResponse[] = [];
                        results.forEach((result) => {
                            if (result.status === "fulfilled") {
                                newFiles.push(result.value);
                            }
                        });
                        setFiles(newFiles);
                    });
            }
            else {
                setFiles([{ info: retry_task.input[0], args: retry_task.args }]);
                updateLocalStorage<string>("outputPath", retry_task.output.slice(0, retry_task.output.lastIndexOf("/") + 1), "local");
            }
            if (retry_task.args.video_br <= 0)
                setConfig({ ...config, only_subtitle: true, allow_av1: true });
            if (retry_task.input[0].codec === "av1")
                setConfig({ ...config, allow_av1: true });
            setSettings(retry_task.settings);
        }
        else {
            fetchTranscodeSettings().then((res) => setSettings(res));
        }
    }, []);

    useEffect(() => {
        if (config.multi_in_one && files.length > 0) {
            fetchMultiTaskInfo(files.map(f => f.info))
                .then((res) => setMultiTaskArgs(res));
        }
    }, [config.multi_in_one]);


    const onCommit = () => {
        setInserting(true);
        const output_path = outputRef.current?.();
        console.log("output_path", output_path);
        if (!output_path) {
            setInserting(false);
            pushError("Output path is not set or not tasks to insert.");
            return;
        }
        const onEnd = () => {
            setInserting(false);
            if (retry_task)
                navigate("/failed");
            else
                navigate("/running");
            onClose();
        };

        if (config.multi_in_one) {
            submitTask(
                {
                    input: files.map(f => f.info),
                    output: output_path["path"],
                    args: multiTaskArgs,
                    settings: settings,
                },
                config.priority,
            ).then(() => {
                pushMsg("Inserted multi-input task successfully.", "success");
                onEnd();
            }).finally(() => setInserting(false));
        }
        else {
            Promise.allSettled(files.map((file) => {
                if (!output_path[file.info.path]) {
                    pushError("Output path is not set for file: " + file.info.path);
                    return Promise.reject("Output path is not set for file: " + file.info.path);
                }
                else {
                    return submitTask(
                        {
                            input: [file.info],
                            output: output_path[file.info.path],
                            args: file.args,
                            settings: settings,
                        },
                        config.priority,
                    );
                }
            })).then((results) => {
                let failed: VideoResponse[] = [];
                results.map((result, index) => {
                    if (result.status === "rejected")
                        failed.push(files[index]);
                });
                if (failed.length > 0) {
                    pushMsg(`Inserted ${files.length - failed.length} tasks, ${failed.length} tasks failed.`, "error");
                    setFiles(failed);
                }
                else {
                    pushMsg(`Inserted ${files.length} tasks successfully.`, "success");
                    onEnd();
                }
            }).finally(() => setInserting(false));
        }
    }


    return (
        <Dialog open fullScreen onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Escape")
                onCancel();
            if (e.key == "Enter")
                onCommit();
        }
        }>
            <DialogTitle sx={{ fontWeight: "bold", fontSize: "h5.fontSize" }}>
                Insert Task
            </DialogTitle>
            <DialogContent sx={{ p: 0 }}>
                <Box sx={{
                    display: "flex",
                    flexDirection: "row",
                    width: "100vw",
                    height: "100%",
                    gap: 1,
                    px: 1,
                }}>
                    <ColumnWidth width="36%">
                        <InputPart
                            type="video"
                            disable_remove={retry_task ? retry_task.input.length : 0}
                            config={config}
                            setConfig={(newConfig) => setConfig({ ...config, ...newConfig })}
                            files={files}
                            setFiles={setFiles}
                            onInsert={async (paths) => {
                                const newFiles = await Promise.allSettled(paths.map((path) => fetchTaskInfo(path)));
                                setFiles((prev) => [
                                    ...prev,
                                    ...newFiles
                                        .filter((result) => result.status === "fulfilled")
                                        .map((result) => (result.value))
                                ]);
                            }}
                        />
                    </ColumnWidth>
                    <Divider orientation="vertical" />
                    <ColumnWidth>
                        {config.multi_in_one
                            ? <MultiOutput
                                files={files}
                                args={multiTaskArgs}
                                setArgs={setMultiTaskArgs}
                                settings={settings}
                                ref={outputRef}
                            />
                            : <SingleOutput
                                files={files}
                                setFiles={setFiles}
                                settings={settings}
                                config={config}
                                ref={outputRef}
                            />
                        }
                    </ColumnWidth>
                    <Divider orientation="vertical" />
                    <ColumnWidth width="28%">
                        <SettingsPart
                            settings={settings}
                            setSettings={setSettings}
                            setFiles={setFiles}
                            config={config}
                            setConfig={setConfig}
                        />
                    </ColumnWidth>
                </Box>
            </DialogContent>
            <DialogActions sx={{ pb: 3, pr: 3, gap: 1 }}>
                <Button onClick={onCancel} variant="outlined">
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={onCommit}
                    loading={inserting}
                    loadingPosition="end"
                >
                    Insert
                </Button>
            </DialogActions>
        </Dialog >
    );
}