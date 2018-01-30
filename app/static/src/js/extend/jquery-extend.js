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
