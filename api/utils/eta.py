import pandas as pd
from xgboost import XGBRegressor

from models import *
from utils.database import Database as db
from utils.logger import LoggerBase as lg


class ETA:
    video_model = None
    image_param = 0.0

    @classmethod
    def init(cls):
        cls.train_video_model()
        cls.cal_image_param()

    @classmethod
    def get_eta(cls, data: VideoETAInfo | ImageETAInfo) -> int:
        if isinstance(data, VideoETAInfo):
            if cls.video_model is None:
                return -1

            X = pd.DataFrame([data.model_dump()])
            lg.debug(
                f"Predicting Video ETA: features: {data.model_dump()} -> {int(cls.video_model.predict(X)[0])}"
            )

            return int(cls.video_model.predict(X)[0])

        else:
            if cls.image_param == 0:
                return -1

            return int(sum(data.pixel_count) / data.cpu_used * cls.image_param)

    @classmethod
    def get_info(
        cls,
        task: VideoTaskInfo | ImageTaskInfo,
    ) -> VideoETAInfo | ImageETAInfo:
        if isinstance(task, ImageTaskInfo):
            rtn = ImageETAInfo(
                pixel_count=[f.width * f.height for f in task.input],
                cpu_used=task.args.cpu_used,
            )
            lg.debug(f"Extracted Image ETA {task.input[0].path}: {rtn.model_dump()}")
            return rtn

        else:
            rtn = VideoETAInfo(
                codec=CODEC_ID.get(task.input[0].codec, -1),
                pixel_count=task.input[0].width * task.input[0].height,
                frame_count=int(
                    task.input[0].frame_rate * sum(f.duration for f in task.input)
                ),
                subtitle=task.args.subtitle is not None,
                preset=task.settings.preset,
                target_bit_rate=task.args.video_br,
                lookahead=task.settings.lookahead,
                keyint=(
                    int(task.settings.keyint.replace("s", ""))
                    * int(task.input[0].frame_rate)
                ),
                scd=task.settings.scd,
            )
            lg.debug(f"Extracted Video ETA {task.input[0].path}: {rtn.model_dump()}")
            return rtn

    @classmethod
    def train_video_model(cls):
        record: list[VideoHistory] = []

        rows = db.fetchall("SELECT * FROM video_history;")
        if len(rows) <= 8:
            lg.error("Not enough data to train ETA model.")
            return
        for row in rows:
            record.append(VideoHistory.model_validate(dict(row)))

        df = pd.DataFrame([r.model_dump() for r in record])
        df["codec"] = df["codec"].map(CODEC_ID)
        X = df.drop(columns=["total_consumed"])
        y = df["total_consumed"]

        if len(X) < 888:
            cls.video_model = XGBRegressor(
                objective="reg:squarederror",
                eval_metric="mape",
                n_jobs=-1,
                n_estimators=64,
                max_depth=4,
                learning_rate=0.15,
                subsample=0.9,
                colsample_bytree=0.9,
                tree_method="hist",
                min_child_weight=2,
                reg_lambda=1.0,
                random_state=42,
            )
        else:
            cls.video_model = XGBRegressor(
                objective="reg:squarederror",
                eval_metric="mape",
                n_jobs=-1,
                n_estimators=300,
                max_depth=6,
                learning_rate=0.05,
                subsample=0.8,
                colsample_bytree=0.8,
                tree_method="hist",
                random_state=42,
            )
        cls.video_model.fit(X, y)
        lg.info(f"Trained Video ETA model with {len(X)} samples.")

    @classmethod
    def insert_video_history(cls, eta_info: VideoETAInfo, consumed_time: int):
        if eta_info.target_bit_rate <= 0:
            lg.debug(f"Skipping history insertion due to target_bit_rate <= 0")
            return

        data = VideoHistory(
            total_consumed=consumed_time,
            **eta_info.model_dump(),
        ).model_dump(exclude={"uid"})

        db.execute(
            f"""
                    INSERT INTO video_history
                    ({", ".join(data.keys())})
                    VALUES ({", ".join("?" * len(data))});
                """,
            *data.values(),
        )

    @classmethod
    def insert_image_history(
        cls,
        file_info: ImageInfo,
        args: ImageTranscodeArgs,
        consumed_time: int,
    ):
        db.execute(
            """
                    INSERT INTO image_history
                    (total_consumed, pixel_count, cpu_used)
                    VALUES (?, ?, ?);
                """,
            consumed_time,
            file_info.width * file_info.height,
            args.cpu_used,
        )

    @classmethod
    def cal_image_param(cls):
        rows = db.fetchall("SELECT * FROM image_history;")
        if len(rows) <= 8:
            lg.error("Not enough data to calculate Image ETA parameter.")
            return
        record: list[ImageHistory] = []
        for row in rows:
            record.append(ImageHistory.model_validate(dict(row)))

        df = pd.DataFrame([r.model_dump() for r in record])
        df["param"] = df["total_consumed"] / df["pixel_count"] * df["cpu_used"]
        cls.image_param = df["param"].median()
        lg.info(f"Calculated Image ETA parameter with {len(record)} samples.")
