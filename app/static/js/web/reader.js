(function(){
    jQuery.prototype.serializeObject=function(){  
        var obj = {};
        $.each(this.serializeArray(),function(index,param){  
            if(!(param.name in obj)){  
                obj[param.name]=param.value;  
            }  
        });  
        return obj;  
    };
    /**
     * ajax封装
     * url 发送请求的地址
     * data 发送到服务器的数据，数组存储，如：{"date": new Date().getTime(), "state": 1}
     * async 默认值: true。默认设置下，所有请求均为异步请求。如果需要发送同步请求，请将此选项设置为 false。
     *       注意，同步请求将锁住浏览器，用户其它操作必须等待请求完成才可以执行。
     * type 请求方式("POST" 或 "GET")， 默认为 "GET"
     * dataType 预期服务器返回的数据类型，常用的如：xml、html、json、text
     * successfn 成功回调函数
     * errorfn 失败回调函数
     */
    jQuery.prototype.ax = function(url, data, async, type, dataType, successfn, errorfn) {
        async = (async === null || async === "" || typeof(async)=="undefined")? "true" : async;
        type = (type === null || type==="" || typeof(type)=="undefined")? "post" : type;
        dataType = (dataType === null || dataType==="" || typeof(dataType)=="undefined")? 
            "json" : dataType;
        data = (data===null || data==="" || typeof(data)=="undefined")? 
            {"date": new Date().getTime()} : data;
        $.ajax({
            type: type,
            async: async,
            data: data,
            url: url,
            dataType: dataType,
            success: function(d){
                successfn(d);
            },
            error: function(e){
                errorfn(e);
            }
        });
    };

    /**
     * ajax封装
     * url 发送请求的地址
     * data 发送到服务器的数据，数组存储，如：{"date": new Date().getTime(), "state": 1}
     * successfn 成功回调函数
     */
    jQuery.axs=function(url, data, successfn, errorfn) {
        data = (data===null || data==="" || typeof(data)=="undefined")? {"date": new Date().getTime()} : data;
        $.ajax({
            type: "post",
            data: data,
            url: url,
            dataType: "json",
            success: function(d){
                successfn(d);
            },
            error:function(e){
                if(typeof(errorfn)==="function"){
                    errorfn(e);
                }
            }
        });
    };
    
    basename_reg = new RegExp('[^\\/]+(?=\\.[^\\.]+$)');

    jQuery.basename = function(filename){
        return basename_reg.exec(filename)[0];
    };
    
    ext_reg = new RegExp('\\.[^\\.]+');
    jQuery.file_ext= function(filename){
        return ext_reg.exec(filename)[0];
    };

    jQuery.getUrlParam = function(name){
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)"); //构造一个含有目标参数的正则表达式对象
        var r = window.location.search.substr(1).match(reg);  //匹配目标参数
        if (r !== null) return decodeURI(r[2]); return null; //返回参数值
    };
    
    jQuery.newGetUrlParam = function(url, name){
        var parser = document.createElement('a');
        parser.href = url;
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)"); //构造一个含有目标参数的正则表达式对象
        var r = parser.search.substr(1).match(reg);  //匹配目标参数
        if (r !== null) return decodeURI(r[2]); return null; //返回参数值
    };

})();

(function(){
    String.prototype.trim = function() {
        return this.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
    };
})();

(function(){
    window.notify = function(text, type, layout){
        return noty({
            text: text,
            type: (!type)? "warning": type,
            dismissQueue: true,
            timeout: 2000,
            closeWith: ["click", "button"],
            layout: (!layout) ? "topRight": layout,
            theme: "relax",
        });
    };
    window.ajaxSuccess = function(func, warn_func){
        return function(resp){
            if(resp.status=="warning"){
                // 发出警告
                notify(resp.msg, "error", "topCenter");
                if( typeof warn_func !== "undefined"){
                    warn_func();
                }
            }else{
                func(resp);
            }
        };
    };
})();

(function(factory){
    window.bbLink = factory();
}(function(){
    if(typeof($) === 'undefined')
        return;

    var bbLink = function(options){
        return new bbLink.init(options);
    };
    bbLink.queue = [];
    bbLink.is_running = false;
    bbLink.task_index = -1;

    bbLink.defaults = {
        linkWraper: "#book-catalogs",
        replaceWraper: "#content-body",
        loadingWraper: "#header-loading",
        bookContent: "#book-content",
        callback: function(){},
    };
 
    bbLink.init = function(options){
        var bb= bbLink;
        options = options || {};
        if(typeof options == 'string')
            options = { elements: options };
        options = bb.options = $.extend(true, bb.defaults, options);
        
        var wraper = bb.$wraper = $(options.linkWraper);
        wraper.find(".bb-link").click(bb.click_event);
        bb.$replace = $(options.replaceWraper);
        bb.$loading = $(options.loadingWraper);
        bb.$bookContent = $(options.bookContent);
        return bbLink;
    };

    bbLink.click_event = function(e){
        bbLink.click_handle(this);
        return false;
    };

    bbLink.click_handle = function(_this){
        var bb = bbLink;
        var queue = bb.queue;
        task = {
            id: _this.getAttribute("data-id"), 
            catalog_id: _this.getAttribute("data-catalog"),
            this: _this,
        };
        queue.push(task);
        if(bb.is_running)
            return false;
        bb.ajax_handle();
    };


    bbLink.get_task = function(){
        var bb = bbLink;
        var queue = bb.queue;
        var index = bb.task_index;
        if(queue.length === 0 || (queue.length < (index+2)))
            return;

        bb.task_index = queue.length - 1;
        return queue[bb.task_index];
    };

    bbLink.loading = function(){
        var bb = bbLink;
        if(bb.is_running)
            return;
        if(!bb.$loading.hasClass("loading")){
            bb.$loading.addClass("loading");
        }
    };

    bbLink.loaded = function(){
        var bb = bbLink;
        if(!bb.is_running)
            return;
        if(bb.$loading.hasClass("loading")){
            bb.$loading.removeClass("loading");
        }
    };

    bbLink.reset_status = function(){
        var bb = bbLink;
        bb.loaded();
        bb.queue = [];
        bb.is_running = false;
        bb.task_index = -1;
    };

    // 删除head中用来统计的js文件
    bbLink.remove_tongji = function(){
        var head = $(document).find("head");
        var scripts = head.find("script");
        scripts.each(function(){
            var src = this.src;
            if(src.search("hm.baidu.com") != -1 ||
                src.search("push.zhanzhang.baidu.com") != -1 ||
                src.search("passport.qihucdn.com") != -1){
                this.remove();
            }
        });
    };

    bbLink.get_content = function($html){
        var i, node;
        for(i=0;i<$html.length; i++){
            node = $html[i];
            if(node.tagName==="DIV" && (node.getAttribute("id") === "html-content")){
                return $(node);
            }
        }
    };

    bbLink.ajax_handle = function(){
        var bb = bbLink;
        var task, value;
        task = bb.get_task();
        var tag = task.this;
        value = {id: task.id};
        if(typeof(task.catalog_id) !== "undefined")
            value.catalog_id = task.catalog_id;
        bb.loading();
        bb.is_running = true;
        $.axs("/api/reader", value, ajaxSuccess(function(resp){
            if(resp.status=="success"){
                if(bb.queue.length > (bb.task_index+1)){
                    bb.ajax_handle();
                    return;
                }
                var value = resp.value;
                var $html = $(value.html);
                if(typeof(history.pushState) === "undefined"){
                    History.pushState({path: tag.href}, null, tag.href);
                }else{
                    history.pushState({path: tag.href}, null, tag.href);
                }
                document.title = value.title;
                var $content = bb.get_content($html);
                if(typeof($content) === "undefined"){
                    return;
                }

                bb.$replace.html($html);
                bb.$wraper.find(".bb-link.active").removeClass("active");
                $(tag).addClass("active");

                bb.$bookContent.scrollTop(0);
                bb.reset_status();

            }else{
                window.location.href=tag.href;
            }
        }));
        bb.options.callback();
    };
    
    return bbLink;
    

}));
(function(){

    var book_catalogs = $("#book-catalogs");
    var root = $(document.documentElement);
    
    function prev_page(){
        var catalog = book_catalogs.find(".reader-catalog.active");
        if(catalog.length !== 1){
            return false;
        }
        var prev = catalog.prev();
        if(prev.length !== 1){
            notify("已经是第一个章节", "warning", "topCenter");
            return false;
        }
        book_link.click_handle(prev[0]);
    }

    function next_page(){
        var catalog = book_catalogs.find(".reader-catalog.active");
        if(catalog.length !== 1){
            return false;
        }
        var next = catalog.next();
        if(next.length !== 1){
            notify("已经是最后一个章节", "warning", "topCenter");
            return false;
        }
        book_link.click_handle(next[0]);
    }

    Mousetrap.bind("left", function(){
        prev_page();
        return false;
    });
    
    Mousetrap.bind("right", function(){
        next_page();
        return false;
    });


    function switch_catalog(e){
        if(root.hasClass('catalog-menu-open')){
            close_catalog(root);
        }else{
            root.attr("class", "catalog-menu-open");
        }
    }

    function close_catalog(root){
        root.attr("class", "catalog-menu-closing");
        setTimeout(function(){
            root.removeClass("catalog-menu-closing");
        }, 300);
    }


    $("#catalog-control-btn").on("click", switch_catalog);
    $("#suspend-control-btn").on("click", switch_catalog);

    $("#content-cover").on("click", function(){
        if(root.hasClass("catalog-menu-open")){
            close_catalog(root);
        }
    });

    $("#book-wraper").on("click", ".bb-link-action", function(e){
        var $this = $(this);
        method = $this.attr("data-method");
        if(method=="prev"){
            prev_page();
        }else{
            next_page();
        }
        return false;
    });

    function click_callback(){
        var root = $(document.documentElement);
        if(root.width() <= 810){
            if(root.hasClass("catalog-menu-open")){
                close_catalog(root);
            }
        }
    }

    window.book_link = bbLink({
        callback: click_callback,
    });
    
    $("#tab-menu").on("click", ".tab-item", function(e){
        e.preventDefault();
        $(this).tab("show");
    });


    $("#tab-menu").on("show.bs.tab", ".tab-item", function(e){
        var $this = $(this);
        var tabs = $("#tab-menu");
        tabs.find(".tab-item.active").removeClass("active");
        $this.addClass("active");
        var href = $this.attr("href");
        var target, loading, value;
        target = $(href);
        loading = target.find(".loading");
        if(loading.length === 0){
            return;
        }
        loading.removeClass("hide");
        var id = tabs.attr("data-id");
        value = {id: id};
        $.axs("/api/book_info", value, ajaxSuccess(function(resp){
            if(resp.status=="success"){
                target.html(resp.value);
            }
        }));
 
    });


    function swipedetect(el, callback){
        var touchsurface = el,
        swipedir,
        startX,
        startY,
        distX,
        distY,
        threshold = 50, //required min distance traveled to be considered swipe
        restraint = 50, // maximum distance allowed at the same time in perpendicular direction
        allowedTime = 300, // maximum time allowed to travel that distance
        elapsedTime,
        startTime,
        handleswipe = callback || function(swipedir){};
      
        touchsurface.addEventListener('touchstart', function(e){
            var touchobj = e.changedTouches[0];
            swipedir = 'none';
            dist = 0;
            startX = touchobj.pageX;
            startY = touchobj.pageY;
            startTime = new Date().getTime(); // record time when finger first makes contact with surface
        }, false);

        touchsurface.addEventListener('touchmove', function(e){
        }, false);
      
        touchsurface.addEventListener('touchend', function(e){
            var touchobj = e.changedTouches[0];
            distX = touchobj.pageX - startX;
            distY = touchobj.pageY - startY;
            elapsedTime = new Date().getTime() - startTime;
            if (elapsedTime <= allowedTime){
                if (Math.abs(distX) >= threshold && Math.abs(distY) <= restraint){
                    swipedir = (distX < 0)? 'left' : 'right';
                }
            }
            handleswipe(swipedir);
        }, false);
    }

    var wraper = document.getElementById("book-wraper");
    swipedetect(wraper, function(swipedir){
        if(swipedir == 'left'){
            next_page();
            return false;
        }else if(swipedir == 'right'){
            prev_page();
            return false;
        }
    });


})();


