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


