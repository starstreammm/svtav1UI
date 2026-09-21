import {
    Box,
    Divider,
    Tooltip,
    Typography,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    TextField,
} from '@mui/material';
import AdjustRoundedIcon from '@mui/icons-material/AdjustRounded';
import { useState, useEffect } from "react";

import type { TranslatorSettings } from "~/models/settings";
import { SettingItemFrame, SettingTitleFrame } from "~/routes/settings/components/frame";
import { SettingSlider } from "~/routes/settings/components/slider";
import PathSelector from "~/components/pathselector";
import { fetchTranslatorSettings, updateTranslatorSettings, checkLLM } from "./function";
import { defaultLLMConfig } from "./default";

function split_llm_key(current: string) {
    const parts = current.split(";");
    while (parts.length < 3) {
        parts.push("");
    }
    return [parts[0], parts[1], parts[2]] as const;
}


export function LLMSettingPage({ embedded = false }: { embedded?: boolean }) {
    // @ts-expect-error
    const [config, setConfig] = useState<TranslatorSettings>(defaultLLMConfig as TranslatorSettings);
    const [state, setState] = useState<boolean>(false);

    const check = () => { checkLLM().then(data => { setState(data); }) }
    const fetch = () => { fetchTranslatorSettings().then(data => setConfig(data)) }
    const update = (s: TranslatorSettings) => { updateTranslatorSettings(s).then(data => setConfig(data)) }

    useEffect(() => { fetch(); check(); }, []);
    useEffect(() => { check(); }, [config.llm_key]);

    return (
        <Box sx={{ display: "flex", flexDirection: "column", width: "100%", px: 3 }}>
            {!embedded &&
                <>
                    <SettingTitleFrame title="LLM Settings" reset={() => update({ ...config, ...defaultLLMConfig })}>
                        <Tooltip title={"The status of the translator service"} placement="top">
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <AdjustRoundedIcon sx={{ color: state ? "success.main" : "error.main" }} />
                                <Typography variant="body1">
                                    State
                                </Typography>
                            </Box>
                        </Tooltip>
                    </SettingTitleFrame>
                    <Divider />
                </>
            }
            <SettingItemFrame title="LLM Type">
                <FormControl>
                    <InputLabel>LLM Type</InputLabel>
                    <Select
                        value={config.llm_type}
                        label="LLM Type"
                        onChange={(e) => update({ ...config, llm_type: e.target.value as "openai-api" | "llama.cpp" | "mlx" })}
                        sx={{ width: 188 }}
                    >
                        <MenuItem value={"openai-api"}>OpenAI API</MenuItem>
                        <MenuItem value={"llama.cpp"}>Llama.cpp</MenuItem>
                        <MenuItem value={"mlx"}>MLX</MenuItem>
                    </Select>
                </FormControl>
            </SettingItemFrame>
            <SettingItemFrame title={config.llm_type === "openai-api" ? "OpenAI API Key" : "Model Path"}>
                {config.llm_type === "openai-api"
                    ?
                    <Box sx={{ display: "flex", flexDirection: "row", gap: 3 }}>
                        <TextField
                            label="Base URL"
                            value={split_llm_key(config.llm_key || "")[0]}
                            onChange={(e) => update({
                                ...config, llm_key: `${e.target.value}; ${split_llm_key(config.llm_key || "")[1]
                                    };${split_llm_key(config.llm_key || "")[2]} `
                            })}
                            sx={{ width: 188 }}
                        />
                        <TextField
                            label="API Key"
                            value={split_llm_key(config.llm_key || "")[1]}
                            onChange={(e) => update({ ...config, llm_key: `${split_llm_key(config.llm_key || "")[0]};${e.target.value};${split_llm_key(config.llm_key || "")[2]} ` })}
                            sx={{ width: 188 }}
                        />
                        <TextField
                            label="Model"
                            value={split_llm_key(config.llm_key || "")[2]}
                            onChange={(e) => update({ ...config, llm_key: `${split_llm_key(config.llm_key || "")[0]};${split_llm_key(config.llm_key || "")[1]};${e.target.value} ` })}
                            sx={{ width: 188 }}
                        />
                    </Box>
                    :
                    <Box sx={{ width: 513 }}>
                        <PathSelector
                            label="Model Path"
                            value={config.llm_key}
                            onClose={(value) => update({ ...config, llm_key: value })}
                            onEnter={(value) => update({ ...config, llm_key: value })}
                            type="dir"
                        />
                    </Box>
                }
            </SettingItemFrame>
            {config.llm_type === "openai-api" &&
                <SettingItemFrame title="Max Tokens">
                    <SettingSlider
                        value={config.max_tokens}
                        min={500}
                        max={32000}
                        step={100}
                        onChange={(value) => update({ ...config, max_tokens: value })}
                        field={true}
                    />
                </SettingItemFrame>
            }
            <SettingItemFrame title="Max Input Length (in Characters)">
                <SettingSlider
                    value={config.max_input}
                    min={30}
                    max={8000}
                    step={10}
                    onChange={(value) => update({ ...config, max_input: value })}
                    field={true}
                />
            </SettingItemFrame>
            <SettingItemFrame title="Temperature">
                <SettingSlider
                    value={config.temperature}
                    min={0.0}
                    max={2.0}
                    step={0.01}
                    onChange={(value) => update({ ...config, temperature: value })}
                    field={true}
                />
            </SettingItemFrame>
            <SettingItemFrame title="Prompt" desc="Prompt at the start of the conversation, used to guide the model's behavior. Don't modify this unless you know what you're doing.">
                <TextField
                    disabled={embedded}
                    multiline
                    value={JSON.stringify(config.prompt, null, 4)}
                    onChange={(e) => {
                        try {
                            const parsed = JSON.parse(e.target.value);
                            if (Array.isArray(parsed)) {
                                update({ ...config, prompt: parsed });
                            }
                        } catch (error) {
                            // Invalid JSON, do nothing
                        }
                    }}
                    sx={{ width: "83%" }}
                />
            </SettingItemFrame>
        </Box>
    );
}


export default function LLMSettingsPage() {
    return <LLMSettingPage />;
}