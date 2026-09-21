import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Divider,
    Select,
    MenuItem,
    Box,
} from '@mui/material';

import { useEffect, useState } from 'react';
import { useNavigate } from "react-router";

import type { LLMTaskInfo } from "~/models/task";
import { type LanguageKey, Language } from '~/models/const';
import type { LLMResponse } from "../models";
import { pushMsg } from "~/components/error_popout";
import { LLMSettingPage } from "~/routes/settings/llm_settings";
import { NobarOverflow, ColumnWidth } from "~/components/frame";
import { SettingItemFrame } from "~/routes/settings/components/frame";
import { submitTask, getOutputPath, getOriginalLanguage } from "./function";
import InputPart from "../file_selector";


export default function InsertLLMTaskDialog({
    retry_task,
    onClose,
    onCancel,
}: {
    retry_task?: LLMTaskInfo;
    onClose: () => void;
    onCancel: () => void
}) {
    const navigate = useNavigate();
    const [inserting, setInserting] = useState(false);
    const [files, setFiles] = useState<LLMResponse[]>([]);
    const [destLang, setDestLang] = useState<LanguageKey | undefined>(undefined);

    useEffect(() => {
        if (retry_task) {
            setFiles([[retry_task.input, retry_task.args.original]]);
            setDestLang(retry_task.args.destination);
        }
    }, []);


    const onCommit = () => {
        if (files.length === 0) {
            pushMsg("No file selected.", "error");
            return;
        }
        if (!destLang) {
            pushMsg("No destination language selected.", "error");
            return;
        }
        setInserting(true);
        Promise.allSettled(files.map((file) => submitTask({
            input: file[0],
            args: {
                original: file[1],
                destination: destLang,
            },
            output: getOutputPath(file[0], destLang),
        }))).then((results) => {
            const failed = results.filter((result) => result.status === "rejected");
            if (failed.length > 0) {
                pushMsg(`Submit ${files.length - failed.length} LLM task(s), ${failed.length} failed.`, "error");
            }
            else {
                pushMsg(`Submit ${files.length} LLM task(s) successfully.`, "success");
                onClose();
                if (retry_task)
                    navigate("/failed");
                else
                    navigate("/running");
            }
        })
    }

    return (
        <Dialog open fullScreen onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Escape") { onCancel(); }
            if (e.key == "Enter") { onCommit(); }
        }}>
            <DialogTitle>
                <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                    Insert LLM Task
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
                    <ColumnWidth>
                        <InputPart
                            type="llm"
                            disable_remove={retry_task?.input.length ?? 0}
                            files={files}
                            setFiles={setFiles}
                            onInsert={async (paths) => {
                                const newFiles = paths.map((path) => [path, getOriginalLanguage(path)] as LLMResponse);
                                setFiles((prev) => [...prev, ...newFiles]);
                            }}
                        />
                    </ColumnWidth>
                    <Divider orientation="vertical" flexItem />
                    <ColumnWidth width="63%">
                        <NobarOverflow>
                            <SettingItemFrame title="Translate Language">
                                <Select
                                    value={destLang}
                                    onChange={(e) => setDestLang(e.target.value as LanguageKey)}
                                    displayEmpty
                                    sx={{ width: 138, ml: 1 }}
                                >
                                    <MenuItem value={undefined}>N/A</MenuItem>
                                    {Object.entries(Language)
                                        .filter(([key]) => key !== "zh")
                                        .map(([key, value]) => (
                                            <MenuItem key={key} value={key}>
                                                {value}
                                            </MenuItem>
                                        ))}
                                </Select>
                            </SettingItemFrame>
                            <LLMSettingPage embedded />
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