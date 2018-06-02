#coding: utf-8
from flask_wtf import Form
from wtforms import StringField, PasswordField
from wtforms.validators import DataRequired, Length


class UserForm(Form):
    username = StringField("用户名", validators=[DataRequired("用户名不能为空"),
        Length(3, 50, "用户名长度在3到50个字符之间")])
    password = PasswordField("密码", validators=[DataRequired("密码不能为空"), 
        Length(6, 128, "密码长度应该在6到128个字符之间")])


class SettingForm(Form):
    nickname = StringField("昵称", validators=[DataRequired("昵称不能为空"),
        Length(1, 50, "昵称长度在1到50个字符之间")])


