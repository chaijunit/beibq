var gulp = require('gulp'),
    sass = require('gulp-sass'),
    concat = require('gulp-concat'),
    jshint = require('gulp-jshint'),
    mincss = require('gulp-minify-css'),
    postcss = require('gulp-postcss'),
    uglify = require('gulp-uglify'),
    headerfooter = require('gulp-headerfooter'),
    fs = require('fs'),
    rename = require('gulp-rename'),
    connect = require('gulp-connect');

var autoprefixer = require('autoprefixer'),
    cssnext = require('cssnext'),
    precss = require('precss');

var processors = [
    autoprefixer,
    cssnext,
    precss,
];

gulp.task("sass", function(){
    gulp.src([
        "asserts/bootstrap/css/bootstrap.min.css",
        "asserts/font-awesome/css/font-awesome.css",
        ])
        .pipe(sass())
        .pipe(concat("common.css"))
        .pipe(gulp.dest("css"))

    gulp.src([
        "src/scss/**/*.scss", 
        "src/scss/**/!_*.scss", 
        "!src/scss/**/base/*",
        "!src/scss/**/base*",
        ])
        .pipe(sass())
        .pipe(gulp.dest("css"));
});

gulp.task("js", function(){
    gulp.src([
        'asserts/jquery.min.js',
        'asserts/bootstrap/js/bootstrap.js',
        'asserts/noty.js',
        ])
        .pipe(concat("common.js"))
        .pipe(gulp.dest("js"))

    gulp.src([
        'src/js/extend/jquery-extend.js',
        'src/js/extend/string-extend.js',
        'src/js/extend/notify.js',
        ]).pipe(jshint())
        .pipe(jshint.reporter("default"))
        .pipe(concat("extend.js"))
        .pipe(gulp.dest("js"))

    gulp.src([
        "src/js/**/*.js",
        "!src/js/extend/*"
        ])
        .pipe(jshint())
        .pipe(jshint.reporter("default"))
        .pipe(headerfooter.header("js/extend.js"))
        .pipe(gulp.dest("js"));
});


gulp.task("cssmin", function(){
    var common_css = fs.readFileSync("css/common.css", "utf8");

    gulp.src([
        "css/**/*.css",
        "!css/admin/edit.css",
        "!css/common.css"
        ])
        .pipe(headerfooter.header(common_css))
        .pipe(postcss(processors))
        .pipe(mincss())
        .pipe(rename({
            dirname: "",
            suffix: ".min"
        })).pipe(gulp.dest("dist/css"));
    gulp.src([
        "asserts/bookeditor/plugins/katex/katex.css",
        "asserts/bookeditor/plugins/bootstrap-treeview/bootstrap-treeview.min.css",
        "asserts/bookeditor/plugins/codemirror/lib/codemirror.css",
        "asserts/jquery-file-upload/css/jquery.fileupload.css",
        "asserts/bookeditor/bookeditor.css",
        "css/admin/edit.css"
        ])
        .pipe(concat("edit.css"))
        .pipe(headerfooter.header(common_css))
        .pipe(postcss(processors))
        .pipe(mincss())
        .pipe(rename({
            dirname: "",
            suffix: ".min"
        })).pipe(gulp.dest("dist/css"));
 
});

gulp.task("jsmin", function(){
    var common_js = fs.readFileSync("js/common.js");
    gulp.src("js/common.js")
        .pipe(uglify())
        .pipe(rename({
            dirname: "",
            suffix: ".min"
        })).pipe(gulp.dest("dist/js"))

    gulp.src([
        "js/admin/book.js",
        "js/admin/user.js"
        ])
        .pipe(headerfooter.header("asserts/cropit/dist/jquery.cropit.js"))
        .pipe(headerfooter.header(common_js))
        .pipe(uglify())
        .pipe(rename({
            dirname: "",
            suffix: ".min"
        })).pipe(gulp.dest("dist/js"))

    gulp.src([
        "asserts/bookeditor/plugins/bootstrap-treeview/bootstrap-treeview.js",
        "asserts/bookeditor/plugins/sortable/Sortable.js",
        "asserts/bookeditor/plugins/katex/katex.js",
        "asserts/bookeditor/plugins/prettify.min.js",
        "asserts/bookeditor/plugins/codemirror/lib/codemirror.js",
        "asserts/bookeditor/plugins/codemirror/addon/mode/overlay.js",
        "asserts/bookeditor/plugins/codemirror/mode/markdown/markdown.js",
        "asserts/bookeditor/plugins/codemirror/mode/gfm/gfm.js",
        "asserts/bookeditor/plugins/marked/marked.js",
        "asserts/googlediff-master/javascript/diff_match_patch_uncompressed.js",
        "asserts/md5/js/md5.js",
        "asserts/mousetrap/mousetrap.js",
        "asserts/jquery-file-upload/js/vendor/jquery.ui.widget.js",
        "asserts/jquery-file-upload/js/jquery.fileupload.js",
        "asserts/mousetrap/mousetrap.js",
        "asserts/bookeditor/bookeditor.js",
        "js/admin/edit.js"
        ])
        .pipe(concat("edit.min.js"))
        .pipe(headerfooter.header(common_js))
        .pipe(uglify())
        .pipe(gulp.dest("dist/js"))

    gulp.src([
        "asserts/mousetrap/mousetrap.js",
        "js/web/reader.js"
        ])
        .pipe(concat("reader.min.js"))
        .pipe(headerfooter.header(common_js))
        .pipe(uglify())
        .pipe(gulp.dest("dist/js"))
});


gulp.task("watch",  function(){
    gulp.watch("src/scss/**/*.scss", ["sass"]);
    gulp.watch("src/js/**/*.js", ["adminjs"]);
});


gulp.task("default",["sass", "js", "watch"], function(){
});

gulp.task("dist", ["cssmin", "jsmin"], function(){
});






