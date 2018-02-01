# beibq

beibq是基于flask开发的开源书籍博客。

beibq的特点:

- 极简界面，直观、简单、易用
- 高效、便捷的在线书籍编辑器，支持Markdown标记语言
- 响应式设计，自适应各种平台界面

beibq的编辑器是使用[bookeditor](https://github.com/chaijunit/bookeditor)，这是一个开源的Markdown在线写书编辑器

#### 1. 编辑器
![编辑器](http://uploadimg.markbj.com/static/resource/image/book/eaa4d28c077511e8a4ac00163e13356e.png)

#### 2. 书籍列表
![我的书籍](http://uploadimg.markbj.com/static/resource/image/book/f66e396e077511e8a4ac00163e13356e.png)

## 安装使用

#### 1. 安装mysql

beibq使用的数据库是mysql，安装前需要先安装mysql

我使用的是centos，安装方法可以参考该文档：[Installing MySQL on Linux Using the MySQL Yum Repository](https://dev.mysql.com/doc/refman/5.7/en/linux-installation-yum-repo.html)

#### 2. 安装依赖包

```
pip install -r requirements.txt
```

#### 3. 启动程序

```
python manage.py runserver -h 0.0.0.0
```

#### 4. 配置站点
在浏览器中输入http://127.0.0.1:5000


第一次访问会跳转到配置界面，根据指示配置站点信息后就能使用beibq

## 建议反馈
如果您有任何建议和问题，可以通过邮箱方式和我联系

- 邮箱： chaijun@markbj.com

