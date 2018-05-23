#coding: utf-8
from datetime import datetime
from app.models.model import *
from flask_login import UserMixin
from flask import current_app
from werkzeug.security import generate_password_hash, check_password_hash
from app.includes import file 


PREFIX = ""


class User(UserMixin, db.Model):
    """ user table """
    __tablename__ = db.PREFIX + PREFIX + "user"
    __table_args__ = {
        "mysql_engine": "InnoDB",
        "mysql_charset": "utf8"
    }

    id = db.Column(db.Integer, primary_key = True, nullable=False)
    username = db.Column(db.String(255), unique=True, nullable=False, index=True, default="")
    nickname = db.Column(db.String(255), nullable = False, default="")
    password =  db.Column(db.String(255), default="")
    avatar = db.Column(db.String(255),  default="")
    updatetime = db.Column(db.DateTime, default = datetime.now, nullable=False)
    timestamp = db.Column(db.DateTime, default = datetime.now, nullable=False)
    books = db.relationship("Book", backref="user", lazy="dynamic")
    
    @staticmethod
    def add(username, password):
        user = User.query.filter_by(username=username).first()
        if user is not None:
            return
        user = User()
        user.username = username
        user.nickname = username
        user.password = generate_password_hash(password)
        user.avatar = file.new_avatar()
        db.session.add(user)
        db.session.commit()
        return user

    @staticmethod
    def get(id):
        return User.query.filter_by(id=id).first()

    @staticmethod
    def getbyname(username):
        return User.query.filter_by(username=username).first()

    @staticmethod
    def page(page, per_page):
        return User.query.paginate(page, 
            per_page=per_page, error_out = False)

    def setting(self, nickname):
        self.nickname = nickname

    def change_password(self, password):
        self.password = generate_password_hash(password)

    def verify_password(self, password):
        return check_password_hash(self.password, password)

    def page_book(self, page, per_page):
        from .book import Book
        books = Book.query.filter_by(user_id=self.id)\
            .options(db.Load(Book).undefer("brief"))\
            .order_by(Book.publish_timestamp.desc())\
            .paginate(page, per_page=per_page, error_out=False)
        return books

    def page_draft(self, page, per_page):
        from .book import Book
        books = Book.query.filter_by(user_id=self.id)\
                .filter(Book.updatetime>Book.publish_timestamp)\
                .options(db.Load(Book).undefer("brief"))\
                .order_by(Book.publish_timestamp.desc())\
                .paginate(page, per_page=per_page, error_out=False)
        return books

    def count_book(self):
        return self.books.count()

    def count_draft(self):
        from .book import Book
        num = Book.query.filter_by(user_id=self.id)\
                .filter(Book.updatetime>Book.publish_timestamp)\
                .count()
        return num

    def _20px_avatar(self):
        image_path = current_app.config["AVATAR_PATH"]
        return "/".join([image_path, "20_20_{}".format(self.avatar)])
    
    def _50px_avatar(self):
        image_path = current_app.config["AVATAR_PATH"]
        return "/".join([image_path, "50_50_{}".format(self.avatar)])

    def origin_avatar(self):
        image_path = current_app.config["AVATAR_PATH"]
        return "/".join([image_path, self.avatar])


@login_manager.user_loader
def load_user(id):
    if current_app.start:
        return User.query.get(int(id))
    return



