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

