import sqlite3
from contextlib import contextmanager
import os

# SQLite DB 경로 (프로젝트 루트의 theqoo.db)
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'theqoo.db')


def dict_factory(cursor, row):
    """SQLite 결과를 딕셔너리로 변환"""
    fields = [column[0] for column in cursor.description]
    return dict(zip(fields, row))


@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = dict_factory
    try:
        yield conn
    finally:
        conn.close()
