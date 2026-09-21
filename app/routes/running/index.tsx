import { Box, Divider } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import type { ApiRunning } from "~/models/running";
import { api } from "~/hooks/api";
import { pushError } from "~/components/error_popout";
import { getLocalStorage } from "~/hooks/storage";
import { NoContent } from '~/components/no_content';
import { TaskControl, LineProgress } from './component';
import VideoRunningProgress from './video';
import AudioRunningProgress from './audio';
import WhisperProgress from './whisper';
import LLMRunningProgress from './llm';
import ImageRunningProgress from './image';


export default function Running() {
    const apiUrl = getLocalStorage("apiUrl", "local");

    const [info, setInfo] = useState<ApiRunning | null>(null);

    useQuery({
        queryKey: ["running"],
        queryFn: async () => {
            try {
                const data = await api.get(`${apiUrl}/task/running`).json<ApiRunning | null>();
                setInfo(data);
            }
            catch (error) {
                pushError(error, "Running tasks");
            }
            return null;
        },
        retry: 0,
        refetchInterval: 500,
        refetchIntervalInBackground: false,
    })

    if (!info) { return (<NoContent title="running" />) }

    return (
        <Box sx={{
            display: "flex",
            justifyContent: "start",
            alignItems: "start",
            flexDirection: "column",
            height: "100%",
            width: "100%",
            gap: 1,
            p: 3,
        }}>
            <TaskControl
                title={`${info.type[0].toUpperCase() + info.type.slice(1)} Running`}
                llm={info.type === "llm"}
            />
            <Divider flexItem sx={{ my: 1 }} />

            <Box sx={{
                display: "flex",
                width: "100%",
                gap: 1,
                flex: 1,
                minHeight: 0,
            }}>
                {info.type === "video" && <VideoRunningProgress info={info} />}
                {info.type === "audio" && <AudioRunningProgress info={info} />}
                {info.type === "whisper" && <WhisperProgress info={info} />}
                {info.type === "llm" && <LLMRunningProgress info={info} />}
                {info.type === "image" && <ImageRunningProgress info={info} />}
            </Box>

            {info.type !== "image" &&
                <Box sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    width: "100%",
                    px: 3,
                }}>
                    <LineProgress progress={info.progress} cpu={info.cpu_usage} ram={info.ram_usage} />
                </Box>
            }
        </Box>
    );
}