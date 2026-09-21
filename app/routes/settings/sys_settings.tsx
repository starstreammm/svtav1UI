import { Box, Divider, Switch, Typography } from '@mui/material';
import { useState, useEffect } from "react";

import type { TranscodeSettings } from "~/models/settings";
import { UI_VERSION } from "~/models/const";
import { SettingItemFrame, SettingTitleFrame } from "~/routes/settings/components/frame";
import { SettingSlider } from "~/routes/settings/components/slider";
import { fetchBackendVersion, fetchTranscodeSettings, updateTranscodeSettings } from './function';
import { defaultSystemConfig } from './default';

export default function SystemSettingPage() {
    const [config, setConfig] = useState<TranscodeSettings>(defaultSystemConfig as TranscodeSettings);
    const [version, setVersion] = useState<string>("N/A");

    const update = (s: TranscodeSettings) => {
        updateTranscodeSettings(s).then(data => { setConfig(data); });
    }

    useEffect(() => {
        fetchTranscodeSettings().then(data => setConfig(data));
        fetchBackendVersion().then(data => setVersion(data))
    }, []);


    return (
        <Box sx={{ display: "flex", flexDirection: "column", width: "100%", px: 3 }}>
            <SettingTitleFrame title="System Settings" reset={() => update({ ...config, ...defaultSystemConfig })} />
            <Divider />
            <SettingItemFrame title="Overwrite" desc="Overwrite the output file if it already exists.">
                <Switch
                    checked={config.overwrite}
                    onChange={(e) => { update({ ...config, overwrite: e.target.checked }) }}
                />
            </SettingItemFrame>
            <SettingItemFrame title="Delete Source File" desc="Delete the source file after successful processing.">
                <Switch
                    checked={config.delete_source}
                    onChange={(e) => { update({ ...config, delete_source: e.target.checked }) }}
                />
            </SettingItemFrame>
            <SettingItemFrame title="Retry" desc="Number of times to retry if the task failed.">
                <SettingSlider
                    value={config.retry}
                    onChange={(value) => { update({ ...config, retry: value }) }}
                    min={0}
                    max={8}
                    step={1}
                    field={false}
                />
            </SettingItemFrame>
            <SettingItemFrame title="API Version">
                <Typography variant="body1">
                    {version}
                </Typography>
            </SettingItemFrame>
            <SettingItemFrame title="WebUI Version">
                <Typography variant="body1">
                    {UI_VERSION}
                </Typography>
            </SettingItemFrame>
        </Box>
    );
}