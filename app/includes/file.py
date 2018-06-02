#coding: utf-8
import os, re, uuid, io, shutil
from PIL import Image
from flask import current_app

# 匹配文件类型
image_reg = re.compile(r'\w+\.(bmp|gif|jpeg|png|jpg)$', re.I|re.U) # re.I 是忽略大小写 re.U 使用Unicode库

def validate_image(filename):
    dir, name = os.path.split(filename)
    if dir or not image_reg.search(name):
        return False
    return True


def generate_origin_avatar(name, im):
    """ 生成原始大小的头像 """
    avatar_image = "/".join([current_app.static_folder,
        current_app.config["AVATAR_PATH"], name])
    im.save(avatar_image)


def generate_50px_avatar(name, im):
    """ 生成50*50大小的头像 """
    name = "50_50_{0}".format(name)
    avatar_image = "/".join([current_app.static_folder,
        current_app.config["AVATAR_PATH"], name])
    _im = im.resize((50, 50), Image.ANTIALIAS)
    _im.save(avatar_image)
 

def generate_20px_avatar(name, im):
    """ 生成20*20大小的头像 """
    name = "20_20_{0}".format(name)
    avatar_image = "/".join([current_app.static_folder,
        current_app.config["AVATAR_PATH"], name])
    _im = im.resize((20, 20), Image.ANTIALIAS)
    _im.save(avatar_image)


def new_avatar():
    common_image = '/'.join([current_app.static_folder, 
        current_app.config["STATIC_IMG_PATH"],
        "avatar.jpg"])
    u = uuid.uuid1()
    name = '{0}.jpg'.format(u.hex)
    im = Image.open(common_image)
    generate_origin_avatar(name, im)
    generate_50px_avatar(name, im)
    generate_20px_avatar(name, im)
    return name

 
def change_avatar(binary, old_avatar):
    """ 改变头像 """
    u = uuid.uuid1()
    name = '{0}.png'.format(u.hex)
    im = Image.open(io.BytesIO(binary))
    generate_origin_avatar(name, im)
    generate_20px_avatar(name, im)
    generate_50px_avatar(name, im)
    if old_avatar:
        delete_avatar(old_avatar)
    return name


def delete_avatar(name):
    """ 删除头像 """
    delete_file(current_app.config["AVATAR_PATH"], name)
    delete_file(current_app.config["AVATAR_PATH"], "20_20_{0}".format(name))
    delete_file(current_app.config["AVATAR_PATH"], "50_50_{0}".format(name))


def change_cover(binary, cover):
    u = uuid.uuid1()
    new_cover = "{}.png".format(u.hex)
    filename = "/".join([current_app.static_folder, 
        current_app.config["BOOK_COVER_PATH"], new_cover])
    im = Image.open(io.BytesIO(binary))
    im.save(filename)
    
    im = im.resize((90, 120), Image.ANTIALIAS)
    thumbnail = "thumbnail_{}".format(new_cover)
    filename = "/".join([current_app.static_folder, 
        current_app.config["BOOK_COVER_PATH"], thumbnail])
    im.save(filename)
    if cover:
        delete_cover(cover)
    return new_cover


def delete_cover(cover):
    thumbnail = "thumbnail_{}".format(cover)
    delete_file(current_app.config["BOOK_COVER_PATH"], cover)
    delete_file(current_app.config["BOOK_COVER_PATH"], thumbnail)


def image_url(name):
    return "/".join(["/static", current_app.config["IMAGE_PATH"], name])


def enable_image(name):
    enable_tmp(current_app.config["IMAGE_PATH"], name)


def new_tmp(file):
    """ 新建临时文件 """
    u = uuid.uuid1()
    name, ext = os.path.splitext(file.filename)
    filename = ''.join([u.hex, ext])
    path = "/".join([current_app.static_folder, 
        current_app.config["TMP_PATH"], filename])
    file.save(path)
    return (filename, name)


def enable_tmp(path, name):
    """ 激活临时文件 """
    filename = '/'.join([current_app.static_folder, 
        current_app.config["TMP_PATH"], name])
    if not os.path.exists(filename):
        return False
    _filename = '/'.join([current_app.static_folder, path, name])
    shutil.move(filename, _filename)
    return True


def delete_tmp(filename):
    path = current_app.config["TMP_PATH"]
    return delete_file(path, filename)


def delete_file(path, name):
    """ 删除文件 """
    filename= '/'.join([current_app.static_folder,  path, name])
    if not os.path.exists(filename):
        return False
    os.remove(filename)
    return True


