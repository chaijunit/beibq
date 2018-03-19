#coding: utf-8

try:
    unicode        # Python 2
except NameError:
    unicode = str  # Python 3


def strdecode(text):
    if not isinstance(text, unicode):
        try:
            text = text.decode('utf-8')
        except UnicodeDecodeError:
            text = text.decode('gbk', 'ignore')
        return text
    return text
