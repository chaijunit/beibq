#coding: utf-8
from flask_wtf import Form
from wtforms import StringField, PasswordField, BooleanField
from wtforms.validators import DataRequired, Length


class ConfigForm(Form):
    db = StringField("数据库名称", validators=[DataRequired("数据库名称不能为空")])
    username = StringField("用户名", validators=[DataRequired("用户名不能为空")])
    password = StringField("密码")
    host = StringField("数据库主机", validators=[DataRequired("数据库主机不能为空")])


class InstallForm(Form):
    name = StringField("网站名称", validators=[DataRequired("网站名称不能为空")])
    username = StringField("用户名", validators=[DataRequired("用户名不能为空"),
        Length(3, 50, "用户长度在3到50个字符之间")])
    password = PasswordField("密码", validators=[DataRequired("密码不能为空"), 
        Length(6, 128, "密码长度应该在6到128个字符之间")])
 

class LoginForm(Form):
    username = StringField("用户名", validators=[DataRequired("用户名不能为空")])
    password = PasswordField("密码", validators=[DataRequired("密码不能为空")])
    remember = BooleanField("记住我")


