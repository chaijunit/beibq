#coding: utf-8
from flask import current_app, render_template, request, redirect, url_for, abort
from flask_login import current_user
from app.models.book import *
from app.web import web


@web.route("/")
def index():
    page = request.args.get("page", 1, type=int)
    per_page = current_app.config["PER_PAGE"]
    #books = Book.page(page, per_page)
    catalogs = BookCatalog.page(page, per_page)
    return render_template("web/index.html", catalogs = catalogs)


@web.route("/book/<int:id>")
@web.route("/book/<int:id>-<int:catalog_id>")
def reader(id, catalog_id=None):
    book = Book.get(id)
    if not book:
        return abort(404)
    if not book.access and (not current_user.is_authenticated or \
            current_user.is_authenticated and current_user.id != book.user_id):
        return abort(404)
    if catalog_id:
        catalog = BookCatalog.reader(book.id, catalog_id)
        if not catalog:
            return redirect(url_for("web.reader", id=book.id))
    else:
        catalog = BookCatalog.reader(book.id)
    if not catalog:
        return render_template("web/reader.html", book=book)
    prev = BookCatalog.prev(catalog)
    next = BookCatalog.next(catalog)
    catalogs = book.tree_catalogs()
    return render_template("web/reader.html", book=book,
        catalogs = catalogs, catalog=catalog)


