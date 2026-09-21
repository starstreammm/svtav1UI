import { Box, Divider, Switch } from '@mui/material';
import { useState, useEffect } from "react";

import type { TranscodeSettings } from "~/models/settings";
import { SettingItemFrame, SettingTitleFrame } from "~/routes/settings/components/frame";
import { SettingSlider } from "~/routes/settings/components/slider";
import { fetchTranscodeSettings, updateTranscodeSettings } from './function';
import { defaultTranConfig } from './default';

export default function TranscodeSettingPage() {
    const [config, setConfig] = useState<TranscodeSettings>(defaultTranConfig as TranscodeSettings);

    const update = (s: TranscodeSettings) => {
        updateTranscodeSettings(s).then(data => setConfig(data));
    }

    useEffect(() => { fetchTranscodeSettings().then(data => setConfig(data)); }, []);


    return (
        <Box sx={{ display: "flex", flexDirection: "column", width: "100%", px: 3 }}>
            <SettingTitleFrame title="Transcoder Settings" reset={() => update({ ...config, ...defaultTranConfig })} />
            <Divider />
            <SettingItemFrame title="Preset">
                <SettingSlider
                    value={config.preset}
                    onChange={(v) => { update({ ...config, preset: v }) }}
                    min={0}
                    max={12}
                    step={1}
                    field={false}
                />
            </SettingItemFrame>
            <SettingItemFrame title="Max Bitrate Per Second (Mbps)">
                <SettingSlider
                    value={config.max_bitrate_mb}
                    onChange={(v) => { update({ ...config, max_bitrate_mb: v }) }}
                    min={0.1}
                    max={338}
                    step={0.1}
                    field={true}
                />
            </SettingItemFrame>
            <SettingItemFrame title="Keyint (seconds)" desc="Maximum interval between keyframes in seconds.">
                <SettingSlider
                    value={Number(config.keyint.replace("s", ""))}
                    onChange={(v) => { update({ ...config, keyint: `${v}s` }) }}
                    min={1}
                    max={60}
                    step={1}
                    field={true}
                />
            </SettingItemFrame>
            <SettingItemFrame title="Lookahead" desc="Number of frames to look ahead for better encoding decisions.">
                <SettingSlider
                    value={config.lookahead}
                    onChange={(v) => { update({ ...config, lookahead: v }) }}
                    min={0}
                    max={240}
                    step={1}
                    field={true}
                />
            </SettingItemFrame>
            <SettingItemFrame title="overshoot_pct">
                <SettingSlider
                    value={config.overshoot_pct}
                    onChange={(v) => { update({ ...config, overshoot_pct: v }) }}
                    min={0}
                    max={100}
                    step={1}
                    field={true}
                />
            </SettingItemFrame>
            <SettingItemFrame title="undershoot_pct">
                <SettingSlider
                    value={config.undershoot_pct}
                    onChange={(v) => { update({ ...config, undershoot_pct: v }) }}
                    min={0}
                    max={100}
                    step={1}
                    field={true}
                />
            </SettingItemFrame>
            <SettingItemFrame title="maxsection_pct">
                <SettingSlider
                    value={config.maxsection_pct}
                    onChange={(v) => { update({ ...config, maxsection_pct: v }) }}
                    min={0}
                    max={10000}
                    step={1}
                    field={true}
                />
            </SettingItemFrame>
            <SettingItemFrame title="scd">
                <Switch
                    checked={config.scd}
                    onChange={(e) => { update({ ...config, scd: e.target.checked }) }}
                />
            </SettingItemFrame>
            <SettingItemFrame title="CRF" desc="Constant Rate Factor, lower is better quality.">
                <SettingSlider
                    value={config.crf}
                    onChange={(v) => { update({ ...config, crf: v }) }}
                    min={-1}
                    max={36}
                    step={1}
                    field
                />
            </SettingItemFrame>
            <SettingItemFrame title="cpu_used" desc="Encoding quality, lower is slower but better quality.">
                <SettingSlider
                    value={config.cpu_used}
                    onChange={(v) => { update({ ...config, cpu_used: v }) }}
                    min={0}
                    max={16}
                    step={1}
                    field
                />
            </SettingItemFrame>
        </Box>
    );
}