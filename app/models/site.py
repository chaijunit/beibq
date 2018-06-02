#coding: utf-8
from app.models.model import *
from sqlalchemy.dialects.mysql import LONGTEXT


PREFIX = "site_"


class SiteMeta(db.Model):
    """ Site table """
    __tablename__ = db.PREFIX + PREFIX + "meta"
    __table_args__ = {
        "mysql_engine": "InnoDB",
        "mysql_charset": "utf8"
    }
    id = db.Column(db.Integer, primary_key = True, nullable = False)
    name = db.Column(db.String(255), nullable = False, index = True)
    value = db.deferred(db.Column(LONGTEXT, default="", nullable = False))

    @staticmethod
    def add(data):
        for name, value in data.items():
            meta = SiteMeta.query.filter_by(name=name).first()
            if meta is not None:
                continue
            meta = SiteMeta(name=name, value=value)
            db.session.add(meta)
        db.session.commit()

    @staticmethod
    def setting(data):
        for name, value in data.items():
            meta = SiteMeta.query.filter_by(name=name).first()
            if not meta:
                meta = SiteMeta(name=name, value=value)
                db.session.add(meta)
                return
            meta.value = value
        db.session.commit()

    @staticmethod
    def all():
        return SiteMeta.query.all()


