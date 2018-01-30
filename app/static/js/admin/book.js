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

(function(){
    var cover_modal = $("#cover-modal");
    var cover_body = '<div id="cover-preview"><div class="cover-preview"></div></div><div class="image-setting-menu"><span class="fa fa-square-o left-icon"></span><span class="fa fa-square-o right-icon"></span><input id="cover-zoom-input" type="range" class="image-zoom-input"></div>';
    $("#cover-preview").cropit({
        $preview: $("#cover-preview").find(".cover-preview"),
        $fileInput: $("#cover-input"),
        $zoomSlider: cover_modal.find("#cover-zoom-input"),
        imageBackground: true,
        imageBackgroundBorderWidth: 40,
        smallImage: "stretch",
        exportZoom: 1,
        onImageLoaded: function(e){
            cover_modal.modal();
        },
    });
     
    cover_modal.on("click", ".ok", function(e){
        var binary = $("#cover-preview").cropit("export");
        binary = binary.replace(/^.+,/,"");
        var value = {id: BOOK, binary: binary};
        $.axs("/api/change_cover", value, ajaxSuccess(function(resp){
            if(resp.status==="success"){
                var src = resp.value.src;
                var cover = $("#cover");
                var img = cover.find("img");
                if(img.length <1){
                    var fa_book = cover.find(".fa-book");
                    fa_book.remove();
                    $('<img src="'+src+'" >').appendTo(cover);
                
                }else{
                    img.attr('src', src);
                }
                cover_modal.modal("hide");
            }
        }));
    });

    cover_modal.on("hide.bs.modal", function(e){
        var cover = $("#cover");
        $("#cover-input").remove();
        $('<input id="cover-input" type="file">').appendTo(cover);
        var modal_body = cover_modal.find(".modal-body");
        modal_body.html("");
        modal_body.html(cover_body);
        var cover_preview = $("#cover-preview");
        cover_preview.cropit({
            $preview: $("#cover-preview").find(".cover-preview"),
            $fileInput:$("#cover-input"),
            $zoomSlider: cover_modal.find("#cover-zoom-input"),       // 拉伸大小
            imageBackground: true,              // 显示图片背景
            imageBackgroundBorderWidth: 40,     // 背景框超出preview的长度
            smallImage: "stretch",      // 运行小图片加载，并自动拉伸到preview大小
            exportZoom: 1,              // export后，图片大小是preview窗口大小的2倍
            onImageLoaded: function(e){
                cover_modal.modal();
            },
        });
    });

    var delete_modal = $("#delete-modal"),
        book_group = $("#book-group");
    book_group.on("click", ".delete-book", function(e){
        var $this = $(this),
            id = $this.attr("data-id");
        delete_modal.attr("data-id", id);
        delete_modal.modal();
        return false;
    });

    delete_modal.on("click", ".ok", function(e){
        var id = delete_modal.attr("data-id");
        $.axs("/api/delete_book", {id:id}, ajaxSuccess(function(resp){
            if(resp.status=="success"){
                var item = book_group.find(".delete-book[data-id="+id+"]");
                item = item.parents(".book-item");
                item.remove();
            }
        }));
        delete_modal.modal("hide");
    }).on("hidden.bs.modal", function(){
        delete_modal.removeAttr("publish-id");
        delete_modal.removeAttr("source");
    });


})();


