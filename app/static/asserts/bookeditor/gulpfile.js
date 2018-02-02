var gulp = require('gulp'),
    sass = require('gulp-sass'),
    jshint = require('gulp-jshint'),
    mincss = require('gulp-minify-css'),
    postcss = require('gulp-postcss'),
    uglify = require('gulp-uglify'),
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

gulp.task("dist",function(){
    gulp.src("bookeditor.css")
        .pipe(postcss(processors))
        .pipe(mincss())
        .pipe(rename({
            dirname: "",
            suffix: ".min"
        })).pipe(gulp.dest("./"))
    
    gulp.src("bookeditor.js")
        .pipe(uglify())
        .pipe(rename({
            dirname: "",
            suffix: ".min"
        })).pipe(gulp.dest("./"));
});

gulp.task("build", function(){
    gulp.src("src/bookeditor.scss")
        .pipe(sass())
        .pipe(gulp.dest("./"))
        .pipe(connect.reload());

    gulp.src("src/bookeditor.js")
        .pipe(jshint())
        .pipe(jshint.reporter("default"))
        .pipe(gulp.dest("./"))
        .pipe(connect.reload());
});

gulp.task("connect", function(){
    connect.server({
        host: "0.0.0.0",
        livereload: true
    });
});

gulp.task("default", ["build", "connect"], function(){

    gulp.watch("src/**/*.scss", ["build"]);
    gulp.watch("src/**/*.js", ["build"]);
});

