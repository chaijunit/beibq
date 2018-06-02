#coding: utf-8
from flask_wtf import Form
from wtforms import StringField,RadioField
from wtforms import TextAreaField
from wtforms.validators import DataRequired, Length



class BookForm(Form):
    name = StringField("书名", validators=[DataRequired("书名不能为空"), Length(1, 125, "长度不能超过125个字符")])
    brief = TextAreaField("描述")
    access = RadioField("访问权限", choices=[("1", "公开"), ("0", "私人")])


class SettingForm(Form):
    name = StringField("书名", validators=[DataRequired("书名不能为空"), Length(1, 125, "长度不能超过125个字符")])
    brief = TextAreaField("描述")
    access = RadioField("访问权限", choices=[("1", "公开"), ("0", "私人")])


