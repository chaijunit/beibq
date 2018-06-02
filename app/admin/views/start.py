#coding:utf-8
from flask import current_app, render_template, request, redirect, url_for, flash
from app.models.model import db
from flask_login import login_user, logout_user, login_required, current_user
from app.admin import admin
from app.admin.forms.start import *
from app.includes.start import *


def setup_step2():
    form = ConfigForm()
    if form.validate_on_submit():
        host= form.host.data
        username = form.username.data
        password = form.password.data
        db_name = form.db.data
        url = 'mysql+pymysql://{0}:{1}@{2}/{3}?charset=utf8'.format(username,
            password, host, db_name)
        code, msg = connect_mysql(url)
        if not code:
            create_config(username, password, host, db_name)
            from app.config import Config
            current_app.config.from_object(Config)
            return render_template("admin/start/setup-step2.html")
        elif code == 1045:
            return render_template("admin/start/setup-error.html", code=1)
        elif code == 1049:
            return render_template("admin/start/setup-error.html", code=2)
        else:
            return render_template("admin/start/setup-error.html", code=3, msg=msg)
    return render_template("admin/start/setup-error.html", code=3)


@admin.route("/setup", methods=['GET', 'POST'])
def setup():
    if exist_config():
        # 已经存在配置文件
        return render_template("admin/start/setup-error.html", code=0)
    step = request.args.get("step", type=int)
    if step==1:
        form = ConfigForm()
        return render_template("admin/start/setup-step1.html", form=form)
    elif step==2:
        return setup_step2()
    elif step==3:
        return setup_step3()
    elif step==4:
        return setup_step4()
    return render_template("admin/start/setup.html")


def install_step1(form):
    if form.validate_on_submit():
        create_tables(db)
        from app.models.site import SiteMeta
        from app.models.user import User
        metas = {
            "name": form.name.data,
            "description": "这是一个书籍站点",
            "about": "这个地方可以用来介绍您自己，或者您的网站。"
        }
        SiteMeta.add(metas)
        User.add(form.username.data, form.password.data)
        current_app.start = True
        set_site(current_app)
        return render_template("admin/start/install-step1.html", username=form.username.data)
    return render_template("admin/start/install.html", form=form)


@admin.route("/install", methods = ["GET", "POST"])
def install():
    if not exist_config():
        return redirect(url_for("admin.setup"))
    if exist_table(current_app):
        current_app.start = True
        set_site(current_app)
        return render_template("admin/start/install-error.html", code=0)
    step = request.args.get("step", type=int)
    form = InstallForm()
    if step==1:
        return install_step1(form)
    return render_template("admin/start/install.html", form = form)


@admin.route("/login", methods=["GET", "POST"])
def login():
    if current_user.is_authenticated:
        return redirect(url_for("admin.index"))
    from app.models.user import User
    form = LoginForm()
    if form.validate_on_submit():
        user = User.getbyname(form.username.data)
        if user is not None and user.verify_password(form.password.data):
            login_user(user, remember=form.remember.data)
            return redirect(url_for("admin.index"))
        flash("账号或密码错误")
    form.remember.data=True
    return render_template("admin/start/login.html", form = form)


@admin.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("admin.login"))


