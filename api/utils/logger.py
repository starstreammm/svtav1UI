import logging
import sys
from logging.handlers import TimedRotatingFileHandler
from models import DATA_PATH

LOG_PATH = DATA_PATH / "logs"
LOG_PATH.mkdir(parents=True, exist_ok=True)


class LoggerMeta(type):

    def __getattr__(cls, name):
        if cls._log is None:
            raise RuntimeError("Logger not initialized.")

        return getattr(cls._log, name)


class LoggerBase(metaclass=LoggerMeta):
    _log: logging.Logger | None = None

    @classmethod
    def init(cls) -> None:
        # Get logger
        cls._log = logging.getLogger("main_log")
        cls._log.setLevel(logging.DEBUG)

        # File Handler
        file_handler = TimedRotatingFileHandler(
            LOG_PATH / "main.log",
            when="midnight",
            interval=1,
            backupCount=7,
            encoding="utf-8",
        )
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(
            logging.Formatter(
                "{asctime}-{levelname:^7}-{filename}-{lineno} : {message}",
                style="{",
                datefmt=r"%Y-%m-%d %H:%M:%S",
            )
        )
        cls._log.addHandler(file_handler)

        # Stderr handler
        stderr_handler = logging.StreamHandler(sys.stderr)
        stderr_handler.setLevel(logging.ERROR)
        stderr_handler.setFormatter(
            logging.Formatter("{levelname:^7}:     {message}", style="{")
        )
        cls._log.addHandler(stderr_handler)

        # Stdout handler
        stdout_handler = logging.StreamHandler(sys.stdout)
        stdout_handler.setLevel(logging.INFO)
        stdout_handler.setFormatter(
            logging.Formatter("{levelname:^7}:     {message}", style="{")
        )
        cls._log.addHandler(stdout_handler)
