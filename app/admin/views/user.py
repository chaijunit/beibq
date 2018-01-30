#coding: utf-8
from flask import current_app, render_template, request, redirect, url_for, flash, abort
from flask_login import login_required
from app.admin import admin
from app.admin.forms.user import *
from app.models.user import *


@admin.route("/user")
@login_required
def user():
    page = request.args.get("page", 1, type=int)
    per_page = current_app.config["PER_PAGE"]
    users = User.page(page, per_page)
    return  render_template("admin/user/index.html", users = users)


@admin.route("/user/new", methods=["GET", "POST"])
@login_required
def user_new():
    form = UserForm()
    if form.validate_on_submit():
        User.add(form.username.data, form.password.data)
        flash("添加用户成功")
        return redirect(url_for("admin.user"))
    return render_template("admin/user/new.html", form=form)


@admin.route("/user/<int:id>", methods=["GET", "POST"])
@login_required
def user_detail(id):
    user = User.get(id)
    if not user:
        return abort(404)
    form = SettingForm()
    if form.validate_on_submit():
        user.setting(form.nickname.data)
        flash("修改成功")
    return render_template("admin/user/detail.html", user=user, 
        form=form)


