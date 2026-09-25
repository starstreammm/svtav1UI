import { Box, Typography, type TypographyVariant } from "@mui/material";

import type { VideoInfo, VideoTranscodeArgs, ImageInfo, ImageTranscodeArgs } from "~/models/task";
import { Rotate } from "~/models/const";
import type { TranscodeSettings } from "~/models/settings";



export function TaskInfoItemBase({ content, size = "body2", pl }: {
    content: [string, string | number][];
    size?: TypographyVariant;
    pl?: number;
}) {
    return (
        <>
            {content.map(([key, value]) =>
                <Typography
                    key={key}
                    variant={size}
                    sx={{
                        overflowWrap: "anywhere",
                        wordBreak: "break-all",
                        textIndent: "3em hanging",
                        pl: pl,
                    }}
                >
                    <Box component="b" sx={{ color: "secondary.dark" }}>{key}:</Box> {value}
                </Typography>
            )}
        </>
    );
}


export function VideoInfoComponent({ video, index }: { video: VideoInfo, index?: number }) {
    return (
        <>
            {index !== undefined &&
                <Typography variant="h6" gutterBottom color='primary' sx={{ mt: index === 0 ? 0 : 1 }}>
                    <b>File {index > 0 ? `No. ${index}` : ""}</b>
                </Typography>
            }
            <TaskInfoItemBase size="body1" content={[
                ["Name", video.path.split("/").slice(-1)[0]],
                ["Path", video.path],
                ["Size", `${(video.size / 1024 / 1024).toFixed(2)} MB`],
                ["Codec", video.codec],
                ["Width", video.width],
                ["Height", video.height],
                ["SAR", video.sar],
                ["Pixel Format", video.pix_fmt],
                ["Color Info", `s: ${video.color_space}; t: ${video.color_transfer}; p: ${video.color_primaries}`],
                ["Bit Rate", `${(video.bit_rate / 1000 / 1000).toFixed(2)} Mbps`],
                ["Frame Rate", `${video.frame_rate} fps`],
                ["Duration", `${Math.floor(video.duration / 60)} min ${Math.floor(video.duration % 60)} sec`],
                ["Audio Bit Rate", `${(video.audio_bit_rate / 1000).toFixed(2)} kbps`]
            ]} />
        </>
    );
}

export function VideoArgsComponent({ size, task }: {
    size?: TypographyVariant;
    task: VideoTranscodeArgs;
}) {
    return (
        <TaskInfoItemBase size={size} content={[
            ["Video Bit Rate", `${(task.video_br / 1000 / 1000).toFixed(2)} Mbps`],
            ["Audio Bit Rate", `${(task.audio_br / 1000).toFixed(2)} kbps`],
            ["Pixel Format", task.pix_fmt],
            ["SAR Fix", task.sar_fix === "" ? "N/A" : task.sar_fix],
            ["Zscale", task.zscale],
            ["Rotate", task.rotate ? Rotate[task.rotate] : "None"],
        ]} />
    );
}

export function ImageInfoComponent({ image, index }: { image: ImageInfo, index?: number }) {
    return (
        <>
            {index !== undefined &&
                <Typography color='primary' sx={{ mt: index === 0 ? 0 : 1 }}>
                    <b>File {index > 0 ? index : ""}</b>
                </Typography>
            }
            <TaskInfoItemBase size="body1" content={[
                ["Name", image.path.split("/").slice(-1)[0]],
                ["Path", image.path],
                ["Output Name", image.output_name],
                ["Size", `${(image.size / 1024 / 1024).toFixed(2)} MB`],
                ["Width", image.width],
                ["Height", image.height],
                ["SAR", image.sar],
                ["Pixel Format", image.pix_fmt],
                ["Color Info", `s: ${image.color_space}; t: ${image.color_transfer}; p: ${image.color_primaries}`],
                ["SAR Fix", image.sar_fix === "" ? "N/A" : image.sar_fix],
                ["Zscale", image.zscale],
            ]} />
        </>
    );
}

export function ImageArgsComponent({ size, args }: {
    size?: TypographyVariant;
    args: ImageTranscodeArgs;
}) {
    return (
        <TaskInfoItemBase size={size} content={[
            ["CRF", args.crf],
            ["cpu_used", args.cpu_used],
        ]} />
    );
}

export function SettingsInfoComponent({ size, settings }: {
    size?: TypographyVariant;
    settings: TranscodeSettings;
}) {
    return (
        <TaskInfoItemBase size={size} content={[
            ["Overwrite", settings.overwrite ? "On" : "Off"],
            ["Delete Source", settings.delete_source ? "On" : "Off"],
            ["Retry", `${settings.retry} times`],
        ]} />
    );
}