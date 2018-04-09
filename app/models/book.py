#coding: utf-8
from datetime import datetime
from flask import current_app
from bs4 import BeautifulSoup
from app.models.model import *
from app.models.user import User
from app.includes import file
from sqlalchemy.dialects.mysql import LONGTEXT
from sqlalchemy.orm import load_only
from sqlalchemy import func


PREFIX="book_"


class Book(db.Model):
    __table_args__ = {
        "mysql_engine": "InnoDB",
        "mysql_charset": "utf8"
    }
    __tablename__ = db.PREFIX + PREFIX + "book"

    id = db.Column(db.Integer, primary_key = True, nullable=False)
    name = db.Column(db.String(255), default="", nullable=False, index=True)
    access = db.Column(db.Integer, default=1, nullable=False, index=True)
    status = db.Column(db.Integer, default=0, nullable=False, index=True)       # publish status
    brief = db.deferred(db.Column(db.Text, default="", nullable=False))
    select_catalog = db.Column(db.Integer, default=0, nullable=False)
    publish_timestamp = db.Column(db.DateTime, default=datetime.now, nullable=False, index=True)
    updatetime = db.Column(db.DateTime, default = datetime.now, nullable=False, index=True)
    timestamp = db.Column(db.DateTime, default = datetime.now, nullable=False, index=True)
    cover = db.Column(db.String(255), default="", nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey(User.__tablename__+".id", 
        ondelete="CASCADE", onupdate="CASCADE"), nullable=False)

    catalogs = db.relationship("BookCatalog", backref="book", lazy="dynamic", passive_deletes=True)
    images = db.relationship("BookImage", backref="book", lazy="select", passive_deletes=True)

    @staticmethod
    def add(name, brief, access, user_id):
        book = Book(name=name, access=access, user_id=user_id)
        db.session.add(book)
        db.session.commit()
        return book

    @staticmethod
    def get(id):
        return Book.query.filter_by(id=id).first()

    @staticmethod
    def create_subquery(sub_type, user_id = None):
        if sub_type == "last_catalog":
            return db.session.query(
                    Book.id,
                    func.max(BookCatalog.publish_order).label("order")
                ).outerjoin(
                    BookCatalog, 
                    db.and_(
                        BookCatalog.book_id==Book.id,
                        BookCatalog.status==1
                    )
                ).group_by(Book.id).subquery("order")

    @staticmethod
    def page(page, per_page):
        books = Book.query.options(db.Load(Book).undefer("brief"))\
            .order_by(Book.timestamp.desc())\
            .paginate(page, per_page=per_page, error_out = False)
        return books
    
    @staticmethod
    def info(id):
        return Book.query.filter_by(id=id)\
            .options(db.undefer("brief")).first()

    def setting(self, name, brief, access):
        self.name = name
        self.brief = brief
        self.access = access

    def _deep_catalogs(self, catalogs, catalog_dict):
        for catalog in catalogs:
            catalog.catalogs = self._deep_catalogs(
                    self._sort_catalogs(catalog_dict.get(catalog.id, [])),
                    catalog_dict)
        return catalogs

    def _sort_catalogs(self, catalogs):
        return sorted(catalogs, key=lambda x: x.pos)

    def tree_catalogs(self):
        catalogs = self.catalogs.options(load_only("title", 
            "parent_id", "pos", "is_dir", "book_id")).all()
        catalog_dict = {}
        for catalog in catalogs:
            if not catalog_dict.has_key(catalog.parent_id):
                catalog_dict[catalog.parent_id] = []
            catalog_dict[catalog.parent_id].append(catalog)
        return self._deep_catalogs(
                self._sort_catalogs(catalog_dict.get(0, [])), catalog_dict)

    def origin_cover(self):
        image_path = current_app.config["BOOK_COVER_PATH"]
        return "/".join([image_path, self.cover])

    def thumbnail_cover(self):
        image_path = current_app.config["BOOK_COVER_PATH"]
        return "/".join([image_path, "thumbnail_{}".format(self.cover)])

    def publish(self):
        now = datetime.now()
        self.catalog_publish(now)
        self.status = 1
        self.publish_timestamp = now

    def catalog_publish(self, date):
        catalogs = BookCatalog.query.filter(BookCatalog.book_id == self.id)\
            .filter(BookCatalog.updatetime > self.publish_timestamp).options(
                db.undefer("markdown").undefer("html")\
                .undefer("publish_markdown").undefer("publish_html")
            ).all()
        max_order = BookCatalog.max_order(self.id)
        max_catalog = None
        for catalog in catalogs:
            catalog.publish_markdown = catalog.markdown
            catalog.publish_html = catalog.html
            catalog.publish_timestamp = date
            if len(catalog.publish_markdown) > 10:
                catalog.set_abstract()
                if catalog.first_publish==catalog.timestamp:
                    catalog.first_publish = date
                if not catalog.publish_order:
                    max_order += 1
                    catalog.publish_order = max_order
                catalog.status = 1
            else:
                catalog.status = 0

    def delete_cover(self):
        if not self.cover:
            return
        file.delete_cover(self.cover)

    def delete(self):
        for image in self.images:
            image.delete()
        for catalog in self.catalogs:
            catalog.delete()
        self.delete_cover()
        db.session.delete(self)


class BookCatalog(db.Model):
    __table_args__ = {
        "mysql_engine": "InnoDB",
        "mysql_charset": "utf8"
    }
    __tablename__ = db.PREFIX+PREFIX+"catalog"
    id = db.Column(db.Integer, primary_key = True, nullable=False)
    title = db.Column(db.String(255), default="", nullable=False, index=True)
    markdown = db.deferred(db.Column(LONGTEXT, default="", nullable=False))
    html = db.deferred(db.Column(LONGTEXT, default="", nullable=False))
    publish_markdown = db.deferred(db.Column(LONGTEXT, default='', nullable=False))
    publish_html = db.deferred(db.Column(LONGTEXT, default='', nullable=False))
    status = db.Column(db.Integer, default=0, nullable = True, index = True)
    abstract = db.deferred(db.Column(db.String(255), default=""))
    publish_order = db.Column(db.Integer, default=0, nullable=True, index = True)
    pos = db.Column(db.Integer, default=0, nullable=False, index=True)
    parent_id = db.Column(db.Integer, default = 0, nullable=False, index=True)
    is_dir = db.Column(db.Boolean, default = False, nullable=False, index=True)
    publish_timestamp = db.Column(db.DateTime, default=datetime.now, nullable=False, index = True)
    first_publish = db.Column(db.DateTime, default=datetime.now, nullable=False, index = True)
    updatetime = db.Column(db.DateTime, default = datetime.now, nullable=False, index=True)
    timestamp = db.Column(db.DateTime, default = datetime.now, nullable=False, index=True)

    book_id = db.Column(db.Integer, db.ForeignKey(Book.__tablename__+".id", 
        ondelete="CASCADE", onupdate="CASCADE"), nullable=False)

    @staticmethod
    def add(book_id, title, parent_id=0, is_dir=False):
        parent_id = 0 if parent_id is None else int(parent_id)
        if parent_id != 0:
            if not BookCatalog.get(parent_id):
                return
        catalog = BookCatalog(
            title = title,
            is_dir = is_dir,
            book_id=book_id,
        )
        if parent_id:
            catalog.parent_id = parent_id
        catalog.pos = BookCatalog.max_pos(book_id, parent_id) + 1
        db.session.add(catalog)
        db.session.commit()
        catalog.book.updatetime = datetime.now()
        return catalog

    @staticmethod
    def get(id):
        return BookCatalog.query.filter_by(id=id).first()

    @staticmethod
    def get_deep(id=None):
        """ 返回目录深度 """
        if not id:
            return 1
        else:
            catalog = BookCatalog.query.filter_by(id=id).first()
            if not catalog:
                return 0
            return BookCatalog.get_deep(catalog.parent_id)+1

    @staticmethod
    def reader(book_id, id=None):
        catalog = BookCatalog.query.filter_by(book_id=book_id)\
            .options(db.undefer("publish_html"))
        if id:
            catalog = catalog.filter_by(id=id)
        else:
            catalog = catalog.filter_by(parent_id=0)\
                .order_by(BookCatalog.pos)
        return catalog.first()

    @staticmethod
    def page(page, per_page):
        last_catalog = Book.create_subquery("last_catalog")
        catalogs = db.session.query(Book, BookCatalog)\
            .outerjoin(last_catalog, last_catalog.c.id==Book.id)\
            .outerjoin(BookCatalog, db.and_(
                BookCatalog.book_id==Book.id,
                BookCatalog.publish_order==last_catalog.c.order))\
            .options(
                db.Load(Book).undefer("brief"),
                db.Load(BookCatalog).undefer("abstract"))\
            .filter(db.and_(
                Book.access==1,
                last_catalog.c.order.isnot(None)))\
            .order_by(BookCatalog.first_publish.desc())
        return paginate(catalogs, page, per_page=per_page, error_out=False)

    @staticmethod
    def max_pos(book_id, id=0):
        if id:
            catalogs = BookCatalog.query.filter_by(parent_id=id).filter_by(
                book_id=book_id).all()
        else:
            catalogs = BookCatalog.query.filter(db.and_(BookCatalog.book_id==book_id,
                BookCatalog.parent_id==0)).all()
        if catalogs:
            return max([catalog.pos for catalog in catalogs])
        return 0

    @staticmethod
    def max_order(book_id):
        catalog = BookCatalog.query.filter(BookCatalog.book_id==book_id)\
            .order_by(BookCatalog.publish_order.desc()).first()
        return 0 if catalog is None else catalog.publish_order

    @staticmethod
    def prev(catalog):
        prev_catalog = BookCatalog.query.with_entities(
                BookCatalog.id, 
                BookCatalog.parent_id, 
                BookCatalog.is_dir)\
            .filter(db.and_(
                BookCatalog.book_id==catalog.book_id,
                BookCatalog.pos < catalog.pos, 
                BookCatalog.parent_id==catalog.parent_id))\
            .order_by(BookCatalog.pos.desc()).first()
        if prev_catalog and prev_catalog.is_dir:
            child = BookCatalog.last_child(prev_catalog)
            if child:
                return child
        if prev_catalog or not catalog.parent_id:
            return prev_catalog
        return BookCatalog.query.with_entities(BookCatalog.id)\
            .filter_by(id=catalog.parent_id).first()

    @staticmethod
    def next(catalog, is_first=True):
        if catalog:
            if catalog.is_dir and is_first:
                next_catalog = BookCatalog.first_child(catalog)
                if next_catalog:
                    return next_catalog
            next_catalog = BookCatalog.query.with_entities(BookCatalog.id, 
                BookCatalog.parent_id, BookCatalog.is_dir).filter(db.and_(
                    BookCatalog.book_id==catalog.book_id,
                    BookCatalog.pos > catalog.pos,
                    BookCatalog.parent_id == catalog.parent_id))\
                .order_by(BookCatalog.pos).first()
            if next_catalog or not catalog.parent_id:
                return next_catalog
            catalog = BookCatalog.query.with_entities(
                    BookCatalog.id,
                    BookCatalog.parent_id,
                    BookCatalog.is_dir,
                    BookCatalog.pos,
                    BookCatalog.book_id)\
                .filter_by(id=catalog.parent_id).first()
            return BookCatalog.next(catalog, False)
        else:
            next_catalog = BookCatalog.query.with_entities(BookCatalog.id)\
                .filter(db.and_(
                    BookCatalog.book_id==catalog.book_id,
                    BookCatalog.parent_id==0))\
                .order_by(BookCatalog.pos).first()
        return next_catalog

    @staticmethod
    def first_child(catalog):
        return BookCatalog.query.with_entities(BookCatalog.id,
                BookCatalog.parent_id, BookCatalog.title, BookCatalog.is_dir)\
            .filter_by(parent_id=catalog.book_id)\
            .order_by(BookCatalog.pos).first()

    @staticmethod
    def last_child(catalog):
        return BookCatalog.query.with_entities(BookCatalog.id,
                BookCatalog.parent_id, BookCatalog.title, BookCatalog.id)\
            .filter_by(parent_id=catalog.id)\
            .order_by(BookCatalog.pos.desc()).first()

    def set_abstract(self):
        soup = BeautifulSoup(self.publish_html, "html.parser")
        self.abstract = soup.text[:110] + u"..."

    def sort(self, next_id = None):
        if not next_id:
            self.pos = BookCatalog.max_pos(self.book_id) + 1
            self.parent_id = 0
        else:
            next = BookCatalog.get(next_id)
            if not next:
                return False
            self.pos = next.pos
            self.parent_id = next.parent_id
            nexts = BookCatalog.query.filter(db.and_(BookCatalog.book_id==self.book_id,
                BookCatalog.parent_id==next.parent_id,
                BookCatalog.pos > next.pos)).all()
            for _next in nexts:
                _next.pos += 1
            next.pos += 1
        self.updatetime = datetime.now()
        self.book.updatetime = self.updatetime
        return True

    def rename(self, title):
        self.title = title
        self.updatetime = datetime.now()
        self.book.updatetime = self.updatetime

    def save(self, markdown, html):
        self.markdown = markdown
        self.html = html
        self.updatetime = datetime.now()
        self.book.updatetime = self.updatetime

    def delete(self):
        catalogs = BookCatalog.query.filter_by(parent_id=self.id).all()
        for catalog in catalogs:
            catalog.delete()
        self.book.updatetime = datetime.now()
        db.session.delete(self)


class BookImage(db.Model):
    __table_args__ = {
        "mysql_engine": "InnoDB",
        "mysql_charset": "utf8"
    }
    __tablename__ = db.PREFIX + PREFIX + "image"
    id = db.Column(db.Integer, primary_key = True, nullable=False)
    name = db.Column(db.String(255), default="", nullable=False)
    filename = db.Column(db.String(255), default="", nullable=False)
    book_id = db.Column(db.Integer, db.ForeignKey(Book.__tablename__+".id", 
        ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    timestamp = db.Column(db.DateTime, default = datetime.now, nullable=False)

    @property
    def url(self):
        return "/".join(["/static", current_app.config["IMAGE_PATH"],
            self.filename])

    @staticmethod
    def add(book_id, filename, name):
        image = BookImage(
            name=name,
            filename=filename,
            book_id=book_id)
        db.session.add(image)
        db.session.commit()
        return image

    def delete(self):
        path = current_app.config["IMAGE_PATH"]
        file.delete_file(path, self.filename)
        db.session.delete(self)


