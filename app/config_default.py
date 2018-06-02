#coding:utf-8

class Config(object):
    DEBUG = False
    SECRET_KEY = 'this is secret string'

    SQLALCHEMY_COMMIT_ON_TEARDOWN = True

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # catalog max depth
    CATALOG_DEEP = 3
    ERROR_LOG = "../logs/error.log"
    INFO_LOG = "../logs/info.log"

    DB_PREFIX = "bb_"
    PER_PAGE = 20

    STATIC_IMG_PATH = "img"

    AVATAR_PATH = "resource/image/avatar"
    TMP_PATH = "resource/tmp"
    IMAGE_PATH = "resource/image/image"

    BOOK_COVER_PATH = "resource/image/cover"



