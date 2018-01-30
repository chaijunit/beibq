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


