import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Divider,
    Switch,
    Box,
} from '@mui/material';

import { useState, useEffect } from 'react';
import { useNavigate } from "react-router";

import type { ImageInfo, ImageTaskInfo } from "~/models/task";
import type { TranscodeSettings } from '~/models/settings';
import type { ImageInsertConfig } from "../models";
import useLocalStorage, { updateLocalStorage } from '~/hooks/storage';
import { EtaText, getEta } from "~/hooks/eta";
import { pushMsg } from '~/components/error_popout';
import { NobarOverflow, ColumnWidth } from "~/components/frame";
import PathSelector from "~/components/pathselector";
import { SettingItemFrame } from "~/routes/settings/components/frame";
import { SettingSlider } from "~/routes/settings/components/slider";
import { fetchTranscodeSettings } from "~/routes/settings/function";
import { fetchTaskInfo, submitTask } from "./function";
import InputPart from "../file_selector";

export default function VideoInsertTaskDialog({
    retry_task,
    onClose,
    onCancel,
}: {
    retry_task?: ImageTaskInfo;
    onClose: () => void;
    onCancel: () => void;
}) {
    // const
    const navigate = useNavigate();

    // data 
    const [output, setOutput] = useLocalStorage("outputPath", "local", "local");
    const [settings, setSettings] = useState<TranscodeSettings>({} as TranscodeSettings);
    const [config, setConfig] = useState<ImageInsertConfig>({} as ImageInsertConfig);
    const [files, setFiles] = useState<ImageInfo[]>([]);
    const [eta, setEta] = useState<number>(-1);

    useEffect(() => {
        if (files.length === 0)
            setEta(-1);
        else {
            getEta({
                input: files,
                args: { crf: settings.crf, cpu_used: settings.cpu_used },
                output: "",
                settings: settings,
            } satisfies ImageTaskInfo).then((eta) => setEta(eta));
        }
    }, [files, settings.cpu_used, settings.crf]);

    // state 
    const [inserting, setInserting] = useState(false);

    useEffect(() => {
        if (retry_task) {
            setFiles(retry_task.input);
            setSettings(retry_task.settings);
            updateLocalStorage("outputPath", retry_task.output, "local");
        }
        else
            fetchTranscodeSettings().then(setSettings);
    }, []);


    const onCommit = () => {
        setInserting(true);
        submitTask(
            {
                input: files,
                output: output,
                args: { crf: settings.crf, cpu_used: settings.cpu_used },
                settings: settings,
            },
            config.priority,
        ).then(() => {
            pushMsg(`${files.length} task(s) inserted successfully.`, "success");
            onClose();
            if (retry_task)
                navigate("/failed");
            else
                navigate("/running");
        })
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
            <DialogTitle>
                <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                    Insert Task
                </Typography>
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
                    <ColumnWidth width="38%">
                        <InputPart
                            type="image"
                            disable_remove={retry_task?.input.length ?? 0}
                            files={files}
                            setFiles={setFiles}
                            onInsert={async (paths) => {
                                const result = await Promise.allSettled(paths.map((path) => fetchTaskInfo(path)));
                                setFiles((prev) => [...prev, ...result.filter(r => r.status === "fulfilled").map(r => r.value)]);
                            }}
                        />
                    </ColumnWidth>
                    <Divider orientation="vertical" flexItem />
                    <ColumnWidth>
                        <NobarOverflow>
                            <Box sx={{ display: "flex", alignItems: "center", mb: 3, gap: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                                    Set Output Path
                                </Typography>
                                <EtaText eta={eta} title="Total ETA: " />
                            </Box>
                            <PathSelector
                                label="Output Path"
                                value={output}
                                onClose={setOutput}
                                type="dir"
                                addDir
                            />
                            <Divider sx={{ mt: 3 }} />
                            <Typography variant="h6" sx={{ fontWeight: "bold", mt: 3 }}>
                                Settings
                            </Typography>
                            <SettingItemFrame title="Priority" desc="Insert task(s) at the front of the queue.">
                                <Switch
                                    checked={config.priority}
                                    onChange={(e) => setConfig({ priority: e.target.checked })}
                                />
                            </SettingItemFrame>
                            <SettingItemFrame title="Overwrite" desc="Overwrite the output file if it already exists.">
                                <Switch
                                    checked={settings.overwrite}
                                    onChange={(e) => setSettings({ ...settings, overwrite: e.target.checked })}
                                />
                            </SettingItemFrame>
                            <SettingItemFrame title="Delete Source File" desc="Delete the source file after successful processing.">
                                <Switch
                                    checked={settings.delete_source}
                                    onChange={(e) => setSettings({ ...settings, delete_source: e.target.checked })}
                                />
                            </SettingItemFrame>
                            <SettingItemFrame title="CRF" desc="Constant Rate Factor, lower is better quality.">
                                <SettingSlider
                                    value={settings.crf}
                                    onChange={(v) => { setSettings({ ...settings, crf: v }) }}
                                    min={-1}
                                    max={36}
                                    step={1}
                                    field
                                />
                            </SettingItemFrame>
                            <SettingItemFrame title="cpu_used" desc="Encoding quality, lower is slower but better quality.">
                                <SettingSlider
                                    value={settings.cpu_used}
                                    onChange={(v) => { setSettings({ ...settings, cpu_used: v }) }}
                                    min={0}
                                    max={16}
                                    step={1}
                                    field
                                />
                            </SettingItemFrame>
                        </NobarOverflow>
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