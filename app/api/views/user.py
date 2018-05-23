#coding: utf-8
import base64
from flask import current_app
from app.models.user import *
from app.includes import file
from . import dispatcher, message


@dispatcher.auth_action("change_avatar")
def change_avatar(id = None, binary = None, **params):
    if not id or not binary:
        return message("error", "")
    user = User.get(id)
    if not user:
        return message("error", "")
    binary = base64.b64decode(binary)
    avatar = file.change_avatar(binary, user.avatar)
    user.avatar = avatar
    src = '/'.join(['/static', current_app.config["AVATAR_PATH"], avatar])
    return message("success", {"src": src})


@dispatcher.auth_action("change_password")
def change_password(id = None, password= None, **params):
    if not id or not password:
        return message("error", "")
    user = User.get(id)
    if not user:
        return message("error", "")
    user.change_password(password)
    return message("success", "")


