#coding: utf-8
import os, uuid
from readability import Document
from app.includes.url import open_url, full_url, download_file
from html2text import HTML2Text
from flask import current_app
from bs4 import BeautifulSoup


def get_url_html(html, url):
    if html is not None:
        return html
    try:
        return open_url(url)
    except None:
        pass
    return


def get_main_html(html):
    doc = Document(html)
    return doc.summary()


def download_html_image(url, html, path):
    """ 下载html中的图片 """
    soup = BeautifulSoup(html, "html.parser")
    imgs = soup.select("img")
    for img in imgs:
        if not img.has_attr("src"):
            continue
        src = img['src'] if not url else full_url(url, img["src"])
        _, ext = os.path.splitext(src)
        filename = "/{0}/{1}{2}".format(path, uuid.uuid1().hex, ext)
        _filename = "{0}{1}".format(current_app.static_folder, filename)
        _src = "{0}{1}".format("/static", filename)
        if not download_file(src, _filename):
            img['src'] = src
        else:
            img['src'] = _src
    return soup


def html2markdown(html, url, download, path):
    if not download:
        h = HTML2Text(baseurl = url, bodywidth = 0)
    else:
        html = download_html_image(url, html, path)
        h = HTML2Text(bodywidth = 0)
    md = h.handle(html)
    return md

