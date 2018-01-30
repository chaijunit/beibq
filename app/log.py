#coding: utf-8
import logging, os
from logging.handlers import RotatingFileHandler


def init_logging(app):
    formatter = logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s '
            '[in %(pathname)s:%(lineno)d]')
    error_log = os.path.join(app.root_path, app.config["ERROR_LOG"])
    error_file_handler = RotatingFileHandler(
        error_log,
        maxBytes = 1024*1024*1024,
        backupCount = 10
    )
    error_file_handler.setLevel(logging.ERROR)
    error_file_handler.setFormatter(formatter)
    app.logger.addHandler(error_file_handler)

    info_log = os.path.join(app.root_path, app.config["INFO_LOG"])
    info_file_handler = RotatingFileHandler(
        info_log,
        maxBytes = 1024*1024*1024,
        backupCount = 10
    )
    info_file_handler.setLevel(logging.INFO)
    info_file_handler.setFormatter(formatter)
    app.logger.addHandler(info_file_handler)

    app.logger.setLevel(logging.DEBUG)


