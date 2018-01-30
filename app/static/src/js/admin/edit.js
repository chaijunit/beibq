(function(){


var catalog_data = {};

function sortCatalog(catalog, after){
    var next = catalog.next();
    var value = {id: catalog.attr("data-id"), next_id: next.attr("data-id")};
    $.axs("/api/sort_catalog", value, ajaxSuccess(function(resp){
        if(resp.status==="success"){
            after();
        }
    }));
    return false;
}

function selectCatalog(old, catalog, after){
    var id = catalog.attr("data-id");
        value = {id: id};
    $.axs("/api/select_catalog", value, ajaxSuccess(function(resp){
        if(resp.status=="success"){
            var value = resp.value;
            after(value.markdown);
            catalog_data = {id: id};
        }
    }));
    return false;
}

function newCatalog(catalog, data, after){
    data = {book_id: EDITBOOK.book, title: data.title, is_dir: data.is_dir};
    if(catalog){
        data.parent_id = catalog.attr("data-id");
    }
    $.axs("/api/add_catalog", data, ajaxSuccess(function(resp){
        if(resp.status=="success"){
            var value = {
                title: data.title,
                is_dir: data.is_dir, 
                href: resp.value.href,
                attrs: {id: resp.value.id}
            };
            if(catalog){
                value.nodeid = catalog.attr("data-nodeid");
            }
            after(value);
        }
    }));
    return false;
}

function renameCatalog(catalog, data, after){
    data = {id: catalog.attr("data-id"), title: data.title};
    $.axs("/api/rename_catalog", data, ajaxSuccess(function(resp){
        if(resp.status=="success"){
            after();
        }
    }));
    return false;
}


function deleteCatalog(catalog, after){
    var value = {id: catalog.attr("data-id")};
    $.axs("/api/delete_catalog", value, ajaxSuccess(function(resp){
        if(resp.status=="success"){
            after();
        }
    }));
    return false;
}


var diff_dmp = null;
function diff(before, after){
    if(!diff_dmp){
        diff_dmp = new diff_match_patch();
    }
    var d = diff_dmp.diff_main(before, after), item, op;
    for(var i = 0; i<d.length; i++){
        item = d[i];
        op = item[0];
        if(op != 1){
            item[1] = item[1].length;
        }
    }
    return d;
}


function save(data, after){
    var mdiff = diff(data.old_markdown, data.markdown),
        mtoken = $.md5(data.markdown),
        hdiff = diff(data.old_html, data.html),
        htoken = $.md5(data.html);
    var value = {
        mdiff: JSON.stringify(mdiff),
        mtoken: mtoken,
        hdiff: JSON.stringify(hdiff),
        htoken: htoken,
        id: catalog_data.id,
    };
    $.axs("/api/diffsave_catalog", value, function(resp){
        if(resp.status=="warning"){
            value = {
                markdown: data.markdown, 
                html: data.html, 
                id: catalog_data.id,
            };
            $.axs("/api/save_catalog", value, ajaxSuccess(function(resp){
                publishStatus(1);
                after();
            }), function(){
                notify("无法保存！！请求服务器失败", "error", "topCenter");
                after();
            });
        }else{
            after();
            publishStatus(1);
        }
    },function(){
        notify("无法保存！！请求服务器失败", "error", "topCenter");
        after();
    });
    return false;
}


function imageHandler(){
    var _this = this,
        modal_sel = _this.modal_sel,
        settings = _this.settings,
        content = modal_sel.find(".modal-content");
    if(_this.getDisabled()) return false;

    var html = [
        '<div class="book-dialog dialog-image">',
            '<ul class="select-tab nav nav-tabs">',
                '<li class="active">',
                    '<a href="[data-tab=local]" data-toggle="tab">上传本地图片</a>',
                '</li>',
                '<li>',
                    '<a href="[data-tab=network]" data-toggle="tab">图片链接</a>',
                '</li>',
            '</ul>',
            '<div class="tab-content">',
                '<div data-tab="local" class="tab-pane active">',
                    '<div class="thumbnail-add">',
                    '<span class="thumbnail">',
                        '<span class="fa fa-plus fa-5x fileinput-button add-button">',
                            '<input id="localupload" type="file" name="image" accept="image/gif,image/bmp,image/jpeg,image/png,image/jpg" multiple="">',
                        '</span>',
                    '</span>',
                    '</div>',
                    '<div class="show-image" style="display:none;">',
                        '<div class="thumbnail"><img></div>',
                        '<div style="margin:5px 0;"><a href="javascript:" class="fileinput-button">',
                        '<input id="changeupload" type="file" name="image" accept="image/gif,image/bmp,image/jpeg,image/png,image/jpg" multiple="">修改',
                        '</a></div>',
                        '<div class="form-group">',
                            '<label class="col-sm-3 control-label">图片描述：：</label>',
                            '<div class="col-sm-9">',
                                '<input name="name" class="form-control" type="text" placeholder="输入描述">',
                            '</div>',
                        '</div>',
                    '</div>',
                    '<div class="clearfix">',
                        '<div class="pull-right">',
                            '<button class="editor-btn ok">确定</button>',
                            '<button class="editor-btn" data-dismiss="modal">取消</button>',
                        '</div>', 
                    '</div>', 
                '</div>',
                '<div data-tab="network" class="tab-pane fade">',
                    '<div class="form-group">',
                        '<label class="col-sm-2 control-label">图片地址：</label>',
                        '<div class="col-sm-10">',
                            '<input class="form-control" name="src" type="text" placeholder="输入图片地址">',
                        '</div>',
                    '</div>',
                    '<div class="form-group">',
                        '<label class="col-sm-2 control-label">图片描述：</label>',
                        '<div class="col-sm-10">',
                            '<input class="form-control" name="name" type="text" placeholder="输入描述">',
                        '</div>',
                    '</div>',
                    '<div class="clearfix">',
                        '<div class="pull-right">',
                            '<button class="editor-btn ok">确定</button>',
                            '<button class="editor-btn" data-dismiss="modal">取消</button>',
                        '</div>',
                    '</div>',
                '</div>',
            '</div>',
        '</div>',
    ].join("\n");
    content.append(html);
    var localupload = content.find("#localupload"),
        changeupload = content.find("#changeupload");
    
    localupload.fileupload({
        url: "/api/upload_tmp",
        sequentialUploads: true,
        dataType: "json"
    });
    changeupload.fileupload({
        url:"/api/change_tmp", 
        sequentialUploads: true,
        dataType: "json",
    });

    localupload.on("fileuploadsubmit", function(e, data){
    }).on("fileuploaddone", function(e, data){
        if(data.result.status=="success"){
            content.find(".thumbnail-add").remove();
            var show_image = modal_sel.find(".show-image");
            var img = show_image.find(".thumbnail>img");
            img.attr("src", data.result.value.url);
            img.attr("alt", data.result.value.name);
            var input=show_image.find("input[name=name]");
            input.val(data.result.value.name);
            show_image.show();
        }
    }).on("keypress", function(event){
        if(event.keyCode==13){
            event.preventDefault();
        }
    });

    var imagereg = /[^\\/]+\.[^\\/]+$/;

    changeupload.on("fileuploadsubmit", function(e, data){
        var img = content.find(".show-image").find(".thumbnail>img");
        var filename = img.attr("src");
        filename = filename.match(imagereg)[0];
        data.formData = {filename: filename};
    }).on("fileuploaddone", function(e, data){
        var show_image = content.find(".show-image");
        var img = show_image.find(".thumbnail>img");
        img.attr("src", data.result.value.url);
        img.attr("alt", data.result.value.name);
        var input = show_image.find("input[name=name]");
        input.val(data.result.value.name);
    }).on("keypress", function(event){
        if(event.keyCode===13){
            event.preventDefault();
        }
    });

    var editor = _this.getEditor();
    content.find(".ok").bind("click", function(e){
        var tab = $(this).parents("div[data-tab]");
        var tabname = tab.attr("data-tab");
        var src, name, c;
        var cursor = editor.getCursor();
        var selection = editor.getSelection();
        if(tabname === "local"){
            src = tab.find(".show-image img").attr("src");
            name = tab.find("input[name=name]").val();
            name = name.replace(/\//g, "");
            if(src){
                value = {catalog_id: catalog_data.id, 
                    filename: src.match(imagereg)[0], name: name};
                $.axs("/api/upload_image", value, ajaxSuccess(function(resp){
                        if(resp.status=="success"){
                            tab.remove();
                            c = "![{0}]({1})".format(name, resp.value.url);
                            editor.replaceSelection(c);
                            editor.setCursor(cursor.line, 
                                cursor.ch+name.length+resp.value.url.length+5);
                        }
                    })
                );
            }
        }else{
            src = tab.find("input[name=src]").val();
            name = tab.find("input[name=name]").val();
            c = "![{0}]({1})".format(name, src);
            editor.replaceSelection(c);
            var pos = src ? cursor.ch+name.length+src.length+5 : cursor.ch+name.length+4;
            editor.setCursor(cursor.line, pos);
        }
        modal_sel.modal("hide");
        return false;
    });
    modal_sel.modal('show');
}

function file2files(editor){
    var dropdown_sel = $(this).parents(".book-dropdown"),
        nodeid = dropdown_sel.attr("data-nodeid");
    var catalog = editor.getCatalog(nodeid),
        id = catalog.attr("data-id");
    window.location="/admin/catalog/"+id+"/change";
    return false;
}

function publishStatus(status){
    var publish = $("#publish");
    if(status===1){
        publish.removeClass("disabled");
        publish.text("发布");
    }else{
        publish.addClass("disabled");
        publish.text("已发布");
    }
}
 
function publishBook(){
    var toolbar = $("#book-toolbar"),
        publish = toolbar.find("#publish");
    if(publish.hasClass("disabled")) return false;

    var value = {book_id: EDITBOOK.book};
    $.axs("/api/publish", {id: EDITBOOK.book}, ajaxSuccess(function(resp){
        if(resp.status=="success"){
            value = resp.value;
            publishStatus(0);
            notify("发布成功", "success", "topCenter");
        }
    }));
}

function new_editor(markdown, catalogs){
    var disabled = (catalogs.length==0) ? true: false;
    var options = {
        disabled: disabled,
        wraperId: "doc-wraper",
        save: true,
        full: true,
        markdown: markdown,
        lineNumbers: true,
        catalogs: catalogs,
        catalog: true,
        fileMenus: ["rename", "quote", "files", "delete"],
        menuTexts:{
            files: '<a href="#" name="files">转成多文件类型</a>'
        },
        menuHandlers:{
            files: file2files,
        },
        toolbarBtns: [
            ["backoff"],
            ["save"], 
            ["undo", "redo"], 
            ["bold", "italic", "del"],
            ["H1", "H2", "H3"], 
            ["list-ol", "list-ul", "quote", "table", "line"],
            ["link", "image", "code", "math"]
        ],
        toolbarRightBtns: [
            ["preview"],
            ["import"], 
            ["publish"], 
        ],
        toolbarCustomBtns: {
            "backoff": EDITBOOK.backoff,
            "import": '<button  type="button" data-toggle="modal" data-target="#import-modal" aria-label="导入内容" class="btn book-tool-btn" name="import">导入内容</button>',
            "publish":'<button type="button" class="btn book-tool-btn editor-publish" id="publish" name="publish">发布</button>',
        },
        event: {
            sortCatalog: sortCatalog,
            selectCatalog: selectCatalog,
            newCatalog: newCatalog,
            renameCatalog: renameCatalog,
            deleteCatalog: deleteCatalog,
            save: save,
        },
        toolbarHandlers: {
            image: imageHandler,
            publish: publishBook,
        },
    };
    window.editor = bookeditor(options);
}

/* 导入数据 */

var import_modal = $("#import-modal");
var import_ajax = "/api/import_html";
import_modal.on("click", ".tab-content .ok", function(event){
    if(editor.getDisabled()){
        notify("请先选择章节或新建章节", "error", "topCenter");
        import_modal.modal("hide");
        return false;
    }
    var tab = $(this).parents("div[data-tab]");
    var tabname = tab.attr("data-tab");
    var url, html, only_main, download;
    var loading = $("#loading");
    if(tabname === "url"){
        url = tab.find("input[name=url]").val();
        only_main = tab.find("input[name=only_main]").is(":checked");
        download= tab.find("input[name=download]").is(":checked");
        value = {"url": url};
        value.only_main = (only_main === true) ? 1 : 0;
        value.download = (download=== true) ? 1 : 0;
        loading.show();
        $.axs(import_ajax, value, ajaxSuccess(function(resp){
            if(resp.status == "success"){
                editor.setValue(resp.value);
            }
            loading.hide();
            editor.focus();
        }, function(){
            loading.hide();
            editor.focus();
        }), function(){
            loading.hide();
        });
    }else{
        html = tab.find("textarea[name=html]").val();
        only_main = tab.find("input[name=only_main]").is(":checked");
        download = tab.find("input[name=download]").is(":checked");
        value = {"html": html};
        value.only_main = (only_main === true) ? 1 : 0;
        value.download = (download === true) ? 1 : 0;
        loading.show();
        $.axs(import_ajax, value, ajaxSuccess(function(resp){
            if(resp.status == "success"){
                editor.setValue(resp.value);
            }
            loading.hide();
            editor.focus();
        }, function(){
            loading.hide();
            editor.focus();
        }), function(){
            loading.hide();
        });
    }   
    import_modal.modal("hide");
    return false;
}).on("hidden.bs.modal", function(event){
    var $this = $(this);
    $this.find("textarea[name=html]").val("");
    $this.find("input[name=only_main]").each(function(){this.checked = true;});
    $this.find("input[name=download]").each(function(){this.checked = false;});
    $this.find("input[name=url]").val("");
    $this.find(".select-tab > li").removeClass("active");
    $this.find(".select-tab > li:first").addClass("active");
    $this.find(".tab-content > .tab-pane").removeClass("active");
    $this.find(".tab-content > .tab-pane:first").addClass("active");
});


if(typeof EDITBOOK !== "undefined"){

    // 请求书籍的所有章节
    $.axs("/api/edit_book", {id: EDITBOOK.book}, ajaxSuccess(function(resp){
        if(resp.status === "success"){
            var value = resp.value;
            catalog_data = {id: value.id};
            new_editor(value.markdown, value.catalogs);
            publishStatus(value.publish);
        }
    }));
}

})();
