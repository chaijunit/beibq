#coding: utf-8
from flask import current_app, render_template, flash
from flask_login import login_required
from app.admin import admin
from app.includes.start import set_site
from app.admin.forms.site import *
from app.models.site import *


@admin.route("/site", methods=["GET", "POST"])
@login_required
def site():
    form = SiteForm()
    if form.validate_on_submit():
        metas = {
            "name": form.name.data,
            "description": form.description.data,
            "about": form.about.data
        }
        SiteMeta.setting(metas)
        flash("设置成功")
        set_site(current_app)
    metas = SiteMeta.all()
    site = dict([(meta.name, meta.value) for meta in metas])
    return render_template("admin/site/site.html", form=form, site=site)

