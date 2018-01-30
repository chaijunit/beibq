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
