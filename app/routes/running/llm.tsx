import { Grid, Typography, Divider } from "@mui/material";

import type { LLMRunning } from "~/models/running";
import { NobarOverflow } from "~/components/frame";
import { LogsProgress } from "./component";



export default function LLMRunningProgress({ info }: { info: LLMRunning }) {
    return (
        <Grid container spacing={1}>
            <Grid size={3}>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold" }}>
                    Progress Info
                </Typography>
                <NobarOverflow gap={1}>
                    {([
                        ["Input", info.input],
                        ["Output", info.output],
                        ["Original Language", info.args.original],
                        ["Destination Language", info.args.destination],
                        ["Start Time", new Date(info.start_time).toLocaleString()],
                        ["Consumed Time", info.consumed_time],
                    ] as [string, string | number][]).map(([key, value]) => (
                        <Typography key={key} sx={{
                            overflowWrap: "anywhere",
                            wordBreak: "break-all",
                            pl: 3,
                        }}>
                            <b>{key}:</b> {value}
                        </Typography>
                    ))}
                </NobarOverflow>
            </Grid>
            <Divider orientation="vertical" />
            <Grid size={9}>
                <LogsProgress title="LLM Logs" newLogs={info.log} />
            </Grid>
        </Grid>
    );
}