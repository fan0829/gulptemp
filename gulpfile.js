'use strict';

// 引入gulp包， nodejs代码
const gulp = require('gulp'),
  // 引入gulp-sass 包
  sass = require('gulp-sass'),
  // gulp版本定义
  rev = require('gulp-rev'),
  concat = require('gulp-concat'), // 合并文件 --合并只是放一起--压缩才会真正合并相同样式
  rename = require('gulp-rename'), // 设置压缩后的文件名
  // 替换版本url
  revCollector = require('gulp-rev-collector'),
  // css 压缩
  cleanCss = require('gulp-clean-css'),
  // 兼容处理css3
  autoprefixer = require('gulp-autoprefixer'),
  // css代码map
  sourcemaps = require('gulp-sourcemaps'),
  // js 压缩
  uglify = require('gulp-uglify'),
  // img 压缩
  imgagemin = require('gulp-imagemin'),
  // 清理文件夹
  clean = require('gulp-clean'),
  // 顺序执行
  runSequence = require('gulp-run-sequence'),
  // 给js文件替换文件路径
  configRevReplace = require('gulp-requirejs-rev-replace'),
  // 过滤
  filter = require('gulp-filter'),
  // js校验
  eslint = require('gulp-eslint'),
  // babel 转换es6
  babel = require('gulp-babel'),
  // html 压缩
  htmlmin = require('gulp-htmlmin');
// minifyHtml = require('gulp-minify-html');

// 样式处理工作流：编译sass → 添加css3前缀 → 压缩css →添加版本号
gulp.task('style', function(e) {
  var sassFilter = filter(['**/*.scss'], { restore: true });
  return gulp
    .src(['./src/style/**/*.{scss,css}', '!./src/style/main.css']) // 读取sass文件
    .pipe(sassFilter)
    .pipe(sass()) // 编译sass
    .pipe(sassFilter.restore)
    .pipe(
      autoprefixer({
        // 兼容css3
        browsers: ['last 2 versions'], // 浏览器版本
        cascade: true, // 美化属性，默认true
        add: true, // 是否添加前缀，默认true
        remove: true, // 删除过时前缀，默认true
        flexbox: true // 为flexbox属性添加前缀，默认true
      })
    )
    .pipe(concat('main.css')) // 合并css
    .pipe(
      cleanCss({
        // 压缩css
        compatibility: 'ie8',
        // 保留所有特殊前缀 当你用autoprefixer生成的浏览器前缀，如果不加这个参数，有可能将会删除你的部分前缀
        keepSpecialComments: '*'
      })
    )
    .pipe(rev()) // 文件名加MD5后缀
    .pipe(gulp.dest('./dist/style/')) // 输出目标文件到dist目录
    .pipe(rev.manifest()) // 生成一个rev-manifest.json
    .pipe(gulp.dest('./src/style/')); // 将 rev-manifest.json 保存到 src目录
});

// 替换目标html文件中的css版本文件名，js版本的文件名,html 压缩
gulp.task('html', function(e) {
  return gulp
    .src(['./src/**/*.json', './src/**/*.html']) // - 读取 rev-manifest.json 文件以及需要进行css名替换的文件
    .pipe(revCollector({ replaceReved: true })) // - 执行html文件内css文件名的替换和js文件名替换
    .pipe(
      htmlmin({
        removeComments: true, // 清除HTML注释
        collapseWhitespace: true, // 压缩HTML
        // collapseBooleanAttributes: true, //省略布尔属性的值 <input checked="true"/> ==> <input />
        removeEmptyAttributes: true, // 删除所有空格作属性值 <input id="" /> ==> <input />
        removeScriptTypeAttributes: true, // 删除<script>的type="text/javascript"
        removeStyleLinkTypeAttributes: true, // 删除<style>和<link>的type="text/css"
        minifyJS: true, // 压缩页面JS
        minifyCSS: true // 压缩页面CSS
      })
    )
    .pipe(gulp.dest('./dist/')); // - 替换后的文件输出的目录
});

// 图片压缩
gulp.task('imgmin', function(e) {
  return gulp
    .src('./src/asset/**/*.{png,jpg,gif,ico}')
    .pipe(
      imgagemin({
        optimizationLevel: 5, // 类型：Number  默认：3  取值范围：0-7（优化等级）
        progressive: true, // 类型：Boolean 默认：false 无损压缩jpg图片
        interlaced: true,
        // 类型：Boolean 默认：false 隔行扫描gif进行渲染
        multipass: true // 类型：Boolean
        // 默认：false 多次优化svg直到完全优化
      })
    )
    .pipe(gulp.dest('./dist/asset'));
});

// js 压缩添加版本
gulp.task('js', function(e) {
  return gulp
    .src(['./src/**/*.js', '!./src/lib/**'])
    .pipe(eslint())
    .pipe(
      eslint.results(results => {
        // Called once for all ESLint results.
        console.log(`JS总校验文件: ${results.length}`);
        console.log(`JS警告个数：: ${results.warningCount}`);
        console.log(`JS错误个数: ${results.errorCount}`);
      })
    )
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
    .pipe(
      babel({
        presets: ['env']
      })
    )
    .pipe(uglify())
    .pipe(rev())
    .pipe(gulp.dest('./dist'))
    .pipe(rev.manifest())
    .pipe(gulp.dest('./src/js/'));
});

// 给requirejs引用的文件修改版本号的路径
gulp.task('revjs', function() {
  return gulp
    .src('./dist/*.js')
    .pipe(
      configRevReplace({
        manifest: gulp.src('./src/js/rev-manifest.json')
      })
    )
    .pipe(uglify())
    .pipe(gulp.dest('dist/'));
});

var copyPathArr = ['./src/lib/**/*', './src/asset/**/*', './src/*.ico'];
// 拷贝gulp文件
gulp.task('copy', function(e) {
  return gulp.src(copyPathArr, { base: './src' }).pipe(gulp.dest('./dist/'));
});

gulp.task('dist', [], function() {
  runSequence('cleanDist', 'style', 'js', 'revjs', 'html', 'copy', 'imgmin');
});

// 开发相关
gulp.task('style:dev', function(e) {
  var sassFilter = filter(['**/*.scss'], { restore: true });
  return gulp
    .src(['./src/style/**/*.{scss,css}', '!./src/style/main.css']) // 读取sass文件
    .pipe(sassFilter)
    .pipe(sass()) // 编译sass
    .pipe(sassFilter.restore)
    .pipe(sourcemaps.init())
    .pipe(sass())
    .pipe(concat('main.css'))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('./src/style/'));
});

// 开发监控sass文件变化编译sass到css文件 可以增加es6的编译，jslint
gulp.task('dev', function() {
  gulp.watch('./src/style/**', ['style:dev']);
});

gulp.task('cleanDist', function() {
  gulp
    .src(['dist/style/**', 'dist/js/**', 'dist/*.js'], { read: false })
    .pipe(clean());
});
