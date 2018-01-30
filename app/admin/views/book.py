#coding: utf-8
from flask import current_app, render_template, request, redirect,\
        url_for, abort, flash
from flask_login import login_required, current_user
from app.admin import admin
from app.admin.forms.book import *
from app.models.book import *


@admin.route("/")
@login_required
def index():
    page = request.args.get("page", 1, type=int)
    per_page = current_app.config["PER_PAGE"]
    tab = request.args.get("tab", "book")
    count_draft = current_user.count_draft()
    if tab=="draft":
        books = current_user.page_draft(page, per_page)
    else:
        books = current_user.page_book(page, per_page)
    return  render_template("admin/book/index.html", books = books, 
        count_draft=count_draft, tab=tab)


@admin.route("/book/new", methods=["GET", "POST"])
@login_required
def book_new():
    form = BookForm()
    if form.validate_on_submit():
        book = Book.add(form.name.data, form.brief.data, 
            form.access.data, current_user.id)
        return redirect(url_for("admin.book_edit", id=book.id))
    return render_template("admin/book/new.html", form=form)


@admin.route("/book/<int:id>", methods=["GET", "POST"])
@login_required
def book_detail(id):
    book = Book.get(id)
    if not book:
        return abort(404)
    form = SettingForm()
    if form.validate_on_submit():
        book.setting(form.name.data, form.brief.data, form.access.data)
        flash("设置成功")
    return render_template("admin/book/detail.html", book = book, form=form)


@admin.route("/book/<int:id>/edit")
@login_required
def book_edit(id):
    book = Book.get(id)
    if not book:
        return abort(404)
    return render_template("admin/book/edit.html", book = book)


@admin.route("/catalog/<int:id>/change")
@login_required
def catalog_change(id):
    catalog = BookCatalog.get(id)
    if catalog.is_dir or catalog.book.user_id != current_user.id:
        return abort(404)
    catalog.is_dir = True
    return redirect(url_for("admin.book_edit", id=catalog.book_id))



