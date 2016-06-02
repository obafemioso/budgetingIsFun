var gulp = require('gulp');
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var ngAnnotate = require('gulp-ng-annotate');
var livereload = require('gulp-livereload');

gulp.task('build', function() {
	gulp.src([
    'node_modules/angular/angular.js', 
    'node_modules/angular-filter/dist/angular-filter.js', 
    'assets/libs/*[^min].js', 'app/filters/*.js',
    'node_modules/firebase/firebase.js',
    'node_modules/angularfire/dist/angularfire.js'
    ])
		.pipe(sourcemaps.init())
      .pipe(concat('plugins.js'))
      .pipe(ngAnnotate())
      // .pipe(uglify())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('.'))
});

gulp.task('js', function () {
  gulp.src(['app/app.module.js', 'app/**/**/*.js'])
  	.pipe(sourcemaps.init())
    	.pipe(concat('app.js'))
    	.pipe(ngAnnotate())
    	// .pipe(uglify())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('.'))
    .pipe(livereload({start:true}));
});

gulp.task('watch', ['js'], function() {
	gulp.watch('app/**/*.js', ['js'])
});