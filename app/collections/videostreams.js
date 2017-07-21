'use strict';

const CozyCollection = require('../lib/backbone_cozycollection');

const AsyncPromise = require('../lib/async_promise');
const Model = require('../models/videostream');

module.exports = CozyCollection.extend({
  model: Model,
  comparator: (a, b) => {
    return (a.get('timestamp') > b.get('timestamp')) ? -1 : 1;
  },

  findAudioVisualWork: function (videoStream) {
    return videoStream.findAudioVisualWork()
    .then((avw) => {
      avw.setViewed(videoStream);
      return avw.save();
    }).catch((err) => {
      // Fail silenlty.
      console.error(err);
      return Promise.resolve();
    }).then(() => console.log('hello toto'));
  },

  findAudioVisualWorks: function () {
    const since = app.properties.get('lastVideoStream') || '';
    const videoStreams = this.filter(vs => vs.get('timestamp') > since);
    return AsyncPromise.series(videoStreams, this.findAudioVisualWork, this)
    .then(() => {
      app.properties.set('lastVideoStream', this.first().get('timestamp'));
      return app.properties.save();
    });
  },
});
