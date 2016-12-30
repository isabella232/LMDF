var findWikidataMovieMatches = require('../lib/wikidata_suggestions_film').findMovieMatches

var app = null;

module.exports = Mn.View.extend({
  tagName: 'div',
  template: require('views/templates/search'),

  ui: {
    search: 'input',
  },

  events: {
    'typeahead:select @ui.search': 'found',
    'keyup @ui.search': 'processKey',
  },

  initialize: function() {
    app = require('application');
    this.listenTo(app, 'search:close', this.onEnd);
  },

  onRender: function() {
    this.ui.search.typeahead({
      hint: true,
      highlight: true,
      minLength: 3,
    }, {
      name: 'movie',
      source: _.debounce(findWikidataMovieMatches, 300),
      async: true,
      display: 'label',
    });
    console.log(this.ui);

  },

  onSubmit: function(ev) {
    app.trigger('search', { q: this.ui.search.val() })
  },

  onEnd: function() {
    this.ui.search.typeahead('val', '');
  },

  found: function(ev, suggestion) {
    app.trigger('search', {
      q: this.ui.search.val(),
      selected: suggestion,
    });
  },

  processKey: function(e) {
    if (e.which === 13) {
      this.onSubmit();
    }
  },
});
