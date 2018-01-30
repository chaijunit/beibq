#coding:utf-8
from flask import request, jsonify
from flask_login import current_user
from app.api import api


def message(status, value, msg=""):
    return {"status": status, "value": value, "msg": msg}


class Dispatcher(object):
    def __init__(self):
        self._funcs = {}

    def auth_action(self, name):
        return self._action(name, True)

    def action(self, name):
        return self._action(name, False)

    def _action(self, name, auth):
        def decorate(fn):
            if name in self._funcs:
                raise ValueError("action is exists")
            self._funcs[name] = (fn, auth)
            return fn
        return decorate

    def dispatch(self, name, params):
        func = self._funcs.get(name)
        if not func:
            return message("error", "", "not exists action")
        func, auth = func
        if auth and not current_user.is_authenticated:
            return message("error", "", "no authority")
        return func(**params)


dispatcher = Dispatcher()


@api.route("/<path:action>", methods=["GET", "POST"])
def index(action):
    params = request.values.to_dict()
    return jsonify(dispatcher.dispatch(action, params))


import app.api.views.book
import app.api.views.file
import app.api.views.user


