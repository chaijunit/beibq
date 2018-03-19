# beibq

基于flask开发类似gitbook的知识管理网站。

码云地址：https://gitee.com/beibq/beibq

github地址：https://github.com/chaijunit/beibq

demo地址：http://demo.beibq.cn
用户名：admin
密码：123456


因为很多博客系统都是以文章的形式为主；如果记录的文章变多了，还需要进行分类，而且查找以前写过的某篇文章会比较麻烦。

beibq是用写书的方式来写博客，因为书籍本身就具有分类功能，就算记录的内容变多了也不觉得乱，而且在阅读时通过点击书籍目录很方便的切换到其他章节。


#### 安装配置
![](https://github.com/chaijunit/beibq/blob/master/doc/image/start.png)
搭建好网站后，用浏览器访问，会出现配置界面


#### 在线写书

![](https://github.com/chaijunit/beibq/blob/master/doc/image/book.png)

beibq的编辑器支持Markdown，Markdown是一个标记语言，只需要几个简单的标记符号就能转化成丰富的HTML格式，特别适合写博客。关于Markdown的具体介绍：[Markdown 语法说明](https://www.appinn.com/markdown/)

beibq的编辑器界面简洁、操作简单，能够通过工具栏或快捷键方式输入Markdown标记符号，有效的提高写作效率；编辑器的目录区支持章节拖拉，可以调整章节顺序。

编辑器例子：[在线写书](https://www.beibq.cn/bookeditor/book)

写好书籍后点击发布，就能在首页上看到最新书籍动态
![](https://github.com/chaijunit/beibq/blob/master/doc/image/home.png)

#### 界面

beibq的界面简洁、美观、易用。阅读博客时，就像看书一样，界面包含书籍目录；这样只要点击目录的某个章节就能很方便切换到其他章节。

![](https://github.com/chaijunit/beibq/blob/master/doc/image/reader.png)
为了提高切换章节效率，当点击目录中某个章节，通过ajax异步请求章节内容，这样可以不仅提高页面刷新速度而且具有很好的阅读体验；

其实使用ajax异步请求章节会出现一个问题，当网络延迟高，用户短时间内点击多个章节，会导致页面显示混乱；为了解决这个问题，我设计一个队列，将用户点击章节时将该事件缓存到队列中，如果短时间内接收多个点击事件，我其实只请求队列中最后的一个事件。

beibq还可以自动适配移动端界面，用户可以在移动设备上阅读。



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

