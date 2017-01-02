'use strict';

const AsyncPromise = require('../lib/async_promise');
const Movie = require('../models/movie');

module.exports = Backbone.Collection.extend({
  model: Movie,
  docType: Movie.prototype.docType.toLowerCase(),
  comparator: movie => movie.getTitle(),

  sync: function (method, collection, options) {
    if (method !== 'read') {
      console.error('Only read is available on this collection.');
      if (options.error) {
        options.error('Only read is available on this collection.');
      }
      return;
    }
    cozysdk.run(this.docType, 'all', { include_docs: true }, (err, results) => {
      if (err) { return options.error(err); }

      return options.success(results.map(res => res.doc));
    });
  },


  addVideoStreamToLibrary: function (videoStream) {
    return Promise.resolve().then(() => {
      const movie = this.find(movie => movie.get('orangeTitle') === videoStream.title);

      if (movie) {
        return movie;
      }
      return Movie.fromOrangeTitle(videoStream.title);
    }).then((movie) => {
      movie.setViewed(videoStream);
      this.add(movie);

      return movie.save();
    }).catch((err) => {
      // Fail silenlty.
      console.error(err);
      return Promise.resolve();
    });
  },


  addFromVideoStreams: function (since) {
    // TODO : remove hack !
    // TODO : implement since !
    return cozysdk.run('videostream', 'moviesByDate',
    { startkey: "2016-09-07T00:47:20Z", limit: 3, include_docs: true })
    .then((results) => {
      const videoStreams = results.map(res => res.doc);
      return AsyncPromise.series(videoStreams, this.addVideoStreamToLibrary, this);
    });
  },


  defineMovieAllView: function () {
    return cozysdk.defineView(this.docType, 'all', 'function(doc) { emit(doc._id); }');
  },


  defineVideoStreamMoviesByDateView: function () {
    const mapFun = function (doc) {
      if (doc.action === 'Visualisation'
        && doc.fromOffer !== 'AVSP TV LIVE' && doc.fromOffer !== 'OTV'
        && !(doc.subTitle && doc.subTitle !== '')) {
        emit(doc.timestamp);
      }
    };
    return cozysdk.defineView('videostream', 'moviesByDate', mapFun.toString());
  },
});
