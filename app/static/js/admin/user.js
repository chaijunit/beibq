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

 $("#change").on("click", function(){
     var $this = $(this),
        form = $this.parents("form");
    if(form.hasClass("show")){
        $this.text("修改密码");
        form.removeClass("show");
    }else{
        $this.text("取消");
        form.addClass("show");
    }
});

$("#confirm").on("click", function(){
    var $this = $(this),
        form = $this.parents("form"),
        input = form.find("input[name=password]");
    var value = {id: USER, password: input.val()};
    
    $.axs("/api/change_password", value, function(){
        var change = $("#change");
        form.removeClass("show");
        change.text("修改密码");
        var html = [
            '<div class="alert alert-success" role="alert">',
            '<button type="button" class="close" data-dismiss="alert" aria-label="Close">',
            '<span aria-hidden="true">&times;</span></button>修改成功</div>'];
        form.prepend(html.join("\n"));
    });
});
    var avatar_modal = $("#avatar-modal"),
        avatar_body = '<div id="avatar-preview"><div class="avatar-preview"></div></div><div class="image-menu"><span class="fa fa-square-o left-icon"></span><span class="fa fa-square-o right-icon"></span><input id="avatar-zoom-input" type="range" class="image-zoom-input"></div>';

    $("#avatar-preview").cropit({
        $preview: $("#avatar-preview").find(".avatar-preview"),
        $fileInput:$("#avatar-input"),
        $zoomSlider: avatar_modal.find("#avatar-zoom-input"),       // 拉伸大小
        imageBackground: true,              // 显示图片背景
        imageBackgroundBorderWidth: 40,     // 背景框超出preview的长度
        smallImage: "stretch",      // 运行小图片加载，并自动拉伸到preview大小
        exportZoom: 1,              // export后，图片大小是preview窗口大小的2倍
        onImageLoaded: function(e){
            avatar_modal.modal();
        },
    });
    avatar_modal.on("click", ".ok", function(e){
        var binary = $("#avatar-preview").cropit("export");
        binary = binary.replace(/^.+,/,"");
        var loading = $("#loading");
        loading.show();
        $.axs("/api/change_avatar", {binary:binary, id: USER}, ajaxSuccess(function(resp){
            if(resp.status==="success"){
                var src = resp.value.src;
                var avatar = $("#avatar");
                var img = avatar.find("img");
                img.attr('src', src);
                avatar_modal.modal("hide");
            }
            loading.hide();
        }), function(){
            loading.hide();
        });
    });

    avatar_modal.on("hide.bs.modal", function(e){
        var avatar = $("#avatar");
        $("#avatar-input").remove();
        $('<input id="avatar-input" type="file">').appendTo(avatar);
        var modal_body = avatar_modal.find(".modal-body");
        modal_body.html("");
        modal_body.html(avatar_body);
        var avatar_preview = $("#avatar-preview");
        avatar_preview.cropit({
            $preview: $("#avatar-preview").find(".avatar-preview"),
            $fileInput:$("#avatar-input"),
            $zoomSlider: avatar_modal.find("#avatar-zoom-input"),
            imageBackground: true,
            imageBackgroundBorderWidth: 40,
            smallImage: "stretch",
            exportZoom: 1,
            onImageLoaded: function(e){
                avatar_modal.modal();
            },
        });
    });
 
})();
