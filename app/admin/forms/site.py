#coding: utf-8
from flask_wtf import Form
from wtforms import StringField
from wtforms import TextAreaField
from wtforms.validators import DataRequired, Length


class SiteForm(Form):
    name = StringField("名称", validators=[DataRequired("网站名称不能为空"), Length(1, 125, "长度不能超过125个字符")])
    description = StringField("一句话描述", validators=[Length(0, 125, "长度不能超过125个字符")])
    about = TextAreaField("关于本站")


