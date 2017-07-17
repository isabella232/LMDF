'use strict';

const CozyModel = require('../lib/backbone_cozymodel');
const Wikidata = require('../lib/wikidata');
const WikidataSuggestions = require('../lib/wikidata_suggestions_film');
const Deezer = require('../lib/deezer');
const Musicbrainz = require('../lib/musicbrainz');
const ImgFetcher = require('lib/img_fetcher');


let AudioVisualWork = null;

module.exports = AudioVisualWork = CozyModel.extend({
  initialize: function () {
    this.runningTasks = {};
  },

  setViewed: function (videoStream) {
    const viewed = this.get('viewed') || [];

    if (viewed.some(view => view.timestamp === videoStream.timestamp)) {
      return;
    }

    viewed.push({
      timestamp: videoStream.timestamp,
      videoStreamId: videoStream._id,
      accountType: 'orange',
    });
    this.set('viewed', viewed);
  },

  setTaskRunning: function (task) {
    this.runningTasks[task] = true;
  },

  setTaskDone: function (task) {
    delete this.runningTasks[task];
  },

  fetchPosterUri: function () {
    return this._runFetch(Wikidata.getPoster, 'posterUri');
  },

  fetchSynopsis: function () {
    return this._runFetch(Wikidata.getSynopsis, 'synopsis');
  },


  _runFetch: function (method, field, options) {
    options = options || {};
    const taskName = options.taskName || field;
    const isFieldReady = options.isFieldReady || (obj => obj.has(field));
    if (isFieldReady(this)) {
      return Promise.resolve(this);
    }

    this.setTaskRunning(`fetch_${taskName}`);
    const attrs = $.extend({}, this.attributes);
    return method(attrs)
    .then((res) => {
      this.set(res);
      if (!this.isNew()) {
        this.save();
      }
      this.setTaskDone(`fetch_${taskName}`);
      this.trigger(`change:${field}`, res[field]);
      this.trigger('change', this);
      return this;
    }).catch((err) => {
      this.setTaskDone(`fetch_${taskName}`);
      this.trigger('change', this);
      return Promise.reject(err);
    });
  },

  fetchSoundtrack: function () {
    return this._runFetch(Musicbrainz.getSoundtrack, 'soundtrack', {
      isFieldReady: obj => obj.has('soundtrack') && obj.get('soundtrack').tracks
    });
  },

  fetchDeezerIds: function () {
    return this._runFetch(Deezer.getTracksId, 'soundtrack', {
      taskName: 'deezerIds',
      isFieldReady: obj => obj.hasDeezerIds(),
    });
  },

  getDeezerIds: function () {
    return this.attributes.soundtrack.tracks.map(track => track.deezerId);
  },

  hasDeezerIds: function () {
    return this.has('soundtrack') && this.attributes.soundtrack.tracks
      && this.attributes.soundtrack.tracks.some(track => track.deezerId);
  },

  getPoster: function () {
    return (this.has('posterUri') ? Promise.resolve() : this.fetchPosterUri())
    .then(() => {
      const uri = this.get('posterUri');
      if (!uri) { return Promise.reject(); }

      const path = decodeURIComponent(uri.replace(/.*org\//, ''));
      return ImgFetcher(uri, 'org.wikimedia.uploads', path);
    })
    .then(data => `data:image;base64,${data}`);
  },
});


// Movie.fromWDSuggestionMovie = function (wdSuggestion) {
//   return Wikidata.getMovieData(wdSuggestion.id)
//   .then(attrs => new Movie(attrs))
//   ;
// };

AudioVisualWork.fromOrangeTitle = function (title) {
  console.warn('to override ?');

// Movie.fromOrangeTitle = function (title) {
//   const prepareTitle = (title) => {
//     return title.replace(' - HD', '')
//     .replace(/^BA - /, '')
//     .replace(/ - extrait exclusif offert$/, '')
//     .replace(/ - extrait offert$/, '')
//     .replace(/ - édition spéciale$/, '')
//     ;
//   };
//
//   return fromFrenchTitle(prepareTitle(title))
//   .catch((err) => {
//     console.warn(`Can't find movie: ${title} (err, see below). Create empty movie.`);
//     console.error(err);
//
//     return new Movie({ label: prepareTitle(title) });
//   })
//   .then((movie) => {
//     movie.set('orangeTitle', title);
//     return movie;
//   });
// };
};


// function fromFrenchTitle(title) {
//   return WikidataSuggestions.fetchMoviesSuggestions(title)
//   .then((suggestions) => {
//     if (!suggestions || suggestions.length === 0) {
//       return Promise.reject(`Can't find Movie with french title: ${title}`);
//     }
//
//     // TODO: improve the choice of the suggestion !
//     return Movie.fromWDSuggestionMovie(suggestions[0]);
//   });
// }