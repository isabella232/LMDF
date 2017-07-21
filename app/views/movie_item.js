'use-strict';

const template = require('./templates/movie_item');

module.exports = Mn.View.extend({
  template: template,
  tagName: 'li',

  ui: {
    poster: '.poster',
    img: '.poster img',
  },

  events: {
    //eslint-disable-next-line
    'click': 'showDetails',
  },

  modelEvents: {
    change: 'render',
  },

  initialize: function () {
    this.model.getPoster().then(() => console.log('toto2'));
  },

  onRender: function () {
    this.model.getPoster()
    .then((dataUri) => {
      this.ui.img.attr('src', dataUri);
    });
  },

  showDetails: function () {
    app.trigger('details:show', this.model);
  },
});
