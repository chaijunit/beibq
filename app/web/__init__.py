#coding:utf-8
from flask import Blueprint
web = Blueprint("web", __name__)

import app.web.views

from app.models import user, book



