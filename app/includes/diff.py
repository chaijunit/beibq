#coding: utf-8

def merge_diff(str, diff):
    """根据diff合并str"""
    # 新的内容
    _str, index = '', 0
    for op, data in diff:
        if op == 1:
            # data为增加的字符
            _str+=data
        elif op == -1:
            # data为删除的字符
            index += data
        else:
            # data为不往后不变的字符数
            _str += str[index:index+data]
            index += data
    return _str 


