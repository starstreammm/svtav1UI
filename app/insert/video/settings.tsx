import {
    Box,
    Typography,
    Button,
    Switch,
    Collapse,
    Tooltip,
    ButtonBase,
    Divider,
} from "@mui/material";
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';

import { useState, useEffect, type SetStateAction, type Dispatch } from "react";

import type { TranscodeSettings } from "~/models/settings";
import type { VideoResponse, VideoInsertConfig } from "../models";

import { SettingItemFrame } from "~/routes/settings/components/frame";
import { SettingSlider } from "~/routes/settings/components/slider";
import { NobarOverflow } from "~/components/frame";
import { checkLLM, fetchTranscodeSettings } from "~/routes/settings/function";
import { RotateSelector, OrgLangSelector, DestLangSelector } from "./components";

const silderWidth = 188;


export default function SettingsPanel({ settings, setSettings, setFiles, config, setConfig }: {
    settings: TranscodeSettings;
    setSettings: Dispatch<SetStateAction<TranscodeSettings>>;
    config: VideoInsertConfig;
    setConfig: Dispatch<SetStateAction<VideoInsertConfig>>;
    setFiles: Dispatch<SetStateAction<VideoResponse[]>>;
}) {
    const [extend, setExtend] = useState(false);
    const [LLMAvailable, setLLMAvailable] = useState(false);

    useEffect(() => {
        checkLLM().then((res) => setLLMAvailable(res));
    }, []);


    return (
        <Box sx={{ display: "flex", flexDirection: "column", width: "100%", height: "100%" }}>
            <Box sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
            }}>
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    Settings
                </Typography>
                <Button
                    variant="outlined"
                    onClick={() => fetchTranscodeSettings().then(data => setSettings(data))}
                    startIcon={<ReplayRoundedIcon />}
                >
                    Reset
                </Button>
            </Box >
            <Divider sx={{ mt: 3, mb: 1 }} />
            <NobarOverflow>
                {!config.only_subtitle && <>
                    <SettingItemFrame title="Priority" desc="Insert task(s) at the front of the queue.">
                        <Switch
                            checked={config.priority ?? false}
                            onChange={(e) => setConfig({ ...config, priority: e.target.checked })}
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
                    <SettingItemFrame title="Rotate" desc="Rotate the video by the specified degrees.">
                        <RotateSelector
                            value={config.rotate}
                            onChange={(value) => {
                                setFiles((prev) => prev.map((file) => {
                                    if ((file.args.rotate ?? null) !== (config.rotate ?? null))
                                        return file;
                                    else
                                        return { info: file.info, args: { ...file.args, rotate: value } };
                                }))
                                setConfig({ ...config, rotate: value });
                            }}
                        />
                    </SettingItemFrame>
                    <SettingItemLineFrame title="Max Bitrate Per Second (Mbps)">
                        <SettingSlider
                            value={settings.max_bitrate_mb}
                            onChange={(v) => setSettings({ ...settings, max_bitrate_mb: v })}
                            min={0.1}
                            max={338}
                            step={0.1}
                            field={true}
                            maxWidth={"calc(100% - 91px)"}
                        />
                    </SettingItemLineFrame>
                    <SettingItemFrame title="Retry" desc="Number of times to retry if the task failed.">
                        <SettingSlider
                            value={settings.retry}
                            onChange={(value) => setSettings({ ...settings, retry: value })}
                            min={0}
                            max={8}
                            step={1}
                            field={false}
                            maxWidth={silderWidth}
                            field_width={false}
                        />
                    </SettingItemFrame>
                </>}
                <Tooltip title={LLMAvailable ? "" : "LLM is not available, please check the LLM settings."}>
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            width: "100%",
                            mt: 3,
                        }}>
                        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                            Generate Subtitles
                        </Typography>
                        <Switch
                            disabled={!LLMAvailable}
                            checked={config.subtitle ? true : false}
                            onChange={(e) => setConfig({ ...config, subtitle: e.target.checked ? null : undefined })}
                        />
                    </Box>
                </Tooltip>
                <Collapse in={config.subtitle !== undefined} timeout="auto" unmountOnExit sx={{ flexShrink: 0 }}>
                    <Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
                        <SettingItemFrame title="Original Language" desc="Language of the original audio track.">
                            <OrgLangSelector
                                value={config.subtitle}
                                onChange={(value) => {
                                    setFiles((prev) => prev.map((file) => {
                                        if ((file.args.subtitle ?? null) !== (config.subtitle ?? null))
                                            return file;
                                        else
                                            return { info: file.info, args: { ...file.args, subtitle: value } };
                                    }))
                                    setConfig({ ...config, subtitle: value });
                                }}
                            />
                        </SettingItemFrame>
                        <SettingItemFrame title="Translate Subtitles" desc="Translate the generated subtitles to another language.">
                            <DestLangSelector
                                org={config.subtitle}
                                value={config.tran}
                                onChange={(value) => {
                                    setFiles((prev) => prev.map((file) => {
                                        if ((file.args.tran ?? null) !== (config.tran ?? null))
                                            return file;
                                        else
                                            return { info: file.info, args: { ...file.args, tran: value } };
                                    }))
                                    setConfig({ ...config, tran: value });
                                }}
                            />
                        </SettingItemFrame>
                        <SettingItemFrame title="Generate Subtitles Only" desc="Only generate subtitles without transcoding the video.">
                            <Switch
                                checked={config.only_subtitle ?? false}
                                onChange={(e) => setConfig({ ...config, only_subtitle: e.target.checked })}
                            />
                        </SettingItemFrame>
                        <SettingItemFrame title="Translate Immediately" desc="Translate the subtitles immediately after the transcoding. This may increase the processing time.">
                            <Switch
                                checked={config.tran_inmediate ?? false}
                                onChange={(e) => setConfig({ ...config, tran_inmediate: e.target.checked })}
                            />
                        </SettingItemFrame>
                    </Box>
                </Collapse>
                <ButtonBase
                    onClick={() => setExtend(!extend)}
                    sx={{
                        display: config.only_subtitle ? "none" : "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                        mt: 1.5,
                        py: 1.5,
                    }}>
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                        Transcoder Settings
                    </Typography>
                    {config.only_subtitle ? <></> : extend ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
                </ButtonBase>
                <Collapse in={extend} timeout="auto" unmountOnExit sx={{ flexShrink: 0, width: "100%" }}>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                        <SettingItemLineFrame title="Preset">
                            <SettingSlider
                                value={settings.preset}
                                onChange={(v) => setSettings({ ...settings, preset: v })}
                                min={0}
                                max={12}
                                step={1}
                                field={false}
                                field_width={false}
                                maxWidth={"calc(100% - 91px)"}
                            />
                        </SettingItemLineFrame>
                        <SettingItemLineFrame title="Keyint (seconds)" desc="Maximum interval between keyframes in seconds.">
                            <SettingSlider
                                value={Number(settings.keyint?.replace("s", ""))}
                                onChange={(v) => setSettings({ ...settings, keyint: `${v}s` })}
                                min={1}
                                max={60}
                                step={1}
                                field={true}
                                maxWidth={"calc(100% - 91px)"}
                            />
                        </SettingItemLineFrame>
                        <SettingItemLineFrame title="Lookahead" desc="Number of frames to look ahead for better encoding decisions.">
                            <SettingSlider
                                value={settings.lookahead}
                                onChange={(v) => setSettings({ ...settings, lookahead: v })}
                                min={0}
                                max={240}
                                step={1}
                                field={true}
                                maxWidth={"calc(100% - 91px)"}
                            />
                        </SettingItemLineFrame>
                        <SettingItemLineFrame title="overshoot_pct">
                            <SettingSlider
                                value={settings.overshoot_pct}
                                onChange={(v) => setSettings({ ...settings, overshoot_pct: v })}
                                min={0}
                                max={100}
                                step={1}
                                field={true}
                            />
                        </SettingItemLineFrame>
                        <SettingItemLineFrame title="undershoot_pct">
                            <SettingSlider
                                value={settings.undershoot_pct}
                                onChange={(v) => setSettings({ ...settings, undershoot_pct: v })}
                                min={0}
                                max={100}
                                step={1}
                                field={true}
                                maxWidth={"calc(100% - 91px)"}
                            />
                        </SettingItemLineFrame>
                        <SettingItemLineFrame title="maxsection_pct">
                            <SettingSlider
                                value={settings.maxsection_pct}
                                onChange={(v) => setSettings({ ...settings, maxsection_pct: v })}
                                min={0}
                                max={10000}
                                step={1}
                                field={true}
                                maxWidth={"calc(100% - 91px)"}
                            />
                        </SettingItemLineFrame>
                        <SettingItemFrame title="scd">
                            <Switch
                                checked={settings.scd}
                                onChange={(e) => setSettings({ ...settings, scd: e.target.checked })}
                            />
                        </SettingItemFrame>
                    </Box>
                </Collapse>
            </NobarOverflow>
        </Box >
    );
}


function SettingItemLineFrame({ title, desc = "", children }: { title: string, desc?: string, children: React.ReactNode }) {
    return (
        <Box sx={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            pt: 3,
            gap: 1,
        }}>
            <Tooltip title={desc}>
                <Typography variant="body1">
                    {title}
                </Typography>
            </Tooltip>
            {children}
        </Box>
    )

}