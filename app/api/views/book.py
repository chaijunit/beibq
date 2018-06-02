#coding: utf-8
import base64, hashlib
import simplejson as json
from flask import current_app, url_for, render_template
from flask_login import current_user
from app.models.book import *
from app.includes import diff, file, html as html_module
from . import dispatcher, message


def catalog2json(select_id, catalogs):
    items = []
    for catalog in catalogs:
        item = {
            "attrs": {"id": catalog.id},
            "title": catalog.title,
            "is_dir": catalog.is_dir,
            "href": url_for("web.reader", id = catalog.book_id, 
                        catalog_id=catalog.id)
        }
        if select_id == catalog.id:
            item["selected"] = True
        if catalog.catalogs:
            item["catalogs"] = catalog2json(select_id, catalog.catalogs)
        items.append(item)
    return items


@dispatcher.auth_action("edit_book")
def edit_book(id=None, **params):
    book = Book.get(id)
    if not book or book.user_id != current_user.id:
        return message("error", "", "id error")
    catalogs = book.tree_catalogs()
    select_catalog = BookCatalog.get(book.select_catalog)
    if not select_catalog and catalogs:
        select_catalog = catalogs[0]
        book.select_catalog = select_catalog.id
    catalogs = catalog2json(book.select_catalog, catalogs)
    value = {"catalogs": catalogs}
    if select_catalog:
        value["id"] = select_catalog.id
        value["markdown"] = select_catalog.markdown
    value["publish"] = 0 if book.publish_timestamp>book.updatetime else 1
    return message("success", value)


@dispatcher.auth_action("add_catalog")
def add_catalog(book_id=None, title="", parent_id=0, is_dir="0", **params):
    title = title.replace("/", "")
    if not title:
        return message("error", "", "no title")
    book = Book.get(book_id)
    if not book or book.user_id != current_user.id:
        return message("error", "", "id error")
    max_deep = current_app.config["CATALOG_DEEP"]
    if BookCatalog.get_deep(parent_id) > max_deep:
        return message("warning", "", "目录深度不能超过{}".format(max_deep))
    is_dir = int(is_dir)
    catalog = BookCatalog.add(book_id, title, parent_id, is_dir)
    if not catalog:
        return message("error", "", "add catalog fail")
    value = {
        "id": catalog.id,
        "href": url_for("web.reader", id=book_id, catalog_id=catalog.id)
    }
    return message("success", value)


@dispatcher.auth_action("rename_catalog")
def rename_catalog(id=None, title="", **params):
    title = title.replace("/", "")
    if not title:
        return message("error", "", "no title")
    catalog = BookCatalog.get(id)
    if not catalog or catalog.book.user_id!=current_user.id:
        return message("error", "", "id error")
    catalog.rename(title)
    return message("success", "")

 
@dispatcher.auth_action("delete_catalog")
def delete_catalog(id=None, **params):
    catalog = BookCatalog.get(id)
    if not catalog or catalog.book.user_id!=current_user.id:
        return message("error", "", "id error")
    catalog.delete()
    return message("success", "")


@dispatcher.auth_action("select_catalog")
def select_catalog(id=None, **params):
    catalog = BookCatalog.query.filter_by(id=id).options(
            db.undefer("markdown")
        ).first()
    if not catalog or catalog.book.user_id != current_user.id:
        return message("error", "", "id error")
    catalog.book.select_catalog = catalog.id
    return message("success", {"markdown": catalog.markdown})
 

@dispatcher.auth_action("sort_catalog")
def sort_catalog(id=None, next_id=None, **params):
    catalog = BookCatalog.get(id)
    if not catalog or catalog.book.user_id!=current_user.id:
        return message("error", "", "id error")
    if not catalog.sort(next_id):
        return message("error", "", "sort fail")
    return message("success", "")
 

@dispatcher.auth_action("diffsave_catalog")
def diffsave_catalog(id=None, mdiff="", mtoken="", 
        hdiff="", htoken="", **params):
    if not mdiff and not hdiff and not id:
        return message("error", "", "")
    catalog = BookCatalog.query.filter_by(id = id).options(
        db.undefer("markdown"), db.undefer("html")).first()
    if not catalog:
        return message("warning", "", "目录不存在")
    if catalog.book.user_id != current_user.id:
        return message("error", "", "no authority")
    mdiff = json.loads(mdiff)
    markdown = diff.merge_diff(catalog.markdown, mdiff)
    token = hashlib.md5(markdown.encode("utf-8"))
    if token.hexdigest() != mtoken:
        return message("warning", "", "markdown diff error")
    hdiff = json.loads(hdiff)
    html = diff.merge_diff(catalog.html, hdiff)
    token = hashlib.md5(html.encode("utf-8"))
    if token.hexdigest() != htoken:
        return message("warning", "", "html diff error")
    catalog.save(markdown, html)
    return message("success", "")


@dispatcher.auth_action("save_catalog")
def save_catalog(id=None, markdown=None, html=None, **params):
    if not id or markdown is None or html is None:
        return message("error", "", "no data")
    catalog = BookCatalog.query.filter_by(id=id).options(
        db.undefer("markdown"), db.undefer("html")).first()
    if not catalog:
        return message("warning", "", "目录不存在")
    if catalog.book.user_id != current_user.id:
        return message("error", "", "no authority")
    catalog.save(markdown, html)
    return message("success", "")


@dispatcher.auth_action("change_cover")
def change_cover(id=None, binary=None, **params):
    if not binary:
        return message("error", "", "no binary")
    book = Book.get(id)
    if not book or book.user_id != current_user.id:
        return message("error", "", "id error")
    binary = base64.b64decode(binary)
    cover = file.change_cover(binary, book.cover)
    book.cover = cover
    src = "/".join(["/static", 
        current_app.config["BOOK_COVER_PATH"], cover])
    return message("success", {"src": src})


@dispatcher.auth_action("import_html")
def import_html(html = None, url=None, only_main=None, 
        download = None, **params):
    """ 导入html内容
    @param html: html内容
    @param url: 链接
    @param only_main: 值提取页面正文
    @param download: 要下载页面上的图片到本地
    """
    if html is None and url is None:
        return message("warning", "", "内容不能为空")
    only_main = 0 if only_main is None else int(only_main)
    download = 0 if download is None else int(download)
    html = html_module.get_url_html(html, url)
    if html is None:
        return message("warning", "", "地址无法访问")
    html = html if not only_main else html_module.get_main_html(html)
    markdown = html_module.html2markdown(html, url, download, 
            current_app.config["IMAGE_PATH"])
    return message("success", markdown)


@dispatcher.auth_action("publish")
def publish(id=None, **params):
    book = Book.get(id)
    if not book or book.user_id != current_user.id:
        return message("error", "", "id error")
    book.publish()
    return message("success", "")

@dispatcher.auth_action("delete_book")
def delete_book(id=None, **params):
    book = Book.get(id)
    if not book or book.user_id != current_user.id:
        return message("error", "", "id error")
    book.delete()
    return message("success", "")


@dispatcher.action("reader")
def reader(id=None, catalog_id=None, **params):
    book = Book.get(id)
    if not book:
        return message("error", "", "no book")
    if not book.access and (not current_user.is_authenticated or \
            (book.user_id != current_user.id)):
        return message("error", "", "no authority")
    catalog = BookCatalog.reader(book.id, catalog_id)
    if not catalog:
        return message("warning", "", "章节不存在")
    prev = BookCatalog.prev(catalog)
    next = BookCatalog.next(catalog)
    html = render_template("web/_reader.html", book=book, catalog=catalog, 
        prev=prev, next=next)
    value = {
        "html": html,
        "id": catalog.id,
        "title": u"{} - {}".format(catalog.title, book.name),
    }
    return message("success", value)


@dispatcher.action("book_info")
def book_info(id=None, **params):
    book = Book.info(id)
    if not book:
        return message("error", "", "not book")
    html = render_template("web/_info.html", book=book)
    return message("success", html)


