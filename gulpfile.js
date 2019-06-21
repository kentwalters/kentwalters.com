const gulp = require("gulp");
const browsersync = require("browser-sync").create();

function browserSync(done) {
  browsersync.init({
    server: {
      baseDir: "./"
    },
    port: 3000
  });
  done();
}

function browserSyncReload(done) {
  browsersync.reload();
  done();
}

function watchFiles() {
  gulp.watch("./*.html", browserSyncReload);
}

function defaultTask(cb) {
  cb();
}

const watch = gulp.parallel(watchFiles, browserSync);

exports.watch = watch;
exports.default = defaultTask