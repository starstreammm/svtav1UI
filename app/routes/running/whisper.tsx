import { Grid, Typography, Divider } from "@mui/material";

import type { WhisperRunning } from "~/models/running";
import { NobarOverflow } from "~/components/frame";
import { LogsProgress } from "./component";


export default function WhisperProgress({ info }: { info: WhisperRunning }) {
    return (
        <Grid container spacing={1}>
            <Grid size={3}>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold" }}>
                    Progress Info
                </Typography>
                <NobarOverflow gap={1}>
                    {[
                        "Input:",
                        info.input,
                        "Output:",
                        info.output,
                        "Destination Language:",
                        info.subtitle,
                    ].map((text, index) =>
                        <Typography key={index} variant="body1" sx={{ ml: index % 2 === 0 ? 0 : 3 }}>
                            {index % 2 === 0 ? <b>{text}</b> : text}
                        </Typography>)
                    }
                </NobarOverflow>
            </Grid>
            <Divider orientation="vertical" />
            <Grid size={9}>
                <LogsProgress title="Whisper Logs" newLogs={info.log} />
            </Grid>
        </Grid>
    );
}