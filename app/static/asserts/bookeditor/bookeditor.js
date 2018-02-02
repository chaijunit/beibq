(function(factory){
    window.bookeditor = factory();
}(function(){

if(typeof($) === 'undefined'){
    return;
}

String.prototype.format = function () {
    var args = arguments;
    return this.replace(/\{(\d+)\}/g, function (m, n) { return args[n]; });
};

$.fn.serializeObject=function(){
    var obj = {};
    $.each(this.serializeArray(),function(index,param){
        if(!(param.name in obj)){
            obj[param.name]=param.value;
        }
    });
    return obj;
};

function mouseOrTouch(mouseEventType, touchEventType){
    mouseEventType = mouseEventType || "click";
    touchEventType = touchEventType || "touchend";
    var eventType = mouseEventType;
    try{
        document.createEvent("TouchEvent");
        eventType = touchEventType;
    }catch(e){}
    return eventType;
}

var validateOS = function(){
    if(navigator.userAgent.indexOf("Window")>0){
        return "Windows";
    }else if(navigator.userAgent.indexOf("Mac OS X")>0) {
        return "MacOS";
    }else if(navigator.userAgent.indexOf("Linux")>0) {
        return "Linux";
    }
    return "Other";
};

global = {
    fullClass: "book-full-wraper",
    notfullClass: "book-notfull-wraper",
    wraperClass: "book-wraper",
    scrollbarClass: "book-scrollbar",
    katexClass: "book-katex",
    modalClass: "book-modal",

    state: {
        loaded: false,
        preview: false,
        savebtn: false,     // 保存状态 默认: false => 不可保存
        undobtn: false,     // 撤销状态 默认: false => 不可撤销
        redobtn: false,     // 重做状态 默认: false
    }

};

global.os = validateOS();

function Catalog(bookeditor, editor, options){
    var _this = this;
    var settings = _this.settings = options;
    _this.bookeditor = bookeditor;
    _this.editor = editor;
    var catalog_html = [
        '<div class="book-catalog-wraper" id="book-catalog-wraper">',
            '<div class="book-catalog-head">书籍目录</div>',
            '<div class="book-catalog-body" id="book-catalog-body">',
                '<div class="book-catalog-group" id="book-catalog-group">',
                '</div>',
                '<div class="book-catalog-footer">',
                    '<button id="new-book-catalog" class="editor-btn">新建章节</button>',
                '</div>',
            '</div>',
        '</div>',
    ].join("\n");
    bookeditor.main_sel.prepend(catalog_html);
    var catalog_sel = _this.catalog_sel = $("#book-catalog-group"),
        wraper_sel =_this.wraper_sel = $("#book-catalog-wraper"),
        new_sel = _this.new_sel = $("#new-book-catalog");
    _this.new_sel = $("#new-catalog");

    $("#book-catalog-body").on("click", ".menu", function(event){
        var $this = $(this),
        offset = $this.offset(),
        $parent = $this.parent(),
        nodeid = $parent.attr("data-nodeid"),
        target = $this.attr("data-target"),
        menu = $(target);
        menu.attr("data-nodeid", nodeid);

        var dropdown = menu.find(".dropdown-menu");
        dropdown.css("left", offset.left);
        dropdown.css("top", offset.top + $this.height());
    });

    function newDropdown(menus){
        var html = ['<ul class="dropdown-menu">'], menu;
        for(var i in menus){
            menu = menus[i];
            if(typeof settings.menuTexts[menu]==="undefined")continue;
            html.push('<li>'+settings.menuTexts[menu]+'</li>');
        }
        html.push('</ul');
        return html;
    }
    var html = ['<div id="files-dropdown" class="book-dropdown">'];
    html = html.concat(newDropdown(settings.filesMenus));
    html.push('</div>');
    wraper_sel.append(html.join("\n"));

    html = ['<div id="file-dropdown" class="book-dropdown">'];
    html = html.concat(newDropdown(settings.fileMenus));
    html.push('</div>');
    wraper_sel.append(html.join("\n"));

    var dropdown_sel = $(".book-dropdown");
    dropdown_sel.on("hidden.bs.dropdown", function(){
        $(this).removeAttr("data-nodeid");
    });

    dropdown_sel.on("click", ".dropdown-menu > li > a", function(event){
        var $this = $(this),
            name = $this.attr("name"),
            handlers = _this.handlers;
            customHandlers = settings.menuHandlers;

        if(typeof name=== "undefined")return true;
        event.preventDefault();
        if(typeof customHandlers[name] !== "undefined"){ 
            $.proxy(customHandlers[name], this)(bookeditor);
        }else if(typeof handlers[name] !== "undefined"){
            $.proxy(handlers[name], this)(bookeditor);
        }
        return true;
    });

    new_sel.on("click", function(event){
        var settings = _this.settings,
            handlers = _this.handlers,
            customHandlers = settings.menuHandlers;
        event.preventDefault();

        if(typeof customHandlers.new !== "undefined"){
            $.proxy(customHandlers.new, this)(bookeditor);
        }else if(typeof handlers.new !== "undefined"){
            $.proxy(handlers.new, this)(bookeditor);
        }
        return true;
    });

    _this.loadCatalogs(settings.catalogs);
    return _this;
}

function newNode(value){
    var node = {
        text: value.title,
        href: value.href,
        selectable: true,
        attrs: value.attrs,
        state:{
            checked: false,
            disabled: false,
            selected: false
        }
    }, dropdown_id;
    if(value.nodeid){
        node.parentId = value.nodeid;
    }
    if(value.selected){
        node.state.selected = true;
    }

    if(value.is_dir){
        node.icon = "fa fa-files-o";
        node.classs = ["files"];
        dropdown_id = "files-dropdown";
    }else{
        node.icon = "fa fa-file";
        node.classs = ["file"];
        dropdown_id = "file-dropdown";
    }
    node.custom = '<a class="menu" href="javascript:void(0)" data-toggle="dropdown" data-target="#'+dropdown_id+'"><i class="fa fa-ellipsis-h menu-icon"></i></a>';
    return node;
}

Catalog.json2catalogs = function(catalogs){
    var nodes = [], node;
    var dropdown_id, catalog;
    for(var i in catalogs){
        catalog = catalogs[i];
        node = newNode(catalog);
        if(catalog.catalogs && catalog.catalogs.length>0){
            node.nodes = Catalog.json2catalogs(catalog.catalogs);
        }
        nodes.push(node);
    }
    return nodes;
};


Catalog.prototype = {
    loadCatalogs: function(catalogs){
        var _this = this;
        var nodes = Catalog.json2catalogs(catalogs);
        _this.createCatalogs(nodes);
        var title = _this.getSelectCatalogTitle();
        if(typeof title !== "undefined")
            _this.editor.statusDone('正在编辑： <span style="color:#444;">'+title+'</span>');
    },
    createCatalogs: function(nodes){
        var _this = this;
        _this.treeview = _this.catalog_sel.treeview({
            data: nodes,
            expandIcon: "fa fa-caret-right",
            collapseIcon: "fa fa-caret-down",
            enableLinks: true,
            levels: 3,
            select_node: function(catalog){
                _this.selectCatalog(catalog);
            },
        });

        _this.sortCatalogs();
    },
    sortCatalogs: function(){
        var _this = this;
        Sortable.create(_this.catalog_sel.find(".list-group")[0],{
            filter: ".files",
            onUpdate: function(e){
                _this.sortCatalog(e);
            }
        });
    },
    selectCatalog: function(catalog){
        var _this = this,
            bookeditor = _this.bookeditor,
            settings = _this.settings,
            editor = _this.editor;
        if(bookeditor.getDisabled()){
            bookeditor.enabled();
        }
        editor.statusDoing("正在切换章节");
        function after(markdown){
            markdown = markdown ? markdown : "";
            editor.reload(markdown);
            var title = catalog.find(".catalog-link").text();
            editor.statusDone('正在编辑： <span style="color:#444;">'+title+'</span>');
        }
        var oldCatalog = _this.getSelectCatalog();
        if($.proxy(settings.event.selectCatalog, bookeditor)(oldCatalog, catalog, after)===false){
            return;
        }
        after();
    },
    getSelectCatalog: function(){
        var catalog_sel = this.catalog_sel,
            catalog = catalog_sel.find(".list-group-item.node-selected");
        return catalog;
    },
    getSelectCatalogTitle: function(){
        var catalog = this.getSelectCatalog();
        return catalog.find(".catalog-link").text();
    },
    sortCatalog: function(e){
        var _this = this,
            bookeditor = _this.bookeditor,
            catalog = $(e.item),
            next = catalog.next(),
            settings = _this.settings;

        function after(){
            _this.treeview.treeview("moveTree", {item: catalog, next: next});
            catalog.find(".indent").remove();
            if(next.length>0){
                var indent = next.find(".indent");
                for(var i=0; i<indent.length;i++){
                    catalog.prepend('<span class="indent"></span>');
                }
            }
        }
        if($.proxy(settings.event.sortCatalog, bookeditor)(catalog, after) === false){
            return;
        }
        after();
    },
    clickCatalog: function(e){
        var catalog = $(this).parent(".list-gorup-item");
        if(catalog.hasClass("node-check")) return false;
    },
    newCatalog: function(value){
        var treeview = this.treeview;
        var node = newNode(value);

        treeview.treeview("addNode", node);
        if(value.nodeid){
            treeview.treeview("expandNode", [parseInt(value.nodeid)]);
        }
    },
    handlers:{
        new: function(_this){
            var settings = _this.settings,
                modal_sel = _this.modal_sel,
                content = modal_sel.find(".modal-content");
            var html = [
                '<div class="book-dialog new-dialog">',
                    '<h3>新建章节</h3>',
                    '<form>',
                        '<input type="checkbox" name="is_dir" class="hidden">',
                        '<div class="form-group">',
                            '<h4 class="title">章节名称</h4>',
                            '<input type="text" name="title" class="form-control" autocomplete="off" placeholder="名称" >',
                        '</div>',
                        '<div class="form-group">',
                            '<h4 class="title">章节类型</h4>',
                            '<label class="catalog-type">',
                                '<input type="radio" value="0" class="catalog-type-radio" name="is_dir" checked="checked"/>',
                                '<i class="fa fa-file"></i> 单章节 <span class="gray-white">(不能创建子章节)</span>',

                            '</label>',
                            '<label class="catalog-type">',
                                '<input type="radio" value="1" class="catalog-type-radio" name="is_dir"/>',
                                '<i class="fa fa-files-o"></i> 多章节 <span class="gray-white">(可以创建子章节)</span>',
                            '</label>',
                        '</div>',
                    '</form>',
                    '<div class="clearfix">',
                        '<div class="col-sm-6 center-text">',
                            '<button class="editor-btn ok" href="javascript:">新建</button>',
                        '</div>',
                        '<div class="col-sm-6 center-text">',
                            '<button class="editor-btn cancel" data-dismiss="modal">取消</button>',
                        '</div>',
                    '</div>',
                '</div>',
            ].join("\n");
            content.append(html);
            var dropdown_sel = $(this).parents(".book-dropdown"),
                nodeid = dropdown_sel.attr("data-nodeid");
            content.find(".ok").bind("click", function(e){
                var $this = $(this),
                    form = $this.parents(".new-dialog").find("form"),
                    data = form.serializeObject(),
                    catalog=null;
                data.title = data.title.replace(/\//g, ""); // 替换掉title中包含/的字符
                data.is_dir = data.is_dir == "1" ? 1: 0;
                if(data.title === "") return false;
                if(nodeid){
                    catalog = _this.getCatalog(nodeid);
                }

                function after(value){
                    value = value ? value : {title: data.title, nodeid: nodeid, is_dir: data.is_dir};
                    _this.catalog.newCatalog(value);
                    modal_sel.modal("hide");
                }

                if($.proxy(settings.event.newCatalog, _this)(catalog, data, after)===false){
                    return false;
                }
                after();
                return false;
            });
            modal_sel.modal("show");
        },
        rename: function(_this){
            var settings = _this.settings,
                dropdown_sel = $(this).parents(".book-dropdown"),
                nodeid = dropdown_sel.attr("data-nodeid");
            var catalog = _this.getCatalog(nodeid);

            if(catalog.length<1) return false;

            var title = catalog.find(".catalog-link").text(),
                modal_sel = _this.modal_sel,
                content = modal_sel.find(".modal-content");

            var html = [
                '<div class="book-dialog">',
                    '<h3>重命名</h3>',
                    '<form class="form-horizontal">',
                        '<div class="form-group">',
                            '<div class="col-sm-9">',
                                '<input name="title" type="text" autocomplete="off" placeholder="请输入名称" class="form-control" value="'+title+'">',
                            '</div>',
                            '<div class="col-sm-3">',
                                '<button class="editor-btn rename ok" type="submit" href="javascript:">确定</button>',
                            '</div>',
                        '</div>',
                    '</form>',
                '</div>',
            ].join("\n");
            content.html(html);

            content.find(".ok").bind("click", function(e){
                var $this = $(this),
                    form = $this.parents("form"),
                    data = form.serializeObject();

                data.title = data.title.replace(/\//g, "");     // 替换掉title中包含/的字符
                if(data.title === "" || !nodeid){
                    modal_sel.modal("hide");
                    return false;
                }

                function after(){
                    _this.catalog.treeview.treeview("renameNode", {text: data.title, nodeId: nodeid});
                    modal_sel.modal("hide");
                }

                if($.proxy(settings.event.renameCatalog, _this)(catalog, data, after) === false){
                    return false;
                }

                after();
                return false;
            });
            modal_sel.modal("show");
        },
        delete: function(_this){
            var settings = _this.settings,
                modal_sel = _this.modal_sel,
                content = modal_sel.find(".modal-content");
            var html = [
                '<div class="book-dialog delete-dialog">',
                    '<div class="center-text">',
                        '<h4>确定要删除吗</h4>',
                    '</div>',
                    '<div class="clearfix">',
                        '<div class="pull-right">',
                            '<button href="javascript:" class="editor-btn" data-dismiss="modal">取消</button>',
                            '<button href="javascript:" class="editor-btn danger ok">删除</button>',
                        '</div>',
                    '</div>',
                '</div>',
            ].join("\n");
            content.append(html);
            var dropdown_sel = $(this).parents(".book-dropdown"),
                nodeid = dropdown_sel.attr("data-nodeid");
            content.find(".ok").bind("click", function(e){
                var catalog = _this.getCatalog(nodeid);
                if(catalog.length<1){
                    modal_sel.modal("hide");
                    return false;
                }
                function after(){
                    _this.catalog.treeview.treeview("deleteNode", nodeid);
                    modal_sel.modal("hide");
                }

                if($.proxy(settings.event.deleteCatalog, _this)(catalog, after)===false){
                    return false;
                }
                after();
                return false;
            });
            modal_sel.modal("show");
        },
        quote: function(_this){
            var dropdown_sel = $(this).parents(".book-dropdown"),
                nodeid = dropdown_sel.attr("data-nodeid");
            var catalog = _this.getCatalog(nodeid);
                link = catalog.find(".catalog-link")[0];

            var content = "["+link.innerHTML+"]("+link.pathname+")";
            _this.write(content);
        },
    }
};

function ToolBar(bookeditor, editor, options){
    var _this = this;
    var settings = _this.settings = options;
    _this.bookeditor = bookeditor;
    _this.editor = editor;
    var toolbar_sel = _this.toolbar_sel = bookeditor.toolbar_sel;
    
    _this.newBtns(settings.toolbarBtns, false);
    _this.newBtns(settings.toolbarRightBtns, true);
    toolbar_sel.find(".tooltipped").tooltip({
        placement: "bottom",
        title: function(){
            return $(this).attr("aria-label");
        }
    });

    if(settings.watch){
        var watch=toolbar_sel.find(".book-tool-btn[name=preview]");
        watch.addClass("watched");
    }

    _this.setHandlers();

    _this.registerKeymaps();
    return _this;
}

ToolBar.prototype = {
    newBtns: function(toolbarBtns, isRight){
        var _this = this,
            os = (global.os==="MacOS") ? "macos" : "common",
            settings = _this.settings,
            tooltip = settings.tooltip[os],
            toolbar_sel = _this.toolbar_sel,
            btns = [], title, custom;

        for(var i=0; i < toolbarBtns.length; i++){
            btns = toolbarBtns[i];
            if(typeof btns !== "object" || btns.length < 1){
                continue;
            }
            tool_group = $('<div class="book-tool-group"></div>');
            if(isRight){
                tool_group.css("float", "right");
            }
            toolbar_sel.append(tool_group);
            for(var j = 0; j < btns.length; j++){
                name = btns[j];
                if(typeof settings.toolbarCustomBtns[name] !== "undefined"){
                    custom = $(settings.toolbarCustomBtns[name]);
                    custom.attr("name", name);
                    tool_group.append(custom);
                }else{
                    title = tooltip[name];
                    if(name==="H1" || name==="H2" || name==="H3"){
                        tool_group.append('<button class="btn book-tool-btn tooltipped" name="' + 
                            name + '" aria-label="' + title + '">' + name + '</button>');
                    }else{
                        tool_group.append('<button class="btn book-tool-btn tooltipped" name="' + 
                            name + '" aria-label="' + title + '"><i class="' +
                            settings.toolbarBtnClass[name] + 
                            '" aria-hidden="true"></i></button>');
                    }
                }
            }
        }
    },
    setHandlers: function(){
        var _this = this,
            settings = _this.settings,
            toolbar_sel = _this.toolbar_sel,
            bookeditor = _this.bookeditor,
            editor = _this.editor.editor,
            handlers = _this.handlers,
            customHandlers = settings.toolbarHandlers;

        var toolbarBtns = toolbar_sel.find(".book-tool-btn");
        var name, cursor, selection;
        toolbarBtns.bind(mouseOrTouch("click", "touchend"), function(event){
            name = $(this).attr("name");
            cursor = editor.getCursor();
            var selection = editor.getSelection();
            
            if(!name || name===""){
                return;
            }
            if(typeof customHandlers[name] !== "undefined"){
                $.proxy(customHandlers[name], bookeditor)(editor, cursor, selection);
            }else if(typeof handlers[name] !== "undefined"){
                $.proxy(handlers[name], bookeditor)(editor);
            }else{
                return;
            }
            if(name !== "table" && name!=="link" && name !=="image"){
                editor.focus();
            }
            return false;
        });
        return _this;
    },
    registerKeymaps: function(){
        var _this = this,
            editor = _this.editor.editor,
            settings = _this.settings,
            bookeditor = _this.bookeditor,
            handlers = _this.handlers,
            customHandlers = settings.toolbarHandlers,
            os = (global.os==="MacOS") ? "macos" : "common",
            keymaps = settings.keymaps[os],
            gkeymaps = settings.gkeymaps[os],
            map, handle, k,obj;
        
        for(k in keymaps){
            map = keymaps[k];
            handle = (typeof map==="string") ? (
                typeof customHandlers[map] !== "undefined") ? $.proxy(
                customHandlers[map], bookeditor) : $.proxy(
                handlers[map], bookeditor) : $.proxy(map, bookeditor);
            obj = {};
            obj[k] = handle;
            editor.addKeyMap(obj);
        }
        for(k in gkeymaps){
            map = gkeymaps[k];
            handle = (typeof map === "string") ? (
                typeof customHandlers[map] !== "undefined") ? $.proxy(
                customHandlers[map], bookeditor): $.proxy(
                handlers[map], bookeditor): $.proxy(map, bookeditor);
            Mousetrap.bind(k, handle);
        }
        return _this;
    },
    handlers:{
        save : function(){
            var _this = this;

            if(_this.settings.disabled)return false;
            if(!global.state.savebtn)return false;
            _this.editor.save();
            _this.editor.editor.execCommand("save");
            _this.handleState("save");
            return false;
        },
        undo : function(){
            var _this = this;
            var state = global.state;
            if(_this.settings.disabled)return false;
            if(!state.undobtn)return false;
            _this.editor.editor.undo();
            _this.handleState("undo");
        },
        redo : function(){
            var _this = this;
            var state = global.state;
            if(_this.settings.disabled)return false;
            if(!state.redobtn) return false;
            this.editor.editor.redo();
            this.bookeditor.handleState("redo");
        },
        bold : function(){
            var _this = this;
            if(_this.settings.disabled)return false;
            var editor = _this.editor.editor;
            var cursor = editor.getCursor();
            var selection = editor.getSelection();
            
            editor.replaceSelection("**" + selection + "**");
            if (selection === ""){
                editor.setCursor(cursor.line, cursor.ch + 2);
            }
        },
        italic : function(){
            var _this = this;
            if(_this.settings.disabled)return false;
            var editor = _this.editor.editor;
            var cursor = editor.getCursor();
            var selection = editor.getSelection();

            editor.replaceSelection("*" + selection + "*");

            if(selection === "") {
                editor.setCursor(cursor.line, cursor.ch + 1);
            }
        },
        del : function(){
            var _this = this;
            if(_this.settings.disabled)return false;
            var editor = _this.editor.editor;
            var cursor  = editor.getCursor();
            var selection = editor.getSelection();

            editor.replaceSelection("~~" + selection + "~~");

            if(selection === "") {
                editor.setCursor(cursor.line, cursor.ch + 2);
            }
        },
        H1 : function(){
            var _this = this;
            if(_this.settings.disabled)return false;
            var editor = _this.editor.editor;
            var cursor = editor.getCursor();
            var selection = editor.getSelection();

            if (cursor.ch !== 0)
            {
                editor.setCursor(cursor.line, 0);
                editor.replaceSelection("# " + selection);
                editor.setCursor(cursor.line, cursor.ch + 2);
            }
            else
            {
                editor.replaceSelection("# " + selection);
            }
        },
        H2 : function(){
            var _this = this;
            if(_this.settings.disabled)return false;
            var editor = _this.editor.editor;
            var cursor = editor.getCursor();
            var selection = editor.getSelection();

            if (cursor.ch !== 0)
            {
                editor.setCursor(cursor.line, 0);
                editor.replaceSelection("## " + selection);
                editor.setCursor(cursor.line, cursor.ch + 2);
            }
            else
            {
                editor.replaceSelection("## " + selection);
            }
        },
        H3 : function(){
            var _this = this;
            if(_this.settings.disabled)return false;
            var editor = _this.editor.editor;
            var cursor = editor.getCursor();
            var selection = editor.getSelection();

            if (cursor.ch !== 0)
            {
                editor.setCursor(cursor.line, 0);
                editor.replaceSelection("### " + selection);
                editor.setCursor(cursor.line, cursor.ch + 2);
            }
            else
            {
                editor.replaceSelection("### " + selection);
            }
        },
        H4 : function(){
            var _this = this;
            if(_this.settings.disabled)return false;
            var editor = _this.editor.editor;
            var cursor = editor.getCursor();
            var selection = editor.getSelection();

            if (cursor.ch !== 0)
            {
                editor.setCursor(cursor.line, 0);
                editor.replaceSelection("#### " + selection);
                editor.setCursor(cursor.line, cursor.ch + 2);
            }
            else
            {
                editor.replaceSelection("#### " + selection);
            }
        },
        H5 : function(){
            var _this = this;
            if(_this.settings.disabled)return false;
            var editor = _this.editor.editor;
            var cursor = editor.getCursor();
            var selection = editor.getSelection();

            if (cursor.ch !== 0)
            {
                editor.setCursor(cursor.line, 0);
                editor.replaceSelection("##### " + selection);
                editor.setCursor(cursor.line, cursor.ch + 2);
            }
            else
            {
                editor.replaceSelection("##### " + selection);
            }
        },
        H6 : function(){
            var _this = this;
            if(_this.settings.disabled)return false;
            var editor = _this.editor.editor;
            var cursor = editor.getCursor();
            var selection = editor.getSelection();

            if (cursor.ch !== 0)
            {
                editor.setCursor(cursor.line, 0);
                editor.replaceSelection("###### " + selection);
                editor.setCursor(cursor.line, cursor.ch + 2);
            }
            else
            {
                editor.replaceSelection("###### " + selection);
            }
        },
        "list-ul" : function(){
            var _this = this;
            if(_this.settings.disabled)return false;
            var editor = _this.editor.editor;
            var cursor = editor.getCursor();
            var selection = editor.getSelection();

            if (selection === "") 
            {
                if(cursor.ch !== 0){
                    editor.setCursor(cursor.line, 0);
                    editor.replaceSelection("- " + selection);
                    editor.setCursor(cursor.line, cursor.ch + 2);   
                }else{
                    editor.replaceSelection("- " + selection);
                }
            } 
            else 
            {
                var selectionText = selection.split("\n");

                for (var i = 0, len = selectionText.length; i < len; i++) 
                {
                    selectionText[i] = (selectionText[i] === "") ? "" : "- " + selectionText[i];
                }

                editor.replaceSelection(selectionText.join("\n"));
            }

        },
        "list-ol" : function(){
            var _this = this;
            if(_this.settings.disabled)return false;
            var editor = _this.editor.editor;
            var cursor = editor.getCursor();
            var selection = editor.getSelection();

            if(selection === "") 
            {
                if(cursor.ch !== 0){
                    editor.setCursor(cursor.line, 0);
                    editor.replaceSelection("1. " + selection);
                    editor.setCursor(cursor.line, cursor.ch + 2);   
                }else{
                    editor.replaceSelection("1. " + selection);
                }

            }
            else
            {
                var selectionText = selection.split("\n");

                for (var i = 0, len = selectionText.length; i < len; i++) 
                {
                    selectionText[i] = (selectionText[i] === "") ? "" : (i+1) + ". " + selectionText[i];
                }

                editor.replaceSelection(selectionText.join("\n"));
            }
        },
        quote : function(){
            var _this = this;
            if(_this.settings.disabled)return false;
            var editor = _this.editor.editor;
            var cursor = editor.getCursor();
            var selection = editor.getSelection();
            if (cursor.ch !== 0)
            {
                editor.setCursor(cursor.line, 0);
                editor.replaceSelection("> " + selection);
                editor.setCursor(cursor.line, cursor.ch + 2);
            }
            else
            {
                editor.replaceSelection("> " + selection);
            }
        },
        table : function(){
            var _this = this;
            if(_this.settings.disabled)return false;
            var modal_sel = _this.modal_sel;
            var content = modal_sel.find(".modal-content");
            var html = [
                '<div class="book-dialog dialog-table">',
                    '<h3>添加表格</h3>',
                    '<div class="form-group">',
                        '<label class="control-label col-sm-2">行数：</label><input class="col-sm-2 form-control" name="rows" value="2" type="text" style="width:80px;margin-right: 40px;">',
                        '<label class="control-label col-sm-2">列数：</label><input class="col-sm-2 form-control" name="cols" value="3" type="text" style="width:80px">',
                    '</div>',
                    '<div class="clearfix">',
                        '<div class="pull-right">',
                            '<button class="editor-btn ok">确定</button>',
                            '<button class="editor-btn" data-dismiss="modal">取消</button>',
                        '</div>',
                    '</div>',
                '</div>'
            ].join("\n");
            content.append(html);
            var editor = _this.editor.editor;
            var cursor = editor.getCursor();
            content.find(".ok").bind("click", function(e){
                var rows = parseInt(content.find("input[name=rows]").val(), 10);
                var cols = parseInt(content.find("input[name=cols]").val(), 10);
                var table = "";
                if(rows > 1 && cols > 0){
                    for (var r = 0, len = rows; r < len; r++){
                        var row = [];
                        var head = [];
                        for (var c = 0, len2 = cols; c < len2; c++){
                            if(r === 1){
                                head.push("-----");
                            }
                            row.push(" ");
                        }
                        if(r === 1){
                            table += "| " + head.join(" | ") + " |\n";
                        }
                        table += "| " + row.join((cols === 1) ? "" : " | ") + " | \n";
                    }
                }
                editor.replaceSelection(table);
                editor.setCursor(cursor.line, cursor.ch + 2);
                modal_sel.modal("hide");
                return false;
            });
            modal_sel.modal("show");

        },
        line : function(){
            var _this = this;
            if(_this.settings.disabled)return false;
            var editor = _this.editor.editor;
            var cursor = editor.getCursor();
            var selection = editor.getSelection();
            editor.replaceSelection(((cursor.ch !== 0) ? "\n\n" : "\n") + "------------\n");
        },
        link : function(){
            var _this = this;
            if(_this.settings.disabled)return false;
            var modal_sel = _this.modal_sel;
            var content = modal_sel.find(".modal-content");
            var html = [
                '<div class="book-dialog dialog-link">',
                    '<h3>添加链接</h3>',
                    '<div class="form-group">',
                        '<label class="col-sm-2 control-label">链接地址：</label>',
                        '<div class="col-sm-10">',
                            '<input class="form-control" placeholder="http://..." name="link" type="text">',
                        '</div>',
                    '</div>',
                    '<div class="form-group">',
                        '<label class="col-sm-2 control-label">链接标题：</label>',
                        '<div class="col-sm-10">',
                            '<input class="form-control" autocomplete="off" name="title" type="text">',
                        '</div>',
                    '</div>',
                    '<div class="clearfix">',
                        '<div class="pull-right">',
                            '<button class="editor-btn ok">确定</button>',
                            '<button class="editor-btn" data-dismiss="modal">取消</button>',
                        '</div>',
                    '</div>',
                '</div>'
            ].join("\n");
            content.append(html);
            var editor = _this.editor.editor;
            var cursor = editor.getCursor();
            content.find(".ok").bind("click", function(e){
                var link = content.find("input[name=link]").val();
                var title = content.find("input[name=title]").val();
                var c = "[{0}]({1})".format(title, link);
                editor.replaceSelection(c);
                if(title === ""){
                    editor.setCursor(cursor.line, cursor.ch+1);
                }else if(link === ""){
                    editor.setCursor(cursor.line, cursor.ch + title.length + 3);
                }
                modal_sel.modal("hide");
                return false;
            });
            modal_sel.modal("show");
        },
        image : function(){
            var _this = this;
            if(_this.settings.disabled)return false;
            var modal_sel = _this.modal_sel;
            var settings = _this.settings;
            var content = modal_sel.find(".modal-content");
            var html = [
                '<div class="book-dialog dialog-image">',
                    '<h3>图片链接</h3>',
                    '<div>',
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
                '</div>'
            ].join("\n");
            content.append(html);

            var editor = _this.editor.editor;
            
            content.find(".ok").bind("click", function(e){
                var dialog_sel = $(this).parents(".book-dialog");
                var src, name, c;
                var cursor = editor.getCursor();
                var selection = editor.getSelection();

                src = dialog_sel.find("input[name=src]").val();
                name = dialog_sel.find("input[name=name]").val();
                c = "![{0}]({1})".format(name, src);
                editor.replaceSelection(c);
                var pos = src ? cursor.ch+name.length+src.length+5 : cursor.ch+name.length+4;
                    editor.setCursor(cursor.line, pos);
                modal_sel.modal("hide");
                return false;
            });
            
            modal_sel.modal('show');
        },
        code : function(){
            var _this = this;
            if(_this.settings.disabled)return false;
            var editor = _this.editor.editor;
            var cursor = editor.getCursor();
            var selection = editor.getSelection();
            
            if(cursor.ch !== 0){
                editor.replaceSelection(["\n```", selection, "```"].join("\n"));
                if (selection === "") {
                    editor.setCursor(cursor.line+2, 1);
                } 
            }else{
                editor.replaceSelection(["```", selection, "```"].join("\n"));
                if (selection === "") {
                    editor.setCursor(cursor.line+1, 1);
                } 
            }
        },
        math : function(){
            var _this = this;
            if(_this.settings.disabled)return false;
            var editor= _this.editor.editor;
            var cursor = editor.getCursor();
            var selection = editor.getSelection();

            editor.replaceSelection("$$x=y$$");

            if (selection === "") {
                editor.setCursor(cursor.line, cursor.ch + 5);
            }
        },
        preview : function(){
            var _this = this;
            if(_this.settings.disabled)return false;
            var watch = _this.toolbar_sel.find(".book-tool-btn[name=preview]");
            if(watch.hasClass("watched")){
                watch.removeClass("watched");
                _this.unwatch();
            }else{
                watch.addClass("watched");
                _this.watch();
            }
        },
    }
};


function Editor(bookeditor, options){
    var _this = this;
    _this.bookeditor = bookeditor;
    var settings = _this.settings = options;
    _this.old_markdown = "";
    _this.old_html = "";
    _this.saveTimer = null;

    var editor_html = [
        '<div class="book-editor-wraper">',
            '<div class="book-editor-area">',
                '<div id="book-editor" class="book-editor">',
                    '<div id="book-codemirror" class="book-codemirror"></div>',
                '</div>',
                '<div id="book-preview" class="book-preview">',
                    '<div id="book-html" class="book-html"></div>',
                '</div>',
            '</div>',
        '</div>'
    ].join("\n");
    bookeditor.main_sel.append(editor_html);
    _this.editor_sel = $("#book-editor");
    _this.codemirror_sel = $("#book-codemirror");
    _this.preview_sel = $("#book-preview");
    _this.html_sel = $("#book-html");
    _this.status_sel = null;

    if(settings.catalog && settings.editorStatus){
        var status_html = '<div class="book-editor-status" id="book-editor-status"></div>';
        var wraper = bookeditor.main_sel.find(".book-editor-wraper");
        wraper.addClass("book-status-wraper");
        wraper.prepend(status_html);
        _this.status_sel = $("#book-editor-status");
    }

    _this.codemirror_sel.on("click", function(){
        if(_this.editor){
            _this.editor.focus();
        }
    });

    _this.initCodeMirror();
    return _this;
}

function timeFunc(obj){
    return function(){
        var _this = obj;
        _this._save();
        _this.saveTimer = setTimeout(timeFunc(_this), _this.settings.saveInterval);
        _this.bookeditor.handleState("save");
    };
}

Editor.prototype = {
    watch: function(){
        var _this = this;
        var bookeditor = _this.bookeditor;
        var settings = _this.settings;
        settings.watch = true;
        _this.editor_sel.css("width", settings.editorWidth);
        _this.preview_sel.css("left", settings.editorWidth);
        _this.preview_sel.show();
        _this.editor.refresh();
        return _this;
    },
    unwatch: function(){
        var _this = this;
        var bookeditor = _this.bookeditor;
        var settings = _this.settings;
        settings.watch =false;
        _this.editor_sel.css("width", "100%");
        _this.preview_sel.css("left", "100%");
        _this.preview_sel.hide();
        _this.editor.refresh();
        return _this;
    },
    initCodeMirror: function(){
        var _this = this;
        var settings = _this.settings;
        var codemirror_sel = _this.codemirror_sel;
        var options = {
            mode: "gfm",
            lineNumbers: settings.lineNumbers,
            tabSize: settings.tabSize,
            autofocus: settings.autoFocus,
            indentWithTabs: true,
            lineWrapping: true,     // 内容太长自动换行
        };
        var editor = this.editor = CodeMirror(codemirror_sel[0], options);
        if(settings.autoHeight){
            codemirror_sel.find(".CodeMirror").css("height", "auto");
            editor.setOption("viewportMargin", Infinity);
        }
        if(!settings.lineNumbers){
            codemirror_sel.find(".CodeMirror-gutters").css("border-right", "none");
        }
    },
    display: function(){
        var _this = this;
        _this.preview();

        if(_this.settings.watch){
            _this.watch();
        }else{
            _this.unwatch();
        }
        _this.bindScrollEvent().bindChangeEvent();
        return _this;
    },
    preview: function(){
        var _this = this;
        var settings = _this.settings;
        if(_this.timer===null || settings.disabled)
            return;

        var html_sel = _this.html_sel;
        var editor_sel = _this.editor_sel;
        var markdown = _this.editor.getValue();
        var html = _this.markdown2html(markdown);
        if(html_sel) html_sel.html(html);
    },
    focus: function(){
        if(this.editor) this.editor.focus();
    },
    reload: function(markdown){
        var _this = this;
        var settings = _this.settings;
        var editor = _this.editor;
        var bookeditor = _this.bookeditor;
        if(!bookeditor.getDisabled()){
            editor.setValue(markdown);
            editor.execCommand("goDocEnd");
            _this.old_markdown = markdown;
            _this.old_html = _this.markdown2html(markdown);
            _this.autoSave();
            if(settings.autoFocus){
                _this.focus();
            }
        }
        bookeditor.handleState("init");
    },
    write: function(markdown){
        var editor = this.editor;
        var cursor = editor.getCursor();
        var selection = editor.getSelection();
        editor.replaceSelection(markdown);
        editor.setCursor(cursor.line, cursor.ch+markdown.length);
        editor.focus();
    },
    disabled: function(){
        var _this = this;
        _this.editor_sel.find(".CodeMirror").hide();
        _this.html_sel.hide();
        _this.stopSave();   // 关闭自动保存
    },
    enabled: function(){
        var _this = this;
        _this.html_sel.show();
        _this.editor_sel.find(".CodeMirror").show();
        _this.autoSave();
    },
    _save: function(){
        var _this = this;
        var markdown = _this.editor.getValue(),
            html = _this.markdown2html(markdown);
        if(markdown == _this.old_markdown) return;
        _this.statusDoing("正在保存");
        function after(){
            _this.old_markdown = markdown;
            _this.old_html = html;
            var title = _this.bookeditor.getSelectCatalogTitle();
            if(typeof title === "undefined")return;
            _this.statusDone('正在编辑： <span style="color:#444;">'+title+'</span>');
        }
        var data = {markdown: markdown, html:html, old_markdown: _this.old_markdown, old_html: _this.old_html};
        if($.proxy(_this.settings.event.save, _this.bookeditor)(data, after)===false)
            return;
        after();
    },
    save: function(){
        var _this=this;

        if(!_this.settings.save)return;
        _this.autoSave();
        _this._save();
    },
    addExtraHtml: function(html){
        root = '<div class="root-html">'+html+'</div>';
        root = $(root);
        // 高亮预览HTML的pre代码部分
        root.find("pre").addClass("prettyprint linenums");
        // 添加表格
        root.find("table").addClass("table table-bordered table-striped");
        prettyPrint(null, root[0]);

        // 解析TeX(KaTeX)科学公式
        root.find("."+global.katexClass).each(function(){
            var tex = $(this);
            var text = tex.text();
            text = text.replace(/\u2019/g, "'");
            try{
                katex.render(text, tex[0]);
            }catch(e){
                return;
            }
            tex.find(".katex").css("font-size", "1.5em");
        });
        return root[0].innerHTML;
    },
    markdown2html: function(markdown){
        var _this = this;
        var options = {
            renderer: _this.renderer(),
            gfm: true,
            tables: true,
            breaks: true,
            smartLists: true,
            smartypants: true,
            sanitize: true,     // 是否忽略html标签,true=>不忽略 false=>忽略
        };
        var html = marked(markdown, options);
        return _this.addExtraHtml(html);
    },
    autoSave: function(){
        var _this = this;
        var settings = _this.settings;
        if(!settings.save) return;
        if(_this.saveTimer){
            clearTimeout(_this.saveTimer);
        }
        _this.saveTimer = setTimeout(timeFunc(_this), settings.saveInterval);
    },
    stopSave: function(){
        var _this = this;
        if(!_this.settings.save) return;
        if(_this.saveTimer){
            clearTimeout(_this.saveTimer);
        }
        _this.saveTimer = null;
    },
    statusHtml: function(){
        return this.status_sel ? this.status_sel.html() : "";
    },
    statusDoing: function(msg){
        if(this.status_sel)
            this.status_sel.html(msg+' <i class="fa fa-spinner fa-pulse fa-fw"></i>');
    },
    statusDone: function(msg){
        if(this.status_sel)
            this.status_sel.html(msg);
    },
    renderer: function(){
        var renderer = new marked.Renderer();
        renderer.tablecell = function(content, flags){
            var type = (flags.header) ? "th" : "td";
            var tag = "";
            if(flags.header && flags.width){
                tag = flags.align ? '<' + type + ' style="text-align:' + flags.align + 
                    '" style="width:' + flags.width + ';">'
                    : '<' + type + ' style="width:' + flags.width + '">';
            }else{
                tag = flags.align ? '<' + type + ' style="text-align:' + flags.align + '">'
                    : '<' + type + '>';
            }
            return tag + content + '</' + type + '>\n';
        };

        renderer.paragraph = function(text){
            var isTeXInline     = /\$\$(.*)\$\$/g.test(text);
            var isTeXLine       = /^\$\$(.*)\$\$$/.test(text);
            var isTeXAddClass   = (isTeXLine)     ? " class=\"" + global.katexClass + "\"" : "";
            if (!isTeXLine && isTeXInline) 
            {
                text = text.replace(/(\$\$([^\$]*)\$\$)+/g, function($1, $2) {
                    return "<span class=\"" + global.katexClass + "\">" + $2.replace(/\$/g, "") + "</span>";
                });
            } 
            else 
            {
                text = (isTeXLine) ? text.replace(/\$/g, "") : text;
            }
            return "<p" + isTeXAddClass + ">" + text + "</p>\n";
     
        };
        
        renderer.code = function(code, lang, escaped){
            if(lang==="math" || lang==="latex" || lang==="katex"){
                return "<p class=\"" + global.katexClass + "\">" + code + "</p>";
            }else{
                return marked.Renderer.prototype.code.apply(this, arguments);
            }
        };
        return renderer;
 
    },
    addScrollbar: function(){
        var _this = this;
        var settings = _this.settings;
        _this.editor_sel.addClass(global.scrollbarClass);
        _this.preview_sel.addClass(global.scrollbarClass);
    },
    bindScrollEvent: function(){
        var _this = this;
        var preview_sel = _this.preview_sel;
        var editor_sel = _this.editor_sel;
        var settings = _this.settings;
        if(!preview_sel) return this;
        var scrollFunc = function(){
            editor_sel.bind(mouseOrTouch("scroll", "touchmove"), function(event){
                var _this = $(this);
                var height = _this.height();
                var scroll_top = _this.scrollTop();
                var percent = (scroll_top/_this[0].scrollHeight);

                if(scroll_top==0){
                    preview_sel.scrollTop(0);
                }else if(scroll_top+height>=_this[0].scrollHeight-16){
                    preview_sel.scrollTop(preview_sel[0].scrollHeight);
                }else{
                    preview_sel.scrollTop(preview_sel[0].scrollHeight * percent);
                }
            });
        };
        
        var unscrollFunc = function(){
            editor_sel.unbind(mouseOrTouch("scroll", "touchmove"));
        };
        editor_sel.bind({
            mouseover: scrollFunc,
            mouseout: unscrollFunc,
            touchstart: scrollFunc,
            touchend: unscrollFunc,
        });
        return this;
    },
    bindChangeEvent: function(){
        var _this = this;
        var editor = _this.editor;
        var settings = _this.settings;

        editor.on("change", function(_editor, obj){
            _this.timer = setTimeout(function(){
                clearTimeout(_this.timer);
                _this.preview();
                _this.timer=null;
                _this.bookeditor.handleState("onchange");
            }, 400);
        });
    },

};

bookeditor.defaults = {
    watch: true,
    disabled: false,
    save: true,
    saveInterval: 6000,    // 自动保存时间间隔，默认6秒
    full: false,
    width: "100%",
    height: "480px",
    editorWidth: "60%",

    markdown: "",

    wraperId: null,

    event: {
        sortCatalog: function(catalog, after){},
        selectCatalog: function(oldCatalog, catalog, after){},
        newCatalog: function(catalog, data, after){},
        renameCatalog: function(catalog, data, after){},
        deleteCatalog: function(catalog, after){},
        save: function(data, after){},
    },
    /* editor setting */
    tabSize: 4,
    autoFocus: true,
    lineNumbers: true,
    autoHeight: true,

    /* catalog setting*/
    catalog: false,
    editorStatus: true,
    filesMenus:["new", "rename", "quote", "delete"],
    fileMenus: ["rename", "quote", "delete"],
    menuTexts:{
        new: '<a href="#" name="new">新建</a>',
        rename: '<a href="#" name="rename">重命名</a>',
        quote: '<a href="#" name="quote">引用</a>',
        delete: '<a href="#" style="color:#D32F2F;" name="delete">删除</a>',
    },
    menuHandlers:{},
    /* toolbar setting */
    toolbarBtns: [
        ["save"], 
        ["undo", "redo"], 
        ["bold", "italic", "del"],
        ["H1", "H2", "H3"], 
        ["list-ol", "list-ul", "quote", "table", "line"],
        ["link", "image", "code", "math"]
    ],
    toolbarRightBtns: [
        ["preview"],
    ],
    toolbarCustomBtns: {},
    toolbarBtnClass:{
        save : "fa fa-save",
        undo : "fa fa-undo",
        redo : "fa fa-repeat",
        bold : "fa fa-bold",
        italic : "fa fa-italic",
        del : "fa fa-strikethrough",
        H1 : "",
        H2 : "",
        H3 : "",
        "list-ul" : "fa fa-list-ul",
        "list-ol" : "fa fa-list-ol",
        quote : "fa fa-quote-left",
        table : "fa fa-table",
        line : "fa fa-minus",
        link : "fa fa-link",
        image : "fa fa-image",
        code : "fa fa-code",
        math : "fa fa-superscript",
        preview : "fa fa-eye",
    },
    toolbarHandlers:{},
    tooltip:{
        macos : {         // macos键盘快捷键提示
            save : "保存(Cmd + S)",
            undo : "撤销(Cmd + Z)",
            redo : "重做(Cmd + Y)",
            bold : "粗体(Cmd + B)",
            italic : "斜体(Cmd + I)",
            del : "删除线(Option + Shift + 5)",
            H1 : "标题1(Cmd + 1)",
            H2 : "标题2(Cmd + 2)",
            H3 : "标题3(Cmd + 3)",
            "list-ul" : "无序列表(Cmd + Shift + 8)",
            "list-ol" : "有序列表(Cmd + Shift + 7)",
            quote : "引用(Cmd + ])",
            table : "表格(Cmd + Shift + K)",
            line : "横线(Cmd + Shift + H)",
            link : "添加链接(Cmd + Shift + L)",
            image : "添加图片(Cmd + Shift + I)",
            code : "代码块(Cmd + Shift + 9)",
            math : "公式(Cmd + Shift + M)",
            preview : "预览(Cmd + Shift + P)",
        },
        common : {        // 普通键盘快捷键提示
            save : "保存(Ctrl + S)",
            undo : "撤销(Ctrl + Z)",
            redo : "重做(Ctrl + Y)",
            bold : "粗体(Alt + B)",
            italic : "斜体(Alt + I)",
            del : "删除线(Alt + Shift + 5)",
            H1 : "标题1(Alt + 1)",
            H2 : "标题2(Alt + 2)",
            H3 : "标题3(Alt + 3)",
            "list-ul" : "无序列表(Alt + Shift + 8)",
            "list-ol" : "有序列表(Alt + Shift + 7)",
            quote : "引用(Alt + ])",
            table : "表格(Alt + Shift + K)",   ///
            line : "横线(Alt + Shift + H)",    //
            link : "添加链接(Alt + Shift + L)",
            image : "添加图片(Alt + Shift + I)",
            code : "代码块(Alt + Shift + 9)",
            math : "公式(Alt + Shift + M)",
            preview : "预览(Ctrl + Shift + P)",
        },
    },
    keymaps:{
        macos : {
            "Cmd-S" : "save",
            "Cmd-Z" : "undo",
            "Cmd-Y" : "redo",
            "Cmd-B" : "bold",
            "Cmd-I" : "italic",
            "Shift-Alt-5" : "del",
            "Cmd-1" : "H1",
            "Cmd-2" : "H2",
            "Cmd-3" : "H3",
            "Cmd-4" : "H4",
            "Cmd-5" : "H5",
            "Cmd-6" : "H6",
            "Shift-Cmd-8" : "list-ul",
            "Shift-Cmd-7" : "list-ol",
            "Cmd-]" : "quote",
            "Shift-Cmd-K" : "table",
            "Shift-Cmd-H" : "line",
            "Shift-Cmd-L" : "link",
            "Shift-Cmd-I" : "image",
            "Shift-Cmd-9" : "code",
            "Shift-Cmd-M" : "math",
            "Shift-Cmd-P" : "preview",
        },
        common : {
            "Ctrl-S" : "save",
            "Ctrl-Z" : "undo",
            "Ctrl-Y" : "redo",
            "Alt-B" : "bold",
            "Alt-I" : "italic",
            "Shift-Alt-5" : "del",
            "Alt-1" : "H1",
            "Alt-2" : "H2",
            "Alt-3" : "H3",
            "Alt-4" : "H4",
            "Alt-5" : "H5",
            "Alt-6" : "H6",
            "Shift-Alt-8" : "list-ul",
            "Shift-Alt-7" : "list-ol",
            "Alt-]" : "quote",
            "Shift-Alt-K" : "table",
            "Shift-Alt-H" : "line",
            "Shift-Alt-L" : "link",
            "Shift-Alt-I" : "image",
            "Shift-Alt-9" : "code",
            "Shift-Alt-M" : "math",
            "Shift-Ctrl-P" : "preview",
        }
    },
    gkeymaps:{
        macos:{
            "command+shift+p": "preview"
        },
        common: {
            "ctrl+shift+p":"preview"
        }
    },
};


function bookeditor(options){
    if (!(this instanceof bookeditor)) return new bookeditor(options);

    var _this = this;
    options = options || {};

    var settings = _this.settings = $.extend(true, bookeditor.defaults, options);
    settings.toolbarBtns = (typeof options.toolbarBtns ==="undefined")? bookeditor.defaults.toolbarBtns : options.toolbarBtns;
    settings.toolbarRightBtns = (typeof options.toolbarRightBtns === "undefined")? bookeditor.defaults.toolbarRightBtns : options.toolbarRightBtns;

    if(typeof settings.wraperId === "undefined" || !settings.wraperId){
        return;
    }

    var wraper = _this.wraper = $("#"+settings.wraperId);

    wraper.addClass(global.wraperClass);
    if(settings.full){
        wraper.addClass(global.fullClass);
    }else{
        wraper.addClass(global.notfullClass);
        wraper.css("width", settings.width);
        wraper.css("height", settings.height);
        settings.catalog = false;
    }

    var html = [
        '<div id="book-toolbar" class="book-toolbar"></div>',
        '<div id="book-main" class="book-main"></div>',
    ].join("\n");
    wraper.append(html);
    _this.toolbar_sel = $("#book-toolbar");
    _this.main_sel = $("#book-main");

    var editor = _this.editor = new Editor(_this, settings);
    if(settings.catalog){
        _this.catalog = new Catalog(_this, editor, settings);
        _this.main_sel.addClass("book-catalog-main");
    }
    _this.toolbar = new ToolBar(_this, editor, settings);

    var modal_html = [
        '<div id="' + global.modalClass + '" class="modal fade ' + global.modalClass + '" >',
            '<div class="modal-dialog">',
                '<div class="modal-content">',
                '</div>',
            '</div>',
        '</div>',
    ].join("\n");
 
    if(settings.modalSelector !== undefined){
        var selector = $(settings.modalSelector);
        selector.append(modal_html);
    }else{
        _this.main_sel.append(modal_html);
    }
    _this.modal_sel = $("#"+global.modalClass);

    if(global.os=="Windows"){
        // 如果为window系统，则添加自定义滚动样式
        editor.addScrollbar();
    }

    _this.modal_sel.on("hidden.bs.modal", function(event){
        var $this = $(this);
        var content = $this.find(".modal-content");
        content.empty();
        editor.focus();
    });

    _this.modal_sel.on("shown.bs.modal", function(event){
        var input = $(this).find("input[type=text]");
        if(input.length>0){
            input[0].focus();
        }
    });

    _this.modal_sel.on("keypress", function(event){
        if(event.keyCode === 13){
            var dialog_sel = $(this).find(".book-dialog");
            dialog_sel.find(".ok").click();
            event.preventDefault();
        }
    });

    _this.modal_sel.on("keypress", ".ok", function(event){
        // 防止.ok按钮被click两次，因为父标签.modal触发enter事件时也会
        // 调用.ok按钮的click事件
        if(event.keyCode === 13){
            event.stopPropagation();
        }
    });

    _this.load();

    return _this;
}
 
bookeditor.prototype = {
    load: function(){
        var _this = this;
        var settings = _this.settings;
        _this.editor.reload(settings.markdown);
        _this.editor.display();

        if(settings.disabled){
            _this.editor.disabled();
        }
        global.state.loaded = true;
    },
    reload: function(markdown){
        this.editor.reload(markdown);
    },
    write: function(markdown){
        var editor = this.editor;
        editor.write(markdown);
    },
    disabled: function(){
        var _this = this;
        _this.settings.disabled = true;
        _this.editor.disabled();
    },
    enabled: function(){
        var _this = this;
        _this.settings.disabled = false;
        _this.editor.enabled();
    },
    save: function(){
        this.editor.save();
    },
    focus: function(){
        if(this.getDisabled())return;
        this.editor.editor.focus();
    },
    setValue: function(markdown){
        if(this.getDisabled())return;
        var editor = this.editor.editor;
        editor.setValue(markdown);
        editor.execCommand("goDocEnd");
    },
    getValue: function(){
        var editor = this.editor.editor;
        return editor.getValue();
    },
    getHtml: function(){
        var markdown = this.getValue();
        return this.markdown2html(markdown);
    },
    watch: function(){
        this.editor.watch();
    },
    unwatch: function(){
        this.editor.unwatch();
    },
    statusDoing: function(msg){
        this.editor.statusDoing(msg);
    },
    statusDone: function(msg){
        this.editor.statusDone(msg);
    },
    getDisabled: function(){
        return this.settings.disabled;
    },
    getSelectCatalog: function(){
        if(!this.settings.catalog)return;

        return this.catalog.getSelectCatalog();
    },
    getSelectCatalogTitle: function(){
        if(!this.settings.catalog)return;
        return this.catalog.getSelectCatalogTitle();
    },
    getCatalog: function(nodeid){
        return this.catalog.catalog_sel.find('.list-group-item[data-nodeid='+nodeid+']');
    },
    getEditor: function(){
        return this.editor.editor;
    },
    markdown2html: function(markdown){
        return this.editor.markdown2html(markdown);
    },
    handleState: function(action){
        var _this = this,
            editor = _this.getEditor(),
            toolbar_sel = _this.toolbar_sel,
            state = global.state,
            save, undo, redo, history,
            disabled = "disabled";
        switch(action){
        case "init":
            // 初始化时 编辑状态
            save = toolbar_sel.find(".book-tool-btn[name=save]");
            redo = toolbar_sel.find(".book-tool-btn[name=redo]");
            undo = toolbar_sel.find(".book-tool-btn[name=undo]");

            save.addClass(disabled);
            save.attr(disabled, disabled);
            redo.addClass(disabled);
            redo.attr(disabled, disabled);
            undo.addClass(disabled);
            undo.attr(disabled, disabled);

            state.savebtn = false;
            state.undobtn = false;
            state.redobtn = false;
            state.loaded = false;   // 第一次加载数据，或者重新加载数据时
            editor.clearHistory(); // 清空codemirror中的历史记录
        break;
        case "save":
            // 点击save按钮之后调用
            save = toolbar_sel.find('.book-tool-btn[name=save]');
            save.addClass(disabled);
            save.attr(disabled, disabled);

            state.savebtn = false;
        break;
        case "undo":
            // 点击undo按钮之后调用
            redo = toolbar_sel.find('.book-tool-btn[name=redo]');
            redo.removeClass(disabled);
            redo.removeAttr(disabled, disabled);

            state.redobtn = true;
            history = editor.historySize();
            if(!history.undo){
                // codemirror中没有undo的历史
                undo = toolbar_sel.find('.book-tool-btn[name=undo]');
                undo.addClass(disabled);
                undo.attr(disabled, disabled);
                state.undobtn = false;
            }
        break;
        case "redo":
            // 点击redo按钮之后调用
            undo = toolbar_sel.find('.book-tool-btn[name=undo]');
            undo.removeClass(disabled);
            undo.removeAttr(disabled, disabled);
            state.undobtn=true;
            history = editor.historySize();
            if(!history.redo){
                // codemirror 中没有redo的历史
                redo = toolbar_sel.find('.book-tool-btn[name=redo]');
                redo.addClass(disabled);
                redo.attr(disabled, disabled);
                state.redobtn=false;
            }
        break;
        case "onchange":
            // 当codemirror编辑器中内容改变了
            if(!state.savebtn && state.loaded){     
                // 这里加入loaded 反之如果是重新载入数据时
                // 防止执行这里面的代码
                save = toolbar_sel.find(".book-tool-btn[name=save]");
                save.removeClass(disabled);
                save.removeAttr(disabled);
                state.savebtn = true;
            }
            state.loaded = true;
            if(!state.undobtn || state.redobtn){
                history = editor.historySize();
                if(history.undo){
                    undo = toolbar_sel.find(".book-tool-btn[name=undo]");
                    undo.removeClass(disabled);
                    undo.removeAttr(disabled);
                    state.undobtn = true;
                }
                if(!history.redo){
                    redo = toolbar_sel.find(".book-tool-btn[name=redo]");
                    redo.addClass(disabled);
                    redo.attr(disabled, disabled);
                    state.redobtn = false;
                }
            }
        break;
        default:
        break;
        }
    },
};

return bookeditor;

}));


