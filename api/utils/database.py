import sqlite3
from models import *

DB_PATH = DATA_PATH / "config.db"

TABLES = {
    "waiting": {
        "uid": "INTEGER PRIMARY KEY AUTOINCREMENT",
        "sort": "REAL NOT NULL",
        "eta": "TEXT NOT NULL",
        "input": "TEXT NOT NULL",
        "output": "TEXT NOT NULL",
        "args": "TEXT NOT NULL",
        "settings": "TEXT NOT NULL",
        "retry": "INTEGER NOT NULL DEFAULT 0",
        "error": "TEXT NOT NULL DEFAULT '[]'",
    },
    "llm_waiting": {
        "uid": "INTEGER PRIMARY KEY AUTOINCREMENT",
        "input": "TEXT NOT NULL",
        "output": "TEXT NOT NULL",
        "args": "TEXT NOT NULL",
    },
    "failed": {
        "uid": "INTEGER PRIMARY KEY AUTOINCREMENT",
        "input": "TEXT NOT NULL",
        "output": "TEXT NOT NULL",
        "args": "TEXT NOT NULL",
        "settings": "TEXT",
        "error": "TEXT NOT NULL",
        "time": "TEXT NOT NULL",
    },
    "completed": {
        "type": "TEXT NOT NULL",
        "input": "TEXT NOT NULL",
        "output": "TEXT NOT NULL",
        "args": "TEXT NOT NULL",
        "total_consumed": "INTEGER NOT NULL",
        "finished_time": "TEXT NOT NULL",
    },
    "video_history": {
        "uid": "INTEGER PRIMARY KEY AUTOINCREMENT",
        "total_consumed": "INTEGER NOT NULL",
        "codec": "INTEGER NOT NULL",
        "pixel_count": "INTEGER NOT NULL",
        "frame_count": "INTEGER NOT NULL",
        "subtitle": "INTEGER NOT NULL",
        "preset": "INTEGER NOT NULL",
        "target_bit_rate": "INTEGER NOT NULL",
        "lookahead": "INTEGER NOT NULL",
        "keyint": "INTEGER NOT NULL",
        "scd": "INTEGER NOT NULL",
    },
    "image_history": {
        "uid": "INTEGER PRIMARY KEY AUTOINCREMENT",
        "total_consumed": "TEXT NOT NULL",
        "pixel_count": "INTEGER NOT NULL",
        "cpu_used": "INTEGER NOT NULL",
    },
    "settings": {
        "key": "TEXT PRIMARY KEY",
        "value": "TEXT",
    },
}


class Database:
    _database = None
    _cursor = None

    @classmethod
    def init(cls):
        # Connect to the database
        cls._database = sqlite3.connect(DB_PATH.resolve())
        cls._database.row_factory = sqlite3.Row
        cls._cursor = cls._database.cursor()

        # Create tables if not exist
        for table_name, columns in TABLES.items():
            row = cls.fetchone(
                "SELECT name FROM sqlite_master WHERE type='table' AND name=?;",
                table_name,
            )
            if row is None:
                cls.execute(
                    f"CREATE TABLE {table_name} ({', '.join(f'{name} {col_type}' for name, col_type in columns.items())});"
                )

        # Rerank waiting tasks based on sort value
        cls.execute(
            """
                WITH ranked AS (
                    SELECT
                        uid,
                        ROW_NUMBER() OVER (ORDER BY sort, uid) * 1000 AS new_sort
                    FROM waiting
                )
                UPDATE waiting
                SET sort = (
                    SELECT new_sort
                    FROM ranked
                    WHERE ranked.uid = waiting.uid
                );
            """,
        )

        # Commit changes
        cls._database.commit()

    @classmethod
    def fetchall(cls, sql: str, *args):
        if cls._cursor is None:
            raise Exception("Database not initialized")
        cls._cursor.execute(sql, args)
        return cls._cursor.fetchall()

    @classmethod
    def execute(cls, sql: str, *args):
        if cls._cursor is None or cls._database is None:
            raise Exception("Database not initialized")
        cls._cursor.execute(sql, args)
        cls._database.commit()

    @classmethod
    def fetchone(cls, sql: str, *args):
        if cls._cursor is None:
            raise Exception("Database not initialized")
        cls._cursor.execute(sql, args)
        return cls._cursor.fetchone()

    @classmethod
    def close(cls):
        if cls._database is not None:
            cls._database.commit()
            cls._database.close()
            cls._database = None
            cls._cursor = None
