#coding: utf-8
from flask import current_app, request
from flask_login import current_user
from app.models.book import *
from app.includes import file
from . import dispatcher, message


@dispatcher.auth_action("upload_image")
def upload_image(catalog_id = None, filename=None, name=None, **params):
    name = name.replace("/", "")
    catalog = BookCatalog.get(catalog_id)
    if not catalog or catalog.book.user_id != current_user.id:
        return message("error", "", "id error")
    file.enable_image(filename)
    image = BookImage.add(catalog.book_id, filename, name)
    value = {
        "id": image.id, 
        "url": image.url,
        "name": name
    }
    return message("success", value)


@dispatcher.auth_action("upload_tmp")
def upload_tmp(**params):
    image = request.files.get("image")
    if not image or not file.validate_image(image.filename):
        return message("error", "", "not a image")
    filename, name = file.new_tmp(image)
    url = "/".join(["/static", current_app.config["TMP_PATH"], filename])
    value = {"url": url, "name": name}
    return message("success", value)


@dispatcher.auth_action("change_tmp")
def change_tmp(filename, **params):
    image = request.files.get("image")
    if not image or not file.validate_image(image.filename):
        return message('error', "", "not a image")
    if filename:
        file.delete_tmp(filename)
    filename, name = file.new_tmp(image)
    url = "/".join(["/static", current_app.config["TMP_PATH"], filename])
    value = {"url":url, "name": name}
    return message("success", value)


@dispatcher.auth_action("delete_tmp")
def delete_tmp(filename, **params):
    if not filename:
        return message("error", "", "no filename")
    file.delete_tmp(filename)
    return message("success", "")

